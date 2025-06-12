-- Add 'attendee' value to contact_type enum if it doesn't exist
-- This ensures the enum supports the 'attendee' value used for contact records

DO $$
BEGIN
    -- Check if contact_type enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_type') THEN
        -- Check if 'attendee' value already exists in the enum
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'contact_type' 
            AND e.enumlabel = 'attendee'
        ) THEN
            -- Add 'attendee' value to the enum
            ALTER TYPE contact_type ADD VALUE 'attendee';
            RAISE NOTICE 'Added "attendee" value to contact_type enum';
        ELSE
            RAISE NOTICE 'Value "attendee" already exists in contact_type enum';
        END IF;
    ELSE
        -- Create the enum with basic values if it doesn't exist
        CREATE TYPE contact_type AS ENUM ('attendee', 'customer', 'individual', 'organization');
        RAISE NOTICE 'Created contact_type enum with attendee value';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating contact_type enum: % %', SQLERRM, SQLSTATE;
END $$;