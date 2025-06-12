-- Fix generate_confirmation_number function and ensure proper casting
-- The error suggests there's an issue with parameter types

-- Drop existing function to recreate with proper type handling
DROP FUNCTION IF EXISTS generate_confirmation_number(text, uuid);
DROP FUNCTION IF EXISTS generate_confirmation_number(registration_type, uuid);

-- Recreate the function with explicit parameter types
CREATE OR REPLACE FUNCTION generate_confirmation_number(registration_type text, registration_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate inputs
  IF registration_type IS NULL OR registration_id IS NULL THEN
    RAISE EXCEPTION 'Both registration_type and registration_id are required';
  END IF;
  
  -- Generate confirmation number based on registration type
  CASE LOWER(registration_type)
    WHEN 'lodge' THEN
      RETURN 'LDG' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') || 
             CHR(65 + (RANDOM() * 25)::INTEGER) || CHR(65 + (RANDOM() * 25)::INTEGER);
    WHEN 'individuals' THEN  
      RETURN 'IND' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') || 
             CHR(65 + (RANDOM() * 25)::INTEGER) || CHR(65 + (RANDOM() * 25)::INTEGER);
    WHEN 'delegation' THEN
      RETURN 'DEL' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') || 
             CHR(65 + (RANDOM() * 25)::INTEGER) || CHR(65 + (RANDOM() * 25)::INTEGER);
    ELSE
      RETURN 'REG' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') || 
             CHR(65 + (RANDOM() * 25)::INTEGER) || CHR(65 + (RANDOM() * 25)::INTEGER);
  END CASE;
END;
$$;

-- Also create a version that handles the lodge registration specifically
-- since our code calls it during completed payments
CREATE OR REPLACE FUNCTION update_registration_with_confirmation(p_registration_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_confirmation_number text;
  v_registration_type text;
BEGIN
  -- Get the registration type
  SELECT registration_type INTO v_registration_type
  FROM registrations 
  WHERE registration_id = p_registration_id;
  
  IF v_registration_type IS NULL THEN
    RAISE EXCEPTION 'Registration not found: %', p_registration_id;
  END IF;
  
  -- Generate confirmation number
  v_confirmation_number := generate_confirmation_number(v_registration_type, p_registration_id);
  
  -- Update the registration
  UPDATE registrations 
  SET confirmation_number = v_confirmation_number,
      updated_at = now()
  WHERE registration_id = p_registration_id
  AND confirmation_number IS NULL;
  
  RETURN v_confirmation_number;
END;
$$;

-- Update the trigger function to use proper casting
CREATE OR REPLACE FUNCTION trigger_generate_confirmation_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate confirmation number for completed payments
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    -- Generate confirmation number if not already set
    IF NEW.confirmation_number IS NULL THEN
      NEW.confirmation_number := generate_confirmation_number(NEW.registration_type::text, NEW.registration_id::uuid);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trg_generate_confirmation_number ON registrations;
CREATE TRIGGER trg_generate_confirmation_number
  BEFORE UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_confirmation_number();

-- Log the update
DO $$
BEGIN
  RAISE NOTICE 'Fixed generate_confirmation_number function with proper type casting';
  RAISE NOTICE 'Added update_registration_with_confirmation helper function';
  RAISE NOTICE 'Updated trigger to use explicit type casting';
END $$;