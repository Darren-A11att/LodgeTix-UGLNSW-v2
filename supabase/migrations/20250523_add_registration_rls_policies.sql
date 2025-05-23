-- Enable RLS on tables if not already enabled
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own registrations" ON registrations;
DROP POLICY IF EXISTS "Users can view their own registrations" ON registrations;
DROP POLICY IF EXISTS "Users can update their own registrations" ON registrations;

DROP POLICY IF EXISTS "Users can insert attendees for their registrations" ON attendees;
DROP POLICY IF EXISTS "Users can view attendees for their registrations" ON attendees;
DROP POLICY IF EXISTS "Users can update attendees for their registrations" ON attendees;

DROP POLICY IF EXISTS "Users can insert tickets for their registrations" ON tickets;
DROP POLICY IF EXISTS "Users can view tickets for their registrations" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets for their registrations" ON tickets;

-- Registrations table policies
CREATE POLICY "Users can insert their own registrations"
ON registrations FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can view their own registrations"
ON registrations FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Users can update their own registrations"
ON registrations FOR UPDATE
USING (auth.uid() = customer_id);

-- Attendees table policies
CREATE POLICY "Users can insert attendees for their registrations"
ON attendees FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
);

CREATE POLICY "Users can view attendees for their registrations"
ON attendees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
);

CREATE POLICY "Users can update attendees for their registrations"
ON attendees FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
);

-- Tickets table policies
CREATE POLICY "Users can insert tickets for their registrations"
ON tickets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = tickets.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);

CREATE POLICY "Users can view tickets for their registrations"
ON tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = tickets.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);

CREATE POLICY "Users can update tickets for their registrations"
ON tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = tickets.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);

-- Allow anonymous users to access their own data
-- This is needed for the anonymous auth flow
CREATE POLICY "Anonymous users can manage their registrations"
ON registrations FOR ALL
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Grant necessary permissions to authenticated users (includes anonymous)
GRANT INSERT, SELECT, UPDATE ON registrations TO authenticated;
GRANT INSERT, SELECT, UPDATE ON attendees TO authenticated;
GRANT INSERT, SELECT, UPDATE ON tickets TO authenticated;