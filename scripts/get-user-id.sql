-- Helper script to get Supabase Auth user ID
-- Run this after creating your auth account to get the actual user_id

-- =====================================================
-- GET USER ID FROM SUPABASE AUTH
-- =====================================================

-- This query will show all users in Supabase Auth
-- Look for your email: darren.allatt@gmail.com
SELECT 
    id as user_id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'darren.allatt@gmail.com'
ORDER BY created_at DESC;

-- If no results, the user hasn't been created in Supabase Auth yet
-- You need to:
-- 1. Sign up through the app authentication flow, OR
-- 2. Create the user manually in the Supabase dashboard

-- =====================================================
-- MANUAL USER CREATION (if needed)
-- =====================================================

-- If you need to create the user manually, you can use this:
-- (Replace the UUID with a new generated one)

/*
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
) VALUES (
    gen_random_uuid(), -- This will be your user_id
    '00000000-0000-0000-0000-000000000000',
    'darren.allatt@gmail.com',
    crypt('your_password_here', gen_salt('bf')), -- Replace with your desired password
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Darren", "last_name": "Allatt"}',
    false,
    'authenticated',
    'authenticated'
);
*/

-- =====================================================
-- UPDATE ORGANIZER SEED SCRIPT
-- =====================================================

-- Once you have the actual user_id, update the seed-primary-organizer.sql file
-- Replace the darren_user_id UUID with the actual one from the query above

-- Example update query:
/*
UPDATE public.organizers 
SET user_id = 'YOUR_ACTUAL_USER_ID_HERE'
WHERE email = 'darren.allatt@gmail.com';
*/