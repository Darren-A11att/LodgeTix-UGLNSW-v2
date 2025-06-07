

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



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


CREATE DOMAIN "public"."uuid_type" AS "uuid";


ALTER DOMAIN "public"."uuid_type" OWNER TO "postgres";


COMMENT ON DOMAIN "public"."uuid_type" IS 'Custom UUID domain to distinguish UUID columns from regular strings in TypeScript type generation';



CREATE OR REPLACE FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
    v_result JSON;
    v_pricing_data JSONB := '[]'::jsonb;
    v_event_record RECORD;
BEGIN
    -- Input validation
    IF p_event_ids IS NULL OR array_length(p_event_ids, 1) = 0 THEN
        RAISE EXCEPTION 'At least one event ID is required';
    END IF;

    -- Process each event
    FOR v_event_record IN
        SELECT 
            e.event_id,
            e.slug,
            e.title,
            e.is_multi_day,
            e.event_start,
            e.event_end,
            -- Get minimum ticket price
            COALESCE(
                (SELECT MIN(et.price) 
                 FROM event_tickets et 
                 WHERE et.event_id = e.event_id 
                   AND et.is_active = true 
                   AND et.status = 'Active'
                   AND et.available_count > 0),
                0
            ) AS min_ticket_price,
            -- Check if any free tickets exist
            EXISTS (
                SELECT 1 
                FROM event_tickets et 
                WHERE et.event_id = e.event_id 
                  AND et.is_active = true 
                  AND et.status = 'Active'
                  AND et.price = 0
                  AND et.available_count > 0
            ) AS has_free_tickets,
            -- Get all ticket prices
            COALESCE(
                (SELECT array_agg(DISTINCT et.price ORDER BY et.price)
                 FROM event_tickets et 
                 WHERE et.event_id = e.event_id 
                   AND et.is_active = true 
                   AND et.status = 'Active'
                   AND et.available_count > 0),
                ARRAY[]::numeric[]
            ) AS ticket_prices,
            -- Get minimum package price if event is part of packages
            COALESCE(
                (SELECT MIN(p.price)
                 FROM packages p
                 WHERE e.event_id = ANY(p.included_event_ids)
                   AND p.status = 'Active'),
                NULL
            ) AS min_package_price,
            -- Count of available ticket types
            (SELECT COUNT(DISTINCT et.id)
             FROM event_tickets et 
             WHERE et.event_id = e.event_id 
               AND et.is_active = true 
               AND et.status = 'Active'
               AND et.available_count > 0
            ) AS available_ticket_types,
            -- Total available tickets
            (SELECT SUM(et.available_count)
             FROM event_tickets et 
             WHERE et.event_id = e.event_id 
               AND et.is_active = true 
               AND et.status = 'Active'
            ) AS total_available_tickets,
            -- Check if sold out
            NOT EXISTS (
                SELECT 1 
                FROM event_tickets et 
                WHERE et.event_id = e.event_id 
                  AND et.is_active = true 
                  AND et.status = 'Active'
                  AND et.available_count > 0
            ) AS is_sold_out
        FROM events e
        WHERE e.event_id = ANY(p_event_ids)
    LOOP
        -- Add to pricing data
        v_pricing_data := v_pricing_data || jsonb_build_object(
            'event_id', v_event_record.event_id,
            'slug', v_event_record.slug,
            'title', v_event_record.title,
            'pricing', jsonb_build_object(
                'min_price', LEAST(
                    v_event_record.min_ticket_price,
                    COALESCE(v_event_record.min_package_price, v_event_record.min_ticket_price)
                ),
                'min_ticket_price', v_event_record.min_ticket_price,
                'min_package_price', v_event_record.min_package_price,
                'has_free_tickets', v_event_record.has_free_tickets,
                'ticket_prices', v_event_record.ticket_prices,
                'price_range', CASE
                    WHEN array_length(v_event_record.ticket_prices, 1) > 1 THEN
                        jsonb_build_object(
                            'min', v_event_record.ticket_prices[1],
                            'max', v_event_record.ticket_prices[array_length(v_event_record.ticket_prices, 1)]
                        )
                    ELSE NULL
                END,
                'available_ticket_types', v_event_record.available_ticket_types,
                'total_available_tickets', v_event_record.total_available_tickets,
                'is_sold_out', v_event_record.is_sold_out,
                'display_price', CASE
                    WHEN v_event_record.is_sold_out THEN 'Sold Out'
                    WHEN v_event_record.has_free_tickets AND v_event_record.min_ticket_price = 0 THEN 'Free'
                    WHEN v_event_record.has_free_tickets THEN 'Free - $' || v_event_record.min_ticket_price::text
                    WHEN array_length(v_event_record.ticket_prices, 1) > 1 THEN 
                        '$' || v_event_record.ticket_prices[1]::text || ' - $' || 
                        v_event_record.ticket_prices[array_length(v_event_record.ticket_prices, 1)]::text
                    ELSE '$' || v_event_record.min_ticket_price::text
                END
            ),
            'event_info', jsonb_build_object(
                'is_multi_day', v_event_record.is_multi_day,
                'event_start', v_event_record.event_start,
                'event_end', v_event_record.event_end
            )
        );
    END LOOP;

    -- Also check for child events that might affect pricing
    FOR v_event_record IN
        SELECT 
            pe.event_id AS parent_event_id,
            MIN(ce_min.min_price) AS child_min_price,
            BOOL_OR(ce_min.min_price = 0) AS child_has_free
        FROM events pe
        JOIN events ce ON ce.parent_event_id = pe.event_id
        JOIN LATERAL (
            SELECT COALESCE(MIN(et.price), 0) AS min_price
            FROM event_tickets et
            WHERE et.event_id = ce.event_id
              AND et.is_active = true
              AND et.status = 'Active'
              AND et.available_count > 0
        ) ce_min ON true
        WHERE pe.event_id = ANY(p_event_ids)
        GROUP BY pe.event_id
    LOOP
        -- Update parent event pricing if children have lower prices
        FOR i IN 0..jsonb_array_length(v_pricing_data) - 1 LOOP
            IF v_pricing_data->i->>'event_id' = v_event_record.parent_event_id::text THEN
                v_pricing_data := jsonb_set(
                    v_pricing_data,
                    ARRAY[i::text, 'pricing', 'includes_child_events'],
                    'true'::jsonb
                );
                
                IF v_event_record.child_min_price < (v_pricing_data->i->'pricing'->>'min_price')::numeric THEN
                    v_pricing_data := jsonb_set(
                        v_pricing_data,
                        ARRAY[i::text, 'pricing', 'min_price_with_children'],
                        to_jsonb(v_event_record.child_min_price)
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    v_result := v_pricing_data::json;
    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in calculate_event_pricing: % %', SQLERRM, SQLSTATE;
END;
$_$;


ALTER FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) IS 'Batch calculates pricing information for multiple events including minimum prices, price ranges, package pricing, and availability status. Returns detailed pricing data for each event.';



CREATE OR REPLACE FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSON;
    v_ticket_data JSONB := '[]'::jsonb;
    v_ticket_type RECORD;
    v_event_capacity INTEGER;
    v_total_sold INTEGER := 0;
    v_total_reserved INTEGER := 0;
    v_total_available INTEGER := 0;
    v_expired_count INTEGER;
