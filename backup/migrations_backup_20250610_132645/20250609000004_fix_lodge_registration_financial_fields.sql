-- Fix lodge registration to properly handle financial fields
-- Simplified version: accept connected_account_id as parameter

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
  p_metadata jsonb DEFAULT NULL::jsonb,
  p_connected_account_id text DEFAULT NULL::text  -- NEW PARAMETER
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
  v_raw_data_id uuid;
  v_enhanced_registration_data jsonb;
BEGIN
  -- Validate input
  IF p_booking_contact IS NULL OR p_booking_contact->>'email' IS NULL THEN
    RAISE EXCEPTION 'Booking contact email is required';
  END IF;

  IF p_lodge_details IS NULL OR p_lodge_details->>'lodgeName' IS NULL THEN
    RAISE EXCEPTION 'Lodge name is required';
  END IF;

  -- Set registration ID
  v_registration_id := COALESCE(p_registration_id, gen_random_uuid());

  -- Log raw data for debugging with complete registration payload
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'raw_registrations') THEN
    
    -- Build comprehensive lodge registration data capture
    v_enhanced_registration_data := jsonb_build_object(
      'registrationId', v_registration_id,
      'functionId', p_function_id,
      'packageId', p_package_id,
      'tableCount', p_table_count,
      'bookingContact', p_booking_contact,
      'lodgeDetails', p_lodge_details,
      'paymentStatus', p_payment_status,
      'stripePaymentIntentId', p_stripe_payment_intent_id,
      'totalAmount', p_total_amount,
      'subtotal', p_subtotal,
      'stripeFee', p_stripe_fee,
      'connectedAccountId', p_connected_account_id,
      'metadata', p_metadata,
      'enhancedPricing', jsonb_build_object(
        'resolvedFromDatabase', true,
        'packagePriceResolver', 'v1.0',
        'totalAmount', p_total_amount,
        'subtotal', p_subtotal,
        'stripeFee', p_stripe_fee
      ),
      'zustandStoreState', COALESCE(p_metadata->'zustandStoreState', jsonb_build_object(
        'registrationStore', jsonb_build_object(
          'currentStep', 'payment',
          'completedSteps', jsonb_build_array('lodge-details', 'package-selection', 'billing-details', 'order-review'),
          'isValid', true
        ),
        'capturedAt', now(),
        'version', '2.0.0',
        'source', 'lodge_registration_rpc'
      )),
      'registrationType', 'lodge'
    );

    INSERT INTO raw_registrations (
      registration_id,
      registration_type,
      raw_data,
      processed
    ) VALUES (
      v_registration_id,
      'lodge',
      v_enhanced_registration_data,
      false
    ) RETURNING raw_id INTO v_raw_data_id;
  END IF;

  -- Check if this is a payment completion
  IF p_payment_status IN ('completed', 'paid') THEN
    -- Update existing registration for payment completion
    UPDATE registrations SET
      payment_status = 'completed',
      status = 'completed',
      stripe_payment_intent_id = p_stripe_payment_intent_id,
      total_amount_paid = p_total_amount,
      updated_at = CURRENT_TIMESTAMP
    WHERE registration_id = v_registration_id;
    
    -- Get confirmation number and connected account
    SELECT confirmation_number, connected_account_id 
    INTO v_confirmation_number, p_connected_account_id
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
      'customerId', v_customer_id,
      'connectedAccountId', p_connected_account_id
    );
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

  -- Create or update customer record with enhanced data
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
    COALESCE(p_booking_contact->>'mobile', p_booking_contact->>'mobileNumber', p_booking_contact->>'phone'),
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

  -- Create booking contact record (NOT an attendee - this is correct for lodges)
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
    title,
    dietary_requirements,
    special_needs,
    created_at,
    updated_at
  ) VALUES (
    v_booking_contact_id,
    'customer',  -- booking contact type
    p_booking_contact->>'firstName',
    p_booking_contact->>'lastName',
    p_booking_contact->>'email',
    COALESCE(p_booking_contact->>'mobile', p_booking_contact->>'mobileNumber', p_booking_contact->>'phone'),
    v_customer_id,
    p_booking_contact->>'email',
    COALESCE(p_booking_contact->>'mobile', p_booking_contact->>'mobileNumber', p_booking_contact->>'phone'),
    COALESCE(p_booking_contact->>'addressLine1', ''),
    COALESCE(p_booking_contact->>'suburb', p_booking_contact->>'city', ''),
    COALESCE(p_booking_contact->>'stateTerritory', p_booking_contact->>'state', ''),
    COALESCE(p_booking_contact->>'postcode', ''),
    COALESCE(p_booking_contact->>'country', 'Australia'),
    p_booking_contact->>'title',
    p_booking_contact->>'dietaryRequirements',
    p_booking_contact->>'additionalInfo',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
  
  -- For new registrations, DO NOT generate confirmation number
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

  -- Create or update registration with complete Zustand store data
  INSERT INTO registrations (
    registration_id,
    function_id,
    customer_id,
    auth_user_id,
    booking_contact_id,  -- Set to customer_id
    connected_account_id, -- From parameter
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
    includes_processing_fee,  -- Always true for lodge registrations
    created_at,
    updated_at,
    confirmation_number,
    registration_data
  ) VALUES (
    v_registration_id,
    p_function_id,
    v_customer_id,
    v_customer_id,
    v_customer_id,  -- booking_contact_id = customer_id
    p_connected_account_id,  -- From parameter
    v_organisation_id,
    v_organisation_name,
    v_organisation_number,
    jsonb_build_object(
      'firstName', p_booking_contact->>'firstName',
      'lastName', p_booking_contact->>'lastName',
      'email', p_booking_contact->>'email',
      'mobile', COALESCE(p_booking_contact->>'mobile', p_booking_contact->>'mobileNumber', p_booking_contact->>'phone'),
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
    p_stripe_fee,  -- Processing fees from frontend
    true,  -- includes_processing_fee always true
    now(),
    now(),
    v_confirmation_number,
    v_enhanced_registration_data
  )
  ON CONFLICT (registration_id) DO UPDATE SET
    function_id = EXCLUDED.function_id,
    booking_contact_id = EXCLUDED.booking_contact_id,  -- Ensure it's updated
    connected_account_id = EXCLUDED.connected_account_id,  -- Ensure it's updated
    organisation_id = EXCLUDED.organisation_id,
    organisation_name = EXCLUDED.organisation_name,
    organisation_number = EXCLUDED.organisation_number,
    primary_attendee = EXCLUDED.primary_attendee,
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
    registration_data = EXCLUDED.registration_data;

  -- Get event ID from package
  SELECT e.event_id INTO v_event_id
  FROM packages p
  JOIN events e ON p.function_id = e.function_id
  WHERE p.package_id = p_package_id
  LIMIT 1;

  -- Generate tickets based on package composition
  FOR v_event_ticket IN 
    SELECT 
      et.id as ticket_type_id,
      et.name as ticket_name,
      et.price,
      pc.quantity
    FROM package_composition pc
    JOIN event_tickets et ON pc.event_ticket_id = et.id
    WHERE pc.package_id = p_package_id
  LOOP
    FOR v_i IN 1..v_event_ticket.quantity * p_table_count LOOP
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
        v_event_ticket.ticket_type_id,
        'pending',
        v_event_ticket.price,
        now(),
        now()
      );
    END LOOP;
  END LOOP;

  -- Build the result
  v_result := jsonb_build_object(
    'success', true,
    'registrationId', v_registration_id,
    'customerId', v_customer_id,
    'connectedAccountId', p_connected_account_id,  -- Include in response
    'organisationId', v_organisation_id,
    'organisationName', v_organisation_name,
    'tableCount', p_table_count,
    'totalAttendees', v_total_attendees,
    'subtotal', p_subtotal,
    'stripeFee', p_stripe_fee,
    'totalAmount', p_total_amount
  );

  -- Mark raw data as processed
  IF v_raw_data_id IS NOT NULL THEN
    UPDATE raw_registrations SET processed = true WHERE raw_id = v_raw_data_id;
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE EXCEPTION 'Error in upsert_lodge_registration: % %', SQLERRM, SQLSTATE;
END;
$function$;