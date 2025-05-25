-- Link Darren Allatt to existing United Grand Lodge of NSW & ACT organization
-- Organization ID: 3e893fa6-2cc2-448c-be9c-e3858cc90e11

-- =====================================================
-- SETUP INSTRUCTIONS
-- =====================================================

-- PREREQUISITE: Run the organizer portal schema migration first!
-- File: supabase/migrations/20250526_create_organizer_portal_schema.sql
-- This creates the organizers and user_roles tables

-- STEP 1: Create your Supabase Auth account
-- Go to /organizer/login and sign up with darren.allatt@gmail.com

-- STEP 2: Get your Supabase Auth user_id
-- Run this query to find your user_id:
/*
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users
WHERE email = 'darren.allatt@gmail.com';
*/

-- STEP 3: Replace YOUR_USER_ID_HERE with the actual user_id from above
-- Then run the rest of this script

-- =====================================================
-- LINK ORGANIZER TO EXISTING ORGANIZATION
-- =====================================================

BEGIN;

DO $$
DECLARE
    darren_user_id UUID := 'YOUR_USER_ID_HERE'; -- ⚠️ REPLACE WITH ACTUAL USER ID FROM STEP 1
    uglnsw_org_id UUID := '3e893fa6-2cc2-448c-be9c-e3858cc90e11'; -- Existing UGLNSW organization
    darren_organizer_id UUID := gen_random_uuid();
BEGIN
    -- Verify the organization exists
    IF NOT EXISTS (SELECT 1 FROM public.host_organisations WHERE organisation_id = uglnsw_org_id) THEN
        RAISE EXCEPTION 'United Grand Lodge of NSW & ACT organization not found with ID: %', uglnsw_org_id;
    END IF;
    
    -- Verify the user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = darren_user_id) THEN
        RAISE EXCEPTION 'User not found in auth.users with ID: %. Please create the user first.', darren_user_id;
    END IF;
    
    -- Insert organizer record for Darren (with conflict handling)
    INSERT INTO public.organizers (
        organizer_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        job_position,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        darren_organizer_id,
        darren_user_id,
        'Darren',
        'Allatt',
        'darren.allatt@gmail.com',
        '+61 400 123 456',
        'Portal Administrator',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        job_position = EXCLUDED.job_position,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING organizer_id INTO darren_organizer_id;
    
    -- Get the organizer ID if it was an update
    IF darren_organizer_id IS NULL THEN
        SELECT organizer_id INTO darren_organizer_id 
        FROM public.organizers 
        WHERE user_id = darren_user_id;
    END IF;
    
    -- Link organizer to the existing UGLNSW organization with admin role
    INSERT INTO public.user_roles (
        role_id,
        organizer_id,
        organisation_id,
        role_name,
        permissions,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        darren_organizer_id,
        uglnsw_org_id,
        'admin',
        ARRAY['create_events', 'manage_registrations', 'view_reports', 'export_data', 'manage_users'],
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (organizer_id, organisation_id) DO UPDATE SET
        role_name = EXCLUDED.role_name,
        permissions = EXCLUDED.permissions,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    
    RAISE NOTICE '✅ Successfully linked Darren Allatt to United Grand Lodge of NSW & ACT';
    RAISE NOTICE 'User ID: %', darren_user_id;
    RAISE NOTICE 'Organizer ID: %', darren_organizer_id;
    RAISE NOTICE 'Organization ID: %', uglnsw_org_id;
    RAISE NOTICE 'Role: Admin with full permissions';
    
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify the setup was successful
SELECT 
    '✅ SETUP COMPLETE' as status,
    o.first_name || ' ' || o.last_name as organizer_name,
    o.email,
    o.job_position,
    ho.name as organization,
    ho.organisation_id,
    ur.role_name as role,
    array_to_string(ur.permissions, ', ') as permissions,
    CASE WHEN o.is_active AND ur.is_active THEN '✅ Active' ELSE '❌ Inactive' END as active_status
FROM public.organizers o
JOIN public.user_roles ur ON o.organizer_id = ur.organizer_id
JOIN public.host_organisations ho ON ur.organisation_id = ho.organisation_id
WHERE o.email = 'darren.allatt@gmail.com'
  AND ho.organisation_id = '3e893fa6-2cc2-448c-be9c-e3858cc90e11';

-- Show what you can now access
SELECT 
    '🚀 YOU CAN NOW ACCESS' as info,
    'https://your-app-url/organizer/login' as login_url,
    'darren.allatt@gmail.com' as login_email,
    'Full admin access to United Grand Lodge of NSW & ACT portal' as access_level;