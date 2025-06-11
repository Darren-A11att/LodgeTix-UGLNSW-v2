-- Fix anonymous authentication by ensuring anonymous users are properly created
-- This migration handles the case where anonymous sessions exist but user records don't

-- Create a function to ensure anonymous user exists
CREATE OR REPLACE FUNCTION public.ensure_anonymous_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user exists in auth.users
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) THEN
    -- Create the anonymous user
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at,
      is_anonymous
    ) VALUES (
      p_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      NULL, -- anonymous users don't have email
      NULL, -- no password
      NULL, -- no email confirmation
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      now(),
      jsonb_build_object('provider', 'anonymous', 'providers', ARRAY['anonymous']),
      jsonb_build_object(),
      false,
      now(),
      now(),
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      0,
      NULL,
      NULL,
      NULL,
      false,
      NULL,
      true -- Mark as anonymous user
    );
  END IF;
END;
$$;

-- Create a function to handle anonymous registration
CREATE OR REPLACE FUNCTION public.handle_anonymous_registration(
  p_auth_user_id uuid,
  p_registration_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id uuid;
  v_result jsonb;
BEGIN
  -- Ensure the anonymous user exists
  PERFORM ensure_anonymous_user(p_auth_user_id);
  
  -- Create or get customer for anonymous user
  INSERT INTO customers (
    auth_user_id,
    customer_type,
    first_name,
    last_name,
    email,
    phone,
    created_at,
    updated_at
  )
  SELECT
    p_auth_user_id,
    'individual'::customer_type,
    COALESCE(p_registration_data->'billingDetails'->>'firstName', 'Anonymous'),
    COALESCE(p_registration_data->'billingDetails'->>'lastName', 'User'),
    p_registration_data->'billingDetails'->>'emailAddress',
    p_registration_data->'billingDetails'->>'mobileNumber',
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM customers WHERE auth_user_id = p_auth_user_id
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = now()
  RETURNING customer_id INTO v_customer_id;
  
  -- If no customer was created (because it already exists), get the existing one
  IF v_customer_id IS NULL THEN
    SELECT customer_id INTO v_customer_id
    FROM customers
    WHERE auth_user_id = p_auth_user_id;
  END IF;
  
  -- Return the customer ID
  v_result := jsonb_build_object(
    'success', true,
    'customer_id', v_customer_id
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Update the individual registration RPC to handle anonymous users
CREATE OR REPLACE FUNCTION public.create_individual_registration_with_anonymous_support(
  p_auth_user_id uuid,
  p_function_id uuid,
  p_registration_data jsonb,
  p_attendees jsonb,
  p_tickets jsonb,
  p_raw_zustand_data jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registration_id uuid;
  v_customer_id uuid;
  v_attendee_record jsonb;
  v_attendee_id uuid;
  v_contact_id uuid;
  v_ticket_record jsonb;
  v_ticket_id uuid;
  v_primary_attendee_id uuid;
  v_anonymous_result jsonb;
  v_confirmation_number text;
  v_raw_registration_id uuid;
BEGIN
  -- Handle anonymous user creation if needed
  v_anonymous_result := handle_anonymous_registration(p_auth_user_id, p_registration_data);
  
  IF NOT (v_anonymous_result->>'success')::boolean THEN
    RAISE EXCEPTION 'Failed to handle anonymous user: %', v_anonymous_result->>'error';
  END IF;
  
  v_customer_id := (v_anonymous_result->>'customer_id')::uuid;
  
  -- Generate confirmation number
  v_confirmation_number := generate_confirmation_number('IND');
  
  -- Create raw registration record if zustand data provided
  IF p_raw_zustand_data IS NOT NULL THEN
    INSERT INTO raw_registrations (
      auth_user_id,
      function_id,
      registration_type,
      raw_data,
      created_at
    )
    VALUES (
      p_auth_user_id,
      p_function_id,
      'individuals',
      p_raw_zustand_data,
      now()
    )
    RETURNING id INTO v_raw_registration_id;
  END IF;
  
  -- Create the registration
  INSERT INTO registrations (
    customer_id,
    auth_user_id,
    function_id,
    registration_type,
    status,
    payment_status,
    registration_data,
    raw_registrations_id,
    confirmation_number,
    created_at,
    updated_at
  )
  VALUES (
    v_customer_id,
    p_auth_user_id,
    p_function_id,
    'individuals',
    'pending',
    'pending',
    p_registration_data,
    v_raw_registration_id,
    v_confirmation_number,
    now(),
    now()
  )
  RETURNING registration_id INTO v_registration_id;
  
  -- Process attendees
  FOR v_attendee_record IN SELECT * FROM jsonb_array_elements(p_attendees)
  LOOP
    -- Create contact for attendee
    INSERT INTO contacts (
      first_name,
      last_name,
      email,
      phone,
      contact_type,
      created_at,
      updated_at
    )
    VALUES (
      v_attendee_record->>'firstName',
      v_attendee_record->>'lastName',
      v_attendee_record->>'primaryEmail',
      v_attendee_record->>'primaryPhone',
      'attendee'::contact_type,
      now(),
      now()
    )
    RETURNING contact_id INTO v_contact_id;
    
    -- Create attendee
    INSERT INTO attendees (
      registration_id,
      contact_id,
      is_primary,
      attendee_type,
      first_name,
      last_name,
      title,
      suffix,
      dietary_requirements,
      special_needs,
      contact_preference,
      email,
      phone,
      created_at,
      updated_at
    )
    VALUES (
      v_registration_id,
      v_contact_id,
      COALESCE((v_attendee_record->>'isPrimary')::boolean, false),
      COALESCE(v_attendee_record->>'attendeeType', 'guest')::attendee_type,
      v_attendee_record->>'firstName',
      v_attendee_record->>'lastName',
      v_attendee_record->>'title',
      v_attendee_record->>'suffix',
      v_attendee_record->>'dietaryRequirements',
      v_attendee_record->>'specialNeeds',
      v_attendee_record->>'contactPreference',
      v_attendee_record->>'primaryEmail',
      v_attendee_record->>'primaryPhone',
      now(),
      now()
    )
    RETURNING attendee_id INTO v_attendee_id;
    
    -- Store primary attendee ID
    IF COALESCE((v_attendee_record->>'isPrimary')::boolean, false) THEN
      v_primary_attendee_id := v_attendee_id;
    END IF;
    
    -- Create masonic profile if attendee is a mason
    IF v_attendee_record->>'attendeeType' = 'mason' AND v_attendee_record->'masonicProfile' IS NOT NULL THEN
      INSERT INTO masonic_profiles (
        contact_id,
        grand_lodge_id,
        lodge_id,
        rank,
        grand_rank,
        masonic_title,
        created_at,
        updated_at
      )
      VALUES (
        v_contact_id,
        (v_attendee_record->'masonicProfile'->>'grandLodgeId')::uuid,
        (v_attendee_record->'masonicProfile'->>'lodgeId')::uuid,
        v_attendee_record->'masonicProfile'->>'rank',
        v_attendee_record->'masonicProfile'->>'grandRank',
        v_attendee_record->'masonicProfile'->>'masonicTitle',
        now(),
        now()
      );
    END IF;
  END LOOP;
  
  -- Process tickets
  FOR v_ticket_record IN SELECT * FROM jsonb_array_elements(p_tickets)
  LOOP
    INSERT INTO tickets (
      registration_id,
      attendee_id,
      event_id,
      ticket_type_id,
      ticket_status,
      ticket_price,
      created_at,
      updated_at
    )
    VALUES (
      v_registration_id,
      (v_ticket_record->>'attendeeId')::uuid,
      (v_ticket_record->>'eventId')::uuid,
      (v_ticket_record->>'ticketTypeId')::uuid,
      'reserved'::ticket_status,
      COALESCE((v_ticket_record->>'ticketPrice')::decimal, 0),
      now(),
      now()
    );
  END LOOP;
  
  -- Return success with registration details
  RETURN jsonb_build_object(
    'success', true,
    'registrationId', v_registration_id,
    'confirmationNumber', v_confirmation_number,
    'customerId', v_customer_id,
    'primaryAttendeeId', v_primary_attendee_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback will happen automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.ensure_anonymous_user(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_anonymous_registration(uuid, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_individual_registration_with_anonymous_support(uuid, uuid, jsonb, jsonb, jsonb, jsonb) TO anon, authenticated, service_role;

-- Add RLS policies for anonymous users to access their own data
-- First check if the policies already exist and drop them if they do
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Anonymous users can create their own customer record" ON customers;
    DROP POLICY IF EXISTS "Anonymous users can view their own customer record" ON customers;
    DROP POLICY IF EXISTS "Anonymous users can update their own customer record" ON customers;
    DROP POLICY IF EXISTS "Anonymous users can create registrations" ON registrations;
    DROP POLICY IF EXISTS "Anonymous users can view their own registrations" ON registrations;
    DROP POLICY IF EXISTS "Anonymous users can update their own registrations" ON registrations;
END $$;

-- Allow anonymous users to create and view their own customers
CREATE POLICY "Anonymous users can create their own customer record"
  ON customers
  FOR INSERT
  TO anon
  WITH CHECK (auth_user_id IS NULL OR auth.uid()::text = auth_user_id::text);

CREATE POLICY "Anonymous users can view their own customer record"
  ON customers
  FOR SELECT
  TO anon
  USING (auth_user_id IS NULL OR auth.uid()::text = auth_user_id::text);

CREATE POLICY "Anonymous users can update their own customer record"
  ON customers
  FOR UPDATE
  TO anon
  USING (auth_user_id IS NULL OR auth.uid()::text = auth_user_id::text)
  WITH CHECK (auth_user_id IS NULL OR auth.uid()::text = auth_user_id::text);

-- Allow anonymous users to create and view their own registrations
CREATE POLICY "Anonymous users can create registrations"
  ON registrations
  FOR INSERT
  TO anon
  WITH CHECK (auth_user_id IS NULL OR auth.uid()::text = auth_user_id::text);

CREATE POLICY "Anonymous users can view their own registrations"
  ON registrations
  FOR SELECT
  TO anon
  USING (auth_user_id IS NULL OR auth.uid()::text = auth_user_id::text);

CREATE POLICY "Anonymous users can update their own registrations"
  ON registrations
  FOR UPDATE
  TO anon
  USING (auth_user_id IS NULL OR auth.uid()::text = auth_user_id::text)
  WITH CHECK (auth_user_id IS NULL OR auth.uid()::text = auth_user_id::text);

-- Add comment
COMMENT ON FUNCTION public.ensure_anonymous_user IS 'Ensures an anonymous user exists in auth.users table when needed';
COMMENT ON FUNCTION public.handle_anonymous_registration IS 'Handles creation of customer records for anonymous users';
COMMENT ON FUNCTION public.create_individual_registration_with_anonymous_support IS 'Creates individual registration with support for anonymous users';