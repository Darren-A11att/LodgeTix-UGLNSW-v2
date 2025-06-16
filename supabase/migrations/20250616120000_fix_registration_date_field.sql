-- Fix registration_date field not being set in both lodge and individual registration RPC functions

-- Update upsert_lodge_registration to include registration_date
CREATE OR REPLACE FUNCTION upsert_lodge_registration(
  p_registration_id UUID DEFAULT NULL,
  p_function_id UUID DEFAULT NULL,
  p_package_id UUID DEFAULT NULL,
  p_table_count INTEGER DEFAULT NULL,
  p_lodge_details JSONB DEFAULT NULL,
  p_booking_contact JSONB DEFAULT NULL,
  p_total_amount DECIMAL DEFAULT NULL,
  p_subtotal DECIMAL DEFAULT NULL,
  p_stripe_fee DECIMAL DEFAULT NULL,
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

  -- Create or get customer
  INSERT INTO customers (
    first_name,
    last_name,
    email,
    mobile,
    business_name,
    address_line_1,
    city,
    state,
    postal_code,
    country,
    created_at,
    updated_at
  ) VALUES (
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
  ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile = EXCLUDED.mobile,
    business_name = EXCLUDED.business_name,
    address_line_1 = EXCLUDED.address_line_1,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    postal_code = EXCLUDED.postal_code,
    country = EXCLUDED.country,
    updated_at = now()
  RETURNING customer_id INTO v_customer_id;

  -- Create or get organisation
  v_organisation_name := p_lodge_details->>'lodgeName';
  
  INSERT INTO organisations (
    name,
    organisation_number,
    organisation_type,
    created_at,
    updated_at
  ) VALUES (
    v_organisation_name,
    p_lodge_details->>'lodgeNumber',
    'lodge',
    now(),
    now()
  )
  ON CONFLICT (name, organisation_number) DO UPDATE SET
    updated_at = now()
  RETURNING organisation_id INTO v_organisation_id;

  -- Get package name for registration data
  SELECT name INTO v_package_name
  FROM packages 
  WHERE package_id = p_package_id;

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

  -- Create or update registration (NOW INCLUDING registration_date)
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
    registration_date,  -- ADDED THIS FIELD
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
    now(),  -- ADDED THIS VALUE
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
    attendee_count = EXCLUDED.attendee_count,
    connected_account_id = EXCLUDED.connected_account_id,
    registration_date = now(),  -- ALSO UPDATE THIS ON CONFLICT
    updated_at = now();

  -- Generate confirmation number if status is confirmed and doesn't exist
  IF v_status = 'confirmed' THEN
    -- Check if confirmation number already exists
    SELECT confirmation_number INTO v_confirmation_number
    FROM registrations 
    WHERE registration_id = v_registration_id;
    
    -- If no confirmation number exists, generate one
    IF v_confirmation_number IS NULL OR v_confirmation_number = '' THEN
      -- Generate lodge confirmation number (format: LDG-YYYYMMDD-XXXX)
      v_confirmation_number := 'LDG-' || to_char(now(), 'YYYYMMDD') || '-' || 
                              LPAD((EXTRACT(EPOCH FROM now())::bigint % 10000)::text, 4, '0');
      
      UPDATE registrations 
      SET confirmation_number = v_confirmation_number,
          updated_at = now()
      WHERE registration_id = v_registration_id;
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
      p_subtotal / p_table_count,
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

-- Also update upsert_individual_registration to include registration_date
CREATE OR REPLACE FUNCTION upsert_individual_registration(
  p_registration_id UUID DEFAULT NULL,
  p_function_id UUID DEFAULT NULL,
  p_customer_data JSONB DEFAULT NULL,
  p_attendees JSONB DEFAULT NULL,
  p_tickets JSONB DEFAULT NULL,
  p_total_amount DECIMAL DEFAULT NULL,
  p_subtotal DECIMAL DEFAULT NULL,
  p_stripe_fee DECIMAL DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_payment_status TEXT DEFAULT 'pending',
  p_connected_account_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  registration_id UUID,
  customer_id UUID,
  confirmation_number TEXT,
  total_attendees INTEGER,
  created_tickets INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_registration_id UUID;
  v_customer_id UUID;
  v_total_attendees INTEGER;
  v_confirmation_number TEXT;
  v_status TEXT;
  v_enhanced_registration_data JSONB;
  v_attendee_record JSONB;
  v_attendee_id UUID;
  v_ticket_record JSONB;
  v_created_tickets INTEGER := 0;
BEGIN
  -- Generate registration ID if not provided
  v_registration_id := COALESCE(p_registration_id, gen_random_uuid());
  
  -- Get total attendees count
  v_total_attendees := jsonb_array_length(p_attendees);
  
  -- Determine status based on payment
  IF p_payment_status = 'completed' THEN
    v_status := 'confirmed';
  ELSE
    v_status := 'pending';
  END IF;

  -- Create or update customer
  INSERT INTO customers (
    first_name,
    last_name,
    email,
    mobile,
    address_line_1,
    city,
    state,
    postal_code,
    country,
    created_at,
    updated_at
  ) VALUES (
    p_customer_data->>'firstName',
    p_customer_data->>'lastName',
    p_customer_data->>'emailAddress',
    p_customer_data->>'mobileNumber',
    p_customer_data->>'addressLine1',
    p_customer_data->>'suburb',
    p_customer_data->'stateTerritory'->>'name',
    p_customer_data->>'postcode',
    p_customer_data->'country'->>'name',
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile = EXCLUDED.mobile,
    address_line_1 = EXCLUDED.address_line_1,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    postal_code = EXCLUDED.postal_code,
    country = EXCLUDED.country,
    updated_at = now()
  RETURNING customer_id INTO v_customer_id;

  -- Enhanced registration data
  v_enhanced_registration_data := jsonb_build_object(
    'functionId', p_function_id,
    'customerData', p_customer_data,
    'attendees', p_attendees,
    'tickets', p_tickets,
    'totalAttendees', v_total_attendees,
    'metadata', p_metadata
  );

  -- Create or update registration (NOW INCLUDING registration_date)
  INSERT INTO registrations (
    registration_id,
    customer_id,
    function_id,
    registration_type,
    status,
    payment_status,
    total_amount_paid,
    subtotal,
    stripe_fee,
    stripe_payment_intent_id,
    registration_data,
    attendee_count,
    connected_account_id,
    agree_to_terms,
    registration_date,  -- ADDED THIS FIELD
    created_at,
    updated_at
  ) VALUES (
    v_registration_id,
    v_customer_id,
    p_function_id,
    'individual',
    v_status,
    p_payment_status::payment_status,
    p_total_amount,
    p_subtotal,
    p_stripe_fee,
    p_stripe_payment_intent_id,
    v_enhanced_registration_data,
    v_total_attendees,
    p_connected_account_id,
    true,
    now(),  -- ADDED THIS VALUE
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
    attendee_count = EXCLUDED.attendee_count,
    connected_account_id = EXCLUDED.connected_account_id,
    registration_date = now(),  -- ALSO UPDATE THIS ON CONFLICT
    updated_at = now();

  -- Generate confirmation number if status is confirmed and doesn't exist
  IF v_status = 'confirmed' THEN
    -- Check if confirmation number already exists
    SELECT confirmation_number INTO v_confirmation_number
    FROM registrations 
    WHERE registration_id = v_registration_id;
    
    -- If no confirmation number exists, generate one
    IF v_confirmation_number IS NULL OR v_confirmation_number = '' THEN
      -- Generate individual confirmation number (format: IND-YYYYMMDD-XXXX)
      v_confirmation_number := 'IND-' || to_char(now(), 'YYYYMMDD') || '-' || 
                              LPAD((EXTRACT(EPOCH FROM now())::bigint % 10000)::text, 4, '0');
      
      UPDATE registrations 
      SET confirmation_number = v_confirmation_number,
          updated_at = now()
      WHERE registration_id = v_registration_id;
    END IF;
  END IF;

  -- Create attendees and tickets
  FOR v_attendee_record IN SELECT * FROM jsonb_array_elements(p_attendees)
  LOOP
    -- Insert attendee
    INSERT INTO attendees (
      attendee_id,
      registration_id,
      attendee_type,
      title,
      first_name,
      last_name,
      suffix,
      primary_email,
      primary_phone,
      dietary_requirements,
      special_needs,
      contact_preference,
      is_primary,
      created_at,
      updated_at
    ) VALUES (
      COALESCE((v_attendee_record->>'attendeeId')::UUID, gen_random_uuid()),
      v_registration_id,
      v_attendee_record->>'attendeeType',
      v_attendee_record->>'title',
      v_attendee_record->>'firstName',
      v_attendee_record->>'lastName',
      v_attendee_record->>'suffix',
      v_attendee_record->>'primaryEmail',
      v_attendee_record->>'primaryPhone',
      v_attendee_record->>'dietaryRequirements',
      v_attendee_record->>'specialNeeds',
      v_attendee_record->>'contactPreference',
      COALESCE((v_attendee_record->>'isPrimary')::boolean, false),
      now(),
      now()
    )
    ON CONFLICT (attendee_id) DO UPDATE SET
      attendee_type = EXCLUDED.attendee_type,
      title = EXCLUDED.title,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      suffix = EXCLUDED.suffix,
      primary_email = EXCLUDED.primary_email,
      primary_phone = EXCLUDED.primary_phone,
      dietary_requirements = EXCLUDED.dietary_requirements,
      special_needs = EXCLUDED.special_needs,
      contact_preference = EXCLUDED.contact_preference,
      is_primary = EXCLUDED.is_primary,
      updated_at = now()
    RETURNING attendee_id INTO v_attendee_id;
    
    v_created_tickets := v_created_tickets + 1;
  END LOOP;

  -- Create tickets
  FOR v_ticket_record IN SELECT * FROM jsonb_array_elements(p_tickets)
  LOOP
    INSERT INTO tickets (
      ticket_id,
      registration_id,
      event_id,
      ticket_type,
      ticket_price,
      ticket_name,
      attendee_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_registration_id,
      (v_ticket_record->>'eventId')::UUID,
      'individual',
      (v_ticket_record->>'ticketPrice')::DECIMAL,
      v_ticket_record->>'ticketName',
      (v_ticket_record->>'attendeeId')::UUID,
      now(),
      now()
    );
  END LOOP;

  -- Return registration details
  RETURN QUERY SELECT 
    v_registration_id,
    v_customer_id,
    v_confirmation_number,
    v_total_attendees,
    v_created_tickets;
END;
$$;