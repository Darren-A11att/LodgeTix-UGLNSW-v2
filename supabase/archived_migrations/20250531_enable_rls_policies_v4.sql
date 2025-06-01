-- CORRECTED RLS POLICIES FOR LODGETIX
-- Version 4: Fixed customers table policies based on actual schema
-- Key fixes: customers.id is the auth.uid(), not user_id

-- First, drop all existing policies to start fresh
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Enable RLS on all tables
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
CREATE POLICY "events_public_select_published" ON events
  FOR SELECT
  USING (is_published = true);

-- Authenticated users can additionally view their organization's events
CREATE POLICY "events_auth_select_org" ON events
  FOR SELECT TO authenticated
  USING (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Event organizers can manage their events
CREATE POLICY "events_auth_insert" ON events
  FOR INSERT TO authenticated
  WITH CHECK (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "events_auth_update" ON events
  FOR UPDATE TO authenticated
  USING (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "events_auth_delete" ON events
  FOR DELETE TO authenticated
  USING (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    ) AND 
    is_published = false
  );

-- ===== CUSTOMERS TABLE POLICIES =====
-- CORRECTED: customers.id is the user ID (auth.uid())
-- Users can view their own customer record
CREATE POLICY "customers_auth_select_own" ON customers
  FOR SELECT TO authenticated
  USING (id = auth.uid()::text);

-- Users can create their own customer record
CREATE POLICY "customers_auth_insert_own" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid()::text);

-- Users can update their own customer record
CREATE POLICY "customers_auth_update_own" ON customers
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text);

-- ===== REGISTRATIONS TABLE POLICIES =====
-- Users can view their own registrations (customer_id = auth.uid())
CREATE POLICY "registrations_auth_select_own" ON registrations
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid()::text);

-- Users can create their own registrations
CREATE POLICY "registrations_auth_insert_own" ON registrations
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid()::text);

-- Users can update their pending registrations
CREATE POLICY "registrations_auth_update_pending" ON registrations
  FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid()::text AND 
    payment_status = 'pending'
  );

-- Event organizers can view registrations for their events
CREATE POLICY "registrations_auth_select_organizer" ON registrations
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
CREATE POLICY "attendees_auth_select_own" ON attendees
  FOR SELECT TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE customer_id = auth.uid()::text
    )
  );

CREATE POLICY "attendees_auth_insert_own" ON attendees
  FOR INSERT TO authenticated
  WITH CHECK (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE customer_id = auth.uid()::text
      AND payment_status = 'pending'
    )
  );

CREATE POLICY "attendees_auth_update_own" ON attendees
  FOR UPDATE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE customer_id = auth.uid()::text
      AND payment_status = 'pending'
    )
  );

CREATE POLICY "attendees_auth_delete_own" ON attendees
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
CREATE POLICY "tickets_auth_select_own" ON tickets
  FOR SELECT TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE customer_id = auth.uid()::text
    )
  );

-- Users can create tickets for their registrations (used by direct insert flow)
CREATE POLICY "tickets_auth_insert_own" ON tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE customer_id = auth.uid()::text
      AND payment_status = 'pending'
    )
  );

-- Event organizers can view all tickets for their events
CREATE POLICY "tickets_auth_select_organizer" ON tickets
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
CREATE POLICY "contacts_auth_select_own" ON contacts
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- Users can create their own contact
CREATE POLICY "contacts_auth_insert_own" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Users can update their own contact
CREATE POLICY "contacts_auth_update_own" ON contacts
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

-- Users can view contacts linked to their customer record
CREATE POLICY "contacts_auth_select_customer_linked" ON contacts
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
CREATE POLICY "event_tickets_public_select" ON event_tickets
  FOR SELECT
  USING (
    event_id IN (
      SELECT event_id FROM events 
      WHERE is_published = true
    )
  );

-- Event organizers can manage ticket types
CREATE POLICY "event_tickets_auth_insert" ON event_tickets
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

CREATE POLICY "event_tickets_auth_update" ON event_tickets
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

CREATE POLICY "event_tickets_auth_delete" ON event_tickets
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
CREATE POLICY "packages_public_select" ON packages
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
CREATE POLICY "packages_auth_insert" ON packages
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

CREATE POLICY "packages_auth_update" ON packages
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
CREATE POLICY "organisations_public_select" ON organisations
  FOR SELECT
  USING (true);

-- Organization members can update their org
CREATE POLICY "organisations_auth_update" ON organisations
  FOR UPDATE TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ===== MASONIC_PROFILES TABLE POLICIES =====
-- Users can manage their own masonic profile
CREATE POLICY "masonic_profiles_auth_select_own" ON masonic_profiles
  FOR SELECT TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "masonic_profiles_auth_insert_own" ON masonic_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "masonic_profiles_auth_update_own" ON masonic_profiles
  FOR UPDATE TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ===== USER_ROLES TABLE POLICIES =====
-- Users can view their own roles
CREATE POLICY "user_roles_auth_select_own" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ===== PUBLIC READ-ONLY TABLES =====
-- These tables contain reference data that should be publicly accessible
CREATE POLICY "lodges_public_select" ON lodges
  FOR SELECT
  USING (true);

CREATE POLICY "grand_lodges_public_select" ON grand_lodges
  FOR SELECT
  USING (true);

CREATE POLICY "locations_public_select" ON locations
  FOR SELECT
  USING (true);

-- Lodge members can update their lodge
CREATE POLICY "lodges_auth_update" ON lodges
  FOR UPDATE TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Authenticated users can create locations
CREATE POLICY "locations_auth_insert" ON locations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Location creators can update
CREATE POLICY "locations_auth_update" ON locations
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
CREATE POLICY "attendee_events_auth_select_own" ON attendee_events
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
CREATE POLICY "memberships_auth_select_own" ON memberships
  FOR SELECT TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "memberships_auth_insert_own" ON memberships
  FOR INSERT TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "memberships_auth_update_own" ON memberships
  FOR UPDATE TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "memberships_auth_delete_own" ON memberships
  FOR DELETE TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ===== GRANT APPROPRIATE PERMISSIONS =====
-- Note: anon role only needs SELECT on public data
-- authenticated role (includes anonymous sessions) needs broader access

-- Public data accessible to everyone
GRANT SELECT ON events TO anon, authenticated;
GRANT SELECT ON organisations TO anon, authenticated;
GRANT SELECT ON event_tickets TO anon, authenticated;
GRANT SELECT ON packages TO anon, authenticated;
GRANT SELECT ON lodges TO anon, authenticated;
GRANT SELECT ON grand_lodges TO anon, authenticated;
GRANT SELECT ON locations TO anon, authenticated;

-- Authenticated users (including anonymous sessions) need more permissions
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

-- Event management tables
GRANT INSERT, UPDATE, DELETE ON events TO authenticated;