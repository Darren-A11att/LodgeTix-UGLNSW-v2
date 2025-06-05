-- FUNCTIONS from remote schema

-- Stored procedures and functions

CREATE OR REPLACE FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
    v_result JSON;

ALTER FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."calculate_event_pricing"("p_event_ids" "uuid"[]) IS 'Batch calculates pricing information for multiple events including minimum prices, price ranges, package pricing, and availability status. Returns detailed pricing data for each event.';

CREATE OR REPLACE FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSON;

ALTER FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."check_ticket_availability"("p_event_id" "uuid") IS 'Performs real-time availability check for an event, cleans up expired reservations, and returns detailed availability information including waitlist status and availability messages.';

CREATE OR REPLACE FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_rule JSONB;

ALTER FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."check_ticket_eligibility"("p_attendee_type" "text", "p_rank" "text", "p_grand_rank" "text", "p_grand_officer" boolean, "p_lodge_id" "uuid", "p_grand_lodge_id" "uuid", "p_registration_type" "text", "p_eligibility_rules" "jsonb") IS 'Helper function to check if an attendee meets the eligibility criteria for a specific ticket type.';

CREATE OR REPLACE FUNCTION "public"."cleanup_expired_reservations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_cleaned_count INTEGER := 0;

ALTER FUNCTION "public"."cleanup_expired_reservations"() OWNER TO "postgres";

COMMENT ON FUNCTION "public"."cleanup_expired_reservations"() IS 'Cleans up expired ticket reservations and returns them to available inventory. Should be called periodically via a cron job.';

CREATE OR REPLACE FUNCTION "public"."complete_payment"("p_registration_id" "uuid", "p_payment_intent_id" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_registration RECORD;

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

ALTER FUNCTION "public"."create_contact_for_new_user"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."create_registration_with_attendees"("p_registration_data" "json") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_registration_id UUID;

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

ALTER FUNCTION "public"."find_missing_indexes"() OWNER TO "postgres";

COMMENT ON FUNCTION "public"."find_missing_indexes"() IS 'Identify columns that might benefit from indexes';

CREATE OR REPLACE FUNCTION "public"."generate_uuid_type"() RETURNS "public"."uuid_type"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN gen_random_uuid()::uuid_type;

ALTER FUNCTION "public"."generate_uuid_type"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSON;

ALTER FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."get_eligible_tickets"("p_event_id" "uuid", "p_registration_id" "uuid") IS 'Determines which tickets each attendee in a registration can purchase based on eligibility criteria. Returns a JSON array of attendees with their eligible tickets.';

CREATE OR REPLACE FUNCTION "public"."get_event_with_details"("p_event_slug" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_event_id UUID;

ALTER FUNCTION "public"."get_event_with_details"("p_event_slug" "text") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."get_event_with_details"("p_event_slug" "text") IS 'Retrieves comprehensive event details including function, location, packages, tickets, and related events';

CREATE OR REPLACE FUNCTION "public"."get_function_details"("p_function_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSON;

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

ALTER FUNCTION "public"."get_function_details_formatted"("p_function_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_registration_summary"("p_registration_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSON;

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

ALTER FUNCTION "public"."inherit_parent_organiser_id"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."initialize_event_ticket_availability"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE event_tickets
    SET available_count = total_capacity
    WHERE available_count IS NULL
    AND total_capacity IS NOT NULL;

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

ALTER FUNCTION "public"."recalculate_event_ticket_counts"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_registration_id UUID;

ALTER FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."reserve_tickets"("p_ticket_selections" "json") IS 'Reserves tickets for a registration with automatic expiry. Checks availability, creates ticket records, and updates counts atomically. Returns reservation details including expiry time.';

CREATE OR REPLACE FUNCTION "public"."should_generate_confirmation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only proceed if this is an UPDATE
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;

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

ALTER FUNCTION "public"."update_event_ticket_counts"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();

ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_registration_id uuid;

ALTER FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") IS 'Handles individual registration creation and updates. Confirmation numbers are now generated by Edge Function after payment completion.';

CREATE OR REPLACE FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text" DEFAULT 'pending'::"text", "p_stripe_payment_intent_id" "text" DEFAULT NULL::"text", "p_registration_id" "uuid" DEFAULT NULL::"uuid", "p_total_amount" numeric DEFAULT 0, "p_subtotal" numeric DEFAULT 0, "p_stripe_fee" numeric DEFAULT 0, "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_customer_id UUID;

ALTER FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text", "p_stripe_payment_intent_id" "text", "p_registration_id" "uuid", "p_total_amount" numeric, "p_subtotal" numeric, "p_stripe_fee" numeric, "p_metadata" "jsonb") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."upsert_lodge_registration"("p_function_id" "uuid", "p_package_id" "uuid", "p_table_count" integer, "p_booking_contact" "jsonb", "p_lodge_details" "jsonb", "p_payment_status" "text", "p_stripe_payment_intent_id" "text", "p_registration_id" "uuid", "p_total_amount" numeric, "p_subtotal" numeric, "p_stripe_fee" numeric, "p_metadata" "jsonb") IS 'Handles lodge registration creation and updates. Creates customer record for booking contact and registration record. No attendees or tickets are created for lodge registrations.';

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";
