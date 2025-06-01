-- DB-012: Update Permissions and RLS
-- Priority: High
-- Time: 30 minutes

-- Grant permissions on functions table
GRANT SELECT ON functions TO anon;
GRANT SELECT ON functions TO authenticated;
GRANT ALL ON functions TO service_role;

-- Enable RLS on functions table
ALTER TABLE functions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Functions are viewable by everyone" ON functions;
DROP POLICY IF EXISTS "Functions are editable by org admins" ON functions;
DROP POLICY IF EXISTS "Service role has full access to functions" ON functions;

-- RLS Policy: Public read access for published functions
CREATE POLICY "Functions are viewable by everyone"
    ON functions
    FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

-- RLS Policy: Organisation admins can manage their functions
CREATE POLICY "Functions are editable by org admins"
    ON functions
    FOR ALL
    TO authenticated
    USING (
        -- Check if user has admin or owner role for the organisation
        organiser_id IN (
            SELECT organisation_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    )
    WITH CHECK (
        -- Same check for inserts/updates
        organiser_id IN (
            SELECT organisation_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- RLS Policy: Service role bypass (for admin operations)
CREATE POLICY "Service role has full access to functions"
    ON functions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Update permissions for related tables to ensure consistency

-- Events table - ensure function-based access
DROP POLICY IF EXISTS "Events are viewable by function access" ON events;
CREATE POLICY "Events are viewable by function access"
    ON events
    FOR SELECT
    TO anon, authenticated
    USING (
        is_published = true 
        AND function_id IN (
            SELECT function_id FROM functions WHERE is_published = true
        )
    );

-- Registrations table - ensure function-based access
DROP POLICY IF EXISTS "Users can view their own registrations by function" ON registrations;
CREATE POLICY "Users can view their own registrations by function"
    ON registrations
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id FROM customers WHERE user_id = auth.uid()
        )
        OR
        function_id IN (
            SELECT function_id FROM functions f
            JOIN user_roles ur ON ur.organisation_id = f.organiser_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'owner', 'editor')
        )
    );

-- Packages table - ensure function-based access
DROP POLICY IF EXISTS "Packages are viewable by function access" ON packages;
CREATE POLICY "Packages are viewable by function access"
    ON packages
    FOR SELECT
    TO anon, authenticated
    USING (
        is_active = true 
        AND function_id IN (
            SELECT function_id FROM functions WHERE is_published = true
        )
    );

-- Grant permissions on new views
GRANT SELECT ON function_summary_view TO authenticated;
GRANT SELECT ON function_events_view TO anon, authenticated;
GRANT SELECT ON function_packages_view TO anon, authenticated;
GRANT SELECT ON function_registration_stats TO authenticated;

-- Grant permissions on new RPC functions
GRANT EXECUTE ON FUNCTION get_function_details(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_functions_list() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_function_registrations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_functions_migration() TO authenticated;

-- Create audit function for permission verification
CREATE OR REPLACE FUNCTION verify_functions_permissions()
RETURNS TABLE (
    object_type TEXT,
    object_name TEXT,
    privilege_type TEXT,
    grantee TEXT,
    status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check table permissions
    RETURN QUERY
    SELECT 
        'TABLE'::TEXT,
        'functions'::TEXT,
        privilege_type::TEXT,
        grantee::TEXT,
        'GRANTED'::TEXT
    FROM information_schema.table_privileges
    WHERE table_schema = 'public' 
    AND table_name = 'functions';
    
    -- Check RLS status
    RETURN QUERY
    SELECT 
        'RLS'::TEXT,
        'functions'::TEXT,
        'ROW LEVEL SECURITY'::TEXT,
        CASE WHEN relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END,
        CASE WHEN relrowsecurity THEN 'OK' ELSE 'WARNING' END
    FROM pg_class
    WHERE relname = 'functions' AND relnamespace = 'public'::regnamespace;
    
    -- Check policies
    RETURN QUERY
    SELECT 
        'POLICY'::TEXT,
        pol.polname::TEXT,
        CASE 
            WHEN pol.polcmd = 'r' THEN 'SELECT'
            WHEN pol.polcmd = 'a' THEN 'INSERT'
            WHEN pol.polcmd = 'w' THEN 'UPDATE'
            WHEN pol.polcmd = 'd' THEN 'DELETE'
            WHEN pol.polcmd = '*' THEN 'ALL'
        END,
        rol.rolname::TEXT,
        'ACTIVE'::TEXT
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_roles rol ON pol.polroles @> ARRAY[rol.oid]
    WHERE cls.relname = 'functions';
END;
$$;

-- Grant execute permission on verification function
GRANT EXECUTE ON FUNCTION verify_functions_permissions TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "Functions are viewable by everyone" ON functions IS 'Allow public read access to published functions';
COMMENT ON POLICY "Functions are editable by org admins" ON functions IS 'Allow organisation admins to manage their functions';
COMMENT ON POLICY "Service role has full access to functions" ON functions IS 'Service role bypass for admin operations';
COMMENT ON FUNCTION verify_functions_permissions IS 'Verify permissions and RLS configuration for functions table';