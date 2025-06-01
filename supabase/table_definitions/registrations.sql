create table public.registrations (
  registration_id uuid not null,
  contact_id uuid null,
  event_id uuid null,
  registration_date timestamp with time zone null,
  status character varying(50) null,
  total_amount_paid numeric null,
  total_price_paid numeric null,
  payment_status public.payment_status null default 'pending'::payment_status,
  agree_to_terms boolean null default false,
  stripe_payment_intent_id text null,
  primary_attendee_id uuid null,
  registration_type public.registration_type null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  registration_data jsonb null,
  confirmation_number text null,
  organisation_id uuid null,
  constraint registrations_pkey primary key (registration_id),
  constraint registrations_customer_id_fkey foreign KEY (contact_id) references contacts (contact_id) on delete set null,
  constraint registrations_organisation_id_fkey foreign KEY (organisation_id) references organisations (organisation_id) on update CASCADE on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_registrations_created_at on public.registrations using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_registrations_payment_status on public.registrations using btree (payment_status) TABLESPACE pg_default;

create index IF not exists idx_registrations_customer_id on public.registrations using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_registrations_event_id on public.registrations using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_registrations_confirmation_number on public.registrations using btree (confirmation_number) TABLESPACE pg_default;

create index IF not exists idx_registrations_organisation_id on public.registrations using btree (organisation_id) TABLESPACE pg_default;