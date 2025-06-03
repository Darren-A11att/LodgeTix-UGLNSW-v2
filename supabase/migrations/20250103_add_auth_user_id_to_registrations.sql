-- Add auth_user_id to registrations table to properly link registrations to authenticated users
-- This allows RLS policies to work correctly without requiring a contact record

-- Add the auth_user_id column
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_registrations_auth_user_id 
ON registrations(auth_user_id);

-- Update RLS policies to use auth_user_id instead of contact_id
DROP POLICY IF EXISTS "registrations_auth_select_own" ON registrations;
DROP POLICY IF EXISTS "registrations_auth_insert_own" ON registrations;
DROP POLICY IF EXISTS "registrations_auth_update_pending" ON registrations;

-- Create new policies using auth_user_id
CREATE POLICY "registrations_auth_select_own" ON registrations
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "registrations_auth_insert_own" ON registrations
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "registrations_auth_update_pending" ON registrations
  FOR UPDATE TO authenticated
  USING (
    auth_user_id = auth.uid() AND 
    payment_status = 'pending'
  );

-- Update attendees policies to use the new relationship
DROP POLICY IF EXISTS "attendees_auth_select_own" ON attendees;
DROP POLICY IF EXISTS "attendees_auth_insert_own" ON attendees;
DROP POLICY IF EXISTS "attendees_auth_update_own" ON attendees;
DROP POLICY IF EXISTS "attendees_auth_delete_own" ON attendees;

CREATE POLICY "attendees_auth_select_own" ON attendees
  FOR SELECT TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "attendees_auth_insert_own" ON attendees
  FOR INSERT TO authenticated
  WITH CHECK (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE auth_user_id = auth.uid()
      AND payment_status = 'pending'
    )
  );

CREATE POLICY "attendees_auth_update_own" ON attendees
  FOR UPDATE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE auth_user_id = auth.uid()
      AND payment_status = 'pending'
    )
  );

CREATE POLICY "attendees_auth_delete_own" ON attendees
  FOR DELETE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE auth_user_id = auth.uid()
      AND payment_status = 'pending'
    )
  );

-- Update tickets policies
DROP POLICY IF EXISTS "tickets_auth_select_own" ON tickets;
DROP POLICY IF EXISTS "tickets_auth_insert_own" ON tickets;
DROP POLICY IF EXISTS "tickets_auth_update_own" ON tickets;

CREATE POLICY "tickets_auth_select_own" ON tickets
  FOR SELECT TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "tickets_auth_insert_own" ON tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE auth_user_id = auth.uid()
      AND payment_status = 'pending'
    )
  );

CREATE POLICY "tickets_auth_update_own" ON tickets
  FOR UPDATE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE auth_user_id = auth.uid()
      AND payment_status = 'pending'
    )
  );

-- Add comment explaining the purpose
COMMENT ON COLUMN registrations.auth_user_id IS 'Links registration to authenticated user for RLS policies';
COMMENT ON COLUMN registrations.contact_id IS 'Optional link to contacts table for booking contact details';