create table public.grand_lodges (
  name text not null,
  country text null,
  abbreviation text null,
  created_at timestamp with time zone not null default now(),
  grand_lodge_id uuid not null default gen_random_uuid (),
  country_code_iso3 text null,
  state_region text null,
  state_region_code text null,
  organisation_id uuid null,
  constraint grand_lodges_pkey primary key (grand_lodge_id),
  constraint grand_lodges_id_uuid_unique unique (grand_lodge_id),
  constraint grand_lodges_organisationid_fkey foreign KEY (organisation_id) references organisations (organisation_id)
) TABLESPACE pg_default;

create index IF not exists idx_grand_lodges_organisationid on public.grand_lodges using btree (organisation_id) TABLESPACE pg_default;