-- MINIMAL RLS SETUP FOR RESTRICTED PERMISSIONS
-- This script only does what's possible with limited permissions

-- Check current user and permissions
DO $$
BEGIN
  RAISE NOTICE 'Current user: %', current_user;
  RAISE NOTICE 'Current role: %', current_role;
END $$;

-- Try to enable RLS (may already be enabled)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY['events', 'registrations', 'tickets', 'attendees', 'contacts', 
                        'customers', 'organisations', 'masonic_profiles', 'event_tickets', 
                        'packages', 'user_roles', 'lodges', 'grand_lodges', 'locations', 
                        'attendee_events', 'memberships'])
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      RAISE NOTICE 'RLS enabled on table: %', t;
    EXCEPTION 
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Cannot enable RLS on %: insufficient privileges', t;
      WHEN OTHERS THEN
        RAISE NOTICE 'Error enabling RLS on %: %', t, SQLERRM;
    END;
  END LOOP;
END $$;

-- Report current RLS status
DO $$
DECLARE
  rec record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Current RLS Status ===';
  FOR rec IN 
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('events', 'registrations', 'tickets', 'attendees', 'contacts', 
                      'customers', 'organisations', 'masonic_profiles', 'event_tickets', 
                      'packages', 'user_roles', 'lodges', 'grand_lodges', 'locations', 
                      'attendee_events', 'memberships')
    ORDER BY tablename
  LOOP
    RAISE NOTICE 'Table %: RLS %', rpad(rec.tablename, 20), 
                 CASE WHEN rec.rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END;
  END LOOP;
END $$;

-- Report current policies
DO $$
DECLARE
  policy_count INTEGER;
  table_name TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Current Policy Count ===';
  
  FOR table_name IN 
    SELECT unnest(ARRAY['events', 'registrations', 'tickets', 'attendees', 'contacts', 
                        'customers', 'organisations', 'masonic_profiles', 'event_tickets', 
                        'packages', 'user_roles', 'lodges', 'grand_lodges', 'locations', 
                        'attendee_events', 'memberships'])
  LOOP
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = table_name;
    
    IF policy_count > 0 THEN
      RAISE NOTICE 'Table %: % policies', rpad(table_name, 20), policy_count;
    END IF;
  END LOOP;
END $$;

-- List all existing policies
DO $$
DECLARE
  rec record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Existing Policies ===';
  FOR rec IN 
    SELECT tablename, policyname, permissive, roles, cmd
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE 'Table: %, Policy: %, Cmd: %, Roles: %', 
                 rec.tablename, rec.policyname, rec.cmd, rec.roles;
  END LOOP;
END $$;

-- Report what needs to be done manually
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'MANUAL STEPS REQUIRED';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Due to permission restrictions, you need to:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Contact your Supabase administrator or use the Supabase Dashboard';
  RAISE NOTICE '   with an account that has full permissions.';
  RAISE NOTICE '';
  RAISE NOTICE '2. Enable RLS on all tables listed above as DISABLED.';
  RAISE NOTICE '';
  RAISE NOTICE '3. Create the RLS policies using the Dashboard UI:';
  RAISE NOTICE '   - Go to Authentication → Policies';
  RAISE NOTICE '   - Create policies for each table according to the rules below';
  RAISE NOTICE '';
  RAISE NOTICE '4. Or provide the service_role key to run migrations with full permissions.';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
END $$;