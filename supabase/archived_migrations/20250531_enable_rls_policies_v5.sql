-- SAFE RLS POLICIES FOR LODGETIX
-- Version 5: Handles permission issues when dropping existing policies
-- Only creates new policies without trying to drop existing ones

-- Note: If you have existing policies that conflict, you'll need to drop them manually
-- through the Supabase dashboard or with appropriate permissions

-- Enable RLS on all tables (safe to run even if already enabled)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE masonic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lodges ENABLE ROW LEVEL SECURITY;
ALTER TABLE grand_lodges ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- ===== EVENTS TABLE POLICIES =====
-- Public can view published events
CREATE POLICY IF NOT EXISTS "events_public_select_published" ON events
  FOR SELECT
  USING (is_published = true);

-- Authenticated users can additionally view their organization's events
CREATE POLICY IF NOT EXISTS "events_auth_select_org" ON events
  FOR SELECT TO authenticated
  USING (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Event organizers can manage their events
CREATE POLICY IF NOT EXISTS "events_auth_insert" ON events
  FOR INSERT TO authenticated
  WITH CHECK (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "events_auth_update" ON events
  FOR UPDATE TO authenticated
  USING (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "events_auth_delete" ON events
  FOR DELETE TO authenticated
  USING (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    ) AND 
    is_published = false
  );

-- ===== CUSTOMERS TABLE POLICIES =====
-- Users can view their own customer record
CREATE POLICY IF NOT EXISTS "customers_auth_select_own" ON customers
  FOR SELECT TO authenticated
  USING (id = auth.uid()::text);

-- Users can create their own customer record
CREATE POLICY IF NOT EXISTS "customers_auth_insert_own" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid()::text);

-- Users can update their own customer record
CREATE POLICY IF NOT EXISTS "customers_auth_update_own" ON customers
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text);

-- ===== REGISTRATIONS TABLE POLICIES =====
-- Users can view their own registrations
CREATE POLICY IF NOT EXISTS "registrations_auth_select_own" ON registrations
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid()::text);

-- Users can create their own registrations
CREATE POLICY IF NOT EXISTS "registrations_auth_insert_own" ON registrations
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid()::text);

-- Users can update their pending registrations
CREATE POLICY IF NOT EXISTS "registrations_auth_update_pending" ON registrations
  FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid()::text AND 
    payment_status = 'pending'
  );

-- Event organizers can view registrations for their events
CREATE POLICY IF NOT EXISTS "registrations_auth_select_organizer" ON registrations
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ===== ATTENDEES TABLE POLICIES =====
-- Users can manage attendees for their registrations
CREATE POLICY IF NOT EXISTS "attendees_auth_select_own" ON attendees
  FOR SELECT TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE customer_id = auth.uid()::text
    )
  );

CREATE POLICY IF NOT EXISTS "attendees_auth_insert_own" ON attendees
  FOR INSERT TO authenticated
  WITH CHECK (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE customer_id = auth.uid()::text
      AND payment_status = 'pending'
    )
  );

CREATE POLICY IF NOT EXISTS "attendees_auth_update_own" ON attendees
  FOR UPDATE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE customer_id = auth.uid()::text
      AND payment_status = 'pending'
    )
  );

CREATE POLICY IF NOT EXISTS "attendees_auth_delete_own" ON attendees
  FOR DELETE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE customer_id = auth.uid()::text
      AND payment_status = 'pending'
    )
  );

-- ===== TICKETS TABLE POLICIES =====
-- Users can view their own tickets
CREATE POLICY IF NOT EXISTS "tickets_auth_select_own" ON tickets
  FOR SELECT TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE customer_id = auth.uid()::text
    )
  );

-- Users can create tickets for their registrations
CREATE POLICY IF NOT EXISTS "tickets_auth_insert_own" ON tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE customer_id = auth.uid()::text
      AND payment_status = 'pending'
    )
  );

-- Event organizers can view all tickets for their events
CREATE POLICY IF NOT EXISTS "tickets_auth_select_organizer" ON tickets
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ===== CONTACTS TABLE POLICIES =====
-- Users can view their own contact
CREATE POLICY IF NOT EXISTS "contacts_auth_select_own" ON contacts
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- Users can create their own contact
CREATE POLICY IF NOT EXISTS "contacts_auth_insert_own" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Users can update their own contact
CREATE POLICY IF NOT EXISTS "contacts_auth_update_own" ON contacts
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

-- Users can view contacts linked to their customer record
CREATE POLICY IF NOT EXISTS "contacts_auth_select_customer_linked" ON contacts
  FOR SELECT TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM attendees
      WHERE registration_id IN (
        SELECT registration_id FROM registrations
        WHERE customer_id = auth.uid()::text
      )
    )
  );

-- ===== EVENT_TICKETS TABLE POLICIES =====
-- Public can view ticket types for published events
CREATE POLICY IF NOT EXISTS "event_tickets_public_select" ON event_tickets
  FOR SELECT
  USING (
    event_id IN (
      SELECT event_id FROM events 
      WHERE is_published = true
    )
  );

-- Event organizers can manage ticket types
CREATE POLICY IF NOT EXISTS "event_tickets_auth_insert" ON event_tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY IF NOT EXISTS "event_tickets_auth_update" ON event_tickets
  FOR UPDATE TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY IF NOT EXISTS "event_tickets_auth_delete" ON event_tickets
  FOR DELETE TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ===== PACKAGES TABLE POLICIES =====
