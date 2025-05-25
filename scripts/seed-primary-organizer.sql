-- Seed data for primary organizer: Darren Allatt
-- This creates the United Grand Lodge of NSW & ACT organization and Darren as the admin

-- =====================================================
-- PRIMARY ORGANIZER SEED DATA
-- =====================================================

BEGIN;

-- 1. Create the United Grand Lodge of NSW & ACT organization
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
) VALUES (
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
)
ON CONFLICT (name) DO NOTHING; -- Prevent duplicate if already exists

-- 2. Create organizer record for Darren Allatt
-- Note: The user_id should match the actual Supabase Auth user ID
-- You'll need to replace this UUID with the actual one from Supabase Auth
DO $$
DECLARE
    darren_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- Replace with actual Supabase user ID
    uglnsw_org_id UUID;
    darren_organizer_id UUID := gen_random_uuid();
BEGIN
    -- Get the UGLNSW organization ID
    SELECT organisation_id INTO uglnsw_org_id 
    FROM public.host_organisations 
    WHERE name = 'United Grand Lodge of NSW & ACT';
    
    IF uglnsw_org_id IS NULL THEN
        RAISE EXCEPTION 'United Grand Lodge of NSW & ACT organization not found';
    END IF;
    
    -- Insert organizer record for Darren (with conflict handling)
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
        position = EXCLUDED.position,
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
    o.position,
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
    name,
    email,
    phone,
    website,
    street_address || ', ' || city || ', ' || state || ' ' || postal_code as full_address
FROM public.host_organisations
WHERE name = 'United Grand Lodge of NSW & ACT';