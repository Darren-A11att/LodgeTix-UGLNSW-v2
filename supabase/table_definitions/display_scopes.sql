create table public.display_scopes (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone not null default now(),
  constraint display_scopes_pkey primary key (id),
  constraint display_scopes_name_key unique (name)
) TABLESPACE pg_default;