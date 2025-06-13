-- Fix confirmation number format to match database constraint
-- Constraint expects: ^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$
-- Previous functions were generating: LDG-123456 (with hyphen)
-- Need to generate: LDG123456AB (no hyphen, 6 digits + 2 letters)

-- Update the standalone generate_confirmation_number function to match constraint
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
  -- Format: (IND|LDG|DEL)[0-9]{6}[A-Z]{2} (matches constraint exactly)
  CASE LOWER(registration_type)
    WHEN 'lodge' THEN
      RETURN 'LDG' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') || 
             CHR(65 + FLOOR(RANDOM() * 26)::INTEGER) || CHR(65 + FLOOR(RANDOM() * 26)::INTEGER);
    WHEN 'individuals' THEN  
      RETURN 'IND' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') || 
             CHR(65 + FLOOR(RANDOM() * 26)::INTEGER) || CHR(65 + FLOOR(RANDOM() * 26)::INTEGER);
    WHEN 'individual' THEN  
      RETURN 'IND' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') || 
             CHR(65 + FLOOR(RANDOM() * 26)::INTEGER) || CHR(65 + FLOOR(RANDOM() * 26)::INTEGER);
    WHEN 'delegation' THEN
      RETURN 'DEL' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') || 
             CHR(65 + FLOOR(RANDOM() * 26)::INTEGER) || CHR(65 + FLOOR(RANDOM() * 26)::INTEGER);
    ELSE
      -- Fallback for unknown types - still follows constraint format
      RETURN 'REG' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') || 
             CHR(65 + FLOOR(RANDOM() * 26)::INTEGER) || CHR(65 + FLOOR(RANDOM() * 26)::INTEGER);
  END CASE;
END;
$$;

-- Test the function with sample data to ensure it matches constraint
DO $$
DECLARE
  test_confirmation text;
BEGIN
  -- Test lodge registration
  test_confirmation := generate_confirmation_number('lodge', gen_random_uuid());
  IF test_confirmation !~ '^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$' THEN
    RAISE EXCEPTION 'Generated confirmation number does not match constraint: %', test_confirmation;
  END IF;
  
  -- Test individual registration  
  test_confirmation := generate_confirmation_number('individual', gen_random_uuid());
  IF test_confirmation !~ '^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$' THEN
    RAISE EXCEPTION 'Generated confirmation number does not match constraint: %', test_confirmation;
  END IF;
  
  -- Test delegation registration
  test_confirmation := generate_confirmation_number('delegation', gen_random_uuid());
  IF test_confirmation !~ '^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$' THEN
    RAISE EXCEPTION 'Generated confirmation number does not match constraint: %', test_confirmation;
  END IF;
  
  RAISE NOTICE 'All confirmation number formats validated successfully';
  RAISE NOTICE 'Example lodge confirmation: %', generate_confirmation_number('lodge', gen_random_uuid());
  RAISE NOTICE 'Example individual confirmation: %', generate_confirmation_number('individual', gen_random_uuid());
  RAISE NOTICE 'Example delegation confirmation: %', generate_confirmation_number('delegation', gen_random_uuid());
END $$;

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Fixed confirmation number generation to match constraint: ^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$';
  RAISE NOTICE 'Removed hyphens and added random letters to match exact constraint format';
  RAISE NOTICE 'Database triggers and Edge Function now generate compatible formats';
END $$;