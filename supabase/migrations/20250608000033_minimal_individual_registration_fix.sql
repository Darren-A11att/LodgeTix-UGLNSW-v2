-- Minimal fix for individual registration - remove problematic columns and simplify
CREATE OR REPLACE FUNCTION public.upsert_individual_registration(
    p_registration_data jsonb
) RETURNS jsonb AS $$
DECLARE
    v_registration_id uuid;
    v_booking_contact_id uuid;
    v_customer_id uuid;
    v_function_id uuid;
    v_primary_attendee_id uuid;
    v_attendee_id uuid;
    v_contact_id uuid;
    v_attendee jsonb;
    v_ticket jsonb;
    v_confirmation_number text;
    v_result jsonb;
    v_payment_status text;
    v_attendee_type text;
    v_contact_preference text;
    v_attendee_email text;
    v_attendee_phone text;
    v_organisation_id uuid;
    v_status text;
BEGIN
    -- Extract registration ID
    v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
    
    -- Log raw data for debugging (using correct column names)
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'raw_registrations') THEN
        INSERT INTO raw_registrations (
            registration_id,
            registration_type,
            raw_data,
            processed
        ) VALUES (
            v_registration_id,
            'individuals',
            p_registration_data,
            false
        );
    END IF;
    
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
    
    -- Simple customer record (without auth_user_id column that doesn't exist)
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
        COALESCE(p_registration_data->'billingDetails'->>'emailAddress', ''),
        COALESCE(p_registration_data->'billingDetails'->>'mobileNumber', ''),
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
    
    -- Simple contact record
    v_booking_contact_id := gen_random_uuid();
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
        'customer'::contact_type,
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
        total_amount,
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
        total_amount = EXCLUDED.total_amount,
        subtotal = EXCLUDED.subtotal,
        stripe_fee = EXCLUDED.stripe_fee,
        stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
        registration_data = EXCLUDED.registration_data,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Process primary attendee
    IF p_registration_data->'primaryAttendee' IS NOT NULL THEN
        v_attendee := p_registration_data->'primaryAttendee';
        v_primary_attendee_id := gen_random_uuid();
        
        v_attendee_type := LOWER(COALESCE(v_attendee->>'attendeeType', 'guest'));
        v_contact_preference := LOWER(COALESCE(v_attendee->>'contactPreference', 'directly'));
        
        v_attendee_email := COALESCE(
            v_attendee->>'email',
            p_registration_data->'billingDetails'->>'emailAddress'
        );
        
        v_attendee_phone := COALESCE(
            v_attendee->>'mobileNumber',
            p_registration_data->'billingDetails'->>'mobileNumber'
        );
        
        INSERT INTO attendees (
            attendee_id,
            registration_id,
            attendee_type,
            is_primary,
            first_name,
            last_name,
            title,
            suffix_1,
            suffix_2,
            suffix_3,
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
            v_attendee_type::attendee_type,
            true,
            v_attendee->>'firstName',
            v_attendee->>'lastName',
            v_attendee->>'title',
            v_attendee->>'suffix1',
            v_attendee->>'suffix2',
            v_attendee->>'suffix3',
            v_attendee->>'dietaryRequirements',
            v_attendee->>'specialNeeds',
            v_contact_preference::attendee_contact_preference,
            v_attendee_email,
            v_attendee_phone,
            v_attendee,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;
    
    -- Mark raw data as processed
    UPDATE raw_registrations SET processed = true WHERE registration_id = v_registration_id;
    
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
        -- Log error if raw data exists
        UPDATE raw_registrations 
        SET error_message = SQLERRM, 
            processed = false 
        WHERE registration_id = v_registration_id;
        
        -- Re-raise the exception
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO anon;

-- Add comment
COMMENT ON FUNCTION public.upsert_individual_registration(jsonb) IS 'Simplified individual registration RPC function with JSONB parameter. Fixed for compatibility with actual database schema.';