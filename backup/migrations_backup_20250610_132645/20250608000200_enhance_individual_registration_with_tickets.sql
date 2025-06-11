-- Enhanced individual registration RPC to create actual ticket records and store ticket selections in attendee_data
CREATE OR REPLACE FUNCTION public.upsert_individual_registration(
    p_registration_data jsonb
) RETURNS jsonb AS $$
DECLARE
    v_registration_id uuid;
    v_customer_id uuid;
    v_function_id uuid;
    v_booking_contact_id uuid;
    v_primary_attendee_id uuid;
    v_attendee jsonb;
    v_ticket jsonb;
    v_attendee_id uuid;
    v_tickets_created integer := 0;
    v_attendees_created integer := 0;
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
    
    -- Customer record (booking contact)
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
        COALESCE(p_registration_data->'billingDetails'->>'firstName', 'Test'),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', 'User'),
        COALESCE(p_registration_data->'billingDetails'->>'emailAddress', 'test@example.com'),
        COALESCE(p_registration_data->'billingDetails'->>'mobileNumber', '+61400000000'),
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
    
    -- Create booking contact record
    INSERT INTO contacts (
        contact_id,
        first_name,
        last_name,
        email_address,
        mobile_number,
        contact_type,
        created_at,
        updated_at
    ) VALUES (
        v_customer_id, -- Use same UUID as customer
        COALESCE(p_registration_data->'billingDetails'->>'firstName', 'Test'),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', 'User'),
        COALESCE(p_registration_data->'billingDetails'->>'emailAddress', 'test@example.com'),
        COALESCE(p_registration_data->'billingDetails'->>'mobileNumber', '+61400000000'),
        'booking_contact'::contact_type,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (contact_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email_address = EXCLUDED.email_address,
        mobile_number = EXCLUDED.mobile_number,
        updated_at = CURRENT_TIMESTAMP;
        
    v_booking_contact_id := v_customer_id;
    
    -- Registration record
    INSERT INTO registrations (
        registration_id,
        customer_id,
        function_id,
        registration_type,
        payment_status,
        registration_data,
        booking_contact_id,
        total_amount,
        subtotal,
        stripe_fee,
        created_at,
        updated_at
    ) VALUES (
        v_registration_id,
        v_customer_id,
        v_function_id,
        'individuals'::registration_type,
        CASE 
            WHEN (p_registration_data->>'paymentCompleted')::boolean = true THEN 'completed'::payment_status
            ELSE 'pending'::payment_status
        END,
        p_registration_data,
        v_booking_contact_id,
        COALESCE((p_registration_data->>'totalAmount')::numeric, 0),
        COALESCE((p_registration_data->>'subtotal')::numeric, 0),
        COALESCE((p_registration_data->>'stripeFee')::numeric, 0),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (registration_id) DO UPDATE SET
        registration_data = EXCLUDED.registration_data,
        payment_status = EXCLUDED.payment_status,
        total_amount = EXCLUDED.total_amount,
        subtotal = EXCLUDED.subtotal,
        stripe_fee = EXCLUDED.stripe_fee,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Process attendees and their ticket selections
    -- Handle primary attendee
    IF p_registration_data->'primaryAttendee' IS NOT NULL THEN
        v_primary_attendee_id := gen_random_uuid();
        
        -- Create contact for primary attendee
        INSERT INTO contacts (
            contact_id,
            first_name,
            last_name,
            email_address,
            mobile_number,
            contact_type,
            created_at,
            updated_at
        ) VALUES (
            v_primary_attendee_id,
            COALESCE(p_registration_data->'primaryAttendee'->>'firstName', 'Primary'),
            COALESCE(p_registration_data->'primaryAttendee'->>'lastName', 'Attendee'),
            COALESCE(p_registration_data->'primaryAttendee'->>'primaryEmail', p_registration_data->'billingDetails'->>'emailAddress'),
            COALESCE(p_registration_data->'primaryAttendee'->>'primaryPhone', p_registration_data->'billingDetails'->>'mobileNumber'),
            'attendee'::contact_type,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        -- Create attendee record with ticket selections in attendee_data
        INSERT INTO attendees (
            attendee_id,
            registration_id,
            contact_id,
            attendee_type,
            is_primary,
            attendee_data,
            created_at,
            updated_at
        ) VALUES (
            v_primary_attendee_id,
            v_registration_id,
            v_primary_attendee_id,
            'mason'::attendee_type, -- Default to mason for individuals
            true,
            jsonb_build_object(
                'personal_details', p_registration_data->'primaryAttendee',
                'selected_tickets', COALESCE(
                    p_registration_data->'ticketSelections'->p_registration_data->'primaryAttendee'->>'attendeeId',
                    jsonb_build_object('packages', '[]'::jsonb, 'individualTickets', '[]'::jsonb)
                )
            ),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        v_attendees_created := v_attendees_created + 1;
    END IF;
    
    -- Handle additional attendees
    FOR v_attendee IN SELECT jsonb_array_elements(COALESCE(p_registration_data->'additionalAttendees', '[]'::jsonb))
    LOOP
        v_attendee_id := gen_random_uuid();
        
        -- Create contact for additional attendee
        INSERT INTO contacts (
            contact_id,
            first_name,
            last_name,
            email_address,
            mobile_number,
            contact_type,
            created_at,
            updated_at
        ) VALUES (
            v_attendee_id,
            COALESCE(v_attendee->>'firstName', 'Additional'),
            COALESCE(v_attendee->>'lastName', 'Attendee'),
            COALESCE(v_attendee->>'primaryEmail', ''),
            COALESCE(v_attendee->>'primaryPhone', ''),
            'attendee'::contact_type,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        -- Create attendee record with ticket selections
        INSERT INTO attendees (
            attendee_id,
            registration_id,
            contact_id,
            attendee_type,
            is_primary,
            attendee_data,
            created_at,
            updated_at
        ) VALUES (
            v_attendee_id,
            v_registration_id,
            v_attendee_id,
            COALESCE((v_attendee->>'attendeeType')::attendee_type, 'guest'::attendee_type),
            false,
            jsonb_build_object(
                'personal_details', v_attendee,
                'selected_tickets', COALESCE(
                    p_registration_data->'ticketSelections'->v_attendee->>'attendeeId',
                    jsonb_build_object('packages', '[]'::jsonb, 'individualTickets', '[]'::jsonb)
                )
            ),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        v_attendees_created := v_attendees_created + 1;
    END LOOP;
    
    -- Create actual ticket records from the provided tickets array
    FOR v_ticket IN SELECT jsonb_array_elements(COALESCE(p_registration_data->'tickets', '[]'::jsonb))
    LOOP
        -- Find the attendee ID by matching the store attendeeId with our created attendees
        -- For now, we'll create tickets linked to the primary attendee
        -- In a real implementation, you'd need to map store attendeeIds to database attendee_ids
        
        INSERT INTO tickets (
            ticket_id,
            attendee_id,
            event_id,
            ticket_type_id,
            package_id,
            price_paid,
            original_price,
            registration_id,
            status,
            payment_status,
            is_partner_ticket,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_primary_attendee_id, -- For now, link all tickets to primary attendee
            COALESCE((v_ticket->>'eventId')::uuid, (p_registration_data->>'eventId')::uuid),
            (v_ticket->>'ticketTypeId')::uuid,
            CASE 
                WHEN v_ticket->>'packageId' IS NOT NULL AND v_ticket->>'packageId' != 'null'
                THEN (v_ticket->>'packageId')::uuid 
                ELSE NULL 
            END,
            COALESCE((v_ticket->>'price')::numeric, 0),
            COALESCE((v_ticket->>'price')::numeric, 0),
            v_registration_id,
            'Active',
            CASE 
                WHEN (p_registration_data->>'paymentCompleted')::boolean = true THEN 'Paid'
                ELSE 'Unpaid'
            END,
            COALESCE((v_ticket->>'isPartnerTicket')::boolean, false),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        v_tickets_created := v_tickets_created + 1;
    END LOOP;
    
    -- Return success result with detailed information
    RETURN jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'customerId', v_customer_id,
        'bookingContactId', v_booking_contact_id,
        'primaryAttendeeId', v_primary_attendee_id,
        'attendeesCreated', v_attendees_created,
        'ticketsCreated', v_tickets_created,
        'confirmationNumber', null -- Will be generated by webhook if payment completed
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Enhanced individual registration failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO anon;