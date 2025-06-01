-- Test scenarios for RLS policies
-- This file contains SQL queries to test different access scenarios

-- ===== TEST SETUP =====
-- Create test users and data to verify RLS policies work correctly

-- Test Case 1: Anonymous User Access
-- Expected: Can only view published events, can create registrations/contacts
/*
-- As anonymous user:
SELECT * FROM events; -- Should only see published events
SELECT * FROM event_tickets; -- Should only see tickets for published events
SELECT * FROM packages; -- Should only see packages for published events
INSERT INTO contacts (first_name, last_name, email) VALUES ('Guest', 'User', 'guest@example.com'); -- Should succeed
INSERT INTO registrations (contact_id, event_id) VALUES (...); -- Should succeed
*/

-- Test Case 2: Authenticated User - Regular Attendee
-- Expected: Can view/manage own data, view published events
/*
-- As authenticated user (regular attendee):
SELECT * FROM contacts WHERE auth_user_id = auth.uid(); -- Should see own contact
SELECT * FROM registrations WHERE contact_id = (SELECT contact_id FROM contacts WHERE auth_user_id = auth.uid()); -- Should see own registrations
SELECT * FROM tickets WHERE registration_id IN (SELECT registration_id FROM registrations WHERE contact_id = (SELECT contact_id FROM contacts WHERE auth_user_id = auth.uid())); -- Should see own tickets
UPDATE contacts SET phone = '+1234567890' WHERE auth_user_id = auth.uid(); -- Should succeed
INSERT INTO registrations (contact_id, event_id) VALUES ((SELECT contact_id FROM contacts WHERE auth_user_id = auth.uid()), 'event-uuid'); -- Should succeed
*/

-- Test Case 3: Event Organizer Access
-- Expected: Can manage own events and view all registrations for them
/*
-- As event organizer:
SELECT * FROM events WHERE organiser_id IN (SELECT organisation_id FROM contacts WHERE auth_user_id = auth.uid()); -- Should see own org's events
INSERT INTO events (name, organiser_id) VALUES ('New Event', (SELECT organisation_id FROM contacts WHERE auth_user_id = auth.uid())); -- Should succeed
UPDATE events SET name = 'Updated Event' WHERE organiser_id IN (SELECT organisation_id FROM contacts WHERE auth_user_id = auth.uid()); -- Should succeed
SELECT * FROM registrations WHERE event_id IN (SELECT event_id FROM events WHERE organiser_id IN (SELECT organisation_id FROM contacts WHERE auth_user_id = auth.uid())); -- Should see all registrations for own events
SELECT * FROM tickets WHERE event_id IN (SELECT event_id FROM events WHERE organiser_id IN (SELECT organisation_id FROM contacts WHERE auth_user_id = auth.uid())); -- Should see all tickets for own events
*/

-- Test Case 4: Lodge Member Access
-- Expected: Can view lodge info, create lodge registrations
/*
-- As lodge member:
SELECT * FROM organisations WHERE organisation_id IN (SELECT organisation_id FROM contacts WHERE auth_user_id = auth.uid()); -- Should see own org
SELECT * FROM lodges WHERE organisation_id IN (SELECT organisation_id FROM contacts WHERE auth_user_id = auth.uid()); -- Should see own lodge
INSERT INTO registrations (contact_id, event_id, organisation_id, registration_type) VALUES (..., ..., (SELECT organisation_id FROM contacts WHERE auth_user_id = auth.uid()), 'lodge'); -- Should succeed for lodge registration
*/

-- Test Case 5: Payment Status Restrictions
-- Expected: Can only modify registrations/attendees when payment is pending
/*
-- As user with completed payment:
UPDATE registrations SET total_amount = 0 WHERE contact_id = (SELECT contact_id FROM contacts WHERE auth_user_id = auth.uid()) AND payment_status = 'completed'; -- Should fail
UPDATE attendees SET first_name = 'Changed' WHERE registration_id IN (SELECT registration_id FROM registrations WHERE payment_status = 'completed'); -- Should fail

-- As user with pending payment:
UPDATE registrations SET total_amount = 100 WHERE contact_id = (SELECT contact_id FROM contacts WHERE auth_user_id = auth.uid()) AND payment_status = 'pending'; -- Should succeed
UPDATE attendees SET first_name = 'Changed' WHERE registration_id IN (SELECT registration_id FROM registrations WHERE payment_status = 'pending'); -- Should succeed
*/

-- ===== VERIFICATION QUERIES =====
-- Run these to verify RLS is enabled and policies exist

-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'registrations', 'tickets', 'attendees', 'contacts', 'organisations', 'masonic_profiles', 'event_tickets', 'packages', 'user_roles', 'lodges', 'grand_lodges', 'locations', 'attendee_events', 'memberships')
ORDER BY tablename;

-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ===== DEBUGGING QUERIES =====
-- Use these to debug access issues

-- Check current user and role
SELECT current_user, current_role;

-- Check if user has a contact record
SELECT * FROM contacts WHERE auth_user_id = auth.uid();

-- Test helper functions
SELECT auth.get_user_contact_id();
SELECT auth.get_user_organisation_ids();
SELECT auth.is_event_organizer('some-event-uuid');
SELECT auth.owns_registration('some-registration-uuid');

-- ===== ROLLBACK SCRIPT =====
-- In case you need to disable RLS (NOT for production!)
/*
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendees DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE organisations DISABLE ROW LEVEL SECURITY;
ALTER TABLE masonic_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE lodges DISABLE ROW LEVEL SECURITY;
ALTER TABLE grand_lodges DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;

-- Drop all policies (be careful!)
DROP POLICY IF EXISTS "events_anon_select_published" ON events;
-- ... (would need to list all policies)
*/