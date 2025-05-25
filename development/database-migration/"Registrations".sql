create table public."Registrations" (
  registration_id uuid not null,
  customer_id uuid null,
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
  registration_data jsonb[] null,
  constraint registrations_consolidated_pkey primary key (registration_id),
  constraint registrations_consolidated_eventid_fkey foreign KEY (event_id) references events (id),
  constraint registrations_customer_id_fkey foreign KEY (customer_id) references customers (id)
) TABLESPACE pg_default;

create index IF not exists idx_registrations_customer on public."Registrations" using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_registrations_event on public."Registrations" using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_registrations_created_at on public."Registrations" using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_registrations_payment_status on public."Registrations" using btree (payment_status) TABLESPACE pg_default;