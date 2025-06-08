-- Quick fix for lodge creation RLS issues
-- Run this in Supabase SQL editor

-- 1. Grant necessary permissions to anon role
GRANT INSERT ON public.organisations TO anon;
GRANT INSERT ON public.lodges TO anon;
GRANT SELECT ON public.grand_lodges TO anon;

-- 2. Create or replace the INSERT policies to ensure they work
DO $$
BEGIN
    -- Drop and recreate organisations INSERT policy
    DROP POLICY IF EXISTS "organisations_anon_insert" ON public.organisations;
    
    CREATE POLICY "organisations_anon_insert" 
    ON public.organisations 
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (type = 'lodge');

    -- Drop and recreate lodges INSERT policy
    DROP POLICY IF EXISTS "lodges_anon_insert" ON public.lodges;
    
    CREATE POLICY "lodges_anon_insert" 
    ON public.lodges 
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

    RAISE NOTICE 'Policies created successfully';
END $$;

-- 3. Verify permissions
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('organisations', 'lodges', 'grand_lodges')
  AND grantee = 'anon'
ORDER BY table_name, privilege_type;