create table public."EventPackageTickets" (
  id uuid not null default gen_random_uuid (),
  "packageId" uuid not null,
  "eventTicketId" uuid not null,
  quantity integer not null default 1,
  "createdAt" timestamp with time zone not null default timezone ('utc'::text, now()),
  "updatedAt" timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint event_package_tickets_pkey primary key (id),
  constraint event_package_tickets_event_ticket_id_fkey foreign KEY ("eventTicketId") references "EventTickets" ("eventTicketId") on delete CASCADE,
  constraint event_package_tickets_package_id_fkey foreign KEY ("packageId") references "EventPackages" (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_event_package_tickets_package_id on public."EventPackageTickets" using btree ("packageId") TABLESPACE pg_default;

create index IF not exists idx_event_package_tickets_event_ticket_id on public."EventPackageTickets" using btree ("eventTicketId") TABLESPACE pg_default;