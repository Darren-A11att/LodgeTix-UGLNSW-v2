-- Create confirmation number generation system without dropping existing views

-- Create confirmation number generation function if it doesn't exist
CREATE OR REPLACE FUNCTION generate_confirmation_number(registration_type text, registration_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  CASE registration_type
    WHEN 'lodge' THEN
      RETURN 'LDG-' || UPPER(SUBSTRING(registration_id::text, 1, 6));
    WHEN 'individual' THEN  
      RETURN 'IND-' || UPPER(SUBSTRING(registration_id::text, 1, 6));
    WHEN 'delegation' THEN
      RETURN 'DEL-' || UPPER(SUBSTRING(registration_id::text, 1, 6));
    ELSE
      RETURN 'REG-' || UPPER(SUBSTRING(registration_id::text, 1, 6));
  END CASE;
END;
$$;

-- Create trigger function to generate confirmation numbers
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

-- Create insert trigger function
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

-- Only create triggers if they don't exist
DO $$
BEGIN
  -- Check if update trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_generate_confirmation_number'
  ) THEN
    CREATE TRIGGER trg_generate_confirmation_number
      BEFORE UPDATE OF payment_status ON registrations
      FOR EACH ROW
      EXECUTE FUNCTION trigger_generate_confirmation_number();
  END IF;

  -- Check if insert trigger exists  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_generate_confirmation_number_insert'
  ) THEN
    CREATE TRIGGER trg_generate_confirmation_number_insert
      BEFORE INSERT ON registrations
      FOR EACH ROW
      EXECUTE FUNCTION trigger_generate_confirmation_number_insert();
  END IF;
END $$;

-- Create the lodge_registration_confirmation_view only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'lodge_registration_confirmation_view'
  ) THEN
    EXECUTE '
    CREATE VIEW lodge_registration_confirmation_view AS
    SELECT 
      r.registration_id,
      r.confirmation_number,
      r.status,
      r.payment_status,
      r.registration_type,
      r.function_id,
      r.organisation_name as lodge_name,
      r.attendee_count,
      r.total_amount_paid,
      r.created_at,
      r.updated_at
    FROM registrations r
    WHERE r.registration_type = ''lodge''';
  END IF;
END $$;

-- Grant access to the view if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'lodge_registration_confirmation_view'
  ) THEN
    GRANT SELECT ON lodge_registration_confirmation_view TO anon, authenticated;
  END IF;
END $$;

-- Update any existing completed lodge registrations that don't have confirmation numbers
UPDATE registrations 
SET confirmation_number = generate_confirmation_number(registration_type::text, registration_id)
WHERE registration_type = 'lodge' 
  AND payment_status = 'completed' 
  AND confirmation_number IS NULL;