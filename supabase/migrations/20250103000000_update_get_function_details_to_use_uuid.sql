-- Update get_function_details to use function ID instead of slug
-- This aligns with the architecture principle that all API routes must use UUIDs

-- Create new version that accepts function ID
CREATE OR REPLACE FUNCTION get_function_details(p_function_id UUID)
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
    WHERE f.function_id = p_function_id
      AND f.is_published = true;
    
    RETURN v_result;
END;
$$;

-- Also create a version that returns the data in a format compatible with the API
CREATE OR REPLACE FUNCTION get_function_details_formatted(p_function_id UUID)
RETURNS TABLE (
    function_id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    image_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    location_id UUID,
    organiser_id UUID,
    events JSON,
    packages JSON,
    location JSON,
    registration_count INTEGER,
    metadata JSONB,
    is_published BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
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