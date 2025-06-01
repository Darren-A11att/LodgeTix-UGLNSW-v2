create table public.events (
  title text not null,
  description text null,
  type text null,
  is_purchasable_individually boolean null default true,
  max_attendees bigint null,
  featured boolean null default false,
  image_url text null,
  event_includes text[] null,
  important_information text[] null,
  created_at timestamp with time zone not null default now(),
  is_multi_day boolean null default false,
  event_id uuid not null default gen_random_uuid (),
  parent_event_id uuid null,
  registration_availability_id uuid null,
  display_scope_id uuid null,
  slug text not null,
  event_start timestamp with time zone null,
  event_end timestamp with time zone null,
  location_id uuid null,
  subtitle text null,
  is_published boolean null default true,
  regalia text null,
  regalia_description text null,
  dress_code text null,
  degree_type text null,
  sections jsonb null,
  attendance jsonb null,
  documents jsonb null,
  related_events uuid[] null,
  organiser_id uuid null,
  reserved_count integer not null default 0,
  sold_count integer not null default 0,
  constraint events_pkey primary key (event_id),
  constraint events_slug_key unique (slug),
  constraint events_id_uuid_unique unique (event_id),
  constraint events_parent_event_id_fkey foreign KEY (parent_event_id) references events (event_id) on delete RESTRICT,
  constraint events_organiser_id_fkey foreign KEY (organiser_id) references organisations (organisation_id) on delete set null,
  constraint events_display_scope_id_fkey foreign KEY (display_scope_id) references display_scopes (id),
  constraint events_locationid_fkey foreign KEY (location_id) references locations (location_id) on delete set null,
  constraint events_registration_availability_id_fkey foreign KEY (registration_availability_id) references eligibility_criteria (id),
  constraint check_sold_count_non_negative check ((sold_count >= 0)),
  constraint check_reserved_count_non_negative check ((reserved_count >= 0))
) TABLESPACE pg_default;

create index IF not exists idx_events_capacity on public.events using btree (reserved_count, sold_count) TABLESPACE pg_default
where
  (
    (reserved_count > 0)
    or (sold_count > 0)
  );

create index IF not exists idx_events_display_scope_id on public.events using btree (display_scope_id) TABLESPACE pg_default;

create index IF not exists idx_events_location_id on public.events using btree (location_id) TABLESPACE pg_default;

create index IF not exists idx_events_parent_event_id on public.events using btree (parent_event_id) TABLESPACE pg_default;

create index IF not exists idx_events_registration_availability_id on public.events using btree (registration_availability_id) TABLESPACE pg_default;

create trigger inherit_organiser_on_insert BEFORE INSERT on events for EACH row
execute FUNCTION inherit_parent_organiser_id ();

create trigger inherit_organiser_on_update BEFORE
update on events for EACH row when (
  new.parent_event_id is distinct from old.parent_event_id
  or new.organiser_id is null
  and old.organiser_id is not null
)
execute FUNCTION inherit_parent_organiser_id ();