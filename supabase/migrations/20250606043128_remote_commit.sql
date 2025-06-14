create schema if not exists "backup";

create table "backup"."attendees" (
    "attendee_id" uuid not null,
    "registration_id" uuid,
    "attendee_type" attendee_type,
    "dietary_requirements" text,
    "special_needs" text,
    "contact_preference" attendee_contact_preference,
    "related_attendee_id" uuid,
    "relationship" character varying(50),
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "title" text,
    "first_name" text,
    "last_name" text,
    "suffix" text,
    "email" text,
    "phone" text,
    "is_primary" boolean,
    "is_partner" text,
    "has_partner" boolean,
    "contact_id" uuid
);


create table "backup"."contacts" (
    "contact_id" uuid not null,
    "title" text,
    "first_name" text,
    "last_name" text,
    "suffix_1" text,
    "suffix_2" text,
    "suffix_3" text,
    "contact_preference" text,
    "mobile_number" text,
    "email" text,
    "address_line_1" text,
    "address_line_2" text,
    "suburb_city" text,
    "state" text,
    "country" text,
    "postcode" text,
    "dietary_requirements" text,
    "special_needs" text,
    "type" contact_type,
    "has_partner" boolean,
    "is_partner" boolean,
    "organisation_id" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "auth_user_id" uuid,
    "billing_organisation_name" character varying(255),
    "billing_email" character varying(255),
    "billing_phone" character varying(255),
    "billing_street_address" character varying(255),
    "billing_city" character varying(255),
    "billing_state" character varying(255),
    "billing_postal_code" character varying(255),
    "billing_country" character varying(255),
    "stripe_customer_id" character varying(255),
    "business_name" text,
    "source_type" text,
    "source_id" uuid
);


create table "backup"."customers" (
    "customer_id" uuid not null,
    "organisation_id" uuid,
    "first_name" text,
    "last_name" text,
    "business_name" text,
    "email" text,
    "phone" text,
    "billing_organisation_name" character varying,
    "billing_email" character varying,
    "billing_phone" character varying,
    "billing_street_address" character varying,
    "billing_city" character varying,
    "billing_state" character varying,
    "billing_postal_code" character varying,
    "billing_country" character varying,
    "address_line1" text,
    "address_line2" text,
    "city" text,
    "state" text,
    "postal_code" text,
    "country" text,
    "stripe_customer_id" character varying,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "contact_id" uuid,
    "customer_type" customer_type
);


create table "backup"."events" (
    "title" text,
    "description" text,
    "type" text,
    "is_purchasable_individually" boolean,
    "max_attendees" bigint,
    "featured" boolean,
    "image_url" text,
    "event_includes" text[],
    "important_information" text[],
    "created_at" timestamp with time zone,
    "is_multi_day" boolean,
    "event_id" uuid not null,
    "parent_event_id" uuid,
    "registration_availability_id" uuid,
    "display_scope_id" uuid,
    "slug" text,
    "event_start" timestamp with time zone,
    "event_end" timestamp with time zone,
    "location_id" uuid,
    "subtitle" text,
    "is_published" boolean,
    "regalia" text,
    "regalia_description" text,
    "dress_code" text,
    "degree_type" text,
    "sections" jsonb,
    "attendance" jsonb,
    "documents" jsonb,
    "related_events" uuid[],
    "organiser" uuid,
    "reserved_count" integer,
    "sold_count" integer
);


create table "backup"."registrations" (
    "registration_id" uuid not null,
    "contact_id" uuid,
    "event_id" uuid,
    "registration_date" timestamp with time zone,
    "status" character varying(50),
    "total_amount_paid" numeric,
    "total_price_paid" numeric,
    "payment_status" payment_status,
    "agree_to_terms" boolean,
    "stripe_payment_intent_id" text,
    "primary_attendee_id" uuid,
    "registration_type" registration_type,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "registration_data" jsonb,
    "confirmation_number" text,
    "organisation_id" uuid
);


create table "backup"."tickets" (
    "ticket_id" uuid not null,
    "attendee_id" uuid,
    "event_id" uuid,
    "price_paid" numeric(10,2),
    "seat_info" character varying(100),
    "status" character varying(50),
    "checked_in_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "reservation_id" uuid,
    "reservation_expires_at" timestamp with time zone,
    "original_price" numeric(10,2),
    "currency" character varying(3),
    "payment_status" character varying(50),
    "purchased_at" timestamp with time zone,
    "package_id" uuid,
    "id" uuid,
    "registration_id" uuid,
    "ticket_type_id" uuid,
    "ticket_price" numeric,
    "ticket_status" character varying(50),
    "is_partner_ticket" boolean
);


CREATE UNIQUE INDEX attendees_pkey ON backup.attendees USING btree (attendee_id);

CREATE UNIQUE INDEX contacts_pkey ON backup.contacts USING btree (contact_id);

CREATE UNIQUE INDEX customers_pkey ON backup.customers USING btree (customer_id);

CREATE UNIQUE INDEX events_pkey ON backup.events USING btree (event_id);

CREATE UNIQUE INDEX registrations_pkey ON backup.registrations USING btree (registration_id);

CREATE UNIQUE INDEX tickets_pkey ON backup.tickets USING btree (ticket_id);

alter table "backup"."attendees" add constraint "attendees_pkey" PRIMARY KEY using index "attendees_pkey";

alter table "backup"."contacts" add constraint "contacts_pkey" PRIMARY KEY using index "contacts_pkey";

alter table "backup"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "backup"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "backup"."registrations" add constraint "registrations_pkey" PRIMARY KEY using index "registrations_pkey";

