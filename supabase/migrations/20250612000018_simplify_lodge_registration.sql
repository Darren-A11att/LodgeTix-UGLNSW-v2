-- Simplify lodge registration to avoid any potential infinite loops or issues
-- Focus on core functionality and reduce complexity

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
  p_connected_account_id text DEFAULT NULL::text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_customer_id uuid;
  v_registration_id uuid;
  v_organisation_id uuid;
  v_organisation_name text;
  v_total_attendees integer;
  v_package_price numeric;
  v_result jsonb;
  v_event_id uuid;
  v_status text;
  v_enhanced_registration_data jsonb;
BEGIN
  -- Input validation
  IF p_booking_contact IS NULL OR p_booking_contact->>'email' IS NULL THEN
    RAISE EXCEPTION 'Booking contact email is required';
  END IF;

  IF p_lodge_details IS NULL OR p_lodge_details->>'lodgeName' IS NULL THEN
    RAISE EXCEPTION 'Lodge name is required';
  END IF;

  -- Set registration ID
  v_registration_id := COALESCE(p_registration_id, gen_random_uuid());

  -- Get package price
  SELECT package_price INTO v_package_price
  FROM packages 
  WHERE package_id = p_package_id;
  
  IF v_package_price IS NULL THEN
    RAISE EXCEPTION 'Package not found: %', p_package_id;
  END IF;

  -- Calculate totals if not provided
  IF p_total_amount = 0 THEN
    p_total_amount := (v_package_price * p_table_count) + COALESCE(p_stripe_fee, 0);
  END IF;
  
  IF p_subtotal = 0 THEN
    p_subtotal := v_package_price * p_table_count;
  END IF;

  -- Always create new customer for each registration to avoid conflicts
  v_customer_id := gen_random_uuid();
  INSERT INTO customers (
    customer_id,
    first_name,
    last_name,
    email,
    phone,
    business_name,
    billing_street_address,
    billing_city,
    billing_state,
    billing_postal_code,
    billing_country,
    created_at,
    updated_at
  ) VALUES (
    v_customer_id,
    p_booking_contact->>'firstName',
    p_booking_contact->>'lastName', 
    p_booking_contact->>'email',
    p_booking_contact->>'phone',
    p_booking_contact->>'businessName',
    p_booking_contact->>'billingStreetAddress',
    p_booking_contact->>'billingCity',
    p_booking_contact->>'billingState',
    p_booking_contact->>'billingPostalCode',
    p_booking_contact->>'billingCountry',
    now(),
    now()
  );

  -- Always create new organisation for each registration to avoid conflicts
  v_organisation_id := gen_random_uuid();
  v_organisation_name := p_lodge_details->>'lodgeName';
  INSERT INTO organisations (
    organisation_id,
    name,
    type,
    created_at,
    updated_at
  ) VALUES (
    v_organisation_id,
    v_organisation_name,
    'lodge',
    now(),
    now()
  );

  -- Calculate total attendees
  v_total_attendees := p_table_count * 10;

  -- Set status
  v_status := CASE WHEN p_payment_status = 'completed' THEN 'completed' ELSE 'pending' END;

  -- Enhanced registration data
  v_enhanced_registration_data := jsonb_build_object(
    'tableCount', p_table_count,
    'packageId', p_package_id,
    'functionId', p_function_id,
    'lodgeDetails', p_lodge_details,
    'bookingContact', p_booking_contact,
    'totalAttendees', v_total_attendees,
    'metadata', p_metadata
  );

  -- Create or update registration
  INSERT INTO registrations (
    registration_id,
    customer_id,
    function_id,
    organisation_id,
    registration_type,
    status,
    payment_status,
    total_amount_paid,
    subtotal,
    stripe_fee,
    stripe_payment_intent_id,
    registration_data,
    attendee_count,
    organisation_name,
    organisation_number,
    connected_account_id,
    booking_contact_id,
    agree_to_terms,
    created_at,
    updated_at
  ) VALUES (
    v_registration_id,
    v_customer_id,
    p_function_id,
    v_organisation_id,
    'lodge',
    v_status,
    p_payment_status::payment_status,
    p_total_amount,
    p_subtotal,
    p_stripe_fee,
    p_stripe_payment_intent_id,
    v_enhanced_registration_data,
    v_total_attendees,
    v_organisation_name,
    p_lodge_details->>'lodgeNumber',
    p_connected_account_id,
    v_customer_id,
    true,
    now(),
    now()
  )
  ON CONFLICT (registration_id) DO UPDATE SET
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    total_amount_paid = EXCLUDED.total_amount_paid,
    subtotal = EXCLUDED.subtotal,
    stripe_fee = EXCLUDED.stripe_fee,
    stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
    registration_data = EXCLUDED.registration_data,
    connected_account_id = EXCLUDED.connected_account_id,
    updated_at = now();

  -- Get event ID for ticket creation
  SELECT e.event_id INTO v_event_id
  FROM packages p
  JOIN events e ON p.function_id = e.function_id
  WHERE p.package_id = p_package_id
  LIMIT 1;

  -- Create tickets for the package
  IF v_event_id IS NOT NULL THEN
    FOR i IN 1..p_table_count LOOP
      INSERT INTO tickets (
        ticket_id,
        registration_id,
        event_id,
        package_id,
        status,
        ticket_status,
        price_paid,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_registration_id,
        v_event_id,
        p_package_id,
        'reserved',
        'reserved',
        v_package_price,
        now(),
        now()
      );
    END LOOP;
  END IF;

  -- Capture raw registration data
  INSERT INTO raw_registrations (
    raw_id,
    registration_id,
    raw_data,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_registration_id,
    jsonb_build_object(
      'functionId', p_function_id,
      'packageId', p_package_id,
      'tableCount', p_table_count,
      'bookingContact', p_booking_contact,
      'lodgeDetails', p_lodge_details,
      'paymentStatus', p_payment_status,
      'totalAmount', p_total_amount,
      'subtotal', p_subtotal,
      'stripeFee', p_stripe_fee,
      'connectedAccountId', p_connected_account_id,
      'metadata', p_metadata
    ),
    now()
  );

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'registrationId', v_registration_id,
    'customerId', v_customer_id,
    'connectedAccountId', p_connected_account_id,
    'organisationId', v_organisation_id,
    'organisationName', v_organisation_name,
    'tableCount', p_table_count,
    'totalAttendees', v_total_attendees,
    'subtotal', p_subtotal,
    'stripeFee', p_stripe_fee,
    'totalAmount', p_total_amount
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Lodge registration failed: %', SQLERRM;
END;
$function$;

-- Log the update
DO $$
BEGIN
  RAISE NOTICE 'Simplified lodge registration function to avoid conflicts';
  RAISE NOTICE 'Always creates new customer and organisation records';
  RAISE NOTICE 'Removed complex lookup and update logic that could cause issues';
END $$;