-- Fix the upsert_individual_registration function to properly map email fields
-- This addresses the error: null value in column "email" of relation "contacts" violates not-null constraint

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
BEGIN
    -- Extract required fields
    v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
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
            payment_status = 'completed',
            stripe_payment_intent_id = p_registration_data->>'paymentIntentId',
            total_amount = COALESCE((p_registration_data->>'totalAmountPaid')::decimal, total_amount),
            updated_at = CURRENT_TIMESTAMP
        WHERE registration_id = v_registration_id
        AND auth_user_id = v_customer_id;
        
        -- Get confirmation number
        SELECT confirmation_number INTO v_confirmation_number
        FROM registrations
        WHERE registration_id = v_registration_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'registrationId', v_registration_id,
            'confirmationNumber', v_confirmation_number,
            'customerId', v_customer_id
        );
    END IF;
    
    -- Check if registration exists
    SELECT confirmation_number INTO v_confirmation_number
    FROM registrations
    WHERE registration_id = v_registration_id;
    
    -- For new registrations, generate confirmation number
    IF v_confirmation_number IS NULL THEN
        v_confirmation_number := 'IND-' || to_char(CURRENT_TIMESTAMP, 'YYMMDD') || '-' || 
                                LPAD(nextval('registration_confirmation_seq')::text, 4, '0');
    END IF;
    
    -- Create or update customer record
    INSERT INTO customers (
        customer_id,
        customer_type,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        updated_at
    ) VALUES (
        v_customer_id,
        'individual',
        COALESCE(p_registration_data->'billingDetails'->>'firstName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'emailAddress', p_registration_data->'billingDetails'->>'email', ''),
        COALESCE(p_registration_data->'billingDetails'->>'mobileNumber', p_registration_data->'billingDetails'->>'phone', ''),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Create booking contact record (always create new for each registration)
    v_booking_contact_id := gen_random_uuid();
    
    INSERT INTO contacts (
        contact_id,
        customer_id,
        first_name,
        last_name,
        email,
        phone,
        is_primary,
        created_at,
        updated_at
    ) VALUES (
        v_booking_contact_id,
        v_customer_id,
        COALESCE(p_registration_data->'billingDetails'->>'firstName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', ''),
        -- Map emailAddress to email, with fallback
        COALESCE(
            p_registration_data->'billingDetails'->>'emailAddress', 
            p_registration_data->'billingDetails'->>'email',
            p_registration_data->'primaryAttendee'->>'primaryEmail',
            p_registration_data->'primaryAttendee'->>'email',
            ''
        ),
        COALESCE(
            p_registration_data->'billingDetails'->>'mobileNumber', 
            p_registration_data->'billingDetails'->>'phone',
            p_registration_data->'primaryAttendee'->>'primaryPhone',
            p_registration_data->'primaryAttendee'->>'phone',
            ''
        ),
        true,
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
        'individuals',
        v_confirmation_number,
        COALESCE(v_payment_status, 'pending'),
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
        customer_id = EXCLUDED.customer_id,
        auth_user_id = EXCLUDED.auth_user_id,
        function_id = EXCLUDED.function_id,
        event_id = EXCLUDED.event_id,
        booking_contact_id = EXCLUDED.booking_contact_id,
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
        v_contact_preference := COALESCE(v_attendee->>'contactPreference', 'Directly');
        
        -- Extract email and phone with proper field mapping
        v_attendee_email := COALESCE(
            v_attendee->>'primaryEmail',
            v_attendee->>'email',
            p_registration_data->'billingDetails'->>'emailAddress',
            p_registration_data->'billingDetails'->>'email'
        );
        
        v_attendee_phone := COALESCE(
            v_attendee->>'primaryPhone',
            v_attendee->>'phone',
            p_registration_data->'billingDetails'->>'mobileNumber',
            p_registration_data->'billingDetails'->>'phone'
        );
        
        -- Create attendee record
        INSERT INTO attendees (
            attendee_id,
            registration_id,
            attendee_type,
            contact_preference,
            is_primary,
            title,
            first_name,
            last_name,
            dietary_requirements,
            accessibility_requirements,
            attendee_data,
            created_at,
            updated_at
        ) VALUES (
            v_primary_attendee_id,
            v_registration_id,
            v_attendee_type,
            v_contact_preference,
            true,
            v_attendee->>'title',
            v_attendee->>'firstName',
            v_attendee->>'lastName',
            v_attendee->>'dietaryRequirements',
            v_attendee->>'accessibilityRequirements',
            v_attendee,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        -- Create contact record for primary attendee if they want direct contact
        IF v_contact_preference = 'Directly' AND v_attendee_email IS NOT NULL THEN
            v_contact_id := gen_random_uuid();
            
            INSERT INTO contacts (
                contact_id,
                customer_id,
                attendee_id,
                first_name,
                last_name,
                email,
                phone,
                is_primary,
                created_at,
                updated_at
            ) VALUES (
                v_contact_id,
                v_customer_id,
                v_primary_attendee_id,
                v_attendee->>'firstName',
                v_attendee->>'lastName',
                v_attendee_email,
                COALESCE(v_attendee_phone, ''),
                false,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END IF;
        
        -- Update registration with primary attendee name
        UPDATE registrations SET
            primary_attendee = COALESCE(v_attendee->>'firstName', '') || ' ' || COALESCE(v_attendee->>'lastName', '')
        WHERE registration_id = v_registration_id;
    END IF;
    
    -- Process additional attendees
    IF jsonb_array_length(COALESCE(p_registration_data->'additionalAttendees', '[]'::jsonb)) > 0 THEN
        FOR v_attendee IN SELECT * FROM jsonb_array_elements(p_registration_data->'additionalAttendees')
        LOOP
            v_attendee_id := gen_random_uuid();
            v_attendee_type := LOWER(COALESCE(v_attendee->>'attendeeType', 'guest'));
            v_contact_preference := COALESCE(v_attendee->>'contactPreference', 'PrimaryAttendee');
            
            -- Extract email and phone with proper field mapping
            v_attendee_email := COALESCE(
                v_attendee->>'primaryEmail',
                v_attendee->>'email'
            );
            
            v_attendee_phone := COALESCE(
                v_attendee->>'primaryPhone',
                v_attendee->>'phone'
            );
            
            -- Create attendee record
            INSERT INTO attendees (
                attendee_id,
                registration_id,
                attendee_type,
                contact_preference,
                is_primary,
                title,
                first_name,
                last_name,
                dietary_requirements,
                accessibility_requirements,
                attendee_data,
                created_at,
                updated_at
            ) VALUES (
                v_attendee_id,
                v_registration_id,
                v_attendee_type,
                v_contact_preference,
                false,
                v_attendee->>'title',
                v_attendee->>'firstName',
                v_attendee->>'lastName',
                v_attendee->>'dietaryRequirements',
                v_attendee->>'accessibilityRequirements',
                v_attendee,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
            
            -- Create contact record if attendee wants direct contact
            IF v_contact_preference = 'Directly' AND v_attendee_email IS NOT NULL THEN
                v_contact_id := gen_random_uuid();
                
                INSERT INTO contacts (
                    contact_id,
                    customer_id,
                    attendee_id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    is_primary,
                    created_at,
                    updated_at
                ) VALUES (
                    v_contact_id,
                    v_customer_id,
                    v_attendee_id,
                    v_attendee->>'firstName',
                    v_attendee->>'lastName',
                    v_attendee_email,
                    COALESCE(v_attendee_phone, ''),
                    false,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                );
            END IF;
        END LOOP;
    END IF;
    
    -- Process tickets
    IF jsonb_array_length(COALESCE(p_registration_data->'tickets', '[]'::jsonb)) > 0 THEN
        FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_registration_data->'tickets')
        LOOP
            INSERT INTO tickets (
                ticket_id,
                registration_id,
                attendee_id,
                event_ticket_id,
                package_id,
                status,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_registration_id,
                (v_ticket->>'attendeeId')::uuid,
                CASE 
                    WHEN (v_ticket->>'isPackage')::boolean = false 
                    THEN (v_ticket->>'eventTicketId')::uuid 
                    ELSE NULL 
                END,
                CASE 
                    WHEN (v_ticket->>'isPackage')::boolean = true 
                    THEN (v_ticket->>'ticketDefinitionId')::uuid 
                    ELSE NULL 
                END,
                'active',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END IF;
    
    -- Build and return result
    v_result := jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'confirmationNumber', v_confirmation_number,
        'customerId', v_customer_id,
        'bookingContactId', v_booking_contact_id,
        'primaryAttendeeId', v_primary_attendee_id
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error details for debugging
        RAISE NOTICE 'Error in upsert_individual_registration: % %', SQLERRM, SQLSTATE;
        RAISE EXCEPTION 'Failed to process individual registration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the function
COMMENT ON FUNCTION public.upsert_individual_registration(jsonb) IS 
'Handles individual registration creation and updates with proper email field mapping from frontend data structures';