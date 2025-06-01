create table public.masonic_profiles (
  masonic_profile_id uuid not null default gen_random_uuid (),
  masonic_title character varying(50) null,
  rank character varying(50) null,
  grand_rank character varying(50) null,
  grand_officer character varying(50) null,
  grand_office character varying(100) null,
  lodge_id uuid null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  grand_lodge_id uuid null,
  contact_id uuid null,
  constraint masonicprofiles_pkey primary key (masonic_profile_id),
  constraint masonic_profiles_contact_id_unique unique (contact_id),
  constraint masonic_profiles_contact_id_fkey foreign KEY (contact_id) references contacts (contact_id) on delete set null,
  constraint masonic_profiles_grand_lodge_id_fkey foreign KEY (grand_lodge_id) references organisations (organisation_id),
  constraint masonic_profiles_lodge_id_fkey foreign KEY (lodge_id) references organisations (organisation_id) on delete set null,
  constraint check_masonic_affiliation check (
    (
      (lodge_id is not null)
      or (grand_lodge_id is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_masonic_profiles_lodge_id on public.masonic_profiles using btree (lodge_id) TABLESPACE pg_default;

create index IF not exists idx_masonicprofiles_grandlodgeid on public.masonic_profiles using btree (grand_lodge_id) TABLESPACE pg_default;