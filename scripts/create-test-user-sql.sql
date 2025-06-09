-- Create a test user directly in the auth schema
-- This creates a user that can be used for local testing

-- First, let's check if the user already exists
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Check if user exists
    SELECT id INTO user_id FROM auth.users WHERE email = 'test@lodgetix.local';
    
    IF user_id IS NULL THEN
        -- Create new user
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            invited_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'test@lodgetix.local',
            crypt('testpassword123', gen_salt('bf')),
            now(),
            now(),
            '',
            now(),
            '',
            NULL,
            '',
            '',
            NULL,
            now(),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
            jsonb_build_object(),
            false,
            now(),
            now(),
            NULL,
            NULL,
            '',
            '',
            NULL,
            '',
            0,
            NULL,
            '',
            NULL,
            false,
            NULL
        )
        RETURNING id INTO user_id;
        
        RAISE NOTICE 'Test user created with ID: %', user_id;
    ELSE
        RAISE NOTICE 'Test user already exists with ID: %', user_id;
    END IF;
END $$;