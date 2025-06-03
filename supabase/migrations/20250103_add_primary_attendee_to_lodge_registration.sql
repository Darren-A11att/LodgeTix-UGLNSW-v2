-- Update the upsert_lodge_registration RPC function to set primary_attendee_id
-- and ensure auth_user_id is properly set in contacts table

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
    v_auth_user_id UUID;
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
    
    -- Get current user ID from auth context
    SELECT auth.uid() INTO v_auth_user_id;
    
    -- If we have a registration_id, check if we need to update the contact
    IF p_registration_id IS NOT NULL THEN
        -- Get existing contact_id from registration
        SELECT contact_id INTO v_contact_id
        FROM registrations
        WHERE registration_id = p_registration_id;
        
        IF v_contact_id IS NOT NULL THEN
            -- Update existing contact
            UPDATE contacts SET
                title = p_booking_contact->>'title',
                first_name = p_booking_contact->>'firstName',
                last_name = p_booking_contact->>'lastName',
                suffix_1 = p_booking_contact->>'suffix',
                mobile_number = p_booking_contact->>'mobile',
                billing_phone = p_booking_contact->>'phone',
                address_line_1 = p_booking_contact->>'addressLine1',
                address_line_2 = p_booking_contact->>'addressLine2',
                suburb_city = p_booking_contact->>'suburb',
                state = p_booking_contact->'stateTerritory'->>'name',
                postcode = p_booking_contact->>'postcode',
                country = COALESCE(p_booking_contact->'country'->>'name', 'Australia'),
                dietary_requirements = p_booking_contact->>'dietaryRequirements',
                special_needs = p_booking_contact->>'additionalInfo',
                business_name = p_lodge_details->>'lodgeName',
                updated_at = NOW()
            WHERE contact_id = v_contact_id;
        END IF;
    END IF;
    
    -- If no contact_id yet, create new contact
    IF v_contact_id IS NULL THEN
        INSERT INTO contacts (
            contact_id,
            title,
            first_name,
            last_name,
            suffix_1,
            email,
            mobile_number,
            billing_phone,
            address_line_1,
            address_line_2,
            suburb_city,
            state,
            postcode,
            country,
            dietary_requirements,
            special_needs,
            type,
            auth_user_id,
            business_name
        ) VALUES (
            gen_random_uuid(),
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
            p_booking_contact->>'additionalInfo',
            'organisation'::contact_type,  -- contact_type enum only has 'individual' and 'organisation'
            v_auth_user_id,  -- Set the auth user ID
            p_lodge_details->>'lodgeName'
        )
        RETURNING contact_id INTO v_contact_id;
    END IF;
    
    -- Create or get customer record
    -- Use 'booking_contact' as the customer_type for lodge registrations
    INSERT INTO customers (
        customer_id,
        contact_id,
        stripe_customer_id,
        business_name,
        email,
        first_name,
        last_name,
        customer_type
    ) VALUES (
        COALESCE(v_auth_user_id, gen_random_uuid()),
        v_contact_id,
        NULL,
        p_lodge_details->>'lodgeName',
        p_booking_contact->>'email',
        p_booking_contact->>'firstName',
        p_booking_contact->>'lastName',
        'booking_contact'::customer_type  -- customer_type enum has 'booking_contact', 'sponsor', 'donor'
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        contact_id = EXCLUDED.contact_id,
        business_name = EXCLUDED.business_name,
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW()
    RETURNING customer_id INTO v_customer_id;
    
    -- Get lodge organisation ID if provided
    v_lodge_org_id := (p_lodge_details->>'organisation_id')::UUID;
    
    -- Handle registration creation/update
    IF p_registration_id IS NOT NULL THEN
        -- Update existing registration
        UPDATE registrations SET
            payment_status = p_payment_status::payment_status,  -- Cast to payment_status enum
            stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
            status = CASE 
                WHEN p_payment_status = 'completed' THEN 'confirmed'
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
            registration_id,
            function_id,
            contact_id,
            primary_attendee_id,  -- Add primary attendee ID
            organisation_id,
            registration_type,
            status,
            payment_status,
            stripe_payment_intent_id,
            registration_date,
            agree_to_terms,
            registration_data,
            confirmation_number,
            total_amount_paid,
            subtotal,
            stripe_fee,
            includes_processing_fee
        ) VALUES (
            gen_random_uuid(),
            p_function_id,
            v_contact_id,
            v_contact_id,  -- Set primary_attendee_id to contact_id for lodge bookings
            v_lodge_org_id,
            'lodge'::registration_type,  -- registration_type enum has 'individuals', 'groups', 'officials', 'lodge', 'delegation'
            'pending',
            p_payment_status::payment_status,  -- Cast to payment_status enum
            p_stripe_payment_intent_id,
            NOW(),
            true,
            jsonb_build_object(
                'lodge_details', p_lodge_details,
                'table_count', p_table_count,
                'booking_contact', p_booking_contact,
                'package_id', p_package_id,
                'metadata', p_metadata
            ),
            'LDG-' || to_char(NOW(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8),
            COALESCE((p_metadata->>'amount')::numeric * 100, 0),
            COALESCE((p_metadata->>'subtotal')::numeric * 100, 0),
            COALESCE((p_metadata->>'stripeFee')::numeric * 100, 0),
            COALESCE((p_metadata->>'stripeFee')::numeric, 0) > 0
        )
        RETURNING registration_id INTO v_registration_id;
    END IF;
    
    -- Process package included items to create tickets
    -- Only create tickets if this is a new registration or payment is confirmed
    IF p_registration_id IS NULL OR p_payment_status = 'completed' THEN
        -- Process included items from package
        -- The included_items is an array of composite type package_item with fields: event_ticket_id, quantity
        FOR v_included_item IN 
            SELECT 
                p.package_id,
                p.event_id as package_event_id,
                p.qty,
                COALESCE((item).event_ticket_id, et_direct.event_ticket_id) as event_ticket_id,
                COALESCE((item).quantity, 1) as item_quantity,
                COALESCE(et.event_id, et_direct.event_id) as ticket_event_id,
                COALESCE(et.price, et_direct.price, p.package_price/p.qty) as price,
                COALESCE(et.name, et_direct.name, 'Standard Ticket') as ticket_type
            FROM packages p
            LEFT JOIN LATERAL unnest(
                CASE 
                    WHEN p.included_items IS NOT NULL AND array_length(p.included_items, 1) > 0
                    THEN p.included_items 
                    ELSE NULL
                END
            ) AS item ON true
            LEFT JOIN event_tickets et ON et.event_ticket_id = (item).event_ticket_id
            LEFT JOIN event_tickets et_direct ON et_direct.event_id = p.event_id 
                AND p.included_items IS NULL
                AND et_direct.is_active = true
            WHERE p.package_id = p_package_id
                AND (et.event_ticket_id IS NOT NULL OR et_direct.event_ticket_id IS NOT NULL)
        LOOP
            -- Calculate number of tickets
            v_ticket_count := p_table_count * COALESCE(v_included_item.qty, 10) * COALESCE(v_included_item.item_quantity, 1);
            
            -- Check existing tickets to avoid duplicates
            SELECT COUNT(*) INTO v_existing_tickets
            FROM tickets
            WHERE registration_id = v_registration_id
            AND event_id = v_included_item.ticket_event_id;
            
            -- Only create tickets if they don't exist
            IF v_existing_tickets = 0 THEN
                -- Create tickets in bulk
                INSERT INTO tickets (
                    registration_id,
                    event_id,
                    attendee_id,
                    ticket_type_id,
                    status,
                    price_paid,
                    original_price,
                    currency,
                    package_id,
                    ticket_status
                )
                SELECT
                    v_registration_id,
                    v_included_item.ticket_event_id,
                    NULL,
                    v_included_item.event_ticket_id,
                    CASE 
                        WHEN p_payment_status = 'completed' THEN 'sold'
                        ELSE 'reserved'
                    END,
                    v_included_item.price,
                    v_included_item.price,
                    'AUD',
                    p_package_id,
                    CASE 
                        WHEN p_payment_status = 'completed' THEN 'sold'
                        ELSE 'reserved'
                    END
                FROM generate_series(1, v_ticket_count);
                
                -- Track created tickets
                v_created_tickets := v_created_tickets || jsonb_build_object(
                    'event_id', v_included_item.ticket_event_id,
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
        'customer_id', v_customer_id,
        'contact_id', r.contact_id,
        'primary_attendee_id', r.primary_attendee_id,  -- Include in result
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.upsert_lodge_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_lodge_registration TO anon;

-- Add comment
COMMENT ON FUNCTION public.upsert_lodge_registration IS 'Handles lodge registration creation and updates. 
Updated to:
- Set primary_attendee_id to the contact_id for lodge bookings
- Ensure auth_user_id is properly set in contacts table
- Use correct database types and enum values';