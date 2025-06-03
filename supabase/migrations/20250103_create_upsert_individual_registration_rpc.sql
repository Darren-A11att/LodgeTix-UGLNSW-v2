-- Create RPC function for upserting individual registrations
-- This function handles the complete individual registration flow including:
-- 1. Creating/updating contact and customer records
-- 2. Creating/updating registration
-- 3. Creating/updating attendees with relationships
-- 4. Creating tickets based on selected packages/tickets
-- 5. Handling payment status updates

CREATE OR REPLACE FUNCTION public.upsert_individual_registration(
    p_function_id UUID,
    p_attendees JSONB,
    p_selected_tickets JSONB, -- Array of {attendee_id, package_id/event_ticket_id, quantity}
    p_booking_contact JSONB,
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
    v_contact_id UUID;
    v_customer_id UUID;
    v_registration_id UUID;
    v_attendee_record JSONB;
    v_new_attendee_id UUID;
    v_attendee_mapping JSONB = '{}'; -- Maps provided IDs to actual IDs
    v_primary_attendee_id UUID;
    v_ticket_selection JSONB;
    v_created_tickets INTEGER = 0;
    v_result JSONB;
    v_auth_user_id UUID;
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
    
    IF p_attendees IS NULL OR jsonb_array_length(p_attendees) = 0 THEN
        RAISE EXCEPTION 'At least one attendee is required';
    END IF;
    
    -- Extract booking contact details and UPSERT contact
    INSERT INTO contacts (
        title,
        first_name,
        last_name,
        suffix,
        email,
        mobile_number,
        phone,
        address_line_1,
        address_line_2,
        suburb_city,
        state,
        postcode,
        country,
        business_name,
        dietary_requirements,
        special_needs
    ) VALUES (
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
        p_booking_contact->>'businessName',
        p_booking_contact->>'dietaryRequirements',
        p_booking_contact->>'additionalInfo'
    )
    ON CONFLICT (email) DO UPDATE SET
        title = EXCLUDED.title,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        suffix = EXCLUDED.suffix,
        mobile_number = EXCLUDED.mobile_number,
        phone = EXCLUDED.phone,
        address_line_1 = EXCLUDED.address_line_1,
        address_line_2 = EXCLUDED.address_line_2,
        suburb_city = EXCLUDED.suburb_city,
        state = EXCLUDED.state,
        postcode = EXCLUDED.postcode,
        country = EXCLUDED.country,
        business_name = EXCLUDED.business_name,
        dietary_requirements = EXCLUDED.dietary_requirements,
        special_needs = EXCLUDED.special_needs,
        updated_at = NOW()
    RETURNING contact_id INTO v_contact_id;
    
    -- UPSERT customer record (use auth user ID as customer ID)
    v_customer_id := v_auth_user_id;
    
    INSERT INTO customers (
        customer_id,
        contact_id,
        stripe_customer_id,
        metadata
    ) VALUES (
        v_customer_id,
        v_contact_id,
        NULL, -- Will be set later if needed
        jsonb_build_object(
            'registration_type', 'individual',
            'created_via', 'upsert_individual_registration'
        )
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        contact_id = EXCLUDED.contact_id,
        metadata = customers.metadata || EXCLUDED.metadata,
        updated_at = NOW();
    
    -- UPSERT registration
    IF p_registration_id IS NOT NULL THEN
        -- Update existing registration
        UPDATE registrations SET
            payment_status = p_payment_status,
            stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
            status = CASE 
                WHEN p_payment_status = 'paid' THEN 'confirmed'
                WHEN p_payment_status = 'failed' THEN 'cancelled'
                ELSE status
            END,
            total_amount_paid = p_total_amount,
            subtotal = p_subtotal,
            stripe_fee = p_stripe_fee,
            includes_processing_fee = p_stripe_fee > 0,
            updated_at = NOW()
        WHERE registration_id = p_registration_id
        RETURNING registration_id INTO v_registration_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Registration not found with ID: %', p_registration_id;
        END IF;
    ELSE
        -- Create new registration
        INSERT INTO registrations (
            function_id,
            customer_id,
            contact_id,
            registration_type,
            status,
            payment_status,
            stripe_payment_intent_id,
            registration_date,
            agree_to_terms,
            total_amount_paid,
            subtotal,
            stripe_fee,
            includes_processing_fee,
            registration_data,
            metadata
        ) VALUES (
            p_function_id,
            v_customer_id,
            v_contact_id,
            'individuals',
            'pending',
            p_payment_status,
            p_stripe_payment_intent_id,
            NOW(),
            true,
            p_total_amount,
            p_subtotal,
            p_stripe_fee,
            p_stripe_fee > 0,
            jsonb_build_object(
                'booking_contact', p_booking_contact,
                'attendees', p_attendees,
                'selected_tickets', p_selected_tickets
            ),
            p_metadata
        )
        RETURNING registration_id INTO v_registration_id;
    END IF;
    
    -- Process attendees only if this is a new registration
    IF p_registration_id IS NULL THEN
        FOR v_attendee_record IN SELECT * FROM jsonb_array_elements(p_attendees)
        LOOP
            -- Create attendee record
            INSERT INTO attendees (
                registration_id,
                attendee_type,
                title,
                first_name,
                last_name,
                suffix,
                email,
                phone,
                dietary_requirements,
                special_needs,
                contact_preference,
                is_primary,
                has_partner,
                relationship,
                grand_lodge_id,
                lodge_id,
                masonic_rank,
                is_grand_officer,
                grand_officer_role
            ) VALUES (
                v_registration_id,
                COALESCE(v_attendee_record->>'attendeeType', 'guest')::attendee_type,
                v_attendee_record->>'title',
                v_attendee_record->>'firstName',
                v_attendee_record->>'lastName',
                v_attendee_record->>'suffix',
                CASE 
                    WHEN v_attendee_record->>'contactPreference' = 'directly' 
                    THEN v_attendee_record->>'email'
                    ELSE NULL
                END,
                CASE 
                    WHEN v_attendee_record->>'contactPreference' = 'directly' 
                    THEN v_attendee_record->>'phone'
                    ELSE NULL
                END,
                v_attendee_record->>'dietaryRequirements',
                v_attendee_record->>'specialNeeds',
                COALESCE(v_attendee_record->>'contactPreference', 'directly')::attendee_contact_preference,
                COALESCE((v_attendee_record->>'isPrimary')::boolean, false),
                COALESCE((v_attendee_record->>'hasPartner')::boolean, false),
                v_attendee_record->>'relationship',
                (v_attendee_record->>'grand_lodge_id')::UUID,
                (v_attendee_record->>'lodge_id')::UUID,
                v_attendee_record->>'rank',
                COALESCE((v_attendee_record->>'isGrandOfficer')::boolean, false),
                v_attendee_record->>'grandOfficerRole'
            )
            RETURNING attendee_id INTO v_new_attendee_id;
            
            -- Store mapping of provided ID to actual ID
            v_attendee_mapping := v_attendee_mapping || 
                jsonb_build_object(
                    v_attendee_record->>'attendeeId', 
                    v_new_attendee_id::text
                );
            
            -- Track primary attendee
            IF COALESCE((v_attendee_record->>'isPrimary')::boolean, false) THEN
                v_primary_attendee_id := v_new_attendee_id;
            END IF;
        END LOOP;
        
        -- Update registration with primary attendee
        IF v_primary_attendee_id IS NOT NULL THEN
            UPDATE registrations
            SET primary_attendee_id = v_primary_attendee_id
            WHERE registration_id = v_registration_id;
        END IF;
        
        -- Process ticket selections and create tickets
        FOR v_ticket_selection IN SELECT * FROM jsonb_array_elements(p_selected_tickets)
        LOOP
            -- Get the actual attendee ID from mapping
            DECLARE
                v_mapped_attendee_id UUID;
                v_package_id UUID;
                v_event_ticket_id UUID;
                v_included_item RECORD;
                v_ticket_price NUMERIC;
                v_event_id UUID;
            BEGIN
                v_mapped_attendee_id := (v_attendee_mapping->>(v_ticket_selection->>'attendeeId'))::UUID;
                
                IF v_mapped_attendee_id IS NULL THEN
                    CONTINUE; -- Skip if attendee not found
                END IF;
                
                -- Check if it's a package or direct ticket
                v_package_id := (v_ticket_selection->>'packageId')::UUID;
                v_event_ticket_id := (v_ticket_selection->>'eventTicketId')::UUID;
                
                IF v_package_id IS NOT NULL THEN
                    -- Create tickets for each included item in the package
                    FOR v_included_item IN 
                        SELECT 
                            pi.*,
                            et.event_id,
                            et.price,
                            et.ticket_type,
                            p.price as package_price
                        FROM package_includes pi
                        JOIN event_tickets et ON et.event_ticket_id = pi.event_ticket_id
                        JOIN packages p ON p.package_id = pi.package_id
                        WHERE pi.package_id = v_package_id
                    LOOP
                        -- Use package price divided by number of events, or item price
                        v_ticket_price := v_included_item.price;
                        
                        INSERT INTO tickets (
                            registration_id,
                            event_id,
                            customer_id,
                            attendee_id,
                            ticket_type,
                            status,
                            price,
                            currency,
                            is_primary,
                            metadata
                        ) VALUES (
                            v_registration_id,
                            v_included_item.event_id,
                            v_customer_id,
                            v_mapped_attendee_id,
                            v_included_item.ticket_type,
                            CASE 
                                WHEN p_payment_status = 'paid' THEN 'confirmed'
                                ELSE 'reserved'
                            END,
                            v_ticket_price,
                            'AUD',
                            false,
                            jsonb_build_object(
                                'package_id', v_package_id,
                                'included_item_id', v_included_item.include_id,
                                'from_package', true
                            )
                        );
                        
                        v_created_tickets := v_created_tickets + 1;
                    END LOOP;
                    
                ELSIF v_event_ticket_id IS NOT NULL THEN
                    -- Create single ticket for direct event ticket purchase
                    SELECT et.event_id, et.price, et.ticket_type
                    INTO v_event_id, v_ticket_price, v_included_item.ticket_type
                    FROM event_tickets et
                    WHERE et.event_ticket_id = v_event_ticket_id;
                    
                    IF FOUND THEN
                        INSERT INTO tickets (
                            registration_id,
                            event_id,
                            customer_id,
                            attendee_id,
                            ticket_type,
                            status,
                            price,
                            currency,
                            is_primary,
                            metadata
                        ) VALUES (
                            v_registration_id,
                            v_event_id,
                            v_customer_id,
                            v_mapped_attendee_id,
                            v_included_item.ticket_type,
                            CASE 
                                WHEN p_payment_status = 'paid' THEN 'confirmed'
                                ELSE 'reserved'
                            END,
                            v_ticket_price,
                            'AUD',
                            false,
                            jsonb_build_object(
                                'event_ticket_id', v_event_ticket_id,
                                'from_package', false
                            )
                        );
                        
                        v_created_tickets := v_created_tickets + 1;
                    END IF;
                END IF;
            END;
        END LOOP;
    END IF;
    
    -- Build result
    SELECT jsonb_build_object(
        'registration_id', r.registration_id,
        'confirmation_number', r.confirmation_number,
        'customer_id', r.customer_id,
        'contact_id', r.contact_id,
        'status', r.status,
        'payment_status', r.payment_status,
        'total_attendees', (
            SELECT COUNT(*)
            FROM attendees a
            WHERE a.registration_id = r.registration_id
        ),
        'total_tickets', (
            SELECT COUNT(*)
            FROM tickets t
            WHERE t.registration_id = r.registration_id
        ),
        'created_tickets', v_created_tickets
    ) INTO v_result
    FROM registrations r
    WHERE r.registration_id = v_registration_id;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in upsert_individual_registration: % %', SQLERRM, SQLSTATE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.upsert_individual_registration IS 'Handles individual registration creation and updates including contact/customer creation, attendee management, and ticket generation based on selected packages or tickets';