BEGIN
    -- Input validation
    IF p_event_id IS NULL THEN
        RAISE EXCEPTION 'Event ID is required';
    END IF;

    -- Check if event exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM events 
        WHERE event_id = p_event_id 
          AND is_published = true
    ) THEN
        RAISE EXCEPTION 'Event not found or not published: %', p_event_id;
    END IF;

    -- Clean up expired reservations for this event first
    DELETE FROM tickets
    WHERE event_id = p_event_id
      AND status = 'reserved'
      AND reservation_expires_at < NOW()
    RETURNING COUNT(*) INTO v_expired_count;

    -- Update ticket counts if any expired reservations were cleaned up
    IF v_expired_count > 0 THEN
        UPDATE event_tickets et
        SET reserved_count = (
                SELECT COUNT(*) 
                FROM tickets t 
                WHERE t.ticket_type_id = et.id 
                  AND t.status = 'reserved'
            ),
            available_count = total_capacity - sold_count - (
                SELECT COUNT(*) 
                FROM tickets t 
                WHERE t.ticket_type_id = et.id 
                  AND t.status = 'reserved'
            ),
            updated_at = NOW()
        WHERE et.event_id = p_event_id;
    END IF;

    -- Get detailed availability for each ticket type
    FOR v_ticket_type IN
        SELECT 
            et.id AS ticket_type_id,
            et.name AS ticket_type_name,
            et.description,
            et.price,
            et.total_capacity,
            et.available_count,
            et.reserved_count,
            et.sold_count,
            et.status,
            et.is_active,
            et.eligibility_criteria,
            et.created_at,
            et.updated_at,
            -- Count active reservations
            (SELECT COUNT(*) 
             FROM tickets t 
             WHERE t.ticket_type_id = et.id 
               AND t.status = 'reserved'
               AND t.reservation_expires_at > NOW()
            ) AS active_reservations,
            -- Calculate actual available
            GREATEST(
                0,
                et.available_count - (
                    SELECT COUNT(*) 
                    FROM tickets t 
                    WHERE t.ticket_type_id = et.id 
                      AND t.status = 'reserved'
                      AND t.reservation_expires_at > NOW()
                )
            ) AS actual_available,
            -- Get next expiring reservation
            (SELECT MIN(t.reservation_expires_at)
             FROM tickets t
             WHERE t.ticket_type_id = et.id
               AND t.status = 'reserved'
               AND t.reservation_expires_at > NOW()
            ) AS next_reservation_expiry,
            -- Waitlist info
            et.waitlist_count,
            et.max_waitlist
        FROM event_tickets et
        WHERE et.event_id = p_event_id
          AND et.is_active = true
        ORDER BY et.price, et.name
    LOOP
        -- Add to totals
        v_total_sold := v_total_sold + v_ticket_type.sold_count;
        v_total_reserved := v_total_reserved + v_ticket_type.active_reservations;
        v_total_available := v_total_available + v_ticket_type.actual_available;

        -- Build ticket availability data
        v_ticket_data := v_ticket_data || jsonb_build_object(
            'ticket_type_id', v_ticket_type.ticket_type_id,
            'name', v_ticket_type.ticket_type_name,
            'description', v_ticket_type.description,
            'price', v_ticket_type.price,
            'capacity', jsonb_build_object(
                'total', v_ticket_type.total_capacity,
                'sold', v_ticket_type.sold_count,
                'reserved', v_ticket_type.active_reservations,
                'available', v_ticket_type.actual_available
            ),
            'availability', jsonb_build_object(
                'status', CASE
                    WHEN v_ticket_type.status != 'Active' THEN 'inactive'
                    WHEN v_ticket_type.actual_available = 0 AND v_ticket_type.waitlist_count < COALESCE(v_ticket_type.max_waitlist, 0) THEN 'waitlist'
                    WHEN v_ticket_type.actual_available = 0 THEN 'sold_out'
                    WHEN v_ticket_type.actual_available <= 10 THEN 'limited'
                    ELSE 'available'
                END,
                'is_available', v_ticket_type.actual_available > 0,
                'percentage_sold', CASE
                    WHEN v_ticket_type.total_capacity > 0 THEN
                        ROUND((v_ticket_type.sold_count::numeric / v_ticket_type.total_capacity::numeric) * 100, 2)
                    ELSE 0
                END,
                'next_available_time', v_ticket_type.next_reservation_expiry,
                'message', CASE
                    WHEN v_ticket_type.actual_available = 0 AND v_ticket_type.next_reservation_expiry IS NOT NULL THEN
                        'Sold out - tickets may become available at ' || TO_CHAR(v_ticket_type.next_reservation_expiry, 'HH12:MI AM')
                    WHEN v_ticket_type.actual_available = 0 AND v_ticket_type.waitlist_count < COALESCE(v_ticket_type.max_waitlist, 0) THEN
                        'Join waitlist'
                    WHEN v_ticket_type.actual_available = 0 THEN
                        'Sold out'
                    WHEN v_ticket_type.actual_available <= 5 THEN
                        'Only ' || v_ticket_type.actual_available || ' left!'
                    WHEN v_ticket_type.actual_available <= 10 THEN
                        'Limited availability'
                    ELSE NULL
                END
            ),
            'waitlist', CASE
                WHEN v_ticket_type.max_waitlist > 0 THEN
                    jsonb_build_object(
                        'enabled', true,
                        'count', v_ticket_type.waitlist_count,
                        'max', v_ticket_type.max_waitlist,
                        'available_spots', GREATEST(0, v_ticket_type.max_waitlist - v_ticket_type.waitlist_count)
                    )
                ELSE NULL
            END,
            'eligibility_criteria', v_ticket_type.eligibility_criteria,
            'last_updated', v_ticket_type.updated_at
        );
    END LOOP;

    -- Get event capacity
    SELECT COALESCE(SUM(total_capacity), 0) INTO v_event_capacity
    FROM event_tickets
    WHERE event_id = p_event_id
      AND is_active = true;

    -- Build final result
    v_result := json_build_object(
        'event_id', p_event_id,
        'timestamp', NOW(),
        'expired_reservations_cleared', v_expired_count,
        'summary', json_build_object(
            'total_capacity', v_event_capacity,
            'total_sold', v_total_sold,
            'total_reserved', v_total_reserved,
            'total_available', v_total_available,
            'percentage_sold', CASE
                WHEN v_event_capacity > 0 THEN
                    ROUND((v_total_sold::numeric / v_event_capacity::numeric) * 100, 2)
                ELSE 0
            END,
            'status', CASE
                WHEN v_total_available = 0 THEN 'sold_out'
                WHEN v_total_available <= 20 THEN 'limited'
                ELSE 'available'
            END,
            'is_available', v_total_available > 0
        ),
        'ticket_types', v_ticket_data,
        'messages', CASE
            WHEN v_total_available = 0 THEN
                ARRAY['This event is sold out']
            WHEN v_total_available <= 10 THEN
                ARRAY['Limited tickets remaining', 'Book now to avoid disappointment']
            WHEN v_total_reserved > v_total_available THEN
                ARRAY['High demand - tickets are being reserved quickly']
            ELSE
                ARRAY[]::text[]
        END
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in check_ticket_availability: % %', SQLERRM, SQLSTATE;
END;
$$;


ALTER FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") IS 'Performs real-time availability check for an event, cleans up expired reservations, and returns detailed availability information including waitlist status and availability messages.';



CREATE OR REPLACE FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_rule JSONB;
    v_passes_rule BOOLEAN;
BEGIN
    -- If no eligibility rules, ticket is available to all
    IF p_eligibility_rules IS NULL OR jsonb_array_length(p_eligibility_rules) = 0 THEN
        RETURN TRUE;
    END IF;

    -- Check each rule
    FOR v_rule IN SELECT * FROM jsonb_array_elements(p_eligibility_rules)
    LOOP
        v_passes_rule := TRUE;
        
        -- Check attendee type
        IF v_rule->>'attendee_type' IS NOT NULL AND 
           v_rule->>'attendee_type' != p_attendee_type THEN
            v_passes_rule := FALSE;
        END IF;
        
        -- Check registration type
        IF v_rule->>'registration_type' IS NOT NULL AND 
           v_rule->>'registration_type' != p_registration_type THEN
            v_passes_rule := FALSE;
        END IF;
        
        -- Check mason rank requirement
        IF v_rule->>'min_rank' IS NOT NULL AND p_attendee_type = 'mason' THEN
            -- Simple rank comparison (could be enhanced with rank hierarchy)
            IF p_rank IS NULL OR 
               NOT (p_rank = ANY(ARRAY['Master Mason', 'Past Master', 'Grand Officer']) 
                    AND v_rule->>'min_rank' = 'Master Mason') THEN
                v_passes_rule := FALSE;
            END IF;
        END IF;
        
        -- Check grand officer requirement
        IF (v_rule->>'grand_officer')::boolean = true AND 
           (p_grand_officer IS NULL OR p_grand_officer = false) THEN
            v_passes_rule := FALSE;
        END IF;
        
        -- Check lodge requirement
        IF v_rule->>'lodge_id' IS NOT NULL AND 
           v_rule->>'lodge_id' != p_lodge_id::text THEN
            v_passes_rule := FALSE;
        END IF;
        
        -- Check grand lodge requirement
        IF v_rule->>'grand_lodge_id' IS NOT NULL AND 
           v_rule->>'grand_lodge_id' != p_grand_lodge_id::text THEN
            v_passes_rule := FALSE;
        END IF;
        
        -- If any rule passes, the ticket is eligible
        IF v_passes_rule THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    
    -- No rules passed
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") IS 'Helper function to check if an attendee meets the eligibility criteria for a specific ticket type.';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_reservations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_cleaned_count INTEGER := 0;
    v_ticket RECORD;
BEGIN
    -- Find and process expired reservations
    FOR v_ticket IN
        SELECT t.ticket_id, t.ticket_type_id, t.registration_id
        FROM tickets t
        WHERE t.status = 'reserved'
          AND t.reservation_expires_at < NOW()
    LOOP
        -- Delete the expired ticket
        DELETE FROM tickets WHERE ticket_id = v_ticket.ticket_id;
        
        -- Update ticket availability
        UPDATE event_tickets
        SET reserved_count = GREATEST(0, reserved_count - 1),
            available_count = available_count + 1,
            updated_at = NOW()
        WHERE id = v_ticket.ticket_type_id;
        
        v_cleaned_count := v_cleaned_count + 1;
    END LOOP;

    -- Clean up registrations with no tickets
    UPDATE registrations
    SET status = 'abandoned'
    WHERE status = 'pending'
      AND NOT EXISTS (
          SELECT 1 FROM tickets t 
          WHERE t.registration_id = registrations.registration_id
      )
      AND created_at < NOW() - INTERVAL '1 hour';

    RETURN v_cleaned_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_reservations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_expired_reservations"() IS 'Cleans up expired ticket reservations and returns them to available inventory. Should be called periodically via a cron job.';



CREATE OR REPLACE FUNCTION "public"."complete_payment"("p_registration_id" "uuid", "p_payment_intent_id" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_registration RECORD;
    v_confirmation_number TEXT;
    v_result JSON;
    v_ticket_count INTEGER;
    v_total_amount NUMERIC;
    v_event_prefix TEXT;
BEGIN
    -- Input validation
    IF p_registration_id IS NULL THEN
        RAISE EXCEPTION 'Registration ID is required';
    END IF;
    
    IF p_payment_intent_id IS NULL OR p_payment_intent_id = '' THEN
        RAISE EXCEPTION 'Payment intent ID is required';
    END IF;

    -- Get registration details with lock
    SELECT r.*, e.slug, e.title, e.event_start
    INTO v_registration
    FROM registrations r
    JOIN events e ON r.event_id = e.event_id
    WHERE r.registration_id = p_registration_id
    FOR UPDATE;

    IF v_registration IS NULL THEN
        RAISE EXCEPTION 'Registration not found: %', p_registration_id;
    END IF;

    -- Verify registration is in correct state
    IF v_registration.status NOT IN ('pending', 'draft') THEN
        RAISE EXCEPTION 'Registration is not in pending state: %', v_registration.status;
    END IF;

    -- Verify payment hasn't already been processed
    IF v_registration.payment_status = 'completed' THEN
        RAISE EXCEPTION 'Payment has already been processed for this registration';
    END IF;

    -- Generate confirmation number if not exists
    IF v_registration.confirmation_number IS NULL THEN
        -- Use event slug prefix or first 3 letters of event title
        v_event_prefix := UPPER(COALESCE(
            SUBSTRING(v_registration.slug FROM 1 FOR 3),
            SUBSTRING(v_registration.title FROM 1 FOR 3),
            'EVT'
        ));
        
        -- Generate confirmation number: PREFIX-YYYYMMDD-XXXX
        v_confirmation_number := v_event_prefix || '-' || 
            TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
            LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    ELSE
        v_confirmation_number := v_registration.confirmation_number;
    END IF;

    -- Update all reserved tickets to sold
    UPDATE tickets
    SET status = 'sold',
        payment_intent_id = p_payment_intent_id,
        reservation_id = NULL,
        reservation_expires_at = NULL,
        updated_at = NOW()
    WHERE registration_id = p_registration_id
      AND status = 'reserved'
    RETURNING COUNT(*) INTO v_ticket_count;

    IF v_ticket_count = 0 THEN
        RAISE EXCEPTION 'No reserved tickets found for registration';
    END IF;

    -- Calculate total amount from tickets
    SELECT SUM(price_paid) INTO v_total_amount
    FROM tickets
    WHERE registration_id = p_registration_id;

    -- Update ticket type counts
    UPDATE event_tickets et
    SET sold_count = sold_count + ticket_counts.count,
        reserved_count = GREATEST(0, reserved_count - ticket_counts.count),
        updated_at = NOW()
    FROM (
        SELECT ticket_type_id, COUNT(*) as count
        FROM tickets
        WHERE registration_id = p_registration_id
          AND status = 'sold'
        GROUP BY ticket_type_id
    ) ticket_counts
    WHERE et.id = ticket_counts.ticket_type_id;

    -- Update registration status - FIXED: use 'completed' instead of 'paid'
    UPDATE registrations
    SET status = 'completed',
        payment_status = 'completed',  -- Changed from 'paid' to 'completed'
        confirmation_number = v_confirmation_number,
        stripe_payment_intent_id = p_payment_intent_id,
        total_amount_paid = v_total_amount,
        total_price_paid = v_total_amount,
        updated_at = NOW()
    WHERE registration_id = p_registration_id;

    -- Create payment record
    INSERT INTO registration_payments (
        registration_id,
        amount,
        currency,
        payment_method,
        payment_status,
        stripe_payment_intent_id,
        metadata
    ) VALUES (
        p_registration_id,
        v_total_amount,
        'AUD',
        'card',
        'succeeded',
        p_payment_intent_id,
        jsonb_build_object(
            'completed_at', NOW(),
            'ticket_count', v_ticket_count
        )
    );

    -- Build confirmation result
    SELECT json_build_object(
        'registration_id', r.registration_id,
        'confirmation_number', r.confirmation_number,
        'status', r.status,
        'payment_status', r.payment_status,
        'total_amount_paid', r.total_amount_paid,
        'event', json_build_object(
            'event_id', e.event_id,
            'title', e.title,
            'slug', e.slug,
            'event_start', e.event_start,
            'location_string', l.place_name || ', ' || l.suburb || ', ' || l.state
        ),
        'primary_attendee', json_build_object(
            'attendee_id', pa.attendee_id,
            'full_name', pa.full_name,
            'email', pa.email
        ),
        'tickets', (
            SELECT json_agg(
                json_build_object(
                    'ticket_id', t.ticket_id,
                    'ticket_type_name', et.name,
                    'attendee_name', a.full_name,
                    'price_paid', t.price_paid,
                    'is_partner_ticket', t.is_partner_ticket
                )
                ORDER BY a.is_primary DESC, a.full_name
            )
            FROM tickets t
            JOIN event_tickets et ON t.ticket_type_id = et.id
            JOIN attendee_complete_view a ON t.attendee_id = a.attendee_id
            WHERE t.registration_id = r.registration_id
        ),
        'ticket_count', (
            SELECT COUNT(*) FROM tickets 
            WHERE registration_id = r.registration_id
        ),
        'attendee_count', (
            SELECT COUNT(*) FROM attendees 
            WHERE registration_id = r.registration_id
        )
    ) INTO v_result
    FROM registrations r
    JOIN events e ON r.event_id = e.event_id
    LEFT JOIN locations l ON e.location_id = l.location_id
    LEFT JOIN attendee_complete_view pa ON r.primary_attendee_id = pa.attendee_id
    WHERE r.registration_id = p_registration_id;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error for debugging
        RAISE EXCEPTION 'Error in complete_payment: % %', SQLERRM, SQLSTATE;
END;
$$;


ALTER FUNCTION "public"."complete_payment"("p_registration_id" "uuid", "p_payment_intent_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_payment"("p_registration_id" "uuid", "p_payment_intent_id" "text") IS 'Completes the payment process for a registration. Updates tickets from reserved to sold, generates confirmation number, updates counts, and returns confirmation details. Fixed to use correct payment_status enum value.';



CREATE OR REPLACE FUNCTION "public"."create_contact_for_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only create contact if the auth user has an email
    IF NEW.email IS NOT NULL THEN
        INSERT INTO public.contacts (
            contact_id,
            auth_user_id,
            email,
            first_name,
            last_name,
            type,
            source_type,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,  -- Use same UUID for consistency
            NEW.id,
            NEW.email,
            COALESCE(
                (NEW.raw_user_meta_data->>'first_name')::text,
                split_part(NEW.email, '@', 1)  -- Use email prefix as fallback
            ),
            COALESCE(
                (NEW.raw_user_meta_data->>'last_name')::text,
                'User'  -- Default last name
            ),
            'individual'::contact_type,
            'auth_signup',
            NEW.created_at,
            NEW.created_at
        )
        ON CONFLICT (contact_id) DO NOTHING;  -- Prevent errors if contact already exists
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_contact_for_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_registration_with_attendees"("p_registration_data" "json") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_registration_id UUID;
    v_contact_id UUID;
    v_primary_attendee_id UUID;
    v_attendee_id UUID;
    v_partner_attendee_id UUID;
    v_masonic_profile_id UUID;
    v_attendee JSON;
    v_result JSON;
    v_attendees_data JSON;
    v_partner_data JSON;
BEGIN
    -- Start transaction
    -- Extract data from JSON
    v_attendees_data := p_registration_data->'attendees';
    
    -- Input validation
    IF p_registration_data->>'event_id' IS NULL THEN
        RAISE EXCEPTION 'Event ID is required';
    END IF;
    
    IF p_registration_data->>'registration_type' IS NULL THEN
        RAISE EXCEPTION 'Registration type is required';
    END IF;
    
    IF v_attendees_data IS NULL OR json_array_length(v_attendees_data) = 0 THEN
        RAISE EXCEPTION 'At least one attendee is required';
    END IF;

    -- Create or get contact record for the customer
    IF p_registration_data->>'contact_id' IS NOT NULL THEN
        v_contact_id := (p_registration_data->>'contact_id')::UUID;
    ELSE
        -- Create new contact
        INSERT INTO contacts (
            first_name,
            last_name,
            email,
            mobile_number,
            address_line_1,
            address_line_2,
            suburb_city,
            state,
            postcode,
            country
        ) VALUES (
            p_registration_data->>'customer_first_name',
            p_registration_data->>'customer_last_name',
            p_registration_data->>'customer_email',
            p_registration_data->>'customer_phone',
            p_registration_data->>'customer_address_line_1',
            p_registration_data->>'customer_address_line_2',
            p_registration_data->>'customer_city',
            p_registration_data->>'customer_state',
            p_registration_data->>'customer_postcode',
            COALESCE(p_registration_data->>'customer_country', 'Australia')
        )
        RETURNING contact_id INTO v_contact_id;
    END IF;

    -- Create registration record
    INSERT INTO registrations (
        event_id,
        contact_id,
        organisation_id,
        registration_type,
        status,
        payment_status,
        registration_date,
        agree_to_terms,
        registration_data
    ) VALUES (
        (p_registration_data->>'event_id')::UUID,
        v_contact_id,
        NULLIF(p_registration_data->>'organisation_id', '')::UUID,
        p_registration_data->>'registration_type',
        'pending',
        'pending',
        NOW(),
        COALESCE((p_registration_data->>'agree_to_terms')::BOOLEAN, false),
        p_registration_data
    )
    RETURNING registration_id INTO v_registration_id;

    -- Process each attendee
    FOR v_attendee IN SELECT * FROM json_array_elements(v_attendees_data)
    LOOP
        -- Reset partner ID for each attendee
        v_partner_attendee_id := NULL;
        
        -- Create contact for attendee if not the customer
        IF v_attendee->>'contact_id' IS NOT NULL THEN
            v_contact_id := (v_attendee->>'contact_id')::UUID;
        ELSIF (v_attendee->>'email' IS NULL OR v_attendee->>'email' != p_registration_data->>'customer_email') THEN
            INSERT INTO contacts (
                first_name,
                last_name,
                email,
                mobile_number
            ) VALUES (
                v_attendee->>'first_name',
                v_attendee->>'last_name',
                v_attendee->>'email',
                v_attendee->>'phone'
            )
            RETURNING contact_id INTO v_contact_id;
        END IF;

        -- Create attendee record
        INSERT INTO attendees (
            registration_id,
            contact_id,
            attendee_type,
            title,
            first_name,
            last_name,
            suffix,
            email,
            phone,
            dietary_requirements,
            special_needs,
            contact_preference,
            is_primary,
            has_partner
        ) VALUES (
            v_registration_id,
            v_contact_id,
            v_attendee->>'attendee_type',
            v_attendee->>'title',
            v_attendee->>'first_name',
            v_attendee->>'last_name',
            v_attendee->>'suffix',
            v_attendee->>'email',
            v_attendee->>'phone',
            v_attendee->>'dietary_requirements',
            v_attendee->>'special_needs',
            COALESCE(v_attendee->>'contact_preference', 'email'),
            COALESCE((v_attendee->>'is_primary')::BOOLEAN, false),
            COALESCE((v_attendee->>'has_partner')::BOOLEAN, false)
        )
        RETURNING attendee_id INTO v_attendee_id;

        -- Set primary attendee ID
        IF COALESCE((v_attendee->>'is_primary')::BOOLEAN, false) THEN
            v_primary_attendee_id := v_attendee_id;
        END IF;

        -- Create masonic profile if attendee is a mason
        IF v_attendee->>'attendee_type' = 'mason' THEN
            INSERT INTO masonic_profiles (
                contact_id,
                masonic_title,
                rank,
                grand_rank,
                grand_officer,
                grand_office,
                lodge_id,
                grand_lodge_id
            ) VALUES (
                v_contact_id,
                v_attendee->>'masonic_title',
                v_attendee->>'rank',
                v_attendee->>'grand_rank',
                COALESCE((v_attendee->>'grand_officer')::BOOLEAN, false),
                v_attendee->>'grand_office',
                NULLIF(v_attendee->>'lodge_id', '')::UUID,
                NULLIF(v_attendee->>'grand_lodge_id', '')::UUID
            )
            RETURNING masonic_profile_id INTO v_masonic_profile_id;
        END IF;

        -- Handle partner if exists
        IF v_attendee->'partner' IS NOT NULL AND v_attendee->'partner' != 'null'::json THEN
            v_partner_data := v_attendee->'partner';
            
            -- Create contact for partner
            INSERT INTO contacts (
                first_name,
                last_name,
                email,
                mobile_number
            ) VALUES (
                v_partner_data->>'first_name',
                v_partner_data->>'last_name',
                v_partner_data->>'email',
                v_partner_data->>'phone'
            )
            RETURNING contact_id INTO v_contact_id;

            -- Create partner attendee
            INSERT INTO attendees (
                registration_id,
                contact_id,
                attendee_type,
                title,
                first_name,
                last_name,
                suffix,
                email,
                phone,
                dietary_requirements,
                special_needs,
                contact_preference,
                is_primary,
                is_partner,
                related_attendee_id,
                relationship
            ) VALUES (
                v_registration_id,
                v_contact_id,
                v_partner_data->>'attendee_type',
                v_partner_data->>'title',
                v_partner_data->>'first_name',
                v_partner_data->>'last_name',
                v_partner_data->>'suffix',
                v_partner_data->>'email',
                v_partner_data->>'phone',
                v_partner_data->>'dietary_requirements',
                v_partner_data->>'special_needs',
                COALESCE(v_partner_data->>'contact_preference', 'email'),
                false,
                true,
                v_attendee_id,
                v_partner_data->>'relationship'
            )
            RETURNING attendee_id INTO v_partner_attendee_id;

            -- Update main attendee with partner relationship
            UPDATE attendees
            SET related_attendee_id = v_partner_attendee_id,
                relationship = v_partner_data->>'relationship'
            WHERE attendee_id = v_attendee_id;
        END IF;
    END LOOP;

    -- Update registration with primary attendee
    UPDATE registrations
    SET primary_attendee_id = v_primary_attendee_id
    WHERE registration_id = v_registration_id;

    -- Build and return the complete registration
    SELECT json_build_object(
        'registration_id', r.registration_id,
        'confirmation_number', r.confirmation_number,
        'status', r.status,
        'registration_type', r.registration_type,
        'event_id', r.event_id,
        'attendees', (
            SELECT json_agg(
                json_build_object(
                    'attendee_id', a.attendee_id,
                    'full_name', a.full_name,
                    'attendee_type', a.attendee_type,
                    'is_primary', a.is_primary,
                    'is_partner', a.is_partner,
                    'partner_full_name', a.partner_full_name,
                    'masonic_profile_id', a.masonic_profile_id
                )
                ORDER BY a.is_primary DESC, a.created_at
            )
            FROM attendee_complete_view a
            WHERE a.registration_id = r.registration_id
        )
    ) INTO v_result
    FROM registrations r
    WHERE r.registration_id = v_registration_id;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback is automatic in case of exception
        RAISE EXCEPTION 'Error in create_registration_with_attendees: % %', SQLERRM, SQLSTATE;
END;
$$;


ALTER FUNCTION "public"."create_registration_with_attendees"("p_registration_data" "json") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_registration_with_attendees"("p_registration_data" "json") IS 'Creates a complete registration with attendees, masonic profiles, and partner relationships in a single atomic transaction. Returns the created registration with attendee details.';



CREATE OR REPLACE FUNCTION "public"."expire_ticket_reservations"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update tickets with expired reservations
    UPDATE tickets
    SET 
        status = 'available',
        reservation_id = NULL,
        reservation_expires_at = NULL,
        updated_at = NOW()
    WHERE status = 'reserved' 
    AND reservation_expires_at < NOW();
    
    -- Update event_tickets counts for affected ticket types
    UPDATE event_tickets et
    SET 
        reserved_count = (
            SELECT COUNT(*) 
            FROM tickets t
            WHERE t.ticket_type_id = et.id
            AND t.status = 'reserved'
            AND t.reservation_expires_at > NOW()
        ),
        available_count = CASE 
            WHEN et.total_capacity IS NULL THEN NULL
            ELSE et.total_capacity - (
                SELECT COUNT(*) 
                FROM tickets t
                WHERE t.ticket_type_id = et.id
                AND t.status IN ('reserved', 'sold')
                AND (t.status != 'reserved' OR t.reservation_expires_at > NOW())
            )
        END,
        updated_at = NOW()
    WHERE et.id IN (
        SELECT DISTINCT ticket_type_id 
        FROM tickets 
        WHERE status = 'reserved' 
        AND reservation_expires_at < NOW()
    );
END;
$$;


ALTER FUNCTION "public"."expire_ticket_reservations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_missing_indexes"() RETURNS TABLE("tablename" "text", "attname" "text", "n_distinct" numeric, "correlation" numeric, "null_frac" numeric, "avg_width" integer, "recommendation" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::text AS tablename,
        a.attname::text,
        s.n_distinct,
        s.correlation,
        s.null_frac,
        s.avg_width,
        CASE
            WHEN s.n_distinct > 100 AND s.correlation < 0.1 THEN 
                'Consider btree index'
            WHEN s.n_distinct BETWEEN 2 AND 100 THEN 
                'Consider partial or filtered index'
            ELSE 
                'May not benefit from index'
        END AS recommendation
    FROM pg_stats s
    JOIN pg_class c ON c.relname = s.tablename
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = s.attname
    WHERE s.schemaname = 'public'
        AND s.n_distinct > 1
        AND s.null_frac < 0.5
        AND NOT EXISTS (
            SELECT 1
            FROM pg_index i
            JOIN pg_attribute ia ON ia.attrelid = i.indrelid
            WHERE i.indrelid = c.oid
                AND ia.attnum = ANY(i.indkey)
                AND ia.attname = a.attname
        )
    ORDER BY s.n_distinct DESC;
END;
$$;


ALTER FUNCTION "public"."find_missing_indexes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."find_missing_indexes"() IS 'Identify columns that might benefit from indexes';



CREATE OR REPLACE FUNCTION "public"."generate_uuid_type"() RETURNS "public"."uuid_type"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN gen_random_uuid()::uuid_type;
END;
$$;


ALTER FUNCTION "public"."generate_uuid_type"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSON;
    v_registration_type TEXT;
    v_attendee RECORD;
    v_ticket_type RECORD;
    v_eligible_tickets JSONB;
    v_attendee_eligible_tickets JSONB;
BEGIN
    -- Input validation
    IF p_event_id IS NULL THEN
        RAISE EXCEPTION 'Event ID is required';
    END IF;
    
    IF p_registration_id IS NULL THEN
        RAISE EXCEPTION 'Registration ID is required';
    END IF;

    -- Get registration type
    SELECT registration_type INTO v_registration_type
    FROM registrations
    WHERE registration_id = p_registration_id;

    IF v_registration_type IS NULL THEN
        RAISE EXCEPTION 'Registration not found with ID: %', p_registration_id;
    END IF;

    -- Initialize result
    v_eligible_tickets := '[]'::jsonb;

    -- Loop through each attendee in the registration
    FOR v_attendee IN 
        SELECT 
            a.attendee_id,
            a.attendee_type,
            a.first_name,
            a.last_name,
            a.full_name,
            a.is_partner,
            a.masonic_profile_id,
            a.rank,
            a.grand_rank,
            a.grand_officer,
            a.lodge_id,
            a.grand_lodge_id
        FROM attendee_complete_view a
        WHERE a.registration_id = p_registration_id
    LOOP
        -- Initialize eligible tickets for this attendee
        v_attendee_eligible_tickets := '[]'::jsonb;
        
        -- Loop through available ticket types for the event
        FOR v_ticket_type IN
            SELECT 
                t.ticket_type_id,
                t.ticket_type_name,
                t.description,
                t.price,
                t.actual_available,
                t.eligibility_criteria,
                t.eligibility_rules,
                t.ticket_category
            FROM ticket_availability_view t
            WHERE t.event_id = p_event_id
              AND t.is_active = true
              AND t.status = 'Active'
              AND t.actual_available > 0
        LOOP
            -- Check if attendee meets eligibility criteria
            IF check_ticket_eligibility(
                v_attendee.attendee_type,
                v_attendee.rank,
                v_attendee.grand_rank,
                v_attendee.grand_officer,
                v_attendee.lodge_id,
                v_attendee.grand_lodge_id,
                v_registration_type,
                v_ticket_type.eligibility_rules
            ) THEN
                -- Add to eligible tickets
                v_attendee_eligible_tickets := v_attendee_eligible_tickets || 
                    jsonb_build_object(
                        'ticket_type_id', v_ticket_type.ticket_type_id,
                        'ticket_type_name', v_ticket_type.ticket_type_name,
                        'description', v_ticket_type.description,
                        'price', v_ticket_type.price,
                        'available_count', v_ticket_type.actual_available,
                        'category', v_ticket_type.ticket_category
                    );
            END IF;
        END LOOP;
        
        -- Add attendee with their eligible tickets
        v_eligible_tickets := v_eligible_tickets || 
            jsonb_build_object(
                'attendee_id', v_attendee.attendee_id,
                'attendee_name', v_attendee.full_name,
                'attendee_type', v_attendee.attendee_type,
                'is_partner', v_attendee.is_partner,
                'eligible_tickets', v_attendee_eligible_tickets
            );
    END LOOP;

    -- Return the result
    v_result := v_eligible_tickets::json;
    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in get_eligible_tickets: % %', SQLERRM, SQLSTATE;
END;
$$;


ALTER FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") IS 'Determines which tickets each attendee in a registration can purchase based on eligibility criteria. Returns a JSON array of attendees with their eligible tickets.';



CREATE OR REPLACE FUNCTION "public"."get_event_with_details"("p_event_slug" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_event_id UUID;
    v_function_id UUID;
    v_result JSON;
BEGIN
    -- Get event and function IDs
    SELECT e.event_id, e.function_id 
    INTO v_event_id, v_function_id
    FROM events e
    WHERE e.slug = p_event_slug
      AND e.is_published = true;
    
    IF v_event_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Build result with function context
    SELECT json_build_object(
        'event', row_to_json(e.*),
        'function', (
            SELECT row_to_json(f.*)
            FROM functions f
            WHERE f.function_id = e.function_id
        ),
        'location', (
            SELECT row_to_json(l.*)
            FROM locations l
            WHERE l.location_id = e.location_id
        ),
        'organisation', (
            SELECT row_to_json(o.*)
            FROM organisations o
            WHERE o.organisation_id = e.organiser_id
        ),
        'packages', COALESCE(
            (SELECT json_agg(row_to_json(p.*))
            FROM packages p
            WHERE p.function_id = v_function_id
              AND p.is_active = true
            ), '[]'::json
        ),
        'tickets', COALESCE(
            (SELECT json_agg(ticket_data ORDER BY created_at)
            FROM (
                SELECT 
                    json_build_object(
                        'id', et.event_ticket_id,  -- Fixed: was et.id
                        'event_ticket_id', et.event_ticket_id,  -- Include both for compatibility
                        'name', et.name,
                        'description', et.description,
                        'price', et.price,
                        'total_capacity', et.total_capacity,
                        'available_count', et.available_count,
                        'is_active', et.is_active,
                        'display_order', ROW_NUMBER() OVER (ORDER BY et.created_at),
                        'eligibility_type', COALESCE(et.eligibility_criteria->>'type', 'General')
                    ) as ticket_data,
                    et.created_at
                FROM event_tickets et
                WHERE et.event_id = v_event_id
                  AND et.is_active = true
            ) t
            ), '[]'::json
        ),
        'related_events', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'event_id', re.event_id,
                    'title', re.title,
                    'slug', re.slug,
                    'event_start', re.event_start,
                    'event_end', re.event_end
                )
                ORDER BY re.event_start
            )
            FROM events re
            WHERE re.function_id = v_function_id
              AND re.event_id != v_event_id
              AND re.is_published = true
            ), '[]'::json
        ),
        'summary', json_build_object(
            'min_price', COALESCE(
                (SELECT MIN(et.price) 
                 FROM event_tickets et 
                 WHERE et.event_id = v_event_id 
                   AND et.is_active = true),
                0
            ),
            'max_price', COALESCE(
                (SELECT MAX(et.price) 
                 FROM event_tickets et 
                 WHERE et.event_id = v_event_id 
                   AND et.is_active = true),
                0
            ),
            'total_capacity', COALESCE(
                (SELECT SUM(et.total_capacity) 
                 FROM event_tickets et 
                 WHERE et.event_id = v_event_id 
                   AND et.is_active = true),
                0
            ),
            'tickets_sold', COALESCE(
                (SELECT SUM(et.sold_count) 
                 FROM event_tickets et 
                 WHERE et.event_id = v_event_id),
                0
            ),
            'is_sold_out', COALESCE(
                (SELECT SUM(et.available_count) = 0
                 FROM event_tickets et 
                 WHERE et.event_id = v_event_id 
                   AND et.is_active = true),
                false
            )
        )
    ) INTO v_result
    FROM events e
    WHERE e.event_id = v_event_id;
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_event_with_details"("p_event_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_event_with_details"("p_event_slug" "text") IS 'Retrieves comprehensive event details including function, location, packages, tickets, and related events';



CREATE OR REPLACE FUNCTION "public"."get_function_details"("p_function_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'function', row_to_json(f.*),
        'events', COALESCE(
            (SELECT json_agg(
                row_to_json(e.*)
                ORDER BY e.event_start
            )
            FROM events e
            WHERE e.function_id = f.function_id
              AND e.is_published = true
            ), '[]'::json
        ),
        'packages', COALESCE(
            (SELECT json_agg(
                row_to_json(p.*)
                ORDER BY p.package_price
            )
            FROM packages p
            WHERE p.function_id = f.function_id
              AND p.is_active = true
            ), '[]'::json
        ),
        'location', (
            SELECT row_to_json(l.*)
            FROM locations l
            WHERE l.location_id = f.location_id
        ),
        'organiser', (
            SELECT row_to_json(o.*)
            FROM organisations o
            WHERE o.organisation_id = f.organiser_id
        )
    ) INTO v_result
    FROM functions f
    WHERE f.function_id = p_function_id
      AND f.is_published = true;
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_function_details"("p_function_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_function_details_formatted"("p_function_id" "uuid") RETURNS TABLE("function_id" "uuid", "name" "text", "slug" "text", "description" "text", "image_url" "text", "start_date" timestamp with time zone, "end_date" timestamp with time zone, "location_id" "uuid", "organiser_id" "uuid", "events" "json", "packages" "json", "location" "json", "registration_count" integer, "metadata" "jsonb", "is_published" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.function_id,
        f.name,
        f.slug,
        f.description,
        f.image_url,
        f.start_date,
        f.end_date,
        f.location_id,
        f.organiser_id,
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'event_id', e.event_id,
                    'title', e.title,
                    'subtitle', e.subtitle,
                    'slug', e.slug,
                    'description', e.description,
                    'event_start', e.event_start,
                    'event_end', e.event_end,
                    'location_id', e.location_id,
                    'is_published', e.is_published
                )
                ORDER BY e.event_start
            )
            FROM events e
            WHERE e.function_id = f.function_id
              AND e.is_published = true
            ), '[]'::json
        ) as events,
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'package_id', p.package_id,
                    'name', p.name,
                    'description', p.description,
                    'package_price', p.package_price,
                    'is_active', p.is_active
                )
                ORDER BY p.package_price
            )
            FROM packages p
            WHERE p.function_id = f.function_id
              AND p.is_active = true
            ), '[]'::json
        ) as packages,
        (
            SELECT row_to_json(l.*)
            FROM locations l
            WHERE l.location_id = f.location_id
        ) as location,
        (
            SELECT COUNT(DISTINCT r.registration_id)::INTEGER
            FROM registrations r
            WHERE r.function_id = f.function_id
        ) as registration_count,
        f.metadata,
        f.is_published
    FROM functions f
    WHERE f.function_id = p_function_id
      AND f.is_published = true;
