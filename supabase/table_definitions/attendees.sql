create table public.attendees (
  attendee_id uuid not null default gen_random_uuid (),
  registration_id uuid not null,
  attendee_type public.attendee_type not null,
  dietary_requirements text null,
  special_needs text null,
  contact_preference public.attendee_contact_preference not null,
  related_attendee_id uuid null,
  relationship character varying(50) null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  title text null,
  first_name text null,
  last_name text null,
  suffix text null,
  email text null,
  phone text null,
  is_primary boolean null default false,
  is_partner text null,
  has_partner boolean null default false,
  contact_id uuid null,
  constraint attendees_pkey primary key (attendee_id),
  constraint attendees_contact_id_fkey foreign KEY (contact_id) references contacts (contact_id) on delete set null,
  constraint attendees_registration_id_fkey foreign KEY (registration_id) references registrations (registration_id),
  constraint attendees_related_attendee_id_fkey foreign KEY (related_attendee_id) references attendees (attendee_id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_attendees_contact_id on public.attendees using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_attendees_related_attendee_id on public.attendees using btree (related_attendee_id) TABLESPACE pg_default;

create index IF not exists idx_attendees_registration_id on public.attendees using btree (registration_id) TABLESPACE pg_default;