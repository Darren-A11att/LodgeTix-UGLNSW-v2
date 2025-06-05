-- Add confirmation number tracking fields and constraints
BEGIN;

-- Add confirmation_generated_at field if it doesn't exist
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS confirmation_generated_at timestamptz;

-- Add unique constraint on confirmation_number
ALTER TABLE registrations 
ADD CONSTRAINT registrations_confirmation_number_unique 
UNIQUE (confirmation_number);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_registrations_confirmation_number 
ON registrations(confirmation_number) 
WHERE confirmation_number IS NOT NULL;

-- Add check constraint for confirmation number format
ALTER TABLE registrations 
ADD CONSTRAINT registrations_confirmation_number_format 
CHECK (
  confirmation_number IS NULL OR 
  confirmation_number ~ '^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$'
);

-- Add comment explaining the format
COMMENT ON COLUMN registrations.confirmation_number IS 
'Unique confirmation number in format: [TYPE][YEAR][MONTH][RANDOM] where TYPE is IND/LDG/DEL, followed by YYYYMM and 2 random digits + 2 letters';

COMMIT;