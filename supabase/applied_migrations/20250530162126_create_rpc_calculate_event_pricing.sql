-- Create RPC function: calculate_event_pricing
-- Purpose: Batch calculate minimum prices for multiple events

CREATE OR REPLACE FUNCTION public.calculate_event_pricing(
    p_event_ids UUID[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Add function comment
COMMENT ON FUNCTION public.calculate_event_pricing(UUID[]) IS 
'Batch calculates pricing information for multiple events including minimum prices, price ranges, package pricing, and availability status. Returns detailed pricing data for each event.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.calculate_event_pricing(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_event_pricing(UUID[]) TO anon;