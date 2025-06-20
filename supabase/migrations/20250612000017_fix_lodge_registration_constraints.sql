-- Fix upsert_lodge_registration ON CONFLICT constraints
-- The previous version had invalid ON CONFLICT clauses referencing non-existent constraints

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
  IF p_registration_id IS NULL THEN
    v_registration_id := gen_random_uuid();
  ELSE
    v_registration_id := p_registration_id;
  END IF;

  -- Get package price and calculate totals if not provided
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

  -- Create or get customer from booking contact
  -- ✅ FIX: Remove invalid ON CONFLICT on email since there's no unique constraint
  -- First check if customer exists
  SELECT customer_id INTO v_customer_id
  FROM customers 
  WHERE email = p_booking_contact->>'email'
  LIMIT 1;
  
  IF v_customer_id IS NULL THEN
    -- Insert new customer
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
      gen_random_uuid(),
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
    )
    RETURNING customer_id INTO v_customer_id;
  ELSE
    -- Update existing customer
    UPDATE customers SET
      first_name = p_booking_contact->>'firstName',
      last_name = p_booking_contact->>'lastName',
      phone = p_booking_contact->>'phone',
      business_name = p_booking_contact->>'businessName',
      billing_street_address = p_booking_contact->>'billingStreetAddress',
      billing_city = p_booking_contact->>'billingCity',
      billing_state = p_booking_contact->>'billingState',
      billing_postal_code = p_booking_contact->>'billingPostalCode',
      billing_country = p_booking_contact->>'billingCountry',
      updated_at = now()
    WHERE customer_id = v_customer_id;
  END IF;

  -- Get or create organisation
  -- ✅ FIX: Remove invalid ON CONFLICT on (name, organisation_number) since organisation_number doesn't exist
  -- First check if organisation exists by name only
  SELECT organisation_id, name INTO v_organisation_id, v_organisation_name
  FROM organisations 
  WHERE name = p_lodge_details->>'lodgeName'
  LIMIT 1;
  
  IF v_organisation_id IS NULL THEN
    -- Insert new organisation
    INSERT INTO organisations (
      organisation_id,
      name,
      type,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_lodge_details->>'lodgeName',
      'lodge',
      now(),
      now()
    )
    RETURNING organisation_id, name INTO v_organisation_id, v_organisation_name;
  ELSE
    -- Update existing organisation
    UPDATE organisations SET
      updated_at = now()
    WHERE organisation_id = v_organisation_id;
  END IF;
  
  -- Set organisation number from lodge details
  v_organisation_number := p_lodge_details->>'lodgeNumber';

  -- Calculate total attendees
  v_total_attendees := p_table_count * 10; -- Assuming 10 people per table

  -- Set status based on payment status
  IF p_payment_status = 'completed' THEN
    v_status := 'completed';
  ELSE
    v_status := 'pending';
  END IF;

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

  -- Create or update registration with registration_id as PK (this ON CONFLICT is valid)
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
    v_organisation_number,
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
  WHERE p.package_id = p_package_id  -- This is correct: table.column = parameter
  LIMIT 1;

  -- Create tickets for the package (simplified approach)
  FOR v_i IN 1..p_table_count LOOP
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

  -- Capture raw registration data for audit trail
  INSERT INTO raw_registrations (
    id,
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

  -- Build the result
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

  -- If payment completed, generate confirmation number
  IF p_payment_status = 'completed' THEN
    UPDATE registrations 
    SET confirmation_number = 'LDG' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') || 
        CHR(65 + (RANDOM() * 25)::INTEGER) || CHR(65 + (RANDOM() * 25)::INTEGER)
    WHERE registration_id = v_registration_id
    AND confirmation_number IS NULL
    RETURNING confirmation_number INTO v_confirmation_number;
    
    v_result := v_result || jsonb_build_object('confirmationNumber', v_confirmation_number);
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Lodge registration failed: %', SQLERRM;
END;
$function$;

-- Log the update
DO $$
BEGIN
  RAISE NOTICE 'Fixed upsert_lodge_registration function ON CONFLICT constraints';
  RAISE NOTICE 'Removed invalid ON CONFLICT (email) - no unique constraint exists on customers.email';
  RAISE NOTICE 'Removed invalid ON CONFLICT (name, organisation_number) - organisation_number column does not exist';
  RAISE NOTICE 'Kept valid ON CONFLICT (registration_id) - registration_id is the primary key';
  RAISE NOTICE 'Used manual check-and-insert/update pattern for customers and organisations';
END $$;