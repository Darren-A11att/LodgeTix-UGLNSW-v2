-- Migration to update database functions for Square payment integration
-- Updates payment ID parameter names and database schema for Square instead of Stripe

-- Add square_payment_id column to registrations table
DO $$
BEGIN
    -- Add square_payment_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registrations' AND column_name = 'square_payment_id') THEN
        ALTER TABLE registrations ADD COLUMN square_payment_id TEXT;
        RAISE NOTICE 'Added square_payment_id column to registrations table';
    END IF;
    
    -- Add square_fee column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registrations' AND column_name = 'square_fee') THEN
        ALTER TABLE registrations ADD COLUMN square_fee DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added square_fee column to registrations table';
    END IF;
END $$;

-- Update upsert_individual_registration function to support both Stripe and Square payment IDs
CREATE OR REPLACE FUNCTION upsert_individual_registration(
  p_function_id uuid,
  p_customer_data jsonb,
  p_attendees jsonb,
  p_tickets jsonb,
  p_payment_status text DEFAULT 'pending'::text,
  p_stripe_payment_intent_id text DEFAULT NULL::text,
  p_square_payment_id text DEFAULT NULL::text,
  p_registration_id uuid DEFAULT NULL::uuid,
  p_total_amount numeric DEFAULT 0,
  p_total_price_paid numeric DEFAULT 0,
  p_platform_fee_amount numeric DEFAULT 0,
  p_stripe_fee numeric DEFAULT 0,
  p_square_fee numeric DEFAULT 0,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registration_id uuid;
  v_customer_id uuid;
  v_registration_record record;
  v_attendee jsonb;
  v_attendee_id uuid;
  v_event_ticket_id uuid;
  v_ticket_id uuid;
  v_selected_ticket jsonb;
  v_ticket_type_id uuid;
  v_is_primary boolean;
  v_confirmation_number text;
  v_attendee_count integer := 0;
  v_ticket_count integer := 0;
  result jsonb;
BEGIN
  RAISE LOG 'upsert_individual_registration called with function_id=%, payment_status=%, stripe_payment_intent_id=%, square_payment_id=%', 
    p_function_id, p_payment_status, p_stripe_payment_intent_id, p_square_payment_id;

  -- Use existing registration ID or generate new one
  v_registration_id := COALESCE(p_registration_id, gen_random_uuid());
  
  -- Upsert customer/contact
  INSERT INTO contacts (
    contact_id,
    email,
    first_name,
    last_name,
    mobile_number,
    address_line_1,
    suburb,
    state_territory,
    postcode,
    country,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_customer_data->>'email',
    p_customer_data->>'firstName',
    p_customer_data->>'lastName', 
    p_customer_data->>'mobile',
    p_customer_data->>'addressLine1',
    p_customer_data->>'suburb',
    p_customer_data->>'stateTerritory',
    p_customer_data->>'postcode',
    p_customer_data->>'country',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile_number = EXCLUDED.mobile_number,
    address_line_1 = EXCLUDED.address_line_1,
    suburb = EXCLUDED.suburb,
    state_territory = EXCLUDED.state_territory,
    postcode = EXCLUDED.postcode,
    country = EXCLUDED.country,
    updated_at = NOW()
  RETURNING contact_id INTO v_customer_id;

  -- Create or update registration with both payment ID fields
  INSERT INTO registrations (
    registration_id,
    function_id,
    contact_id,
    registration_type,
    status,
    payment_status,
    stripe_payment_intent_id,
    square_payment_id,
    total_amount_paid,
    total_price_paid,
    platform_fee,
    stripe_fee,
    square_fee,
    confirmation_number,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_registration_id,
    p_function_id,
    v_customer_id,
    'individuals',
    CASE WHEN p_payment_status = 'completed' THEN 'completed' ELSE 'pending' END,
    p_payment_status::payment_status,
    p_stripe_payment_intent_id,
    p_square_payment_id,
    p_total_amount,
    p_total_price_paid,
    p_platform_fee_amount,
    p_stripe_fee,
    p_square_fee,
    NULL, -- Will be set later if payment completed
    p_metadata,
    NOW(),
    NOW()
  )
  ON CONFLICT (registration_id)
  DO UPDATE SET
    payment_status = p_payment_status::payment_status,
    status = CASE WHEN p_payment_status = 'completed' THEN 'completed' ELSE registrations.status END,
    stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, registrations.stripe_payment_intent_id),
    square_payment_id = COALESCE(p_square_payment_id, registrations.square_payment_id),
    total_amount_paid = CASE WHEN p_total_amount > 0 THEN p_total_amount ELSE registrations.total_amount_paid END,
    total_price_paid = CASE WHEN p_total_price_paid > 0 THEN p_total_price_paid ELSE registrations.total_price_paid END,
    platform_fee = CASE WHEN p_platform_fee_amount > 0 THEN p_platform_fee_amount ELSE registrations.platform_fee END,
    stripe_fee = CASE WHEN p_stripe_fee > 0 THEN p_stripe_fee ELSE registrations.stripe_fee END,
    square_fee = CASE WHEN p_square_fee > 0 THEN p_square_fee ELSE registrations.square_fee END,
    metadata = p_metadata,
    updated_at = NOW();

  -- Process attendees
  FOR v_attendee IN SELECT * FROM jsonb_array_elements(p_attendees)
  LOOP
    v_is_primary := (v_attendee->>'isPrimary')::boolean;
    
    INSERT INTO attendees (
      attendee_id,
      registration_id,
      first_name,
      last_name,
      email,
      phone_number,
      attendee_type,
      dietary_requirements,
      accessibility_requirements,
      emergency_contact_name,
      emergency_contact_phone,
      is_primary_contact,
      lodge_name,
      lodge_number,
      grand_lodge,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_registration_id,
      v_attendee->>'firstName',
      v_attendee->>'lastName',
      v_attendee->>'email',
      v_attendee->>'phoneNumber',
      (v_attendee->>'attendeeType')::attendee_type,
      v_attendee->>'dietaryRequirements',
      v_attendee->>'accessibilityRequirements',
      v_attendee->>'emergencyContactName',
      v_attendee->>'emergencyContactPhone',
      v_is_primary,
      v_attendee->>'lodgeName',
      v_attendee->>'lodgeNumber',
      v_attendee->>'grandLodge',
      NOW(),
      NOW()
    )
    ON CONFLICT (registration_id, email)
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone_number = EXCLUDED.phone_number,
      attendee_type = EXCLUDED.attendee_type,
      dietary_requirements = EXCLUDED.dietary_requirements,
      accessibility_requirements = EXCLUDED.accessibility_requirements,
      emergency_contact_name = EXCLUDED.emergency_contact_name,
      emergency_contact_phone = EXCLUDED.emergency_contact_phone,
      is_primary_contact = EXCLUDED.is_primary_contact,
      lodge_name = EXCLUDED.lodge_name,
      lodge_number = EXCLUDED.lodge_number,
      grand_lodge = EXCLUDED.grand_lodge,
      updated_at = NOW()
    RETURNING attendee_id INTO v_attendee_id;
    
    v_attendee_count := v_attendee_count + 1;
  END LOOP;

  -- Process tickets
  FOR v_selected_ticket IN SELECT * FROM jsonb_array_elements(p_tickets)
  LOOP
    v_event_ticket_id := (v_selected_ticket->>'eventTicketId')::uuid;
    
    FOR i IN 1..(v_selected_ticket->>'quantity')::integer
    LOOP
      INSERT INTO tickets (
        ticket_id,
        registration_id,
        event_ticket_id,
        ticket_type_id,
        status,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_registration_id,
        v_event_ticket_id,
        (SELECT ticket_type_id FROM event_tickets WHERE event_ticket_id = v_event_ticket_id),
        CASE WHEN p_payment_status = 'completed' THEN 'confirmed'::ticket_status ELSE 'pending'::ticket_status END,
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING;
      
      v_ticket_count := v_ticket_count + 1;
    END LOOP;
  END LOOP;

  -- Get final registration record
  SELECT * INTO v_registration_record 
  FROM registrations 
  WHERE registration_id = v_registration_id;

  -- Build result
  result := jsonb_build_object(
    'registration_id', v_registration_id,
    'contact_id', v_customer_id,
    'confirmation_number', v_registration_record.confirmation_number,
    'total_attendees', v_attendee_count,
    'total_tickets', v_ticket_count,
    'status', v_registration_record.status,
    'payment_status', v_registration_record.payment_status
  );

  RAISE LOG 'upsert_individual_registration completed successfully: %', result;
  RETURN result;

EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'upsert_individual_registration failed: % %', SQLSTATE, SQLERRM;
  RAISE;
END;
$$;

-- Update upsert_lodge_registration function to support both Stripe and Square payment IDs  
CREATE OR REPLACE FUNCTION upsert_lodge_registration(
  p_function_id uuid,
  p_package_id uuid,
  p_table_count integer,
  p_booking_contact jsonb,
  p_lodge_details jsonb,
  p_payment_status text DEFAULT 'pending'::text,
  p_stripe_payment_intent_id text DEFAULT NULL::text,
  p_square_payment_id text DEFAULT NULL::text,
  p_registration_id uuid DEFAULT NULL::uuid,
  p_total_amount numeric DEFAULT 0,
  p_total_price_paid numeric DEFAULT 0,
  p_platform_fee_amount numeric DEFAULT 0,
  p_stripe_fee numeric DEFAULT 0,
  p_square_fee numeric DEFAULT 0,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_connected_account_id text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registration_id uuid;
  v_customer_id uuid;
  v_lodge_id uuid;
  v_grand_lodge_id uuid;
  v_lodge_registration_id uuid;
  v_registration_record record;
  v_confirmation_number text;
  v_created_tickets integer := 0;
  result jsonb;
BEGIN
  RAISE LOG 'upsert_lodge_registration called with function_id=%, package_id=%, table_count=%, payment_status=%, stripe_payment_intent_id=%, square_payment_id=%', 
    p_function_id, p_package_id, p_table_count, p_payment_status, p_stripe_payment_intent_id, p_square_payment_id;

  -- Use existing registration ID or generate new one
  v_registration_id := COALESCE(p_registration_id, gen_random_uuid());
  
  -- Upsert booking contact
  INSERT INTO contacts (
    contact_id,
    email,
    first_name,
    last_name,
    mobile_number,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_booking_contact->>'email',
    p_booking_contact->>'firstName',
    p_booking_contact->>'lastName', 
    p_booking_contact->>'mobile',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    mobile_number = EXCLUDED.mobile_number,
    updated_at = NOW()
  RETURNING contact_id INTO v_customer_id;

  -- Create or update registration with both payment ID fields
  INSERT INTO registrations (
    registration_id,
    function_id,
    contact_id,
    registration_type,
    status,
    payment_status,
    stripe_payment_intent_id,
    square_payment_id,
    total_amount_paid,
    total_price_paid,
    platform_fee,
    stripe_fee,
    square_fee,
    confirmation_number,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_registration_id,
    p_function_id,
    v_customer_id,
    'lodge',
    CASE WHEN p_payment_status = 'completed' THEN 'completed' ELSE 'pending' END,
    p_payment_status::payment_status,
    p_stripe_payment_intent_id,
    p_square_payment_id,
    p_total_amount,
    p_total_price_paid,
    p_platform_fee_amount,
    p_stripe_fee,
    p_square_fee,
    NULL,
    p_metadata,
    NOW(),
    NOW()
  )
  ON CONFLICT (registration_id)
  DO UPDATE SET
    payment_status = p_payment_status::payment_status,
    status = CASE WHEN p_payment_status = 'completed' THEN 'completed' ELSE registrations.status END,
    stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, registrations.stripe_payment_intent_id),
    square_payment_id = COALESCE(p_square_payment_id, registrations.square_payment_id),
    total_amount_paid = CASE WHEN p_total_amount > 0 THEN p_total_amount ELSE registrations.total_amount_paid END,
    total_price_paid = CASE WHEN p_total_price_paid > 0 THEN p_total_price_paid ELSE registrations.total_price_paid END,
    platform_fee = CASE WHEN p_platform_fee_amount > 0 THEN p_platform_fee_amount ELSE registrations.platform_fee END,
    stripe_fee = CASE WHEN p_stripe_fee > 0 THEN p_stripe_fee ELSE registrations.stripe_fee END,
    square_fee = CASE WHEN p_square_fee > 0 THEN p_square_fee ELSE registrations.square_fee END,
    metadata = p_metadata,
    updated_at = NOW();

  -- Handle lodge details and create lodge registration
  IF p_table_count > 0 THEN
    -- Find or create grand lodge
    INSERT INTO grand_lodges (
      grand_lodge_id,
      name,
      abbreviation,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      COALESCE(p_lodge_details->>'grandLodgeName', 'United Grand Lodge of NSW & ACT'),
      COALESCE(p_lodge_details->>'grandLodgeAbbreviation', 'UGLNSW'),
      NOW(),
      NOW()
    )
    ON CONFLICT (name) 
    DO UPDATE SET updated_at = NOW()
    RETURNING grand_lodge_id INTO v_grand_lodge_id;

    IF v_grand_lodge_id IS NULL THEN
      SELECT grand_lodge_id INTO v_grand_lodge_id 
      FROM grand_lodges 
      WHERE name = COALESCE(p_lodge_details->>'grandLodgeName', 'United Grand Lodge of NSW & ACT');
    END IF;

    -- Find or create lodge
    INSERT INTO lodges (
      lodge_id,
      grand_lodge_id,
      name,
      number,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_grand_lodge_id,
      p_lodge_details->>'lodgeName',
      p_lodge_details->>'lodgeNumber',
      NOW(),
      NOW()
    )
    ON CONFLICT (grand_lodge_id, number) 
    DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = NOW()
    RETURNING lodge_id INTO v_lodge_id;

    IF v_lodge_id IS NULL THEN
      SELECT lodge_id INTO v_lodge_id 
      FROM lodges 
      WHERE grand_lodge_id = v_grand_lodge_id 
        AND number = p_lodge_details->>'lodgeNumber';
    END IF;

    -- Create lodge registration
    INSERT INTO lodge_registrations (
      lodge_registration_id,
      registration_id,
      lodge_id,
      package_id,
      table_count,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_registration_id,
      v_lodge_id,
      p_package_id,
      p_table_count,
      NOW(),
      NOW()
    )
    ON CONFLICT (registration_id)
    DO UPDATE SET
      lodge_id = EXCLUDED.lodge_id,
      package_id = EXCLUDED.package_id,
      table_count = EXCLUDED.table_count,
      updated_at = NOW()
    RETURNING lodge_registration_id INTO v_lodge_registration_id;

    -- Create tickets for the lodge (10 tickets per table)
    FOR i IN 1..(p_table_count * 10)
    LOOP
      INSERT INTO tickets (
        ticket_id,
        registration_id,
        package_id,
        status,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_registration_id,
        p_package_id,
        CASE WHEN p_payment_status = 'completed' THEN 'confirmed'::ticket_status ELSE 'pending'::ticket_status END,
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING;
      
      v_created_tickets := v_created_tickets + 1;
    END LOOP;
  END IF;

  -- Get final registration record
  SELECT * INTO v_registration_record 
  FROM registrations 
  WHERE registration_id = v_registration_id;

  -- Build result
  result := jsonb_build_object(
    'registration_id', v_registration_id,
    'customer_id', v_customer_id,
    'confirmation_number', v_registration_record.confirmation_number,
    'created_tickets', v_created_tickets,
    'total_attendees', p_table_count * 10,
    'status', v_registration_record.status,
    'payment_status', v_registration_record.payment_status
  );

  RAISE LOG 'upsert_lodge_registration completed successfully: %', result;
  RETURN result;

EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'upsert_lodge_registration failed: % %', SQLSTATE, SQLERRM;
  RAISE;
END;
$$;

-- Add index on square_payment_id for performance
CREATE INDEX IF NOT EXISTS idx_registrations_square_payment_id 
ON registrations(square_payment_id) 
WHERE square_payment_id IS NOT NULL;