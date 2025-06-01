create table public.lodges (
  lodge_id uuid not null default gen_random_uuid (),
  name text not null,
  number numeric null,
  display_name text null,
  district text null,
  meeting_place text null,
  area_type text null,
  created_at timestamp with time zone not null default now(),
  grand_lodge_id uuid null,
  state_region text null,
  organisation_id uuid null,
  constraint lodges_pkey primary key (lodge_id),
  constraint lodges_grand_lodge_id_fkey foreign KEY (grand_lodge_id) references grand_lodges (grand_lodge_id) on delete RESTRICT,
  constraint lodges_organisationid_fkey foreign KEY (organisation_id) references organisations (organisation_id)
) TABLESPACE pg_default;

create index IF not exists idx_lodges_grand_lodge_id on public.lodges using btree (grand_lodge_id) TABLESPACE pg_default;

create index IF not exists idx_lodges_organisationid on public.lodges using btree (organisation_id) TABLESPACE pg_default;