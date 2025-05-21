create table public."Customers" (
  id uuid not null,
  "userId" uuid null,
  "contactId" uuid null,
  "organisationId" uuid null,
  "firstName" text null,
  "lastName" text null,
  "businessName" text null,
  email text null,
  phone text null,
  "billingFirstName" character varying null,
  "billingLastName" character varying null,
  "billingOrganisationName" character varying null,
  "billingEmail" character varying null,
  "billingPhone" character varying null,
  "billingStreetAddress" character varying null,
  "billingCity" character varying null,
  "billingState" character varying null,
  "billingPostalCode" character varying null,
  "billingCountry" character varying null,
  "addressLine1" text null,
  "addressLine2" text null,
  city text null,
  state text null,
  "postalCode" text null,
  country text null,
  "stripeCustomerId" character varying null,
  "createdAt" timestamp with time zone null default now(),
  "updatedAt" timestamp with time zone null default now(),
  person_id uuid null,
  constraint customers_consolidated_pkey primary key (id),
  constraint customers_person_id_fkey foreign KEY (person_id) references people (person_id)
) TABLESPACE pg_default;

create index IF not exists idx_customers_email on public."Customers" using btree (email) TABLESPACE pg_default;

create index IF not exists idx_customers_phone on public."Customers" using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_customers_created_at on public."Customers" using btree ("createdAt") TABLESPACE pg_default;

create index IF not exists idx_customers_stripe_id on public."Customers" using btree ("stripeCustomerId") TABLESPACE pg_default;