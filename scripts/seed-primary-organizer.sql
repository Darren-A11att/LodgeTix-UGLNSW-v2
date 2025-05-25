-- Seed data for primary organizer: Darren Allatt
-- This creates the United Grand Lodge of NSW & ACT organization and Darren as the admin

-- =====================================================
-- PRIMARY ORGANIZER SEED DATA
-- =====================================================

BEGIN;

-- 1. Verify the United Grand Lodge of NSW & ACT organization exists
-- Organization ID: 3e893fa6-2cc2-448c-be9c-e3858cc90e11
-- (This should already exist in the database)

-- 2. Create organizer record for Darren Allatt
-- Note: The user_id should match the actual Supabase Auth user ID
-- You'll need to replace this UUID with the actual one from Supabase Auth
DO $$
DECLARE
    darren_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- Replace with actual Supabase user ID
    uglnsw_org_id UUID := '3e893fa6-2cc2-448c-be9c-e3858cc90e11'; -- United Grand Lodge of NSW & ACT
    darren_organizer_id UUID := gen_random_uuid();
BEGIN
    -- Verify the UGLNSW organization exists
    IF NOT EXISTS (SELECT 1 FROM public.host_organisations WHERE organisation_id = uglnsw_org_id) THEN
        RAISE EXCEPTION 'United Grand Lodge of NSW & ACT organization (%) not found', uglnsw_org_id;
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
    
    -- Link organizer to organization with admin role (with conflict handling)
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
    
    RAISE NOTICE 'Successfully set up Darren Allatt as admin for United Grand Lodge of NSW & ACT';
    RAISE NOTICE 'User ID: %, Organizer ID: %, Organization ID: %', darren_user_id, darren_organizer_id, uglnsw_org_id;
    
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the setup
SELECT 
    'Setup Complete' as status,
    o.first_name || ' ' || o.last_name as organizer_name,
    o.email,
    o.job_position,
    ho.name as organization,
    ur.role_name as role,
    array_to_string(ur.permissions, ', ') as permissions
FROM public.organizers o
JOIN public.user_roles ur ON o.organizer_id = ur.organizer_id
JOIN public.host_organisations ho ON ur.organisation_id = ho.organisation_id
WHERE o.email = 'darren.allatt@gmail.com';

-- Show organization details
SELECT 
    'Organization Details' as info_type,
    organisation_id,
    name,
    email,
    phone,
    website,
    street_address || ', ' || city || ', ' || state || ' ' || postal_code as full_address
FROM public.host_organisations
WHERE organisation_id = '3e893fa6-2cc2-448c-be9c-e3858cc90e11';