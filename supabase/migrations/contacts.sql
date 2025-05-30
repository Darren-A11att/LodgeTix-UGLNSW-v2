create table public.contacts (
  contact_id uuid not null default gen_random_uuid (),
  title text null,
  first_name text not null,
  last_name text not null,
  suffix_1 text null,
  suffix_2 text null,
  suffix_3 text null,
  contact_preference text null,
  mobile_number text null,
  email text not null,
  address_line_1 text null,
  address_line_2 text null,
  suburb_city text null,
  state text null,
  country text null,
  postcode text null,
  dietary_requirements text null,
  special_needs text null,
  type public.contact_type not null,
  has_partner boolean null default false,
  is_partner boolean null default false,
  organisation_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  auth_user_id uuid null,
  billing_organisation_name character varying(255) null,
  billing_email character varying(255) null,
  billing_phone character varying(255) null,
  billing_street_address character varying(255) null,
  billing_city character varying(255) null,
  billing_state character varying(255) null,
  billing_postal_code character varying(255) null,
  billing_country character varying(255) null,
  stripe_customer_id character varying(255) null,
  business_name text null,
  source_type text null,
  source_id uuid null,
  constraint contacts_pkey primary key (contact_id),
  constraint contacts_organisation_id_fkey foreign KEY (organisation_id) references organisations (organisation_id)
) TABLESPACE pg_default;

create index IF not exists idx_contacts_source on public.contacts using btree (source_type, source_id) TABLESPACE pg_default;

create index IF not exists idx_contacts_organisation_id on public.contacts using btree (organisation_id) TABLESPACE pg_default;

create index IF not exists idx_contacts_auth_user_id on public.contacts using btree (auth_user_id) TABLESPACE pg_default;

create index IF not exists idx_contacts_email on public.contacts using btree (email) TABLESPACE pg_default;

create trigger update_contacts_updated_at BEFORE
update on contacts for EACH row
execute FUNCTION update_updated_at_column ();