create table public."Attendees" (
  attendeeid uuid not null default gen_random_uuid (),
  registrationid uuid not null,
  attendeetype public.attendee_type not null,
  eventtitle character varying(100) null,
  dietaryrequirements text null,
  specialneeds text null,
  contactpreference public.attendee_contact_preference not null,
  relatedattendeeid uuid null,
  relationship character varying(50) null,
  createdat timestamp with time zone not null default timezone ('utc'::text, now()),
  updatedat timestamp with time zone not null default timezone ('utc'::text, now()),
  person_id uuid null,
  constraint attendees_pkey primary key (attendeeid),
  constraint attendees_person_id_fkey foreign KEY (person_id) references people (person_id),
  constraint attendees_registrationid_fkey foreign KEY (registrationid) references "Registrations" ("registrationId"),
  constraint attendees_relatedattendeeid_fkey foreign KEY (relatedattendeeid) references "Attendees" (attendeeid) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_attendees_registration_id on public."Attendees" using btree (registrationid) TABLESPACE pg_default;