-- Fix lodge registration function to set status to 'completed' instead of 'confirmed'
-- This matches what the confirmation page expects

CREATE OR REPLACE FUNCTION upsert_lodge_registration(
  p_function_id UUID,
  p_package_id UUID,
  p_table_count INTEGER,
  p_booking_contact JSONB,
  p_lodge_details JSONB,
  p_payment_status TEXT DEFAULT 'pending',
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_registration_id UUID DEFAULT NULL,
  p_total_amount DECIMAL DEFAULT NULL,
  p_total_price_paid DECIMAL DEFAULT NULL,
  p_platform_fee_amount DECIMAL DEFAULT NULL,
  p_stripe_fee DECIMAL DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_connected_account_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  registration_id UUID,
  customer_id UUID,
  organisation_id UUID,
  confirmation_number TEXT,
  total_attendees INTEGER,
  created_tickets INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registration_id UUID;
  v_customer_id UUID;
  v_organisation_id UUID;
  v_total_attendees INTEGER;
  v_confirmation_number TEXT;
  v_organisation_name TEXT;
  v_status TEXT;
  v_enhanced_registration_data JSONB;
  v_package_name TEXT;
  v_created_tickets INTEGER := 0;
  v_existing_registration_id UUID;
  v_event_id UUID;
  v_event_ticket_id UUID;
BEGIN
  -- Generate registration ID if not provided
  v_registration_id := COALESCE(p_registration_id, gen_random_uuid());
  
  -- Calculate total attendees (assuming 10 attendees per table)
  v_total_attendees := p_table_count * 10;
  
  -- Determine status based on payment - use 'completed' to match confirmation page expectations
  IF p_payment_status = 'completed' THEN
    v_status := 'completed';
  ELSE
    v_status := 'pending';
  END IF;

  -- Create customer (always create new customer for lodge registrations to avoid conflicts)
  INSERT INTO customers (
    customer_id,
    first_name,
    last_name,
    email,
    phone,
    business_name,
    address_line1,
    city,
    state,
    postal_code,
    country,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_booking_contact->>'firstName',
    p_booking_contact->>'lastName',
    p_booking_contact->>'email',
    p_booking_contact->>'mobile',
    p_lodge_details->>'lodgeName',
    p_booking_contact->>'addressLine1',
    p_booking_contact->>'suburb',
    p_booking_contact->>'stateTerritory',
    p_booking_contact->>'postcode',
    p_booking_contact->>'country',
    now(),
    now()
  )
  RETURNING customers.customer_id INTO v_customer_id;

  -- Create organisation (simplified - just insert the lodge as an organisation)
  v_organisation_name := p_lodge_details->>'lodgeName';
  
  INSERT INTO organisations (
    name,
    type,
    created_at,
    updated_at
  ) VALUES (
    v_organisation_name,
    'lodge',
    now(),
    now()
  )
  RETURNING organisations.organisation_id INTO v_organisation_id;

  -- Get package name for registration data (using explicit table alias)
  SELECT pkg.name INTO v_package_name
  FROM packages pkg
  WHERE pkg.package_id = p_package_id;

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

  -- Check if registration already exists to avoid ON CONFLICT ambiguity
  SELECT reg.registration_id INTO v_existing_registration_id
  FROM registrations reg
  WHERE reg.registration_id = v_registration_id;

  IF v_existing_registration_id IS NOT NULL THEN
    -- Update existing registration
    UPDATE registrations 
    SET 
      status = v_status,
      payment_status = p_payment_status::payment_status,
      total_amount_paid = p_total_amount,
      total_price_paid = p_total_price_paid,
      platform_fee_amount = p_platform_fee_amount,
      stripe_fee = p_stripe_fee,
      stripe_payment_intent_id = p_stripe_payment_intent_id,
      registration_data = v_enhanced_registration_data,
      attendee_count = v_total_attendees,
      connected_account_id = p_connected_account_id,
      registration_date = now(),
      updated_at = now()
    WHERE registrations.registration_id = v_registration_id;
  ELSE
    -- Create new registration
    INSERT INTO registrations (
      registration_id,
      customer_id,
      function_id,
      organisation_id,
      registration_type,
      status,
      payment_status,
      total_amount_paid,
      total_price_paid,
      platform_fee_amount,
      stripe_fee,
      stripe_payment_intent_id,
      registration_data,
      attendee_count,
      organisation_name,
      organisation_number,
      connected_account_id,
      booking_contact_id,
      agree_to_terms,
      registration_date,
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
      p_total_price_paid,
      p_platform_fee_amount,
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
      now(),
      now()
    );
  END IF;

  -- Generate confirmation number if status is completed and doesn't exist
  IF v_status = 'completed' THEN
    -- Check if confirmation number already exists with explicit table alias
    SELECT reg.confirmation_number INTO v_confirmation_number  
    FROM registrations reg
    WHERE reg.registration_id = v_registration_id;
    
    -- If no confirmation number exists, generate one
    IF v_confirmation_number IS NULL OR v_confirmation_number = '' THEN
      -- Generate lodge confirmation number matching individual format: LDG-123456AB
      -- Format: LDG-[6 digits][2 letters] (with hyphen to match individual registration)
      v_confirmation_number := 'LDG-' || 
                               LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') ||
                               CHR(65 + (RANDOM() * 25)::INTEGER) ||
                               CHR(65 + (RANDOM() * 25)::INTEGER);
      
      -- Update with explicit table name to avoid ambiguity
      UPDATE registrations 
      SET confirmation_number = v_confirmation_number,
          updated_at = now()
      WHERE registrations.registration_id = v_registration_id;
    END IF;
  END IF;

  -- For lodge registrations, create package tickets using event_tickets
  IF p_package_id IS NOT NULL THEN
    -- Get the first event and event_ticket from the package
    SELECT e.event_id, et.event_ticket_id 
    INTO v_event_id, v_event_ticket_id
    FROM packages pkg
    JOIN events e ON e.function_id = pkg.function_id
    JOIN event_tickets et ON et.event_id = e.event_id
    WHERE pkg.package_id = p_package_id
    LIMIT 1;

    -- Only create tickets if we found an event and event_ticket
    IF v_event_id IS NOT NULL AND v_event_ticket_id IS NOT NULL THEN
      INSERT INTO tickets (
        ticket_id,
        registration_id,
        package_id,
        event_id,
        event_ticket_id,
        ticket_price,
        price_paid,
        status,
        ticket_status,
        attendee_id,
        created_at,
        updated_at
      )
      SELECT 
        gen_random_uuid(),
        v_registration_id,
        p_package_id,
        v_event_id,
        v_event_ticket_id,
        p_total_price_paid / p_table_count,
        p_total_price_paid / p_table_count,
        CASE WHEN p_payment_status = 'completed' THEN 'sold' ELSE 'reserved' END,
        CASE WHEN p_payment_status = 'completed' THEN 'confirmed' ELSE 'reserved' END,
        NULL,
        now(),
        now()
      FROM generate_series(1, p_table_count);
      
      v_created_tickets := p_table_count;
    ELSE
      -- Log warning if no event/event_ticket found
      RAISE WARNING 'No event or event_ticket found for package_id: %', p_package_id;
    END IF;
  END IF;

  -- Return registration details using variables only (no column references)
  RETURN QUERY SELECT 
    v_registration_id,
    v_customer_id,
    v_organisation_id,
    v_confirmation_number,
    v_total_attendees,
    v_created_tickets;
END;
$$;

-- Log what we did
DO $$
BEGIN
  RAISE NOTICE 'Fixed lodge registration function to set status to "completed" instead of "confirmed"';
  RAISE NOTICE 'This matches the expectation of the confirmation page';
  RAISE NOTICE 'Lodge registrations with completed payments will now have status = "completed"';
END $$;