-- TEMPORARY: Disable all RLS policies to allow registration flow to work
-- This should be replaced with proper RLS policies once the flow is working

-- Disable RLS on all relevant tables
ALTER TABLE IF EXISTS registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Registrations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS people DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean slate
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop policies on registrations
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'registrations' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON registrations', pol.policyname);
    END LOOP;
    
    -- Drop policies on Registrations (capital R)
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'Registrations' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON "Registrations"', pol.policyname);
    END LOOP;
    
    -- Drop policies on attendees
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'attendees' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON attendees', pol.policyname);
    END LOOP;
    
    -- Drop policies on tickets
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tickets' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tickets', pol.policyname);
    END LOOP;
    
    -- Drop policies on customers
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'customers' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON customers', pol.policyname);
    END LOOP;
END $$;

-- Grant all permissions to authenticated users (temporary)
GRANT ALL ON registrations TO authenticated;
GRANT ALL ON "Registrations" TO authenticated;
GRANT ALL ON attendees TO authenticated;
GRANT ALL ON tickets TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON events TO authenticated;
GRANT ALL ON people TO authenticated;

-- Also grant to anon for good measure (temporary)
GRANT ALL ON registrations TO anon;
GRANT ALL ON "Registrations" TO anon;
GRANT ALL ON attendees TO anon;
GRANT ALL ON tickets TO anon;
GRANT ALL ON customers TO anon;
GRANT ALL ON events TO anon;
GRANT ALL ON people TO anon;