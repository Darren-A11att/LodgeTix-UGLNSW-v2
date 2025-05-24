-- RLS Implementation for LodgeTix Registration System
-- This migration implements Row Level Security policies based on the design document

-- Step 1: Enable RLS on all relevant tables
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_ticket_assignments ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies to start fresh
DROP POLICY IF EXISTS "anon_create_registration" ON registrations;
DROP POLICY IF EXISTS "anon_create_customer" ON customers;
DROP POLICY IF EXISTS "anon_create_attendees" ON attendees;
DROP POLICY IF EXISTS "anon_create_tickets" ON tickets;
DROP POLICY IF EXISTS "users_manage_own_registrations" ON registrations;
DROP POLICY IF EXISTS "users_manage_registration_attendees" ON attendees;
DROP POLICY IF EXISTS "users_manage_registration_tickets" ON tickets;
DROP POLICY IF EXISTS "public_view_published_events" ON events;
DROP POLICY IF EXISTS "public_view_ticket_definitions" ON ticket_definitions;

-- ================================================================
-- REGISTRATION POLICIES
-- ================================================================

-- Anonymous users can create registrations
CREATE POLICY "anon_create_registration" ON registrations
FOR INSERT TO anon
WITH CHECK (auth.uid() = customer_id);

-- All authenticated users (including anonymous) can view their own registrations
CREATE POLICY "users_view_own_registrations" ON registrations
FOR SELECT TO authenticated
USING (customer_id = auth.uid());

-- All authenticated users can update their own registrations
CREATE POLICY "users_update_own_registrations" ON registrations
FOR UPDATE TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- ================================================================
-- CUSTOMER POLICIES
-- ================================================================

-- Anonymous users can create customer records for themselves
CREATE POLICY "anon_create_customer" ON customers
FOR INSERT TO anon
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Users can view their own customer record
CREATE POLICY "users_view_own_customer" ON customers
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can update their own customer record
CREATE POLICY "users_update_own_customer" ON customers
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ================================================================
-- ATTENDEE POLICIES
-- ================================================================

-- Anonymous users can create attendees for their registrations
CREATE POLICY "anon_create_attendees" ON attendees
FOR INSERT TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
);

-- Users can view attendees for their registrations
CREATE POLICY "users_view_registration_attendees" ON attendees
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
);

-- Users can update attendees for their registrations
-- This is crucial for lodge registrations where attendees are added later
CREATE POLICY "users_update_registration_attendees" ON attendees
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
);

-- Users can insert new attendees for their registrations (for adding attendees post-registration)
CREATE POLICY "users_insert_registration_attendees" ON attendees
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
);

-- ================================================================
-- TICKET POLICIES
-- ================================================================

-- Anonymous users can create tickets for their registrations
CREATE POLICY "anon_create_tickets" ON tickets
FOR INSERT TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = tickets.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);

-- Users can view tickets for their registrations
CREATE POLICY "users_view_registration_tickets" ON tickets
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = tickets.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);

-- Users can update tickets for their registrations (for reassigning to attendees)
CREATE POLICY "users_update_registration_tickets" ON tickets
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = tickets.registration_id 
    AND registrations.customer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = tickets.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);

-- ================================================================
-- ATTENDEE TICKET ASSIGNMENT POLICIES
-- ================================================================

-- Users can create ticket assignments for their registrations
CREATE POLICY "users_create_ticket_assignments" ON attendee_ticket_assignments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendee_ticket_assignments.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);

-- Users can view ticket assignments for their registrations
CREATE POLICY "users_view_ticket_assignments" ON attendee_ticket_assignments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendee_ticket_assignments.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);

-- Users can update ticket assignments for their registrations
CREATE POLICY "users_update_ticket_assignments" ON attendee_ticket_assignments
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendee_ticket_assignments.registration_id 
    AND registrations.customer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendee_ticket_assignments.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);

-- ================================================================
-- EVENT POLICIES (Public Access)
-- ================================================================

-- Everyone can view published events
CREATE POLICY "public_view_published_events" ON events
FOR SELECT TO anon, authenticated
USING (
  is_published = true 
  AND (
    publish_option = 'public' 
    OR publish_option IS NULL
  )
);

-- ================================================================
-- TICKET DEFINITION POLICIES (Public Access)
-- ================================================================

-- Everyone can view ticket definitions for published events
CREATE POLICY "public_view_ticket_definitions" ON ticket_definitions
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = ticket_definitions.event_id
    AND events.is_published = true
  )
);

-- ================================================================
-- GRANT NECESSARY PERMISSIONS
-- ================================================================

-- Grant permissions to anonymous users
GRANT INSERT ON registrations TO anon;
GRANT INSERT ON customers TO anon;
GRANT INSERT ON attendees TO anon;
GRANT INSERT ON tickets TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON ticket_definitions TO anon;

-- Grant permissions to authenticated users (includes converted anonymous users)
GRANT ALL ON registrations TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON attendees TO authenticated;
GRANT ALL ON tickets TO authenticated;
GRANT ALL ON attendee_ticket_assignments TO authenticated;
GRANT SELECT ON events TO authenticated;
GRANT SELECT ON ticket_definitions TO authenticated;

-- ================================================================
-- NOTES FOR IMPLEMENTATION
-- ================================================================

-- 1. API routes that need to be updated to use user auth instead of service role:
--    - POST /api/registrations (create registration)
--    - GET /api/registrations/[id] (view registration)
--    
-- 2. API routes that should continue using service role:
--    - PUT /api/registrations/[id]/payment (webhook from Stripe)
--    - POST /api/send-confirmation-email (system emails)
--    - GET /api/check-tables (system diagnostics)
--
-- 3. Future considerations:
--    - Add role-based policies for lodge_secretary, event_organizer roles
--    - Add policies for viewing registrations within same lodge
--    - Add policies for event organizers to view their event registrations