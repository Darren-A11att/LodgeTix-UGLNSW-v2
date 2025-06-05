-- TABLES from remote schema

-- Core table definitions

ALTER SCHEMA "public" OWNER TO "pg_database_owner";

COMMENT ON SCHEMA "public" IS 'standard public schema';

ALTER DOMAIN "public"."uuid_type" OWNER TO "postgres";

COMMENT ON DOMAIN "public"."uuid_type" IS 'Custom UUID domain to distinguish UUID columns from regular strings in TypeScript type generation';

CREATE TABLE IF NOT EXISTS "public"."attendee_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "attendee_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "status" character varying(50) DEFAULT 'confirmed'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."attendee_events" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."attendees" (
    "attendee_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "attendee_type" "public"."attendee_type" NOT NULL,
    "dietary_requirements" "text",
    "special_needs" "text",
    "contact_preference" "public"."attendee_contact_preference" NOT NULL,
    "related_attendee_id" "uuid",
    "relationship" character varying(50),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text",
    "first_name" "text",
    "last_name" "text",
    "suffix" "text",
    "email" "text",
    "phone" "text",
    "is_primary" boolean DEFAULT false,
    "is_partner" "text",
    "has_partner" boolean DEFAULT false,
    "contact_id" "uuid",
    "event_title" "text",
    "person_id" "text",
    "auth_user_id" "uuid",
    "qr_code_url" "text"
);

ALTER TABLE "public"."attendees" OWNER TO "postgres";

COMMENT ON TABLE "public"."attendees" IS 'Represents an individual''s participation in a specific registration/event.';

COMMENT ON COLUMN "public"."attendees"."is_partner" IS 'UUID foreign key to another attendee who is the partner of this attendee';

COMMENT ON COLUMN "public"."attendees"."event_title" IS 'Event title stored for historical reference when attendee was registered';

COMMENT ON COLUMN "public"."attendees"."auth_user_id" IS 'Set for primary attendee when billing to primary attendee';

COMMENT ON COLUMN "public"."attendees"."qr_code_url" IS 'URL to the attendee QR code image stored in Supabase Storage';

CREATE TABLE IF NOT EXISTS "public"."customers" (
    "customer_id" "uuid" NOT NULL,
    "organisation_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "business_name" "text",
    "email" "text",
    "phone" "text",
    "billing_organisation_name" character varying,
    "billing_email" character varying,
    "billing_phone" character varying,
    "billing_street_address" character varying,
    "billing_city" character varying,
    "billing_state" character varying,
    "billing_postal_code" character varying,
    "billing_country" character varying,
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text",
    "stripe_customer_id" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contact_id" "uuid",
    "customer_type" "public"."customer_type"
);

ALTER TABLE "public"."customers" OWNER TO "postgres";

COMMENT ON TABLE "public"."customers" IS 'Customers are a subset of contacts who make purchases/bookings. Auth user access is through the linked contact record.';

COMMENT ON COLUMN "public"."customers"."customer_id" IS 'Primary key, auto-generated if not provided';

COMMENT ON COLUMN "public"."customers"."customer_type" IS 'Type of customer: booking_contact (handles event bookings), sponsor (provides sponsorship), donor (makes donations)';

ALTER TABLE "public"."auth_user_customer_view" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."connected_account_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_intent_id" "text" NOT NULL,
    "connected_account_id" "text" NOT NULL,
    "registration_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "platform_fee" numeric(10,2),
    "currency" "text" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."connected_account_payments" OWNER TO "postgres";

COMMENT ON TABLE "public"."connected_account_payments" IS 'Tracks payments processed through connected accounts';

CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "contact_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "suffix_1" "text",
    "suffix_2" "text",
    "suffix_3" "text",
    "contact_preference" "text",
    "mobile_number" "text",
    "email" "text" NOT NULL,
    "address_line_1" "text",
    "address_line_2" "text",
    "suburb_city" "text",
    "state" "text",
    "country" "text",
    "postcode" "text",
    "dietary_requirements" "text",
    "special_needs" "text",
    "type" "public"."contact_type" NOT NULL,
    "has_partner" boolean DEFAULT false,
    "is_partner" boolean DEFAULT false,
    "organisation_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "auth_user_id" "uuid",
    "billing_organisation_name" character varying(255),
    "billing_email" character varying(255),
    "billing_phone" character varying(255),
    "billing_street_address" character varying(255),
    "billing_city" character varying(255),
    "billing_state" character varying(255),
    "billing_postal_code" character varying(255),
    "billing_country" character varying(255),
    "stripe_customer_id" character varying(255),
    "business_name" "text",
    "source_type" "text",
    "source_id" "uuid"
);

