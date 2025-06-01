-- Fix window function error in get_event_with_details RPC function
-- Date: 2025-06-07
-- Description: Fixes "aggregate function calls cannot contain window function calls" error

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_event_with_details TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION get_event_with_details(TEXT) IS 'Retrieves comprehensive event details including function, location, packages, tickets, and related events';