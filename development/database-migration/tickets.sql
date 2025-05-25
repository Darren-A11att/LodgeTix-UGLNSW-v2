create table public.tickets (
  id uuid not null,
  registration_id uuid null,
  ticket_type_id uuid null,
  event_id uuid null,
  attendee_id uuid null,
  ticket_price numeric null,
  ticket_status character varying(50) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_partner_ticket boolean null default false,
  constraint tickets_pkey1 primary key (id),
  constraint tickets_registration_id_fkey foreign KEY (registration_id) references registrations (registration_id)
) TABLESPACE pg_default;

create index IF not exists idx_tickets_registration on public.tickets using btree (registration_id) TABLESPACE pg_default;