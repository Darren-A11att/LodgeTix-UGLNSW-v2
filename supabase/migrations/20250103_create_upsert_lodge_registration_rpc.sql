-- Create RPC function for upserting lodge registrations
-- This function handles the complete lodge registration flow including:
-- 1. Creating/updating contact and customer records
-- 2. Creating/updating registration
-- 3. Creating tickets based on package included items
-- 4. Handling payment status updates

CREATE OR REPLACE FUNCTION public.upsert_lodge_registration(
    p_function_id UUID,
    p_package_id UUID,
    p_table_count INTEGER,
    p_booking_contact JSONB,
    p_lodge_details JSONB,
    p_payment_status TEXT DEFAULT 'pending',
    p_stripe_payment_intent_id TEXT DEFAULT NULL,
    p_registration_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_contact_id UUID;
    v_customer_id UUID;
    v_registration_id UUID;
    v_package RECORD;
    v_included_item RECORD;
    v_ticket_count INTEGER;
    v_existing_tickets INTEGER;
    v_result JSONB;
    v_created_tickets JSONB[] := '{}';
    v_lodge_org_id UUID;
BEGIN
    -- Validate inputs
    IF p_function_id IS NULL THEN
        RAISE EXCEPTION 'Function ID is required';
    END IF;
    
    IF p_package_id IS NULL THEN
        RAISE EXCEPTION 'Package ID is required';
    END IF;
    
    IF p_table_count < 1 THEN
        RAISE EXCEPTION 'Table count must be at least 1';
    END IF;
    
    -- Get package details
    SELECT * INTO v_package
    FROM packages
    WHERE package_id = p_package_id
    AND function_id = p_function_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Package not found for the specified function';
    END IF;
    
    -- Extract contact details from booking contact
    -- UPSERT contact record
    INSERT INTO contacts (
        title,
        first_name,
        last_name,
        suffix,
        email,
        mobile_number,
        phone,
        address_line_1,
        address_line_2,
        suburb_city,
        state,
        postcode,
        country,
        dietary_requirements,
        special_needs
    ) VALUES (
        p_booking_contact->>'title',
        p_booking_contact->>'firstName',
        p_booking_contact->>'lastName',
        p_booking_contact->>'suffix',
        p_booking_contact->>'email',
        p_booking_contact->>'mobile',
        p_booking_contact->>'phone',
        p_booking_contact->>'addressLine1',
        p_booking_contact->>'addressLine2',
        p_booking_contact->>'suburb',
        p_booking_contact->'stateTerritory'->>'name',
        p_booking_contact->>'postcode',
        COALESCE(p_booking_contact->'country'->>'name', 'Australia'),
        p_booking_contact->>'dietaryRequirements',
        p_booking_contact->>'additionalInfo'
    )
    ON CONFLICT (email) DO UPDATE SET
        title = EXCLUDED.title,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        suffix = EXCLUDED.suffix,
        mobile_number = EXCLUDED.mobile_number,
        phone = EXCLUDED.phone,
        address_line_1 = EXCLUDED.address_line_1,
        address_line_2 = EXCLUDED.address_line_2,
        suburb_city = EXCLUDED.suburb_city,
        state = EXCLUDED.state,
        postcode = EXCLUDED.postcode,
        country = EXCLUDED.country,
        dietary_requirements = EXCLUDED.dietary_requirements,
        special_needs = EXCLUDED.special_needs,
        updated_at = NOW()
    RETURNING contact_id INTO v_contact_id;
    
    -- UPSERT customer record
    INSERT INTO customers (
        contact_id,
        stripe_customer_id,
        metadata
    ) VALUES (
        v_contact_id,
        NULL, -- Will be set later if needed
        jsonb_build_object(
            'lodge_name', p_lodge_details->>'lodgeName',
            'registration_type', 'lodge'
        )
    )
    ON CONFLICT (contact_id) DO UPDATE SET
        metadata = customers.metadata || EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING customer_id INTO v_customer_id;
    
    -- Get lodge organisation ID if provided
    v_lodge_org_id := (p_lodge_details->>'organisation_id')::UUID;
    
    -- UPSERT registration
    IF p_registration_id IS NOT NULL THEN
        -- Update existing registration
        UPDATE registrations SET
            payment_status = p_payment_status,
            stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
            status = CASE 
                WHEN p_payment_status = 'paid' THEN 'confirmed'
                ELSE status
            END,
            registration_data = COALESCE(
                registration_data || jsonb_build_object(
                    'payment_updated_at', NOW(),
                    'lodge_details', p_lodge_details,
                    'table_count', p_table_count,
                    'booking_contact', p_booking_contact
                ),
                jsonb_build_object(
                    'lodge_details', p_lodge_details,
                    'table_count', p_table_count,
                    'booking_contact', p_booking_contact
                )
            ),
            updated_at = NOW()
        WHERE registration_id = p_registration_id
        RETURNING registration_id INTO v_registration_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Registration not found with ID: %', p_registration_id;
        END IF;
    ELSE
        -- Create new registration
        INSERT INTO registrations (
            function_id,
            customer_id,
            contact_id,
            organisation_id,
            registration_type,
            status,
            payment_status,
            stripe_payment_intent_id,
            registration_date,
            agree_to_terms,
            registration_data,
            metadata
        ) VALUES (
            p_function_id,
            v_customer_id,
            v_contact_id,
            v_lodge_org_id,
            'lodges', -- Lodge registration type
            'pending',
            p_payment_status,
            p_stripe_payment_intent_id,
            NOW(),
            true, -- Assume terms agreed for lodge registrations
            jsonb_build_object(
                'lodge_details', p_lodge_details,
                'table_count', p_table_count,
                'booking_contact', p_booking_contact,
                'package_id', p_package_id
            ),
            p_metadata
        )
        RETURNING registration_id INTO v_registration_id;
    END IF;
    
    -- Process package included items to create tickets
    -- Only create tickets if this is a new registration or payment is confirmed
    IF p_registration_id IS NULL OR p_payment_status = 'paid' THEN
        -- Loop through package included items
        FOR v_included_item IN 
            SELECT 
                pi.*,
                et.event_id,
                et.price,
                et.ticket_type
            FROM package_includes pi
            JOIN event_tickets et ON et.event_ticket_id = pi.event_ticket_id
            WHERE pi.package_id = p_package_id
        LOOP
            -- Calculate number of tickets for this event
            -- For lodge registrations: table_count * 10 * included_quantity
            v_ticket_count := p_table_count * 10 * COALESCE(v_included_item.quantity, 1);
            
            -- Check existing tickets for this event to avoid duplicates
            SELECT COUNT(*) INTO v_existing_tickets
            FROM tickets
            WHERE registration_id = v_registration_id
            AND event_id = v_included_item.event_id;
            
            -- Only create tickets if they don't exist
            IF v_existing_tickets = 0 THEN
                -- Create tickets in bulk
                INSERT INTO tickets (
                    registration_id,
                    event_id,
                    customer_id,
                    attendee_id,
                    ticket_type,
                    status,
                    price,
                    currency,
                    attendee_number,
                    is_primary,
                    metadata
                )
                SELECT
                    v_registration_id,
                    v_included_item.event_id,
                    v_customer_id,
                    NULL, -- No attendee assigned yet for lodge registrations
                    v_included_item.ticket_type,
                    CASE 
                        WHEN p_payment_status = 'paid' THEN 'confirmed'
                        ELSE 'reserved'
                    END,
                    v_included_item.price,
                    'AUD',
                    generate_series(1, v_ticket_count),
                    false,
                    jsonb_build_object(
                        'lodge_registration', true,
                        'lodge_name', p_lodge_details->>'lodgeName',
                        'table_number', CEIL(generate_series::numeric / 10),
                        'seat_number', ((generate_series - 1) % 10) + 1,
                        'package_id', p_package_id,
                        'included_item_id', v_included_item.include_id
                    );
                
                -- Track created tickets for response
                v_created_tickets := v_created_tickets || jsonb_build_object(
                    'event_id', v_included_item.event_id,
                    'ticket_count', v_ticket_count,
                    'ticket_type', v_included_item.ticket_type
                );
            END IF;
        END LOOP;
    END IF;
    
    -- Build result
    SELECT jsonb_build_object(
        'registration_id', r.registration_id,
        'confirmation_number', r.confirmation_number,
        'customer_id', r.customer_id,
        'contact_id', r.contact_id,
        'status', r.status,
        'payment_status', r.payment_status,
        'created_tickets', COALESCE(array_to_json(v_created_tickets), '[]'::json),
        'total_tickets', (
            SELECT COUNT(*)
            FROM tickets t
            WHERE t.registration_id = r.registration_id
        )
    ) INTO v_result
    FROM registrations r
    WHERE r.registration_id = v_registration_id;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in upsert_lodge_registration: % %', SQLERRM, SQLSTATE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_lodge_registration TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.upsert_lodge_registration IS 'Handles lodge registration creation and updates including contact/customer creation and ticket generation based on package included items';