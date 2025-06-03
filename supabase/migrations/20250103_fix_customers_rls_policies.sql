-- Fix RLS policies for customers table to use correct column name
-- The customers table has 'customer_id' not 'id'

-- Drop existing incorrect policies if they exist
DROP POLICY IF EXISTS "customers_auth_select_own" ON customers;
DROP POLICY IF EXISTS "customers_auth_insert_own" ON customers;
DROP POLICY IF EXISTS "customers_auth_update_own" ON customers;

-- Create corrected policies using customer_id instead of id
CREATE POLICY "customers_auth_select_own" ON customers
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "customers_auth_insert_own" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "customers_auth_update_own" ON customers
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid());

-- Also fix registrations policies that reference customer_id incorrectly
DROP POLICY IF EXISTS "registrations_auth_select_own" ON registrations;
DROP POLICY IF EXISTS "registrations_auth_insert_own" ON registrations;
DROP POLICY IF EXISTS "registrations_auth_update_pending" ON registrations;

-- Create corrected policies for registrations using contact_id instead of customer_id
CREATE POLICY "registrations_auth_select_own" ON registrations
  FOR SELECT TO authenticated
  USING (contact_id = auth.uid());

CREATE POLICY "registrations_auth_insert_own" ON registrations
  FOR INSERT TO authenticated
  WITH CHECK (contact_id = auth.uid());

CREATE POLICY "registrations_auth_update_pending" ON registrations
  FOR UPDATE TO authenticated
  USING (
    contact_id = auth.uid() AND 
    payment_status = 'pending'
  );

-- Fix attendees policies to use correct registrations reference
DROP POLICY IF EXISTS "attendees_auth_select_own" ON attendees;
DROP POLICY IF EXISTS "attendees_auth_insert_own" ON attendees;
DROP POLICY IF EXISTS "attendees_auth_update_own" ON attendees;
DROP POLICY IF EXISTS "attendees_auth_delete_own" ON attendees;

-- Create corrected policies for attendees
CREATE POLICY "attendees_auth_select_own" ON attendees
  FOR SELECT TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id = auth.uid()
    )
  );

CREATE POLICY "attendees_auth_insert_own" ON attendees
  FOR INSERT TO authenticated
  WITH CHECK (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id = auth.uid()
      AND payment_status = 'pending'
    )
  );

CREATE POLICY "attendees_auth_update_own" ON attendees
  FOR UPDATE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id = auth.uid()
      AND payment_status = 'pending'
    )
  );

CREATE POLICY "attendees_auth_delete_own" ON attendees
  FOR DELETE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id = auth.uid()
      AND payment_status = 'pending'
    )
  );

-- Fix tickets policies
DROP POLICY IF EXISTS "tickets_auth_select_own" ON tickets;
DROP POLICY IF EXISTS "tickets_auth_insert_own" ON tickets;
DROP POLICY IF EXISTS "tickets_auth_update_own" ON tickets;

-- Create corrected policies for tickets
CREATE POLICY "tickets_auth_select_own" ON tickets
  FOR SELECT TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id = auth.uid()
    )
  );

CREATE POLICY "tickets_auth_insert_own" ON tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id = auth.uid()
      AND payment_status = 'pending'
    )
  );

CREATE POLICY "tickets_auth_update_own" ON tickets
  FOR UPDATE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id = auth.uid()
      AND payment_status = 'pending'
    )
  );

-- Also need to update the registrations organizer policy to use function_id instead of event_id
DROP POLICY IF EXISTS "registrations_auth_select_organizer" ON registrations;

CREATE POLICY "registrations_auth_select_organizer" ON registrations
  FOR SELECT TO authenticated
  USING (
    function_id IN (
      SELECT function_id FROM functions
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Add a note about the changes
COMMENT ON POLICY "customers_auth_select_own" ON customers IS 'Fixed to use customer_id instead of id';
COMMENT ON POLICY "customers_auth_insert_own" ON customers IS 'Fixed to use customer_id instead of id';
COMMENT ON POLICY "customers_auth_update_own" ON customers IS 'Fixed to use customer_id instead of id';
COMMENT ON POLICY "registrations_auth_select_own" ON registrations IS 'Fixed to use contact_id instead of customer_id';
COMMENT ON POLICY "registrations_auth_insert_own" ON registrations IS 'Fixed to use contact_id instead of customer_id';
COMMENT ON POLICY "registrations_auth_update_pending" ON registrations IS 'Fixed to use contact_id instead of customer_id';
COMMENT ON POLICY "registrations_auth_select_organizer" ON registrations IS 'Fixed to use function_id instead of event_id';