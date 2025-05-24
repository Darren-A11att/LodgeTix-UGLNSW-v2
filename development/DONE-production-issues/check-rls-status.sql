-- Check current RLS status on your tables
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('registrations', 'attendees', 'tickets', 'customers', 'events')
ORDER BY tablename;

-- Check what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd AS operation,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('registrations', 'attendees', 'tickets', 'customers', 'events')
ORDER BY tablename, policyname;