END;
$$;


ALTER FUNCTION "public"."get_function_details_formatted"("p_function_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_registration_summary"("p_registration_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Input validation
    IF p_registration_id IS NULL THEN
        RAISE EXCEPTION 'Registration ID is required';
    END IF;

    -- Build comprehensive registration summary
    SELECT json_build_object(
        'registration', json_build_object(
            'registration_id', r.registration_id,
            'confirmation_number', r.confirmation_number,
            'registration_date', r.registration_date,
            'status', r.status,
            'payment_status', r.payment_status,
            'registration_type', r.registration_type,
            'total_amount_paid', r.total_amount_paid,
            'agree_to_terms', r.agree_to_terms,
            'created_at', r.created_at
        ),
        'customer', json_build_object(
            'contact_id', r.contact_id,
            'name', r.customer_name,
            'email', r.customer_email,
            'phone', r.customer_phone,
            'first_name', r.customer_first_name,
            'last_name', r.customer_last_name
        ),
        'event', json_build_object(
            'event_id', e.event_id,
            'title', e.title,
            'subtitle', e.subtitle,
            'slug', e.slug,
            'event_start', e.event_start,
            'event_end', e.event_end,
            'type', e.type,
            'location', json_build_object(
                'place_name', l.place_name,
                'street_address', l.street_address,
                'suburb', l.suburb,
                'state', l.state,
                'postal_code', l.postal_code,
                'location_string', e.location_string
            ),
            'organiser', json_build_object(
                'name', e.organiser_name,
                'abbreviation', e.organiser_abbreviation
            ),
            'dress_code', e.dress_code,
            'regalia', e.regalia,
            'regalia_description', e.regalia_description
        ),
        'organisation', CASE 
            WHEN r.organisation_id IS NOT NULL THEN
                json_build_object(
                    'organisation_id', r.organisation_id,
                    'name', r.organisation_name,
                    'abbreviation', r.organisation_abbreviation
                )
            ELSE NULL
        END,
        'attendees', (
            SELECT json_agg(
                json_build_object(
                    'attendee_id', a.attendee_id,
                    'attendee_type', a.attendee_type,
                    'title', a.title,
                    'first_name', a.first_name,
                    'last_name', a.last_name,
                    'full_name', a.full_name,
                    'email', a.email,
                    'phone', a.phone,
                    'dietary_requirements', a.dietary_requirements,
                    'special_needs', a.special_needs,
                    'is_primary', a.is_primary,
                    'is_partner', a.is_partner,
                    'has_partner', a.has_partner,
                    'partner_details', CASE 
                        WHEN a.related_attendee_id IS NOT NULL THEN
                            json_build_object(
                                'attendee_id', a.related_attendee_id,
                                'full_name', a.partner_full_name,
                                'relationship', a.relationship
                            )
                        ELSE NULL
                    END,
                    'masonic_details', CASE 
                        WHEN a.masonic_profile_id IS NOT NULL THEN
                            json_build_object(
                                'masonic_title', a.masonic_title,
                                'rank', a.rank,
                                'grand_rank', a.grand_rank,
                                'grand_officer', a.grand_officer,
                                'grand_office', a.grand_office,
                                'lodge_name', a.lodge_name,
                                'lodge_number', a.lodge_number,
                                'grand_lodge_name', a.grand_lodge_name
                            )
                        ELSE NULL
                    END,
                    'tickets', a.tickets,
                    'ticket_count', a.ticket_count
                )
                ORDER BY a.is_primary DESC, a.created_at
            )
            FROM attendee_complete_view a
            WHERE a.registration_id = r.registration_id
        ),
        'tickets', (
            SELECT json_agg(
                json_build_object(
                    'ticket_id', t.ticket_id,
                    'event_id', t.event_id,
                    'event_title', COALESCE(te.title, e.title),
                    'ticket_type_name', et.name,
                    'ticket_type_description', et.description,
                    'attendee_id', t.attendee_id,
                    'attendee_name', att.full_name,
                    'price_paid', t.price_paid,
                    'status', t.status,
                    'is_partner_ticket', t.is_partner_ticket,
                    'ticket_number', t.ticket_number,
                    'qr_code', t.qr_code,
                    'checked_in_at', t.checked_in_at
                )
                ORDER BY att.is_primary DESC, att.full_name, et.name
            )
            FROM tickets t
            JOIN event_tickets et ON t.ticket_type_id = et.id
            LEFT JOIN events te ON t.event_id = te.event_id
            JOIN attendee_complete_view att ON t.attendee_id = att.attendee_id
            WHERE t.registration_id = r.registration_id
        ),
        'summary', json_build_object(
            'attendee_count', r.attendee_count,
            'ticket_count', r.ticket_count,
            'partner_count', (
                SELECT COUNT(*) 
                FROM attendees 
                WHERE registration_id = r.registration_id 
                  AND is_partner = true
            ),
            'total_amount_paid', r.total_ticket_amount,
            'ticket_types', r.ticket_types,
            'has_dietary_requirements', EXISTS (
                SELECT 1 FROM attendees 
                WHERE registration_id = r.registration_id 
                  AND dietary_requirements IS NOT NULL 
                  AND dietary_requirements != ''
            ),
            'has_special_needs', EXISTS (
                SELECT 1 FROM attendees 
                WHERE registration_id = r.registration_id 
                  AND special_needs IS NOT NULL 
                  AND special_needs != ''
            )
        ),
        'payment', CASE 
            WHEN r.stripe_payment_intent_id IS NOT NULL THEN
                json_build_object(
                    'payment_intent_id', r.stripe_payment_intent_id,
                    'payment_status', r.payment_status,
                    'total_amount_paid', r.total_amount_paid,
                    'payment_date', (
                        SELECT created_at 
                        FROM registration_payments 
                        WHERE registration_id = r.registration_id 
                          AND payment_status = 'succeeded'
                        ORDER BY created_at DESC 
                        LIMIT 1
                    )
                )
            ELSE NULL
        END
    ) INTO v_result
    FROM registration_detail_view r
    JOIN event_display_view e ON r.event_id = e.event_id
    LEFT JOIN locations l ON e.location_id = l.location_id
    WHERE r.registration_id = p_registration_id;

    -- Check if registration was found
    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Registration not found: %', p_registration_id;
    END IF;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in get_registration_summary: % %', SQLERRM, SQLSTATE;
END;
$$;


ALTER FUNCTION "public"."get_registration_summary"("p_registration_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_registration_summary"("p_registration_id" "uuid") IS 'Returns complete registration data including all attendees, tickets, event details, and payment information. Used for confirmation pages and administrative views.';



CREATE OR REPLACE FUNCTION "public"."inherit_parent_organiser_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If function_id is set and organiser_id is not set, inherit from function
    IF NEW.function_id IS NOT NULL AND NEW.organiser_id IS NULL THEN
        SELECT organiser_id INTO NEW.organiser_id
        FROM functions
        WHERE function_id = NEW.function_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."inherit_parent_organiser_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_event_ticket_availability"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE event_tickets
    SET available_count = total_capacity
    WHERE available_count IS NULL
    AND total_capacity IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."initialize_event_ticket_availability"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."monitor_index_usage"() RETURNS TABLE("schemaname" "text", "tablename" "text", "indexname" "text", "idx_scan" bigint, "idx_tup_read" bigint, "idx_tup_fetch" bigint, "table_size" "text", "index_size" "text", "usage_ratio" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::text,
        s.tablename::text,
        s.indexname::text,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch,
        pg_size_pretty(pg_relation_size(s.tablename::regclass)) AS table_size,
        pg_size_pretty(pg_relation_size(s.indexname::regclass)) AS index_size,
        CASE 
            WHEN s.idx_scan = 0 THEN 0
            ELSE ROUND((s.idx_tup_fetch::numeric / NULLIF(s.idx_scan, 0)), 2)
        END AS usage_ratio
    FROM pg_stat_user_indexes s
    WHERE s.schemaname = 'public'
    ORDER BY s.idx_scan DESC;
END;
$$;


ALTER FUNCTION "public"."monitor_index_usage"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."monitor_index_usage"() IS 'Monitor index usage statistics for performance tuning';



CREATE OR REPLACE FUNCTION "public"."recalculate_event_counts"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Reset all counts to 0
    UPDATE events
    SET sold_count = 0,
        reserved_count = 0;
    
    -- Update sold_count
    UPDATE events e
    SET sold_count = (
        SELECT COUNT(*)
        FROM tickets t
        WHERE t.event_id = e.event_id
        AND t.status = 'sold'
    );
    
    -- Update reserved_count
    UPDATE events e
    SET reserved_count = (
        SELECT COUNT(*)
        FROM tickets t
        WHERE t.event_id = e.event_id
        AND t.status = 'reserved'
    );
END;
$$;


ALTER FUNCTION "public"."recalculate_event_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_event_ticket_counts"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Reset all counts to 0
    UPDATE event_tickets
    SET sold_count = 0,
        reserved_count = 0,
        available_count = COALESCE(total_capacity, 0);
    
    -- Update sold_count
    UPDATE event_tickets et
    SET sold_count = (
        SELECT COUNT(*)
        FROM tickets t
        WHERE t.ticket_type_id = et.id
        AND t.status = 'sold'
    );
    
    -- Update reserved_count
    UPDATE event_tickets et
    SET reserved_count = (
        SELECT COUNT(*)
        FROM tickets t
        WHERE t.ticket_type_id = et.id
        AND t.status = 'reserved'
    );
    
    -- Update available_count
    UPDATE event_tickets
    SET available_count = GREATEST(
        COALESCE(total_capacity, 0) - COALESCE(sold_count, 0) - COALESCE(reserved_count, 0), 
        0
    );
END;
$$;


ALTER FUNCTION "public"."recalculate_event_ticket_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_registration_id UUID;
    v_reservation_id UUID;
    v_reservation_expires_at TIMESTAMP;
    v_ticket_selection JSON;
    v_ticket_type RECORD;
    v_created_tickets JSON[];
    v_ticket_id UUID;
    v_result JSON;
    v_total_amount NUMERIC := 0;
    v_tickets_to_reserve INTEGER;
    v_available_count INTEGER;
BEGIN
    -- Extract registration ID
    v_registration_id := (p_ticket_selections->>'registration_id')::UUID;
    
    -- Input validation
    IF v_registration_id IS NULL THEN
        RAISE EXCEPTION 'Registration ID is required';
    END IF;
    
    IF p_ticket_selections->'tickets' IS NULL OR 
       json_array_length(p_ticket_selections->'tickets') = 0 THEN
        RAISE EXCEPTION 'At least one ticket selection is required';
    END IF;

    -- Verify registration exists and is in valid state
    IF NOT EXISTS (
        SELECT 1 FROM registrations 
        WHERE registration_id = v_registration_id 
          AND status IN ('pending', 'draft')
    ) THEN
        RAISE EXCEPTION 'Registration not found or not in valid state';
    END IF;

    -- Generate reservation ID and set expiry (15 minutes from now)
    v_reservation_id := gen_random_uuid();
    v_reservation_expires_at := NOW() + INTERVAL '15 minutes';

    -- Start processing ticket selections
    FOR v_ticket_selection IN 
        SELECT * FROM json_array_elements(p_ticket_selections->'tickets')
    LOOP
        -- Get ticket type details with lock for update
        SELECT * INTO v_ticket_type
        FROM event_tickets
        WHERE id = (v_ticket_selection->>'ticket_type_id')::UUID
          AND is_active = true
          AND status = 'Active'
        FOR UPDATE;

        IF v_ticket_type IS NULL THEN
            RAISE EXCEPTION 'Ticket type not found or not active: %', 
                v_ticket_selection->>'ticket_type_id';
        END IF;

        -- Calculate actual available tickets (excluding active reservations)
        SELECT 
            GREATEST(0, 
                v_ticket_type.available_count - 
                COUNT(*) FILTER (
                    WHERE t.reservation_expires_at > NOW() 
                    AND t.status = 'reserved'
                )
            ) INTO v_available_count
        FROM tickets t
        WHERE t.ticket_type_id = v_ticket_type.id;

        v_tickets_to_reserve := (v_ticket_selection->>'quantity')::INTEGER;

        -- Check availability
        IF v_available_count < v_tickets_to_reserve THEN
            RAISE EXCEPTION 'Not enough tickets available for %: requested %, available %', 
                v_ticket_type.name, v_tickets_to_reserve, v_available_count;
        END IF;

        -- Create ticket records
        FOR i IN 1..v_tickets_to_reserve LOOP
            INSERT INTO tickets (
                event_id,
                registration_id,
                attendee_id,
                ticket_type_id,
                price_paid,
                status,
                reservation_id,
                reservation_expires_at,
                is_partner_ticket
            ) VALUES (
                v_ticket_type.event_id,
                v_registration_id,
                (v_ticket_selection->>'attendee_id')::UUID,
                v_ticket_type.id,
                v_ticket_type.price,
                'reserved',
                v_reservation_id,
                v_reservation_expires_at,
                COALESCE((v_ticket_selection->>'is_partner_ticket')::BOOLEAN, false)
            )
            RETURNING ticket_id INTO v_ticket_id;

            -- Add to created tickets array
            v_created_tickets := array_append(
                v_created_tickets,
                json_build_object(
                    'ticket_id', v_ticket_id,
                    'ticket_type_name', v_ticket_type.name,
                    'price', v_ticket_type.price,
                    'attendee_id', v_ticket_selection->>'attendee_id'
                )::json
            );
        END LOOP;

        -- Update ticket counts
        UPDATE event_tickets
        SET reserved_count = reserved_count + v_tickets_to_reserve,
            available_count = available_count - v_tickets_to_reserve,
            updated_at = NOW()
        WHERE id = v_ticket_type.id;

        -- Add to total amount
        v_total_amount := v_total_amount + (v_ticket_type.price * v_tickets_to_reserve);
    END LOOP;

    -- Update registration with reservation info
    UPDATE registrations
    SET total_price_paid = v_total_amount,
        updated_at = NOW()
    WHERE registration_id = v_registration_id;

    -- Build result
    v_result := json_build_object(
        'reservation_id', v_reservation_id,
        'registration_id', v_registration_id,
        'expires_at', v_reservation_expires_at,
        'total_amount_paid', v_total_amount,
        'tickets', array_to_json(v_created_tickets),
        'ticket_count', array_length(v_created_tickets, 1)
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback is automatic
        RAISE EXCEPTION 'Error in reserve_tickets: % %', SQLERRM, SQLSTATE;
END;
$$;


ALTER FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") IS 'Reserves tickets for a registration with automatic expiry. Checks availability, creates ticket records, and updates counts atomically. Returns reservation details including expiry time.';



CREATE OR REPLACE FUNCTION "public"."should_generate_confirmation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
        'registration_id', NEW.id,
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
$$;


ALTER FUNCTION "public"."should_generate_confirmation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE events
    SET 
        sold_count = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
            AND status = 'sold'
        ),
        reserved_count = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
            AND status = 'reserved'
        )
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id);
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_event_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_ticket_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE event_tickets
    SET 
        reserved_count = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE ticket_type_id = COALESCE(NEW.ticket_type_id, OLD.ticket_type_id)
            AND status = 'reserved'
            AND reservation_expires_at > NOW()
        ),
        sold_count = (
            SELECT COUNT(*) 
            FROM tickets 
            WHERE ticket_type_id = COALESCE(NEW.ticket_type_id, OLD.ticket_type_id)
            AND status = 'sold'
        ),
        available_count = CASE 
            WHEN total_capacity IS NULL THEN NULL
            ELSE total_capacity - (
                SELECT COUNT(*) 
                FROM tickets 
                WHERE ticket_type_id = COALESCE(NEW.ticket_type_id, OLD.ticket_type_id)
                AND status IN ('reserved', 'sold')
                AND (status != 'reserved' OR reservation_expires_at > NOW())
            )
        END,
        updated_at = NOW()
    WHERE event_ticket_id = COALESCE(NEW.ticket_type_id, OLD.ticket_type_id);
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_event_ticket_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_registration_id uuid;
    v_booking_contact_id uuid;
    v_customer_id uuid;
    v_function_id uuid;
    v_primary_attendee_id uuid;
    v_attendee_id uuid;
    v_contact_id uuid;
    v_attendee jsonb;
    v_ticket jsonb;
    v_confirmation_number text;
    v_result jsonb;
    v_payment_status text;
    v_attendee_type text;
    v_contact_preference text;
    v_attendee_email text;
    v_attendee_phone text;
BEGIN
    -- Extract required fields
    v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
    v_customer_id := (p_registration_data->>'authUserId')::uuid;
    v_function_id := (p_registration_data->>'functionId')::uuid;
    
    -- Validate required fields
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer ID (authUserId) is required';
    END IF;
    
    IF v_function_id IS NULL THEN
        RAISE EXCEPTION 'Function ID is required';
    END IF;
    
    -- Check if this is a payment completion
    IF (p_registration_data->>'paymentCompleted')::boolean = true THEN
        -- Update existing registration for payment completion
        UPDATE registrations SET
            payment_status = 'completed',
            stripe_payment_intent_id = p_registration_data->>'paymentIntentId',
            total_amount_paid = COALESCE((p_registration_data->>'totalAmountPaid')::decimal, total_amount_paid),
            updated_at = CURRENT_TIMESTAMP
        WHERE registration_id = v_registration_id
        AND auth_user_id = v_customer_id;
        
        -- Get confirmation number
        SELECT confirmation_number INTO v_confirmation_number
        FROM registrations
        WHERE registration_id = v_registration_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'registrationId', v_registration_id,
            'confirmationNumber', v_confirmation_number,
            'customerId', v_customer_id
        );
    END IF;
    
    -- Check if registration exists
    SELECT confirmation_number INTO v_confirmation_number
    FROM registrations
    WHERE registration_id = v_registration_id;
    
    -- For new registrations, generate confirmation number
    IF v_confirmation_number IS NULL THEN
        v_confirmation_number := 'IND-' || to_char(CURRENT_TIMESTAMP, 'YYMMDD') || '-' || 
                                LPAD(nextval('registration_confirmation_seq')::text, 4, '0');
    END IF;
    
    -- Create or update customer record
    INSERT INTO customers (
        customer_id,
        customer_type,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        updated_at
    ) VALUES (
        v_customer_id,
        'individual',
        COALESCE(p_registration_data->'billingDetails'->>'firstName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'emailAddress', p_registration_data->'billingDetails'->>'email', ''),
        COALESCE(p_registration_data->'billingDetails'->>'mobileNumber', p_registration_data->'billingDetails'->>'phone', ''),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Create booking contact record (matching the actual contacts table schema)
    v_booking_contact_id := gen_random_uuid();
    
    INSERT INTO contacts (
        contact_id,
        type,
        first_name,
        last_name,
        email,
        mobile_number,
        auth_user_id,
        billing_email,
        billing_phone,
        billing_street_address,
        billing_city,
        billing_state,
        billing_postal_code,
        billing_country,
        created_at,
        updated_at
    ) VALUES (
        v_booking_contact_id,
        'customer',  -- Required contact_type enum
        COALESCE(p_registration_data->'billingDetails'->>'firstName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', ''),
        -- Map emailAddress to email field
        COALESCE(
            p_registration_data->'billingDetails'->>'emailAddress', 
            p_registration_data->'billingDetails'->>'email',
            p_registration_data->'primaryAttendee'->>'primaryEmail',
            p_registration_data->'primaryAttendee'->>'email',
            ''
        ),
        -- Map mobileNumber to mobile_number field
        COALESCE(
            p_registration_data->'billingDetails'->>'mobileNumber', 
            p_registration_data->'billingDetails'->>'phone',
            p_registration_data->'primaryAttendee'->>'primaryPhone',
            p_registration_data->'primaryAttendee'->>'mobileNumber',
            ''
        ),
        v_customer_id,  -- auth_user_id
        COALESCE(p_registration_data->'billingDetails'->>'emailAddress', ''),
        COALESCE(p_registration_data->'billingDetails'->>'mobileNumber', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'addressLine1', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'city', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'state', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'postcode', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'country', 'Australia'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Upsert registration
    INSERT INTO registrations (
        registration_id,
        customer_id,
        auth_user_id,
        function_id,
        event_id,
        booking_contact_id,
        registration_type,
        confirmation_number,
        payment_status,
        total_amount_paid,
        subtotal,
        stripe_fee,
        stripe_payment_intent_id,
        registration_data,
        created_at,
        updated_at
    ) VALUES (
        v_registration_id,
        v_customer_id,
        v_customer_id,
        v_function_id,
        (p_registration_data->>'eventId')::uuid,
        v_booking_contact_id,
        'individuals',
        v_confirmation_number,
        COALESCE(v_payment_status, 'pending'),
        COALESCE((p_registration_data->>'totalAmount')::decimal, 0),
        COALESCE((p_registration_data->>'subtotal')::decimal, 0),
        COALESCE((p_registration_data->>'stripeFee')::decimal, 0),
        p_registration_data->>'paymentIntentId',
        jsonb_build_object(
            'billingDetails', p_registration_data->'billingDetails',
            'agreeToTerms', COALESCE((p_registration_data->>'agreeToTerms')::boolean, true),
            'billToPrimaryAttendee', COALESCE((p_registration_data->>'billToPrimaryAttendee')::boolean, false),
            'eventTitle', p_registration_data->>'eventTitle'
        ),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (registration_id) DO UPDATE SET
        customer_id = EXCLUDED.customer_id,
        auth_user_id = EXCLUDED.auth_user_id,
        function_id = EXCLUDED.function_id,
        event_id = EXCLUDED.event_id,
        booking_contact_id = EXCLUDED.booking_contact_id,
        payment_status = EXCLUDED.payment_status,
        total_amount_paid = EXCLUDED.total_amount_paid,
        subtotal = EXCLUDED.subtotal,
        stripe_fee = EXCLUDED.stripe_fee,
        stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
        registration_data = EXCLUDED.registration_data,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Process primary attendee
    IF p_registration_data->'primaryAttendee' IS NOT NULL THEN
        v_attendee := p_registration_data->'primaryAttendee';
        v_primary_attendee_id := gen_random_uuid();
        
        -- Get attendee type with proper case handling
        v_attendee_type := LOWER(COALESCE(v_attendee->>'attendeeType', 'guest'));
        v_contact_preference := COALESCE(v_attendee->>'contactPreference', 'Directly');
        
        -- Extract email and phone with proper field mapping
        v_attendee_email := COALESCE(
            v_attendee->>'primaryEmail',
            v_attendee->>'email',
            p_registration_data->'billingDetails'->>'emailAddress',
            p_registration_data->'billingDetails'->>'email'
        );
        
        v_attendee_phone := COALESCE(
            v_attendee->>'primaryPhone',
            v_attendee->>'mobileNumber',
            v_attendee->>'phone',
            p_registration_data->'billingDetails'->>'mobileNumber',
            p_registration_data->'billingDetails'->>'phone'
        );
        
        -- Insert primary attendee
        INSERT INTO attendees (
            attendee_id,
            registration_id,
            attendee_type,
            is_primary,
            related_attendee_id,
            first_name,
            last_name,
            title,
            suffix_1,
            suffix_2,
            suffix_3,
            dietary_requirements,
            special_needs,
            contact_preference,
            primary_email,
            primary_phone,
            attendee_data,
            created_at,
            updated_at
        ) VALUES (
            v_primary_attendee_id,
            v_registration_id,
            v_attendee_type,
            true,
            NULL,
            v_attendee->>'firstName',
            v_attendee->>'lastName',
            v_attendee->>'title',
            v_attendee->>'suffix1',
            v_attendee->>'suffix2',
            v_attendee->>'suffix3',
            v_attendee->>'dietaryRequirements',
            v_attendee->>'specialNeeds',
            v_contact_preference,
            v_attendee_email,
            v_attendee_phone,
            v_attendee,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        -- Create contact record for primary attendee if they want direct contact
        IF v_contact_preference = 'Directly' AND (v_attendee_email IS NOT NULL OR v_attendee_phone IS NOT NULL) THEN
            v_contact_id := gen_random_uuid();
            
            INSERT INTO contacts (
                contact_id,
                type,
                first_name,
                last_name,
                email,
                mobile_number,
                title,
                suffix_1,
                suffix_2,
                suffix_3,
                dietary_requirements,
                special_needs,
                contact_preference,
                has_partner,
                is_partner,
                source_id,
                source_type,
                created_at,
                updated_at
            ) VALUES (
                v_contact_id,
                'attendee',  -- contact_type enum
                v_attendee->>'firstName',
                v_attendee->>'lastName',
                COALESCE(v_attendee_email, ''),
                v_attendee_phone,
                v_attendee->>'title',
                v_attendee->>'suffix1',
                v_attendee->>'suffix2',
                v_attendee->>'suffix3',
                v_attendee->>'dietaryRequirements',
                v_attendee->>'specialNeeds',
                v_contact_preference,
                COALESCE((v_attendee->>'hasPartner')::boolean, false),
                false,
                v_primary_attendee_id::text,
                'attendee',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END IF;
    END IF;
    
    -- Process additional attendees
    IF jsonb_array_length(p_registration_data->'additionalAttendees') > 0 THEN
        FOR v_attendee IN SELECT * FROM jsonb_array_elements(p_registration_data->'additionalAttendees')
        LOOP
            v_attendee_id := gen_random_uuid();
            
            -- Get attendee type
            v_attendee_type := LOWER(COALESCE(v_attendee->>'attendeeType', 'guest'));
            v_contact_preference := COALESCE(v_attendee->>'contactPreference', 'Directly');
            
            -- Extract email and phone
            v_attendee_email := COALESCE(
                v_attendee->>'primaryEmail',
                v_attendee->>'email'
            );
            
            v_attendee_phone := COALESCE(
                v_attendee->>'primaryPhone',
                v_attendee->>'mobileNumber',
                v_attendee->>'phone'
            );
            
            -- Insert additional attendee
            INSERT INTO attendees (
                attendee_id,
                registration_id,
                attendee_type,
                is_primary,
                related_attendee_id,
                first_name,
                last_name,
                title,
                suffix_1,
                suffix_2,
                suffix_3,
                dietary_requirements,
                special_needs,
                contact_preference,
                primary_email,
                primary_phone,
                attendee_data,
                created_at,
                updated_at
            ) VALUES (
                v_attendee_id,
                v_registration_id,
                v_attendee_type,
                false,
                CASE 
                    WHEN (v_attendee->>'isPartner')::boolean = true THEN v_primary_attendee_id
                    ELSE NULL
                END,
                v_attendee->>'firstName',
                v_attendee->>'lastName',
                v_attendee->>'title',
                v_attendee->>'suffix1',
                v_attendee->>'suffix2',
                v_attendee->>'suffix3',
                v_attendee->>'dietaryRequirements',
                v_attendee->>'specialNeeds',
                v_contact_preference,
                v_attendee_email,
                v_attendee_phone,
                v_attendee,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
            
            -- Create contact record for additional attendee if they want direct contact
            IF v_contact_preference = 'Directly' AND (v_attendee_email IS NOT NULL OR v_attendee_phone IS NOT NULL) THEN
                v_contact_id := gen_random_uuid();
                
                INSERT INTO contacts (
                    contact_id,
                    type,
                    first_name,
                    last_name,
                    email,
                    mobile_number,
                    title,
                    suffix_1,
                    suffix_2,
                    suffix_3,
                    dietary_requirements,
                    special_needs,
                    contact_preference,
                    has_partner,
                    is_partner,
                    source_id,
                    source_type,
                    created_at,
                    updated_at
                ) VALUES (
                    v_contact_id,
                    'attendee',
                    v_attendee->>'firstName',
                    v_attendee->>'lastName',
                    COALESCE(v_attendee_email, ''),
                    v_attendee_phone,
                    v_attendee->>'title',
                    v_attendee->>'suffix1',
                    v_attendee->>'suffix2',
                    v_attendee->>'suffix3',
                    v_attendee->>'dietaryRequirements',
                    v_attendee->>'specialNeeds',
                    v_contact_preference,
                    COALESCE((v_attendee->>'hasPartner')::boolean, false),
                    COALESCE((v_attendee->>'isPartner')::boolean, false),
                    v_attendee_id::text,
                    'attendee',
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                );
            END IF;
        END LOOP;
    END IF;
    
    -- Process tickets
    IF jsonb_array_length(p_registration_data->'tickets') > 0 THEN
        FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_registration_data->'tickets')
        LOOP
            INSERT INTO tickets (
                registration_id,
                attendee_id,
                event_ticket_id,
                ticket_status,
                ticket_price,
                created_at,
                updated_at
            ) VALUES (
                v_registration_id,
                (v_ticket->>'attendeeId')::uuid,
                COALESCE(
                    (v_ticket->>'eventTicketId')::uuid,
                    (v_ticket->>'ticketDefinitionId')::uuid
                ),
                'reserved',
                COALESCE((v_ticket->>'price')::decimal, 0),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END IF;
    
    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'confirmationNumber', v_confirmation_number,
        'customerId', v_customer_id,
        'bookingContactId', v_booking_contact_id,
        'primaryAttendeeId', v_primary_attendee_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error details
        RAISE NOTICE 'Error in upsert_individual_registration: %', SQLERRM;
        RAISE NOTICE 'Error detail: %', SQLSTATE;
        -- Re-raise the error
        RAISE;
END;
$$;


ALTER FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") IS 'Handles individual registration creation and updates. Confirmation numbers are now generated by Edge Function after payment completion.';



CREATE OR REPLACE FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text" DEFAULT 'pending'::"text", "p_stripe_payment_intent_id" "text" DEFAULT NULL::"text", "p_registration_id" "uuid" DEFAULT NULL::"uuid", "p_total_amount" numeric DEFAULT 0, "p_subtotal" numeric DEFAULT 0, "p_stripe_fee" numeric DEFAULT 0, "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_customer_id UUID;
    v_registration_id UUID;
    v_package RECORD;
    v_included_item RECORD;
    v_ticket_count INTEGER;
    v_existing_tickets INTEGER;
    v_result JSONB;
    v_created_tickets JSONB[] := '{}';
    v_lodge_org_id UUID;
    v_auth_user_id UUID;
    v_primary_attendee_name TEXT;
BEGIN
    -- Get authenticated user ID
    v_auth_user_id := auth.uid();
    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Validate inputs
    IF p_function_id IS NULL THEN
        RAISE EXCEPTION 'Function ID is required';
    END IF;
    
    IF p_package_id IS NULL THEN
        RAISE EXCEPTION 'Package ID is required';
    END IF;
    
    IF p_table_count < 1 THEN
        RAISE EXCEPTION 'Table count must be at least 1';
    END IF;
    
    -- Get package details
    SELECT * INTO v_package
    FROM packages
    WHERE package_id = p_package_id
    AND function_id = p_function_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Package not found for the specified function';
    END IF;
    
    -- Create or update customer record (lodge representative as booking contact)
    v_customer_id := v_auth_user_id; -- Use auth user ID as customer ID
    
    -- Set primary attendee name from booking contact
    v_primary_attendee_name := CONCAT(
        COALESCE(p_booking_contact->>'firstName', ''),
        ' ',
        COALESCE(p_booking_contact->>'lastName', '')
    );
    
    INSERT INTO customers (
        customer_id,
        email,
        first_name,
        last_name,
        phone,
        business_name,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        billing_organisation_name,
        billing_email,
        billing_phone,
        billing_street_address,
        billing_city,
        billing_state,
        billing_postal_code,
        billing_country,
        customer_type,
        created_at
    ) VALUES (
        v_customer_id,
        p_booking_contact->>'email',
        p_booking_contact->>'firstName',
        p_booking_contact->>'lastName',
        p_booking_contact->>'mobile',
        p_lodge_details->>'lodgeName', -- Lodge name as business name
        p_booking_contact->>'addressLine1',
        p_booking_contact->>'addressLine2',
        p_booking_contact->>'suburb',
        p_booking_contact->'stateTerritory'->>'name',
        p_booking_contact->>'postcode',
        COALESCE(p_booking_contact->'country'->>'name', 'Australia'),
        p_lodge_details->>'lodgeName', -- Billing org name
        p_booking_contact->>'email', -- Billing email
        p_booking_contact->>'mobile', -- Billing phone
        p_booking_contact->>'addressLine1', -- Billing address
        p_booking_contact->>'suburb', -- Billing city
        p_booking_contact->'stateTerritory'->>'name', -- Billing state
        p_booking_contact->>'postcode', -- Billing postal code
        COALESCE(p_booking_contact->'country'->>'name', 'Australia'), -- Billing country
        'booking_contact'::customer_type,
        NOW()
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, customers.email),
        first_name = COALESCE(EXCLUDED.first_name, customers.first_name),
        last_name = COALESCE(EXCLUDED.last_name, customers.last_name),
        phone = COALESCE(EXCLUDED.phone, customers.phone),
        business_name = COALESCE(EXCLUDED.business_name, customers.business_name),
        address_line1 = COALESCE(EXCLUDED.address_line1, customers.address_line1),
        address_line2 = COALESCE(EXCLUDED.address_line2, customers.address_line2),
        city = COALESCE(EXCLUDED.city, customers.city),
        state = COALESCE(EXCLUDED.state, customers.state),
        postal_code = COALESCE(EXCLUDED.postal_code, customers.postal_code),
        country = COALESCE(EXCLUDED.country, customers.country),
        billing_organisation_name = COALESCE(EXCLUDED.billing_organisation_name, customers.billing_organisation_name),
        billing_email = COALESCE(EXCLUDED.billing_email, customers.billing_email),
        billing_phone = COALESCE(EXCLUDED.billing_phone, customers.billing_phone),
        billing_street_address = COALESCE(EXCLUDED.billing_street_address, customers.billing_street_address),
        billing_city = COALESCE(EXCLUDED.billing_city, customers.billing_city),
        billing_state = COALESCE(EXCLUDED.billing_state, customers.billing_state),
        billing_postal_code = COALESCE(EXCLUDED.billing_postal_code, customers.billing_postal_code),
        billing_country = COALESCE(EXCLUDED.billing_country, customers.billing_country),
        updated_at = NOW();
    
    -- Get lodge organisation ID if provided
    v_lodge_org_id := (p_lodge_details->>'organisation_id')::UUID;
    
    -- UPSERT registration
    IF p_registration_id IS NOT NULL THEN
        -- Update existing registration for payment completion
        UPDATE registrations SET
            payment_status = p_payment_status,
            stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
            status = CASE 
                WHEN p_payment_status = 'completed' OR p_payment_status = 'paid' THEN 'confirmed'
                WHEN p_payment_status = 'failed' THEN 'cancelled'
                ELSE status
            END,
            total_amount_paid = CASE
                WHEN p_payment_status = 'completed' OR p_payment_status = 'paid' THEN p_total_amount
                ELSE total_amount_paid
            END,
            payment_completed_at = CASE
                WHEN p_payment_status = 'completed' OR p_payment_status = 'paid' THEN NOW()
                ELSE payment_completed_at
            END,
            updated_at = NOW()
        WHERE registration_id = p_registration_id
        RETURNING registration_id INTO v_registration_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Registration not found with ID: %', p_registration_id;
        END IF;
    ELSE
        -- Create new lodge registration
        INSERT INTO registrations (
            function_id,
            customer_id, -- Use customer_id instead of contact_id
            auth_user_id,
            organisation_id,
            organisation_name,
            organisation_number,
            primary_attendee,
            attendee_count,
            registration_type,
            status,
            payment_status,
            stripe_payment_intent_id,
            registration_date,
            agree_to_terms,
            total_amount_paid,
            total_price_paid,
            subtotal,
            stripe_fee,
            includes_processing_fee,
            registration_data,
            metadata
        ) VALUES (
            p_function_id,
            v_customer_id,
            v_auth_user_id,
            v_lodge_org_id,
            p_lodge_details->>'lodgeName',
            p_lodge_details->>'lodgeNumber',
            v_primary_attendee_name,
            p_table_count * COALESCE(v_package.qty, 10),
            'lodge'::registration_type,
            'pending',
            p_payment_status,
            p_stripe_payment_intent_id,
            NOW(),
            true,
            0, -- Will be updated on payment
            p_total_amount,
            p_subtotal,
            p_stripe_fee,
            p_stripe_fee > 0,
            jsonb_build_array(jsonb_build_object(
                'lodge_details', p_lodge_details,
                'lodge_name', p_lodge_details->>'lodgeName',
                'lodge_number', p_lodge_details->>'lodgeNumber',
                'table_count', p_table_count,
                'total_attendees', p_table_count * COALESCE(v_package.qty, 10),
                'booking_contact', p_booking_contact,
                'primary_attendee_name', v_primary_attendee_name,
                'package_id', p_package_id,
                'package_name', v_package.name,
                'package_price', v_package.price
            )),
            p_metadata
        )
        RETURNING registration_id INTO v_registration_id;
    END IF;
    
    -- Build result with confirmation number from registration
    SELECT jsonb_build_object(
        'success', true,
        'registrationId', registration_id,
        'confirmationNumber', COALESCE(confirmation_number, 'REG-' || SUBSTRING(registration_id::text FROM 1 FOR 8)),
        'customerId', v_customer_id,
        'bookingContactId', v_customer_id,
        'organisationName', p_lodge_details->>'lodgeName',
        'tableCount', p_table_count,
        'totalAttendees', p_table_count * COALESCE(v_package.qty, 10)
    ) INTO v_result
    FROM registrations
    WHERE registration_id = v_registration_id;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in upsert_lodge_registration: % %', SQLERRM, SQLSTATE;
END;
$$;


ALTER FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text", "p_stripe_payment_intent_id" "text", "p_registration_id" "uuid", "p_total_amount" numeric, "p_subtotal" numeric, "p_stripe_fee" numeric, "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text", "p_stripe_payment_intent_id" "text", "p_registration_id" "uuid", "p_total_amount" numeric, "p_subtotal" numeric, "p_stripe_fee" numeric, "p_metadata" "jsonb") IS 'Handles lodge registration creation and updates. Creates customer record for booking contact and registration record. No attendees or tickets are created for lodge registrations.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


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



CREATE OR REPLACE VIEW "public"."auth_user_customer_view" WITH ("security_invoker"='on') AS
 SELECT "au"."id" AS "auth_user_id",
    "au"."email" AS "auth_email",
    "c"."customer_id",
    "c"."organisation_id",
    "c"."first_name",
    "c"."last_name",
    "c"."business_name",
    "c"."email" AS "customer_email",
    "c"."phone",
    "c"."billing_organisation_name",
    "c"."billing_email",
    "c"."billing_phone",
    "c"."billing_street_address",
    "c"."billing_city",
    "c"."billing_state",
    "c"."billing_postal_code",
    "c"."billing_country",
    "c"."address_line1",
    "c"."address_line2",
    "c"."city",
    "c"."state",
    "c"."postal_code",
    "c"."country",
    "c"."stripe_customer_id",
    "c"."created_at",
    "c"."updated_at",
    "c"."contact_id",
    "c"."customer_type"
   FROM ("auth"."users" "au"
     LEFT JOIN "public"."customers" "c" ON (("c"."customer_id" = "au"."id")));


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



COMMENT ON COLUMN "public"."registrations"."confirmation_number" IS 'Unique confirmation number in format: [TYPE][YEAR][MONTH][RANDOM] where TYPE is IND/LDG/DEL, followed by YYYYMM and 2 random digits + 2 letters';



COMMENT ON COLUMN "public"."registrations"."organisation_id" IS 'Reference to the organisation making this registration (e.g., Lodge, Grand Lodge)';



COMMENT ON COLUMN "public"."registrations"."connected_account_id" IS 'Stripe connected account ID that received the payment';



COMMENT ON COLUMN "public"."registrations"."platform_fee_amount" IS 'Platform/marketplace fee amount for connected accounts';



COMMENT ON COLUMN "public"."registrations"."platform_fee_id" IS 'Stripe application fee ID';



COMMENT ON COLUMN "public"."registrations"."confirmation_pdf_url" IS 'URL to the stored confirmation PDF for this registration';



COMMENT ON COLUMN "public"."registrations"."subtotal" IS 'Original ticket price total before any fees';



COMMENT ON COLUMN "public"."registrations"."stripe_fee" IS 'Stripe processing fee passed to customer';



COMMENT ON COLUMN "public"."registrations"."includes_processing_fee" IS 'Whether the total_amount_paid includes the processing fee';



COMMENT ON COLUMN "public"."registrations"."auth_user_id" IS 'Auth user ID of the person who created the registration';



COMMENT ON COLUMN "public"."registrations"."organisation_name" IS 'Name of the organisation/lodge for lodge registrations';



COMMENT ON COLUMN "public"."registrations"."organisation_number" IS 'Number/ID of the organisation/lodge for lodge registrations';



COMMENT ON COLUMN "public"."registrations"."primary_attendee" IS 'Name of the primary attendee/representative (text, not foreign key)';



COMMENT ON COLUMN "public"."registrations"."attendee_count" IS 'Total number of attendees for the registration';



CREATE OR REPLACE VIEW "public"."registration_confirmation_base_view" AS
 SELECT "r"."registration_id",
    "r"."confirmation_number",
    "r"."customer_id",
    "r"."auth_user_id",
    "r"."function_id",
    "r"."registration_type",
    "r"."payment_status",
    "r"."status",
    "r"."total_amount_paid",
    "r"."subtotal",
    "r"."stripe_fee",
    "r"."stripe_payment_intent_id",
    "r"."registration_data",
    "r"."created_at" AS "registration_created_at",
    "r"."updated_at" AS "registration_updated_at",
    "f"."name" AS "function_name",
    "f"."slug" AS "function_slug",
    "f"."description" AS "function_description",
    "f"."image_url" AS "function_image_url",
    "f"."start_date" AS "function_start_date",
    "f"."end_date" AS "function_end_date",
    "f"."location_id" AS "function_location_id",
    "f"."organiser_id" AS "function_organiser_id",
    "f"."metadata" AS "function_metadata",
    "f"."is_published" AS "function_is_published",
    "f"."created_at" AS "function_created_at",
    "f"."updated_at" AS "function_updated_at",
    "f"."function_events",
    "fl"."place_name" AS "function_location_name",
    "fl"."street_address" AS "function_location_address",
    "fl"."suburb" AS "function_location_city",
    "fl"."state" AS "function_location_state",
    "fl"."country" AS "function_location_country",
    "fl"."postal_code" AS "function_location_postal_code",
    "fl"."latitude" AS "function_location_latitude",
    "fl"."longitude" AS "function_location_longitude",
    "c"."first_name" AS "customer_first_name",
    "c"."last_name" AS "customer_last_name",
    "c"."email" AS "customer_email",
    "c"."phone" AS "customer_phone",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'firstName'::"text") AS "billing_first_name",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'lastName'::"text") AS "billing_last_name",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'emailAddress'::"text") AS "billing_email",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'mobileNumber'::"text") AS "billing_phone",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'addressLine1'::"text") AS "billing_street_address",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'suburb'::"text") AS "billing_city",
    ((("r"."registration_data" -> 'billingDetails'::"text") -> 'stateTerritory'::"text") ->> 'name'::"text") AS "billing_state",
    (("r"."registration_data" -> 'billingDetails'::"text") ->> 'postcode'::"text") AS "billing_postal_code",
    ((("r"."registration_data" -> 'billingDetails'::"text") -> 'country'::"text") ->> 'name'::"text") AS "billing_country"
   FROM ((("public"."registrations" "r"
     LEFT JOIN "public"."functions" "f" ON (("r"."function_id" = "f"."function_id")))
     LEFT JOIN "public"."locations" "fl" ON (("f"."location_id" = "fl"."location_id")))
     LEFT JOIN "public"."customers" "c" ON (("r"."customer_id" = "c"."customer_id")))
  WHERE (("r"."confirmation_number" IS NOT NULL) AND (("r"."payment_status" = 'completed'::"public"."payment_status") OR (("r"."status")::"text" = 'completed'::"text")));


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



CREATE OR REPLACE VIEW "public"."delegation_registration_confirmation_view" AS
 SELECT "b"."registration_id",
    "b"."confirmation_number",
    "b"."customer_id",
    "b"."auth_user_id",
    "b"."function_id",
    "b"."registration_type",
    "b"."payment_status",
    "b"."status",
    "b"."total_amount_paid",
    "b"."subtotal",
    "b"."stripe_fee",
    "b"."stripe_payment_intent_id",
    "b"."registration_data",
    "b"."registration_created_at",
    "b"."registration_updated_at",
    "b"."function_name",
    "b"."function_slug",
    "b"."function_description",
    "b"."function_image_url",
    "b"."function_start_date",
    "b"."function_end_date",
    "b"."function_location_id",
    "b"."function_organiser_id",
    "b"."function_metadata",
    "b"."function_is_published",
    "b"."function_created_at",
    "b"."function_updated_at",
    "b"."function_events",
    "b"."function_location_name",
    "b"."function_location_address",
    "b"."function_location_city",
    "b"."function_location_state",
    "b"."function_location_country",
    "b"."function_location_postal_code",
    "b"."function_location_latitude",
    "b"."function_location_longitude",
    "b"."customer_first_name",
    "b"."customer_last_name",
    "b"."customer_email",
    "b"."customer_phone",
    "b"."billing_first_name",
    "b"."billing_last_name",
    "b"."billing_email",
    "b"."billing_phone",
    "b"."billing_street_address",
    "b"."billing_city",
    "b"."billing_state",
    "b"."billing_postal_code",
    "b"."billing_country",
    ("b"."registration_data" ->> 'delegationName'::"text") AS "delegation_name",
    ("b"."registration_data" ->> 'delegationType'::"text") AS "delegation_type",
    ("b"."registration_data" ->> 'leadDelegateId'::"text") AS "lead_delegate_id",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('attendeeId', "a"."attendee_id", 'isPrimary', "a"."is_primary", 'attendeeType', "a"."attendee_type", 'firstName', "a"."first_name", 'lastName', "a"."last_name", 'title', "a"."title", 'suffix', "a"."suffix", 'dietaryRequirements', "a"."dietary_requirements", 'specialNeeds', "a"."special_needs", 'contactPreference', "a"."contact_preference", 'primaryEmail', "a"."email", 'primaryPhone', "a"."phone", 'delegateRole',
        CASE
            WHEN (("a"."attendee_id")::"text" = ("b"."registration_data" ->> 'leadDelegateId'::"text")) THEN 'Lead Delegate'::"text"
            ELSE 'Delegate'::"text"
        END)) FILTER (WHERE ("a"."attendee_id" IS NOT NULL)), '[]'::"jsonb") AS "delegation_members",
    "count"(DISTINCT "a"."attendee_id") AS "total_delegates",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('ticketId', "t"."ticket_id", 'attendeeId', "t"."attendee_id", 'ticketStatus', "t"."ticket_status", 'ticketPrice', "t"."ticket_price")) FILTER (WHERE ("t"."ticket_id" IS NOT NULL)), '[]'::"jsonb") AS "tickets",
    "count"(DISTINCT "t"."ticket_id") AS "total_tickets"
   FROM (("public"."registration_confirmation_base_view" "b"
     LEFT JOIN "public"."attendees" "a" ON (("b"."registration_id" = "a"."registration_id")))
     LEFT JOIN "public"."tickets" "t" ON (("b"."registration_id" = "t"."registration_id")))
  WHERE ("b"."registration_type" = 'delegation'::"public"."registration_type")
  GROUP BY "b"."registration_id", "b"."confirmation_number", "b"."customer_id", "b"."auth_user_id", "b"."function_id", "b"."registration_type", "b"."payment_status", "b"."status", "b"."total_amount_paid", "b"."subtotal", "b"."stripe_fee", "b"."stripe_payment_intent_id", "b"."registration_data", "b"."registration_created_at", "b"."registration_updated_at", "b"."function_name", "b"."function_slug", "b"."function_description", "b"."function_image_url", "b"."function_start_date", "b"."function_end_date", "b"."function_location_id", "b"."function_organiser_id", "b"."function_metadata", "b"."function_is_published", "b"."function_created_at", "b"."function_updated_at", "b"."function_events", "b"."function_location_name", "b"."function_location_address", "b"."function_location_city", "b"."function_location_state", "b"."function_location_country", "b"."function_location_postal_code", "b"."function_location_latitude", "b"."function_location_longitude", "b"."customer_first_name", "b"."customer_last_name", "b"."customer_email", "b"."customer_phone", "b"."billing_first_name", "b"."billing_last_name", "b"."billing_email", "b"."billing_phone", "b"."billing_street_address", "b"."billing_city", "b"."billing_state", "b"."billing_postal_code", "b"."billing_country";


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