ALTER TABLE "public"."contacts" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."functions" (
    "function_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "location_id" "uuid",
    "organiser_id" "uuid" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "function_events" "uuid"[]
);

ALTER TABLE "public"."functions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."locations" (
    "location_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_or_area" character varying(255),
    "place_name" character varying(255) NOT NULL,
    "street_address" character varying(255),
    "suburb" character varying(100),
    "state" character varying(100),
    "postal_code" character varying(20),
    "country" character varying(100),
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "capacity" integer,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE "public"."locations" OWNER TO "postgres";

COMMENT ON TABLE "public"."locations" IS 'Stores details about physical event locations/venues.';

CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "registration_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "registration_date" timestamp with time zone,
    "status" character varying(50),
    "total_amount_paid" numeric,
    "total_price_paid" numeric,
    "payment_status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status",
    "agree_to_terms" boolean DEFAULT false,
    "stripe_payment_intent_id" "text",
    "primary_attendee_id" "uuid",
    "registration_type" "public"."registration_type",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "registration_data" "jsonb",
    "confirmation_number" "text",
    "organisation_id" "uuid",
    "connected_account_id" "text",
    "platform_fee_amount" numeric(10,2),
    "platform_fee_id" "text",
    "confirmation_pdf_url" "text",
    "subtotal" numeric(10,2),
    "stripe_fee" numeric(10,2),
    "includes_processing_fee" boolean DEFAULT false,
    "function_id" "uuid" NOT NULL,
    "auth_user_id" "uuid",
    "organisation_name" "text",
    "organisation_number" "text",
    "primary_attendee" "text",
    "attendee_count" integer DEFAULT 0,
    "confirmation_generated_at" timestamp with time zone,
    CONSTRAINT "registrations_confirmation_number_format" CHECK ((("confirmation_number" IS NULL) OR ("confirmation_number" ~ '^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$'::"text")))
);

ALTER TABLE "public"."registrations" OWNER TO "postgres";

COMMENT ON TABLE "public"."registrations" IS '
WEBHOOK CONFIGURATION:
1. Go to Database Webhooks in Supabase Dashboard
2. Create new webhook with:
   - Name: generate_confirmation
   - Table: registrations
   - Events: UPDATE
   - URL: {SUPABASE_URL}/functions/v1/generate-confirmation
   - Headers: 
     - Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
     - Content-Type: application/json
   - Payload: Enable "Include record payload"
';

COMMENT ON COLUMN "public"."registrations"."registration_id" IS 'Primary key, auto-generated';

COMMENT ON COLUMN "public"."registrations"."customer_id" IS 'References the booking contact customer record';

COMMENT ON COLUMN "public"."registrations"."payment_status" IS 'Current payment status of the registration';

COMMENT ON COLUMN "public"."registrations"."registration_type" IS 'Type of registration: Individuals (single person), Groups (multiple people), Officials (event staff/organizers)';

COMMENT ON COLUMN "public"."registrations"."organisation_id" IS 'Reference to the organisation making this registration (e.g., Lodge, Grand Lodge)';

COMMENT ON COLUMN "public"."registrations"."connected_account_id" IS 'Stripe connected account ID that received the payment';

COMMENT ON COLUMN "public"."registrations"."platform_fee_amount" IS 'Platform/marketplace fee amount for connected accounts';

COMMENT ON COLUMN "public"."registrations"."platform_fee_id" IS 'Stripe application fee ID';

COMMENT ON COLUMN "public"."registrations"."confirmation_pdf_url" IS 'URL to the stored confirmation PDF for this registration';

COMMENT ON COLUMN "public"."registrations"."subtotal" IS 'Original ticket price total before any fees';

COMMENT ON COLUMN "public"."registrations"."stripe_fee" IS 'Stripe processing fee passed to customer';

