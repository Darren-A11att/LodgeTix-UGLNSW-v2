-- TYPES from remote schema

-- Custom types and enums

CREATE TYPE "public"."URL" AS ENUM (
    'url'
);

ALTER TYPE "public"."URL" OWNER TO "postgres";

CREATE TYPE "public"."attendee_contact_preference" AS ENUM (
    'directly',
    'primaryattendee',
    'mason',
    'guest',
    'providelater'
);

ALTER TYPE "public"."attendee_contact_preference" OWNER TO "postgres";

CREATE TYPE "public"."attendee_type" AS ENUM (
    'mason',
    'guest',
    'ladypartner',
    'guestpartner'
);

ALTER TYPE "public"."attendee_type" OWNER TO "postgres";

CREATE TYPE "public"."billing_reason" AS ENUM (
    'subscription_cycle',
    'subscription_create',
    'subscription_update',
    'subscription_threshold',
    'manual',
    'upcoming',
    'quote_accept'
);

ALTER TYPE "public"."billing_reason" OWNER TO "postgres";

CREATE TYPE "public"."billing_scheme" AS ENUM (
    'per_unit',
    'tiered'
);

ALTER TYPE "public"."billing_scheme" OWNER TO "postgres";

CREATE TYPE "public"."collection_method" AS ENUM (
    'charge_automatically',
    'send_invoice'
);

ALTER TYPE "public"."collection_method" OWNER TO "postgres";

CREATE TYPE "public"."contact_type" AS ENUM (
    'individual',
    'organisation'
);

ALTER TYPE "public"."contact_type" OWNER TO "postgres";

CREATE TYPE "public"."customer_type" AS ENUM (
    'booking_contact',
    'sponsor',
    'donor'
);

ALTER TYPE "public"."customer_type" OWNER TO "postgres";

CREATE TYPE "public"."invoice_status" AS ENUM (
    'draft',
    'open',
    'paid',
    'void',
    'uncollectible'
);

ALTER TYPE "public"."invoice_status" OWNER TO "postgres";

CREATE TYPE "public"."organisation_type" AS ENUM (
    'lodge',
    'grandlodge',
    'masonicorder',
    'company',
    'other'
);

ALTER TYPE "public"."organisation_type" OWNER TO "postgres";

CREATE TYPE "public"."package_item" AS (
	"event_ticket_id" "uuid",
	"quantity" integer
);

ALTER TYPE "public"."package_item" OWNER TO "postgres";

CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded',
    'partially_refunded',
    'cancelled',
    'expired',
    'Unpaid',
    'unpaid'
);

ALTER TYPE "public"."payment_status" OWNER TO "postgres";

COMMENT ON TYPE "public"."payment_status" IS 'Status of payment for a registration';

CREATE TYPE "public"."price_type" AS ENUM (
    'one_time',
    'recurring'
);

ALTER TYPE "public"."price_type" OWNER TO "postgres";

CREATE TYPE "public"."quote_status" AS ENUM (
    'draft',
    'open',
    'accepted',
    'canceled',
    'expired'
);

ALTER TYPE "public"."quote_status" OWNER TO "postgres";

CREATE TYPE "public"."registration_type" AS ENUM (
    'individuals',
    'groups',
    'officials',
    'lodge',
    'delegation'
);

ALTER TYPE "public"."registration_type" OWNER TO "postgres";

COMMENT ON TYPE "public"."registration_type" IS 'Types of event registrations: Individuals (single person), Groups (multiple people), Officials (event staff/organizers)';

CREATE TYPE "public"."stripe_order_status" AS ENUM (
    'pending',
    'completed',
    'canceled'
);

ALTER TYPE "public"."stripe_order_status" OWNER TO "postgres";

CREATE TYPE "public"."stripe_subscription_status" AS ENUM (
    'not_started',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);

ALTER TYPE "public"."stripe_subscription_status" OWNER TO "postgres";

CREATE TYPE "public"."tax_behavior" AS ENUM (
    'inclusive',
    'exclusive',
    'unspecified'
);

ALTER TYPE "public"."tax_behavior" OWNER TO "postgres";

COMMENT ON COLUMN "public"."registrations"."confirmation_number" IS 'Unique confirmation number in format: [TYPE][YEAR][MONTH][RANDOM] where TYPE is IND/LDG/DEL, followed by YYYYMM and 2 random digits + 2 letters';
