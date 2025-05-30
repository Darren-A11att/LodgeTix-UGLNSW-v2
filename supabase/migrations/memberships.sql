create table public.memberships (
  membership_id uuid not null default gen_random_uuid (),
  contact_id uuid not null,
  profile_id uuid null,
  role character varying(50) null default 'member'::character varying,
  permissions text[] null default array['read'::text, 'update_own_data'::text],
  membership_type character varying(50) not null,
  membership_entity_id uuid not null,
  is_active boolean null default true,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint memberships_pkey primary key (membership_id),
  constraint unique_membership unique (contact_id, membership_type, membership_entity_id),
  constraint memberships_contact_id_fkey foreign KEY (contact_id) references contacts (contact_id) on delete CASCADE,
  constraint memberships_profile_id_fkey foreign KEY (profile_id) references masonic_profiles (masonic_profile_id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_memberships_contact_id on public.memberships using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_memberships_profile_id on public.memberships using btree (profile_id) TABLESPACE pg_default;

create index IF not exists idx_memberships_type_entity on public.memberships using btree (membership_type, membership_entity_id) TABLESPACE pg_default;

create index IF not exists idx_memberships_is_active on public.memberships using btree (is_active) TABLESPACE pg_default;

create trigger update_memberships_updated_at BEFORE
update on memberships for EACH row
execute FUNCTION update_updated_at_column ();