-- Create RPC function: reserve_tickets
-- Purpose: Atomic ticket reservation with availability check and expiry

CREATE OR REPLACE FUNCTION public.reserve_tickets(
    p_ticket_selections JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_registration_id UUID;
    v_reservation_id UUID;
    v_reservation_expires_at TIMESTAMP;
    v_ticket_selection JSON;
    v_ticket_type RECORD;
    v_created_tickets JSON[];
    v_ticket_id UUID;
    v_result JSON;
    v_total_amount NUMERIC := 0;
    v_tickets_to_reserve INTEGER;
    v_available_count INTEGER;
BEGIN
    -- Extract registration ID
    v_registration_id := (p_ticket_selections->>'registration_id')::UUID;
    
    -- Input validation
    IF v_registration_id IS NULL THEN
        RAISE EXCEPTION 'Registration ID is required';
    END IF;
    
    IF p_ticket_selections->'tickets' IS NULL OR 
       json_array_length(p_ticket_selections->'tickets') = 0 THEN
        RAISE EXCEPTION 'At least one ticket selection is required';
    END IF;

    -- Verify registration exists and is in valid state
    IF NOT EXISTS (
        SELECT 1 FROM registrations 
        WHERE registration_id = v_registration_id 
          AND status IN ('pending', 'draft')
    ) THEN
        RAISE EXCEPTION 'Registration not found or not in valid state';
    END IF;

    -- Generate reservation ID and set expiry (15 minutes from now)
    v_reservation_id := gen_random_uuid();
    v_reservation_expires_at := NOW() + INTERVAL '15 minutes';

    -- Start processing ticket selections
    FOR v_ticket_selection IN 
        SELECT * FROM json_array_elements(p_ticket_selections->'tickets')
    LOOP
        -- Get ticket type details with lock for update
        SELECT * INTO v_ticket_type
        FROM event_tickets
        WHERE id = (v_ticket_selection->>'ticket_type_id')::UUID
          AND is_active = true
          AND status = 'Active'
        FOR UPDATE;

        IF v_ticket_type IS NULL THEN
            RAISE EXCEPTION 'Ticket type not found or not active: %', 
                v_ticket_selection->>'ticket_type_id';
        END IF;

        -- Calculate actual available tickets (excluding active reservations)
        SELECT 
            GREATEST(0, 
                v_ticket_type.available_count - 
                COUNT(*) FILTER (
                    WHERE t.reservation_expires_at > NOW() 
                    AND t.status = 'reserved'
                )
            ) INTO v_available_count
        FROM tickets t
        WHERE t.ticket_type_id = v_ticket_type.id;

        v_tickets_to_reserve := (v_ticket_selection->>'quantity')::INTEGER;

        -- Check availability
        IF v_available_count < v_tickets_to_reserve THEN
            RAISE EXCEPTION 'Not enough tickets available for %: requested %, available %', 
                v_ticket_type.name, v_tickets_to_reserve, v_available_count;
        END IF;

        -- Create ticket records
        FOR i IN 1..v_tickets_to_reserve LOOP
            INSERT INTO tickets (
                event_id,
                registration_id,
                attendee_id,
                ticket_type_id,
                price_paid,
                status,
                reservation_id,
                reservation_expires_at,
                is_partner_ticket
            ) VALUES (
                v_ticket_type.event_id,
                v_registration_id,
                (v_ticket_selection->>'attendee_id')::UUID,
                v_ticket_type.id,
                v_ticket_type.price,
                'reserved',
                v_reservation_id,
                v_reservation_expires_at,
                COALESCE((v_ticket_selection->>'is_partner_ticket')::BOOLEAN, false)
            )
            RETURNING ticket_id INTO v_ticket_id;

            -- Add to created tickets array
            v_created_tickets := array_append(
                v_created_tickets,
                json_build_object(
                    'ticket_id', v_ticket_id,
                    'ticket_type_name', v_ticket_type.name,
                    'price', v_ticket_type.price,
                    'attendee_id', v_ticket_selection->>'attendee_id'
                )::json
            );
        END LOOP;

        -- Update ticket counts
        UPDATE event_tickets
        SET reserved_count = reserved_count + v_tickets_to_reserve,
            available_count = available_count - v_tickets_to_reserve,
            updated_at = NOW()
        WHERE id = v_ticket_type.id;

        -- Add to total amount
        v_total_amount := v_total_amount + (v_ticket_type.price * v_tickets_to_reserve);
    END LOOP;

    -- Update registration with reservation info
    UPDATE registrations
    SET total_price_paid = v_total_amount,
        updated_at = NOW()
    WHERE registration_id = v_registration_id;

    -- Build result
    v_result := json_build_object(
        'reservation_id', v_reservation_id,
        'registration_id', v_registration_id,
        'expires_at', v_reservation_expires_at,
        'total_amount', v_total_amount,
        'tickets', array_to_json(v_created_tickets),
        'ticket_count', array_length(v_created_tickets, 1)
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback is automatic
        RAISE EXCEPTION 'Error in reserve_tickets: % %', SQLERRM, SQLSTATE;
END;
$$;

-- Create function to clean up expired reservations
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cleaned_count INTEGER := 0;
    v_ticket RECORD;
BEGIN
    -- Find and process expired reservations
    FOR v_ticket IN
        SELECT t.ticket_id, t.ticket_type_id, t.registration_id
        FROM tickets t
        WHERE t.status = 'reserved'
          AND t.reservation_expires_at < NOW()
    LOOP
        -- Delete the expired ticket
        DELETE FROM tickets WHERE ticket_id = v_ticket.ticket_id;
        
        -- Update ticket availability
        UPDATE event_tickets
        SET reserved_count = GREATEST(0, reserved_count - 1),
            available_count = available_count + 1,
            updated_at = NOW()
        WHERE id = v_ticket.ticket_type_id;
        
        v_cleaned_count := v_cleaned_count + 1;
    END LOOP;

    -- Clean up registrations with no tickets
    UPDATE registrations
    SET status = 'abandoned'
    WHERE status = 'pending'
      AND NOT EXISTS (
          SELECT 1 FROM tickets t 
          WHERE t.registration_id = registrations.registration_id
      )
      AND created_at < NOW() - INTERVAL '1 hour';

    RETURN v_cleaned_count;
END;
$$;

-- Add function comments
COMMENT ON FUNCTION public.reserve_tickets(JSON) IS 
'Reserves tickets for a registration with automatic expiry. Checks availability, creates ticket records, and updates counts atomically. Returns reservation details including expiry time.';

COMMENT ON FUNCTION public.cleanup_expired_reservations() IS
'Cleans up expired ticket reservations and returns them to available inventory. Should be called periodically via a cron job.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.reserve_tickets(JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_reservations() TO service_role;