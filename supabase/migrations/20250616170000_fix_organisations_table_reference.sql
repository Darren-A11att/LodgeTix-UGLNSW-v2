-- Fix lodge registration to work with actual organisations table structure
-- The organisations table doesn't have organisation_number column

CREATE OR REPLACE FUNCTION upsert_lodge_registration(
  p_registration_id UUID DEFAULT NULL,
  p_function_id UUID DEFAULT NULL,
  p_package_id UUID DEFAULT NULL,
  p_table_count INTEGER DEFAULT NULL,
  p_lodge_details JSONB DEFAULT NULL,
  p_booking_contact JSONB DEFAULT NULL,
  p_total_amount DECIMAL DEFAULT NULL,           -- Total charged to customer (including all fees)
  p_total_price_paid DECIMAL DEFAULT NULL,       -- Subtotal (amount without fees)
  p_platform_fee_amount DECIMAL DEFAULT NULL,    -- Platform commission
  p_stripe_fee DECIMAL DEFAULT NULL,             -- Actual Stripe processing fee only
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_payment_status TEXT DEFAULT 'pending',
  p_connected_account_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
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
BEGIN
  -- Generate registration ID if not provided
  v_registration_id := COALESCE(p_registration_id, gen_random_uuid());
  
  -- Calculate total attendees (assuming 10 attendees per table)
  v_total_attendees := p_table_count * 10;
  
  -- Determine status based on payment
  IF p_payment_status = 'completed' THEN
    v_status := 'confirmed';
  ELSE
    v_status := 'pending';
  END IF;

  -- Create customer (always create new customer for lodge registrations to avoid conflicts)
  INSERT INTO customers (
    customer_id,
    first_name,
    last_name,
    email,
    phone,                    -- Correct column name
    business_name,
    address_line1,            -- Correct column name
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
  RETURNING customers.customer_id INTO v_customer_id;  -- Explicitly qualify column name

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
  RETURNING organisations.organisation_id INTO v_organisation_id;  -- Explicitly qualify column name

  -- Get package name for registration data
  SELECT packages.name INTO v_package_name  -- Explicitly qualify column name
  FROM packages 
  WHERE packages.package_id = p_package_id;

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

  -- Create or update registration with explicit column references to avoid ambiguity
  INSERT INTO registrations (
    registration_id,
    customer_id,
    function_id,
    organisation_id,
    registration_type,
    status,
    payment_status,
    total_amount_paid,      -- What customer actually paid (total charge)
    total_price_paid,       -- Subtotal without fees
    platform_fee_amount,    -- Platform commission
    stripe_fee,             -- Stripe processing fee only
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
    p_total_amount,         -- Total charged to customer
    p_total_price_paid,     -- Subtotal (amount without fees)
    p_platform_fee_amount, -- Platform commission
    p_stripe_fee,           -- Stripe fee only
    p_stripe_payment_intent_id,
    v_enhanced_registration_data,
    v_total_attendees,
    v_organisation_name,
    p_lodge_details->>'lodgeNumber',
    p_connected_account_id,
    v_customer_id,          -- booking_contact_id references the customer we just created
    true,
    now(),
    now(),
    now()
  )
  ON CONFLICT (registration_id) DO UPDATE SET
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    total_amount_paid = EXCLUDED.total_amount_paid,
    total_price_paid = EXCLUDED.total_price_paid,
    platform_fee_amount = EXCLUDED.platform_fee_amount,
    stripe_fee = EXCLUDED.stripe_fee,
    stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
    registration_data = EXCLUDED.registration_data,
    attendee_count = EXCLUDED.attendee_count,
    connected_account_id = EXCLUDED.connected_account_id,
    registration_date = now(),
    updated_at = now();

  -- Generate confirmation number if status is confirmed and doesn't exist
  IF v_status = 'confirmed' THEN
    -- Check if confirmation number already exists
    SELECT registrations.confirmation_number INTO v_confirmation_number  -- Explicitly qualify
    FROM registrations 
    WHERE registrations.registration_id = v_registration_id;
    
    -- If no confirmation number exists, generate one
    IF v_confirmation_number IS NULL OR v_confirmation_number = '' THEN
      -- Generate lodge confirmation number (format: LDG-YYYYMMDD-XXXX)
      v_confirmation_number := 'LDG-' || to_char(now(), 'YYYYMMDD') || '-' || 
                              LPAD((EXTRACT(EPOCH FROM now())::bigint % 10000)::text, 4, '0');
      
      UPDATE registrations 
      SET confirmation_number = v_confirmation_number,
          updated_at = now()
      WHERE registrations.registration_id = v_registration_id;
    END IF;
  END IF;

  -- For lodge registrations, create package tickets
  IF p_package_id IS NOT NULL THEN
    INSERT INTO tickets (
      ticket_id,
      registration_id,
      package_id,
      ticket_type,
      ticket_price,
      ticket_name,
      attendee_id,
      created_at,
      updated_at
    )
    SELECT 
      gen_random_uuid(),
      v_registration_id,
      p_package_id,
      'package',
      p_total_price_paid / p_table_count,  -- Use subtotal for ticket price
      COALESCE(v_package_name, 'Lodge Package'),
      NULL, -- No specific attendee for lodge packages
      now(),
      now()
    FROM generate_series(1, p_table_count);
    
    v_created_tickets := p_table_count;
  END IF;

  -- Return registration details
  RETURN QUERY SELECT 
    v_registration_id,
    v_customer_id,
    v_organisation_id,
    v_confirmation_number,
    v_total_attendees,
    v_created_tickets;
END;
$$;