create table public.customers (
  customer_id uuid not null,
  organisation_id uuid null,
  first_name text null,
  last_name text null,
  business_name text null,
  email text null,
  phone text null,
  billing_organisation_name character varying null,
  billing_email character varying null,
  billing_phone character varying null,
  billing_street_address character varying null,
  billing_city character varying null,
  billing_state character varying null,
  billing_postal_code character varying null,
  billing_country character varying null,
  address_line1 text null,
  address_line2 text null,
  city text null,
  state text null,
  postal_code text null,
  country text null,
  stripe_customer_id character varying null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  contact_id uuid null,
  customer_type public.customer_type null,
  constraint customers_consolidated_pkey primary key (customer_id),
  constraint customers_contact_id_fkey foreign KEY (contact_id) references contacts (contact_id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_customers_contact_id on public.customers using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_customers_customer_type on public.customers using btree (customer_type) TABLESPACE pg_default;

create index IF not exists idx_customers_email on public.customers using btree (email) TABLESPACE pg_default;

create index IF not exists idx_customers_phone on public.customers using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_customers_created_at on public.customers using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_customers_stripe_id on public.customers using btree (stripe_customer_id) TABLESPACE pg_default;