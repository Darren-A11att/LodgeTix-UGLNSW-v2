-- Comprehensive individual registration RPC based on delegation pattern
-- Handles complete attendee arrays, tickets, enhanced Zustand store data, and database-sourced pricing

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
    v_partner_attendee_id uuid;
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
            total_amount_paid = COALESCE((p_registration_data->>'totalAmountPaid')::decimal, total_amount_paid),
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
    
    -- For new registrations, DO NOT generate confirmation number
    -- Edge Function will generate it after payment completion
    v_confirmation_number := NULL;
    
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
        'booking_contact',  -- Valid customer_type enum value
        COALESCE(p_registration_data->'billingDetails'->>'firstName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', ''),
        COALESCE(
            p_registration_data->'billingDetails'->>'emailAddress', 
            p_registration_data->'billingDetails'->>'email', 
            ''
        ),
        COALESCE(
            p_registration_data->'billingDetails'->>'mobileNumber', 
            p_registration_data->'billingDetails'->>'phone', 
            ''
        ),
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
        'individual',  -- Valid contact_type enum value
        COALESCE(p_registration_data->'billingDetails'->>'firstName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', ''),
        COALESCE(
            p_registration_data->'billingDetails'->>'emailAddress', 
            p_registration_data->'billingDetails'->>'email',
            ''
        ),
        COALESCE(
            p_registration_data->'billingDetails'->>'mobileNumber', 
            p_registration_data->'billingDetails'->>'phone',
            ''
        ),
        v_customer_id,
        COALESCE(p_registration_data->'billingDetails'->>'emailAddress', ''),
        COALESCE(p_registration_data->'billingDetails'->>'mobileNumber', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'addressLine1', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'city', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'state', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'postcode', ''),
        COALESCE(p_registration_data->'billingDetails'->'billingAddress'->>'country', 'Australia'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Upsert registration with complete Zustand store data
    INSERT INTO registrations (
        registration_id,
        customer_id,
        auth_user_id,
        function_id,
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
        v_customer_id,
        v_function_id,
        'individuals',
        v_confirmation_number,
        COALESCE(v_payment_status, 'pending'),
        COALESCE((p_registration_data->>'totalAmount')::decimal, 0),
        COALESCE((p_registration_data->>'subtotal')::decimal, 0),
        COALESCE((p_registration_data->>'stripeFee')::decimal, 0),
        p_registration_data->>'paymentIntentId',
        jsonb_build_object(
            'billingDetails', p_registration_data->'billingDetails',
            'attendees', p_registration_data->'attendees',
            'tickets', p_registration_data->'tickets',
            'agreeToTerms', COALESCE((p_registration_data->>'agreeToTerms')::boolean, true),
            'billToPrimaryAttendee', COALESCE((p_registration_data->>'billToPrimaryAttendee')::boolean, false),
            'eventTitle', p_registration_data->>'eventTitle',
            'eventId', p_registration_data->>'eventId',
            'bookingContactId', v_booking_contact_id,
            'enhancedPricing', p_registration_data->'enhancedPricing',
            'zustandStoreState', p_registration_data->'zustandStoreState'
        ),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (registration_id) DO UPDATE SET
        customer_id = EXCLUDED.customer_id,
        auth_user_id = EXCLUDED.auth_user_id,
        function_id = EXCLUDED.function_id,
        payment_status = EXCLUDED.payment_status,
        total_amount_paid = EXCLUDED.total_amount_paid,
        subtotal = EXCLUDED.subtotal,
        stripe_fee = EXCLUDED.stripe_fee,
        stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
        registration_data = EXCLUDED.registration_data,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Process attendees array (individuals registration pattern)
    IF p_registration_data->'attendees' IS NOT NULL THEN
        -- Process primary attendee
        FOR v_attendee IN 
            SELECT * FROM jsonb_array_elements(p_registration_data->'attendees') 
            WHERE (value->>'isPrimary')::boolean = true
            LIMIT 1
        LOOP
            v_primary_attendee_id := gen_random_uuid();
            
            -- Get attendee type with proper case handling
            v_attendee_type := LOWER(COALESCE(v_attendee->>'attendeeType', 'guest'));
            v_contact_preference := LOWER(COALESCE(v_attendee->>'contactPreference', 'directly'));
            
            -- Extract email and phone
            v_attendee_email := COALESCE(
                v_attendee->>'primaryEmail',
                v_attendee->>'email',
                p_registration_data->'billingDetails'->>'emailAddress'
            );
            
            v_attendee_phone := COALESCE(
                v_attendee->>'primaryPhone',
                v_attendee->>'mobileNumber',
                v_attendee->>'phone',
                p_registration_data->'billingDetails'->>'mobileNumber'
            );
            
            -- Insert primary attendee
            INSERT INTO attendees (
                attendee_id,
                registration_id,
                attendee_type,
                is_primary,
                related_attendee_id,
                first_name,
                last_name,
                title,
                suffix,
                dietary_requirements,
                special_needs,
                contact_preference,
                email,
                phone,
                created_at,
                updated_at
            ) VALUES (
                v_primary_attendee_id,
                v_registration_id,
                v_attendee_type,
                true,
                NULL,
                v_attendee->>'firstName',
                v_attendee->>'lastName',
                v_attendee->>'title',
                COALESCE(v_attendee->>'suffix', v_attendee->>'suffix1'),
                v_attendee->>'dietaryRequirements',
                v_attendee->>'specialNeeds',
                v_contact_preference,
                v_attendee_email,
                v_attendee_phone,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
            
            -- Store masonic data if attendee is a mason
            IF v_attendee_type = 'mason' THEN
                UPDATE attendees 
                SET masonic_status = jsonb_build_object(
                    'rank', v_attendee->>'rank',
                    'grand_lodge_id', v_attendee->>'grand_lodge_id',
                    'lodge_id', v_attendee->>'lodge_id',
                    'lodgeNameNumber', v_attendee->>'lodgeNameNumber',
                    'grandOfficerStatus', v_attendee->>'grandOfficerStatus',
                    'presentGrandOfficerRole', v_attendee->>'presentGrandOfficerRole',
                    'attendeeType', v_attendee->>'attendeeType'
                )
                WHERE attendee_id = v_primary_attendee_id;
            END IF;
        END LOOP;
        
        -- Process other attendees (partners, guests, etc.)
        FOR v_attendee IN 
            SELECT * FROM jsonb_array_elements(p_registration_data->'attendees') 
            WHERE COALESCE((value->>'isPrimary')::boolean, false) = false
        LOOP
            v_attendee_id := gen_random_uuid();
            
            -- Get attendee type
            v_attendee_type := LOWER(COALESCE(v_attendee->>'attendeeType', 'guest'));
            v_contact_preference := LOWER(COALESCE(v_attendee->>'contactPreference', 'directly'));
            
            -- Extract email and phone
            v_attendee_email := COALESCE(
                v_attendee->>'primaryEmail',
                v_attendee->>'email'
            );
            
            v_attendee_phone := COALESCE(
                v_attendee->>'primaryPhone',
                v_attendee->>'mobileNumber',
                v_attendee->>'phone'
            );
            
            -- Insert attendee
            INSERT INTO attendees (
                attendee_id,
                registration_id,
                attendee_type,
                is_primary,
                related_attendee_id,
                first_name,
                last_name,
                title,
                suffix,
                dietary_requirements,
                special_needs,
                contact_preference,
                email,
                phone,
                created_at,
                updated_at
            ) VALUES (
                v_attendee_id,
                v_registration_id,
                v_attendee_type,
                false,
                CASE 
                    WHEN (v_attendee->>'isPartner')::boolean = true THEN v_primary_attendee_id
                    ELSE NULL
                END,
                v_attendee->>'firstName',
                v_attendee->>'lastName',
                v_attendee->>'title',
                COALESCE(v_attendee->>'suffix', v_attendee->>'suffix1'),
                v_attendee->>'dietaryRequirements',
                v_attendee->>'specialNeeds',
                v_contact_preference,
                v_attendee_email,
                v_attendee_phone,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
            
            -- Store masonic data if attendee is a mason
            IF v_attendee_type = 'mason' THEN
                UPDATE attendees 
                SET masonic_status = jsonb_build_object(
                    'rank', v_attendee->>'rank',
                    'grand_lodge_id', v_attendee->>'grand_lodge_id',
                    'lodge_id', v_attendee->>'lodge_id',
                    'lodgeNameNumber', v_attendee->>'lodgeNameNumber',
                    'grandOfficerStatus', v_attendee->>'grandOfficerStatus',
                    'presentGrandOfficerRole', v_attendee->>'presentGrandOfficerRole',
                    'attendeeType', v_attendee->>'attendeeType'
                )
                WHERE attendee_id = v_attendee_id;
            END IF;
            
            -- Create contact record if they want direct contact
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
                    'individual',
                    v_attendee->>'firstName',
                    v_attendee->>'lastName',
                    COALESCE(v_attendee_email, ''),
                    v_attendee_phone,
                    v_attendee->>'title',
                    v_attendee->>'suffix1',
                    v_attendee->>'dietaryRequirements',
                    v_attendee->>'specialNeeds',
                    v_contact_preference,
                    COALESCE((v_attendee->>'hasPartner')::boolean, false),
                    COALESCE((v_attendee->>'isPartner')::boolean, false),
                    v_attendee_id::text,
                    'attendee',
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                );
            END IF;
        END LOOP;
    END IF;
    
    -- Process tickets with database-sourced pricing
    IF jsonb_array_length(p_registration_data->'tickets') > 0 THEN
        FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_registration_data->'tickets')
        LOOP
            INSERT INTO tickets (
                registration_id,
                attendee_id,
                event_id,
                status,
                price_paid,
                created_at,
                updated_at
            ) VALUES (
                v_registration_id,
                (v_ticket->>'attendeeId')::uuid,
                COALESCE(
                    (v_ticket->>'eventTicketId')::uuid,
                    (v_ticket->>'ticketDefinitionId')::uuid,
                    (v_ticket->>'eventId')::uuid
                ),
                'reserved',
                COALESCE((v_ticket->>'price')::decimal, 0),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END IF;
    
    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'confirmationNumber', v_confirmation_number,
        'customerId', v_customer_id,
        'bookingContactId', v_booking_contact_id,
        'primaryAttendeeId', v_primary_attendee_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error details
        RAISE NOTICE 'Error in upsert_individual_registration: %', SQLERRM;
        RAISE NOTICE 'Error detail: %', SQLSTATE;
        -- Re-raise the error
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO anon;