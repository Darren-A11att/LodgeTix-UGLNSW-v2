-- Create RPC function: complete_payment
-- Purpose: Finalize payment and update ticket/registration status

CREATE OR REPLACE FUNCTION public.complete_payment(
    p_registration_id UUID,
    p_payment_intent_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_registration RECORD;
    v_confirmation_number TEXT;
    v_result JSON;
    v_ticket_count INTEGER;
    v_total_amount NUMERIC;
    v_event_prefix TEXT;
BEGIN
    -- Input validation
    IF p_registration_id IS NULL THEN
        RAISE EXCEPTION 'Registration ID is required';
    END IF;
    
    IF p_payment_intent_id IS NULL OR p_payment_intent_id = '' THEN
        RAISE EXCEPTION 'Payment intent ID is required';
    END IF;

    -- Get registration details with lock
    SELECT r.*, e.slug, e.title, e.event_start
    INTO v_registration
    FROM registrations r
    JOIN events e ON r.event_id = e.event_id
    WHERE r.registration_id = p_registration_id
    FOR UPDATE;

    IF v_registration IS NULL THEN
        RAISE EXCEPTION 'Registration not found: %', p_registration_id;
    END IF;

    -- Verify registration is in correct state
    IF v_registration.status NOT IN ('pending', 'draft') THEN
        RAISE EXCEPTION 'Registration is not in pending state: %', v_registration.status;
    END IF;

    -- Verify payment hasn't already been processed
    IF v_registration.payment_status = 'paid' THEN
        RAISE EXCEPTION 'Payment has already been processed for this registration';
    END IF;

    -- Generate confirmation number if not exists
    IF v_registration.confirmation_number IS NULL THEN
        -- Use event slug prefix or first 3 letters of event title
        v_event_prefix := UPPER(COALESCE(
            SUBSTRING(v_registration.slug FROM 1 FOR 3),
            SUBSTRING(v_registration.title FROM 1 FOR 3),
            'EVT'
        ));
        
        -- Generate confirmation number: PREFIX-YYYYMMDD-XXXX
        v_confirmation_number := v_event_prefix || '-' || 
            TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
            LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    ELSE
        v_confirmation_number := v_registration.confirmation_number;
    END IF;

    -- Update all reserved tickets to sold
    UPDATE tickets
    SET status = 'sold',
        payment_intent_id = p_payment_intent_id,
        reservation_id = NULL,
        reservation_expires_at = NULL,
        updated_at = NOW()
    WHERE registration_id = p_registration_id
      AND status = 'reserved'
    RETURNING COUNT(*) INTO v_ticket_count;

    IF v_ticket_count = 0 THEN
        RAISE EXCEPTION 'No reserved tickets found for registration';
    END IF;

    -- Calculate total amount from tickets
    SELECT SUM(price_paid) INTO v_total_amount
    FROM tickets
    WHERE registration_id = p_registration_id;

    -- Update ticket type counts
    UPDATE event_tickets et
    SET sold_count = sold_count + ticket_counts.count,
        reserved_count = GREATEST(0, reserved_count - ticket_counts.count),
        updated_at = NOW()
    FROM (
        SELECT ticket_type_id, COUNT(*) as count
        FROM tickets
        WHERE registration_id = p_registration_id
          AND status = 'sold'
        GROUP BY ticket_type_id
    ) ticket_counts
    WHERE et.id = ticket_counts.ticket_type_id;

    -- Update registration status
    UPDATE registrations
    SET status = 'completed',
        payment_status = 'paid',
        confirmation_number = v_confirmation_number,
        stripe_payment_intent_id = p_payment_intent_id,
        total_amount_paid = v_total_amount,
        total_price_paid = v_total_amount,
        updated_at = NOW()
    WHERE registration_id = p_registration_id;

    -- Create payment record
    INSERT INTO registration_payments (
        registration_id,
        amount,
        currency,
        payment_method,
        payment_status,
        stripe_payment_intent_id,
        metadata
    ) VALUES (
        p_registration_id,
        v_total_amount,
        'AUD',
        'card',
        'succeeded',
        p_payment_intent_id,
        jsonb_build_object(
            'completed_at', NOW(),
            'ticket_count', v_ticket_count
        )
    );

    -- Build confirmation result
    SELECT json_build_object(
        'registration_id', r.registration_id,
        'confirmation_number', r.confirmation_number,
        'status', r.status,
        'payment_status', r.payment_status,
        'total_amount_paid', r.total_amount_paid,
        'event', json_build_object(
            'event_id', e.event_id,
            'title', e.title,
            'slug', e.slug,
            'event_start', e.event_start,
            'location_string', l.place_name || ', ' || l.suburb || ', ' || l.state
        ),
        'primary_attendee', json_build_object(
            'attendee_id', pa.attendee_id,
            'full_name', pa.full_name,
            'email', pa.email
        ),
        'tickets', (
            SELECT json_agg(
                json_build_object(
                    'ticket_id', t.ticket_id,
                    'ticket_type_name', et.name,
                    'attendee_name', a.full_name,
                    'price_paid', t.price_paid,
                    'is_partner_ticket', t.is_partner_ticket
                )
                ORDER BY a.is_primary DESC, a.full_name
            )
            FROM tickets t
            JOIN event_tickets et ON t.ticket_type_id = et.id
            JOIN attendee_complete_view a ON t.attendee_id = a.attendee_id
            WHERE t.registration_id = r.registration_id
        ),
        'ticket_count', (
            SELECT COUNT(*) FROM tickets 
            WHERE registration_id = r.registration_id
        ),
        'attendee_count', (
            SELECT COUNT(*) FROM attendees 
            WHERE registration_id = r.registration_id
        )
    ) INTO v_result
    FROM registrations r
    JOIN events e ON r.event_id = e.event_id
    LEFT JOIN locations l ON e.location_id = l.location_id
    LEFT JOIN attendee_complete_view pa ON r.primary_attendee_id = pa.attendee_id
    WHERE r.registration_id = p_registration_id;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error for debugging
        RAISE EXCEPTION 'Error in complete_payment: % %', SQLERRM, SQLSTATE;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION public.complete_payment(UUID, TEXT) IS 
'Completes the payment process for a registration. Updates tickets from reserved to sold, generates confirmation number, updates counts, and returns confirmation details.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.complete_payment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_payment(UUID, TEXT) TO service_role;