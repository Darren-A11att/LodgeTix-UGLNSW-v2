-- Diagnostic script to check and fix RLS policies for lodge creation

-- 1. Check current policies on organisations table
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
WHERE tablename = 'organisations'
ORDER BY policyname;

-- 2. Check current policies on lodges table
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
WHERE tablename = 'lodges'
ORDER BY policyname;

-- 3. Check if anon role exists and has proper permissions
SELECT 
    rolname,
    rolcanlogin,
    rolreplication,
    rolbypassrls
FROM pg_roles 
WHERE rolname = 'anon';

-- 4. Fix the policies - drop existing and recreate
BEGIN;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "organisations_anon_insert" ON "public"."organisations";
DROP POLICY IF EXISTS "lodges_anon_insert" ON "public"."lodges";
DROP POLICY IF EXISTS "organisations_anon_select_own" ON "public"."organisations";

-- Create INSERT policy for organisations table
-- Allows anonymous users to create new organisations of type 'lodge'
CREATE POLICY "organisations_anon_insert" 
ON "public"."organisations" 
FOR INSERT 
WITH CHECK (type = 'lodge');

-- Grant this policy to anon role
GRANT INSERT ON "public"."organisations" TO anon;

-- Create INSERT policy for lodges table  
-- Allows anonymous users to create new lodges
CREATE POLICY "lodges_anon_insert" 
ON "public"."lodges" 
FOR INSERT 
WITH CHECK (true);

-- Grant this policy to anon role
GRANT INSERT ON "public"."lodges" TO anon;

-- Also ensure the anon role can select organisations
-- This might already exist but let's make sure
CREATE POLICY IF NOT EXISTS "organisations_anon_select" 
ON "public"."organisations" 
FOR SELECT 
USING (true);

GRANT SELECT ON "public"."organisations" TO anon;
GRANT SELECT ON "public"."lodges" TO anon;

COMMIT;

-- 5. Verify the policies were created
SELECT 
    'After Fix' as status,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('organisations', 'lodges')
  AND policyname LIKE '%anon%'
ORDER BY tablename, policyname;