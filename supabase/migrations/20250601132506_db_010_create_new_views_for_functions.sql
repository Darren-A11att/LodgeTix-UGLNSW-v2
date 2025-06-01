-- DB-010: Create New Views for Functions
-- Priority: High
-- Time: 1 hour

-- Function summary view with aggregated data
CREATE OR REPLACE VIEW function_summary_view AS
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
    f.metadata,
    f.is_published,
    f.created_at,
    f.updated_at,
    -- Aggregated counts
    COUNT(DISTINCT e.event_id) as event_count,
    COUNT(DISTINCT r.registration_id) as registration_count,
    COUNT(DISTINCT t.ticket_id) as ticket_count,
    COUNT(DISTINCT a.attendee_id) as attendee_count,
    -- Date ranges
    MIN(e.event_start) as first_event_start,
    MAX(e.event_end) as last_event_end,
    -- Financial summary
    COALESCE(SUM(r.total_amount), 0) as total_revenue,
    COALESCE(SUM(r.stripe_fee), 0) as total_fees,
    COALESCE(SUM(r.total_amount - COALESCE(r.stripe_fee, 0)), 0) as net_revenue,
    -- Package count
    COUNT(DISTINCT p.package_id) as package_count,
    -- Location and organiser details
    l.name as location_name,
    l.city as location_city,
    l.state as location_state,
    o.name as organiser_name
FROM functions f
LEFT JOIN events e ON e.function_id = f.function_id
LEFT JOIN registrations r ON r.function_id = f.function_id AND r.payment_status = 'succeeded'
LEFT JOIN tickets t ON t.registration_id = r.registration_id
LEFT JOIN attendees a ON a.registration_id = r.registration_id
LEFT JOIN packages p ON p.function_id = f.function_id
LEFT JOIN locations l ON l.location_id = f.location_id
LEFT JOIN organisations o ON o.organisation_id = f.organiser_id
GROUP BY 
    f.function_id,
    f.name,
    f.slug,
    f.description,
    f.image_url,
    f.start_date,
    f.end_date,
    f.location_id,
    f.organiser_id,
    f.metadata,
    f.is_published,
    f.created_at,
    f.updated_at,
    l.name,
    l.city,
    l.state,
    o.name;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_function_summary_view_function_id ON functions(function_id);
CREATE INDEX IF NOT EXISTS idx_function_summary_view_slug ON functions(slug);

-- Function events view - all events for a function
CREATE OR REPLACE VIEW function_events_view AS
SELECT 
    f.function_id,
    f.name as function_name,
    f.slug as function_slug,
    e.event_id,
    e.title as event_title,
    e.slug as event_slug,
    e.description as event_description,
    e.event_start,
    e.event_end,
    e.registration_start,
    e.registration_end,
    e.max_attendees,
    e.is_published as event_published,
    e.created_at as event_created,
    -- Ticket counts
    COUNT(DISTINCT et.ticket_type_id) as ticket_type_count,
    SUM(et.max_quantity) as total_capacity,
    SUM(et.available_quantity) as total_available
FROM functions f
JOIN events e ON e.function_id = f.function_id
LEFT JOIN event_tickets et ON et.event_id = e.event_id
GROUP BY 
    f.function_id,
    f.name,
    f.slug,
    e.event_id,
    e.title,
    e.slug,
    e.description,
    e.event_start,
    e.event_end,
    e.registration_start,
    e.registration_end,
    e.max_attendees,
    e.is_published,
    e.created_at;

-- Function packages view - all packages for a function
CREATE OR REPLACE VIEW function_packages_view AS
SELECT 
    f.function_id,
    f.name as function_name,
    f.slug as function_slug,
    p.package_id,
    p.package_name,
    p.package_description,
    p.package_price,
    p.early_bird_price,
    p.early_bird_end_date,
    p.included_events,
    p.is_active,
    p.display_order,
    p.created_at as package_created,
    -- Calculate current price
    CASE 
        WHEN p.early_bird_end_date IS NOT NULL 
             AND p.early_bird_price IS NOT NULL 
             AND CURRENT_TIMESTAMP < p.early_bird_end_date 
        THEN p.early_bird_price
        ELSE p.package_price
    END as current_price,
    -- Count included events
    jsonb_array_length(p.included_events) as included_event_count
FROM functions f
JOIN packages p ON p.function_id = f.function_id
ORDER BY f.function_id, p.display_order, p.package_name;

-- Function registration stats view
CREATE OR REPLACE VIEW function_registration_stats AS
SELECT 
    f.function_id,
    f.name as function_name,
    f.slug as function_slug,
    -- Registration counts by status
    COUNT(DISTINCT r.registration_id) FILTER (WHERE r.payment_status = 'succeeded') as paid_registrations,
    COUNT(DISTINCT r.registration_id) FILTER (WHERE r.payment_status = 'pending') as pending_registrations,
    COUNT(DISTINCT r.registration_id) FILTER (WHERE r.payment_status = 'failed') as failed_registrations,
    COUNT(DISTINCT r.registration_id) FILTER (WHERE r.payment_status = 'refunded') as refunded_registrations,
    -- Attendee stats
    COUNT(DISTINCT a.attendee_id) FILTER (WHERE r.payment_status = 'succeeded') as confirmed_attendees,
    COUNT(DISTINCT a.attendee_id) FILTER (WHERE a.is_primary = true) as primary_attendees,
    COUNT(DISTINCT a.attendee_id) FILTER (WHERE a.is_primary = false) as guest_attendees,
    -- Financial stats
    SUM(r.total_amount) FILTER (WHERE r.payment_status = 'succeeded') as total_revenue,
    AVG(r.total_amount) FILTER (WHERE r.payment_status = 'succeeded') as average_order_value,
    -- Registration timeline
    MIN(r.created_at) as first_registration,
    MAX(r.created_at) as latest_registration,
    -- By registration type
    COUNT(DISTINCT r.registration_id) FILTER (WHERE r.registration_type = 'individual') as individual_registrations,
    COUNT(DISTINCT r.registration_id) FILTER (WHERE r.registration_type = 'lodge') as lodge_registrations,
    COUNT(DISTINCT r.registration_id) FILTER (WHERE r.registration_type = 'delegation') as delegation_registrations
FROM functions f
LEFT JOIN registrations r ON r.function_id = f.function_id
LEFT JOIN attendees a ON a.registration_id = r.registration_id
GROUP BY 
    f.function_id,
    f.name,
    f.slug;

-- Drop old parent-child views that are no longer needed
DROP VIEW IF EXISTS parent_event_summary CASCADE;
DROP VIEW IF EXISTS event_hierarchy_view CASCADE;
DROP VIEW IF EXISTS child_events_view CASCADE;
DROP VIEW IF EXISTS parent_events_with_children CASCADE;

-- Grant permissions on new views
GRANT SELECT ON function_summary_view TO anon, authenticated;
GRANT SELECT ON function_events_view TO anon, authenticated;
GRANT SELECT ON function_packages_view TO anon, authenticated;
GRANT SELECT ON function_registration_stats TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW function_summary_view IS 'Comprehensive summary of functions with event counts, registration stats, and financial data';
COMMENT ON VIEW function_events_view IS 'All events associated with each function including ticket availability';
COMMENT ON VIEW function_packages_view IS 'All packages for each function with current pricing';
COMMENT ON VIEW function_registration_stats IS 'Registration statistics and financial summary for each function';