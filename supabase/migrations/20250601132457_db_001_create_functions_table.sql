-- DB-001: Create Functions Table
-- Priority: Critical
-- This creates the new functions table that will replace parent-child event architecture

-- Create the new functions table
CREATE TABLE public.functions (
    function_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    location_id UUID REFERENCES locations(location_id),
    organiser_id UUID REFERENCES organisations(organisation_id) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_functions_slug ON functions(slug);
CREATE INDEX idx_functions_organiser ON functions(organiser_id);
CREATE INDEX idx_functions_published ON functions(is_published);

-- Add update trigger for updated_at
CREATE TRIGGER update_functions_updated_at
    BEFORE UPDATE ON functions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Validation: Confirm table was created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'functions'
    ) THEN
        RAISE EXCEPTION 'Functions table was not created successfully';
    END IF;
    
    RAISE NOTICE 'DB-001 Complete: Functions table created successfully';
END $$;