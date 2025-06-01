-- Fix all column name mismatches identified in the audit
-- Date: 2025-06-07
-- Description: This migration fixes all column name mismatches where code uses 'id' 
--              instead of the actual column names like 'event_ticket_id', 'ticket_id', etc.

-- 1. Fix get_event_with_details RPC function
-- This fixes the "column et.id does not exist" error
DROP FUNCTION IF EXISTS get_event_with_details(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION get_event_with_details(p_event_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
            (SELECT json_agg(
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
                )
                ORDER BY et.created_at
            )
            FROM event_tickets et
            WHERE et.event_id = v_event_id
              AND et.is_active = true
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_event_with_details TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION get_event_with_details(TEXT) IS 'Retrieves comprehensive event details including function, location, packages, tickets, and related events';

-- 2. Create helper views that map 'id' to the actual primary key columns
-- This provides backward compatibility while we update the application code

-- Event tickets view with id alias
CREATE OR REPLACE VIEW event_tickets_with_id AS
SELECT 
    event_ticket_id,
    event_ticket_id AS id,  -- Alias for backward compatibility
    event_id,
    name,
    description,
    price,
    total_capacity,
    available_count,
    reserved_count,
    sold_count,
    status,
    is_active,
    created_at,
    updated_at,
    eligibility_criteria,
    stripe_price_id
FROM event_tickets;

-- Grant permissions
GRANT SELECT ON event_tickets_with_id TO anon, authenticated;

-- Tickets view with id alias
CREATE OR REPLACE VIEW tickets_with_id AS
SELECT 
    ticket_id,
    ticket_id AS id,  -- Alias for backward compatibility
    attendee_id,
    checked_in_at,
    created_at,
    currency,
    event_id,
    is_partner_ticket,
    original_price,
    package_id,
    payment_status,
    price_paid,
    purchased_at,
    qr_code_url,
    registration_id,
    reservation_expires_at,
    reservation_id,
    seat_info,
    status,
    ticket_price,
    ticket_status,
    ticket_type_id,
    updated_at
FROM tickets;

-- Grant permissions
GRANT SELECT ON tickets_with_id TO anon, authenticated;

-- Events view with id alias
CREATE OR REPLACE VIEW events_with_id AS
SELECT 
    event_id,
    event_id AS id,  -- Alias for backward compatibility
    attendance,
    created_at,
    degree_type,
    description,
    display_scope_id,
    documents,
    dress_code,
    event_end,
    event_includes,
    event_start,
    featured,
    function_id,
    image_url,
    important_information,
    is_multi_day,
    is_published,
    is_purchasable_individually,
    location_id,
    max_attendees,
    organiser_id,
    regalia,
    regalia_description,
    registration_availability_id,
    related_events,
    reserved_count,
    sections,
    slug,
    sold_count,
    stripe_product_id,
    subtitle,
    title,
    type
FROM events;

-- Grant permissions
GRANT SELECT ON events_with_id TO anon, authenticated;

-- Note: These views provide a temporary compatibility layer.
-- The application code should be updated to use the correct column names directly.