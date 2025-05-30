create table public.packages (
  package_id uuid not null default gen_random_uuid (),
  parent_event_id uuid null,
  event_id uuid null,
  name text not null,
  description text null,
  original_price numeric(10, 2) null,
  discount numeric(10, 2) null default 0,
  package_price numeric(10, 2) not null,
  is_active boolean null default true,
  includes_description text[] null,
  qty integer null default 1,
  included_items package_item[] null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  eligibility_criteria jsonb null default '{"rules": []}'::jsonb,
  constraint packages_pkey1 primary key (package_id),
  constraint packages_event_id_fkey foreign KEY (event_id) references events (event_id) on delete CASCADE,
  constraint packages_parent_event_id_fkey1 foreign KEY (parent_event_id) references events (event_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_packages_event_id on public.packages using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_packages_parent_event_id on public.packages using btree (parent_event_id) TABLESPACE pg_default;

create index IF not exists idx_packages_is_active on public.packages using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_packages_eligibility_criteria on public.packages using gin (eligibility_criteria) TABLESPACE pg_default;