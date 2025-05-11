create table public."Registrations" (
  "registrationId" uuid not null,
  "customerId" uuid null,
  "eventId" uuid null,
  "registrationDate" timestamp with time zone null,
  status character varying(50) null,
  "totalAmountPaid" numeric null,
  "totalPricePaid" numeric null,
  "paymentStatus" public.payment_status null default 'pending'::payment_status,
  "agreeToTerms" boolean null default false,
  "stripePaymentIntentId" text null,
  "primaryAttendeeId" uuid null,
  "registrationType" public.registration_type null,
  "createdAt" timestamp with time zone null default now(),
  "updatedAt" timestamp with time zone null default now(),
  constraint registrations_consolidated_pkey primary key ("registrationId"),
  constraint registrations_consolidated_eventId_fkey foreign KEY ("eventId") references "Events" (id),
  constraint registrations_customer_id_fkey foreign KEY ("customerId") references "Customers" (id)
) TABLESPACE pg_default;

create index IF not exists idx_registrations_customer on public."Registrations" using btree ("customerId") TABLESPACE pg_default;

create index IF not exists idx_registrations_event on public."Registrations" using btree ("eventId") TABLESPACE pg_default;

create index IF not exists idx_registrations_created_at on public."Registrations" using btree ("createdAt") TABLESPACE pg_default;

create index IF not exists idx_registrations_payment_status on public."Registrations" using btree ("paymentStatus") TABLESPACE pg_default;