COMMENT ON COLUMN "public"."registrations"."includes_processing_fee" IS 'Whether the total_amount includes the processing fee';

COMMENT ON COLUMN "public"."registrations"."auth_user_id" IS 'Auth user ID of the person who created the registration';

COMMENT ON COLUMN "public"."registrations"."organisation_name" IS 'Name of the organisation/lodge for lodge registrations';

COMMENT ON COLUMN "public"."registrations"."organisation_number" IS 'Number/ID of the organisation/lodge for lodge registrations';

COMMENT ON COLUMN "public"."registrations"."primary_attendee" IS 'Name of the primary attendee/representative (text, not foreign key)';

COMMENT ON COLUMN "public"."registrations"."attendee_count" IS 'Total number of attendees for the registration';

ALTER TABLE "public"."registration_confirmation_base_view" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "ticket_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "attendee_id" "uuid",
    "event_id" "uuid" NOT NULL,
    "price_paid" numeric(10,2) NOT NULL,
    "seat_info" character varying(100),
    "status" character varying(50) DEFAULT 'Active'::character varying NOT NULL,
    "checked_in_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "reservation_id" "uuid",
    "reservation_expires_at" timestamp with time zone,
    "original_price" numeric(10,2),
    "currency" character varying(3) DEFAULT 'AUD'::character varying,
    "payment_status" character varying(50) DEFAULT 'Unpaid'::character varying,
    "purchased_at" timestamp with time zone,
    "package_id" "uuid",
    "registration_id" "uuid",
    "ticket_type_id" "uuid",
    "ticket_price" numeric,
    "ticket_status" character varying(50),
    "is_partner_ticket" boolean DEFAULT false,
    "qr_code_url" "text",
    CONSTRAINT "check_valid_ticket_status" CHECK ((("status")::"text" = ANY ((ARRAY['available'::character varying, 'reserved'::character varying, 'sold'::character varying, 'used'::character varying, 'cancelled'::character varying])::"text"[]))),
    CONSTRAINT "tickets_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['available'::character varying, 'reserved'::character varying, 'sold'::character varying, 'used'::character varying, 'cancelled'::character varying])::"text"[])))
);

ALTER TABLE "public"."tickets" OWNER TO "postgres";

COMMENT ON TABLE "public"."tickets" IS 'Links an Attendee to a specific sub-event/session they are registered for.';

COMMENT ON COLUMN "public"."tickets"."qr_code_url" IS 'URL to the stored QR code image for this ticket';

ALTER TABLE "public"."delegation_registration_confirmation_view" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."display_scopes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."display_scopes" OWNER TO "postgres";

COMMENT ON TABLE "public"."display_scopes" IS 'Defines who can see an event (e.g., anonymous users, authenticated users).';

CREATE TABLE IF NOT EXISTS "public"."eligibility_criteria" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "criteria" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text"
);

ALTER TABLE "public"."eligibility_criteria" OWNER TO "postgres";

COMMENT ON TABLE "public"."eligibility_criteria" IS 'Defines who can register for an event (e.g., public, masons only).';

CREATE TABLE IF NOT EXISTS "public"."event_tickets" (
    "event_ticket_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "total_capacity" integer,
    "available_count" integer,
    "reserved_count" integer DEFAULT 0,
    "sold_count" integer DEFAULT 0,
    "status" character varying DEFAULT 'Active'::character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "eligibility_criteria" "jsonb" DEFAULT '{"rules": []}'::"jsonb",
    "stripe_price_id" "text"
);

ALTER TABLE "public"."event_tickets" OWNER TO "postgres";

COMMENT ON COLUMN "public"."event_tickets"."eligibility_criteria" IS 'Flexible eligibility criteria in JSONB format. Structure:
{
  "rules": [
    {
      "type": "attendee_type|registration_type|grand_lodge|mason_rank",
      "operator": "in|equals|not_in",
      "value": "string or array of strings"
    }
  ],
  "operator": "AND|OR" (default AND)
}';

COMMENT ON COLUMN "public"."event_tickets"."stripe_price_id" IS 'Stripe Price ID for this ticket type (synced to connected account)';

