-- Add RLS policies for public read-only access to multiple tables
-- This migration creates policies that allow anonymous users to view data but no modifications

-- Enable RLS on all required tables (if not already enabled)
ALTER TABLE grand_lodges ENABLE ROW LEVEL SECURITY;
ALTER TABLE lodges ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to ensure clean state
-- grand_lodges
DROP POLICY IF EXISTS "grand_lodges_public_select" ON grand_lodges;
DROP POLICY IF EXISTS "grand_lodges_auth_insert" ON grand_lodges;
DROP POLICY IF EXISTS "grand_lodges_auth_update" ON grand_lodges;
DROP POLICY IF EXISTS "grand_lodges_auth_delete" ON grand_lodges;

-- lodges
DROP POLICY IF EXISTS "lodges_public_select" ON lodges;
DROP POLICY IF EXISTS "lodges_auth_insert" ON lodges;
DROP POLICY IF EXISTS "lodges_auth_update" ON lodges;
DROP POLICY IF EXISTS "lodges_auth_delete" ON lodges;

-- organisations
DROP POLICY IF EXISTS "organisations_public_select" ON organisations;
DROP POLICY IF EXISTS "organisations_auth_insert" ON organisations;
DROP POLICY IF EXISTS "organisations_auth_update" ON organisations;
DROP POLICY IF EXISTS "organisations_auth_delete" ON organisations;

-- functions
DROP POLICY IF EXISTS "functions_public_select" ON functions;
DROP POLICY IF EXISTS "functions_auth_insert" ON functions;
DROP POLICY IF EXISTS "functions_auth_update" ON functions;
DROP POLICY IF EXISTS "functions_auth_delete" ON functions;

-- events
DROP POLICY IF EXISTS "events_public_select" ON events;
DROP POLICY IF EXISTS "events_auth_insert" ON events;
DROP POLICY IF EXISTS "events_auth_update" ON events;
DROP POLICY IF EXISTS "events_auth_delete" ON events;

-- event_tickets
DROP POLICY IF EXISTS "event_tickets_public_select" ON event_tickets;
DROP POLICY IF EXISTS "event_tickets_auth_insert" ON event_tickets;
DROP POLICY IF EXISTS "event_tickets_auth_update" ON event_tickets;
DROP POLICY IF EXISTS "event_tickets_auth_delete" ON event_tickets;

-- packages
DROP POLICY IF EXISTS "packages_public_select" ON packages;
DROP POLICY IF EXISTS "packages_auth_insert" ON packages;
DROP POLICY IF EXISTS "packages_auth_update" ON packages;
DROP POLICY IF EXISTS "packages_auth_delete" ON packages;

-- ===== GRAND_LODGES TABLE POLICIES =====
-- Allow public SELECT on all grand_lodges
CREATE POLICY "grand_lodges_public_select" ON grand_lodges
  FOR SELECT
  TO public
  USING (true);

-- ===== LODGES TABLE POLICIES =====
-- Allow public SELECT on all lodges
CREATE POLICY "lodges_public_select" ON lodges
  FOR SELECT
  TO public
  USING (true);

-- ===== ORGANISATIONS TABLE POLICIES =====
-- Allow public SELECT on all organisations
CREATE POLICY "organisations_public_select" ON organisations
  FOR SELECT
  TO public
  USING (true);

-- ===== FUNCTIONS TABLE POLICIES =====
-- Allow public SELECT on all functions
CREATE POLICY "functions_public_select" ON functions
  FOR SELECT
  TO public
  USING (true);

-- ===== EVENTS TABLE POLICIES =====
-- Allow public SELECT on all events
CREATE POLICY "events_public_select" ON events
  FOR SELECT
  TO public
  USING (true);

-- ===== EVENT_TICKETS TABLE POLICIES =====
-- Allow public SELECT on all event_tickets
CREATE POLICY "event_tickets_public_select" ON event_tickets
  FOR SELECT
  TO public
  USING (true);

-- ===== PACKAGES TABLE POLICIES =====
-- Allow public SELECT on all packages
CREATE POLICY "packages_public_select" ON packages
  FOR SELECT
  TO public
  USING (true);

-- ===== VIEW POLICIES =====
-- Enable RLS on views (if not already enabled)
ALTER VIEW function_packages_view SET (security_invoker = true);
ALTER VIEW function_event_tickets_view SET (security_invoker = true);

-- Note: Views with security_invoker = true will use the permissions of the
-- user querying the view, inheriting the RLS policies from the underlying tables.
-- Since we've enabled public SELECT on all base tables above, the views will
-- also be accessible to public/anon users.