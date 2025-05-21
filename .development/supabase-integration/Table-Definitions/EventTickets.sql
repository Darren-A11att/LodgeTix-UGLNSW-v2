create table public."EventTickets" (
  "eventTicketId" uuid not null default gen_random_uuid (),
  "eventId" text not null,
  "ticketDefinitionId" uuid null,
  "totalCapacity" integer not null,
  "availableCount" integer not null,
  "reservedCount" integer not null default 0,
  "soldCount" integer not null default 0,
  price numeric(10, 2) not null,
  status character varying(50) not null default 'Active'::character varying,
  "createdAt" timestamp with time zone not null default timezone ('utc'::text, now()),
  "updatedAt" timestamp with time zone not null default timezone ('utc'::text, now()),
  "eventUuid" uuid null,
  constraint EventTickets_pkey primary key ("eventTicketId")
) TABLESPACE pg_default;

create index IF not exists idx_event_tickets_event_id on public."EventTickets" using btree ("eventId") TABLESPACE pg_default;

create index IF not exists idx_event_tickets_ticket_definition_id on public."EventTickets" using btree ("ticketDefinitionId") TABLESPACE pg_default;

create index IF not exists idx_event_tickets_event_uuid on public."EventTickets" using btree ("eventUuid") TABLESPACE pg_default;

create trigger set_event_tickets_updated_at BEFORE
update on "EventTickets" for EACH row
execute FUNCTION set_updated_at_timestamp ();