-- TEMPORARY SOLUTION: Allow authenticated users (including anonymous) to insert registrations and related data
-- This should be replaced with proper RLS policies once the service role key is configured

-- Enable RLS on tables if not already enabled
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "temp_allow_authenticated_insert_registrations" ON registrations;
DROP POLICY IF EXISTS "temp_allow_authenticated_insert_attendees" ON attendees;
DROP POLICY IF EXISTS "temp_allow_authenticated_insert_tickets" ON tickets;

-- Temporary policies to allow any authenticated user to insert
-- Note: These are permissive for testing. Production should verify customer_id matches auth.uid()

-- Registrations: Allow authenticated users to insert
CREATE POLICY "temp_allow_authenticated_insert_registrations"
ON registrations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Attendees: Allow authenticated users to insert
CREATE POLICY "temp_allow_authenticated_insert_attendees"
ON attendees FOR INSERT
TO authenticated
WITH CHECK (true);

-- Tickets: Allow authenticated users to insert
CREATE POLICY "temp_allow_authenticated_insert_tickets"
ON tickets FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow users to read their own data
DROP POLICY IF EXISTS "temp_allow_users_read_own_registrations" ON registrations;
CREATE POLICY "temp_allow_users_read_own_registrations"
ON registrations FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "temp_allow_users_read_own_attendees" ON attendees;
CREATE POLICY "temp_allow_users_read_own_attendees"
ON attendees FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "temp_allow_users_read_own_tickets" ON tickets;
CREATE POLICY "temp_allow_users_read_own_tickets"
ON tickets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = tickets.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT INSERT, SELECT ON registrations TO authenticated;
GRANT INSERT, SELECT ON attendees TO authenticated;
GRANT INSERT, SELECT ON tickets TO authenticated;