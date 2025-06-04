-- Update upsert_lodge_registration to use customer_id instead of contact_id
-- This migration must run AFTER 20250607_001_update_registrations_customer_id.sql

-- Drop and recreate the function with updated schema
DROP FUNCTION IF EXISTS public.upsert_lodge_registration(UUID, UUID, INTEGER, JSONB, JSONB, TEXT, TEXT, UUID, JSONB);

CREATE OR REPLACE FUNCTION public.upsert_lodge_registration(
    p_function_id UUID,
    p_package_id UUID,
    p_table_count INTEGER,
    p_booking_contact JSONB,
    p_lodge_details JSONB,
    p_payment_status TEXT DEFAULT 'pending',
    p_stripe_payment_intent_id TEXT DEFAULT NULL,
    p_registration_id UUID DEFAULT NULL,
    p_total_amount NUMERIC DEFAULT 0,
    p_subtotal NUMERIC DEFAULT 0,
    p_stripe_fee NUMERIC DEFAULT 0,
    p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
    v_primary_attendee_name TEXT;
BEGIN
    -- Get authenticated user ID
    v_auth_user_id := auth.uid();
    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
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
    
    -- Create or update customer record (lodge representative as booking contact)
    v_customer_id := v_auth_user_id; -- Use auth user ID as customer ID
    
    -- Set primary attendee name from booking contact
    v_primary_attendee_name := CONCAT(
        COALESCE(p_booking_contact->>'firstName', ''),
        ' ',
        COALESCE(p_booking_contact->>'lastName', '')
    );
    
    INSERT INTO customers (
        customer_id,
        email,
        first_name,
        last_name,
        phone,
        business_name,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        billing_organisation_name,
        billing_email,
        billing_phone,
        billing_street_address,
        billing_city,
        billing_state,
        billing_postal_code,
        billing_country,
        customer_type,
        created_at
    ) VALUES (
        v_customer_id,
        p_booking_contact->>'email',
        p_booking_contact->>'firstName',
        p_booking_contact->>'lastName',
        p_booking_contact->>'mobile',
        p_lodge_details->>'lodgeName', -- Lodge name as business name
        p_booking_contact->>'addressLine1',
        p_booking_contact->>'addressLine2',
        p_booking_contact->>'suburb',
        p_booking_contact->'stateTerritory'->>'name',
        p_booking_contact->>'postcode',
        COALESCE(p_booking_contact->'country'->>'name', 'Australia'),
        p_lodge_details->>'lodgeName', -- Billing org name
        p_booking_contact->>'email', -- Billing email
        p_booking_contact->>'mobile', -- Billing phone
        p_booking_contact->>'addressLine1', -- Billing address
        p_booking_contact->>'suburb', -- Billing city
        p_booking_contact->'stateTerritory'->>'name', -- Billing state
        p_booking_contact->>'postcode', -- Billing postal code
        COALESCE(p_booking_contact->'country'->>'name', 'Australia'), -- Billing country
        'booking_contact'::customer_type,
        NOW()
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, customers.email),
        first_name = COALESCE(EXCLUDED.first_name, customers.first_name),
        last_name = COALESCE(EXCLUDED.last_name, customers.last_name),
        phone = COALESCE(EXCLUDED.phone, customers.phone),
        business_name = COALESCE(EXCLUDED.business_name, customers.business_name),
        address_line1 = COALESCE(EXCLUDED.address_line1, customers.address_line1),
        address_line2 = COALESCE(EXCLUDED.address_line2, customers.address_line2),
        city = COALESCE(EXCLUDED.city, customers.city),
        state = COALESCE(EXCLUDED.state, customers.state),
        postal_code = COALESCE(EXCLUDED.postal_code, customers.postal_code),
        country = COALESCE(EXCLUDED.country, customers.country),
        billing_organisation_name = COALESCE(EXCLUDED.billing_organisation_name, customers.billing_organisation_name),
        billing_email = COALESCE(EXCLUDED.billing_email, customers.billing_email),
        billing_phone = COALESCE(EXCLUDED.billing_phone, customers.billing_phone),
        billing_street_address = COALESCE(EXCLUDED.billing_street_address, customers.billing_street_address),
        billing_city = COALESCE(EXCLUDED.billing_city, customers.billing_city),
        billing_state = COALESCE(EXCLUDED.billing_state, customers.billing_state),
        billing_postal_code = COALESCE(EXCLUDED.billing_postal_code, customers.billing_postal_code),
        billing_country = COALESCE(EXCLUDED.billing_country, customers.billing_country),
        updated_at = NOW();
    
    -- Get lodge organisation ID if provided
    v_lodge_org_id := (p_lodge_details->>'organisation_id')::UUID;
    
    -- UPSERT registration
    IF p_registration_id IS NOT NULL THEN
        -- Update existing registration for payment completion
        UPDATE registrations SET
            payment_status = p_payment_status,
            stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
            status = CASE 
                WHEN p_payment_status = 'completed' OR p_payment_status = 'paid' THEN 'confirmed'
                WHEN p_payment_status = 'failed' THEN 'cancelled'
                ELSE status
            END,
            total_amount_paid = CASE
                WHEN p_payment_status = 'completed' OR p_payment_status = 'paid' THEN p_total_amount
                ELSE total_amount_paid
            END,
            payment_completed_at = CASE
                WHEN p_payment_status = 'completed' OR p_payment_status = 'paid' THEN NOW()
                ELSE payment_completed_at
            END,
            updated_at = NOW()
        WHERE registration_id = p_registration_id
        RETURNING registration_id INTO v_registration_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Registration not found with ID: %', p_registration_id;
        END IF;
    ELSE
        -- Create new lodge registration
        INSERT INTO registrations (
            function_id,
            customer_id, -- Use customer_id instead of contact_id
            auth_user_id,
            organisation_id,
            organisation_name,
            organisation_number,
            primary_attendee,
            attendee_count,
            registration_type,
            status,
            payment_status,
            stripe_payment_intent_id,
            registration_date,
            agree_to_terms,
            total_amount_paid,
            total_price_paid,
            subtotal,
            stripe_fee,
            includes_processing_fee,
            registration_data,
            metadata
        ) VALUES (
            p_function_id,
            v_customer_id,
            v_auth_user_id,
            v_lodge_org_id,
            p_lodge_details->>'lodgeName',
            p_lodge_details->>'lodgeNumber',
            v_primary_attendee_name,
            p_table_count * COALESCE(v_package.qty, 10),
            'lodge'::registration_type,
            'pending',
            p_payment_status,
            p_stripe_payment_intent_id,
            NOW(),
            true,
            0, -- Will be updated on payment
            p_total_amount,
            p_subtotal,
            p_stripe_fee,
            p_stripe_fee > 0,
            jsonb_build_array(jsonb_build_object(
                'lodge_details', p_lodge_details,
                'lodge_name', p_lodge_details->>'lodgeName',
                'lodge_number', p_lodge_details->>'lodgeNumber',
                'table_count', p_table_count,
                'total_attendees', p_table_count * COALESCE(v_package.qty, 10),
                'booking_contact', p_booking_contact,
                'primary_attendee_name', v_primary_attendee_name,
                'package_id', p_package_id,
                'package_name', v_package.name,
                'package_price', v_package.price
            )),
            p_metadata
        )
        RETURNING registration_id INTO v_registration_id;
    END IF;
    
    -- Build result with confirmation number from registration
    SELECT jsonb_build_object(
        'success', true,
        'registrationId', registration_id,
        'confirmationNumber', COALESCE(confirmation_number, 'REG-' || SUBSTRING(registration_id::text FROM 1 FOR 8)),
        'customerId', v_customer_id,
        'bookingContactId', v_customer_id,
        'organisationName', p_lodge_details->>'lodgeName',
        'tableCount', p_table_count,
        'totalAttendees', p_table_count * COALESCE(v_package.qty, 10)
    ) INTO v_result
    FROM registrations
    WHERE registration_id = v_registration_id;
    
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
COMMENT ON FUNCTION public.upsert_lodge_registration IS 'Handles lodge registration creation and updates. Creates customer record for booking contact and registration record. No attendees or tickets are created for lodge registrations.';