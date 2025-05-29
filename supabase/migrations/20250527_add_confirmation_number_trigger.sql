-- Function to generate confirmation number for registrations
CREATE OR REPLACE FUNCTION generate_confirmation_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate confirmation number using REG- prefix and first 8 characters of registration_id
  -- Convert to uppercase for better readability
  NEW.confirmation_number := 'REG-' || UPPER(SUBSTRING(NEW.registration_id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set confirmation number on insert
DROP TRIGGER IF EXISTS set_confirmation_number ON registrations;
CREATE TRIGGER set_confirmation_number
  BEFORE INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION generate_confirmation_number();

-- Update existing records that don't have confirmation numbers
UPDATE registrations 
SET confirmation_number = 'REG-' || UPPER(SUBSTRING(registration_id::text, 1, 8))
WHERE confirmation_number IS NULL;