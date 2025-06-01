create table public.organisations (
  organisation_id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  type public.organisation_type not null,
  street_address character varying(255) null,
  city character varying(100) null,
  state character varying(100) null,
  postal_code character varying(20) null,
  country character varying(100) null,
  website character varying(255) null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  known_as text null,
  abbreviation text null,
  stripe_onbehalfof text null,
  constraint organisations_pkey primary key (organisation_id),
  constraint organisations_organisationid_key unique (organisation_id)
) TABLESPACE pg_default;