ALTER TABLE "public"."event_tickets_with_id" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."events" (
    "title" "text" NOT NULL,
    "description" "text",
    "type" "text",
    "is_purchasable_individually" boolean DEFAULT true,
    "max_attendees" bigint,
    "featured" boolean DEFAULT false,
    "image_url" "text",
    "event_includes" "text"[],
    "important_information" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_multi_day" boolean DEFAULT false,
    "event_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_availability_id" "uuid",
    "display_scope_id" "uuid",
    "slug" "text" NOT NULL,
    "event_start" timestamp with time zone,
    "event_end" timestamp with time zone,
    "location_id" "uuid",
    "subtitle" "text",
    "is_published" boolean DEFAULT true,
    "regalia" "text",
    "regalia_description" "text",
    "dress_code" "text",
    "degree_type" "text",
    "sections" "jsonb",
    "attendance" "jsonb",
    "documents" "jsonb",
    "related_events" "uuid"[],
    "organiser_id" "uuid",
    "reserved_count" integer DEFAULT 0 NOT NULL,
    "sold_count" integer DEFAULT 0 NOT NULL,
    "stripe_product_id" "text",
    "function_id" "uuid" NOT NULL,
    CONSTRAINT "check_reserved_count_non_negative" CHECK (("reserved_count" >= 0)),
    CONSTRAINT "check_sold_count_non_negative" CHECK (("sold_count" >= 0))
);

ALTER TABLE "public"."events" OWNER TO "postgres";

COMMENT ON TABLE "public"."events" IS 'Primary events table. Note: Has duplicate unique constraint on event_id that cannot be easily removed due to FK dependencies.';

COMMENT ON COLUMN "public"."events"."registration_availability_id" IS 'FK to registration_availabilities table, defining who can register.';

COMMENT ON COLUMN "public"."events"."display_scope_id" IS 'FK to display_scopes table, defining who can see the event.';

COMMENT ON COLUMN "public"."events"."reserved_count" IS 'Number of reserved tickets/spots for this event';

COMMENT ON COLUMN "public"."events"."sold_count" IS 'Number of sold tickets/spots for this event';

COMMENT ON COLUMN "public"."events"."stripe_product_id" IS 'Stripe Product ID for this event (synced to connected account)';

ALTER TABLE "public"."events_with_id" OWNER TO "postgres";

ALTER TABLE "public"."function_event_tickets_view" OWNER TO "postgres";

COMMENT ON VIEW "public"."function_event_tickets_view" IS 'View to get all active event tickets for events within a specific function. Query by function_id to get all event tickets for events in that function.';

CREATE TABLE IF NOT EXISTS "public"."packages" (
    "package_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "original_price" numeric(10,2),
    "discount" numeric(10,2) DEFAULT 0,
    "package_price" numeric(10,2) NOT NULL,
    "is_active" boolean DEFAULT true,
    "includes_description" "text"[],
    "qty" integer DEFAULT 1,
    "included_items" "public"."package_item"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "eligibility_criteria" "jsonb" DEFAULT '{"rules": []}'::"jsonb",
    "function_id" "uuid" NOT NULL,
    "registration_types" "text"[],
    CONSTRAINT "registration_types_check" CHECK (("registration_types" <@ ARRAY['individuals'::"text", 'lodges'::"text", 'delegations'::"text"]))
);

ALTER TABLE "public"."packages" OWNER TO "postgres";

COMMENT ON TABLE "public"."packages" IS 'Consolidated packages table that combines event packages with their included tickets and pricing';

COMMENT ON COLUMN "public"."packages"."event_id" IS 'Reference to the specific event this package is for';

COMMENT ON COLUMN "public"."packages"."qty" IS 'Multiplier for included items - if qty=5 and package includes 3 tickets, customer gets 5 of each ticket';

COMMENT ON COLUMN "public"."packages"."included_items" IS 'Array of event_ticket_ids with quantities included in this package';

COMMENT ON COLUMN "public"."packages"."eligibility_criteria" IS 'Flexible eligibility criteria in JSONB format. Structure:
{
  "rules": [
    {
      "type": "attendee_type|registration_type|grand_lodge|mason_rank",
      "operator": "in|equals|not_in",
      "value": "string or array of strings"
    }
  ],
  "operator": "AND|OR" (default AND)
}';

