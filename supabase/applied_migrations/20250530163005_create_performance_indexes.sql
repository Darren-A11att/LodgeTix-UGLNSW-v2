-- Performance Indexes Migration
-- This migration creates indexes to optimize common query patterns
-- Based on TODO-10-PERFORMANCE-INDEXES.md requirements
-- Note: CONCURRENTLY removed as Supabase migrations run in transaction blocks

-- =====================================================
-- 1. EVENT QUERIES INDEXES
-- =====================================================

-- Event lookup by slug (very common pattern for route resolution)
CREATE INDEX IF NOT EXISTS idx_events_slug 
ON events(slug);
COMMENT ON INDEX idx_events_slug IS 'Fast lookup of events by URL slug';

-- Parent/child event queries for hierarchical event structures
CREATE INDEX IF NOT EXISTS idx_events_parent_published 
ON events(parent_event_id, is_published) 
WHERE parent_event_id IS NOT NULL;
COMMENT ON INDEX idx_events_parent_published IS 'Efficient child event queries filtered by publication status';

-- Featured events query for homepage/listing pages
CREATE INDEX IF NOT EXISTS idx_events_featured_published 
ON events(featured, is_published, event_start DESC)
WHERE featured = true;
COMMENT ON INDEX idx_events_featured_published IS 'Fast retrieval of featured published events sorted by start date';

-- Event date range filtering for calendars and searches
CREATE INDEX IF NOT EXISTS idx_events_date_range 
ON events(event_start, event_end)
WHERE is_published = true;
COMMENT ON INDEX idx_events_date_range IS 'Date range queries for published events';

-- Event by organiser for admin views
CREATE INDEX IF NOT EXISTS idx_events_organiser 
ON events(organiser_id, event_start DESC)
WHERE is_published = true;
COMMENT ON INDEX idx_events_organiser IS 'Organisation events listing';

-- =====================================================
-- 2. TICKET QUERIES INDEXES
-- =====================================================

-- Ticket availability by event (used in ticket selection)
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_active 
ON event_tickets(event_id, is_active, status);
COMMENT ON INDEX idx_event_tickets_event_active IS 'Active ticket types for an event';

-- Ticket lookup by registration (for order summaries)
CREATE INDEX IF NOT EXISTS idx_tickets_registration_status 
ON tickets(registration_id, status);
COMMENT ON INDEX idx_tickets_registration_status IS 'All tickets for a registration with status';

-- Ticket type lookup for eligibility checks
CREATE INDEX IF NOT EXISTS idx_tickets_type_event 
ON tickets(ticket_type_id, event_id);
COMMENT ON INDEX idx_tickets_type_event IS 'Tickets by type and event';

