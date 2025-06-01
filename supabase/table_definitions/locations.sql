create table public.locations (
  location_id uuid not null default gen_random_uuid (),
  room_or_area character varying(255) null,
  place_name character varying(255) not null,
  street_address character varying(255) null,
  suburb character varying(100) null,
  state character varying(100) null,
  postal_code character varying(20) null,
  country character varying(100) null,
  latitude numeric(9, 6) null,
  longitude numeric(9, 6) null,
  capacity integer null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint locations_pkey primary key (location_id)
) TABLESPACE pg_default;