COMMENT ON COLUMN "public"."packages"."registration_types" IS 'Multiple selection of registration types: individuals, lodges, delegations. NULL means no restrictions.';

ALTER TABLE "public"."function_packages_view" OWNER TO "postgres";

COMMENT ON VIEW "public"."function_packages_view" IS 'View combining functions with their active packages, including registration types';

CREATE TABLE IF NOT EXISTS "public"."grand_lodges" (
    "name" "text" NOT NULL,
    "country" "text",
    "abbreviation" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "grand_lodge_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_code_iso3" "text",
    "state_region" "text",
    "state_region_code" "text",
    "organisation_id" "uuid"
);

ALTER TABLE "public"."grand_lodges" OWNER TO "postgres";

COMMENT ON TABLE "public"."grand_lodges" IS 'Grand Lodges table. Note: Has duplicate unique constraint on grand_lodge_id that cannot be easily removed due to FK dependencies.';

COMMENT ON COLUMN "public"."grand_lodges"."organisation_id" IS 'Reference to the corresponding organisation record';

ALTER TABLE "public"."individuals_registration_confirmation_view" OWNER TO "postgres";

ALTER TABLE "public"."lodge_registration_confirmation_view" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."lodges" (
    "lodge_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "number" numeric,
    "display_name" "text",
    "district" "text",
    "meeting_place" "text",
    "area_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "grand_lodge_id" "uuid",
    "state_region" "text",
    "organisation_id" "uuid"
);

ALTER TABLE "public"."lodges" OWNER TO "postgres";

COMMENT ON TABLE "public"."lodges" IS 'Stores details about individual Lodges.';

COMMENT ON COLUMN "public"."lodges"."organisation_id" IS 'Reference to the corresponding organisation record';

CREATE TABLE IF NOT EXISTS "public"."masonic_profiles" (
    "masonic_profile_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "masonic_title" character varying(50),
    "rank" character varying(50),
    "grand_rank" character varying(50),
    "grand_officer" character varying(50),
    "grand_office" character varying(100),
    "lodge_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "grand_lodge_id" "uuid",
    "contact_id" "uuid",
    CONSTRAINT "check_masonic_affiliation" CHECK ((("lodge_id" IS NOT NULL) OR ("grand_lodge_id" IS NOT NULL)))
);

ALTER TABLE "public"."masonic_profiles" OWNER TO "postgres";

COMMENT ON TABLE "public"."masonic_profiles" IS 'Stores reusable Masonic details linked to a Contact.';

COMMENT ON COLUMN "public"."masonic_profiles"."lodge_id" IS 'Reference to Lodge organisation (optional if only affiliated with Grand Lodge)';

COMMENT ON COLUMN "public"."masonic_profiles"."grand_lodge_id" IS 'Reference to Grand Lodge organisation (may be set independently of lodge)';

CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "membership_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "profile_id" "uuid",
    "role" character varying(50) DEFAULT 'member'::character varying,
    "permissions" "text"[] DEFAULT ARRAY['read'::"text", 'update_own_data'::"text"],
    "membership_type" character varying(50) NOT NULL,
    "membership_entity_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE "public"."memberships" OWNER TO "postgres";

COMMENT ON TABLE "public"."memberships" IS 'Simple memberships table linking contacts to various entities (lodges, grand lodges, organisations) with roles and permissions';

CREATE TABLE IF NOT EXISTS "public"."organisations" (
    "organisation_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "type" "public"."organisation_type" NOT NULL,
    "street_address" character varying(255),
    "city" character varying(100),
    "state" character varying(100),
    "postal_code" character varying(20),
    "country" character varying(100),
    "website" character varying(255),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "known_as" "text",
    "abbreviation" "text",
    "stripe_onbehalfof" "text",
    "stripe_account_status" "text" DEFAULT 'pending'::"text",
    "stripe_payouts_enabled" boolean DEFAULT false,
    "stripe_details_submitted" boolean DEFAULT false,
    "stripe_capabilities" "jsonb"
);

ALTER TABLE "public"."organisations" OWNER TO "postgres";

COMMENT ON TABLE "public"."organisations" IS 'Organisations table. Note: Has duplicate unique constraint on organisation_id that cannot be easily removed due to FK dependencies.';

