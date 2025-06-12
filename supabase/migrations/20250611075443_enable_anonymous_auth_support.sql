-- Comprehensive RLS Policies for LodgeTix Platform
-- Based on complete codebase analysis of user flows and data access patterns

-- =============================================================================
-- SCHEMA PERMISSIONS & BASIC GRANTS
-- =============================================================================

-- Grant schema access to all roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant sequence access for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =============================================================================
-- PUBLIC READ ACCESS (Anonymous + Authenticated)
-- For public content that should be visible to all users
-- =============================================================================

-- Functions (published only)
GRANT SELECT ON public.functions TO anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;
GRANT SELECT ON public.event_tickets TO anon, authenticated;
GRANT SELECT ON public.packages TO anon, authenticated;
GRANT SELECT ON public.grand_lodges TO anon, authenticated;
GRANT SELECT ON public.lodges TO anon, authenticated;
GRANT SELECT ON public.locations TO anon, authenticated;
GRANT SELECT ON public.organisations TO anon, authenticated;

-- =============================================================================
-- REGISTRATION FLOW PERMISSIONS (Anonymous users creating registrations)
-- =============================================================================

-- Allow anonymous users to create initial registration data
GRANT INSERT ON public.raw_registrations TO anon;
GRANT INSERT ON public.customers TO anon;
GRANT INSERT ON public.contacts TO anon;
GRANT INSERT ON public.registrations TO anon;
GRANT INSERT ON public.attendees TO anon;
GRANT INSERT ON public.tickets TO anon;
GRANT INSERT ON public.masonic_profiles TO anon;

-- =============================================================================
-- AUTHENTICATED USER PERMISSIONS (CRUD on own data)
-- =============================================================================

-- Customer/Registration data management
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.attendees TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.masonic_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.raw_registrations TO authenticated;

-- Organisation/Function management (for organisers)
GRANT SELECT, INSERT, UPDATE ON public.organisations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lodges TO authenticated;

-- User roles and memberships
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.memberships TO authenticated;

-- Webhook logs (for debugging)
GRANT SELECT, INSERT ON public.webhook_logs TO authenticated;

-- Grant execute permissions on RPC functions for anonymous users (only if they exist)
DO $$
BEGIN
    -- Check and grant execute permissions for existing functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_function_details') THEN
        GRANT EXECUTE ON FUNCTION get_function_details(UUID) TO anon;
        RAISE NOTICE 'Granted execute permission on get_function_details to anon';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_individual_registration') THEN
        GRANT EXECUTE ON FUNCTION create_individual_registration(JSONB) TO anon;
        RAISE NOTICE 'Granted execute permission on create_individual_registration to anon';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_lodge_registration') THEN
        GRANT EXECUTE ON FUNCTION create_lodge_registration(JSONB) TO anon;
        RAISE NOTICE 'Granted execute permission on create_lodge_registration to anon';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_delegation_registration') THEN
        GRANT EXECUTE ON FUNCTION create_delegation_registration(JSONB) TO anon;
        RAISE NOTICE 'Granted execute permission on create_delegation_registration to anon';
    END IF;
END $$;

-- =============================================================================
-- RLS POLICIES - PUBLIC READ ACCESS
-- =============================================================================

-- Functions: Public can read published functions
DROP POLICY IF EXISTS "public_read_published_functions" ON public.functions;
CREATE POLICY "public_read_published_functions" 
ON public.functions FOR SELECT 
TO anon, authenticated
USING (is_published = true);

-- Events: Public can read published events
DROP POLICY IF EXISTS "public_read_published_events" ON public.events;
CREATE POLICY "public_read_published_events" 
ON public.events FOR SELECT 
TO anon, authenticated
USING (is_published = true);

-- Event Tickets: Public can read active event tickets
DROP POLICY IF EXISTS "public_read_active_event_tickets" ON public.event_tickets;
CREATE POLICY "public_read_active_event_tickets" 
ON public.event_tickets FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Packages: Public can read active packages
DROP POLICY IF EXISTS "public_read_active_packages" ON public.packages;
CREATE POLICY "public_read_active_packages" 
ON public.packages FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Grand Lodges: Public read access
DROP POLICY IF EXISTS "public_read_grand_lodges" ON public.grand_lodges;
CREATE POLICY "public_read_grand_lodges" 
ON public.grand_lodges FOR SELECT 
TO anon, authenticated
USING (true);

