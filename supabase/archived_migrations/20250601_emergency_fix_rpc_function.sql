-- Emergency fix for get_event_with_details to get it working
-- This version removes the problematic package query temporarily

DROP FUNCTION IF EXISTS public.get_event_with_details(TEXT);

CREATE OR REPLACE FUNCTION public.get_event_with_details(p_event_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_event_id UUID;
BEGIN
    -- Input validation
    IF p_event_slug IS NULL OR p_event_slug = '' THEN
        RAISE EXCEPTION 'Event slug is required';
    END IF;

    -- Get the event ID from slug
    SELECT event_id INTO v_event_id
    FROM events
    WHERE slug = p_event_slug
    LIMIT 1;

    IF v_event_id IS NULL THEN
        RAISE EXCEPTION 'Event not found with slug: %', p_event_slug;
    END IF;

    -- Build the complete event response (simplified version)
    SELECT json_build_object(
        'event', row_to_json(e.*),
        'child_events', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'event_id', ce.event_id,
                    'slug', ce.slug,
                    'title', ce.title,
                    'subtitle', ce.subtitle,
                    'description', ce.description,
                    'image_url', ce.image_url,
                    'event_start', ce.event_start,
                    'event_end', ce.event_end,
                    'min_price', ce.min_price,
                    'is_sold_out', ce.is_sold_out,
                    'location_string', ce.location_string,
                    'featured', ce.featured,
                    'is_multi_day', ce.is_multi_day
                )
                ORDER BY ce.event_start
            )
            FROM event_display_view ce
            WHERE ce.parent_event_id = v_event_id
              AND ce.is_published = true
            ), '[]'::json
        ),
        'packages', '[]'::json,  -- Empty array for now to avoid package table issues
        'ticket_types', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'ticket_type_id', t.ticket_type_id,
                    'ticket_type_name', t.ticket_type_name,
                    'description', t.description,
                    'price', t.price,
                    'total_capacity', t.total_capacity,
                    'available_count', t.available_count,
                    'actual_available', t.actual_available,
                    'is_sold_out', t.is_sold_out,
                    'percentage_sold', t.percentage_sold,
                    'status', t.status,
                    'eligibility_criteria', t.eligibility_criteria,
                    'has_eligibility_requirements', t.has_eligibility_requirements,
                    'ticket_category', t.ticket_category
                )
                ORDER BY t.price, t.ticket_type_name
            )
            FROM ticket_availability_view t
            WHERE t.event_id = v_event_id
              AND t.is_active = true
            ), '[]'::json
        ),
        'location', CASE 
            WHEN e.location_id IS NOT NULL THEN
                json_build_object(
                    'location_id', e.location_id,
                    'place_name', e.place_name,
                    'street_address', e.street_address,
                    'suburb', e.suburb,
                    'state', e.state,
                    'postal_code', e.postal_code,
                    'latitude', e.latitude,
                    'longitude', e.longitude,
                    'location_string', e.location_string,
                    'location_capacity', e.location_capacity
                )
            ELSE NULL
        END,
        'organisation', json_build_object(
            'organisation_id', e.organiser_id,
            'name', e.organiser_name,
            'abbreviation', e.organiser_abbreviation,
            'type', e.organiser_type
        ),
        'parent_event', CASE
            WHEN e.parent_event_id IS NOT NULL THEN
                json_build_object(
                    'event_id', e.parent_event_id,
                    'title', e.parent_event_title,
                    'slug', e.parent_event_slug
                )
            ELSE NULL
        END,
        'summary', json_build_object(
            'min_price', e.min_price,
            'max_price', COALESCE(
                (SELECT MAX(et.price) 
                 FROM event_tickets et 
                 WHERE et.event_id = e.event_id 
                   AND et.is_active = true 
                   AND et.status = 'Active'),
                e.min_price
            ),
            'total_capacity', e.total_capacity,
            'tickets_sold', e.tickets_sold,
            'tickets_available', e.tickets_available,
            'is_sold_out', e.is_sold_out,
            'child_event_count', e.child_event_count
        )
    ) INTO v_result
    FROM event_display_view e
    WHERE e.event_id = v_event_id;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error details for debugging
        RAISE EXCEPTION 'Error in get_event_with_details: % %', SQLERRM, SQLSTATE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_event_with_details(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_with_details(TEXT) TO anon;

-- Update function comment
COMMENT ON FUNCTION public.get_event_with_details(TEXT) IS 
'Emergency fix: Fetches event data without package information to avoid column errors. Returns event, child events, tickets, and location data.';