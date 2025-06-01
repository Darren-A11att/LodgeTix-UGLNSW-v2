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
-- Anonymous users can view published events
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

-- Event organizers can insert events for their organization
CREATE POLICY "events_auth_insert" ON events
  FOR INSERT TO authenticated
  WITH CHECK (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Event organizers can update their events
CREATE POLICY "events_auth_update" ON events
  FOR UPDATE TO authenticated
  USING (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Event organizers can delete their unpublished events
CREATE POLICY "events_auth_delete" ON events
  FOR DELETE TO authenticated
  USING (
    organiser_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    ) AND is_published = false
  );

-- ===== REGISTRATIONS TABLE POLICIES =====
-- Users can view their own registrations
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

-- Users can create registrations for themselves
CREATE POLICY "registrations_auth_insert" ON registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Anonymous users can create registrations (for guest checkout)
CREATE POLICY "registrations_anon_insert" ON registrations
  FOR INSERT TO anon
  WITH CHECK (true);

-- Users can update their pending registrations
CREATE POLICY "registrations_auth_update_own" ON registrations
  FOR UPDATE TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    ) AND payment_status = 'pending'
  );

-- ===== TICKETS TABLE POLICIES =====
-- Users can view tickets for their registrations
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

-- Tickets can only be created through service role (via RPCs)
-- No INSERT/UPDATE/DELETE policies for regular users

-- ===== ATTENDEES TABLE POLICIES =====
-- Users can view attendees for their registrations
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

-- Users can insert attendees for their registrations
CREATE POLICY "attendees_auth_insert_own" ON attendees
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

-- Users can update attendees for their pending registrations
CREATE POLICY "attendees_auth_update_own" ON attendees
  FOR UPDATE TO authenticated
  USING (
    registration_id IN (
      SELECT registration_id FROM registrations
      WHERE contact_id IN (
        SELECT contact_id FROM contacts 
        WHERE auth_user_id = auth.uid()
      ) AND payment_status = 'pending'
    )
  );

-- Users can delete attendees for their pending registrations
CREATE POLICY "attendees_auth_delete_own" ON attendees
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
-- Users can view their own contact info
CREATE POLICY "contacts_auth_select_own" ON contacts
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- Users can update their own contact info
CREATE POLICY "contacts_auth_update_own" ON contacts
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

-- Anonymous users can create contacts (for guest checkout)
CREATE POLICY "contacts_anon_insert" ON contacts
  FOR INSERT TO anon
  WITH CHECK (auth_user_id IS NULL);

-- Users can create their own contact on signup
CREATE POLICY "contacts_auth_insert_own" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- ===== ORGANISATIONS TABLE POLICIES =====
-- Public can view all organizations
CREATE POLICY "organisations_public_select" ON organisations
  FOR SELECT TO anon, authenticated
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
-- Users can view their own masonic profile
CREATE POLICY "masonic_profiles_auth_select_own" ON masonic_profiles
  FOR SELECT TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Users can insert their own masonic profile
CREATE POLICY "masonic_profiles_auth_insert_own" ON masonic_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own masonic profile
CREATE POLICY "masonic_profiles_auth_update_own" ON masonic_profiles
  FOR UPDATE TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ===== EVENT_TICKETS TABLE POLICIES =====
-- Public can view ticket types for published events
CREATE POLICY "event_tickets_public_select" ON event_tickets
  FOR SELECT TO anon, authenticated
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
  FOR SELECT TO anon, authenticated
  USING (
    event_id IN (
      SELECT event_id FROM events 
      WHERE is_published = true
    ) OR parent_event_id IN (
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

-- ===== USER_ROLES TABLE POLICIES =====
-- Users can view their own roles
CREATE POLICY "user_roles_auth_select_own" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Only service role can manage user roles (no policies for INSERT/UPDATE/DELETE)

-- ===== LODGES TABLE POLICIES =====
-- Public can view all lodges
CREATE POLICY "lodges_public_select" ON lodges
  FOR SELECT TO anon, authenticated
  USING (true);

-- Lodge admins can update their lodge
CREATE POLICY "lodges_auth_update" ON lodges
  FOR UPDATE TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ===== GRAND_LODGES TABLE POLICIES =====
-- Public can view all grand lodges
CREATE POLICY "grand_lodges_public_select" ON grand_lodges
  FOR SELECT TO anon, authenticated
  USING (true);

-- ===== LOCATIONS TABLE POLICIES =====
-- Public can view all locations
CREATE POLICY "locations_public_select" ON locations
  FOR SELECT TO anon, authenticated
  USING (true);

-- Event organizers can create locations
CREATE POLICY "locations_auth_insert" ON locations
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Any authenticated user can create a location

-- Location creators can update their locations
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
-- Users can view their attendee events
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
-- Users can view their own memberships
CREATE POLICY "memberships_auth_select_own" ON memberships
  FOR SELECT TO authenticated
  USING (
    contact_id IN (
      SELECT contact_id FROM contacts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Users can manage their own memberships
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

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT ON events TO anon;
GRANT SELECT, INSERT ON registrations TO anon;
GRANT SELECT, INSERT ON contacts TO anon;
GRANT SELECT ON organisations TO anon;
GRANT SELECT ON event_tickets TO anon;
GRANT SELECT ON packages TO anon;
GRANT SELECT ON lodges TO anon;
GRANT SELECT ON grand_lodges TO anon;
GRANT SELECT ON locations TO anon;

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