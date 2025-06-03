-- Fix the upsert_lodge_registration RPC function to match actual database schema
-- This fixes:
-- 1. Remove reference to 'suffix' column (use suffix_1 instead)
-- 2. Add missing columns to registrations insert
-- 3. Fix fallback code compatibility

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
    
    -- Extract contact details from booking contact
    -- UPSERT contact record (matching actual column names)
    INSERT INTO contacts (
        title,
        first_name,
        last_name,
        suffix_1,  -- Use suffix_1 instead of suffix
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
        type,  -- Add required type field
        auth_user_id,
        business_name
    ) VALUES (
        p_booking_contact->>'title',
        p_booking_contact->>'firstName',
        p_booking_contact->>'lastName',
        p_booking_contact->>'suffix',  -- Map to suffix_1
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
        'organisation'::contact_type,  -- Lodge registrations are organisations
        v_auth_user_id,
        p_lodge_details->>'lodgeName'  -- Store lodge name as business name
    )
    ON CONFLICT (email) DO UPDATE SET
        title = EXCLUDED.title,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        suffix_1 = EXCLUDED.suffix_1,
        mobile_number = EXCLUDED.mobile_number,
        billing_phone = EXCLUDED.billing_phone,
        address_line_1 = EXCLUDED.address_line_1,
        address_line_2 = EXCLUDED.address_line_2,
        suburb_city = EXCLUDED.suburb_city,
        state = EXCLUDED.state,
        postcode = EXCLUDED.postcode,
        country = EXCLUDED.country,
        dietary_requirements = EXCLUDED.dietary_requirements,
        special_needs = EXCLUDED.special_needs,
        business_name = EXCLUDED.business_name,
        updated_at = NOW()
    RETURNING contact_id INTO v_contact_id;
    
    -- UPSERT customer record
    INSERT INTO customers (
        customer_id,
        contact_id,
        stripe_customer_id,
        metadata
    ) VALUES (
        COALESCE(v_auth_user_id, gen_random_uuid()),  -- Use auth user ID as customer ID
        v_contact_id,
        NULL, -- Will be set later if needed
        jsonb_build_object(
            'lodge_name', p_lodge_details->>'lodgeName',
            'registration_type', 'lodge'
        )
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        contact_id = EXCLUDED.contact_id,
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
        -- Create new registration with all required fields
        INSERT INTO registrations (
            registration_id,
            function_id,
            contact_id,  -- Use contact_id not customer_id
            organisation_id,
            registration_type,
            status,
            payment_status,
            stripe_payment_intent_id,
            registration_date,
            agree_to_terms,
            registration_data,
            confirmation_number,
            total_amount_paid,  -- Add amount fields
            subtotal,
            stripe_fee,
            includes_processing_fee
        ) VALUES (
            gen_random_uuid(),
            p_function_id,
            v_contact_id,  -- Use contact_id
            v_lodge_org_id,
            'lodge'::registration_type,
            'pending',
            p_payment_status,
            p_stripe_payment_intent_id,
            NOW(),
            true, -- Assume terms agreed for lodge registrations
            jsonb_build_object(
                'lodge_details', p_lodge_details,
                'table_count', p_table_count,
                'booking_contact', p_booking_contact,
                'package_id', p_package_id,
                'metadata', p_metadata
            ),
            -- Generate confirmation number
            'LDG-' || to_char(NOW(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8),
            COALESCE((p_metadata->>'amount')::numeric * 100, 0),  -- Convert dollars to cents
            COALESCE((p_metadata->>'subtotal')::numeric * 100, 0),
            COALESCE((p_metadata->>'stripeFee')::numeric * 100, 0),
            COALESCE((p_metadata->>'stripeFee')::numeric, 0) > 0
        )
        RETURNING registration_id INTO v_registration_id;
    END IF;
    
    -- Process package included items to create tickets
    -- Only create tickets if this is a new registration or payment is confirmed
    IF p_registration_id IS NULL OR p_payment_status = 'completed' THEN
        -- Process included items from package or use direct event_id
        FOR v_included_item IN 
            SELECT 
                p.package_id,
                p.event_id as package_event_id,
                p.qty,
                COALESCE((item).item_type, 'event_ticket') as item_type,
                COALESCE((item).item_id, et_direct.id) as item_id,
                COALESCE((item).quantity, 1) as item_quantity,
                COALESCE(et.id, et_direct.id) as event_ticket_id,
                COALESCE(et.event_id, et_direct.event_id) as ticket_event_id,
                COALESCE(et.price, et_direct.price, p.package_price/p.qty) as price,
                COALESCE(et.ticket_type, et_direct.ticket_type, 'standard') as ticket_type
            FROM packages p
            LEFT JOIN LATERAL unnest(
                CASE 
                    WHEN p.included_items IS NOT NULL AND array_length(p.included_items, 1) > 0
                    THEN p.included_items 
                    ELSE NULL
                END
            ) AS item ON true
            LEFT JOIN event_tickets et ON et.id = (item).item_id
            LEFT JOIN event_tickets et_direct ON et_direct.event_id = p.event_id AND p.included_items IS NULL
            WHERE p.package_id = p_package_id
                AND (et.id IS NOT NULL OR et_direct.id IS NOT NULL)
        LOOP
            -- Calculate number of tickets for this event
            -- For lodge registrations: table_count * package qty * item quantity
            v_ticket_count := p_table_count * COALESCE(v_included_item.qty, 10) * COALESCE(v_included_item.item_quantity, 1);
            
            -- Check existing tickets for this event to avoid duplicates
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
                    NULL, -- No attendee assigned yet for lodge registrations
                    v_included_item.event_ticket_id,
                    CASE 
                        WHEN p_payment_status = 'completed' THEN 'sold'
                        ELSE 'reserved'
                    END, -- status
                    v_included_item.price, -- price_paid
                    v_included_item.price, -- original_price
                    'AUD',
                    p_package_id,
                    CASE 
                        WHEN p_payment_status = 'completed' THEN 'sold'
                        ELSE 'reserved'
                    END -- ticket_status
                FROM generate_series(1, v_ticket_count);
                
                -- Track created tickets for response
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
        'customer_id', v_customer_id,  -- Return the customer_id we created
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

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION public.upsert_lodge_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_lodge_registration TO anon;

-- Add helpful comment
COMMENT ON FUNCTION public.upsert_lodge_registration IS 'Handles lodge registration creation and updates including contact/customer creation and ticket generation based on package included items. Fixed to match actual database schema.';