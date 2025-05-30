create table public.event_tickets (
  id uuid not null default gen_random_uuid (),
  event_id uuid not null,
  name text not null,
  description text null,
  price numeric not null,
  total_capacity integer null,
  available_count integer null,
  reserved_count integer null default 0,
  sold_count integer null default 0,
  status character varying null default 'Active'::character varying,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  eligibility_criteria jsonb null default '{"rules": []}'::jsonb,
  constraint event_tickets_pkey primary key (id),
  constraint event_tickets_event_id_fkey foreign KEY (event_id) references events (event_id)
) TABLESPACE pg_default;

create index IF not exists idx_event_tickets_event_id on public.event_tickets using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_event_tickets_eligibility_criteria on public.event_tickets using gin (eligibility_criteria) TABLESPACE pg_default;