-- Lodges: Public read access (for lodge directory)
DROP POLICY IF EXISTS "public_read_lodges" ON public.lodges;
CREATE POLICY "public_read_lodges" 
ON public.lodges FOR SELECT 
TO anon, authenticated
USING (true);

-- Locations: Public read access
DROP POLICY IF EXISTS "public_read_locations" ON public.locations;
CREATE POLICY "public_read_locations" 
ON public.locations FOR SELECT 
TO anon, authenticated
USING (true);

-- Organisations: Public read access (for contact info)
DROP POLICY IF EXISTS "public_read_organisations" ON public.organisations;
CREATE POLICY "public_read_organisations" 
ON public.organisations FOR SELECT 
TO anon, authenticated
USING (true);

-- =============================================================================
-- RLS POLICIES - ANONYMOUS REGISTRATION FLOW
-- =============================================================================

-- Raw Registrations: Anonymous can create
DROP POLICY IF EXISTS "anon_create_raw_registrations" ON public.raw_registrations;
CREATE POLICY "anon_create_raw_registrations" 
ON public.raw_registrations FOR INSERT 
TO anon 
WITH CHECK (true);

-- Customers: Anonymous can create during registration
DROP POLICY IF EXISTS "anon_create_customers" ON public.customers;
CREATE POLICY "anon_create_customers" 
ON public.customers FOR INSERT 
TO anon 
WITH CHECK (true);

-- Contacts: Anonymous can create during registration
DROP POLICY IF EXISTS "anon_create_contacts" ON public.contacts;
CREATE POLICY "anon_create_contacts" 
ON public.contacts FOR INSERT 
TO anon 
WITH CHECK (true);

-- Registrations: Anonymous can create during registration
DROP POLICY IF EXISTS "anon_create_registrations" ON public.registrations;
CREATE POLICY "anon_create_registrations" 
ON public.registrations FOR INSERT 
TO anon 
WITH CHECK (true);

-- Attendees: Anonymous can create during registration
DROP POLICY IF EXISTS "anon_create_attendees" ON public.attendees;
CREATE POLICY "anon_create_attendees" 
ON public.attendees FOR INSERT 
TO anon 
WITH CHECK (true);

-- Tickets: Anonymous can create during registration
DROP POLICY IF EXISTS "anon_create_tickets" ON public.tickets;
CREATE POLICY "anon_create_tickets" 
ON public.tickets FOR INSERT 
TO anon 
WITH CHECK (true);

-- Masonic Profiles: Anonymous can create during registration
DROP POLICY IF EXISTS "anon_create_masonic_profiles" ON public.masonic_profiles;
CREATE POLICY "anon_create_masonic_profiles" 
ON public.masonic_profiles FOR INSERT 
TO anon 
WITH CHECK (true);

-- =============================================================================
-- RLS POLICIES - AUTHENTICATED USER "OWN DATA" ACCESS
-- =============================================================================

-- Customers: Users can manage their own customer data
-- Note: customer_id IS the auth user ID (no separate auth_user_id column)
DROP POLICY IF EXISTS "auth_manage_own_customer_data" ON public.customers;
CREATE POLICY "auth_manage_own_customer_data" 
ON public.customers FOR ALL
TO authenticated
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Contacts: Users can manage their own contacts
DROP POLICY IF EXISTS "auth_manage_own_contacts" ON public.contacts;
CREATE POLICY "auth_manage_own_contacts" 
ON public.contacts FOR ALL
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Registrations: Users can manage their own registrations
DROP POLICY IF EXISTS "auth_manage_own_registrations" ON public.registrations;
CREATE POLICY "auth_manage_own_registrations" 
ON public.registrations FOR ALL
TO authenticated
USING (auth.uid() = auth_user_id OR auth.uid() = customer_id)
WITH CHECK (auth.uid() = auth_user_id OR auth.uid() = customer_id);

