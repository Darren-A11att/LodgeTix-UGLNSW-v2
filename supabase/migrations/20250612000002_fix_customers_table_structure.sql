-- Fix customers table structure: add auth_user_id column and update enum values
-- This migration balances manually applied changes with migration applied changes
-- Uses conditional "IF" logic to check current state before making changes

DO $$
BEGIN
    -- Check if auth_user_id column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'auth_user_id'
    ) THEN
        -- Add auth_user_id column with foreign key reference to auth.users
        ALTER TABLE public.customers 
        ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
        
        RAISE NOTICE 'Added auth_user_id column to customers table';
    END IF;

    -- Check if customer_type enum exists and has 'individual' value
    IF EXISTS (
        SELECT 1 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'customer_type' 
        AND e.enumlabel = 'individual'
    ) THEN
        -- If 'person' value doesn't exist in enum, add it
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'customer_type' 
            AND e.enumlabel = 'person'
        ) THEN
            ALTER TYPE customer_type ADD VALUE 'person';
            RAISE NOTICE 'Added "person" value to customer_type enum';
        END IF;

        -- Update existing records from 'individual' to 'person' if any exist
        IF EXISTS (SELECT 1 FROM customers WHERE customer_type = 'individual') THEN
            UPDATE customers 
            SET customer_type = 'person' 
            WHERE customer_type = 'individual';
            
            RAISE NOTICE 'Updated customer records from "individual" to "person"';
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in customers table migration: % %', SQLERRM, SQLSTATE;
END $$;