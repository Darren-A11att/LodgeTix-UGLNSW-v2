-- Comprehensive individual registration function that normalizes ALL data
CREATE OR REPLACE FUNCTION public.upsert_individual_registration(
    p_registration_data jsonb
) RETURNS jsonb AS $$
DECLARE
    v_registration_id uuid;
    v_customer_id uuid;
    v_booking_contact_id uuid;
    v_function_id uuid;
    v_event_id uuid;
    v_attendee_record jsonb;
    v_ticket_record jsonb;
    v_contact_id uuid;
    v_attendee_id uuid;
    v_masonic_profile_id uuid;
    v_ticket_id uuid;
    v_ticket_price numeric;
    v_total_amount numeric := 0;
    v_subtotal numeric := 0;
    v_stripe_fee numeric := 0;
    v_confirmation_number text;
    v_state_name text;
    v_country_name text;
BEGIN
    -- Extract core IDs
    v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
    v_customer_id := (p_registration_data->>'authUserId')::uuid;
    v_function_id := (p_registration_data->>'functionId')::uuid;
    v_event_id := (p_registration_data->>'eventId')::uuid;
    
    -- Extract monetary values
    v_subtotal := COALESCE((p_registration_data->>'subtotal')::numeric, 0);
    v_stripe_fee := COALESCE((p_registration_data->>'stripeFee')::numeric, 0);
    v_total_amount := COALESCE((p_registration_data->>'totalAmount')::numeric, v_subtotal + v_stripe_fee);
    
    -- Validate required fields
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer ID (authUserId) is required';
    END IF;
    
    IF v_function_id IS NULL THEN
        RAISE EXCEPTION 'Function ID is required';
    END IF;

    -- Extract state and country names from objects
    v_state_name := COALESCE(
        p_registration_data->'billingDetails'->'stateTerritory'->>'name',
        p_registration_data->'billingDetails'->>'state',
        ''
    );
    
    v_country_name := COALESCE(
        p_registration_data->'billingDetails'->'country'->>'name',
        p_registration_data->'billingDetails'->>'country',
        'Australia'
    );

    -- 1. CREATE BOOKING CONTACT CUSTOMER RECORD
    -- This is the person who is paying for the registration
    v_booking_contact_id := gen_random_uuid();
    
    INSERT INTO customers (
        customer_id,
        customer_type,
        first_name,
        last_name,
        business_name,
        email,
        phone,
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
        created_at,
        updated_at
    ) VALUES (
        v_booking_contact_id,
        'booking_contact'::customer_type,
        p_registration_data->'billingDetails'->>'firstName',
        p_registration_data->'billingDetails'->>'lastName',
        p_registration_data->'billingDetails'->>'businessName',
        p_registration_data->'billingDetails'->>'emailAddress',
        p_registration_data->'billingDetails'->>'mobileNumber',
        p_registration_data->'billingDetails'->>'addressLine1',
        p_registration_data->'billingDetails'->>'addressLine2',
        p_registration_data->'billingDetails'->>'suburb',
        v_state_name,
        p_registration_data->'billingDetails'->>'postcode',
        v_country_name,
        -- Billing fields mirror the main fields for booking contacts
        p_registration_data->'billingDetails'->>'businessName',
        p_registration_data->'billingDetails'->>'emailAddress',
        p_registration_data->'billingDetails'->>'mobileNumber',
        p_registration_data->'billingDetails'->>'addressLine1',
        p_registration_data->'billingDetails'->>'suburb',
        v_state_name,
        p_registration_data->'billingDetails'->>'postcode',
        v_country_name,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    -- 2. CREATE CONTACT RECORD FOR BOOKING CONTACT
    INSERT INTO contacts (
        contact_id,
        type,
        first_name,
        last_name,
        email,
        mobile_number,
        business_name,
        address_line_1,
        address_line_2,
        suburb_city,
        state,
        country,
        postcode,
        auth_user_id,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'individual'::contact_type,
        p_registration_data->'billingDetails'->>'firstName',
        p_registration_data->'billingDetails'->>'lastName',
        p_registration_data->'billingDetails'->>'emailAddress',
        p_registration_data->'billingDetails'->>'mobileNumber',
        p_registration_data->'billingDetails'->>'businessName',
        p_registration_data->'billingDetails'->>'addressLine1',
        p_registration_data->'billingDetails'->>'addressLine2',
        p_registration_data->'billingDetails'->>'suburb',
        v_state_name,
        v_country_name,
        p_registration_data->'billingDetails'->>'postcode',
        v_customer_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    -- 3. CREATE REGISTRATION RECORD WITH ALL FIELDS
    INSERT INTO registrations (
        registration_id,
        customer_id,
        booking_contact_id,
        function_id,
        event_id,
        registration_type,
        registration_date,
        status,
        payment_status,
        total_amount_paid,
        total_price_paid,
        subtotal,
        stripe_fee,
        stripe_payment_intent_id,
        attendee_count,
        auth_user_id,
        agree_to_terms,
        registration_data,
        created_at,
        updated_at
    ) VALUES (
        v_registration_id,
        v_customer_id,
        v_booking_contact_id,
        v_function_id,
        v_event_id,
        'individuals'::registration_type,
        CURRENT_TIMESTAMP,
        CASE 
            WHEN COALESCE((p_registration_data->>'paymentCompleted')::boolean, false) THEN 'completed'
            ELSE 'pending'
        END,
        CASE 
            WHEN COALESCE((p_registration_data->>'paymentCompleted')::boolean, false) THEN 'completed'::payment_status
            ELSE 'pending'::payment_status
        END,
        v_total_amount,
        v_total_amount,
        v_subtotal,
        v_stripe_fee,
        p_registration_data->>'paymentIntentId',
        1 + COALESCE(jsonb_array_length(p_registration_data->'additionalAttendees'), 0),
        v_customer_id,
        COALESCE((p_registration_data->>'agreeToTerms')::boolean, true),
        p_registration_data,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (registration_id) DO UPDATE SET
        payment_status = EXCLUDED.payment_status,
        status = EXCLUDED.status,
        total_amount_paid = EXCLUDED.total_amount_paid,
        total_price_paid = EXCLUDED.total_price_paid,
        stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
        registration_data = EXCLUDED.registration_data,
        updated_at = CURRENT_TIMESTAMP;

    -- 4. PROCESS PRIMARY ATTENDEE
    IF p_registration_data->'primaryAttendee' IS NOT NULL THEN
        v_attendee_record := p_registration_data->'primaryAttendee';
        v_attendee_id := COALESCE((v_attendee_record->>'attendeeId')::uuid, gen_random_uuid());
        
        -- Create contact for primary attendee
        v_contact_id := gen_random_uuid();
        INSERT INTO contacts (
            contact_id,
            type,
            first_name,
            last_name,
            title,
            email,
            mobile_number,
            contact_preference,
            dietary_requirements,
            special_needs,
            auth_user_id,
            created_at,
            updated_at
        ) VALUES (
            v_contact_id,
            'individual'::contact_type,
            v_attendee_record->>'firstName',
            v_attendee_record->>'lastName',
            v_attendee_record->>'title',
            v_attendee_record->>'primaryEmail',
            v_attendee_record->>'primaryPhone',
            LOWER(v_attendee_record->>'contactPreference'),
            v_attendee_record->>'dietaryRequirements',
            v_attendee_record->>'specialNeeds',
            v_customer_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        -- Create attendee record
        INSERT INTO attendees (
            attendee_id,
            registration_id,
            attendee_type,
            contact_preference,
            title,
            first_name,
            last_name,
            primary_email,
            primary_phone,
            is_primary,
            dietary_requirements,
            special_needs,
            contact_id,
            auth_user_id,
            masonic_status,
            attendee_data,
            created_at,
            updated_at
        ) VALUES (
            v_attendee_id,
            v_registration_id,
            LOWER(v_attendee_record->>'attendeeType')::attendee_type,
            CASE 
                WHEN LOWER(v_attendee_record->>'contactPreference') = 'directly' THEN 'directly'
                WHEN LOWER(v_attendee_record->>'contactPreference') = 'primaryattendee' THEN 'primaryattendee'
                WHEN LOWER(v_attendee_record->>'contactPreference') = 'providelater' THEN 'providelater'
                ELSE 'directly'
            END::attendee_contact_preference,
            v_attendee_record->>'title',
            v_attendee_record->>'firstName',
            v_attendee_record->>'lastName',
            v_attendee_record->>'primaryEmail',
            v_attendee_record->>'primaryPhone',
            true,
            v_attendee_record->>'dietaryRequirements',
            v_attendee_record->>'specialNeeds',
            v_contact_id,
            v_customer_id,
            CASE 
                WHEN LOWER(v_attendee_record->>'attendeeType') = 'mason' THEN
                    jsonb_build_object(
                        'rank', v_attendee_record->>'rank',
                        'grand_lodge_id', v_attendee_record->>'grand_lodge_id',
                        'lodge_id', v_attendee_record->>'lodge_id',
                        'lodge_name', v_attendee_record->>'lodgeNameNumber',
                        'post_nominals', v_attendee_record->>'postNominals',
                        'first_time', COALESCE((v_attendee_record->>'firstTime')::boolean, false)
                    )
                ELSE NULL
            END,
            v_attendee_record,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        -- Update primary_attendee_id in registration
        UPDATE registrations 
        SET primary_attendee_id = v_attendee_id,
            primary_attendee = v_attendee_record->>'firstName' || ' ' || v_attendee_record->>'lastName'
        WHERE registration_id = v_registration_id;

        -- Create masonic profile if attendee is a mason
        IF LOWER(v_attendee_record->>'attendeeType') = 'mason' THEN
            INSERT INTO masonic_profiles (
                masonic_profile_id,
                contact_id,
                masonic_title,
                rank,
                grand_lodge_id,
                lodge_id,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_contact_id,
                v_attendee_record->>'title',
                v_attendee_record->>'rank',
                (v_attendee_record->>'grand_lodge_id')::uuid,
                (v_attendee_record->>'lodge_id')::uuid,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END IF;
    END IF;

    -- 5. PROCESS ADDITIONAL ATTENDEES
    IF p_registration_data->'additionalAttendees' IS NOT NULL THEN
        FOR v_attendee_record IN SELECT * FROM jsonb_array_elements(p_registration_data->'additionalAttendees')
        LOOP
            v_attendee_id := COALESCE((v_attendee_record->>'attendeeId')::uuid, gen_random_uuid());
            
            -- Create contact for additional attendee
            v_contact_id := gen_random_uuid();
            INSERT INTO contacts (
                contact_id,
                type,
                first_name,
                last_name,
                title,
                email,
                mobile_number,
                contact_preference,
                dietary_requirements,
                special_needs,
                is_partner,
                auth_user_id,
                created_at,
                updated_at
            ) VALUES (
                v_contact_id,
                'individual'::contact_type,
                v_attendee_record->>'firstName',
                v_attendee_record->>'lastName',
                v_attendee_record->>'title',
                v_attendee_record->>'primaryEmail',
                v_attendee_record->>'primaryPhone',
                LOWER(v_attendee_record->>'contactPreference'),
                v_attendee_record->>'dietaryRequirements',
                v_attendee_record->>'specialNeeds',
                COALESCE((v_attendee_record->>'isPartner')::boolean, false),
                v_customer_id,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );

            -- Create attendee record
            INSERT INTO attendees (
                attendee_id,
                registration_id,
                attendee_type,
                contact_preference,
                title,
                first_name,
                last_name,
                primary_email,
                primary_phone,
                is_primary,
                is_partner,
                related_attendee_id,
                relationship,
                dietary_requirements,
                special_needs,
                contact_id,
                auth_user_id,
                masonic_status,
                attendee_data,
                created_at,
                updated_at
            ) VALUES (
                v_attendee_id,
                v_registration_id,
                LOWER(v_attendee_record->>'attendeeType')::attendee_type,
                CASE 
                    WHEN LOWER(v_attendee_record->>'contactPreference') = 'directly' THEN 'directly'
                    WHEN LOWER(v_attendee_record->>'contactPreference') = 'primaryattendee' THEN 'primaryattendee'
                    WHEN LOWER(v_attendee_record->>'contactPreference') = 'providelater' THEN 'providelater'
                    ELSE 'primaryattendee'
                END::attendee_contact_preference,
                v_attendee_record->>'title',
                v_attendee_record->>'firstName',
                v_attendee_record->>'lastName',
                v_attendee_record->>'primaryEmail',
                v_attendee_record->>'primaryPhone',
                false,
                v_attendee_record->>'partnerOf',
                (v_attendee_record->>'partnerOf')::uuid,
                v_attendee_record->>'relationship',
                v_attendee_record->>'dietaryRequirements',
                v_attendee_record->>'specialNeeds',
                v_contact_id,
                v_customer_id,
                CASE 
                    WHEN LOWER(v_attendee_record->>'attendeeType') = 'mason' THEN
                        jsonb_build_object(
                            'rank', v_attendee_record->>'rank',
                            'grand_lodge_id', v_attendee_record->>'grand_lodge_id',
                            'lodge_id', v_attendee_record->>'lodge_id',
                            'lodge_name', v_attendee_record->>'lodgeNameNumber',
                            'post_nominals', v_attendee_record->>'postNominals',
                            'first_time', COALESCE((v_attendee_record->>'firstTime')::boolean, false)
                        )
                    ELSE NULL
                END,
                v_attendee_record,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );

            -- Create masonic profile if additional attendee is a mason
            IF LOWER(v_attendee_record->>'attendeeType') = 'mason' THEN
                INSERT INTO masonic_profiles (
                    masonic_profile_id,
                    contact_id,
                    masonic_title,
                    rank,
                    grand_lodge_id,
                    lodge_id,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    v_contact_id,
                    v_attendee_record->>'title',
                    v_attendee_record->>'rank',
                    (v_attendee_record->>'grand_lodge_id')::uuid,
                    (v_attendee_record->>'lodge_id')::uuid,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                );
            END IF;
        END LOOP;
    END IF;

    -- 6. PROCESS TICKETS
    IF p_registration_data->'tickets' IS NOT NULL THEN
        FOR v_ticket_record IN SELECT * FROM jsonb_array_elements(p_registration_data->'tickets')
        LOOP
            v_ticket_id := gen_random_uuid();
            
            -- Get ticket price from event_tickets table
            IF v_ticket_record->>'eventTicketId' IS NOT NULL THEN
                SELECT price INTO v_ticket_price
                FROM event_tickets
                WHERE id = (v_ticket_record->>'eventTicketId')::uuid;
                
                v_ticket_price := COALESCE(v_ticket_price, (v_ticket_record->>'price')::numeric, 0);
            ELSE
                v_ticket_price := COALESCE((v_ticket_record->>'price')::numeric, 0);
            END IF;

            INSERT INTO tickets (
                ticket_id,
                attendee_id,
                event_id,
                registration_id,
                event_ticket_id,
                ticket_type_id,
                package_id,
                price_paid,
                original_price,
                ticket_price,
                currency,
                status,
                ticket_status,
                payment_status,
                purchased_at,
                is_partner_ticket,
                created_at,
                updated_at
            ) VALUES (
                v_ticket_id,
                (v_ticket_record->>'attendeeId')::uuid,
                v_event_id,
                v_registration_id,
                (v_ticket_record->>'eventTicketId')::uuid,
                (v_ticket_record->>'eventTicketId')::uuid,
                CASE 
                    WHEN COALESCE((v_ticket_record->>'isPackage')::boolean, false) 
                    THEN (v_ticket_record->>'ticketDefinitionId')::uuid 
                    ELSE NULL 
                END,
                v_ticket_price,
                v_ticket_price,
                v_ticket_price,
                'AUD',
                'sold',
                'sold',
                CASE 
                    WHEN COALESCE((p_registration_data->>'paymentCompleted')::boolean, false) THEN 'Paid'
                    ELSE 'Unpaid'
                END,
                CURRENT_TIMESTAMP,
                COALESCE((v_ticket_record->>'isPartnerTicket')::boolean, false),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END IF;

    -- Return success result
    RETURN jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'customerId', v_customer_id,
        'bookingContactId', v_booking_contact_id,
        'confirmationNumber', v_confirmation_number
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Individual registration failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO anon;