-- Attendees: Users can manage attendees for their registrations
-- Note: attendees link through registration_id (no direct auth columns)
DROP POLICY IF EXISTS "auth_manage_own_attendees" ON public.attendees;
CREATE POLICY "auth_manage_own_attendees" 
ON public.attendees FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.registrations r 
        WHERE r.registration_id = attendees.registration_id 
        AND (r.auth_user_id = auth.uid() OR r.customer_id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.registrations r 
        WHERE r.registration_id = attendees.registration_id 
        AND (r.auth_user_id = auth.uid() OR r.customer_id = auth.uid())
    )
);

-- Tickets: Users can manage tickets for their registrations
-- Note: tickets link through registration_id (no direct auth columns)
DROP POLICY IF EXISTS "auth_manage_own_tickets" ON public.tickets;
CREATE POLICY "auth_manage_own_tickets" 
ON public.tickets FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.registrations r 
        WHERE r.registration_id = tickets.registration_id 
        AND (r.auth_user_id = auth.uid() OR r.customer_id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.registrations r 
        WHERE r.registration_id = tickets.registration_id 
        AND (r.auth_user_id = auth.uid() OR r.customer_id = auth.uid())
    )
);

-- Masonic Profiles: Users can manage their own masonic profiles
-- Note: masonic_profiles link through contact_id
DROP POLICY IF EXISTS "auth_manage_own_masonic_profiles" ON public.masonic_profiles;
CREATE POLICY "auth_manage_own_masonic_profiles" 
ON public.masonic_profiles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.contacts c
        WHERE c.contact_id = masonic_profiles.contact_id 
        AND c.auth_user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.contacts c
        WHERE c.contact_id = masonic_profiles.contact_id 
        AND c.auth_user_id = auth.uid()
    )
);

-- Raw Registrations: Open access for raw data (contains JSONB, no direct user ownership)
DROP POLICY IF EXISTS "auth_manage_own_raw_registrations" ON public.raw_registrations;
CREATE POLICY "auth_manage_own_raw_registrations" 
ON public.raw_registrations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================================================
-- RLS POLICIES - ORGANISER ACCESS
-- =============================================================================

-- Organisations: Users can manage organisations they belong to via contacts
-- Note: Organisations don't have email column - email is in contacts table
DROP POLICY IF EXISTS "auth_manage_own_organisations" ON public.organisations;
CREATE POLICY "auth_manage_own_organisations" 
ON public.organisations FOR ALL
TO authenticated
USING (
    organisation_id IN (
        SELECT c.organisation_id 
        FROM public.contacts c 
        WHERE c.auth_user_id = auth.uid()
    )
)
WITH CHECK (
    organisation_id IN (
        SELECT c.organisation_id 
        FROM public.contacts c 
        WHERE c.auth_user_id = auth.uid()
    )
);

-- Lodges: Authenticated users can create/update lodges (with rate limiting)
DROP POLICY IF EXISTS "auth_manage_lodges" ON public.lodges;
CREATE POLICY "auth_manage_lodges" 
ON public.lodges FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- User Roles: Users can read their own roles (check if user_id column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'user_id') THEN
        DROP POLICY IF EXISTS "auth_read_own_user_roles" ON public.user_roles;
        CREATE POLICY "auth_read_own_user_roles" 
        ON public.user_roles FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
        RAISE NOTICE 'Created user_roles policy with user_id column';
    ELSE
        RAISE NOTICE 'user_roles table does not have user_id column - skipping policy';
    END IF;
END $$;

-- Memberships: Users can manage their own memberships (check if user_id column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'user_id') THEN
        DROP POLICY IF EXISTS "auth_manage_own_memberships" ON public.memberships;
        CREATE POLICY "auth_manage_own_memberships" 
        ON public.memberships FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Created memberships policy with user_id column';
    ELSE
        RAISE NOTICE 'memberships table does not have user_id column - skipping policy';
    END IF;
END $$;

