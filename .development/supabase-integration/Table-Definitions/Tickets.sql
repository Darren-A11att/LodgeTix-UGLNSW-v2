create table public."Tickets" (
  ticketid uuid not null default gen_random_uuid (),
  attendeeid uuid not null,
  eventid uuid not null,
  ticketdefinitionid uuid null,
  pricepaid numeric(10, 2) not null,
  seatinfo character varying(100) null,
  status character varying(50) not null default 'Active'::character varying,
  checkedinat timestamp with time zone null,
  createdat timestamp with time zone not null default timezone ('utc'::text, now()),
  updatedat timestamp with time zone not null default timezone ('utc'::text, now()),
  "reservationId" uuid null,
  "reservationExpiresAt" timestamp with time zone null,
  "originalPrice" numeric(10, 2) null,
  currency character varying(3) null default 'AUD'::character varying,
  "paymentStatus" character varying(50) null default 'Unpaid'::character varying,
  "purchasedAt" timestamp with time zone null,
  "eventTicketId" uuid null,
  "packageId" uuid null,
  constraint tickets_pkey primary key (ticketid),
  constraint tickets_attendeeid_eventid_key unique (attendeeid, eventid),
  constraint tickets_event_ticket_id_fkey foreign KEY ("eventTicketId") references "EventTickets" ("eventTicketId") on delete set null,
  constraint tickets_eventid_fkey foreign KEY (eventid) references "Events" (id) on delete CASCADE,
  constraint tickets_package_id_fkey foreign KEY ("packageId") references "EventPackages" (id) on delete set null,
  constraint tickets_ticketdefinitionid_fkey foreign KEY (ticketdefinitionid) references ticket_definitions (id) on delete set null,
  constraint tickets_attendeeid_fkey foreign KEY (attendeeid) references "Attendees" (attendeeid) on delete CASCADE,
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

create index IF not exists idx_tickets_reservation on public."Tickets" using btree ("reservationId", "reservationExpiresAt") TABLESPACE pg_default
where
  ("reservationId" is not null);

create index IF not exists idx_tickets_status_event on public."Tickets" using btree (status, eventid) TABLESPACE pg_default;

create index IF not exists idx_tickets_event_ticket_id on public."Tickets" using btree ("eventTicketId") TABLESPACE pg_default;

create index IF not exists idx_tickets_package_id on public."Tickets" using btree ("packageId") TABLESPACE pg_default;

create index IF not exists idx_tickets_attendee_id on public."Tickets" using btree (attendeeid) TABLESPACE pg_default;

create index IF not exists idx_tickets_event_id on public."Tickets" using btree (eventid) TABLESPACE pg_default;

create trigger notify_ticket_status_change_trigger
after INSERT
or DELETE
or
update on "Tickets" for EACH row
execute FUNCTION notify_ticket_status_change ();

create trigger ticket_availability_change_trigger
after INSERT
or DELETE
or
update on "Tickets" for EACH row
execute FUNCTION notify_ticket_availability_change ();

create trigger tickets_notify_changes BEFORE
update on "Tickets" for EACH row
execute FUNCTION notify_ticket_changes ();