COMMENT ON COLUMN "public"."organisations"."stripe_onbehalfof" IS 'Stripe Connect account ID for processing charges on behalf of this organisation';

COMMENT ON COLUMN "public"."organisations"."stripe_account_status" IS 'Status of Stripe Connect account: pending, active, restricted, etc';

COMMENT ON COLUMN "public"."organisations"."stripe_capabilities" IS 'JSON object containing Stripe capability statuses';

ALTER TABLE "public"."memberships_view" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."organisation_payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payout_id" "text" NOT NULL,
    "organisation_stripe_id" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" NOT NULL,
    "status" "text" NOT NULL,
    "arrival_date" timestamp with time zone NOT NULL,
    "method" "text",
    "description" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."organisation_payouts" OWNER TO "postgres";

COMMENT ON TABLE "public"."organisation_payouts" IS 'Tracks Stripe payouts to connected accounts';

CREATE TABLE IF NOT EXISTS "public"."organisation_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organisation_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."organisation_users" OWNER TO "postgres";

COMMENT ON TABLE "public"."organisation_users" IS 'Manages relationships between users and organisations for the organiser portal. Users must have an entry here to access organisation data.';

CREATE TABLE IF NOT EXISTS "public"."platform_transfers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transfer_id" "text" NOT NULL,
    "source_transaction" "text",
    "destination_account" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."platform_transfers" OWNER TO "postgres";

COMMENT ON TABLE "public"."platform_transfers" IS 'Tracks transfers from platform to connected accounts';

CREATE TABLE IF NOT EXISTS "public"."raw_payloads" (
    "raw_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "raw_data" "jsonb"
);