CREATE OR REPLACE VIEW "public"."event_tickets_with_id" WITH ("security_invoker"='on') AS
 SELECT "event_tickets"."event_ticket_id",
    "event_tickets"."event_ticket_id" AS "id",
    "event_tickets"."event_id",
    "event_tickets"."name",
    "event_tickets"."description",
    "event_tickets"."price",
    "event_tickets"."total_capacity",
    "event_tickets"."available_count",
    "event_tickets"."reserved_count",
    "event_tickets"."sold_count",
    "event_tickets"."status",
    "event_tickets"."is_active",
    "event_tickets"."created_at",
    "event_tickets"."updated_at",
    "event_tickets"."eligibility_criteria",
    "event_tickets"."stripe_price_id"
   FROM "public"."event_tickets";


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



CREATE OR REPLACE VIEW "public"."events_with_id" WITH ("security_invoker"='on') AS
 SELECT "events"."event_id",
    "events"."event_id" AS "id",
    "events"."attendance",
    "events"."created_at",
    "events"."degree_type",
    "events"."description",
    "events"."display_scope_id",
    "events"."documents",
    "events"."dress_code",
    "events"."event_end",
    "events"."event_includes",
    "events"."event_start",
    "events"."featured",
    "events"."function_id",
    "events"."image_url",
    "events"."important_information",
    "events"."is_multi_day",
    "events"."is_published",
    "events"."is_purchasable_individually",
    "events"."location_id",
    "events"."max_attendees",
    "events"."organiser_id",
    "events"."regalia",
    "events"."regalia_description",
    "events"."registration_availability_id",
    "events"."related_events",
    "events"."reserved_count",
    "events"."sections",
    "events"."slug",
    "events"."sold_count",
    "events"."stripe_product_id",
    "events"."subtitle",
    "events"."title",
    "events"."type"
   FROM "public"."events";


