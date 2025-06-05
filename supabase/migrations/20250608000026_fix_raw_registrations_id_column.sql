-- Fix raw_registrations table reference - uses raw_id not id
-- This fixes the "column 'id' does not exist" error

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
    v_raw_data_id uuid;
BEGIN
    -- Extract registration ID
    v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
    
    -- Log raw data for debugging (if table exists)
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
        ) RETURNING raw_id INTO v_raw_data_id;  -- FIX: Changed from 'id' to 'raw_id'
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
    
    -- Check if this is a payment completion
    IF (p_registration_data->>'paymentCompleted')::boolean = true THEN
        -- Update existing registration for payment completion
        UPDATE registrations SET
            payment_status = 'completed'::payment_status,
            stripe_payment_intent_id = p_registration_data->>'paymentIntentId',
            total_amount = COALESCE((p_registration_data->>'totalAmountPaid')::decimal, total_amount),
            updated_at = CURRENT_TIMESTAMP
        WHERE registration_id = v_registration_id
        AND auth_user_id = v_customer_id;
        
        -- Get confirmation number
        SELECT confirmation_number INTO v_confirmation_number
        FROM registrations
        WHERE registration_id = v_registration_id;
        
        -- Mark raw data as processed
        IF v_raw_data_id IS NOT NULL THEN
            UPDATE raw_registrations SET processed = true WHERE raw_id = v_raw_data_id;  -- FIX: Changed from 'id' to 'raw_id'
        END IF;
        
        -- Return success
        RETURN jsonb_build_object(
            'success', true,
            'registrationId', v_registration_id,
            'confirmationNumber', v_confirmation_number
        );
    END IF;
    
    -- Extract payment status
    v_payment_status := COALESCE(p_registration_data->>'paymentStatus', 'pending');
    
    -- Generate confirmation number if not provided
    v_confirmation_number := COALESCE(
        p_registration_data->>'confirmationNumber',
        'IND-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0')
    );
    
    -- Upsert customer record
    INSERT INTO customers (
        customer_id,
        first_name,
        last_name,
        email,
        phone,
        customer_type,
        auth_user_id,
        created_at,
        updated_at
    ) VALUES (
        v_customer_id,
        COALESCE(p_registration_data->'billingDetails'->>'firstName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'emailAddress', ''),
        COALESCE(p_registration_data->'billingDetails'->>'mobileNumber', ''),
        'booking_contact'::customer_type,
        v_customer_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Create booking contact record
    v_booking_contact_id := gen_random_uuid();
    
    -- Extract email and phone for booking contact
    v_attendee_email := COALESCE(
        p_registration_data->'billingDetails'->>'emailAddress', 
        p_registration_data->'billingDetails'->>'email',
        p_registration_data->'primaryAttendee'->>'email',
        ''
    );
    
    v_attendee_phone := COALESCE(
        p_registration_data->'billingDetails'->>'mobileNumber', 
        p_registration_data->'billingDetails'->>'phone',
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
        auth_user_id,
        billing_email,
        billing_phone,
        billing_street_address,
        billing_city,
        billing_state,
        billing_postal_code,
        billing_country,
        created_at,
        updated_at
    ) VALUES (
        v_booking_contact_id,
        'customer'::contact_type,
        COALESCE(p_registration_data->'billingDetails'->>'firstName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', ''),
        v_attendee_email,
        v_attendee_phone,
        v_customer_id,
        v_attendee_email,
        v_attendee_phone,
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'addressLine1', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'city', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'state', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'postcode', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'country', 'Australia'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Upsert registration
    INSERT INTO registrations (
        registration_id,
        customer_id,
        auth_user_id,
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
        jsonb_build_object(
            'billingDetails', p_registration_data->'billingDetails',
            'agreeToTerms', COALESCE((p_registration_data->>'agreeToTerms')::boolean, true),
            'billToPrimaryAttendee', COALESCE((p_registration_data->>'billToPrimaryAttendee')::boolean, false),
            'eventTitle', p_registration_data->>'eventTitle'
        ),
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
        
        -- Get attendee type with proper case handling
        v_attendee_type := LOWER(COALESCE(v_attendee->>'attendeeType', 'guest'));
        v_contact_preference := LOWER(COALESCE(v_attendee->>'contactPreference', 'directly'));
        
        -- Extract email and phone with proper field mapping
        v_attendee_email := COALESCE(
            v_attendee->>'email',
            v_attendee->>'primaryEmail',
            p_registration_data->'billingDetails'->>'emailAddress',
            p_registration_data->'billingDetails'->>'email'
        );
        
        v_attendee_phone := COALESCE(
            v_attendee->>'mobileNumber',
            v_attendee->>'phone',
            v_attendee->>'primaryPhone',
            p_registration_data->'billingDetails'->>'mobileNumber',
            p_registration_data->'billingDetails'->>'phone'
        );
        
        -- Insert primary attendee with proper enum casting
        INSERT INTO attendees (
            attendee_id,
            registration_id,
            attendee_type,
            is_primary,
            related_attendee_id,
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
            v_attendee_type::attendee_type,  -- EXPLICIT CAST TO ENUM
            true,
            NULL,
            v_attendee->>'firstName',
            v_attendee->>'lastName',
            v_attendee->>'title',
            v_attendee->>'suffix1',
            v_attendee->>'suffix2',
            v_attendee->>'suffix3',
            v_attendee->>'dietaryRequirements',
            v_attendee->>'specialNeeds',
            v_contact_preference::attendee_contact_preference,  -- EXPLICIT CAST TO ENUM
            v_attendee_email,
            v_attendee_phone,
            v_attendee,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        -- Create contact record for primary attendee if they want direct contact
        IF v_contact_preference = 'directly' AND (v_attendee_email IS NOT NULL OR v_attendee_phone IS NOT NULL) THEN
            v_contact_id := gen_random_uuid();
            
            INSERT INTO contacts (
                contact_id,
                type,
                first_name,
                last_name,
                email,
                mobile_number,
                title,
                suffix_1,
                suffix_2,
                suffix_3,
                dietary_requirements,
                special_needs,
                contact_preference,
                has_partner,
                is_partner,
                source_id,
                source_type,
                created_at,
                updated_at
            ) VALUES (
                v_contact_id,
                'individual'::contact_type,
                v_attendee->>'firstName',
                v_attendee->>'lastName',
                v_attendee_email,
                v_attendee_phone,
                v_attendee->>'title',
                v_attendee->>'suffix1',
                v_attendee->>'suffix2',
                v_attendee->>'suffix3',
                v_attendee->>'dietaryRequirements',
                v_attendee->>'specialNeeds',
                v_contact_preference::attendee_contact_preference,
                COALESCE((v_attendee->>'hasPartner')::boolean, false),
                false,
                v_primary_attendee_id,
                'attendee',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END IF;
    END IF;
    
    -- Process additional attendees
    IF p_registration_data->'additionalAttendees' IS NOT NULL THEN
        FOR v_attendee IN SELECT * FROM jsonb_array_elements(p_registration_data->'additionalAttendees')
        LOOP
            v_attendee_id := gen_random_uuid();
            v_attendee_type := LOWER(COALESCE(v_attendee->>'attendeeType', 'guest'));
            v_contact_preference := LOWER(COALESCE(v_attendee->>'contactPreference', 'directly'));
            
            -- Extract email and phone
            v_attendee_email := COALESCE(
                v_attendee->>'email',
                v_attendee->>'primaryEmail'
            );
            
            v_attendee_phone := COALESCE(
                v_attendee->>'mobileNumber',
                v_attendee->>'phone',
                v_attendee->>'primaryPhone'
            );
            
            -- Insert additional attendee with proper enum casting
            INSERT INTO attendees (
                attendee_id,
                registration_id,
                attendee_type,
                is_primary,
                related_attendee_id,
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
                v_attendee_id,
                v_registration_id,
                v_attendee_type::attendee_type,  -- EXPLICIT CAST TO ENUM
                false,
                CASE 
                    WHEN v_attendee->>'partnerOf' IS NOT NULL THEN (v_attendee->>'partnerOf')::uuid
                    WHEN v_attendee->>'guestOfId' IS NOT NULL THEN (v_attendee->>'guestOfId')::uuid
                    ELSE NULL
                END,
                v_attendee->>'firstName',
                v_attendee->>'lastName',
                v_attendee->>'title',
                v_attendee->>'suffix1',
                v_attendee->>'suffix2',
                v_attendee->>'suffix3',
                v_attendee->>'dietaryRequirements',
                v_attendee->>'specialNeeds',
                v_contact_preference::attendee_contact_preference,  -- EXPLICIT CAST TO ENUM
                v_attendee_email,
                v_attendee_phone,
                v_attendee,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
            
            -- Create contact if needed
            IF v_contact_preference = 'directly' AND (v_attendee_email IS NOT NULL OR v_attendee_phone IS NOT NULL) THEN
                v_contact_id := gen_random_uuid();
                
                INSERT INTO contacts (
                    contact_id,
                    type,
                    first_name,
                    last_name,
                    email,
                    mobile_number,
                    title,
                    suffix_1,
                    suffix_2,
                    suffix_3,
                    dietary_requirements,
                    special_needs,
                    contact_preference,
                    has_partner,
                    is_partner,
                    source_id,
                    source_type,
                    created_at,
                    updated_at
                ) VALUES (
                    v_contact_id,
                    'individual'::contact_type,
                    v_attendee->>'firstName',
                    v_attendee->>'lastName',
                    v_attendee_email,
                    v_attendee_phone,
                    v_attendee->>'title',
                    v_attendee->>'suffix1',
                    v_attendee->>'suffix2',
                    v_attendee->>'suffix3',
                    v_attendee->>'dietaryRequirements',
                    v_attendee->>'specialNeeds',
                    v_contact_preference::attendee_contact_preference,
                    COALESCE((v_attendee->>'hasPartner')::boolean, false),
                    COALESCE((v_attendee->>'isPartner')::boolean, false),
                    v_attendee_id,
                    'attendee',
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                );
            END IF;
        END LOOP;
    END IF;
    
    -- Process tickets
    IF p_registration_data->'tickets' IS NOT NULL THEN
        FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_registration_data->'tickets')
        LOOP
            INSERT INTO tickets (
                attendee_id,
                registration_id,
                event_id,
                event_ticket_id,
                price_paid,
                status,
                ticket_number,
                created_at,
                updated_at
            ) VALUES (
                (v_ticket->>'attendeeId')::uuid,
                v_registration_id,
                (v_ticket->>'eventId')::uuid,
                (v_ticket->>'ticketDefinitionId')::uuid,
                COALESCE((v_ticket->>'price')::decimal, 0),
                'pending'::ticket_status,
                'TKT-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0'),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END IF;
    
    -- Mark raw data as processed
    IF v_raw_data_id IS NOT NULL THEN
        UPDATE raw_registrations SET processed = true WHERE raw_id = v_raw_data_id;  -- FIX: Changed from 'id' to 'raw_id'
    END IF;
    
    -- Return result
    v_result := jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'customerId', v_customer_id,
        'bookingContactId', v_booking_contact_id,
        'primaryAttendeeId', v_primary_attendee_id,
        'confirmationNumber', v_confirmation_number
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error if raw data exists
        IF v_raw_data_id IS NOT NULL THEN
            UPDATE raw_registrations 
            SET error_message = SQLERRM, 
                processed = false 
            WHERE raw_id = v_raw_data_id;  -- FIX: Changed from 'id' to 'raw_id'
        END IF;
        
        -- Re-raise the exception
        RAISE;
END;
$$ LANGUAGE plpgsql;