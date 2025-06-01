create table public.attendee_events (
  id uuid not null default gen_random_uuid (),
  attendee_id uuid not null,
  event_id uuid not null,
  status character varying(50) not null default 'confirmed'::character varying,
  created_at timestamp with time zone not null default now(),
  constraint attendee_events_pkey primary key (id),
  constraint attendee_events_attendee_id_fkey foreign KEY (attendee_id) references attendees (attendee_id) on delete CASCADE,
  constraint attendee_events_event_id_fkey foreign KEY (event_id) references events (event_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_attendee_events_attendee_id on public.attendee_events using btree (attendee_id) TABLESPACE pg_default;

create index IF not exists idx_attendee_events_event_id on public.attendee_events using btree (event_id) TABLESPACE pg_default;