ALTER TABLE "public"."raw_payloads" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."raw_registrations" (
    "raw_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "raw_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."raw_registrations" OWNER TO "postgres";

ALTER TABLE "public"."ticket_availability_view" OWNER TO "postgres";

ALTER TABLE "public"."tickets_with_id" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."user_roles" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "webhook_name" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "text",
    "event_type" "text" NOT NULL,
    "payload" "jsonb",
    "response" "jsonb",
    "status_code" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";

ALTER TABLE ONLY "public"."attendee_events"
    ADD CONSTRAINT "attendee_events_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."attendees"
    ADD CONSTRAINT "attendees_pkey" PRIMARY KEY ("attendee_id");

ALTER TABLE ONLY "public"."connected_account_payments"
    ADD CONSTRAINT "connected_account_payments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("contact_id");

ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_consolidated_pkey" PRIMARY KEY ("customer_id");

ALTER TABLE ONLY "public"."display_scopes"
    ADD CONSTRAINT "display_scopes_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."display_scopes"
    ADD CONSTRAINT "display_scopes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."event_tickets"
    ADD CONSTRAINT "event_tickets_pkey" PRIMARY KEY ("event_ticket_id");

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_id_uuid_unique" UNIQUE ("event_id");

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("event_id");

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."functions"
    ADD CONSTRAINT "functions_pkey" PRIMARY KEY ("function_id");

ALTER TABLE ONLY "public"."functions"
    ADD CONSTRAINT "functions_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."grand_lodges"
    ADD CONSTRAINT "grand_lodges_id_uuid_unique" UNIQUE ("grand_lodge_id");

ALTER TABLE ONLY "public"."grand_lodges"
    ADD CONSTRAINT "grand_lodges_pkey" PRIMARY KEY ("grand_lodge_id");

ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("location_id");

ALTER TABLE ONLY "public"."lodges"
    ADD CONSTRAINT "lodges_pkey" PRIMARY KEY ("lodge_id");

ALTER TABLE ONLY "public"."masonic_profiles"
    ADD CONSTRAINT "masonic_profiles_contact_id_unique" UNIQUE ("contact_id");

ALTER TABLE ONLY "public"."masonic_profiles"
    ADD CONSTRAINT "masonicprofiles_pkey" PRIMARY KEY ("masonic_profile_id");

ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("membership_id");

ALTER TABLE ONLY "public"."organisation_payouts"
    ADD CONSTRAINT "organisation_payouts_payout_id_key" UNIQUE ("payout_id");

ALTER TABLE ONLY "public"."organisation_payouts"
    ADD CONSTRAINT "organisation_payouts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organisation_users"
    ADD CONSTRAINT "organisation_users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organisation_users"
    ADD CONSTRAINT "organisation_users_user_id_organisation_id_key" UNIQUE ("user_id", "organisation_id");

ALTER TABLE ONLY "public"."organisations"
    ADD CONSTRAINT "organisations_organisationid_key" UNIQUE ("organisation_id");

ALTER TABLE ONLY "public"."organisations"
    ADD CONSTRAINT "organisations_pkey" PRIMARY KEY ("organisation_id");

ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_pkey1" PRIMARY KEY ("package_id");

ALTER TABLE ONLY "public"."platform_transfers"
    ADD CONSTRAINT "platform_transfers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."platform_transfers"
    ADD CONSTRAINT "platform_transfers_transfer_id_key" UNIQUE ("transfer_id");

ALTER TABLE ONLY "public"."raw_payloads"
    ADD CONSTRAINT "raw_registrations_pkey" PRIMARY KEY ("raw_id");

ALTER TABLE ONLY "public"."raw_registrations"
    ADD CONSTRAINT "raw_registrations_pkey1" PRIMARY KEY ("raw_id");

ALTER TABLE ONLY "public"."eligibility_criteria"
    ADD CONSTRAINT "registration_availabilities_name_key" UNIQUE ("criteria");

ALTER TABLE ONLY "public"."eligibility_criteria"
    ADD CONSTRAINT "registration_availabilities_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_confirmation_number_unique" UNIQUE ("confirmation_number");

ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("registration_id");

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_attendeeid_eventid_key" UNIQUE ("attendee_id", "event_id");

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("ticket_id");

ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "unique_membership" UNIQUE ("contact_id", "membership_type", "membership_entity_id");

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");

ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");

COMMENT ON INDEX "public"."idx_attendees_contact" IS 'Contact lookup for attendees to join with masonic profiles';

COMMENT ON INDEX "public"."idx_attendees_registration" IS 'All attendees for a registration';

COMMENT ON INDEX "public"."idx_attendees_registration_primary" IS 'Quick primary attendee lookup';

COMMENT ON INDEX "public"."idx_attendees_related" IS 'Find related attendees (partners)';

COMMENT ON INDEX "public"."idx_connected_payments_registration" IS 'Connected account payment history';

COMMENT ON INDEX "public"."idx_contacts_auth_user" IS 'Contact record for authenticated user';

COMMENT ON INDEX "public"."idx_contacts_email_lower" IS 'Case-insensitive email search';

COMMENT ON INDEX "public"."idx_event_tickets_active_available" IS 'Available tickets for sale';

COMMENT ON INDEX "public"."idx_event_tickets_event_active" IS 'Active ticket types for an event';

COMMENT ON INDEX "public"."idx_events_date_range" IS 'Date range queries for published events';

COMMENT ON INDEX "public"."idx_events_featured_published" IS 'Fast retrieval of featured published events sorted by start date';

COMMENT ON INDEX "public"."idx_events_location_org" IS 'Composite index for event display view';

COMMENT ON INDEX "public"."idx_events_organiser" IS 'Organisation events listing';

COMMENT ON INDEX "public"."idx_events_slug" IS 'Fast lookup of events by URL slug';

COMMENT ON INDEX "public"."idx_lodges_grand_lodge" IS 'Lodges under a grand lodge';

COMMENT ON INDEX "public"."idx_masonic_profiles_contact" IS 'Masonic profile lookup by contact';

COMMENT ON INDEX "public"."idx_memberships_contact_active" IS 'Active memberships for a contact';

COMMENT ON INDEX "public"."idx_registrations_payment_intent" IS 'Payment lookup by Stripe payment intent';

COMMENT ON INDEX "public"."idx_registrations_payment_status" IS 'Registrations by payment status sorted by date';

COMMENT ON INDEX "public"."idx_registrations_recent" IS 'Recent registrations for dashboards - queries should add date filter';

COMMENT ON INDEX "public"."idx_registrations_stripe_intent" IS 'Fast lookup by Stripe payment intent ID';

COMMENT ON INDEX "public"."idx_registrations_type_status" IS 'Registrations by type and status';

COMMENT ON INDEX "public"."idx_tickets_attendee" IS 'Tickets assigned to an attendee';

COMMENT ON INDEX "public"."idx_tickets_registration_paid" IS 'Sold tickets for registration summary';

COMMENT ON INDEX "public"."idx_tickets_registration_status" IS 'All tickets for a registration with status';

COMMENT ON INDEX "public"."idx_tickets_reservation_expiry" IS 'Find expired ticket reservations';

COMMENT ON INDEX "public"."idx_tickets_type_event" IS 'Tickets by type and event';

ALTER TABLE ONLY "public"."attendee_events"
    ADD CONSTRAINT "attendee_events_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("attendee_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."attendee_events"
    ADD CONSTRAINT "attendee_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."attendees"
    ADD CONSTRAINT "attendees_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."attendees"
    ADD CONSTRAINT "attendees_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("contact_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."attendees"
    ADD CONSTRAINT "attendees_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("registration_id");

ALTER TABLE ONLY "public"."attendees"
    ADD CONSTRAINT "attendees_related_attendee_id_fkey" FOREIGN KEY ("related_attendee_id") REFERENCES "public"."attendees"("attendee_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."connected_account_payments"
    ADD CONSTRAINT "connected_account_payments_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("registration_id");

ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("organisation_id");

ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("contact_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."event_tickets"
    ADD CONSTRAINT "event_tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id");

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_display_scope_id_fkey" FOREIGN KEY ("display_scope_id") REFERENCES "public"."display_scopes"("id");

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "public"."functions"("function_id");

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_locationid_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_organiser_id_fkey" FOREIGN KEY ("organiser_id") REFERENCES "public"."organisations"("organisation_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_registration_availability_id_fkey" FOREIGN KEY ("registration_availability_id") REFERENCES "public"."eligibility_criteria"("id");

ALTER TABLE ONLY "public"."functions"
    ADD CONSTRAINT "functions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");

ALTER TABLE ONLY "public"."functions"
    ADD CONSTRAINT "functions_organiser_id_fkey" FOREIGN KEY ("organiser_id") REFERENCES "public"."organisations"("organisation_id");

ALTER TABLE ONLY "public"."grand_lodges"
    ADD CONSTRAINT "grand_lodges_organisationid_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("organisation_id");

ALTER TABLE ONLY "public"."lodges"
    ADD CONSTRAINT "lodges_grand_lodge_id_fkey" FOREIGN KEY ("grand_lodge_id") REFERENCES "public"."grand_lodges"("grand_lodge_id") ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."lodges"
    ADD CONSTRAINT "lodges_organisationid_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("organisation_id");

ALTER TABLE ONLY "public"."masonic_profiles"
    ADD CONSTRAINT "masonic_profiles_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("contact_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."masonic_profiles"
    ADD CONSTRAINT "masonic_profiles_grand_lodge_id_fkey" FOREIGN KEY ("grand_lodge_id") REFERENCES "public"."organisations"("organisation_id");

ALTER TABLE ONLY "public"."masonic_profiles"
    ADD CONSTRAINT "masonic_profiles_lodge_id_fkey" FOREIGN KEY ("lodge_id") REFERENCES "public"."organisations"("organisation_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("contact_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."masonic_profiles"("masonic_profile_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."organisation_users"
    ADD CONSTRAINT "organisation_users_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("organisation_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."organisation_users"
    ADD CONSTRAINT "organisation_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "public"."functions"("function_id");

ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "public"."functions"("function_id");

ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("organisation_id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_attendeeid_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("attendee_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_eventid_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("package_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("registration_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."event_tickets"("event_ticket_id") ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

COMMENT ON POLICY "Anonymous users can create own registrations" ON "public"."registrations" IS 'Allows anonymous users to create registrations. This is needed for lodge registrations where users may not have accounts.';

COMMENT ON POLICY "customers_auth_insert_own" ON "public"."customers" IS 'Fixed to use customer_id instead of id';

COMMENT ON POLICY "customers_auth_select_own" ON "public"."customers" IS 'Fixed to use customer_id instead of id';

COMMENT ON POLICY "customers_auth_update_own" ON "public"."customers" IS 'Fixed to use customer_id instead of id';

COMMENT ON POLICY "registrations_auth_select_organizer" ON "public"."registrations" IS 'Fixed to use function_id instead of event_id';

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";