-- Reservation expiry checks (for cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_tickets_reservation_expiry 
ON tickets(reservation_expires_at) 
WHERE status = 'reserved';
COMMENT ON INDEX idx_tickets_reservation_expiry IS 'Find expired ticket reservations';

-- Attendee ticket lookup
CREATE INDEX IF NOT EXISTS idx_tickets_attendee 
ON tickets(attendee_id)
WHERE attendee_id IS NOT NULL;
COMMENT ON INDEX idx_tickets_attendee IS 'Tickets assigned to an attendee';

-- =====================================================
-- 3. REGISTRATION QUERIES INDEXES
-- =====================================================

-- Registration lookups by contact and event
CREATE INDEX IF NOT EXISTS idx_registrations_contact_event 
ON registrations(contact_id, event_id);
COMMENT ON INDEX idx_registrations_contact_event IS 'User registrations for an event';

-- Payment status filtering for admin and reporting
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status 
ON registrations(payment_status, created_at DESC);
COMMENT ON INDEX idx_registrations_payment_status IS 'Registrations by payment status sorted by date';

-- Registration type filtering
CREATE INDEX IF NOT EXISTS idx_registrations_type_status 
ON registrations(registration_type, status);
COMMENT ON INDEX idx_registrations_type_status IS 'Registrations by type and status';

-- Stripe payment intent lookup for webhooks
CREATE INDEX IF NOT EXISTS idx_registrations_stripe_intent 
ON registrations(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;
COMMENT ON INDEX idx_registrations_stripe_intent IS 'Fast lookup by Stripe payment intent ID';

-- =====================================================
-- 4. ATTENDEE QUERIES INDEXES
-- =====================================================

-- Attendee by registration (very common join)
CREATE INDEX IF NOT EXISTS idx_attendees_registration 
ON attendees(registration_id);
COMMENT ON INDEX idx_attendees_registration IS 'All attendees for a registration';

-- Primary attendee lookup (for contact info)
CREATE INDEX IF NOT EXISTS idx_attendees_registration_primary 
ON attendees(registration_id, is_primary)
WHERE is_primary = true;
COMMENT ON INDEX idx_attendees_registration_primary IS 'Quick primary attendee lookup';

-- Partner relationships
CREATE INDEX IF NOT EXISTS idx_attendees_related 
ON attendees(related_attendee_id)
WHERE related_attendee_id IS NOT NULL;
COMMENT ON INDEX idx_attendees_related IS 'Find related attendees (partners)';

-- Contact lookup for attendees (to join with masonic profiles)
CREATE INDEX IF NOT EXISTS idx_attendees_contact 
ON attendees(contact_id)
WHERE contact_id IS NOT NULL;
COMMENT ON INDEX idx_attendees_contact IS 'Contact lookup for attendees to join with masonic profiles';

-- =====================================================
-- 5. REFERENCE DATA QUERIES INDEXES
-- =====================================================

-- Masonic profile lookup by contact
CREATE INDEX IF NOT EXISTS idx_masonic_profiles_contact 
ON masonic_profiles(contact_id);
COMMENT ON INDEX idx_masonic_profiles_contact IS 'Masonic profile lookup by contact';

-- Lodge lookup by grand lodge
CREATE INDEX IF NOT EXISTS idx_lodges_grand_lodge 
ON lodges(grand_lodge_id);
COMMENT ON INDEX idx_lodges_grand_lodge IS 'Lodges under a grand lodge';

-- Contact lookup by auth user
CREATE INDEX IF NOT EXISTS idx_contacts_auth_user 
ON contacts(auth_user_id)
WHERE auth_user_id IS NOT NULL;
COMMENT ON INDEX idx_contacts_auth_user IS 'Contact record for authenticated user';

-- Membership queries
CREATE INDEX IF NOT EXISTS idx_memberships_contact_active 
ON memberships(contact_id, is_active)
WHERE is_active = true;
COMMENT ON INDEX idx_memberships_contact_active IS 'Active memberships for a contact';

-- =====================================================
-- 6. PAYMENT QUERIES INDEXES
-- =====================================================

-- Payment intent lookup on registrations table for payment queries
CREATE INDEX IF NOT EXISTS idx_registrations_payment_intent 
ON registrations(stripe_payment_intent_id, payment_status)
WHERE stripe_payment_intent_id IS NOT NULL;
COMMENT ON INDEX idx_registrations_payment_intent IS 'Payment lookup by Stripe payment intent';

-- Connected account payments lookup
CREATE INDEX IF NOT EXISTS idx_connected_payments_registration 
ON connected_account_payments(registration_id, created_at DESC)
WHERE registration_id IS NOT NULL;
COMMENT ON INDEX idx_connected_payments_registration IS 'Connected account payment history';

-- =====================================================
-- 7. COMPOSITE INDEXES FOR VIEWS
-- =====================================================

-- Support event display view joins
CREATE INDEX IF NOT EXISTS idx_events_location_org 
ON events(event_id, location_id, organiser_id);
COMMENT ON INDEX idx_events_location_org IS 'Composite index for event display view';

-- Support registration summary joins
CREATE INDEX IF NOT EXISTS idx_tickets_registration_paid 
ON tickets(registration_id) 
WHERE status = 'sold';
COMMENT ON INDEX idx_tickets_registration_paid IS 'Sold tickets for registration summary';

-- =====================================================
-- 8. ADDITIONAL OPTIMIZATIONS
-- =====================================================

-- Case-insensitive email lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email_lower 
ON contacts(LOWER(email));
COMMENT ON INDEX idx_contacts_email_lower IS 'Case-insensitive email search';

-- Active event tickets for availability checks
CREATE INDEX IF NOT EXISTS idx_event_tickets_active_available 
ON event_tickets(event_id, available_count)
WHERE is_active = true AND status = 'Active' AND available_count > 0;
COMMENT ON INDEX idx_event_tickets_active_available IS 'Available tickets for sale';

-- Recent registrations for dashboard (without date filter due to immutability requirement)
CREATE INDEX IF NOT EXISTS idx_registrations_recent 
ON registrations(created_at DESC);
COMMENT ON INDEX idx_registrations_recent IS 'Recent registrations for dashboards - queries should add date filter';

-- =====================================================
-- INDEX MONITORING QUERIES
-- =====================================================

-- Create a function to monitor index usage
CREATE OR REPLACE FUNCTION monitor_index_usage()
RETURNS TABLE (
    schemaname text,
    tablename text,
    indexname text,
    idx_scan bigint,
    idx_tup_read bigint,
    idx_tup_fetch bigint,
    table_size text,
    index_size text,
    usage_ratio numeric
) AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION monitor_index_usage() IS 'Monitor index usage statistics for performance tuning';

-- Create a function to find missing indexes
CREATE OR REPLACE FUNCTION find_missing_indexes()
RETURNS TABLE (
    tablename text,
    attname text,
    n_distinct numeric,
    correlation numeric,
    null_frac numeric,
    avg_width integer,
    recommendation text
) AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_missing_indexes() IS 'Identify columns that might benefit from indexes';

-- =====================================================
-- STATISTICS AND MAINTENANCE
-- =====================================================

-- Update statistics for better query planning
ANALYZE events;
ANALYZE event_tickets;
ANALYZE tickets;
ANALYZE registrations;
ANALYZE attendees;
ANALYZE contacts;
ANALYZE lodges;
ANALYZE memberships;
ANALYZE masonic_profiles;
ANALYZE connected_account_payments;

-- =====================================================
-- PERFORMANCE NOTES
-- =====================================================

-- Notes on index strategy:
-- 1. CONCURRENTLY not used due to transaction block limitations in migrations
-- 2. Partial indexes used where queries filter on specific conditions
-- 3. Composite indexes ordered by selectivity (most selective first)
-- 4. Expression indexes for case-insensitive searches
-- 5. Covering indexes avoided to minimize storage overhead
-- 6. Foreign key columns indexed for join performance
-- 7. Timestamp columns indexed with DESC for recent data queries

-- Monitor index performance with:
-- SELECT * FROM monitor_index_usage();
-- SELECT * FROM find_missing_indexes();

-- Check for index bloat with:
-- SELECT schemaname, tablename, indexname, 
--        pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexname::regclass) DESC;