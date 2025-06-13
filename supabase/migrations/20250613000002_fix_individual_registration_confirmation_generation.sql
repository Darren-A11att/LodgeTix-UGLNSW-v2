-- Fix individual registration to generate confirmation numbers directly like lodge registration
-- This eliminates dependency on database triggers and Edge Function webhooks

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
  v_booking_contact_id uuid;
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
BEGIN
  -- Validate input
  IF p_booking_contact IS NULL OR p_booking_contact->>'email' IS NULL THEN
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
    -- Generate confirmation number if payment is completed
    -- Format: IND-123456 (matches relaxed constraint that allows hyphens)
    v_confirmation_number := 'IND-' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
    
    -- Update existing registration for payment completion
    UPDATE registrations SET
      payment_status = 'completed',
      status = 'completed',
      stripe_payment_intent_id = p_stripe_payment_intent_id,
      total_amount_paid = p_total_amount,
      confirmation_number = v_confirmation_number,
      confirmation_generated_at = now(),
      updated_at = CURRENT_TIMESTAMP
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

  -- Extract customer ID from auth context or booking contact
  v_customer_id := COALESCE(
    auth.uid(),
    (p_booking_contact->>'authUserId')::uuid
  );

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required';
  END IF;

  -- Determine status based on payment
  IF p_payment_status IN ('completed', 'paid') THEN
    v_status := 'completed';
    -- Generate confirmation number for completed payments
    v_confirmation_number := 'IND-' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
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
    p_booking_contact->>'firstName',
    p_booking_contact->>'lastName',
    p_booking_contact->>'email',
    p_booking_contact->>'phone',
    v_customer_id,
    now(),
    now()
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = now();

  -- Create booking contact
  v_booking_contact_id := v_customer_id;

  -- Insert registration record
  INSERT INTO registrations (
    registration_id,
    function_id,
    customer_id,
    booking_contact_id,
    attendee_count,
    registration_type,
    status,
    payment_status,
    total_amount_paid,
    subtotal,
    stripe_fee,
    includes_processing_fee,
    created_at,
    updated_at,
    confirmation_number,
    confirmation_generated_at,
    registration_data,
    primary_attendee,
    stripe_payment_intent_id
  ) VALUES (
    v_registration_id,
    p_function_id,
    v_customer_id,
    v_booking_contact_id,
    v_total_attendees,
    'individuals',
    v_status,
    p_payment_status::payment_status,
    CASE WHEN p_payment_status IN ('completed', 'paid') THEN p_total_amount ELSE 0 END,
    p_subtotal,
    p_stripe_fee,
    false,
    now(),
    now(),
    v_confirmation_number,
    CASE WHEN v_confirmation_number IS NOT NULL THEN now() ELSE NULL END,
    v_enhanced_registration_data,
    p_booking_contact->>'firstName' || ' ' || p_booking_contact->>'lastName',
    p_stripe_payment_intent_id
  )
  ON CONFLICT (registration_id) DO UPDATE SET
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    total_amount_paid = EXCLUDED.total_amount_paid,
    subtotal = EXCLUDED.subtotal,
    stripe_fee = EXCLUDED.stripe_fee,
    stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
    confirmation_number = EXCLUDED.confirmation_number,
    confirmation_generated_at = EXCLUDED.confirmation_generated_at,
    updated_at = now();

  -- Create attendee records
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
      phone,
      attendee_type,
      contact_preference,
      emergency_contact_name,
      emergency_contact_phone,
      dietary_requirements,
      accessibility_requirements,
      created_at,
      updated_at
    ) VALUES (
      v_contact_id,
      'attendee',
      v_attendee->>'firstName',
      v_attendee->>'lastName',
      v_attendee->>'email',
      v_attendee->>'phone',
      (v_attendee->>'attendeeType')::attendee_type,
      COALESCE((v_attendee->>'contactPreference')::attendee_contact_preference, 'directly'),
      v_attendee->>'emergencyContactName',
      v_attendee->>'emergencyContactPhone',
      v_attendee->>'dietaryRequirements',
      v_attendee->>'accessibilityRequirements',
      now(),
      now()
    );

    -- Create attendee record
    INSERT INTO attendees (
      attendee_id,
      registration_id,
      contact_id,
      attendee_type,
      contact_preference,
      created_at,
      updated_at
    ) VALUES (
      v_attendee_id,
      v_registration_id,
      v_contact_id,
      (v_attendee->>'attendeeType')::attendee_type,
      COALESCE((v_attendee->>'contactPreference')::attendee_contact_preference, 'directly'),
      now(),
      now()
    );
  END LOOP;

  -- Create ticket records for selected tickets
  FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_selected_tickets)
  LOOP
    -- Get event_id from event_tickets
    SELECT event_id INTO v_event_id
    FROM event_tickets 
    WHERE event_ticket_id = (v_ticket->>'ticketId')::uuid;
    
    IF v_event_id IS NULL THEN
      RAISE EXCEPTION 'Event ticket not found: %', v_ticket->>'ticketId';
    END IF;

    -- Create tickets for the quantity specified
    FOR i IN 1..(v_ticket->>'quantity')::integer LOOP
      INSERT INTO tickets (
        ticket_id,
        registration_id,
        event_id,
        event_ticket_id,
        status,
        ticket_status,
        price_paid,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_registration_id,
        v_event_id,
        (v_ticket->>'ticketId')::uuid,
        CASE WHEN p_payment_status IN ('completed', 'paid') THEN 'confirmed' ELSE 'reserved' END,
        CASE WHEN p_payment_status IN ('completed', 'paid') THEN 'confirmed' ELSE 'reserved' END,
        (v_ticket->>'price')::numeric,
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

  -- Add confirmation number to result if generated
  IF v_confirmation_number IS NOT NULL THEN
    v_result := v_result || jsonb_build_object('confirmationNumber', v_confirmation_number);
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Individual registration failed: %', SQLERRM;
END;
$function$;

-- Remove the database trigger since we're now generating confirmation numbers directly
DROP TRIGGER IF EXISTS trg_generate_confirmation_number ON registrations;
DROP TRIGGER IF EXISTS trg_generate_confirmation_number_insert ON registrations;
DROP TRIGGER IF EXISTS registration_payment_webhook_trigger ON registrations;

-- Clean up trigger functions that are no longer needed
DROP FUNCTION IF EXISTS trigger_generate_confirmation_number();
DROP FUNCTION IF EXISTS trigger_generate_confirmation_number_insert();
DROP FUNCTION IF EXISTS should_generate_confirmation();

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Fixed individual registration to generate confirmation numbers directly';
  RAISE NOTICE 'Format: IND-123456 (matches lodge registration pattern)';
  RAISE NOTICE 'Removed dependency on database triggers and Edge Function webhooks';
  RAISE NOTICE 'Individual registrations now work the same way as lodge registrations';
END $$;