-- Seed data for organizer portal testing
-- This script creates test organizer accounts and associated data

-- =====================================================
-- ORGANIZER AUTH USERS SEED DATA
-- =====================================================

-- Note: These are test users for development/testing purposes
-- In production, users would register through the normal flow

BEGIN;

-- Create host organizations first
INSERT INTO public.host_organisations (
    organisation_id,
    name,
    email,
    phone,
    website,
    street_address,
    city,
    state,
    postal_code,
    country,
    description,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'United Grand Lodge of NSW & ACT',
    'admin@uglnsw.org.au',
    '+61 2 9264 8404',
    'https://www.uglnsw.org.au',
    '279-281 Castlereagh Street',
    'Sydney',
    'NSW',
    '2000',
    'Australia',
    'The governing body of Freemasonry in New South Wales and the Australian Capital Territory',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Grand Lodge of Victoria',
    'contact@freemasonsvic.net',
    '+61 3 9650 1465',
    'https://www.freemasonsvic.net',
    '25 Collins Street',
    'Melbourne',
    'VIC',
    '3000',
    'Australia',
    'The governing body of Freemasonry in Victoria',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Lodge Test Organization',
    'test@lodge.org.au',
    '+61 2 9999 9999',
    'https://www.testlodge.org.au',
    '123 Test Street',
    'Sydney',
    'NSW',
    '2001',
    'Australia',
    'Test organization for development and testing purposes',
    NOW(),
    NOW()
);

-- Get the organization IDs for reference
-- Note: In a real script, you'd use the actual UUIDs, but this shows the concept

-- Create organizer accounts
-- These would typically be created through Supabase Auth, but we'll simulate with test data

-- Primary Organizer: Darren Allatt (United Grand Lodge of NSW & ACT Administrator)
DO $$
DECLARE
    -- Use a consistent UUID for Darren's account (you can replace this with actual Supabase user ID)
    darren_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- Example UUID, replace with actual
    uglnsw_org_id UUID;
    organizer_id_1 UUID := gen_random_uuid();
BEGIN
    -- Get the UGLNSW organization ID
    SELECT organisation_id INTO uglnsw_org_id 
    FROM public.host_organisations 
    WHERE name = 'United Grand Lodge of NSW & ACT';
    
    -- Insert organizer record for Darren
    INSERT INTO public.organizers (
        organizer_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        position,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        organizer_id_1,
        darren_user_id,
        'Darren',
        'Allatt',
        'darren.allatt@gmail.com',
        '+61 2 9264 8405',
        'Portal Administrator',
        true,
        NOW(),
        NOW()
    );
    
    -- Link organizer to organization with admin role
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
        organizer_id_1,
        uglnsw_org_id,
        'admin',
        ARRAY['create_events', 'manage_registrations', 'view_reports', 'export_data', 'manage_users'],
        true,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Created organizer Darren Allatt with user_id: % and organizer_id: %', darren_user_id, organizer_id_1;
END $$;

-- Test Organizer 2: Sarah Wilson (Lodge Secretary)
DO $$
DECLARE
    test_user_id_2 UUID := gen_random_uuid();
    test_org_id UUID;
    organizer_id_2 UUID := gen_random_uuid();
BEGIN
    -- Get the test organization ID
    SELECT organisation_id INTO test_org_id 
    FROM public.host_organisations 
    WHERE name = 'Lodge Test Organization';
    
    -- Insert organizer record
    INSERT INTO public.organizers (
        organizer_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        position,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        organizer_id_2,
        test_user_id_2,
        'Sarah',
        'Wilson',
        'sarah.wilson@testlodge.org.au',
        '+61 2 9999 9998',
        'Lodge Secretary',
        true,
        NOW(),
        NOW()
    );
    
    -- Link organizer to organization with editor role
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
        organizer_id_2,
        test_org_id,
        'editor',
        ARRAY['create_events', 'manage_registrations', 'view_reports'],
        true,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Created organizer Sarah Wilson with user_id: % and organizer_id: %', test_user_id_2, organizer_id_2;
END $$;

-- Test Organizer 3: Michael Brown (Event Manager)
DO $$
DECLARE
    test_user_id_3 UUID := gen_random_uuid();
    vic_org_id UUID;
    organizer_id_3 UUID := gen_random_uuid();
BEGIN
    -- Get the Victoria organization ID
    SELECT organisation_id INTO vic_org_id 
    FROM public.host_organisations 
    WHERE name = 'Grand Lodge of Victoria';
    
    -- Insert organizer record
    INSERT INTO public.organizers (
        organizer_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        position,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        organizer_id_3,
        test_user_id_3,
        'Michael',
        'Brown',
        'michael.brown@freemasonsvic.net',
        '+61 3 9650 1466',
        'Event Manager',
        true,
        NOW(),
        NOW()
    );
    
    -- Link organizer to organization with viewer role
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
        organizer_id_3,
        vic_org_id,
        'viewer',
        ARRAY['view_reports'],
        true,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Created organizer Michael Brown with user_id: % and organizer_id: %', test_user_id_3, organizer_id_3;
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the seed data was created correctly
SELECT 
    'Organizations' as data_type,
    COUNT(*) as count
FROM public.host_organisations
WHERE name IN ('United Grand Lodge of NSW & ACT', 'Grand Lodge of Victoria', 'Lodge Test Organization')

UNION ALL

SELECT 
    'Organizers' as data_type,
    COUNT(*) as count
FROM public.organizers
WHERE email IN ('darren.allatt@gmail.com', 'sarah.wilson@testlodge.org.au', 'michael.brown@freemasonsvic.net')

UNION ALL

SELECT 
    'User Roles' as data_type,
    COUNT(*) as count
FROM public.user_roles ur
JOIN public.organizers o ON ur.organizer_id = o.organizer_id
WHERE o.email IN ('darren.allatt@gmail.com', 'sarah.wilson@testlodge.org.au', 'michael.brown@freemasonsvic.net');

-- Show detailed information about created organizers
SELECT 
    o.first_name,
    o.last_name,
    o.email,
    o.position,
    ho.name as organization,
    ur.role_name,
    ur.permissions
FROM public.organizers o
JOIN public.user_roles ur ON o.organizer_id = ur.organizer_id
JOIN public.host_organisations ho ON ur.organisation_id = ho.organisation_id
WHERE o.email IN ('darren.allatt@gmail.com', 'sarah.wilson@testlodge.org.au', 'michael.brown@freemasonsvic.net')
ORDER BY o.first_name, o.last_name;