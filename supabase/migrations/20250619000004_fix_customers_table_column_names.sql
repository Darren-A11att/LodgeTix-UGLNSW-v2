-- Fix customers table column references in lodge registration function
-- The customers table uses 'phone' not 'mobile_number'

-- First, add missing Square payment columns if they don't exist
DO $$
BEGIN
    -- Add square_payment_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrations' 
        AND column_name = 'square_payment_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE registrations ADD COLUMN square_payment_id TEXT NULL;
        RAISE NOTICE 'Added square_payment_id column to registrations table';
    END IF;
    
    -- Add square_fee column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrations' 
        AND column_name = 'square_fee'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE registrations ADD COLUMN square_fee NUMERIC(10,2) NULL;
        RAISE NOTICE 'Added square_fee column to registrations table';
    END IF;
END $$;

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
  v_organisation_id uuid;
  v_contact_id uuid;
  v_lodge_id uuid;
  v_confirmation_number text;
  v_existing_customer_id uuid;
  v_existing_organisation_id uuid;
  v_event_id uuid;
  v_event_ticket_id uuid;
  i integer;
BEGIN
  -- Input validation
  IF p_function_id IS NULL OR p_package_id IS NULL OR p_table_count < 1 THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;

  -- Look up event and event_ticket from package
  SELECT e.event_id, et.event_ticket_id
  INTO v_event_id, v_event_ticket_id
  FROM packages p
  JOIN events e ON e.function_id = p.function_id
  LEFT JOIN event_tickets et ON et.event_id = e.event_id
  WHERE p.package_id = p_package_id
  LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Event not found for package %', p_package_id;
  END IF;

  -- Check if customer already exists (simple email check without unique constraint)
  SELECT customer_id INTO v_existing_customer_id
  FROM customers 
  WHERE email = (p_booking_contact->>'email')::text
  LIMIT 1;

  -- Create or use existing customer
  IF v_existing_customer_id IS NOT NULL THEN
    v_customer_id := v_existing_customer_id;
  ELSE
    -- Insert new customer with correct column names
    INSERT INTO customers (
      customer_id,
      email,
      first_name,
      last_name,
      phone,  -- Use 'phone' not 'mobile_number'
      customer_type,
      auth_user_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      (p_booking_contact->>'email')::text,
      (p_booking_contact->>'firstName')::text,
      (p_booking_contact->>'lastName')::text,
      (p_booking_contact->>'mobile')::text,  -- Map mobile to phone column
      'person'::customer_type,
      NULL, -- Anonymous registrations supported
      NOW(),
      NOW()
    ) RETURNING customer_id INTO v_customer_id;
  END IF;

  -- Check if organisation already exists (simple name check)
  SELECT organisation_id INTO v_existing_organisation_id
  FROM organisations 
  WHERE name = (p_lodge_details->>'lodgeName')::text
  LIMIT 1;

  -- Create or use existing organisation
  IF v_existing_organisation_id IS NOT NULL THEN
    v_organisation_id := v_existing_organisation_id;
  ELSE
    -- Insert new organisation
    INSERT INTO organisations (
      organisation_id,
      name,
      type,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      (p_lodge_details->>'lodgeName')::text,
      'lodge'::organisation_type,
      NOW(),
      NOW()
    ) RETURNING organisation_id INTO v_organisation_id;
  END IF;

  -- Handle registration - use ON CONFLICT only for valid constraints
  IF p_registration_id IS NOT NULL THEN
    -- Try to update existing registration
    UPDATE registrations SET
      payment_status = p_payment_status::payment_status,
      total_amount_paid = p_total_amount,
      subtotal = p_total_price_paid,
      square_fee = p_square_fee,
      stripe_fee = p_stripe_fee,
      platform_fee_amount = p_platform_fee_amount,
      square_payment_id = p_square_payment_id,
      stripe_payment_intent_id = p_stripe_payment_intent_id,
      registration_data = p_metadata,
      connected_account_id = p_connected_account_id,
      updated_at = NOW()
    WHERE registration_id = p_registration_id;
    
    v_registration_id := p_registration_id;
  ELSE
    -- Insert new registration
    INSERT INTO registrations (
      registration_id,
      function_id,
      customer_id,
      organisation_id,
      registration_type,
      status,
      payment_status,
      total_amount_paid,
      subtotal,
      square_fee,
      stripe_fee,
      platform_fee_amount,
      square_payment_id,
      stripe_payment_intent_id,
      registration_data,
      connected_account_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_function_id,
      v_customer_id,
      v_organisation_id,
      'lodge'::registration_type,
      CASE WHEN p_payment_status = 'completed' THEN 'completed' ELSE 'pending' END,
      p_payment_status::payment_status,
      p_total_amount,
      p_total_price_paid,
      p_square_fee,
      p_stripe_fee,
      p_platform_fee_amount,
      p_square_payment_id,
      p_stripe_payment_intent_id,
      p_metadata,
      p_connected_account_id,
      NOW(),
      NOW()
    ) RETURNING registration_id INTO v_registration_id;
  END IF;

  -- Create tickets for lodge (10 tickets per table as per business logic)
  FOR i IN 1..p_table_count LOOP
    INSERT INTO tickets (
      ticket_id,
      registration_id,
      event_id,
      event_ticket_id,
      package_id,
      status,
      price_paid,
      ticket_price,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_registration_id,
      v_event_id,
      v_event_ticket_id,
      p_package_id,
      'Active', -- Use valid status from constraint
      p_total_price_paid / p_table_count, -- Price per table
      p_total_price_paid / p_table_count, -- Price per table
      NOW(),
      NOW()
    );
  END LOOP;

  -- Generate confirmation number if payment completed
  IF p_payment_status = 'completed' THEN
    v_confirmation_number := 'LDG-' || LPAD((FLOOR(RANDOM() * 1000000))::text, 6, '0') || 
                           CHR(65 + FLOOR(RANDOM() * 26)::int) || CHR(65 + FLOOR(RANDOM() * 26)::int);
    
    UPDATE registrations 
    SET confirmation_number = v_confirmation_number,
        confirmation_generated_at = NOW()
    WHERE registration_id = v_registration_id;
  END IF;

  -- Return registration details
  RETURN jsonb_build_object(
    'registration_id', v_registration_id,
    'customer_id', v_customer_id,
    'organisation_id', v_organisation_id,
    'confirmation_number', v_confirmation_number,
    'total_attendees', p_table_count * 10,
    'created_tickets', p_table_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'upsert_lodge_registration failed: % %', SQLSTATE, SQLERRM;
    RAISE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION upsert_lodge_registration TO anon;
GRANT EXECUTE ON FUNCTION upsert_lodge_registration TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_lodge_registration TO service_role;