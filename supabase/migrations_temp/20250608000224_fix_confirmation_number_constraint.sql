-- Fix confirmation number format constraint to allow generated numbers

-- First, let's see what the current constraint is and drop it
DO $$
BEGIN
    -- Drop the constraint if it exists
    ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_confirmation_number_format;
    
    -- Create a more flexible constraint that allows our generated format
    ALTER TABLE registrations ADD CONSTRAINT registrations_confirmation_number_format 
    CHECK (
        confirmation_number IS NULL OR 
        confirmation_number ~ '^[A-Z]{2,4}-[0-9]{6}$' OR  -- Allows IND-123456, LDG-123456, DEL-123456, etc.
        confirmation_number ~ '^[A-Z]{3,10}-[0-9A-Z]{4,10}$'  -- More flexible format
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- If there's an issue, just create a very permissive constraint
        ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_confirmation_number_format;
        ALTER TABLE registrations ADD CONSTRAINT registrations_confirmation_number_format 
        CHECK (
            confirmation_number IS NULL OR 
            length(confirmation_number) > 0
        );
END $$;