ALTER TABLE "public"."events_with_id" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."function_event_tickets_view" WITH ("security_invoker"='on') AS
 SELECT "f"."function_id",
    "f"."name" AS "function_name",
    "f"."slug" AS "function_slug",
    "f"."description" AS "function_description",
    "f"."start_date" AS "function_start_date",
    "f"."end_date" AS "function_end_date",
    "e"."event_id",
    "e"."title" AS "event_title",
    "e"."slug" AS "event_slug",
    "e"."event_start",
    "e"."event_end",
    "e"."type" AS "event_type",
    "e"."is_published" AS "event_is_published",
    "et"."event_ticket_id",
    "et"."name" AS "ticket_name",
    "et"."description" AS "ticket_description",
    "et"."price" AS "ticket_price",
    "et"."total_capacity",
    "et"."available_count",
    "et"."reserved_count",
    "et"."sold_count",
    "et"."status" AS "ticket_status",
    "et"."is_active" AS "ticket_is_active",
    "et"."eligibility_criteria" AS "ticket_eligibility_criteria",
    "et"."stripe_price_id",
    "et"."created_at" AS "ticket_created_at",
    "et"."updated_at" AS "ticket_updated_at"
   FROM (("public"."functions" "f"
     JOIN "public"."events" "e" ON (("f"."function_id" = "e"."function_id")))
     JOIN "public"."event_tickets" "et" ON (("e"."event_id" = "et"."event_id")))
  WHERE (("e"."is_published" = true) AND ("et"."is_active" = true));


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



