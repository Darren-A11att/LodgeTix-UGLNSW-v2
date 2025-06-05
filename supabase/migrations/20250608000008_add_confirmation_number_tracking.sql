-- Add confirmation number tracking fields and constraints
BEGIN;

-- First, drop all views that might depend on the confirmation_number column
DROP VIEW IF EXISTS individuals_registration_confirmation_view CASCADE;
DROP VIEW IF EXISTS lodge_registration_confirmation_view CASCADE;
DROP VIEW IF EXISTS delegation_registration_confirmation_view CASCADE;
DROP VIEW IF EXISTS registration_confirmation_base_view CASCADE;
DROP VIEW IF EXISTS registration_confirmation_unified_view CASCADE;

-- Drop any other views that might reference registrations table
DO $$ 
DECLARE 
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition LIKE '%registrations%'
        AND viewname NOT IN (
            'individuals_registration_confirmation_view',
            'lodge_registration_confirmation_view',
            'delegation_registration_confirmation_view',
            'registration_confirmation_base_view',
            'registration_confirmation_unified_view'
        )
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.schemaname, view_record.viewname);
    END LOOP;
END $$;

-- Change confirmation_number from BIGINT to TEXT to support alphanumeric format
ALTER TABLE registrations 
ALTER COLUMN confirmation_number TYPE TEXT USING confirmation_number::TEXT;

-- Add confirmation_generated_at field if it doesn't exist
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS confirmation_generated_at timestamptz;

-- Add unique constraint on confirmation_number if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'registrations_confirmation_number_unique'
    ) THEN
        ALTER TABLE registrations 
        ADD CONSTRAINT registrations_confirmation_number_unique 
        UNIQUE (confirmation_number);
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_registrations_confirmation_number 
ON registrations(confirmation_number) 
WHERE confirmation_number IS NOT NULL;

-- Add check constraint for confirmation number format if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'registrations_confirmation_number_format'
    ) THEN
        ALTER TABLE registrations 
        ADD CONSTRAINT registrations_confirmation_number_format 
        CHECK (
          confirmation_number IS NULL OR 
          confirmation_number ~ '^(IND|LDG|DEL)[0-9]{6}[A-Z]{2}$'
        );
    END IF;
END $$;

-- Add comment explaining the format
COMMENT ON COLUMN registrations.confirmation_number IS 
'Unique confirmation number in format: [TYPE][YEAR][MONTH][RANDOM] where TYPE is IND/LDG/DEL, followed by YYYYMM and 2 random digits + 2 letters';

-- Recreate the views after column type change
-- Note: These will be recreated by the subsequent migrations

COMMIT;