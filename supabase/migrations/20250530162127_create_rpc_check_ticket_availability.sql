-- Create RPC function: check_ticket_availability
-- Purpose: Real-time availability check with reservation cleanup

CREATE OR REPLACE FUNCTION public.check_ticket_availability(
    p_event_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Add function comment
COMMENT ON FUNCTION public.check_ticket_availability(UUID) IS 
'Performs real-time availability check for an event, cleans up expired reservations, and returns detailed availability information including waitlist status and availability messages.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_ticket_availability(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ticket_availability(UUID) TO anon;