-- Fix event_tickets column reference in individual registration function
-- Use event_ticket_id instead of id

CREATE OR REPLACE FUNCTION public.upsert_individual_registration(
  p_function_id uuid,
  p_attendees jsonb,
  p_selected_tickets jsonb,
  p_booking_contact jsonb,
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
  v_confirmation_number text;
  v_total_attendees integer;
  v_result jsonb;
  v_attendee jsonb;
  v_attendee_id uuid;
  v_contact_id uuid;
  v_ticket jsonb;
  v_event_id uuid;
  v_ticket_type_id uuid;
  v_raw_data_id uuid;
  v_enhanced_registration_data jsonb;
  v_status text;
  v_booking_email text;
  v_booking_first_name text;
  v_booking_last_name text;
  v_booking_phone text;
  v_contact_preference text;
BEGIN
  -- Validate input
  IF p_booking_contact IS NULL THEN
    RAISE EXCEPTION 'Booking contact is required';
  END IF;

  -- Safely extract booking contact fields
  v_booking_email := COALESCE(
    p_booking_contact->>'email',
    p_booking_contact->>'emailAddress',
    ''
  );
  
  v_booking_first_name := COALESCE(
    p_booking_contact->>'firstName',
    p_booking_contact->>'first_name',
    ''
  );
  
  v_booking_last_name := COALESCE(
    p_booking_contact->>'lastName', 
    p_booking_contact->>'last_name',
    ''
  );
  
  v_booking_phone := COALESCE(
    p_booking_contact->>'mobile',
    p_booking_contact->>'mobileNumber',
    p_booking_contact->>'phone',
    ''
  );

  IF v_booking_email = '' THEN
    RAISE EXCEPTION 'Booking contact email is required';
  END IF;

  IF p_attendees IS NULL OR jsonb_array_length(p_attendees) = 0 THEN
    RAISE EXCEPTION 'At least one attendee is required';
  END IF;

  -- Set registration ID
  v_registration_id := COALESCE(p_registration_id, gen_random_uuid());

  -- Log raw data for debugging
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'raw_registrations') THEN
    
    -- Build comprehensive individual registration data capture
    v_enhanced_registration_data := jsonb_build_object(
      'registrationId', v_registration_id,
      'functionId', p_function_id,
      'attendees', p_attendees,
      'selectedTickets', p_selected_tickets,
      'bookingContact', p_booking_contact,
      'paymentStatus', p_payment_status,
      'stripePaymentIntentId', p_stripe_payment_intent_id,
      'totalAmount', p_total_amount,
      'subtotal', p_subtotal,
      'stripeFee', p_stripe_fee,
      'metadata', p_metadata,
      'registrationType', 'individuals'
    );

    INSERT INTO raw_registrations (
      registration_id,
      registration_type,
      raw_data,
      processed
    ) VALUES (
      v_registration_id,
      'individuals',
      v_enhanced_registration_data,
      false
    ) RETURNING raw_id INTO v_raw_data_id;
  END IF;

  -- Check if this is a payment completion
  IF p_payment_status IN ('completed', 'paid') THEN
    -- Update existing registration for payment completion
    UPDATE registrations SET
      payment_status = 'completed'::payment_status,
      status = 'completed',
      stripe_payment_intent_id = p_stripe_payment_intent_id,
      total_amount_paid = p_total_amount,
      updated_at = CURRENT_TIMESTAMP
    WHERE registration_id = v_registration_id;
    
    -- Get confirmation number
    SELECT confirmation_number 
    INTO v_confirmation_number
    FROM registrations
    WHERE registration_id = v_registration_id;
    
    -- Mark raw data as processed
    IF v_raw_data_id IS NOT NULL THEN
      UPDATE raw_registrations SET processed = true WHERE raw_id = v_raw_data_id;
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'registrationId', v_registration_id,
      'confirmationNumber', v_confirmation_number,
      'customerId', v_customer_id
    );
  END IF;

  -- Calculate total attendees
  v_total_attendees := jsonb_array_length(p_attendees);

  -- Extract customer ID from auth context
  v_customer_id := auth.uid();

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required - user must be authenticated';
  END IF;

  -- Determine status based on payment
  IF p_payment_status IN ('completed', 'paid') THEN
    v_status := 'completed';
  ELSE
    v_status := 'pending';
  END IF;

  -- Create or update customer record
  INSERT INTO customers (
    customer_id,
    customer_type,
    first_name,
    last_name,
    email,
    phone,
    auth_user_id,
    created_at,
    updated_at
  ) VALUES (
    v_customer_id,
    'person',
    v_booking_first_name,
    v_booking_last_name,
    v_booking_email,
    v_booking_phone,
    v_customer_id,
    now(),
    now()
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    auth_user_id = EXCLUDED.auth_user_id,
    updated_at = now();

  -- Create registration (matching production schema exactly)
  INSERT INTO registrations (
    registration_id,
    function_id,
    customer_id,
    auth_user_id,
    booking_contact_id,
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
    registration_data,
    primary_attendee,
    event_id,
    organisation_id,
    organisation_name,
    organisation_number,
    connected_account_id,
    platform_fee_amount,
    platform_fee_id,
    confirmation_pdf_url,
    confirmation_generated_at,
    primary_attendee_id
  ) VALUES (
    v_registration_id,
    p_function_id,
    v_customer_id,
    v_customer_id,
    v_customer_id, -- booking_contact_id references customers table
    v_total_attendees,
    'individuals'::registration_type,
    v_status,
    p_payment_status::payment_status,
    p_stripe_payment_intent_id,
    now(),
    true, -- agree_to_terms default
    p_total_amount,
    p_total_amount,
    p_subtotal,
    p_stripe_fee,
    true,
    now(),
    now(),
    NULL, -- Edge Function will generate confirmation number
    v_enhanced_registration_data,
    v_booking_first_name || ' ' || v_booking_last_name, -- primary_attendee as text
    NULL, -- event_id will be set when processing tickets
    NULL, -- organisation_id (for individuals)
    NULL, -- organisation_name (for individuals)
    NULL, -- organisation_number (for individuals) 
    NULL, -- connected_account_id (for individuals)
    NULL, -- platform_fee_amount
    NULL, -- platform_fee_id
    NULL, -- confirmation_pdf_url
    NULL, -- confirmation_generated_at
    NULL  -- primary_attendee_id (for individuals)
  )
  ON CONFLICT (registration_id) DO UPDATE SET
    function_id = EXCLUDED.function_id,
    booking_contact_id = EXCLUDED.booking_contact_id,
    attendee_count = EXCLUDED.attendee_count,
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
    agree_to_terms = EXCLUDED.agree_to_terms,
    total_amount_paid = EXCLUDED.total_amount_paid,
    total_price_paid = EXCLUDED.total_price_paid,
    subtotal = EXCLUDED.subtotal,
    stripe_fee = EXCLUDED.stripe_fee,
    includes_processing_fee = EXCLUDED.includes_processing_fee,
    updated_at = now(),
    registration_data = EXCLUDED.registration_data,
    primary_attendee = EXCLUDED.primary_attendee;

  -- Process attendees with case-insensitive contact_preference
  FOR v_attendee IN SELECT * FROM jsonb_array_elements(p_attendees)
  LOOP
    v_attendee_id := gen_random_uuid();
    
    -- Create contact for attendee
    v_contact_id := gen_random_uuid();
    
    INSERT INTO contacts (
      contact_id,
      type,
      first_name,
      last_name,
      email,
      mobile_number,
      title,
      dietary_requirements,
      special_needs,
      created_at,
      updated_at
    ) VALUES (
      v_contact_id,
      'attendee',
      COALESCE(v_attendee->>'firstName', ''),
      COALESCE(v_attendee->>'lastName', ''),
      COALESCE(v_attendee->>'email', ''),
      COALESCE(v_attendee->>'mobile', v_attendee->>'mobileNumber', ''),
      COALESCE(v_attendee->>'title', ''),
      COALESCE(v_attendee->>'dietaryRequirements', ''),
      COALESCE(v_attendee->>'additionalInfo', v_attendee->>'specialNeeds', ''),
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );

    -- Handle contact preference with case normalization
    v_contact_preference := LOWER(COALESCE(v_attendee->>'contactPreference', 'directly'));
    
    -- Ensure the value is valid for the enum (fallback to 'directly' if invalid)
    IF v_contact_preference NOT IN ('directly', 'primaryattendee', 'mason', 'guest', 'providelater') THEN
      v_contact_preference := 'directly';
    END IF;

    -- Create attendee record with normalized contact_preference
    INSERT INTO attendees (
      attendee_id,
      registration_id,
      contact_id,
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
      v_attendee_id,
      v_registration_id,
      v_contact_id,
      COALESCE(v_attendee->>'attendeeType', 'guest')::attendee_type,
      COALESCE((v_attendee->>'isPrimary')::boolean, false),
      COALESCE(v_attendee->>'firstName', ''),
      COALESCE(v_attendee->>'lastName', ''),
      COALESCE(v_attendee->>'title', ''),
      COALESCE(v_attendee->>'dietaryRequirements', ''),
      COALESCE(v_attendee->>'additionalInfo', v_attendee->>'specialNeeds', ''),
      v_contact_preference::attendee_contact_preference,
      COALESCE(v_attendee->>'email', ''),
      COALESCE(v_attendee->>'mobile', v_attendee->>'mobileNumber', ''),
      v_attendee,
      now(),
      now()
    );
  END LOOP;

  -- Process tickets with correct event_ticket_id column reference
  FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_selected_tickets)
  LOOP
    -- Get event ID from ticket type using correct column name
    SELECT et.event_id, et.event_ticket_id
    INTO v_event_id, v_ticket_type_id
    FROM event_tickets et
    WHERE et.event_ticket_id = (v_ticket->>'ticketTypeId')::uuid;

    -- Create tickets based on quantity
    FOR i IN 1..COALESCE((v_ticket->>'quantity')::integer, 1)
    LOOP
      INSERT INTO tickets (
        registration_id,
        event_id,
        ticket_type_id,
        status,
        price_paid,
        created_at,
        updated_at
      ) VALUES (
        v_registration_id,
        v_event_id,
        v_ticket_type_id,
        'pending',
        COALESCE((v_ticket->>'price')::numeric, 0),
        now(),
        now()
      );
    END LOOP;
  END LOOP;

  -- Mark raw data as processed
  IF v_raw_data_id IS NOT NULL THEN
    UPDATE raw_registrations SET processed = true WHERE raw_id = v_raw_data_id;
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'registrationId', v_registration_id,
    'customerId', v_customer_id,
    'totalAttendees', v_total_attendees,
    'subtotal', p_subtotal,
    'stripeFee', p_stripe_fee,
    'totalAmount', p_total_amount
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in upsert_individual_registration: % %', SQLERRM, SQLSTATE;
END;
$function$;