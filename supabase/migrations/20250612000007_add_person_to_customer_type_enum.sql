-- Add 'person' value to customer_type enum if it doesn't exist
-- This ensures the enum supports the 'person' value used instead of 'individual'

DO $$
BEGIN
    -- Check if customer_type enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_type') THEN
        -- Check if 'person' value already exists in the enum
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'customer_type' 
            AND e.enumlabel = 'person'
        ) THEN
            -- Add 'person' value to the enum
            ALTER TYPE customer_type ADD VALUE 'person';
            RAISE NOTICE 'Added "person" value to customer_type enum';
        ELSE
            RAISE NOTICE 'Value "person" already exists in customer_type enum';
        END IF;
    ELSE
        -- Create the enum with basic values if it doesn't exist
        CREATE TYPE customer_type AS ENUM ('person', 'booking_contact', 'organization');
        RAISE NOTICE 'Created customer_type enum with person value';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating customer_type enum: % %', SQLERRM, SQLSTATE;
END $$;