CREATE OR REPLACE VIEW "public"."function_packages_view" WITH ("security_invoker"='on') AS
 SELECT "f"."function_id",
    "f"."name" AS "function_name",
    "f"."slug" AS "function_slug",
    "f"."description" AS "function_description",
    "f"."start_date" AS "function_start_date",
    "f"."end_date" AS "function_end_date",
    "p"."package_id",
    "p"."name" AS "package_name",
    "p"."description" AS "package_description",
    "p"."original_price",
    "p"."discount",
    "p"."package_price",
    "p"."is_active",
    "p"."includes_description",
    "p"."qty",
    "p"."included_items",
    "p"."eligibility_criteria",
    "p"."registration_types",
    "p"."created_at" AS "package_created_at",
    "p"."updated_at" AS "package_updated_at",
    "p"."event_id"
   FROM ("public"."functions" "f"
     JOIN "public"."packages" "p" ON (("f"."function_id" = "p"."function_id")))
  WHERE ("p"."is_active" = true);


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



CREATE OR REPLACE VIEW "public"."individuals_registration_confirmation_view" AS
 SELECT "b"."registration_id",
    "b"."confirmation_number",
    "b"."customer_id",
    "b"."auth_user_id",
    "b"."function_id",
    "b"."registration_type",
    "b"."payment_status",
    "b"."status",
    "b"."total_amount_paid",
    "b"."subtotal",
    "b"."stripe_fee",
    "b"."stripe_payment_intent_id",
    "b"."registration_data",
    "b"."registration_created_at",
    "b"."registration_updated_at",
    "b"."function_name",
    "b"."function_slug",
    "b"."function_description",
    "b"."function_image_url",
    "b"."function_start_date",
    "b"."function_end_date",
    "b"."function_location_id",
    "b"."function_organiser_id",
    "b"."function_metadata",
    "b"."function_is_published",
    "b"."function_created_at",
    "b"."function_updated_at",
    "b"."function_events",
    "b"."function_location_name",
    "b"."function_location_address",
    "b"."function_location_city",
    "b"."function_location_state",
    "b"."function_location_country",
    "b"."function_location_postal_code",
    "b"."function_location_latitude",
    "b"."function_location_longitude",
    "b"."customer_first_name",
    "b"."customer_last_name",
    "b"."customer_email",
    "b"."customer_phone",
    "b"."billing_first_name",
    "b"."billing_last_name",
    "b"."billing_email",
    "b"."billing_phone",
    "b"."billing_street_address",
    "b"."billing_city",
    "b"."billing_state",
    "b"."billing_postal_code",
    "b"."billing_country",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('attendeeId', "a"."attendee_id", 'isPrimary', "a"."is_primary", 'attendeeType', "a"."attendee_type", 'firstName', "a"."first_name", 'lastName', "a"."last_name", 'title', "a"."title", 'suffix', "a"."suffix", 'dietaryRequirements', "a"."dietary_requirements", 'specialNeeds', "a"."special_needs", 'contactPreference', "a"."contact_preference", 'primaryEmail', "a"."email", 'primaryPhone', "a"."phone", 'relatedAttendeeId', "a"."related_attendee_id")) FILTER (WHERE ("a"."attendee_id" IS NOT NULL)), '[]'::"jsonb") AS "attendees",
    "count"(DISTINCT "a"."attendee_id") AS "total_attendees",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('ticketId', "t"."ticket_id", 'attendeeId', "t"."attendee_id", 'ticketStatus', "t"."ticket_status", 'ticketPrice', "t"."ticket_price")) FILTER (WHERE ("t"."ticket_id" IS NOT NULL)), '[]'::"jsonb") AS "tickets",
    "count"(DISTINCT "t"."ticket_id") AS "total_tickets"
   FROM (("public"."registration_confirmation_base_view" "b"
     LEFT JOIN "public"."attendees" "a" ON (("b"."registration_id" = "a"."registration_id")))
     LEFT JOIN "public"."tickets" "t" ON (("b"."registration_id" = "t"."registration_id")))
  WHERE ("b"."registration_type" = 'individuals'::"public"."registration_type")
  GROUP BY "b"."registration_id", "b"."confirmation_number", "b"."customer_id", "b"."auth_user_id", "b"."function_id", "b"."registration_type", "b"."payment_status", "b"."status", "b"."total_amount_paid", "b"."subtotal", "b"."stripe_fee", "b"."stripe_payment_intent_id", "b"."registration_data", "b"."registration_created_at", "b"."registration_updated_at", "b"."function_name", "b"."function_slug", "b"."function_description", "b"."function_image_url", "b"."function_start_date", "b"."function_end_date", "b"."function_location_id", "b"."function_organiser_id", "b"."function_metadata", "b"."function_is_published", "b"."function_created_at", "b"."function_updated_at", "b"."function_events", "b"."function_location_name", "b"."function_location_address", "b"."function_location_city", "b"."function_location_state", "b"."function_location_country", "b"."function_location_postal_code", "b"."function_location_latitude", "b"."function_location_longitude", "b"."customer_first_name", "b"."customer_last_name", "b"."customer_email", "b"."customer_phone", "b"."billing_first_name", "b"."billing_last_name", "b"."billing_email", "b"."billing_phone", "b"."billing_street_address", "b"."billing_city", "b"."billing_state", "b"."billing_postal_code", "b"."billing_country";


ALTER TABLE "public"."individuals_registration_confirmation_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."lodge_registration_confirmation_view" AS
 SELECT "b"."registration_id",
    "b"."confirmation_number",
    "b"."customer_id",
    "b"."auth_user_id",
    "b"."function_id",
    "b"."registration_type",
    "b"."payment_status",
    "b"."status",
    "b"."total_amount_paid",
    "b"."subtotal",
    "b"."stripe_fee",
    "b"."stripe_payment_intent_id",
    "b"."registration_data",
    "b"."registration_created_at",
    "b"."registration_updated_at",
    "b"."function_name",
    "b"."function_slug",
    "b"."function_description",
    "b"."function_image_url",
    "b"."function_start_date",
    "b"."function_end_date",
    "b"."function_location_id",
    "b"."function_organiser_id",
    "b"."function_metadata",
    "b"."function_is_published",
    "b"."function_created_at",
    "b"."function_updated_at",
    "b"."function_events",
    "b"."function_location_name",
    "b"."function_location_address",
    "b"."function_location_city",
    "b"."function_location_state",
    "b"."function_location_country",
    "b"."function_location_postal_code",
    "b"."function_location_latitude",
    "b"."function_location_longitude",
    "b"."customer_first_name",
    "b"."customer_last_name",
    "b"."customer_email",
    "b"."customer_phone",
    "b"."billing_first_name",
    "b"."billing_last_name",
    "b"."billing_email",
    "b"."billing_phone",
    "b"."billing_street_address",
    "b"."billing_city",
    "b"."billing_state",
    "b"."billing_postal_code",
    "b"."billing_country",
    ("b"."registration_data" ->> 'lodgeName'::"text") AS "lodge_name",
    ("b"."registration_data" ->> 'lodgeNumber'::"text") AS "lodge_number",
    ("b"."registration_data" ->> 'lodgeId'::"text") AS "lodge_id",
    ("b"."registration_data" ->> 'grandLodgeId'::"text") AS "grand_lodge_id",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('attendeeId', "a"."attendee_id", 'isPrimary', "a"."is_primary", 'attendeeType', "a"."attendee_type", 'firstName', "a"."first_name", 'lastName', "a"."last_name", 'title', "a"."title", 'suffix', "a"."suffix", 'dietaryRequirements', "a"."dietary_requirements", 'specialNeeds', "a"."special_needs", 'contactPreference', "a"."contact_preference", 'primaryEmail', "a"."email", 'primaryPhone', "a"."phone")) FILTER (WHERE ("a"."attendee_id" IS NOT NULL)), '[]'::"jsonb") AS "lodge_members",
    "count"(DISTINCT "a"."attendee_id") AS "total_members",
    '[]'::"jsonb" AS "member_tickets",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('ticketId', "t"."ticket_id", 'attendeeId', "t"."attendee_id", 'packageId', "t"."package_id", 'ticketStatus', "t"."ticket_status", 'ticketPrice', "t"."ticket_price", 'packageName', "p"."name", 'packageDescription', "p"."description")) FILTER (WHERE ("t"."ticket_id" IS NOT NULL)), '[]'::"jsonb") AS "tickets",
    "count"(DISTINCT "t"."ticket_id") AS "total_tickets",
    COALESCE("jsonb_agg"(DISTINCT "jsonb_build_object"('packageId', "p"."package_id", 'packageName', "p"."name", 'packagePrice', "p"."package_price", 'packageDescription', "p"."description", 'ticketCount', ( SELECT "count"(*) AS "count"
           FROM "public"."tickets" "t2"
          WHERE (("t2"."package_id" = "p"."package_id") AND ("t2"."registration_id" = "b"."registration_id"))))) FILTER (WHERE ("p"."package_id" IS NOT NULL)), '[]'::"jsonb") AS "packages"
   FROM ((("public"."registration_confirmation_base_view" "b"
     LEFT JOIN "public"."attendees" "a" ON (("b"."registration_id" = "a"."registration_id")))
     LEFT JOIN "public"."tickets" "t" ON (("b"."registration_id" = "t"."registration_id")))
     LEFT JOIN "public"."packages" "p" ON (("t"."package_id" = "p"."package_id")))
  WHERE ("b"."registration_type" = 'lodge'::"public"."registration_type")
  GROUP BY "b"."registration_id", "b"."confirmation_number", "b"."customer_id", "b"."auth_user_id", "b"."function_id", "b"."registration_type", "b"."payment_status", "b"."status", "b"."total_amount_paid", "b"."subtotal", "b"."stripe_fee", "b"."stripe_payment_intent_id", "b"."registration_data", "b"."registration_created_at", "b"."registration_updated_at", "b"."function_name", "b"."function_slug", "b"."function_description", "b"."function_image_url", "b"."function_start_date", "b"."function_end_date", "b"."function_location_id", "b"."function_organiser_id", "b"."function_metadata", "b"."function_is_published", "b"."function_created_at", "b"."function_updated_at", "b"."function_events", "b"."function_location_name", "b"."function_location_address", "b"."function_location_city", "b"."function_location_state", "b"."function_location_country", "b"."function_location_postal_code", "b"."function_location_latitude", "b"."function_location_longitude", "b"."customer_first_name", "b"."customer_last_name", "b"."customer_email", "b"."customer_phone", "b"."billing_first_name", "b"."billing_last_name", "b"."billing_email", "b"."billing_phone", "b"."billing_street_address", "b"."billing_city", "b"."billing_state", "b"."billing_postal_code", "b"."billing_country";


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



CREATE OR REPLACE VIEW "public"."memberships_view" AS
 SELECT "m"."membership_id",
    "m"."contact_id",
    "c"."first_name",
    "c"."last_name",
    "c"."email",
    "m"."profile_id",
    "mp"."masonic_title",
    "m"."role",
    "m"."permissions",
    "m"."membership_type",
    "m"."membership_entity_id",
        CASE
            WHEN (("m"."membership_type")::"text" = 'lodge'::"text") THEN "l"."name"
            WHEN (("m"."membership_type")::"text" = 'grand_lodge'::"text") THEN "gl"."name"
            WHEN (("m"."membership_type")::"text" = 'organisation'::"text") THEN ("o"."name")::"text"
            ELSE 'Unknown'::"text"
        END AS "entity_name",
    "m"."is_active",
    "m"."created_at"
   FROM ((((("public"."memberships" "m"
     JOIN "public"."contacts" "c" ON (("m"."contact_id" = "c"."contact_id")))
     LEFT JOIN "public"."masonic_profiles" "mp" ON (("m"."profile_id" = "mp"."masonic_profile_id")))
     LEFT JOIN "public"."lodges" "l" ON (((("m"."membership_type")::"text" = 'lodge'::"text") AND ("m"."membership_entity_id" = "l"."lodge_id"))))
     LEFT JOIN "public"."grand_lodges" "gl" ON (((("m"."membership_type")::"text" = 'grand_lodge'::"text") AND ("m"."membership_entity_id" = "gl"."grand_lodge_id"))))
     LEFT JOIN "public"."organisations" "o" ON (((("m"."membership_type")::"text" = 'organisation'::"text") AND ("m"."membership_entity_id" = "o"."organisation_id"))));


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


CREATE OR REPLACE VIEW "public"."ticket_availability_view" WITH ("security_invoker"='on') AS
 SELECT "et"."event_ticket_id" AS "ticket_type_id",
    "et"."event_id",
    "et"."name" AS "ticket_type_name",
    "et"."description",
    "et"."price",
    "et"."total_capacity",
    "et"."available_count",
    "et"."reserved_count",
    "et"."sold_count",
    "et"."status",
    "et"."is_active",
    "et"."eligibility_criteria",
    "et"."created_at",
    "et"."updated_at",
    "e"."title" AS "event_title",
    "e"."slug" AS "event_slug",
    "e"."event_start",
    "e"."event_end",
    "e"."is_published" AS "event_is_published",
        CASE
            WHEN (("et"."total_capacity" IS NULL) OR ("et"."total_capacity" = 0)) THEN (0)::numeric
            ELSE "round"(((("et"."sold_count")::numeric / ("et"."total_capacity")::numeric) * (100)::numeric), 2)
        END AS "percentage_sold",
        CASE
            WHEN (("et"."available_count" IS NULL) OR ("et"."available_count" = 0)) THEN true
            ELSE false
        END AS "is_sold_out",
    ( SELECT "count"(*) AS "count"
           FROM "public"."tickets" "t"
          WHERE (("t"."ticket_type_id" = "et"."event_ticket_id") AND ("t"."reservation_id" IS NOT NULL) AND ("t"."reservation_expires_at" > "now"()) AND (("t"."status")::"text" = 'reserved'::"text"))) AS "active_reservations",
        CASE
            WHEN ("et"."available_count" IS NULL) THEN (0)::bigint
            ELSE GREATEST((0)::bigint, ("et"."available_count" - ( SELECT "count"(*) AS "count"
               FROM "public"."tickets" "t"
              WHERE (("t"."ticket_type_id" = "et"."event_ticket_id") AND ("t"."reservation_id" IS NOT NULL) AND ("t"."reservation_expires_at" > "now"()) AND (("t"."status")::"text" = 'reserved'::"text")))))
        END AS "actual_available",
    ("et"."eligibility_criteria" ->> 'category'::"text") AS "ticket_category",
    ("et"."eligibility_criteria" -> 'rules'::"text") AS "eligibility_rules",
        CASE
            WHEN ("jsonb_array_length"(("et"."eligibility_criteria" -> 'rules'::"text")) > 0) THEN true
            ELSE false
        END AS "has_eligibility_requirements"
   FROM ("public"."event_tickets" "et"
     JOIN "public"."events" "e" ON (("et"."event_id" = "e"."event_id")))
  WHERE ("et"."is_active" = true);