-- Public can view packages for published events
CREATE POLICY IF NOT EXISTS "packages_public_select" ON packages
  FOR SELECT
  USING (
    event_id IN (
      SELECT event_id FROM events 
      WHERE is_published = true
    ) OR 
    parent_event_id IN (
      SELECT event_id FROM events 
      WHERE is_published = true
    )
  );

-- Event organizers can manage packages
CREATE POLICY IF NOT EXISTS "packages_auth_insert" ON packages
  FOR INSERT TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY IF NOT EXISTS "packages_auth_update" ON packages
  FOR UPDATE TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ===== ORGANISATIONS TABLE POLICIES =====
-- Public can view all organizations
CREATE POLICY IF NOT EXISTS "organisations_public_select" ON organisations
  FOR SELECT
  USING (true);

-- Organization members can update their org
CREATE POLICY IF NOT EXISTS "organisations_auth_update" ON organisations
  FOR UPDATE TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ===== MASONIC_PROFILES TABLE POLICIES =====
-- Users can manage their own masonic profile
CREATE POLICY IF NOT EXISTS "masonic_profiles_auth_select_own" ON masonic_profiles
  FOR SELECT TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "masonic_profiles_auth_insert_own" ON masonic_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "masonic_profiles_auth_update_own" ON masonic_profiles
  FOR UPDATE TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ===== USER_ROLES TABLE POLICIES =====
-- Users can view their own roles
CREATE POLICY IF NOT EXISTS "user_roles_auth_select_own" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ===== PUBLIC READ-ONLY TABLES =====
CREATE POLICY IF NOT EXISTS "lodges_public_select" ON lodges
  FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "grand_lodges_public_select" ON grand_lodges
  FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "locations_public_select" ON locations
  FOR SELECT
  USING (true);

-- Lodge members can update their lodge
CREATE POLICY IF NOT EXISTS "lodges_auth_update" ON lodges
  FOR UPDATE TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Authenticated users can create locations
CREATE POLICY IF NOT EXISTS "locations_auth_insert" ON locations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Location creators can update
CREATE POLICY IF NOT EXISTS "locations_auth_update" ON locations
  FOR UPDATE TO authenticated
  USING (
    location_id IN (
      SELECT location_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ===== ATTENDEE_EVENTS TABLE POLICIES =====
-- Users can view attendee events for their registrations
CREATE POLICY IF NOT EXISTS "attendee_events_auth_select_own" ON attendee_events
  FOR SELECT TO authenticated
  USING (
    attendee_id IN (
      SELECT attendee_id FROM attendees
      WHERE registration_id IN (
        SELECT registration_id FROM registrations
        WHERE customer_id = auth.uid()::text
      )
    )
  );

-- ===== MEMBERSHIPS TABLE POLICIES =====
-- Users can manage their own memberships
CREATE POLICY IF NOT EXISTS "memberships_auth_select_own" ON memberships
  FOR SELECT TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "memberships_auth_insert_own" ON memberships
  FOR INSERT TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "memberships_auth_update_own" ON memberships
  FOR UPDATE TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "memberships_auth_delete_own" ON memberships
  FOR DELETE TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ===== GRANT APPROPRIATE PERMISSIONS =====
-- Note: These grants may fail if the current user doesn't have permission
-- In that case, they need to be run by a superuser or through Supabase dashboard

-- Wrap grants in a DO block to handle errors gracefully
DO $$
BEGIN
  -- Public data accessible to everyone
  GRANT SELECT ON events TO anon, authenticated;
  GRANT SELECT ON organisations TO anon, authenticated;
  GRANT SELECT ON event_tickets TO anon, authenticated;
  GRANT SELECT ON packages TO anon, authenticated;
  GRANT SELECT ON lodges TO anon, authenticated;
  GRANT SELECT ON grand_lodges TO anon, authenticated;
  GRANT SELECT ON locations TO anon, authenticated;

  -- Authenticated users need more permissions
  GRANT ALL ON customers TO authenticated;
  GRANT ALL ON registrations TO authenticated;
  GRANT ALL ON attendees TO authenticated;
  GRANT ALL ON tickets TO authenticated;
  GRANT ALL ON contacts TO authenticated;
  GRANT UPDATE ON organisations TO authenticated;
  GRANT ALL ON masonic_profiles TO authenticated;
  GRANT INSERT, UPDATE, DELETE ON event_tickets TO authenticated;
  GRANT INSERT, UPDATE ON packages TO authenticated;
  GRANT SELECT ON user_roles TO authenticated;
  GRANT UPDATE ON lodges TO authenticated;
  GRANT INSERT, UPDATE ON locations TO authenticated;
  GRANT SELECT ON attendee_events TO authenticated;
  GRANT ALL ON memberships TO authenticated;
  GRANT INSERT, UPDATE, DELETE ON events TO authenticated;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Insufficient privileges to grant permissions. Please run these grants through Supabase dashboard or as superuser.';
END $$;

-- Report on what needs manual attention
DO $$
DECLARE
  policy_count INTEGER;
  table_name TEXT;
BEGIN
  -- Check each table for existing policies
  FOR table_name IN 
    SELECT unnest(ARRAY['events', 'registrations', 'tickets', 'attendees', 'contacts', 
                        'customers', 'organisations', 'masonic_profiles', 'event_tickets', 
                        'packages', 'user_roles', 'lodges', 'grand_lodges', 'locations', 
                        'attendee_events', 'memberships'])
  LOOP
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = table_name;
    
    IF policy_count > 0 THEN
      RAISE NOTICE 'Table % has % existing policies', table_name, policy_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'If you see any existing policies above, you may need to manually drop conflicting ones through Supabase dashboard.';
  RAISE NOTICE 'Look for policies with similar names but without the exact same name as the ones we tried to create.';
END $$;