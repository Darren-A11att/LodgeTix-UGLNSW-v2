-- SECURE RLS POLICIES FOR LODGETIX
-- Version 2: Fixed security issues - anonymous users have minimal access

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
-- Anonymous users can ONLY view published events
CREATE POLICY "events_anon_select_published" ON events
  FOR SELECT TO anon
  USING (is_published = true);

-- Authenticated users can view published events and their organization's events
CREATE POLICY "events_auth_select" ON events
  FOR SELECT TO authenticated
  USING (
    is_published = true OR
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ONLY authenticated organizers can create events
CREATE POLICY "events_auth_insert_organizers" ON events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'organizer')
    ) AND
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ONLY authenticated organizers can update their own events
CREATE POLICY "events_auth_update_own" ON events
  FOR UPDATE TO authenticated
  USING (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ONLY authenticated organizers can delete their own unpublished events
CREATE POLICY "events_auth_delete_unpublished" ON events
  FOR DELETE TO authenticated
  USING (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    ) AND 
    is_published = false
  );

-- ===== REGISTRATIONS TABLE POLICIES =====
-- Anonymous users can ONLY create registrations (guest checkout)
CREATE POLICY "registrations_anon_insert_only" ON registrations
  FOR INSERT TO anon
  WITH CHECK (true);

-- Authenticated users can view their own registrations
CREATE POLICY "registrations_auth_select_own" ON registrations
  FOR SELECT TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
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

-- Authenticated users can create their own registrations
CREATE POLICY "registrations_auth_insert_own" ON registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Authenticated users can update only their pending registrations
CREATE POLICY "registrations_auth_update_pending" ON registrations
  FOR UPDATE TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    ) AND 
    payment_status = 'pending'
  )
  WITH CHECK (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    ) AND 
    payment_status = 'pending'
  );

-- ===== TICKETS TABLE POLICIES =====
-- Anonymous users have NO access to tickets
-- Authenticated users can only view tickets (no direct modifications)
CREATE POLICY "tickets_auth_select_own" ON tickets
  FOR SELECT TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id IN (
        SELECT contact_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
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

-- ===== ATTENDEES TABLE POLICIES =====
-- Anonymous users have NO access to attendees
-- Authenticated users can view their own attendees
CREATE POLICY "attendees_auth_select_own" ON attendees
  FOR SELECT TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id IN (
        SELECT contact_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Authenticated users can create attendees for pending registrations
CREATE POLICY "attendees_auth_insert_pending" ON attendees
  FOR INSERT TO authenticated
  WITH CHECK (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id IN (
        SELECT contact_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      ) AND payment_status = 'pending'
    )
  );

-- Authenticated users can update attendees for pending registrations
CREATE POLICY "attendees_auth_update_pending" ON attendees
  FOR UPDATE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id IN (
        SELECT contact_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      ) AND payment_status = 'pending'
    )
  )
  WITH CHECK (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id IN (
        SELECT contact_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      ) AND payment_status = 'pending'
    )
  );

-- Authenticated users can delete attendees for pending registrations
CREATE POLICY "attendees_auth_delete_pending" ON attendees
  FOR DELETE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id IN (
        SELECT contact_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      ) AND payment_status = 'pending'
    )
  );

-- ===== CONTACTS TABLE POLICIES =====
-- Anonymous users can ONLY create contacts (guest checkout)
CREATE POLICY "contacts_anon_insert_only" ON contacts
  FOR INSERT TO anon
  WITH CHECK (auth_user_id IS NULL);

-- Authenticated users can view their own contact
CREATE POLICY "contacts_auth_select_own" ON contacts
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- Authenticated users can create their own contact on signup
CREATE POLICY "contacts_auth_insert_own" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Authenticated users can update their own contact
CREATE POLICY "contacts_auth_update_own" ON contacts
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ===== ORGANISATIONS TABLE POLICIES =====
-- Everyone can view organizations (public data)
CREATE POLICY "organisations_public_select" ON organisations
  FOR SELECT USING (true);

-- ONLY authenticated organization members can update
CREATE POLICY "organisations_auth_update_members" ON organisations
  FOR UPDATE TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ===== MASONIC_PROFILES TABLE POLICIES =====
-- Anonymous users have NO access
-- Authenticated users can view their own profile
CREATE POLICY "masonic_profiles_auth_select_own" ON masonic_profiles
  FOR SELECT TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Authenticated users can create their own profile
CREATE POLICY "masonic_profiles_auth_insert_own" ON masonic_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Authenticated users can update their own profile
CREATE POLICY "masonic_profiles_auth_update_own" ON masonic_profiles
  FOR UPDATE TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ===== EVENT_TICKETS TABLE POLICIES =====
