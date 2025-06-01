create table public.eligibility_criteria (
  id uuid not null default gen_random_uuid (),
  criteria text not null,
  created_at timestamp with time zone not null default now(),
  type text null,
  constraint registration_availabilities_pkey primary key (id),
  constraint registration_availabilities_name_key unique (criteria)
) TABLESPACE pg_default;