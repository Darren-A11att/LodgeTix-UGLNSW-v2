-- DB-002: Add Function References
-- Priority: Critical
-- This adds function_id columns to events, registrations, and packages tables

-- Add function_id to events (NOT NULL after migration)
ALTER TABLE events 
ADD COLUMN function_id UUID REFERENCES functions(function_id);

-- Add function_id to registrations
ALTER TABLE registrations 
ADD COLUMN function_id UUID REFERENCES functions(function_id);

-- Add function_id to packages
ALTER TABLE packages 
ADD COLUMN function_id UUID REFERENCES functions(function_id);

-- Create indexes for performance
CREATE INDEX idx_events_function ON events(function_id);
CREATE INDEX idx_registrations_function ON registrations(function_id);
CREATE INDEX idx_packages_function ON packages(function_id);

-- Validation: Confirm columns were added
DO $$
BEGIN
    -- Check events table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'function_id'
    ) THEN
        RAISE EXCEPTION 'function_id column was not added to events table';
    END IF;
    
    -- Check registrations table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'registrations' 
        AND column_name = 'function_id'
    ) THEN
        RAISE EXCEPTION 'function_id column was not added to registrations table';
    END IF;
    
    -- Check packages table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'packages' 
        AND column_name = 'function_id'
    ) THEN
        RAISE EXCEPTION 'function_id column was not added to packages table';
    END IF;
    
    RAISE NOTICE 'DB-002 Complete: Function references added to all tables';
END $$;