ALTER TABLE "public"."ticket_availability_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."tickets_with_id" WITH ("security_invoker"='on') AS
 SELECT "tickets"."ticket_id",
    "tickets"."ticket_id" AS "id",
    "tickets"."attendee_id",
    "tickets"."checked_in_at",
    "tickets"."created_at",
    "tickets"."currency",
    "tickets"."event_id",
    "tickets"."is_partner_ticket",
    "tickets"."original_price",
    "tickets"."package_id",
    "tickets"."payment_status",
    "tickets"."price_paid",
    "tickets"."purchased_at",
    "tickets"."qr_code_url",
    "tickets"."registration_id",
    "tickets"."reservation_expires_at",
    "tickets"."reservation_id",
    "tickets"."seat_info",
    "tickets"."status",
    "tickets"."ticket_price",
    "tickets"."ticket_status",
    "tickets"."ticket_type_id",
    "tickets"."updated_at"
   FROM "public"."tickets";


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



CREATE INDEX "idx_attendee_events_attendee_id" ON "public"."attendee_events" USING "btree" ("attendee_id");



CREATE INDEX "idx_attendee_events_event_id" ON "public"."attendee_events" USING "btree" ("event_id");



CREATE INDEX "idx_attendees_auth_user_id" ON "public"."attendees" USING "btree" ("auth_user_id");



CREATE INDEX "idx_attendees_contact" ON "public"."attendees" USING "btree" ("contact_id") WHERE ("contact_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_attendees_contact" IS 'Contact lookup for attendees to join with masonic profiles';



CREATE INDEX "idx_attendees_contact_id" ON "public"."attendees" USING "btree" ("contact_id");



CREATE INDEX "idx_attendees_event_title" ON "public"."attendees" USING "btree" ("event_title");



CREATE INDEX "idx_attendees_is_primary" ON "public"."attendees" USING "btree" ("is_primary") WHERE ("is_primary" = true);



CREATE INDEX "idx_attendees_qr_code_url" ON "public"."attendees" USING "btree" ("qr_code_url") WHERE ("qr_code_url" IS NOT NULL);



CREATE INDEX "idx_attendees_registration" ON "public"."attendees" USING "btree" ("registration_id");



COMMENT ON INDEX "public"."idx_attendees_registration" IS 'All attendees for a registration';



CREATE INDEX "idx_attendees_registration_id" ON "public"."attendees" USING "btree" ("registration_id");



CREATE INDEX "idx_attendees_registration_primary" ON "public"."attendees" USING "btree" ("registration_id", "is_primary") WHERE ("is_primary" = true);



COMMENT ON INDEX "public"."idx_attendees_registration_primary" IS 'Quick primary attendee lookup';



CREATE INDEX "idx_attendees_related" ON "public"."attendees" USING "btree" ("related_attendee_id") WHERE ("related_attendee_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_attendees_related" IS 'Find related attendees (partners)';



CREATE INDEX "idx_attendees_related_attendee_id" ON "public"."attendees" USING "btree" ("related_attendee_id");



CREATE INDEX "idx_connected_payments_account" ON "public"."connected_account_payments" USING "btree" ("connected_account_id");



CREATE INDEX "idx_connected_payments_registration" ON "public"."connected_account_payments" USING "btree" ("registration_id");



COMMENT ON INDEX "public"."idx_connected_payments_registration" IS 'Connected account payment history';



CREATE INDEX "idx_contacts_auth_user" ON "public"."contacts" USING "btree" ("auth_user_id") WHERE ("auth_user_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_contacts_auth_user" IS 'Contact record for authenticated user';



CREATE INDEX "idx_contacts_auth_user_id" ON "public"."contacts" USING "btree" ("auth_user_id");



CREATE INDEX "idx_contacts_email" ON "public"."contacts" USING "btree" ("email");



CREATE INDEX "idx_contacts_email_lower" ON "public"."contacts" USING "btree" ("lower"("email"));



COMMENT ON INDEX "public"."idx_contacts_email_lower" IS 'Case-insensitive email search';



CREATE INDEX "idx_contacts_organisation_id" ON "public"."contacts" USING "btree" ("organisation_id");



CREATE INDEX "idx_contacts_source" ON "public"."contacts" USING "btree" ("source_type", "source_id");



CREATE INDEX "idx_customers_contact_id" ON "public"."customers" USING "btree" ("contact_id");



CREATE INDEX "idx_customers_created_at" ON "public"."customers" USING "btree" ("created_at");



CREATE INDEX "idx_customers_customer_type" ON "public"."customers" USING "btree" ("customer_type");



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");



CREATE INDEX "idx_customers_phone" ON "public"."customers" USING "btree" ("phone");



CREATE INDEX "idx_customers_stripe_id" ON "public"."customers" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_event_tickets_active" ON "public"."event_tickets" USING "btree" ("event_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_event_tickets_active_available" ON "public"."event_tickets" USING "btree" ("event_id", "available_count") WHERE (("is_active" = true) AND (("status")::"text" = 'Active'::"text") AND ("available_count" > 0));



COMMENT ON INDEX "public"."idx_event_tickets_active_available" IS 'Available tickets for sale';



CREATE INDEX "idx_event_tickets_eligibility_criteria" ON "public"."event_tickets" USING "gin" ("eligibility_criteria");



CREATE INDEX "idx_event_tickets_event_active" ON "public"."event_tickets" USING "btree" ("event_id", "is_active", "status");



COMMENT ON INDEX "public"."idx_event_tickets_event_active" IS 'Active ticket types for an event';



CREATE INDEX "idx_event_tickets_event_id" ON "public"."event_tickets" USING "btree" ("event_id");



CREATE INDEX "idx_event_tickets_stripe_price_id" ON "public"."event_tickets" USING "btree" ("stripe_price_id") WHERE ("stripe_price_id" IS NOT NULL);



CREATE INDEX "idx_events_capacity" ON "public"."events" USING "btree" ("reserved_count", "sold_count") WHERE (("reserved_count" > 0) OR ("sold_count" > 0));



CREATE INDEX "idx_events_date_range" ON "public"."events" USING "btree" ("event_start", "event_end") WHERE ("is_published" = true);



COMMENT ON INDEX "public"."idx_events_date_range" IS 'Date range queries for published events';



CREATE INDEX "idx_events_display_scope_id" ON "public"."events" USING "btree" ("display_scope_id");



CREATE INDEX "idx_events_featured_published" ON "public"."events" USING "btree" ("featured", "is_published", "event_start" DESC) WHERE ("featured" = true);



COMMENT ON INDEX "public"."idx_events_featured_published" IS 'Fast retrieval of featured published events sorted by start date';



CREATE INDEX "idx_events_function" ON "public"."events" USING "btree" ("function_id");



CREATE INDEX "idx_events_location_id" ON "public"."events" USING "btree" ("location_id");



CREATE INDEX "idx_events_location_org" ON "public"."events" USING "btree" ("event_id", "location_id", "organiser_id");



COMMENT ON INDEX "public"."idx_events_location_org" IS 'Composite index for event display view';



CREATE INDEX "idx_events_organiser" ON "public"."events" USING "btree" ("organiser_id", "event_start" DESC) WHERE ("is_published" = true);



COMMENT ON INDEX "public"."idx_events_organiser" IS 'Organisation events listing';



CREATE INDEX "idx_events_organiser_id" ON "public"."events" USING "btree" ("organiser_id");



CREATE INDEX "idx_events_registration_availability_id" ON "public"."events" USING "btree" ("registration_availability_id");



CREATE INDEX "idx_events_slug" ON "public"."events" USING "btree" ("slug");



COMMENT ON INDEX "public"."idx_events_slug" IS 'Fast lookup of events by URL slug';



CREATE INDEX "idx_events_stripe_product_id" ON "public"."events" USING "btree" ("stripe_product_id") WHERE ("stripe_product_id" IS NOT NULL);



CREATE INDEX "idx_functions_organiser" ON "public"."functions" USING "btree" ("organiser_id");



CREATE INDEX "idx_functions_published" ON "public"."functions" USING "btree" ("is_published");



CREATE INDEX "idx_functions_slug" ON "public"."functions" USING "btree" ("slug");



CREATE INDEX "idx_grand_lodges_organisationid" ON "public"."grand_lodges" USING "btree" ("organisation_id");



CREATE INDEX "idx_lodges_grand_lodge" ON "public"."lodges" USING "btree" ("grand_lodge_id");



COMMENT ON INDEX "public"."idx_lodges_grand_lodge" IS 'Lodges under a grand lodge';



CREATE INDEX "idx_lodges_grand_lodge_id" ON "public"."lodges" USING "btree" ("grand_lodge_id");



CREATE INDEX "idx_lodges_organisationid" ON "public"."lodges" USING "btree" ("organisation_id");



CREATE INDEX "idx_masonic_profiles_contact" ON "public"."masonic_profiles" USING "btree" ("contact_id");



COMMENT ON INDEX "public"."idx_masonic_profiles_contact" IS 'Masonic profile lookup by contact';



CREATE INDEX "idx_masonic_profiles_contact_id" ON "public"."masonic_profiles" USING "btree" ("contact_id");



CREATE INDEX "idx_masonic_profiles_lodge_id" ON "public"."masonic_profiles" USING "btree" ("lodge_id");



CREATE INDEX "idx_masonicprofiles_grandlodgeid" ON "public"."masonic_profiles" USING "btree" ("grand_lodge_id");



CREATE INDEX "idx_memberships_contact_active" ON "public"."memberships" USING "btree" ("contact_id", "is_active") WHERE ("is_active" = true);



COMMENT ON INDEX "public"."idx_memberships_contact_active" IS 'Active memberships for a contact';



CREATE INDEX "idx_memberships_contact_id" ON "public"."memberships" USING "btree" ("contact_id");



CREATE INDEX "idx_memberships_is_active" ON "public"."memberships" USING "btree" ("is_active");



CREATE INDEX "idx_memberships_profile_id" ON "public"."memberships" USING "btree" ("profile_id");



CREATE INDEX "idx_memberships_type_entity" ON "public"."memberships" USING "btree" ("membership_type", "membership_entity_id");



CREATE INDEX "idx_organisation_payouts_created_at" ON "public"."organisation_payouts" USING "btree" ("created_at");



CREATE INDEX "idx_organisation_payouts_stripe_id" ON "public"."organisation_payouts" USING "btree" ("organisation_stripe_id");



CREATE INDEX "idx_organisation_users_organisation_id" ON "public"."organisation_users" USING "btree" ("organisation_id");



CREATE INDEX "idx_organisation_users_user_id" ON "public"."organisation_users" USING "btree" ("user_id");



CREATE INDEX "idx_packages_eligibility_criteria" ON "public"."packages" USING "gin" ("eligibility_criteria");



CREATE INDEX "idx_packages_event_id" ON "public"."packages" USING "btree" ("event_id");



CREATE INDEX "idx_packages_function" ON "public"."packages" USING "btree" ("function_id");



CREATE INDEX "idx_packages_is_active" ON "public"."packages" USING "btree" ("is_active");



CREATE INDEX "idx_platform_transfers_destination" ON "public"."platform_transfers" USING "btree" ("destination_account");



CREATE INDEX "idx_raw_registrations_created_at" ON "public"."raw_registrations" USING "btree" ("created_at");



CREATE INDEX "idx_registrations_attendee_count" ON "public"."registrations" USING "btree" ("attendee_count");



CREATE INDEX "idx_registrations_auth_user_id" ON "public"."registrations" USING "btree" ("auth_user_id");



CREATE INDEX "idx_registrations_confirmation_number" ON "public"."registrations" USING "btree" ("confirmation_number");



CREATE INDEX "idx_registrations_confirmation_type" ON "public"."registrations" USING "btree" ("confirmation_number", "registration_type") WHERE ("confirmation_number" IS NOT NULL);



CREATE INDEX "idx_registrations_created_at" ON "public"."registrations" USING "btree" ("created_at");



CREATE INDEX "idx_registrations_customer_id" ON "public"."registrations" USING "btree" ("customer_id");



CREATE INDEX "idx_registrations_function" ON "public"."registrations" USING "btree" ("function_id");



CREATE INDEX "idx_registrations_organisation_id" ON "public"."registrations" USING "btree" ("organisation_id");



CREATE INDEX "idx_registrations_organisation_name" ON "public"."registrations" USING "btree" ("organisation_name");



CREATE INDEX "idx_registrations_payment_intent" ON "public"."registrations" USING "btree" ("stripe_payment_intent_id", "payment_status") WHERE ("stripe_payment_intent_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_registrations_payment_intent" IS 'Payment lookup by Stripe payment intent';



CREATE INDEX "idx_registrations_payment_status" ON "public"."registrations" USING "btree" ("payment_status");



COMMENT ON INDEX "public"."idx_registrations_payment_status" IS 'Registrations by payment status sorted by date';



CREATE INDEX "idx_registrations_recent" ON "public"."registrations" USING "btree" ("created_at" DESC);



COMMENT ON INDEX "public"."idx_registrations_recent" IS 'Recent registrations for dashboards - queries should add date filter';



CREATE INDEX "idx_registrations_stripe_intent" ON "public"."registrations" USING "btree" ("stripe_payment_intent_id") WHERE ("stripe_payment_intent_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_registrations_stripe_intent" IS 'Fast lookup by Stripe payment intent ID';



CREATE INDEX "idx_registrations_type_status" ON "public"."registrations" USING "btree" ("registration_type", "status");



COMMENT ON INDEX "public"."idx_registrations_type_status" IS 'Registrations by type and status';



CREATE INDEX "idx_tickets_attendee" ON "public"."tickets" USING "btree" ("attendee_id") WHERE ("attendee_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_tickets_attendee" IS 'Tickets assigned to an attendee';



CREATE INDEX "idx_tickets_attendee_id" ON "public"."tickets" USING "btree" ("attendee_id");



CREATE INDEX "idx_tickets_event_id" ON "public"."tickets" USING "btree" ("event_id");



CREATE INDEX "idx_tickets_package_id" ON "public"."tickets" USING "btree" ("package_id");



CREATE INDEX "idx_tickets_qr_code_url" ON "public"."tickets" USING "btree" ("qr_code_url") WHERE ("qr_code_url" IS NOT NULL);



CREATE INDEX "idx_tickets_registration_id" ON "public"."tickets" USING "btree" ("registration_id");



CREATE INDEX "idx_tickets_registration_paid" ON "public"."tickets" USING "btree" ("registration_id") WHERE (("status")::"text" = 'sold'::"text");



COMMENT ON INDEX "public"."idx_tickets_registration_paid" IS 'Sold tickets for registration summary';



CREATE INDEX "idx_tickets_registration_price" ON "public"."tickets" USING "btree" ("registration_id", "price_paid");



CREATE INDEX "idx_tickets_registration_status" ON "public"."tickets" USING "btree" ("registration_id", "status");



COMMENT ON INDEX "public"."idx_tickets_registration_status" IS 'All tickets for a registration with status';



CREATE INDEX "idx_tickets_reservation" ON "public"."tickets" USING "btree" ("reservation_id", "reservation_expires_at") WHERE ("reservation_id" IS NOT NULL);



CREATE INDEX "idx_tickets_reservation_expiry" ON "public"."tickets" USING "btree" ("reservation_expires_at") WHERE (("status")::"text" = 'reserved'::"text");



COMMENT ON INDEX "public"."idx_tickets_reservation_expiry" IS 'Find expired ticket reservations';



CREATE INDEX "idx_tickets_reservation_status" ON "public"."tickets" USING "btree" ("ticket_type_id", "reservation_id", "reservation_expires_at", "status") WHERE ("reservation_id" IS NOT NULL);



CREATE INDEX "idx_tickets_status" ON "public"."tickets" USING "btree" ("status");



CREATE INDEX "idx_tickets_status_event" ON "public"."tickets" USING "btree" ("status", "event_id");



CREATE INDEX "idx_tickets_ticket_type_id" ON "public"."tickets" USING "btree" ("ticket_type_id");



CREATE INDEX "idx_tickets_type_event" ON "public"."tickets" USING "btree" ("ticket_type_id", "event_id");



COMMENT ON INDEX "public"."idx_tickets_type_event" IS 'Tickets by type and event';



CREATE INDEX "idx_webhook_logs_created_at" ON "public"."webhook_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_webhook_logs_webhook_name" ON "public"."webhook_logs" USING "btree" ("webhook_name");



CREATE OR REPLACE TRIGGER "generate-attendee-qr-webhook" AFTER INSERT OR UPDATE ON "public"."attendees" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://pwwpcjbbxotmiqrisjvf.supabase.co/functions/v1/attendee-qr-generator', 'POST', '{"Content-type":"application/json"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "generate-ticket-qr-webhook" AFTER INSERT ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://pwwpcjbbxotmiqrisjvf.supabase.co/functions/v1/ticket-qr-generator', 'POST', '{"Content-type":"application/json"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "inherit_organiser_on_insert" BEFORE INSERT ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."inherit_parent_organiser_id"();



CREATE OR REPLACE TRIGGER "registration_completion_trigger" AFTER UPDATE ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."should_generate_confirmation"();



CREATE OR REPLACE TRIGGER "update_contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_event_counts_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_event_counts"();



CREATE OR REPLACE TRIGGER "update_event_ticket_counts_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_event_ticket_counts"();



CREATE OR REPLACE TRIGGER "update_event_tickets_counts_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_event_ticket_counts"();



CREATE OR REPLACE TRIGGER "update_events_counts_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_event_counts"();



CREATE OR REPLACE TRIGGER "update_functions_updated_at" BEFORE UPDATE ON "public"."functions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_memberships_updated_at" BEFORE UPDATE ON "public"."memberships" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organisation_users_updated_at" BEFORE UPDATE ON "public"."organisation_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



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



CREATE POLICY "Allow anonymous inserts to raw_registrations" ON "public"."raw_registrations" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow anonymous users to insert data" ON "public"."raw_payloads" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow authenticated reads from raw_registrations" ON "public"."raw_registrations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anonymous users can create contacts" ON "public"."contacts" FOR INSERT TO "anon" WITH CHECK ((("auth_user_id" IS NULL) OR ("auth_user_id" = "auth"."uid"())));



CREATE POLICY "Anonymous users can create own registrations" ON "public"."registrations" FOR INSERT TO "anon" WITH CHECK ((("auth"."uid"() IS NULL) OR ("auth"."uid"() = ( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id")))));



COMMENT ON POLICY "Anonymous users can create own registrations" ON "public"."registrations" IS 'Allows anonymous users to create registrations. This is needed for lodge registrations where users may not have accounts.';



CREATE POLICY "Enable read access for all users" ON "public"."event_tickets" FOR SELECT USING (true);



CREATE POLICY "Organisation admins can manage memberships" ON "public"."organisation_users" USING ((EXISTS ( SELECT 1
   FROM "public"."organisation_users" "ou"
  WHERE (("ou"."user_id" = "auth"."uid"()) AND ("ou"."organisation_id" = "organisation_users"."organisation_id") AND ("ou"."role" = 'admin'::"text")))));



CREATE POLICY "Public can view all columns in packages" ON "public"."packages" FOR SELECT USING (true);



CREATE POLICY "Service role can manage webhook logs" ON "public"."webhook_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create tickets for own registrations" ON "public"."tickets" FOR INSERT TO "authenticated", "anon" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."registrations" "r"
     JOIN "public"."contacts" "c" ON (("c"."contact_id" = "r"."customer_id")))
  WHERE (("r"."registration_id" = "tickets"."registration_id") AND (("c"."auth_user_id" = "auth"."uid"()) OR ("c"."auth_user_id" IS NULL))))));



CREATE POLICY "Users can update own registrations" ON "public"."registrations" FOR UPDATE USING ((("auth"."uid"() = ( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id"))) OR (( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id")) IS NULL))) WITH CHECK ((("auth"."uid"() = ( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id"))) OR (( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id")) IS NULL)));



CREATE POLICY "Users can view own contacts" ON "public"."contacts" FOR SELECT USING ((("auth_user_id" = "auth"."uid"()) OR ("auth_user_id" IS NULL)));



CREATE POLICY "Users can view own registrations" ON "public"."registrations" FOR SELECT USING ((("auth"."uid"() = ( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id"))) OR (( SELECT "contacts"."auth_user_id"
   FROM "public"."contacts"
  WHERE ("contacts"."contact_id" = "registrations"."customer_id")) IS NULL)));



CREATE POLICY "Users can view own tickets" ON "public"."tickets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."registrations" "r"
     JOIN "public"."contacts" "c" ON (("c"."contact_id" = "r"."customer_id")))
  WHERE (("r"."registration_id" = "tickets"."registration_id") AND (("c"."auth_user_id" = "auth"."uid"()) OR ("c"."auth_user_id" IS NULL))))));



