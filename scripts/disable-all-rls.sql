-- Disable RLS and Drop All Policies Script
-- WARNING: This will remove all security policies from your database
-- Use with caution in production environments

DO $$
DECLARE
    r RECORD;
    policy_record RECORD;
    policy_count INTEGER := 0;
    table_count INTEGER := 0;
BEGIN
    -- Loop through all tables in the public schema
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        -- Drop all policies for this table
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = r.schemaname 
            AND tablename = r.tablename
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                policy_record.policyname, 
                r.schemaname, 
                r.tablename);
            policy_count := policy_count + 1;
            RAISE NOTICE 'Dropped policy % on table %.%', 
                policy_record.policyname, 
                r.schemaname, 
                r.tablename;
        END LOOP;
        
        -- Disable RLS on the table
        EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', 
            r.schemaname, 
            r.tablename);
        table_count := table_count + 1;
        RAISE NOTICE 'Disabled RLS on table %.%', r.schemaname, r.tablename;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Dropped % policies', policy_count;
    RAISE NOTICE '  - Disabled RLS on % tables', table_count;
END $$;

-- Verify RLS is disabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify all policies are dropped
SELECT 
    COUNT(*) as remaining_policies
FROM pg_policies 
WHERE schemaname = 'public';