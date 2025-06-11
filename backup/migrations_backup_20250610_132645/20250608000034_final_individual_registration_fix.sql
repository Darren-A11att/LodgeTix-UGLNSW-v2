-- Final fix for individual registration with correct enum values
CREATE OR REPLACE FUNCTION public.upsert_individual_registration(
    p_registration_data jsonb
) RETURNS jsonb AS $$
DECLARE
    v_registration_id uuid;
    v_booking_contact_id uuid;
    v_customer_id uuid;
    v_function_id uuid;
    v_primary_attendee_id uuid;
    v_confirmation_number text;
    v_result jsonb;
    v_payment_status text;
    v_attendee_email text;
    v_attendee_phone text;
BEGIN
    -- Extract registration ID
    v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
    
    -- Extract required fields
    v_customer_id := (p_registration_data->>'authUserId')::uuid;
    v_function_id := (p_registration_data->>'functionId')::uuid;
    
    -- Validate required fields
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer ID (authUserId) is required';
    END IF;
    
    IF v_function_id IS NULL THEN
        RAISE EXCEPTION 'Function ID is required';
    END IF;
    
    -- Extract payment status
    v_payment_status := COALESCE(p_registration_data->>'paymentStatus', 'pending');
    
    -- Generate confirmation number
    v_confirmation_number := 'IND-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
    
    -- Extract common email/phone
    v_attendee_email := COALESCE(
        p_registration_data->'billingDetails'->>'emailAddress', 
        p_registration_data->'primaryAttendee'->>'email',
        ''
    );
    
    v_attendee_phone := COALESCE(
        p_registration_data->'billingDetails'->>'mobileNumber', 
        p_registration_data->'primaryAttendee'->>'mobileNumber',
        ''
    );
    
    -- Simple customer record
    INSERT INTO customers (
        customer_id,
        first_name,
        last_name,
        email,
        phone,
        customer_type,
        created_at,
        updated_at
    ) VALUES (
        v_customer_id,
        COALESCE(p_registration_data->'billingDetails'->>'firstName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', ''),
        v_attendee_email,
        v_attendee_phone,
        'booking_contact'::customer_type,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Simple contact record with correct enum
    v_booking_contact_id := gen_random_uuid();
    
    INSERT INTO contacts (
        contact_id,
        type,
        first_name,
        last_name,
        email,
        mobile_number,
        created_at,
        updated_at
    ) VALUES (
        v_booking_contact_id,
        'individual'::contact_type,  -- Use 'individual' instead of 'customer'
        COALESCE(p_registration_data->'billingDetails'->>'firstName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', ''),
        v_attendee_email,
        v_attendee_phone,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Simple registration record
    INSERT INTO registrations (
        registration_id,
        customer_id,
        function_id,
        event_id,
        booking_contact_id,
        registration_type,
        confirmation_number,
        payment_status,
        total_amount_paid,
        subtotal,
        stripe_fee,
        stripe_payment_intent_id,
        registration_data,
        created_at,
        updated_at
    ) VALUES (
        v_registration_id,
        v_customer_id,
        v_function_id,
        (p_registration_data->>'eventId')::uuid,
        v_booking_contact_id,
        'individuals'::registration_type,
        v_confirmation_number,
        v_payment_status::payment_status,
        COALESCE((p_registration_data->>'totalAmount')::decimal, 0),
        COALESCE((p_registration_data->>'subtotal')::decimal, 0),
        COALESCE((p_registration_data->>'stripeFee')::decimal, 0),
        p_registration_data->>'paymentIntentId',
        p_registration_data, -- Store complete data
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (registration_id) DO UPDATE SET
        payment_status = EXCLUDED.payment_status,
        total_amount_paid = EXCLUDED.total_amount_paid,
        subtotal = EXCLUDED.subtotal,
        stripe_fee = EXCLUDED.stripe_fee,
        stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
        registration_data = EXCLUDED.registration_data,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Process primary attendee
    IF p_registration_data->'primaryAttendee' IS NOT NULL THEN
        v_primary_attendee_id := gen_random_uuid();
        
        INSERT INTO attendees (
            attendee_id,
            registration_id,
            attendee_type,
            is_primary,
            first_name,
            last_name,
            title,
            dietary_requirements,
            special_needs,
            contact_preference,
            primary_email,
            primary_phone,
            attendee_data,
            created_at,
            updated_at
        ) VALUES (
            v_primary_attendee_id,
            v_registration_id,
            LOWER(COALESCE(p_registration_data->'primaryAttendee'->>'attendeeType', 'guest'))::attendee_type,
            true,
            p_registration_data->'primaryAttendee'->>'firstName',
            p_registration_data->'primaryAttendee'->>'lastName',
            p_registration_data->'primaryAttendee'->>'title',
            p_registration_data->'primaryAttendee'->>'dietaryRequirements',
            p_registration_data->'primaryAttendee'->>'specialNeeds',
            LOWER(COALESCE(p_registration_data->'primaryAttendee'->>'contactPreference', 'directly'))::attendee_contact_preference,
            COALESCE(p_registration_data->'primaryAttendee'->>'email', v_attendee_email),
            COALESCE(p_registration_data->'primaryAttendee'->>'mobileNumber', v_attendee_phone),
            p_registration_data->'primaryAttendee',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;
    
    -- Return success result
    RETURN jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'customerId', v_customer_id,
        'bookingContactId', v_booking_contact_id,
        'primaryAttendeeId', v_primary_attendee_id,
        'confirmationNumber', v_confirmation_number
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise the exception with context
        RAISE EXCEPTION 'Individual registration failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO anon;

-- Add comment
COMMENT ON FUNCTION public.upsert_individual_registration(jsonb) IS 'Individual registration RPC function with JSONB parameter. Simplified and working version.';