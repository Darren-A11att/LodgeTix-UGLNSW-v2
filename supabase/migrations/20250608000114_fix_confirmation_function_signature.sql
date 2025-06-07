-- Fix confirmation number generation function signature

-- Drop the function first to recreate with correct signature
DROP FUNCTION IF EXISTS generate_confirmation_number(text, uuid);

-- Create confirmation number generation function with correct parameter types
CREATE OR REPLACE FUNCTION generate_confirmation_number(reg_type text, reg_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  CASE reg_type
    WHEN 'lodge' THEN
      RETURN 'LDG-' || UPPER(SUBSTRING(reg_id::text, 1, 6));
    WHEN 'individual' THEN  
      RETURN 'IND-' || UPPER(SUBSTRING(reg_id::text, 1, 6));
    WHEN 'delegation' THEN
      RETURN 'DEL-' || UPPER(SUBSTRING(reg_id::text, 1, 6));
    ELSE
      RETURN 'REG-' || UPPER(SUBSTRING(reg_id::text, 1, 6));
  END CASE;
END;
$$;

-- Update trigger functions to use correct function call
CREATE OR REPLACE FUNCTION trigger_generate_confirmation_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate confirmation number for completed payments
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    -- Generate confirmation number if not already set
    IF NEW.confirmation_number IS NULL THEN
      NEW.confirmation_number := generate_confirmation_number(NEW.registration_type, NEW.registration_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update insert trigger function
CREATE OR REPLACE FUNCTION trigger_generate_confirmation_number_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate confirmation number for completed registrations
  IF NEW.payment_status = 'completed' AND NEW.confirmation_number IS NULL THEN
    NEW.confirmation_number := generate_confirmation_number(NEW.registration_type, NEW.registration_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update any existing completed lodge registrations that don't have confirmation numbers
-- Use explicit casting to ensure type matching
UPDATE registrations 
SET confirmation_number = generate_confirmation_number(registration_type::text, registration_id::uuid)
WHERE registration_type = 'lodge' 
  AND payment_status = 'completed' 
  AND confirmation_number IS NULL;