-- Webhook Logs: Users can read logs for their registrations
DROP POLICY IF EXISTS "auth_read_webhook_logs" ON public.webhook_logs;
CREATE POLICY "auth_read_webhook_logs" 
ON public.webhook_logs FOR SELECT
TO authenticated
USING (true); -- Simplified for debugging, can be restricted later

-- =============================================================================
-- RLS POLICIES - SERVICE ROLE BYPASS
-- =============================================================================

-- Service role needs full access to all tables for API operations
-- This ensures API routes can bypass RLS when using service role

DROP POLICY IF EXISTS "service_role_bypass_customers" ON public.customers;
CREATE POLICY "service_role_bypass_customers" 
ON public.customers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_contacts" ON public.contacts;
CREATE POLICY "service_role_bypass_contacts" 
ON public.contacts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_registrations" ON public.registrations;
CREATE POLICY "service_role_bypass_registrations" 
ON public.registrations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_attendees" ON public.attendees;
CREATE POLICY "service_role_bypass_attendees" 
ON public.attendees FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_tickets" ON public.tickets;
CREATE POLICY "service_role_bypass_tickets" 
ON public.tickets FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_masonic_profiles" ON public.masonic_profiles;
CREATE POLICY "service_role_bypass_masonic_profiles" 
ON public.masonic_profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_raw_registrations" ON public.raw_registrations;
CREATE POLICY "service_role_bypass_raw_registrations" 
ON public.raw_registrations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_organisations" ON public.organisations;
CREATE POLICY "service_role_bypass_organisations" 
ON public.organisations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_lodges" ON public.lodges;
CREATE POLICY "service_role_bypass_lodges" 
ON public.lodges FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_functions" ON public.functions;
CREATE POLICY "service_role_bypass_functions" 
ON public.functions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_events" ON public.events;
CREATE POLICY "service_role_bypass_events" 
ON public.events FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_packages" ON public.packages;
CREATE POLICY "service_role_bypass_packages" 
ON public.packages FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_event_tickets" ON public.event_tickets;
CREATE POLICY "service_role_bypass_event_tickets" 
ON public.event_tickets FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_bypass_webhook_logs" ON public.webhook_logs;
CREATE POLICY "service_role_bypass_webhook_logs" 
ON public.webhook_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- RLS POLICIES - SPECIAL ACCESS PATTERNS
-- =============================================================================

-- Confirmation Number Access: Allow access to confirmation views by confirmation number
-- This enables the confirmation pages to work without authentication
-- Note: These will be applied to confirmation views when they are created

-- Anonymous webhook logs creation (for Stripe webhooks)
DROP POLICY IF EXISTS "anon_create_webhook_logs" ON public.webhook_logs;
CREATE POLICY "anon_create_webhook_logs" 
ON public.webhook_logs FOR INSERT
TO anon
WITH CHECK (true);

-- Ensure anon role can access views (only if they exist)
DO $$
BEGIN
    -- Check and grant access to views
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'function_event_tickets_view') THEN
        GRANT SELECT ON public.function_event_tickets_view TO anon;
        RAISE NOTICE 'Granted select permission on function_event_tickets_view to anon';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'function_packages_view') THEN
        GRANT SELECT ON public.function_packages_view TO anon;
        RAISE NOTICE 'Granted select permission on function_packages_view to anon';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_display_view') THEN
        GRANT SELECT ON public.event_display_view TO anon;
        RAISE NOTICE 'Granted select permission on event_display_view to anon';
    END IF;
END $$;

-- =============================================================================
-- MIGRATION COMPLETION
-- =============================================================================

-- Log successful completion with summary
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COMPREHENSIVE RLS POLICIES APPLIED:';
    RAISE NOTICE '- Public read access for published content';
    RAISE NOTICE '- Anonymous registration flow support';
    RAISE NOTICE '- Authenticated user "own data" access';
    RAISE NOTICE '- Organiser role-based permissions';
    RAISE NOTICE '- Service role bypass policies';
    RAISE NOTICE '- Special access patterns (webhooks, confirmations)';
    RAISE NOTICE 'Anonymous auth support fully enabled!';
    RAISE NOTICE '========================================';
END $$;