alter table "backup"."tickets" add constraint "tickets_pkey" PRIMARY KEY using index "tickets_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION backup.backup_critical_tables()
 RETURNS TABLE(table_name text, rows_backed_up bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Truncate backup tables first
    TRUNCATE backup.contacts CASCADE;
    TRUNCATE backup.customers CASCADE;
    TRUNCATE backup.registrations CASCADE;
    TRUNCATE backup.attendees CASCADE;
    TRUNCATE backup.tickets CASCADE;
    TRUNCATE backup.events CASCADE;
    
    -- Backup contacts
    INSERT INTO backup.contacts SELECT * FROM public.contacts;
    RETURN QUERY SELECT 'contacts'::text, COUNT(*) FROM backup.contacts;
    
    -- Backup customers
    INSERT INTO backup.customers SELECT * FROM public.customers;
    RETURN QUERY SELECT 'customers'::text, COUNT(*) FROM backup.customers;
    
    -- Backup registrations
    INSERT INTO backup.registrations SELECT * FROM public.registrations;
    RETURN QUERY SELECT 'registrations'::text, COUNT(*) FROM backup.registrations;
    
    -- Backup attendees
    INSERT INTO backup.attendees SELECT * FROM public.attendees;
    RETURN QUERY SELECT 'attendees'::text, COUNT(*) FROM backup.attendees;
    
    -- Backup tickets
    INSERT INTO backup.tickets SELECT * FROM public.tickets;
    RETURN QUERY SELECT 'tickets'::text, COUNT(*) FROM backup.tickets;
    
    -- Backup events
    INSERT INTO backup.events SELECT * FROM public.events;
    RETURN QUERY SELECT 'events'::text, COUNT(*) FROM backup.events;
    
    RETURN;
END;
$function$
;


create schema if not exists "backups";


create schema if not exists "column_name_backup";


create schema if not exists "events";


create extension if not exists "wrappers" with schema "extensions";


create schema if not exists "log";

create sequence "log"."column_standardization_log_id_seq";

create sequence "log"."customers_consolidation_log_id_seq";

create sequence "log"."registrations_consolidation_log_id_seq";

create sequence "log"."schema_cleanup_log_id_seq";

create sequence "log"."schema_consolidation_log_id_seq";

create sequence "log"."schema_standardization_log_id_seq";

create sequence "log"."table_standardization_log_id_seq";

create table "log"."column_rename_log" (
    "id" uuid not null default gen_random_uuid(),
    "timestamp" timestamp with time zone default now(),
    "table_name" text,
    "old_column" text,
    "new_column" text,
    "success" boolean
);


create table "log"."column_standardization_log" (
    "id" integer not null default nextval('log.column_standardization_log_id_seq'::regclass),
    "operation" text not null,
    "object_name" text not null,
    "status" text not null,
    "details" text,
    "created_at" timestamp with time zone default now()
);


alter table "log"."column_standardization_log" enable row level security;

create table "log"."customers_consolidation_log" (
    "id" integer not null default nextval('log.customers_consolidation_log_id_seq'::regclass),
    "operation" text not null,
    "target" text not null,
    "status" text not null,
    "details" text,
    "created_at" timestamp with time zone default now()
);


alter table "log"."customers_consolidation_log" enable row level security;

create table "log"."registrations_consolidation_log" (
    "id" integer not null default nextval('log.registrations_consolidation_log_id_seq'::regclass),
    "operation" text not null,
    "target" text not null,
    "status" text not null,
    "details" text,
    "created_at" timestamp with time zone default now()
);


alter table "log"."registrations_consolidation_log" enable row level security;

create table "log"."schema_cleanup_log" (
    "id" integer not null default nextval('log.schema_cleanup_log_id_seq'::regclass),
    "operation" text not null,
    "target" text not null,
    "status" text not null,
    "details" text,
    "created_at" timestamp with time zone default now()
);


alter table "log"."schema_cleanup_log" enable row level security;

create table "log"."schema_consolidation_log" (
    "id" integer not null default nextval('log.schema_consolidation_log_id_seq'::regclass),
    "operation" text not null,
    "object_name" text not null,
    "status" text not null,
    "details" text,
    "created_at" timestamp with time zone default now()
);


alter table "log"."schema_consolidation_log" enable row level security;

create table "log"."schema_standardization_log" (
    "id" integer not null default nextval('log.schema_standardization_log_id_seq'::regclass),
    "operation" text not null,
    "target_object" text not null,
    "status" text not null,
    "executed_at" timestamp with time zone default now(),
    "notes" text
);


alter table "log"."schema_standardization_log" enable row level security;

create table "log"."table_rename_log" (
    "id" uuid not null default gen_random_uuid(),
    "timestamp" timestamp with time zone default now(),
    "old_name" text,
    "new_name" text,
    "success" boolean
);


create table "log"."table_standardization_log" (
    "id" integer not null default nextval('log.table_standardization_log_id_seq'::regclass),
    "operation" text not null,
    "object_name" text not null,
    "status" text not null,
    "details" text,
    "created_at" timestamp with time zone default now()
);


alter table "log"."table_standardization_log" enable row level security;

alter sequence "log"."column_standardization_log_id_seq" owned by "log"."column_standardization_log"."id";

alter sequence "log"."customers_consolidation_log_id_seq" owned by "log"."customers_consolidation_log"."id";

alter sequence "log"."registrations_consolidation_log_id_seq" owned by "log"."registrations_consolidation_log"."id";

alter sequence "log"."schema_cleanup_log_id_seq" owned by "log"."schema_cleanup_log"."id";

alter sequence "log"."schema_consolidation_log_id_seq" owned by "log"."schema_consolidation_log"."id";

alter sequence "log"."schema_standardization_log_id_seq" owned by "log"."schema_standardization_log"."id";

alter sequence "log"."table_standardization_log_id_seq" owned by "log"."table_standardization_log"."id";

CREATE UNIQUE INDEX column_rename_log_pkey ON log.column_rename_log USING btree (id);

CREATE UNIQUE INDEX column_standardization_log_pkey ON log.column_standardization_log USING btree (id);

CREATE UNIQUE INDEX customers_consolidation_log_pkey ON log.customers_consolidation_log USING btree (id);

CREATE UNIQUE INDEX registrations_consolidation_log_pkey ON log.registrations_consolidation_log USING btree (id);

CREATE UNIQUE INDEX schema_cleanup_log_pkey ON log.schema_cleanup_log USING btree (id);

CREATE UNIQUE INDEX schema_consolidation_log_pkey ON log.schema_consolidation_log USING btree (id);

CREATE UNIQUE INDEX schema_standardization_log_pkey ON log.schema_standardization_log USING btree (id);

CREATE UNIQUE INDEX table_rename_log_pkey ON log.table_rename_log USING btree (id);

CREATE UNIQUE INDEX table_standardization_log_pkey ON log.table_standardization_log USING btree (id);

alter table "log"."column_rename_log" add constraint "column_rename_log_pkey" PRIMARY KEY using index "column_rename_log_pkey";

alter table "log"."column_standardization_log" add constraint "column_standardization_log_pkey" PRIMARY KEY using index "column_standardization_log_pkey";

alter table "log"."customers_consolidation_log" add constraint "customers_consolidation_log_pkey" PRIMARY KEY using index "customers_consolidation_log_pkey";

alter table "log"."registrations_consolidation_log" add constraint "registrations_consolidation_log_pkey" PRIMARY KEY using index "registrations_consolidation_log_pkey";

alter table "log"."schema_cleanup_log" add constraint "schema_cleanup_log_pkey" PRIMARY KEY using index "schema_cleanup_log_pkey";

alter table "log"."schema_consolidation_log" add constraint "schema_consolidation_log_pkey" PRIMARY KEY using index "schema_consolidation_log_pkey";

alter table "log"."schema_standardization_log" add constraint "schema_standardization_log_pkey" PRIMARY KEY using index "schema_standardization_log_pkey";

alter table "log"."table_rename_log" add constraint "table_rename_log_pkey" PRIMARY KEY using index "table_rename_log_pkey";

alter table "log"."table_standardization_log" add constraint "table_standardization_log_pkey" PRIMARY KEY using index "table_standardization_log_pkey";

grant delete on table "log"."column_rename_log" to "anon";

grant insert on table "log"."column_rename_log" to "anon";

grant references on table "log"."column_rename_log" to "anon";

grant select on table "log"."column_rename_log" to "anon";

grant trigger on table "log"."column_rename_log" to "anon";

grant truncate on table "log"."column_rename_log" to "anon";

grant update on table "log"."column_rename_log" to "anon";

grant delete on table "log"."column_rename_log" to "authenticated";

grant insert on table "log"."column_rename_log" to "authenticated";

grant references on table "log"."column_rename_log" to "authenticated";

grant select on table "log"."column_rename_log" to "authenticated";

grant trigger on table "log"."column_rename_log" to "authenticated";

grant truncate on table "log"."column_rename_log" to "authenticated";

grant update on table "log"."column_rename_log" to "authenticated";

grant delete on table "log"."column_rename_log" to "service_role";

grant insert on table "log"."column_rename_log" to "service_role";

grant references on table "log"."column_rename_log" to "service_role";

grant select on table "log"."column_rename_log" to "service_role";

grant trigger on table "log"."column_rename_log" to "service_role";

grant truncate on table "log"."column_rename_log" to "service_role";

grant update on table "log"."column_rename_log" to "service_role";

grant delete on table "log"."column_standardization_log" to "anon";

grant insert on table "log"."column_standardization_log" to "anon";

grant references on table "log"."column_standardization_log" to "anon";

grant select on table "log"."column_standardization_log" to "anon";

grant trigger on table "log"."column_standardization_log" to "anon";

grant truncate on table "log"."column_standardization_log" to "anon";

grant update on table "log"."column_standardization_log" to "anon";

grant delete on table "log"."column_standardization_log" to "authenticated";

grant insert on table "log"."column_standardization_log" to "authenticated";

grant references on table "log"."column_standardization_log" to "authenticated";

grant select on table "log"."column_standardization_log" to "authenticated";

grant trigger on table "log"."column_standardization_log" to "authenticated";

grant truncate on table "log"."column_standardization_log" to "authenticated";

grant update on table "log"."column_standardization_log" to "authenticated";

grant delete on table "log"."column_standardization_log" to "service_role";

grant insert on table "log"."column_standardization_log" to "service_role";

grant references on table "log"."column_standardization_log" to "service_role";

grant select on table "log"."column_standardization_log" to "service_role";

grant trigger on table "log"."column_standardization_log" to "service_role";

grant truncate on table "log"."column_standardization_log" to "service_role";

grant update on table "log"."column_standardization_log" to "service_role";

grant delete on table "log"."customers_consolidation_log" to "anon";

grant insert on table "log"."customers_consolidation_log" to "anon";

grant references on table "log"."customers_consolidation_log" to "anon";

grant select on table "log"."customers_consolidation_log" to "anon";

grant trigger on table "log"."customers_consolidation_log" to "anon";

grant truncate on table "log"."customers_consolidation_log" to "anon";

grant update on table "log"."customers_consolidation_log" to "anon";

grant delete on table "log"."customers_consolidation_log" to "authenticated";

grant insert on table "log"."customers_consolidation_log" to "authenticated";

grant references on table "log"."customers_consolidation_log" to "authenticated";

grant select on table "log"."customers_consolidation_log" to "authenticated";

grant trigger on table "log"."customers_consolidation_log" to "authenticated";

grant truncate on table "log"."customers_consolidation_log" to "authenticated";

grant update on table "log"."customers_consolidation_log" to "authenticated";

grant delete on table "log"."customers_consolidation_log" to "service_role";

grant insert on table "log"."customers_consolidation_log" to "service_role";

grant references on table "log"."customers_consolidation_log" to "service_role";

grant select on table "log"."customers_consolidation_log" to "service_role";

grant trigger on table "log"."customers_consolidation_log" to "service_role";

grant truncate on table "log"."customers_consolidation_log" to "service_role";

grant update on table "log"."customers_consolidation_log" to "service_role";

grant delete on table "log"."registrations_consolidation_log" to "anon";

grant insert on table "log"."registrations_consolidation_log" to "anon";

grant references on table "log"."registrations_consolidation_log" to "anon";

grant select on table "log"."registrations_consolidation_log" to "anon";

grant trigger on table "log"."registrations_consolidation_log" to "anon";

grant truncate on table "log"."registrations_consolidation_log" to "anon";

grant update on table "log"."registrations_consolidation_log" to "anon";

grant delete on table "log"."registrations_consolidation_log" to "authenticated";

grant insert on table "log"."registrations_consolidation_log" to "authenticated";

grant references on table "log"."registrations_consolidation_log" to "authenticated";

grant select on table "log"."registrations_consolidation_log" to "authenticated";

grant trigger on table "log"."registrations_consolidation_log" to "authenticated";

grant truncate on table "log"."registrations_consolidation_log" to "authenticated";

grant update on table "log"."registrations_consolidation_log" to "authenticated";

grant delete on table "log"."registrations_consolidation_log" to "service_role";

grant insert on table "log"."registrations_consolidation_log" to "service_role";

grant references on table "log"."registrations_consolidation_log" to "service_role";

grant select on table "log"."registrations_consolidation_log" to "service_role";

grant trigger on table "log"."registrations_consolidation_log" to "service_role";

grant truncate on table "log"."registrations_consolidation_log" to "service_role";

grant update on table "log"."registrations_consolidation_log" to "service_role";

grant delete on table "log"."schema_cleanup_log" to "anon";

grant insert on table "log"."schema_cleanup_log" to "anon";

grant references on table "log"."schema_cleanup_log" to "anon";

grant select on table "log"."schema_cleanup_log" to "anon";

grant trigger on table "log"."schema_cleanup_log" to "anon";

grant truncate on table "log"."schema_cleanup_log" to "anon";

grant update on table "log"."schema_cleanup_log" to "anon";

grant delete on table "log"."schema_cleanup_log" to "authenticated";

grant insert on table "log"."schema_cleanup_log" to "authenticated";

grant references on table "log"."schema_cleanup_log" to "authenticated";

grant select on table "log"."schema_cleanup_log" to "authenticated";

grant trigger on table "log"."schema_cleanup_log" to "authenticated";

grant truncate on table "log"."schema_cleanup_log" to "authenticated";

grant update on table "log"."schema_cleanup_log" to "authenticated";

grant delete on table "log"."schema_cleanup_log" to "service_role";

grant insert on table "log"."schema_cleanup_log" to "service_role";

grant references on table "log"."schema_cleanup_log" to "service_role";

grant select on table "log"."schema_cleanup_log" to "service_role";

grant trigger on table "log"."schema_cleanup_log" to "service_role";

grant truncate on table "log"."schema_cleanup_log" to "service_role";

grant update on table "log"."schema_cleanup_log" to "service_role";

grant delete on table "log"."schema_consolidation_log" to "anon";

grant insert on table "log"."schema_consolidation_log" to "anon";

grant references on table "log"."schema_consolidation_log" to "anon";

grant select on table "log"."schema_consolidation_log" to "anon";

grant trigger on table "log"."schema_consolidation_log" to "anon";

grant truncate on table "log"."schema_consolidation_log" to "anon";

grant update on table "log"."schema_consolidation_log" to "anon";

grant delete on table "log"."schema_consolidation_log" to "authenticated";

grant insert on table "log"."schema_consolidation_log" to "authenticated";

grant references on table "log"."schema_consolidation_log" to "authenticated";

grant select on table "log"."schema_consolidation_log" to "authenticated";

grant trigger on table "log"."schema_consolidation_log" to "authenticated";

grant truncate on table "log"."schema_consolidation_log" to "authenticated";

grant update on table "log"."schema_consolidation_log" to "authenticated";

grant delete on table "log"."schema_consolidation_log" to "service_role";

grant insert on table "log"."schema_consolidation_log" to "service_role";

grant references on table "log"."schema_consolidation_log" to "service_role";

grant select on table "log"."schema_consolidation_log" to "service_role";

grant trigger on table "log"."schema_consolidation_log" to "service_role";

grant truncate on table "log"."schema_consolidation_log" to "service_role";

grant update on table "log"."schema_consolidation_log" to "service_role";

grant delete on table "log"."schema_standardization_log" to "anon";

grant insert on table "log"."schema_standardization_log" to "anon";

grant references on table "log"."schema_standardization_log" to "anon";

grant select on table "log"."schema_standardization_log" to "anon";

grant trigger on table "log"."schema_standardization_log" to "anon";

grant truncate on table "log"."schema_standardization_log" to "anon";

grant update on table "log"."schema_standardization_log" to "anon";

grant delete on table "log"."schema_standardization_log" to "authenticated";

grant insert on table "log"."schema_standardization_log" to "authenticated";

grant references on table "log"."schema_standardization_log" to "authenticated";

grant select on table "log"."schema_standardization_log" to "authenticated";

grant trigger on table "log"."schema_standardization_log" to "authenticated";

grant truncate on table "log"."schema_standardization_log" to "authenticated";

grant update on table "log"."schema_standardization_log" to "authenticated";

grant delete on table "log"."schema_standardization_log" to "service_role";

grant insert on table "log"."schema_standardization_log" to "service_role";

grant references on table "log"."schema_standardization_log" to "service_role";

grant select on table "log"."schema_standardization_log" to "service_role";

grant trigger on table "log"."schema_standardization_log" to "service_role";

grant truncate on table "log"."schema_standardization_log" to "service_role";

grant update on table "log"."schema_standardization_log" to "service_role";

grant delete on table "log"."table_rename_log" to "anon";

grant insert on table "log"."table_rename_log" to "anon";

grant references on table "log"."table_rename_log" to "anon";

grant select on table "log"."table_rename_log" to "anon";

grant trigger on table "log"."table_rename_log" to "anon";

grant truncate on table "log"."table_rename_log" to "anon";

grant update on table "log"."table_rename_log" to "anon";

grant delete on table "log"."table_rename_log" to "authenticated";

grant insert on table "log"."table_rename_log" to "authenticated";

grant references on table "log"."table_rename_log" to "authenticated";

grant select on table "log"."table_rename_log" to "authenticated";

grant trigger on table "log"."table_rename_log" to "authenticated";

grant truncate on table "log"."table_rename_log" to "authenticated";

grant update on table "log"."table_rename_log" to "authenticated";

grant delete on table "log"."table_rename_log" to "service_role";

grant insert on table "log"."table_rename_log" to "service_role";

grant references on table "log"."table_rename_log" to "service_role";

grant select on table "log"."table_rename_log" to "service_role";

grant trigger on table "log"."table_rename_log" to "service_role";

grant truncate on table "log"."table_rename_log" to "service_role";

grant update on table "log"."table_rename_log" to "service_role";

grant delete on table "log"."table_standardization_log" to "anon";

grant insert on table "log"."table_standardization_log" to "anon";

grant references on table "log"."table_standardization_log" to "anon";

grant select on table "log"."table_standardization_log" to "anon";

grant trigger on table "log"."table_standardization_log" to "anon";

grant truncate on table "log"."table_standardization_log" to "anon";

grant update on table "log"."table_standardization_log" to "anon";

grant delete on table "log"."table_standardization_log" to "authenticated";

grant insert on table "log"."table_standardization_log" to "authenticated";

grant references on table "log"."table_standardization_log" to "authenticated";

grant select on table "log"."table_standardization_log" to "authenticated";

grant trigger on table "log"."table_standardization_log" to "authenticated";

grant truncate on table "log"."table_standardization_log" to "authenticated";

grant update on table "log"."table_standardization_log" to "authenticated";

grant delete on table "log"."table_standardization_log" to "service_role";

grant insert on table "log"."table_standardization_log" to "service_role";

grant references on table "log"."table_standardization_log" to "service_role";

grant select on table "log"."table_standardization_log" to "service_role";

grant trigger on table "log"."table_standardization_log" to "service_role";

grant truncate on table "log"."table_standardization_log" to "service_role";

grant update on table "log"."table_standardization_log" to "service_role";


drop policy "locations_public_select" on "public"."locations";

drop policy "Allow anonymous inserts to raw_registrations" on "public"."raw_registrations";

drop policy "Users can create tickets for own registrations" on "public"."tickets";

alter table "public"."tickets" drop constraint "check_valid_ticket_status";

alter table "public"."tickets" drop constraint "tickets_status_check";

alter table "public"."raw_registrations" drop constraint "raw_registrations_pkey1";

drop index if exists "public"."raw_registrations_pkey1";

alter table "public"."attendees" alter column "attendee_type" drop not null;

alter table "public"."raw_registrations" drop column "raw_id";

alter table "public"."raw_registrations" add column "id" uuid not null default gen_random_uuid();

CREATE UNIQUE INDEX raw_registrations_pkey1 ON public.raw_registrations USING btree (id);

alter table "public"."raw_registrations" add constraint "raw_registrations_pkey1" PRIMARY KEY using index "raw_registrations_pkey1";

alter table "public"."tickets" add constraint "check_valid_ticket_status" CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'reserved'::character varying, 'sold'::character varying, 'used'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."tickets" validate constraint "check_valid_ticket_status";

alter table "public"."tickets" add constraint "tickets_status_check" CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'reserved'::character varying, 'sold'::character varying, 'used'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."tickets" validate constraint "tickets_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.should_generate_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only proceed if this is an UPDATE
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Check if registration just completed
  IF NEW.status = 'completed' AND 
     NEW.payment_status = 'completed' AND
     OLD.confirmation_number IS NULL AND
     NEW.confirmation_number IS NULL THEN
    
    -- Log this for debugging (optional)
    INSERT INTO webhook_logs (
      webhook_name, 
      table_name, 
      record_id, 
      event_type,
      payload
    ) VALUES (
      'generate_confirmation',
      TG_TABLE_NAME,
      NEW.id::text,
      TG_OP,
      jsonb_build_object(
        'registration_id', NEW.registration_id,
        'registration_type', NEW.registration_type,
        'status', NEW.status,
        'payment_status', NEW.payment_status
      )
    );
    
    -- In Supabase, webhooks are configured through the dashboard
    -- This trigger is mainly for logging and validation
  END IF;

  RETURN NEW;
END;
$function$
;























































































































































































create policy "locations_public_select"
on "public"."locations"
as permissive
for select
to anon, authenticated
using (true);


create policy "Allow anonymous inserts to raw_registrations"
on "public"."raw_registrations"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Users can create tickets for own registrations"
on "public"."tickets"
as permissive
for insert
to anon, authenticated
with check ((EXISTS ( SELECT 1
   FROM (registrations r
     JOIN contacts c ON ((c.contact_id = r.customer_id)))
  WHERE ((r.registration_id = tickets.registration_id) AND ((c.auth_user_id = auth.uid()) OR (c.auth_user_id IS NULL))))));



create schema if not exists "registrations";


create schema if not exists "schema_consolidation_backup";


create schema if not exists "stripe";

create table "stripe"."stripe_coupons" (
    "id" text not null,
    "name" text,
    "amount_off" bigint,
    "percent_off" numeric(5,2),
    "currency" text,
    "duration" text not null,
    "duration_in_months" integer,
    "max_redemptions" bigint,
    "redeem_by" timestamp without time zone,
    "times_redeemed" bigint not null default 0,
    "valid" boolean not null,
    "created" timestamp without time zone,
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "stripe"."stripe_coupons" enable row level security;

create table "stripe"."stripe_customers" (
    "id" bigint generated always as identity not null,
    "stripe_customer_id_text" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "deleted_at" timestamp with time zone,
    "customer_id" uuid not null
);


alter table "stripe"."stripe_customers" enable row level security;

create table "stripe"."stripe_discounts" (
    "id" text not null,
    "coupon_id" text not null,
    "promotion_code_id" text,
    "stripe_customer_id" text,
    "invoice_id" text,
    "quote_id" text,
    "start_date" timestamp without time zone,
    "end_date" timestamp without time zone,
    "created" timestamp without time zone,
    "created_at" timestamp with time zone not null default now()
);


alter table "stripe"."stripe_discounts" enable row level security;

create table "stripe"."stripe_invoice_line_items" (
    "id" text not null,
    "invoice_id" text not null,
    "price_id" text,
    "amount" bigint,
    "amount_excluding_tax" bigint,
    "currency" text,
    "description" text,
    "discountable" boolean,
    "period" jsonb,
    "plan_id" text,
    "proration" boolean,
    "proration_details" jsonb,
    "quantity" bigint,
    "tax_amounts" jsonb,
    "tax_rates" jsonb,
    "type" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "stripe"."stripe_invoice_line_items" enable row level security;

create table "stripe"."stripe_invoices" (
    "id" text not null,
    "stripe_customer_id" text,
    "quote_id" text,
    "payment_intent_id" text,
    "charge_id" text,
    "status" invoice_status,
    "amount_due" bigint,
    "amount_paid" bigint,
    "amount_remaining" bigint,
    "amount_shipping" bigint,
    "subtotal" bigint,
    "subtotal_excluding_tax" bigint,
    "tax" bigint,
    "total" bigint,
    "total_excluding_tax" bigint,
    "billing_reason" billing_reason,
    "collection_method" collection_method,
    "currency" text not null,
    "description" text,
    "due_date" timestamp without time zone,
    "hosted_invoice_url" text,
    "invoice_pdf" text,
    "number" text,
    "paid" boolean not null default false,
    "paid_out_of_band" boolean not null default false,
    "period_start" timestamp without time zone,
    "period_end" timestamp without time zone,
    "receipt_number" text,
    "statement_descriptor" text,
    "customer_address" jsonb,
    "customer_shipping" jsonb,
    "discount_details" jsonb,
    "tax_details" jsonb,
    "status_transitions" jsonb,
    "created" timestamp without time zone,
    "finalized_at" timestamp without time zone,
    "paid_at" timestamp without time zone,
    "voided_at" timestamp without time zone,
    "marked_uncollectible_at" timestamp without time zone,
    "created_at" timestamp with time zone not null default now()
);


alter table "stripe"."stripe_invoices" enable row level security;

create table "stripe"."stripe_prices" (
    "id" text not null,
    "stripe_product_id" text not null,
    "active" boolean not null,
    "billing_scheme" billing_scheme,
    "currency" text not null,
    "lookup_key" text,
    "metadata" jsonb,
    "nickname" text,
    "recurring" jsonb,
    "tax_behavior" tax_behavior,
    "tiers_mode" text,
    "transform_quantity" jsonb,
    "type" price_type,
    "unit_amount" bigint,
    "unit_amount_decimal" numeric,
    "ticket_definition_id" uuid,
    "livemode" boolean,
    "created" timestamp without time zone,
    "created_at" timestamp with time zone not null default now()
);


alter table "stripe"."stripe_prices" enable row level security;

create table "stripe"."stripe_products" (
    "id" text not null,
    "active" boolean not null,
    "name" text not null,
    "description" text,
    "default_price_id" text,
    "tax_code_id" text,
    "metadata" jsonb,
    "livemode" boolean,
    "created" timestamp without time zone,
    "updated" timestamp without time zone,
    "created_at" timestamp with time zone not null default now(),
    "event_id" uuid
);


alter table "stripe"."stripe_products" enable row level security;

create table "stripe"."stripe_promotion_codes" (
    "id" text not null,
    "code" text not null,
    "coupon_id" text not null,
    "active" boolean not null,
    "stripe_customer_id" text,
    "expires_at" timestamp without time zone,
    "max_redemptions" bigint,
    "times_redeemed" bigint not null default 0,
    "created" timestamp without time zone,
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "stripe"."stripe_promotion_codes" enable row level security;

create table "stripe"."stripe_quote_line_items" (
    "id" text not null,
    "quote_id" text not null,
    "price_id" text,
    "product_id" text,
    "quantity" bigint,
    "amount_subtotal" bigint,
    "amount_total" bigint,
    "currency" text,
    "description" text,
    "discounts" jsonb,
    "taxes" jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "stripe"."stripe_quote_line_items" enable row level security;

create table "stripe"."stripe_quotes" (
    "id" text not null,
    "stripe_customer_id" text,
    "invoice_id" text,
    "test_clock_id" text,
    "from_quote_id" text,
    "status" quote_status,
    "amount_subtotal" bigint,
    "amount_total" bigint,
    "currency" text,
    "collection_method" collection_method,
    "description" text,
    "expires_at" timestamp without time zone,
    "footer" text,
    "header" text,
    "livemode" boolean,
    "metadata" jsonb,
    "number" text,
    "automatic_tax" jsonb,
    "computed" jsonb,
    "invoice_settings" jsonb,
    "status_transitions" jsonb,
    "total_details" jsonb,
    "transfer_data" jsonb,
    "created" timestamp without time zone,
    "created_at" timestamp with time zone not null default now()
);


alter table "stripe"."stripe_quotes" enable row level security;

create table "stripe"."stripe_tax_codes" (
    "id" text not null,
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "stripe"."stripe_tax_codes" enable row level security;

create table "stripe"."stripe_tax_rates" (
    "id" text not null,
    "active" boolean not null,
    "country" text,
    "description" text,
    "display_name" text not null,
    "inclusive" boolean not null default false,
    "jurisdiction" text,
    "percentage" numeric(6,4) not null,
    "state" text,
    "tax_type" text,
    "created" timestamp without time zone,
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "stripe"."stripe_tax_rates" enable row level security;

CREATE INDEX idx_stripe_discounts_coupon_id ON stripe.stripe_discounts USING btree (coupon_id);

CREATE INDEX idx_stripe_discounts_invoice_id ON stripe.stripe_discounts USING btree (invoice_id);

CREATE INDEX idx_stripe_discounts_promotion_code_id ON stripe.stripe_discounts USING btree (promotion_code_id);

CREATE INDEX idx_stripe_discounts_quote_id ON stripe.stripe_discounts USING btree (quote_id);

CREATE INDEX idx_stripe_discounts_stripe_customer_id ON stripe.stripe_discounts USING btree (stripe_customer_id);

CREATE INDEX idx_stripe_invoice_line_items_invoice_id ON stripe.stripe_invoice_line_items USING btree (invoice_id);

CREATE INDEX idx_stripe_invoice_line_items_price_id ON stripe.stripe_invoice_line_items USING btree (price_id);

CREATE INDEX idx_stripe_invoices_quote_id ON stripe.stripe_invoices USING btree (quote_id);

CREATE INDEX idx_stripe_invoices_stripe_customer_id ON stripe.stripe_invoices USING btree (stripe_customer_id);

CREATE INDEX idx_stripe_prices_stripe_product_id ON stripe.stripe_prices USING btree (stripe_product_id);

CREATE INDEX idx_stripe_products_event_id ON stripe.stripe_products USING btree (event_id);

CREATE INDEX idx_stripe_products_tax_code_id ON stripe.stripe_products USING btree (tax_code_id);

CREATE INDEX idx_stripe_promotion_codes_coupon_id ON stripe.stripe_promotion_codes USING btree (coupon_id);

CREATE INDEX idx_stripe_promotion_codes_stripe_customer_id ON stripe.stripe_promotion_codes USING btree (stripe_customer_id);

CREATE INDEX idx_stripe_quote_line_items_price_id ON stripe.stripe_quote_line_items USING btree (price_id);

CREATE INDEX idx_stripe_quote_line_items_product_id ON stripe.stripe_quote_line_items USING btree (product_id);

CREATE INDEX idx_stripe_quote_line_items_quote_id ON stripe.stripe_quote_line_items USING btree (quote_id);

CREATE INDEX idx_stripe_quotes_from_quote_id ON stripe.stripe_quotes USING btree (from_quote_id);

CREATE INDEX idx_stripe_quotes_invoice_id ON stripe.stripe_quotes USING btree (invoice_id);

CREATE INDEX idx_stripe_quotes_stripe_customer_id ON stripe.stripe_quotes USING btree (stripe_customer_id);

CREATE UNIQUE INDEX stripe_coupons_pkey ON stripe.stripe_coupons USING btree (id);

CREATE UNIQUE INDEX stripe_customers_customer_id_key ON stripe.stripe_customers USING btree (stripe_customer_id_text);

CREATE UNIQUE INDEX stripe_customers_customer_id_key1 ON stripe.stripe_customers USING btree (customer_id);

CREATE UNIQUE INDEX stripe_customers_pkey ON stripe.stripe_customers USING btree (id);

CREATE UNIQUE INDEX stripe_discounts_pkey ON stripe.stripe_discounts USING btree (id);

CREATE UNIQUE INDEX stripe_invoice_line_items_pkey ON stripe.stripe_invoice_line_items USING btree (id);

CREATE UNIQUE INDEX stripe_invoices_pkey ON stripe.stripe_invoices USING btree (id);

CREATE UNIQUE INDEX stripe_prices_lookup_key_key ON stripe.stripe_prices USING btree (lookup_key);

CREATE UNIQUE INDEX stripe_prices_pkey ON stripe.stripe_prices USING btree (id);

CREATE UNIQUE INDEX stripe_prices_ticket_definition_id_key ON stripe.stripe_prices USING btree (ticket_definition_id);

CREATE UNIQUE INDEX stripe_products_default_price_id_key ON stripe.stripe_products USING btree (default_price_id);

CREATE UNIQUE INDEX stripe_products_pkey ON stripe.stripe_products USING btree (id);

CREATE UNIQUE INDEX stripe_promotion_codes_code_key ON stripe.stripe_promotion_codes USING btree (code);

CREATE UNIQUE INDEX stripe_promotion_codes_pkey ON stripe.stripe_promotion_codes USING btree (id);

CREATE UNIQUE INDEX stripe_quote_line_items_pkey ON stripe.stripe_quote_line_items USING btree (id);

CREATE UNIQUE INDEX stripe_quotes_pkey ON stripe.stripe_quotes USING btree (id);

CREATE UNIQUE INDEX stripe_tax_codes_pkey ON stripe.stripe_tax_codes USING btree (id);

CREATE UNIQUE INDEX stripe_tax_rates_pkey ON stripe.stripe_tax_rates USING btree (id);

alter table "stripe"."stripe_coupons" add constraint "stripe_coupons_pkey" PRIMARY KEY using index "stripe_coupons_pkey";

alter table "stripe"."stripe_customers" add constraint "stripe_customers_pkey" PRIMARY KEY using index "stripe_customers_pkey";

alter table "stripe"."stripe_discounts" add constraint "stripe_discounts_pkey" PRIMARY KEY using index "stripe_discounts_pkey";

alter table "stripe"."stripe_invoice_line_items" add constraint "stripe_invoice_line_items_pkey" PRIMARY KEY using index "stripe_invoice_line_items_pkey";

alter table "stripe"."stripe_invoices" add constraint "stripe_invoices_pkey" PRIMARY KEY using index "stripe_invoices_pkey";

alter table "stripe"."stripe_prices" add constraint "stripe_prices_pkey" PRIMARY KEY using index "stripe_prices_pkey";

alter table "stripe"."stripe_products" add constraint "stripe_products_pkey" PRIMARY KEY using index "stripe_products_pkey";

alter table "stripe"."stripe_promotion_codes" add constraint "stripe_promotion_codes_pkey" PRIMARY KEY using index "stripe_promotion_codes_pkey";

alter table "stripe"."stripe_quote_line_items" add constraint "stripe_quote_line_items_pkey" PRIMARY KEY using index "stripe_quote_line_items_pkey";

alter table "stripe"."stripe_quotes" add constraint "stripe_quotes_pkey" PRIMARY KEY using index "stripe_quotes_pkey";

alter table "stripe"."stripe_tax_codes" add constraint "stripe_tax_codes_pkey" PRIMARY KEY using index "stripe_tax_codes_pkey";

alter table "stripe"."stripe_tax_rates" add constraint "stripe_tax_rates_pkey" PRIMARY KEY using index "stripe_tax_rates_pkey";

alter table "stripe"."stripe_customers" add constraint "stripe_customers_customer_id_key" UNIQUE using index "stripe_customers_customer_id_key";

alter table "stripe"."stripe_customers" add constraint "stripe_customers_customer_id_key1" UNIQUE using index "stripe_customers_customer_id_key1";

alter table "stripe"."stripe_discounts" add constraint "fk_discount_invoice" FOREIGN KEY (invoice_id) REFERENCES stripe.stripe_invoices(id) ON DELETE RESTRICT not valid;

alter table "stripe"."stripe_discounts" validate constraint "fk_discount_invoice";

alter table "stripe"."stripe_discounts" add constraint "fk_discount_quote" FOREIGN KEY (quote_id) REFERENCES stripe.stripe_quotes(id) ON DELETE RESTRICT not valid;

alter table "stripe"."stripe_discounts" validate constraint "fk_discount_quote";

alter table "stripe"."stripe_discounts" add constraint "stripe_discounts_coupon_id_fkey" FOREIGN KEY (coupon_id) REFERENCES stripe.stripe_coupons(id) ON DELETE CASCADE not valid;

alter table "stripe"."stripe_discounts" validate constraint "stripe_discounts_coupon_id_fkey";

alter table "stripe"."stripe_discounts" add constraint "stripe_discounts_promotion_code_id_fkey" FOREIGN KEY (promotion_code_id) REFERENCES stripe.stripe_promotion_codes(id) ON DELETE SET NULL not valid;

alter table "stripe"."stripe_discounts" validate constraint "stripe_discounts_promotion_code_id_fkey";

alter table "stripe"."stripe_discounts" add constraint "stripe_discounts_stripe_customer_id_fkey" FOREIGN KEY (stripe_customer_id) REFERENCES stripe.stripe_customers(stripe_customer_id_text) ON DELETE SET NULL not valid;

alter table "stripe"."stripe_discounts" validate constraint "stripe_discounts_stripe_customer_id_fkey";

alter table "stripe"."stripe_invoice_line_items" add constraint "stripe_invoice_line_items_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES stripe.stripe_invoices(id) ON DELETE CASCADE not valid;

alter table "stripe"."stripe_invoice_line_items" validate constraint "stripe_invoice_line_items_invoice_id_fkey";

alter table "stripe"."stripe_invoice_line_items" add constraint "stripe_invoice_line_items_price_id_fkey" FOREIGN KEY (price_id) REFERENCES stripe.stripe_prices(id) ON DELETE RESTRICT not valid;

alter table "stripe"."stripe_invoice_line_items" validate constraint "stripe_invoice_line_items_price_id_fkey";

alter table "stripe"."stripe_invoices" add constraint "stripe_invoices_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES stripe.stripe_quotes(id) ON DELETE SET NULL not valid;

alter table "stripe"."stripe_invoices" validate constraint "stripe_invoices_quote_id_fkey";

alter table "stripe"."stripe_invoices" add constraint "stripe_invoices_stripe_customer_id_fkey" FOREIGN KEY (stripe_customer_id) REFERENCES stripe.stripe_customers(stripe_customer_id_text) ON DELETE RESTRICT not valid;

alter table "stripe"."stripe_invoices" validate constraint "stripe_invoices_stripe_customer_id_fkey";

alter table "stripe"."stripe_prices" add constraint "stripe_prices_lookup_key_key" UNIQUE using index "stripe_prices_lookup_key_key";

alter table "stripe"."stripe_prices" add constraint "stripe_prices_stripe_product_id_fkey" FOREIGN KEY (stripe_product_id) REFERENCES stripe.stripe_products(id) ON DELETE CASCADE not valid;

alter table "stripe"."stripe_prices" validate constraint "stripe_prices_stripe_product_id_fkey";

alter table "stripe"."stripe_prices" add constraint "stripe_prices_ticket_definition_id_key" UNIQUE using index "stripe_prices_ticket_definition_id_key";

alter table "stripe"."stripe_products" add constraint "fk_products_default_price" FOREIGN KEY (default_price_id) REFERENCES stripe.stripe_prices(id) ON DELETE SET NULL not valid;

alter table "stripe"."stripe_products" validate constraint "fk_products_default_price";

alter table "stripe"."stripe_products" add constraint "stripe_products_default_price_id_key" UNIQUE using index "stripe_products_default_price_id_key";

alter table "stripe"."stripe_products" add constraint "stripe_products_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE RESTRICT not valid;

alter table "stripe"."stripe_products" validate constraint "stripe_products_event_id_fkey";

alter table "stripe"."stripe_products" add constraint "stripe_products_tax_code_id_fkey" FOREIGN KEY (tax_code_id) REFERENCES stripe.stripe_tax_codes(id) ON DELETE RESTRICT not valid;

alter table "stripe"."stripe_products" validate constraint "stripe_products_tax_code_id_fkey";

alter table "stripe"."stripe_promotion_codes" add constraint "fk_promo_codes_stripe_customer" FOREIGN KEY (stripe_customer_id) REFERENCES stripe.stripe_customers(stripe_customer_id_text) ON DELETE SET NULL not valid;

alter table "stripe"."stripe_promotion_codes" validate constraint "fk_promo_codes_stripe_customer";

alter table "stripe"."stripe_promotion_codes" add constraint "stripe_promotion_codes_code_key" UNIQUE using index "stripe_promotion_codes_code_key";

alter table "stripe"."stripe_promotion_codes" add constraint "stripe_promotion_codes_coupon_id_fkey" FOREIGN KEY (coupon_id) REFERENCES stripe.stripe_coupons(id) ON DELETE CASCADE not valid;

alter table "stripe"."stripe_promotion_codes" validate constraint "stripe_promotion_codes_coupon_id_fkey";

alter table "stripe"."stripe_quote_line_items" add constraint "stripe_quote_line_items_price_id_fkey" FOREIGN KEY (price_id) REFERENCES stripe.stripe_prices(id) ON DELETE RESTRICT not valid;

alter table "stripe"."stripe_quote_line_items" validate constraint "stripe_quote_line_items_price_id_fkey";

alter table "stripe"."stripe_quote_line_items" add constraint "stripe_quote_line_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES stripe.stripe_products(id) ON DELETE RESTRICT not valid;

alter table "stripe"."stripe_quote_line_items" validate constraint "stripe_quote_line_items_product_id_fkey";

alter table "stripe"."stripe_quote_line_items" add constraint "stripe_quote_line_items_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES stripe.stripe_quotes(id) ON DELETE CASCADE not valid;

alter table "stripe"."stripe_quote_line_items" validate constraint "stripe_quote_line_items_quote_id_fkey";

alter table "stripe"."stripe_quotes" add constraint "fk_quote_invoice" FOREIGN KEY (invoice_id) REFERENCES stripe.stripe_invoices(id) ON DELETE SET NULL not valid;

alter table "stripe"."stripe_quotes" validate constraint "fk_quote_invoice";

alter table "stripe"."stripe_quotes" add constraint "stripe_quotes_from_quote_id_fkey" FOREIGN KEY (from_quote_id) REFERENCES stripe.stripe_quotes(id) ON DELETE SET NULL not valid;

alter table "stripe"."stripe_quotes" validate constraint "stripe_quotes_from_quote_id_fkey";

alter table "stripe"."stripe_quotes" add constraint "stripe_quotes_stripe_customer_id_fkey" FOREIGN KEY (stripe_customer_id) REFERENCES stripe.stripe_customers(stripe_customer_id_text) ON DELETE RESTRICT not valid;

alter table "stripe"."stripe_quotes" validate constraint "stripe_quotes_stripe_customer_id_fkey";

grant delete on table "stripe"."stripe_coupons" to "anon";

grant insert on table "stripe"."stripe_coupons" to "anon";

grant references on table "stripe"."stripe_coupons" to "anon";

grant select on table "stripe"."stripe_coupons" to "anon";

grant trigger on table "stripe"."stripe_coupons" to "anon";

grant truncate on table "stripe"."stripe_coupons" to "anon";

grant update on table "stripe"."stripe_coupons" to "anon";

grant delete on table "stripe"."stripe_coupons" to "authenticated";

grant insert on table "stripe"."stripe_coupons" to "authenticated";

grant references on table "stripe"."stripe_coupons" to "authenticated";

grant select on table "stripe"."stripe_coupons" to "authenticated";

grant trigger on table "stripe"."stripe_coupons" to "authenticated";

grant truncate on table "stripe"."stripe_coupons" to "authenticated";

grant update on table "stripe"."stripe_coupons" to "authenticated";

grant delete on table "stripe"."stripe_coupons" to "service_role";

grant insert on table "stripe"."stripe_coupons" to "service_role";

grant references on table "stripe"."stripe_coupons" to "service_role";

grant select on table "stripe"."stripe_coupons" to "service_role";

grant trigger on table "stripe"."stripe_coupons" to "service_role";

grant truncate on table "stripe"."stripe_coupons" to "service_role";

grant update on table "stripe"."stripe_coupons" to "service_role";

grant delete on table "stripe"."stripe_customers" to "anon";

grant insert on table "stripe"."stripe_customers" to "anon";

grant references on table "stripe"."stripe_customers" to "anon";

grant select on table "stripe"."stripe_customers" to "anon";

grant trigger on table "stripe"."stripe_customers" to "anon";

grant truncate on table "stripe"."stripe_customers" to "anon";

grant update on table "stripe"."stripe_customers" to "anon";

grant delete on table "stripe"."stripe_customers" to "authenticated";

grant insert on table "stripe"."stripe_customers" to "authenticated";

grant references on table "stripe"."stripe_customers" to "authenticated";

grant select on table "stripe"."stripe_customers" to "authenticated";

grant trigger on table "stripe"."stripe_customers" to "authenticated";

grant truncate on table "stripe"."stripe_customers" to "authenticated";

grant update on table "stripe"."stripe_customers" to "authenticated";

grant delete on table "stripe"."stripe_customers" to "service_role";

grant insert on table "stripe"."stripe_customers" to "service_role";

grant references on table "stripe"."stripe_customers" to "service_role";

grant select on table "stripe"."stripe_customers" to "service_role";

grant trigger on table "stripe"."stripe_customers" to "service_role";

grant truncate on table "stripe"."stripe_customers" to "service_role";

grant update on table "stripe"."stripe_customers" to "service_role";

grant delete on table "stripe"."stripe_discounts" to "anon";

grant insert on table "stripe"."stripe_discounts" to "anon";

grant references on table "stripe"."stripe_discounts" to "anon";

grant select on table "stripe"."stripe_discounts" to "anon";

grant trigger on table "stripe"."stripe_discounts" to "anon";

grant truncate on table "stripe"."stripe_discounts" to "anon";

grant update on table "stripe"."stripe_discounts" to "anon";

grant delete on table "stripe"."stripe_discounts" to "authenticated";

grant insert on table "stripe"."stripe_discounts" to "authenticated";

grant references on table "stripe"."stripe_discounts" to "authenticated";

grant select on table "stripe"."stripe_discounts" to "authenticated";

grant trigger on table "stripe"."stripe_discounts" to "authenticated";

grant truncate on table "stripe"."stripe_discounts" to "authenticated";

grant update on table "stripe"."stripe_discounts" to "authenticated";

grant delete on table "stripe"."stripe_discounts" to "service_role";

grant insert on table "stripe"."stripe_discounts" to "service_role";

grant references on table "stripe"."stripe_discounts" to "service_role";

grant select on table "stripe"."stripe_discounts" to "service_role";

grant trigger on table "stripe"."stripe_discounts" to "service_role";

grant truncate on table "stripe"."stripe_discounts" to "service_role";

grant update on table "stripe"."stripe_discounts" to "service_role";

grant delete on table "stripe"."stripe_invoice_line_items" to "anon";

grant insert on table "stripe"."stripe_invoice_line_items" to "anon";

grant references on table "stripe"."stripe_invoice_line_items" to "anon";

grant select on table "stripe"."stripe_invoice_line_items" to "anon";

grant trigger on table "stripe"."stripe_invoice_line_items" to "anon";

grant truncate on table "stripe"."stripe_invoice_line_items" to "anon";

grant update on table "stripe"."stripe_invoice_line_items" to "anon";

grant delete on table "stripe"."stripe_invoice_line_items" to "authenticated";

grant insert on table "stripe"."stripe_invoice_line_items" to "authenticated";

grant references on table "stripe"."stripe_invoice_line_items" to "authenticated";

grant select on table "stripe"."stripe_invoice_line_items" to "authenticated";

grant trigger on table "stripe"."stripe_invoice_line_items" to "authenticated";

grant truncate on table "stripe"."stripe_invoice_line_items" to "authenticated";

grant update on table "stripe"."stripe_invoice_line_items" to "authenticated";

grant delete on table "stripe"."stripe_invoice_line_items" to "service_role";

grant insert on table "stripe"."stripe_invoice_line_items" to "service_role";

grant references on table "stripe"."stripe_invoice_line_items" to "service_role";

grant select on table "stripe"."stripe_invoice_line_items" to "service_role";

grant trigger on table "stripe"."stripe_invoice_line_items" to "service_role";

grant truncate on table "stripe"."stripe_invoice_line_items" to "service_role";

grant update on table "stripe"."stripe_invoice_line_items" to "service_role";

grant delete on table "stripe"."stripe_invoices" to "anon";

grant insert on table "stripe"."stripe_invoices" to "anon";

grant references on table "stripe"."stripe_invoices" to "anon";

grant select on table "stripe"."stripe_invoices" to "anon";

grant trigger on table "stripe"."stripe_invoices" to "anon";

grant truncate on table "stripe"."stripe_invoices" to "anon";

grant update on table "stripe"."stripe_invoices" to "anon";

grant delete on table "stripe"."stripe_invoices" to "authenticated";

grant insert on table "stripe"."stripe_invoices" to "authenticated";

grant references on table "stripe"."stripe_invoices" to "authenticated";

grant select on table "stripe"."stripe_invoices" to "authenticated";

grant trigger on table "stripe"."stripe_invoices" to "authenticated";

grant truncate on table "stripe"."stripe_invoices" to "authenticated";

grant update on table "stripe"."stripe_invoices" to "authenticated";

grant delete on table "stripe"."stripe_invoices" to "service_role";

grant insert on table "stripe"."stripe_invoices" to "service_role";

grant references on table "stripe"."stripe_invoices" to "service_role";

grant select on table "stripe"."stripe_invoices" to "service_role";

grant trigger on table "stripe"."stripe_invoices" to "service_role";

grant truncate on table "stripe"."stripe_invoices" to "service_role";

grant update on table "stripe"."stripe_invoices" to "service_role";

grant delete on table "stripe"."stripe_prices" to "anon";

grant insert on table "stripe"."stripe_prices" to "anon";

grant references on table "stripe"."stripe_prices" to "anon";

grant select on table "stripe"."stripe_prices" to "anon";

grant trigger on table "stripe"."stripe_prices" to "anon";

grant truncate on table "stripe"."stripe_prices" to "anon";

grant update on table "stripe"."stripe_prices" to "anon";

grant delete on table "stripe"."stripe_prices" to "authenticated";

grant insert on table "stripe"."stripe_prices" to "authenticated";

grant references on table "stripe"."stripe_prices" to "authenticated";

grant select on table "stripe"."stripe_prices" to "authenticated";

grant trigger on table "stripe"."stripe_prices" to "authenticated";

grant truncate on table "stripe"."stripe_prices" to "authenticated";

grant update on table "stripe"."stripe_prices" to "authenticated";

grant delete on table "stripe"."stripe_prices" to "service_role";

grant insert on table "stripe"."stripe_prices" to "service_role";

grant references on table "stripe"."stripe_prices" to "service_role";

grant select on table "stripe"."stripe_prices" to "service_role";

grant trigger on table "stripe"."stripe_prices" to "service_role";

grant truncate on table "stripe"."stripe_prices" to "service_role";

grant update on table "stripe"."stripe_prices" to "service_role";

grant delete on table "stripe"."stripe_products" to "anon";

grant insert on table "stripe"."stripe_products" to "anon";

grant references on table "stripe"."stripe_products" to "anon";

grant select on table "stripe"."stripe_products" to "anon";

grant trigger on table "stripe"."stripe_products" to "anon";

grant truncate on table "stripe"."stripe_products" to "anon";

grant update on table "stripe"."stripe_products" to "anon";

grant delete on table "stripe"."stripe_products" to "authenticated";

grant insert on table "stripe"."stripe_products" to "authenticated";

grant references on table "stripe"."stripe_products" to "authenticated";

grant select on table "stripe"."stripe_products" to "authenticated";

grant trigger on table "stripe"."stripe_products" to "authenticated";

grant truncate on table "stripe"."stripe_products" to "authenticated";

grant update on table "stripe"."stripe_products" to "authenticated";

grant delete on table "stripe"."stripe_products" to "service_role";

grant insert on table "stripe"."stripe_products" to "service_role";

grant references on table "stripe"."stripe_products" to "service_role";

grant select on table "stripe"."stripe_products" to "service_role";

grant trigger on table "stripe"."stripe_products" to "service_role";

grant truncate on table "stripe"."stripe_products" to "service_role";

grant update on table "stripe"."stripe_products" to "service_role";

grant delete on table "stripe"."stripe_promotion_codes" to "anon";

grant insert on table "stripe"."stripe_promotion_codes" to "anon";

grant references on table "stripe"."stripe_promotion_codes" to "anon";

grant select on table "stripe"."stripe_promotion_codes" to "anon";

grant trigger on table "stripe"."stripe_promotion_codes" to "anon";

grant truncate on table "stripe"."stripe_promotion_codes" to "anon";

grant update on table "stripe"."stripe_promotion_codes" to "anon";

grant delete on table "stripe"."stripe_promotion_codes" to "authenticated";

grant insert on table "stripe"."stripe_promotion_codes" to "authenticated";

grant references on table "stripe"."stripe_promotion_codes" to "authenticated";

grant select on table "stripe"."stripe_promotion_codes" to "authenticated";

grant trigger on table "stripe"."stripe_promotion_codes" to "authenticated";

grant truncate on table "stripe"."stripe_promotion_codes" to "authenticated";

grant update on table "stripe"."stripe_promotion_codes" to "authenticated";

grant delete on table "stripe"."stripe_promotion_codes" to "service_role";

grant insert on table "stripe"."stripe_promotion_codes" to "service_role";

grant references on table "stripe"."stripe_promotion_codes" to "service_role";

grant select on table "stripe"."stripe_promotion_codes" to "service_role";

grant trigger on table "stripe"."stripe_promotion_codes" to "service_role";

grant truncate on table "stripe"."stripe_promotion_codes" to "service_role";

grant update on table "stripe"."stripe_promotion_codes" to "service_role";

grant delete on table "stripe"."stripe_quote_line_items" to "anon";

grant insert on table "stripe"."stripe_quote_line_items" to "anon";

grant references on table "stripe"."stripe_quote_line_items" to "anon";

grant select on table "stripe"."stripe_quote_line_items" to "anon";

grant trigger on table "stripe"."stripe_quote_line_items" to "anon";

grant truncate on table "stripe"."stripe_quote_line_items" to "anon";

grant update on table "stripe"."stripe_quote_line_items" to "anon";

grant delete on table "stripe"."stripe_quote_line_items" to "authenticated";

grant insert on table "stripe"."stripe_quote_line_items" to "authenticated";

grant references on table "stripe"."stripe_quote_line_items" to "authenticated";

grant select on table "stripe"."stripe_quote_line_items" to "authenticated";

grant trigger on table "stripe"."stripe_quote_line_items" to "authenticated";

grant truncate on table "stripe"."stripe_quote_line_items" to "authenticated";

grant update on table "stripe"."stripe_quote_line_items" to "authenticated";

grant delete on table "stripe"."stripe_quote_line_items" to "service_role";

grant insert on table "stripe"."stripe_quote_line_items" to "service_role";

grant references on table "stripe"."stripe_quote_line_items" to "service_role";

grant select on table "stripe"."stripe_quote_line_items" to "service_role";

grant trigger on table "stripe"."stripe_quote_line_items" to "service_role";

grant truncate on table "stripe"."stripe_quote_line_items" to "service_role";

grant update on table "stripe"."stripe_quote_line_items" to "service_role";

grant delete on table "stripe"."stripe_quotes" to "anon";

grant insert on table "stripe"."stripe_quotes" to "anon";

grant references on table "stripe"."stripe_quotes" to "anon";

grant select on table "stripe"."stripe_quotes" to "anon";

grant trigger on table "stripe"."stripe_quotes" to "anon";

grant truncate on table "stripe"."stripe_quotes" to "anon";

grant update on table "stripe"."stripe_quotes" to "anon";

grant delete on table "stripe"."stripe_quotes" to "authenticated";

grant insert on table "stripe"."stripe_quotes" to "authenticated";

grant references on table "stripe"."stripe_quotes" to "authenticated";

grant select on table "stripe"."stripe_quotes" to "authenticated";

grant trigger on table "stripe"."stripe_quotes" to "authenticated";

grant truncate on table "stripe"."stripe_quotes" to "authenticated";

grant update on table "stripe"."stripe_quotes" to "authenticated";

grant delete on table "stripe"."stripe_quotes" to "service_role";

grant insert on table "stripe"."stripe_quotes" to "service_role";

grant references on table "stripe"."stripe_quotes" to "service_role";

grant select on table "stripe"."stripe_quotes" to "service_role";

grant trigger on table "stripe"."stripe_quotes" to "service_role";

grant truncate on table "stripe"."stripe_quotes" to "service_role";

grant update on table "stripe"."stripe_quotes" to "service_role";

grant delete on table "stripe"."stripe_tax_codes" to "anon";

grant insert on table "stripe"."stripe_tax_codes" to "anon";

grant references on table "stripe"."stripe_tax_codes" to "anon";

grant select on table "stripe"."stripe_tax_codes" to "anon";

grant trigger on table "stripe"."stripe_tax_codes" to "anon";

grant truncate on table "stripe"."stripe_tax_codes" to "anon";

grant update on table "stripe"."stripe_tax_codes" to "anon";

grant delete on table "stripe"."stripe_tax_codes" to "authenticated";

grant insert on table "stripe"."stripe_tax_codes" to "authenticated";

grant references on table "stripe"."stripe_tax_codes" to "authenticated";

grant select on table "stripe"."stripe_tax_codes" to "authenticated";

grant trigger on table "stripe"."stripe_tax_codes" to "authenticated";

grant truncate on table "stripe"."stripe_tax_codes" to "authenticated";

grant update on table "stripe"."stripe_tax_codes" to "authenticated";

grant delete on table "stripe"."stripe_tax_codes" to "service_role";

grant insert on table "stripe"."stripe_tax_codes" to "service_role";

grant references on table "stripe"."stripe_tax_codes" to "service_role";

grant select on table "stripe"."stripe_tax_codes" to "service_role";

grant trigger on table "stripe"."stripe_tax_codes" to "service_role";

grant truncate on table "stripe"."stripe_tax_codes" to "service_role";

grant update on table "stripe"."stripe_tax_codes" to "service_role";

grant delete on table "stripe"."stripe_tax_rates" to "anon";

grant insert on table "stripe"."stripe_tax_rates" to "anon";

grant references on table "stripe"."stripe_tax_rates" to "anon";

grant select on table "stripe"."stripe_tax_rates" to "anon";

grant trigger on table "stripe"."stripe_tax_rates" to "anon";

grant truncate on table "stripe"."stripe_tax_rates" to "anon";

grant update on table "stripe"."stripe_tax_rates" to "anon";

grant delete on table "stripe"."stripe_tax_rates" to "authenticated";

grant insert on table "stripe"."stripe_tax_rates" to "authenticated";

grant references on table "stripe"."stripe_tax_rates" to "authenticated";

grant select on table "stripe"."stripe_tax_rates" to "authenticated";

grant trigger on table "stripe"."stripe_tax_rates" to "authenticated";

grant truncate on table "stripe"."stripe_tax_rates" to "authenticated";

grant update on table "stripe"."stripe_tax_rates" to "authenticated";

grant delete on table "stripe"."stripe_tax_rates" to "service_role";

grant insert on table "stripe"."stripe_tax_rates" to "service_role";

grant references on table "stripe"."stripe_tax_rates" to "service_role";

grant select on table "stripe"."stripe_tax_rates" to "service_role";

grant trigger on table "stripe"."stripe_tax_rates" to "service_role";

grant truncate on table "stripe"."stripe_tax_rates" to "service_role";

grant update on table "stripe"."stripe_tax_rates" to "service_role";

create policy "Allow authenticated read access"
on "stripe"."stripe_coupons"
as permissive
for select
to authenticated
using (true);


create policy "Allow read access for related invoice"
on "stripe"."stripe_invoice_line_items"
as permissive
for select
to public
using ((invoice_id IN ( SELECT stripe_invoices.id
   FROM stripe.stripe_invoices)));


create policy "Allow authenticated read access"
on "stripe"."stripe_prices"
as permissive
for select
to authenticated
using (true);


create policy "Allow authenticated read access"
on "stripe"."stripe_products"
as permissive
for select
to authenticated
using (true);


create policy "Allow authenticated read access for active codes"
on "stripe"."stripe_promotion_codes"
as permissive
for select
to authenticated
using ((active = true));


create policy "Allow read access for related quote"
on "stripe"."stripe_quote_line_items"
as permissive
for select
to public
using ((quote_id IN ( SELECT stripe_quotes.id
   FROM stripe.stripe_quotes)));


create policy "Allow public read access"
on "stripe"."stripe_tax_codes"
as permissive
for select
to public
using (true);


create policy "Allow public read access"
on "stripe"."stripe_tax_rates"
as permissive
for select
to public
using (true);



create schema if not exists "table_name_backup";


