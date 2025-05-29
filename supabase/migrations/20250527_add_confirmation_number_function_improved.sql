-- Improved function to generate unique confirmation numbers
CREATE OR REPLACE FUNCTION generate_unique_confirmation_number()
RETURNS TRIGGER AS $$
DECLARE
  v_confirmation_number TEXT;
  v_counter INTEGER := 0;
  v_exists BOOLEAN;
BEGIN
  -- If confirmation number is already set, don't override it
  IF NEW.confirmation_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Generate initial confirmation number
  v_confirmation_number := 'REG-' || UPPER(SUBSTRING(NEW.registration_id::text, 1, 8));
  
  -- Check if this confirmation number already exists
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM registrations 
      WHERE confirmation_number = v_confirmation_number
      AND registration_id != NEW.registration_id
    ) INTO v_exists;
    
    -- If it doesn't exist, we're good
    IF NOT v_exists THEN
      EXIT;
    END IF;
    
    -- If it exists, add a counter suffix
    v_counter := v_counter + 1;
    v_confirmation_number := 'REG-' || UPPER(SUBSTRING(NEW.registration_id::text, 1, 6)) || '-' || v_counter;
    
    -- Safety check to prevent infinite loop
    IF v_counter > 99 THEN
      -- Use a timestamp-based fallback
      v_confirmation_number := 'REG-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || SUBSTRING(MD5(NEW.registration_id::text), 1, 4);
      EXIT;
    END IF;
  END LOOP;
  
  NEW.confirmation_number := v_confirmation_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS set_unique_confirmation_number ON registrations;
CREATE TRIGGER set_unique_confirmation_number
  BEFORE INSERT OR UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION generate_unique_confirmation_number();

-- Add index on confirmation_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_registrations_confirmation_number 
ON registrations(confirmation_number);

-- Function to manually generate confirmation number for existing records
CREATE OR REPLACE FUNCTION backfill_confirmation_numbers()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_registration RECORD;
BEGIN
  -- Loop through registrations without confirmation numbers
  FOR v_registration IN 
    SELECT registration_id 
    FROM registrations 
    WHERE confirmation_number IS NULL
    ORDER BY created_at
  LOOP
    UPDATE registrations
    SET confirmation_number = 'REG-' || UPPER(SUBSTRING(registration_id::text, 1, 8))
    WHERE registration_id = v_registration.registration_id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Run the backfill function
SELECT backfill_confirmation_numbers();