CREATE POLICY "Users can view their own organisation memberships" ON "public"."organisation_users" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."attendee_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attendee_events_auth_select_own" ON "public"."attendee_events" FOR SELECT TO "authenticated" USING (("attendee_id" IN ( SELECT "attendees"."attendee_id"
   FROM "public"."attendees"
  WHERE ("attendees"."registration_id" IN ( SELECT "registrations"."registration_id"
           FROM "public"."registrations"
          WHERE ("registrations"."customer_id" IN ( SELECT "contacts"."contact_id"
                   FROM "public"."contacts"
                  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))))))));



ALTER TABLE "public"."attendees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attendees_auth_delete_own" ON "public"."attendees" FOR DELETE TO "authenticated" USING (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE (("registrations"."auth_user_id" = "auth"."uid"()) AND ("registrations"."payment_status" = 'pending'::"public"."payment_status")))));



CREATE POLICY "attendees_auth_insert_own" ON "public"."attendees" FOR INSERT TO "authenticated" WITH CHECK (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE (("registrations"."auth_user_id" = "auth"."uid"()) AND ("registrations"."payment_status" = 'pending'::"public"."payment_status")))));



CREATE POLICY "attendees_auth_select_own" ON "public"."attendees" FOR SELECT TO "authenticated" USING (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE ("registrations"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "attendees_auth_update_own" ON "public"."attendees" FOR UPDATE TO "authenticated" USING (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE (("registrations"."auth_user_id" = "auth"."uid"()) AND ("registrations"."payment_status" = 'pending'::"public"."payment_status")))));



ALTER TABLE "public"."connected_account_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contacts_anon_insert" ON "public"."contacts" FOR INSERT TO "anon" WITH CHECK (("auth_user_id" IS NULL));



CREATE POLICY "contacts_auth_insert_own" ON "public"."contacts" FOR INSERT TO "authenticated" WITH CHECK (("auth_user_id" = "auth"."uid"()));



CREATE POLICY "contacts_auth_select_own" ON "public"."contacts" FOR SELECT TO "authenticated" USING (("auth_user_id" = "auth"."uid"()));



CREATE POLICY "contacts_auth_update_own" ON "public"."contacts" FOR UPDATE TO "authenticated" USING (("auth_user_id" = "auth"."uid"()));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_auth_insert_own" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (("customer_id" = "auth"."uid"()));



COMMENT ON POLICY "customers_auth_insert_own" ON "public"."customers" IS 'Fixed to use customer_id instead of id';



CREATE POLICY "customers_auth_select_own" ON "public"."customers" FOR SELECT TO "authenticated" USING (("customer_id" = "auth"."uid"()));



COMMENT ON POLICY "customers_auth_select_own" ON "public"."customers" IS 'Fixed to use customer_id instead of id';



CREATE POLICY "customers_auth_update_own" ON "public"."customers" FOR UPDATE TO "authenticated" USING (("customer_id" = "auth"."uid"()));



COMMENT ON POLICY "customers_auth_update_own" ON "public"."customers" IS 'Fixed to use customer_id instead of id';



ALTER TABLE "public"."event_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "events_anon_select_published" ON "public"."events" FOR SELECT TO "anon" USING (("is_published" = true));



CREATE POLICY "events_auth_select" ON "public"."events" FOR SELECT TO "authenticated" USING ((("is_published" = true) OR ("organiser_id" IN ( SELECT "contacts"."organisation_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "events_public_select" ON "public"."events" FOR SELECT USING (true);



ALTER TABLE "public"."functions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "functions_public_select" ON "public"."functions" FOR SELECT USING (true);



ALTER TABLE "public"."grand_lodges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "grand_lodges_public_select" ON "public"."grand_lodges" FOR SELECT USING (true);



ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "locations_auth_insert" ON "public"."locations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "locations_auth_update" ON "public"."locations" FOR UPDATE TO "authenticated" USING (("location_id" IN ( SELECT "events"."location_id"
   FROM "public"."events"
  WHERE ("events"."organiser_id" IN ( SELECT "contacts"."organisation_id"
           FROM "public"."contacts"
          WHERE ("contacts"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "locations_public_select" ON "public"."locations" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."lodges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lodges_public_select" ON "public"."lodges" FOR SELECT USING (true);



ALTER TABLE "public"."masonic_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "masonic_profiles_auth_insert_own" ON "public"."masonic_profiles" FOR INSERT TO "authenticated" WITH CHECK (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "masonic_profiles_auth_select_own" ON "public"."masonic_profiles" FOR SELECT TO "authenticated" USING (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "masonic_profiles_auth_update_own" ON "public"."masonic_profiles" FOR UPDATE TO "authenticated" USING (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "memberships_auth_delete_own" ON "public"."memberships" FOR DELETE TO "authenticated" USING (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "memberships_auth_insert_own" ON "public"."memberships" FOR INSERT TO "authenticated" WITH CHECK (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "memberships_auth_select_own" ON "public"."memberships" FOR SELECT TO "authenticated" USING (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "memberships_auth_update_own" ON "public"."memberships" FOR UPDATE TO "authenticated" USING (("contact_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."organisation_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organisations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organisations_public_select" ON "public"."organisations" FOR SELECT USING (true);



ALTER TABLE "public"."packages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "packages_public_select" ON "public"."packages" FOR SELECT USING (true);



ALTER TABLE "public"."raw_payloads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."raw_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "registrations_anon_insert" ON "public"."registrations" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "registrations_auth_insert" ON "public"."registrations" FOR INSERT TO "authenticated" WITH CHECK (("customer_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "registrations_auth_insert_own" ON "public"."registrations" FOR INSERT TO "authenticated" WITH CHECK (("auth_user_id" = "auth"."uid"()));



CREATE POLICY "registrations_auth_select_organizer" ON "public"."registrations" FOR SELECT TO "authenticated" USING (("function_id" IN ( SELECT "functions"."function_id"
   FROM "public"."functions"
  WHERE ("functions"."organiser_id" IN ( SELECT "contacts"."organisation_id"
           FROM "public"."contacts"
          WHERE ("contacts"."auth_user_id" = "auth"."uid"()))))));



COMMENT ON POLICY "registrations_auth_select_organizer" ON "public"."registrations" IS 'Fixed to use function_id instead of event_id';



CREATE POLICY "registrations_auth_select_own" ON "public"."registrations" FOR SELECT TO "authenticated" USING (("auth_user_id" = "auth"."uid"()));



CREATE POLICY "registrations_auth_update_own" ON "public"."registrations" FOR UPDATE TO "authenticated" USING ((("customer_id" IN ( SELECT "contacts"."contact_id"
   FROM "public"."contacts"
  WHERE ("contacts"."auth_user_id" = "auth"."uid"()))) AND ("payment_status" = 'pending'::"public"."payment_status")));



CREATE POLICY "registrations_auth_update_pending" ON "public"."registrations" FOR UPDATE TO "authenticated" USING ((("auth_user_id" = "auth"."uid"()) AND ("payment_status" = 'pending'::"public"."payment_status")));



CREATE POLICY "registrations_insert_own" ON "public"."registrations" FOR INSERT TO "authenticated" WITH CHECK ((("auth_user_id" = "auth"."uid"()) OR ("customer_id" = "auth"."uid"())));



CREATE POLICY "registrations_select_own" ON "public"."registrations" FOR SELECT TO "authenticated" USING ((("auth_user_id" = "auth"."uid"()) OR ("customer_id" = "auth"."uid"())));



CREATE POLICY "registrations_update_own" ON "public"."registrations" FOR UPDATE TO "authenticated" USING (((("auth_user_id" = "auth"."uid"()) OR ("customer_id" = "auth"."uid"())) AND ("payment_status" = ANY (ARRAY['pending'::"public"."payment_status", 'unpaid'::"public"."payment_status"]))));



ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tickets_auth_insert_own" ON "public"."tickets" FOR INSERT TO "authenticated" WITH CHECK (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE (("registrations"."auth_user_id" = "auth"."uid"()) AND ("registrations"."payment_status" = 'pending'::"public"."payment_status")))));



CREATE POLICY "tickets_auth_select_organizer" ON "public"."tickets" FOR SELECT TO "authenticated" USING (("event_id" IN ( SELECT "events"."event_id"
   FROM "public"."events"
  WHERE ("events"."organiser_id" IN ( SELECT "contacts"."organisation_id"
           FROM "public"."contacts"
          WHERE ("contacts"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "tickets_auth_select_own" ON "public"."tickets" FOR SELECT TO "authenticated" USING (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE ("registrations"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "tickets_auth_update_own" ON "public"."tickets" FOR UPDATE TO "authenticated" USING (("registration_id" IN ( SELECT "registrations"."registration_id"
   FROM "public"."registrations"
  WHERE (("registrations"."auth_user_id" = "auth"."uid"()) AND ("registrations"."payment_status" = 'pending'::"public"."payment_status")))));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_roles_auth_select_own" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_reservations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_payment"("p_registration_id" "uuid", "p_payment_intent_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_payment"("p_registration_id" "uuid", "p_payment_intent_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_payment"("p_registration_id" "uuid", "p_payment_intent_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_contact_for_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_contact_for_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_contact_for_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_registration_with_attendees"("p_registration_data" "json") TO "anon";
GRANT ALL ON FUNCTION "public"."create_registration_with_attendees"("p_registration_data" "json") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_registration_with_attendees"("p_registration_data" "json") TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_ticket_reservations"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_ticket_reservations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_ticket_reservations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."find_missing_indexes"() TO "anon";
GRANT ALL ON FUNCTION "public"."find_missing_indexes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_missing_indexes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_uuid_type"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_uuid_type"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_uuid_type"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_with_details"("p_event_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_with_details"("p_event_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_with_details"("p_event_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_function_details"("p_function_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_function_details"("p_function_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_function_details"("p_function_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_function_details_formatted"("p_function_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_function_details_formatted"("p_function_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_function_details_formatted"("p_function_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_registration_summary"("p_registration_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_registration_summary"("p_registration_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_registration_summary"("p_registration_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."inherit_parent_organiser_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."inherit_parent_organiser_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."inherit_parent_organiser_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_event_ticket_availability"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_event_ticket_availability"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_event_ticket_availability"() TO "service_role";



GRANT ALL ON FUNCTION "public"."monitor_index_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitor_index_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitor_index_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_event_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_event_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_event_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_event_ticket_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_event_ticket_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_event_ticket_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") TO "service_role";



GRANT ALL ON FUNCTION "public"."should_generate_confirmation"() TO "anon";
GRANT ALL ON FUNCTION "public"."should_generate_confirmation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."should_generate_confirmation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_ticket_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_ticket_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_ticket_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text", "p_stripe_payment_intent_id" "text", "p_registration_id" "uuid", "p_total_amount" numeric, "p_subtotal" numeric, "p_stripe_fee" numeric, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text", "p_stripe_payment_intent_id" "text", "p_registration_id" "uuid", "p_total_amount" numeric, "p_subtotal" numeric, "p_stripe_fee" numeric, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text", "p_stripe_payment_intent_id" "text", "p_registration_id" "uuid", "p_total_amount" numeric, "p_subtotal" numeric, "p_stripe_fee" numeric, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."attendee_events" TO "anon";
GRANT ALL ON TABLE "public"."attendee_events" TO "authenticated";
GRANT ALL ON TABLE "public"."attendee_events" TO "service_role";



GRANT ALL ON TABLE "public"."attendees" TO "anon";
GRANT ALL ON TABLE "public"."attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."attendees" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."auth_user_customer_view" TO "anon";
GRANT ALL ON TABLE "public"."auth_user_customer_view" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_user_customer_view" TO "service_role";



GRANT ALL ON TABLE "public"."connected_account_payments" TO "anon";
GRANT ALL ON TABLE "public"."connected_account_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."connected_account_payments" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."functions" TO "anon";
GRANT ALL ON TABLE "public"."functions" TO "authenticated";
GRANT ALL ON TABLE "public"."functions" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON TABLE "public"."registration_confirmation_base_view" TO "anon";
GRANT ALL ON TABLE "public"."registration_confirmation_base_view" TO "authenticated";
GRANT ALL ON TABLE "public"."registration_confirmation_base_view" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."delegation_registration_confirmation_view" TO "anon";
GRANT ALL ON TABLE "public"."delegation_registration_confirmation_view" TO "authenticated";
GRANT ALL ON TABLE "public"."delegation_registration_confirmation_view" TO "service_role";



GRANT ALL ON TABLE "public"."display_scopes" TO "anon";
GRANT ALL ON TABLE "public"."display_scopes" TO "authenticated";
GRANT ALL ON TABLE "public"."display_scopes" TO "service_role";



GRANT ALL ON TABLE "public"."eligibility_criteria" TO "anon";
GRANT ALL ON TABLE "public"."eligibility_criteria" TO "authenticated";
GRANT ALL ON TABLE "public"."eligibility_criteria" TO "service_role";



GRANT ALL ON TABLE "public"."event_tickets" TO "anon";
GRANT ALL ON TABLE "public"."event_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."event_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."event_tickets_with_id" TO "anon";
GRANT ALL ON TABLE "public"."event_tickets_with_id" TO "authenticated";
GRANT ALL ON TABLE "public"."event_tickets_with_id" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."events_with_id" TO "anon";
GRANT ALL ON TABLE "public"."events_with_id" TO "authenticated";
GRANT ALL ON TABLE "public"."events_with_id" TO "service_role";



GRANT ALL ON TABLE "public"."function_event_tickets_view" TO "anon";
GRANT ALL ON TABLE "public"."function_event_tickets_view" TO "authenticated";
GRANT ALL ON TABLE "public"."function_event_tickets_view" TO "service_role";



GRANT ALL ON TABLE "public"."packages" TO "anon";
GRANT ALL ON TABLE "public"."packages" TO "authenticated";
GRANT ALL ON TABLE "public"."packages" TO "service_role";



GRANT ALL ON TABLE "public"."function_packages_view" TO "anon";
GRANT ALL ON TABLE "public"."function_packages_view" TO "authenticated";
GRANT ALL ON TABLE "public"."function_packages_view" TO "service_role";



GRANT ALL ON TABLE "public"."grand_lodges" TO "anon";
GRANT ALL ON TABLE "public"."grand_lodges" TO "authenticated";
GRANT ALL ON TABLE "public"."grand_lodges" TO "service_role";



GRANT ALL ON TABLE "public"."individuals_registration_confirmation_view" TO "anon";
GRANT ALL ON TABLE "public"."individuals_registration_confirmation_view" TO "authenticated";
GRANT ALL ON TABLE "public"."individuals_registration_confirmation_view" TO "service_role";



GRANT ALL ON TABLE "public"."lodge_registration_confirmation_view" TO "anon";
GRANT ALL ON TABLE "public"."lodge_registration_confirmation_view" TO "authenticated";
GRANT ALL ON TABLE "public"."lodge_registration_confirmation_view" TO "service_role";



GRANT ALL ON TABLE "public"."lodges" TO "anon";
GRANT ALL ON TABLE "public"."lodges" TO "authenticated";
GRANT ALL ON TABLE "public"."lodges" TO "service_role";



GRANT ALL ON TABLE "public"."masonic_profiles" TO "anon";
GRANT ALL ON TABLE "public"."masonic_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."masonic_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."memberships" TO "anon";
GRANT ALL ON TABLE "public"."memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."memberships" TO "service_role";



GRANT ALL ON TABLE "public"."organisations" TO "anon";
GRANT ALL ON TABLE "public"."organisations" TO "authenticated";
GRANT ALL ON TABLE "public"."organisations" TO "service_role";



GRANT ALL ON TABLE "public"."memberships_view" TO "anon";
GRANT ALL ON TABLE "public"."memberships_view" TO "authenticated";
GRANT ALL ON TABLE "public"."memberships_view" TO "service_role";



GRANT ALL ON TABLE "public"."organisation_payouts" TO "anon";
GRANT ALL ON TABLE "public"."organisation_payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."organisation_payouts" TO "service_role";



GRANT ALL ON TABLE "public"."organisation_users" TO "anon";
GRANT ALL ON TABLE "public"."organisation_users" TO "authenticated";
GRANT ALL ON TABLE "public"."organisation_users" TO "service_role";



GRANT ALL ON TABLE "public"."platform_transfers" TO "anon";
GRANT ALL ON TABLE "public"."platform_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_transfers" TO "service_role";



GRANT ALL ON TABLE "public"."raw_payloads" TO "anon";
GRANT ALL ON TABLE "public"."raw_payloads" TO "authenticated";
GRANT ALL ON TABLE "public"."raw_payloads" TO "service_role";



GRANT ALL ON TABLE "public"."raw_registrations" TO "anon";
GRANT ALL ON TABLE "public"."raw_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."raw_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_availability_view" TO "anon";
GRANT ALL ON TABLE "public"."ticket_availability_view" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_availability_view" TO "service_role";



GRANT ALL ON TABLE "public"."tickets_with_id" TO "anon";
GRANT ALL ON TABLE "public"."tickets_with_id" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets_with_id" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
