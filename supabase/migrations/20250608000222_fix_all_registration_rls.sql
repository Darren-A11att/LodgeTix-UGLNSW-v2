-- Fix RLS policies for all registration-related tables

-- Customers table policies
DROP POLICY IF EXISTS "Allow authenticated users to manage their own customer data" ON customers;
DROP POLICY IF EXISTS "Allow service role full access to customers" ON customers;

-- For customers table, we use customer_id as the auth check since there's no auth_user_id column
CREATE POLICY "Allow authenticated users to manage their own customer data"
ON customers FOR ALL
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Allow anon users to create customer records"
ON customers FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to read customer records (needed for registration flow)
CREATE POLICY "Allow anon users to read customer records"
ON customers FOR SELECT
TO anon
USING (true);

-- Contacts table policies
DROP POLICY IF EXISTS "Allow authenticated users to manage their own contacts" ON contacts;
DROP POLICY IF EXISTS "Allow service role full access to contacts" ON contacts;

CREATE POLICY "Allow authenticated users to manage their own contacts"
ON contacts FOR ALL
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Allow anon users to create contact records"
ON contacts FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to read contact records (needed for registration flow)
CREATE POLICY "Allow anon users to read contact records"
ON contacts FOR SELECT
TO anon
USING (true);

-- Registrations table policies
DROP POLICY IF EXISTS "Allow authenticated users to manage their own registrations" ON registrations;
DROP POLICY IF EXISTS "Allow service role full access to registrations" ON registrations;

CREATE POLICY "Allow authenticated users to manage their own registrations"
ON registrations FOR ALL
TO authenticated
USING (auth_user_id = auth.uid() OR customer_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid() OR customer_id = auth.uid());

CREATE POLICY "Allow anon users to create registration records"
ON registrations FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to read registration records (needed for confirmation)
CREATE POLICY "Allow anon users to read registration records"
ON registrations FOR SELECT
TO anon
USING (true);

-- Attendees table policies  
DROP POLICY IF EXISTS "Allow authenticated users to manage attendees for their registrations" ON attendees;
DROP POLICY IF EXISTS "Allow service role full access to attendees" ON attendees;

CREATE POLICY "Allow authenticated users to manage attendees for their registrations"
ON attendees FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations r 
    WHERE r.registration_id = attendees.registration_id 
    AND (r.auth_user_id = auth.uid() OR r.customer_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations r 
    WHERE r.registration_id = attendees.registration_id 
    AND (r.auth_user_id = auth.uid() OR r.customer_id = auth.uid())
  )
);

CREATE POLICY "Allow anon users to create attendee records"
ON attendees FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to read attendee records
CREATE POLICY "Allow anon users to read attendee records"
ON attendees FOR SELECT
TO anon
USING (true);

-- Tickets table policies
DROP POLICY IF EXISTS "Allow authenticated users to manage tickets for their registrations" ON tickets;
DROP POLICY IF EXISTS "Allow service role full access to tickets" ON tickets;

CREATE POLICY "Allow authenticated users to manage tickets for their registrations"
ON tickets FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations r 
    WHERE r.registration_id = tickets.registration_id 
    AND (r.auth_user_id = auth.uid() OR r.customer_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations r 
    WHERE r.registration_id = tickets.registration_id 
    AND (r.auth_user_id = auth.uid() OR r.customer_id = auth.uid())
  )
);

CREATE POLICY "Allow anon users to create ticket records"
ON tickets FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to read ticket records
CREATE POLICY "Allow anon users to read ticket records"
ON tickets FOR SELECT
TO anon
USING (true);

-- Service role policies for all tables
CREATE POLICY "Allow service role full access to customers"
ON customers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role full access to contacts"
ON contacts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role full access to registrations"
ON registrations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role full access to attendees"
ON attendees FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role full access to tickets"
ON tickets FOR ALL
TO service_role
USING (true)
WITH CHECK (true);