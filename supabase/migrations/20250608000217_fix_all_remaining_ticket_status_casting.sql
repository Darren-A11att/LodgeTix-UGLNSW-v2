-- Fix all remaining ticket_status enum casting errors
-- The tickets.status and tickets.ticket_status columns are varchar(50), not enum types
-- This migration removes all remaining ::ticket_status casts across all RPC functions

-- Fix upsert_individual_registration function (from multiple migration files)
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
    v_organisation_id uuid;
    v_status text;
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
        ) RETURNING raw_id INTO v_raw_data_id;
    END IF;
    
    -- Extract required fields
    v_customer_id := (p_registration_data->>'authUserId')::uuid;
    v_function_id := (p_registration_data->>'functionId')::uuid;
    
    -- Extract organisation_id from primary attendee if they are a Mason
    IF p_registration_data->'primaryAttendee' IS NOT NULL AND 
       LOWER(p_registration_data->'primaryAttendee'->>'attendeeType') = 'mason' THEN
        v_organisation_id := (p_registration_data->'primaryAttendee'->>'lodgeOrganisationId')::uuid;
    END IF;
    
    -- Validate required fields
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer ID (authUserId) is required';
    END IF;
    
    IF v_function_id IS NULL THEN
        RAISE EXCEPTION 'Function ID is required';
    END IF;
    
    -- Check if this is a payment completion
    IF (p_registration_data->>'paymentCompleted')::boolean = true THEN
        -- Extract status fields for payment completion
        v_payment_status := COALESCE(p_registration_data->>'paymentStatus', 'completed');
        v_status := COALESCE(p_registration_data->>'status', 'completed');
        
        -- Update existing registration for payment completion
        UPDATE registrations SET
            payment_status = v_payment_status::payment_status,
            status = v_status,
            stripe_payment_intent_id = p_registration_data->>'paymentIntentId',
            total_amount_paid = COALESCE((p_registration_data->>'totalAmountPaid')::decimal, total_amount_paid),
            updated_at = CURRENT_TIMESTAMP
        WHERE registration_id = v_registration_id
        AND auth_user_id = v_customer_id;
        
        -- Get confirmation number
        SELECT confirmation_number INTO v_confirmation_number
        FROM registrations
        WHERE registration_id = v_registration_id;
        
        -- Mark raw data as processed
        IF v_raw_data_id IS NOT NULL THEN
            UPDATE raw_registrations SET processed = true WHERE raw_id = v_raw_data_id;
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
        'individual'::contact_type,
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
    
    -- Upsert registration with organisation_id
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
        total_amount_paid,
        subtotal,
        stripe_fee,
        stripe_payment_intent_id,
        registration_data,
        organisation_id,
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
        v_organisation_id,
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
        organisation_id = COALESCE(EXCLUDED.organisation_id, registrations.organisation_id),
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
            v_attendee_type::attendee_type,
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
            v_contact_preference::attendee_contact_preference,
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
                v_attendee_type::attendee_type,
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
                v_contact_preference::attendee_contact_preference,
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
                'pending',  -- FIXED: Remove ::ticket_status cast
                'TKT-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0'),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END IF;
    
    -- Mark raw data as processed
    IF v_raw_data_id IS NOT NULL THEN
        UPDATE raw_registrations SET processed = true WHERE raw_id = v_raw_data_id;
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
            WHERE raw_id = v_raw_data_id;
        END IF;
        
        -- Re-raise the exception
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Fix upsert_lodge_registration function
CREATE OR REPLACE FUNCTION public.upsert_lodge_registration(
  p_function_id uuid,
  p_package_id uuid,
  p_table_count integer,
  p_booking_contact jsonb,
  p_lodge_details jsonb,
  p_payment_status text DEFAULT 'pending'::text,
  p_stripe_payment_intent_id text DEFAULT NULL::text,
  p_registration_id uuid DEFAULT NULL::uuid,
  p_total_amount numeric DEFAULT 0,
  p_subtotal numeric DEFAULT 0,
  p_stripe_fee numeric DEFAULT 0,
  p_metadata jsonb DEFAULT NULL::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_customer_id uuid;
  v_registration_id uuid;
  v_booking_contact_id uuid;
  v_confirmation_number text;
  v_organisation_id uuid;
  v_organisation_name text;
  v_organisation_number text;
  v_total_attendees integer;
  v_package_price numeric;
  v_result jsonb;
  v_event_ticket record;
  v_event_id uuid;
  v_ticket_count integer;
  v_i integer;
  v_status text;
BEGIN
  -- Validate input
  IF p_booking_contact IS NULL OR p_booking_contact->>'email' IS NULL THEN
    RAISE EXCEPTION 'Booking contact email is required';
  END IF;

  IF p_lodge_details IS NULL OR p_lodge_details->>'lodgeName' IS NULL THEN
    RAISE EXCEPTION 'Lodge name is required';
  END IF;

  -- Calculate total attendees based on table count
  v_total_attendees := p_table_count * 10;

  -- Get package price
  SELECT package_price INTO v_package_price
  FROM packages
  WHERE package_id = p_package_id;

  -- Extract customer ID from auth context or booking contact
  v_customer_id := COALESCE(
    auth.uid(),
    (p_booking_contact->>'authUserId')::uuid
  );

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required';
  END IF;

  -- Create or update customer record
  INSERT INTO customers (
    customer_id,
    customer_type,
    first_name,
    last_name,
    email,
    phone,
    business_name,
    business_number,
    created_at,
    updated_at
  ) VALUES (
    v_customer_id,
    'booking_contact',
    p_booking_contact->>'firstName',
    p_booking_contact->>'lastName',
    p_booking_contact->>'email',
    p_booking_contact->>'mobile',
    p_lodge_details->>'lodgeName',
    p_lodge_details->>'lodgeNumber',
    now(),
    now()
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    business_name = EXCLUDED.business_name,
    business_number = EXCLUDED.business_number,
    updated_at = now();

  -- Create booking contact if needed
  v_booking_contact_id := gen_random_uuid();

  -- Set registration ID and confirmation number
  v_registration_id := COALESCE(p_registration_id, gen_random_uuid());
  
  -- For lodge registrations, set confirmation_number to NULL initially
  -- Edge Function will generate it after payment completion
  v_confirmation_number := NULL;

  -- Extract organisation details - use organisation_id from lodge details
  v_organisation_id := COALESCE(
    (p_lodge_details->>'organisation_id')::uuid,
    (p_lodge_details->>'lodge_id')::uuid  -- Fallback for backward compatibility
  );
  v_organisation_name := p_lodge_details->>'lodgeName';
  v_organisation_number := p_lodge_details->>'lodgeNumber';

  -- Determine status based on payment
  IF p_payment_status IN ('completed', 'paid') THEN
    v_status := 'completed';
  ELSE
    v_status := 'pending';
  END IF;

  -- Create or update registration
  INSERT INTO registrations (
    registration_id,
    function_id,
    customer_id,
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
    created_at,
    updated_at,
    confirmation_number,
    registration_data
  ) VALUES (
    v_registration_id,
    p_function_id,
    v_customer_id,
    v_customer_id,
    v_organisation_id,
    v_organisation_name,
    v_organisation_number,
    jsonb_build_object(
      'firstName', p_booking_contact->>'firstName',
      'lastName', p_booking_contact->>'lastName',
      'email', p_booking_contact->>'email',
      'mobile', p_booking_contact->>'mobile',
      'dietaryRequirements', p_booking_contact->>'dietaryRequirements',
      'additionalInfo', p_booking_contact->>'additionalInfo'
    ),
    v_total_attendees,
    'lodge',
    v_status,
    p_payment_status,
    p_stripe_payment_intent_id,
    now(),
    COALESCE((p_booking_contact->>'agreeToTerms')::boolean, true),
    p_total_amount,
    p_total_amount,
    p_subtotal,
    p_stripe_fee,
    p_stripe_fee > 0,
    now(),
    now(),
    v_confirmation_number,
    jsonb_build_object(
      'bookingContact', p_booking_contact,
      'lodgeDetails', p_lodge_details,
      'packageId', p_package_id,
      'tableCount', p_table_count,
      'metadata', p_metadata
    )
  )
  ON CONFLICT (registration_id) DO UPDATE SET
    function_id = EXCLUDED.function_id,
    organisation_id = EXCLUDED.organisation_id,
    organisation_name = EXCLUDED.organisation_name,
    organisation_number = EXCLUDED.organisation_number,
    primary_attendee = EXCLUDED.primary_attendee,
    attendee_count = EXCLUDED.attendee_count,
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
    total_amount_paid = EXCLUDED.total_amount_paid,
    total_price_paid = EXCLUDED.total_price_paid,
    subtotal = EXCLUDED.subtotal,
    stripe_fee = EXCLUDED.stripe_fee,
    includes_processing_fee = EXCLUDED.includes_processing_fee,
    registration_data = EXCLUDED.registration_data,
    updated_at = now();

  -- Create tickets for lodge registrations based on package included_items
  IF p_payment_status IN ('completed', 'paid') THEN
    -- Get included items from package
    FOR v_event_ticket IN 
      SELECT 
        item.event_ticket_id,
        item.quantity,
        et.event_id,
        et.price
      FROM packages p
      CROSS JOIN LATERAL unnest(p.included_items) AS item
      JOIN event_tickets et ON et.event_ticket_id = item.event_ticket_id
      WHERE p.package_id = p_package_id
    LOOP
      -- Create tickets for each included item
      v_ticket_count := v_event_ticket.quantity * p_table_count;
      
      FOR v_i IN 1..v_ticket_count LOOP
        INSERT INTO tickets (
          ticket_id,
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
          gen_random_uuid(),
          NULL,  -- No attendee for lodge tickets
          v_registration_id,
          v_event_ticket.event_id,
          v_event_ticket.event_ticket_id,
          v_event_ticket.price,
          'sold',  -- FIXED: Remove ::ticket_status cast
          'LDG-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0'),
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        );
      END LOOP;
    END LOOP;
  END IF;

  -- Update payment status if needed
  IF p_payment_status IN ('completed', 'paid') THEN
    UPDATE registrations 
    SET 
      payment_status = 'completed',
      status = 'completed',
      updated_at = now()
    WHERE registration_id = v_registration_id;
  END IF;

  -- Count created tickets
  SELECT COUNT(*) INTO v_ticket_count
  FROM tickets
  WHERE registration_id = v_registration_id;

  -- Return result
  v_result := jsonb_build_object(
    'success', true,
    'registrationId', v_registration_id,
    'confirmationNumber', v_confirmation_number,
    'customerId', v_customer_id,
    'bookingContactId', v_booking_contact_id,
    'organisationName', v_organisation_name,
    'tableCount', p_table_count,
    'totalAttendees', v_total_attendees,
    'createdTickets', v_ticket_count
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in upsert_lodge_registration: %', SQLERRM;
END;
$function$;

-- Fix enhanced_lodge_registration function
CREATE OR REPLACE FUNCTION public.enhanced_lodge_registration(
    p_function_id uuid,
    p_customer_id uuid,
    p_registration_data jsonb
) RETURNS jsonb AS $$
DECLARE
    v_registration_id uuid;
    v_organisation_id uuid;
    v_i integer;
    v_ticket_count integer;
    v_package_id uuid;
    v_event_ticket record;
    v_confirmation_number text;
BEGIN
    -- Generate registration ID
    v_registration_id := gen_random_uuid();
    
    -- Extract organisation_id from lodge details
    v_organisation_id := (p_registration_data->'lodgeDetails'->>'organisation_id')::uuid;
    v_package_id := (p_registration_data->>'packageId')::uuid;
    
    -- Generate confirmation number for lodge registration
    v_confirmation_number := 'LDG-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
    
    -- Create registration record
    INSERT INTO registrations (
        registration_id,
        function_id,
        customer_id,
        auth_user_id,
        organisation_id,
        organisation_name,
        organisation_number,
        registration_type,
        confirmation_number,
        payment_status,
        total_amount_paid,
        subtotal,
        stripe_fee,
        registration_data,
        created_at,
        updated_at
    ) VALUES (
        v_registration_id,
        p_function_id,
        p_customer_id,
        p_customer_id,
        v_organisation_id,
        p_registration_data->'lodgeDetails'->>'lodgeName',
        p_registration_data->'lodgeDetails'->>'lodgeNumber',
        'lodge'::registration_type,
        v_confirmation_number,
        COALESCE(p_registration_data->>'paymentStatus', 'pending')::payment_status,
        COALESCE((p_registration_data->>'totalAmount')::decimal, 0),
        COALESCE((p_registration_data->>'subtotal')::decimal, 0),
        COALESCE((p_registration_data->>'stripeFee')::decimal, 0),
        p_registration_data,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Create placeholder tickets for the package (will be reserved until payment)
    FOR v_event_ticket IN 
        SELECT 
            item.event_ticket_id,
            item.quantity,
            et.event_id,
            et.price
        FROM packages p
        CROSS JOIN LATERAL unnest(p.included_items) AS item
        JOIN event_tickets et ON et.event_ticket_id = item.event_ticket_id
        WHERE p.package_id = v_package_id
    LOOP
        -- Create tickets for each included item
        v_ticket_count := v_event_ticket.quantity * COALESCE((p_registration_data->>'tableCount')::integer, 1);
        
        FOR v_i IN 1..v_ticket_count LOOP
            INSERT INTO tickets (
                ticket_id,
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
                gen_random_uuid(),
                NULL,  -- No specific attendee for lodge tickets
                v_registration_id,
                v_event_ticket.event_id,
                v_event_ticket.event_ticket_id,
                v_event_ticket.price,
                'reserved',  -- FIXED: Remove ::ticket_status cast
                'LDG-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0'),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END LOOP;
    
    -- Return the registration details
    RETURN jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'confirmationNumber', v_confirmation_number,
        'organisationId', v_organisation_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in enhanced_lodge_registration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix delegation registration function
CREATE OR REPLACE FUNCTION public.upsert_delegation_registration(
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
    v_masonic_profile_id uuid;
    v_attendee jsonb;
    v_ticket jsonb;
    v_confirmation_number text;
    v_result jsonb;
    v_payment_status text;
    v_attendee_type text;
    v_contact_preference text;
    v_attendee_email text;
    v_attendee_phone text;
    v_delegation_name text;
    v_delegation_type text;
    v_grand_lodge_id uuid;
    v_head_delegate_id uuid;
    v_masonic_data jsonb;
    v_masonic_profiles_created integer := 0;
    v_contacts_created integer := 0;
BEGIN
    -- Extract required fields
    v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
    v_customer_id := (p_registration_data->>'authUserId')::uuid;
    v_function_id := (p_registration_data->>'functionId')::uuid;
    
    -- Extract delegation details
    v_delegation_name := p_registration_data->'delegationDetails'->>'name';
    v_delegation_type := p_registration_data->'delegationDetails'->>'delegationType';
    v_grand_lodge_id := (p_registration_data->'delegationDetails'->>'grand_lodge_id')::uuid;
    
    -- Check if this is a payment completion
    IF (p_registration_data->>'paymentCompleted')::boolean = true THEN
        UPDATE registrations SET
            payment_status = 'completed'::payment_status,
            stripe_payment_intent_id = p_registration_data->>'paymentIntentId',
            total_amount_paid = COALESCE((p_registration_data->>'totalAmountPaid')::decimal, total_amount_paid),
            updated_at = CURRENT_TIMESTAMP
        WHERE registration_id = v_registration_id
        AND auth_user_id = v_customer_id;
        
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
    
    -- Create or update customer record
    INSERT INTO customers (
        customer_id,
        customer_type,
        first_name,
        last_name,
        email,
        phone,
        business_name,
        created_at,
        updated_at
    ) VALUES (
        v_customer_id,
        'booking_contact'::customer_type,
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
        v_delegation_name,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        business_name = EXCLUDED.business_name,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Generate confirmation number
    v_confirmation_number := 'DEL-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
    
    -- Create registration
    INSERT INTO registrations (
        registration_id,
        customer_id,
        auth_user_id,
        function_id,
        event_id,
        organisation_id,
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
        (p_registration_data->>'eventId')::uuid,
        v_grand_lodge_id,
        'delegation'::registration_type,
        v_confirmation_number,
        COALESCE(p_registration_data->>'paymentStatus', 'pending')::payment_status,
        COALESCE((p_registration_data->>'totalAmount')::decimal, 0),
        COALESCE((p_registration_data->>'subtotal')::decimal, 0),
        COALESCE((p_registration_data->>'stripeFee')::decimal, 0),
        p_registration_data->>'paymentIntentId',
        jsonb_build_object(
            'billingDetails', p_registration_data->'billingDetails',
            'delegationDetails', p_registration_data->'delegationDetails'
        ),
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
    
    -- Process delegates
    IF p_registration_data->'delegates' IS NOT NULL THEN
        FOR v_attendee IN SELECT * FROM jsonb_array_elements(p_registration_data->'delegates')
        LOOP
            v_attendee_id := gen_random_uuid();
            v_attendee_type := LOWER(COALESCE(v_attendee->>'attendeeType', 'mason'));
            v_contact_preference := LOWER(COALESCE(v_attendee->>'contactPreference', 'directly'));
            
            -- Extract masonic data if attendee is a Mason
            IF v_attendee_type = 'mason' THEN
                v_masonic_data := jsonb_build_object(
                    'lodgeOrganisationId', v_attendee->>'lodgeOrganisationId',
                    'grandLodgeOrganisationId', v_attendee->>'grandLodgeOrganisationId',
                    'masonicOrders', v_attendee->'masonicOrders'
                );
                
                -- Create masonic profile if one doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM masonic_profiles 
                    WHERE member_number = v_attendee->>'memberNumber'
                    AND lodge_organisation_id = (v_attendee->>'lodgeOrganisationId')::uuid
                ) THEN
                    v_masonic_profile_id := gen_random_uuid();
                    
                    INSERT INTO masonic_profiles (
                        masonic_profile_id,
                        member_number,
                        lodge_organisation_id,
                        grand_lodge_organisation_id,
                        current_office,
                        masonic_orders,
                        created_at,
                        updated_at
                    ) VALUES (
                        v_masonic_profile_id,
                        v_attendee->>'memberNumber',
                        (v_attendee->>'lodgeOrganisationId')::uuid,
                        (v_attendee->>'grandLodgeOrganisationId')::uuid,
                        v_attendee->>'currentOffice',
                        v_attendee->'masonicOrders',
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    );
                    
                    v_masonic_profiles_created := v_masonic_profiles_created + 1;
                END IF;
            END IF;
            
            -- Insert attendee
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
                v_attendee_id,
                v_registration_id,
                v_attendee_type::attendee_type,
                COALESCE((v_attendee->>'isPrimary')::boolean, false),
                v_attendee->>'firstName',
                v_attendee->>'lastName',
                v_attendee->>'title',
                v_attendee->>'suffix1',
                v_attendee->>'suffix2',
                v_attendee->>'suffix3',
                v_attendee->>'dietaryRequirements',
                v_attendee->>'specialNeeds',
                v_contact_preference::attendee_contact_preference,
                v_attendee->>'email',
                v_attendee->>'mobileNumber',
                v_attendee,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
            
            -- Create contact if needed
            IF v_contact_preference = 'directly' THEN
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
                    source_id,
                    source_type,
                    created_at,
                    updated_at
                ) VALUES (
                    v_contact_id,
                    'individual'::contact_type,
                    v_attendee->>'firstName',
                    v_attendee->>'lastName',
                    v_attendee->>'email',
                    v_attendee->>'mobileNumber',
                    v_attendee->>'title',
                    v_attendee->>'suffix1',
                    v_attendee->>'suffix2',
                    v_attendee->>'suffix3',
                    v_attendee->>'dietaryRequirements',
                    v_attendee->>'specialNeeds',
                    v_contact_preference::attendee_contact_preference,
                    v_attendee_id,
                    'attendee',
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                );
                
                v_contacts_created := v_contacts_created + 1;
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
                'reserved',  -- FIXED: Remove ::ticket_status cast
                'DEL-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0'),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END IF;
    
    -- Return result
    v_result := jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'customerId', v_customer_id,
        'confirmationNumber', v_confirmation_number,
        'masonicProfilesCreated', v_masonic_profiles_created,
        'contactsCreated', v_contacts_created
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in upsert_delegation_registration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Fix masonic registration function
CREATE OR REPLACE FUNCTION public.upsert_masonic_registration(
    p_registration_data jsonb
) RETURNS jsonb AS $$
DECLARE
    v_registration_id uuid;
    v_customer_id uuid;
    v_function_id uuid;
    v_attendee jsonb;
    v_ticket jsonb;
    v_confirmation_number text;
    v_result jsonb;
BEGIN
    -- Extract required fields
    v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
    v_customer_id := (p_registration_data->>'authUserId')::uuid;
    v_function_id := (p_registration_data->>'functionId')::uuid;
    
    -- Generate confirmation number
    v_confirmation_number := 'MAS-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
    
    -- Create registration
    INSERT INTO registrations (
        registration_id,
        customer_id,
        auth_user_id,
        function_id,
        event_id,
        registration_type,
        confirmation_number,
        payment_status,
        total_amount_paid,
        registration_data,
        created_at,
        updated_at
    ) VALUES (
        v_registration_id,
        v_customer_id,
        v_customer_id,
        v_function_id,
        (p_registration_data->>'eventId')::uuid,
        'groups'::registration_type,
        v_confirmation_number,
        COALESCE(p_registration_data->>'paymentStatus', 'pending')::payment_status,
        COALESCE((p_registration_data->>'totalAmount')::decimal, 0),
        p_registration_data,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
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
                'reserved',  -- FIXED: Remove ::ticket_status cast
                'MAS-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0'),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END IF;
    
    -- Return result
    v_result := jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'confirmationNumber', v_confirmation_number,
        'customerId', v_customer_id
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in upsert_masonic_registration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_lodge_registration(uuid, uuid, integer, jsonb, jsonb, text, text, uuid, numeric, numeric, numeric, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_lodge_registration(uuid, uuid, integer, jsonb, jsonb, text, text, uuid, numeric, numeric, numeric, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.enhanced_lodge_registration(uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enhanced_lodge_registration(uuid, uuid, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_delegation_registration(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_delegation_registration(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_masonic_registration(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_masonic_registration(jsonb) TO anon;