-- Anonymous users can view ticket types for published events
CREATE POLICY "event_tickets_anon_select_published" ON event_tickets
  FOR SELECT TO anon
  USING (
    event_id IN (
      SELECT event_id FROM events 
      WHERE is_published = true
    )
  );

-- Authenticated users can view all ticket types they're authorized for
CREATE POLICY "event_tickets_auth_select" ON event_tickets
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM events 
      WHERE is_published = true
    ) OR
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ONLY event organizers can manage ticket types
CREATE POLICY "event_tickets_auth_insert_organizers" ON event_tickets
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

CREATE POLICY "event_tickets_auth_update_organizers" ON event_tickets
  FOR UPDATE TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "event_tickets_auth_delete_organizers" ON event_tickets
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
-- Anonymous users can view packages for published events
CREATE POLICY "packages_anon_select_published" ON packages
  FOR SELECT TO anon
  USING (
    event_id IN (
      SELECT event_id FROM events 
      WHERE is_published = true
    ) OR parent_event_id IN (
      SELECT event_id FROM events 
      WHERE is_published = true
    )
  );

-- Authenticated users can view packages they're authorized for
CREATE POLICY "packages_auth_select" ON packages
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM events 
      WHERE is_published = true
    ) OR
    parent_event_id IN (
      SELECT event_id FROM events 
      WHERE is_published = true
    ) OR
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ONLY event organizers can manage packages
CREATE POLICY "packages_auth_insert_organizers" ON packages
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

CREATE POLICY "packages_auth_update_organizers" ON packages
  FOR UPDATE TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT event_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ===== USER_ROLES TABLE POLICIES =====
-- Anonymous users have NO access
-- Users can only view their own roles
CREATE POLICY "user_roles_auth_select_own" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ===== PUBLIC READ-ONLY TABLES =====
-- Lodges, Grand Lodges, and Locations are public read
CREATE POLICY "lodges_public_select" ON lodges
  FOR SELECT USING (true);

CREATE POLICY "grand_lodges_public_select" ON grand_lodges
  FOR SELECT USING (true);

CREATE POLICY "locations_public_select" ON locations
  FOR SELECT USING (true);

-- Lodge members can update their lodge
CREATE POLICY "lodges_auth_update_members" ON lodges
  FOR UPDATE TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Authenticated users can create locations
CREATE POLICY "locations_auth_insert" ON locations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Location creators/users can update
CREATE POLICY "locations_auth_update_users" ON locations
  FOR UPDATE TO authenticated
  USING (
    location_id IN (
      SELECT location_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    location_id IN (
      SELECT location_id FROM events
      WHERE organiser_id IN (
        SELECT organisation_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ===== ATTENDEE_EVENTS TABLE POLICIES =====
-- Anonymous users have NO access
-- Users can view their own attendee events
CREATE POLICY "attendee_events_auth_select_own" ON attendee_events
  FOR SELECT TO authenticated
  USING (
    attendee_id IN (
      SELECT attendee_id FROM attendees
      WHERE registration_id IN (
        SELECT registration_id FROM registrations
        WHERE contact_id IN (
          SELECT contact_id FROM contacts 
          WHERE auth_user_id = auth.uid()
        )
      )
    )
  );

-- ===== MEMBERSHIPS TABLE POLICIES =====
-- Anonymous users have NO access
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
  )
  WITH CHECK (
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

-- ===== GRANT MINIMAL PERMISSIONS =====
-- Anonymous users get very limited access
GRANT SELECT ON events TO anon;
GRANT INSERT ON registrations TO anon;
GRANT INSERT ON contacts TO anon;
GRANT SELECT ON organisations TO anon;
GRANT SELECT ON event_tickets TO anon;
GRANT SELECT ON packages TO anon;
GRANT SELECT ON lodges TO anon;
GRANT SELECT ON grand_lodges TO anon;
GRANT SELECT ON locations TO anon;

-- Authenticated users get appropriate access
GRANT ALL ON events TO authenticated;
GRANT ALL ON registrations TO authenticated;
GRANT SELECT ON tickets TO authenticated;
GRANT ALL ON attendees TO authenticated;
GRANT ALL ON contacts TO authenticated;
GRANT SELECT, UPDATE ON organisations TO authenticated;
GRANT ALL ON masonic_profiles TO authenticated;
GRANT ALL ON event_tickets TO authenticated;
GRANT ALL ON packages TO authenticated;
GRANT SELECT ON user_roles TO authenticated;
GRANT SELECT, UPDATE ON lodges TO authenticated;
GRANT SELECT ON grand_lodges TO authenticated;
GRANT ALL ON locations TO authenticated;
GRANT SELECT ON attendee_events TO authenticated;
GRANT ALL ON memberships TO authenticated;

-- Service role has full access (bypasses RLS)