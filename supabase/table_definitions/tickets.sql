create table public.tickets (
  ticket_id uuid not null default gen_random_uuid (),
  attendee_id uuid null,
  event_id uuid not null,
  price_paid numeric(10, 2) not null,
  seat_info character varying(100) null,
  status character varying(50) not null default 'Active'::character varying,
  checked_in_at timestamp with time zone null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  reservation_id uuid null,
  reservation_expires_at timestamp with time zone null,
  original_price numeric(10, 2) null,
  currency character varying(3) null default 'AUD'::character varying,
  payment_status character varying(50) null default 'Unpaid'::character varying,
  purchased_at timestamp with time zone null,
  package_id uuid null,
  id uuid null,
  registration_id uuid null,
  ticket_type_id uuid null,
  ticket_price numeric null,
  ticket_status character varying(50) null,
  is_partner_ticket boolean null default false,
  constraint tickets_pkey primary key (ticket_id),
  constraint tickets_attendeeid_eventid_key unique (attendee_id, event_id),
  constraint tickets_eventid_fkey foreign KEY (event_id) references events (event_id) on delete CASCADE,
  constraint tickets_package_id_fkey foreign KEY (package_id) references packages (package_id) on delete set null,
  constraint tickets_registration_id_fkey foreign KEY (registration_id) references registrations (registration_id) on delete CASCADE,
  constraint tickets_ticket_type_id_fkey foreign KEY (ticket_type_id) references event_tickets (id) on delete RESTRICT,
  constraint tickets_attendeeid_fkey foreign KEY (attendee_id) references attendees (attendee_id) on delete CASCADE,
  constraint check_valid_ticket_status check (
    (
      (status)::text = any (
        (
          array[
            'available'::character varying,
            'reserved'::character varying,
            'sold'::character varying,
            'used'::character varying,
            'cancelled'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_tickets_reservation on public.tickets using btree (reservation_id, reservation_expires_at) TABLESPACE pg_default
where
  (reservation_id is not null);

create index IF not exists idx_tickets_status_event on public.tickets using btree (status, event_id) TABLESPACE pg_default;

create index IF not exists idx_tickets_package_id on public.tickets using btree (package_id) TABLESPACE pg_default;

create index IF not exists idx_tickets_ticket_type_id on public.tickets using btree (ticket_type_id) TABLESPACE pg_default;

create index IF not exists idx_tickets_attendee_id on public.tickets using btree (attendee_id) TABLESPACE pg_default;

create index IF not exists idx_tickets_event_id on public.tickets using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_tickets_registration_id on public.tickets using btree (registration_id) TABLESPACE pg_default;

create index IF not exists idx_tickets_status on public.tickets using btree (status) TABLESPACE pg_default;

create trigger update_event_tickets_counts_trigger
after INSERT
or DELETE
or
update on tickets for EACH row
execute FUNCTION update_event_ticket_counts ();

create trigger update_events_counts_trigger
after INSERT
or DELETE
or
update on tickets for EACH row
execute FUNCTION update_event_counts ();