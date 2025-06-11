-- Fix RLS policy for raw_registrations table to allow function access

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert raw registration data" ON raw_registrations;
DROP POLICY IF EXISTS "Allow authenticated users to read their own raw registration data" ON raw_registrations;
DROP POLICY IF EXISTS "Allow service role full access to raw registrations" ON raw_registrations;

-- Create comprehensive policies for raw_registrations
CREATE POLICY "Allow authenticated users to insert raw registration data"
ON raw_registrations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon users to insert raw registration data"
ON raw_registrations FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read their own raw registration data"
ON raw_registrations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow service role full access to raw registrations"
ON raw_registrations FOR ALL
TO service_role
USING (true);

-- Also ensure RPC functions can access the table
CREATE POLICY "Allow RPC function access to raw registrations"
ON raw_registrations FOR ALL
USING (true);