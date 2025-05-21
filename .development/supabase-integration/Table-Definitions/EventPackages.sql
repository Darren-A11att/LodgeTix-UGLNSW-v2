create table public."EventPackages" (
  name text not null,
  description text null,
  includes_description text[] null,
  created_at timestamp with time zone not null default now(),
  id uuid not null default gen_random_uuid (),
  parent_event_id uuid null,
  constraint packages_pkey primary key (id),
  constraint packages_id_uuid_unique unique (id),
  constraint packages_parent_event_id_fkey foreign KEY (parent_event_id) references "Events" (id) on delete RESTRICT
) TABLESPACE pg_default;