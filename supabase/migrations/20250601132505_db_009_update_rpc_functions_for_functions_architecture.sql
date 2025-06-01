-- DB-009: Update RPC Functions for Functions Architecture
-- Priority: High
-- Time: 2 hours

-- New RPC: Get function with all events
CREATE OR REPLACE FUNCTION get_function_details(p_function_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
    WHERE f.slug = p_function_slug
      AND f.is_published = true;
    
    RETURN v_result;
END;
$$;

-- Create RPC to get all functions with summary info
CREATE OR REPLACE FUNCTION get_functions_list()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'function_id', f.function_id,
                'name', f.name,
                'slug', f.slug,
                'description', f.description,
                'image_url', f.image_url,
                'start_date', f.start_date,
                'end_date', f.end_date,
                'is_published', f.is_published,
                'event_count', (
                    SELECT COUNT(*)
                    FROM events e
                    WHERE e.function_id = f.function_id
                ),
                'location', (
                    SELECT row_to_json(l.*)
                    FROM locations l
                    WHERE l.location_id = f.location_id
                )
            )
            ORDER BY f.start_date DESC
        )
        FROM functions f
        WHERE f.is_published = true
    );
END;
$$;

-- Create RPC to get function registrations
CREATE OR REPLACE FUNCTION get_function_registrations(p_function_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'registration', row_to_json(r.*),
                'customer', (
                    SELECT row_to_json(c.*)
                    FROM customers c
                    WHERE c.customer_id = r.customer_id
                ),
                'attendees', (
                    SELECT json_agg(row_to_json(a.*))
                    FROM attendees a
                    WHERE a.registration_id = r.registration_id
                ),
                'tickets', (
                    SELECT json_agg(row_to_json(t.*))
                    FROM tickets t
                    WHERE t.registration_id = r.registration_id
                )
            )
            ORDER BY r.created_at DESC
        )
        FROM registrations r
        WHERE r.function_id = p_function_id
    );
END;
$$;

-- Drop old RPC functions that use parent_event_id
DROP FUNCTION IF EXISTS get_event_with_children CASCADE;
DROP FUNCTION IF EXISTS get_parent_event_details CASCADE;
DROP FUNCTION IF EXISTS get_child_events CASCADE;
DROP FUNCTION IF EXISTS get_event_hierarchy CASCADE;

-- Update existing RPC functions to use function_id instead of parent references
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
        'organiser', (
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
                    'ticket_type_id', et.ticket_type_id,
                    'ticket_name', et.ticket_name,
                    'ticket_description', et.ticket_description,
                    'base_price', et.base_price,
                    'max_quantity', et.max_quantity,
                    'available_quantity', et.available_quantity,
                    'is_active', et.is_active,
                    'display_order', et.display_order,
                    'eligibility_type', et.eligibility_type
                )
            )
            FROM event_tickets et
            WHERE et.event_id = v_event_id
              AND et.is_active = true
            ORDER BY et.display_order, et.ticket_name
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
        )
    ) INTO v_result
    FROM events e
    WHERE e.event_id = v_event_id;
    
    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_function_details TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_functions_list TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_function_registrations TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_function_details IS 'Get complete details for a function including all events, packages, location, and organiser';
COMMENT ON FUNCTION get_functions_list IS 'Get list of all published functions with summary information';
COMMENT ON FUNCTION get_function_registrations IS 'Get all registrations for a specific function with customer and attendee details';