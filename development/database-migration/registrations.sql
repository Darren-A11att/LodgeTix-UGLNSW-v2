create table public.registrations (
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
  constraint registrations_pkey primary key (registration_id)
) TABLESPACE pg_default;