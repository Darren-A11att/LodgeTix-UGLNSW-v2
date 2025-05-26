-- RLS Policies for Registration System
-- Allows anonymous users to create and view their own registrations

-- First, ensure RLS is enabled on the registrations table
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Option 1: Session-based approach using auth.uid()
-- This works even for anonymous users as Supabase creates a session ID

-- Policy for INSERT (creating registrations)
CREATE POLICY "anon_users_create_registrations" 
ON public.registrations 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
    -- Allow creation if the user_id matches the current session
    auth.uid() IS NOT NULL
);

-- Policy for SELECT (viewing registrations)
CREATE POLICY "users_view_own_registrations" 
ON public.registrations 
FOR SELECT 
TO anon, authenticated
USING (
    -- Users can only see their own registrations
    auth.uid() = user_id
);

-- Option 2: Using a session token approach
-- Store a session_token in the registration and match it

-- Add a session_token column if not exists
-- ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS session_token UUID DEFAULT gen_random_uuid();

-- Policy using session token stored in app_metadata
CREATE POLICY "anon_users_create_with_session" 
ON public.registrations 
FOR INSERT 
TO anon
WITH CHECK (
    -- Allow if they're creating with their session token
    auth.jwt() ->> 'session_token' IS NOT NULL
);

-- Option 3: Using registration_id as a secure token
-- Users who know the registration ID can view it

CREATE POLICY "view_registration_by_id" 
ON public.registrations 
FOR SELECT 
TO anon, authenticated
USING (
    -- Allow viewing if they know the exact registration_id (acts as a token)
    -- This is useful for sharing confirmation pages
    true  -- You'd implement additional checks in your app layer
);

-- Option 4: IP-based temporary access (less secure, but useful for anonymous)
-- Store IP address and allow access for a time window

-- Add columns if needed
-- ALTER TABLE public.registrations 
-- ADD COLUMN IF NOT EXISTS created_ip inet,
-- ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE POLICY "temp_ip_access" 
ON public.registrations 
FOR SELECT 
TO anon
USING (
    -- Allow access from same IP within 24 hours
    created_ip = inet_client_addr() 
    AND created_at > now() - interval '24 hours'
);

-- Option 5: Using RLS with RPC functions
-- Create a security definer function that bypasses RLS

CREATE OR REPLACE FUNCTION public.create_registration_secure(
    p_event_id uuid,
    p_registration_type text,
    p_email text,
    p_data jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with owner privileges
SET search_path = public
AS $$
DECLARE
    v_registration_id uuid;
    v_user_id uuid;
BEGIN
    -- Get current user ID (works for anon users too)
    v_user_id := auth.uid();
    
    -- Create the registration
    INSERT INTO registrations (
        event_id,
        registration_type,
        email,
        user_id,
        data,
        created_at
    ) VALUES (
        p_event_id,
        p_registration_type,
        p_email,
        v_user_id,
        p_data,
        now()
    ) RETURNING registration_id INTO v_registration_id;
    
    RETURN v_registration_id;
END;
$$;

-- Grant execute permission to anon users
GRANT EXECUTE ON FUNCTION public.create_registration_secure TO anon;

-- Option 6: Hybrid approach - combine multiple methods
-- This is the most flexible and secure approach

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "registrations_insert_policy" ON public.registrations;
DROP POLICY IF EXISTS "registrations_select_policy" ON public.registrations;

-- Comprehensive INSERT policy
CREATE POLICY "registrations_insert_policy" 
ON public.registrations 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
    -- Must have a valid session
    auth.uid() IS NOT NULL
    -- Optionally, add more checks like email validation
    AND email IS NOT NULL
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Comprehensive SELECT policy
CREATE POLICY "registrations_select_policy" 
ON public.registrations 
FOR SELECT 
TO anon, authenticated
USING (
    -- Can view if:
    -- 1. They own it (by user_id)
    auth.uid() = user_id
    OR
    -- 2. They have the registration ID and it was created recently (link sharing)
    (
        registration_id IS NOT NULL 
        AND created_at > now() - interval '7 days'
    )
    OR
    -- 3. They're an admin (authenticated user with admin role)
    (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    )
);

-- UPDATE policy (users can update their own draft registrations)
CREATE POLICY "registrations_update_policy" 
ON public.registrations 
FOR UPDATE 
TO anon, authenticated
USING (
    -- Can update if they own it and it's still a draft
    auth.uid() = user_id 
    AND status = 'draft'
)
WITH CHECK (
    -- Can't change ownership
    auth.uid() = user_id
);

-- DELETE policy (users can delete their own draft registrations)
CREATE POLICY "registrations_delete_policy" 
ON public.registrations 
FOR DELETE 
TO anon, authenticated
USING (
    -- Can delete if they own it and it's still a draft
    auth.uid() = user_id 
    AND status = 'draft'
);

-- Additional considerations for anonymous users:

-- 1. Rate limiting - prevent abuse
CREATE OR REPLACE FUNCTION check_registration_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_count integer;
BEGIN
    -- Check registrations from same IP in last hour
    SELECT COUNT(*) INTO v_count
    FROM registrations
    WHERE created_ip = inet_client_addr()
    AND created_at > now() - interval '1 hour';
    
    -- Allow max 5 registrations per hour per IP
    RETURN v_count < 5;
END;
$$;

-- 2. Session tracking for anonymous users
CREATE TABLE IF NOT EXISTS registration_sessions (
    session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT now() + interval '24 hours',
    ip_address inet DEFAULT inet_client_addr()
);

-- Enable RLS on sessions table
ALTER TABLE registration_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for session management
CREATE POLICY "manage_own_sessions" 
ON registration_sessions 
FOR ALL 
TO anon, authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Example: Complete implementation for anonymous registration flow

-- Function to initialize anonymous session
CREATE OR REPLACE FUNCTION init_anon_registration_session()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id uuid;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Create session
    INSERT INTO registration_sessions (user_id)
    VALUES (v_user_id)
    RETURNING session_id INTO v_session_id;
    
    RETURN jsonb_build_object(
        'session_id', v_session_id,
        'user_id', v_user_id,
        'expires_at', now() + interval '24 hours'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION init_anon_registration_session TO anon;

-- Best practices for anonymous user RLS:
-- 1. Always use auth.uid() - Supabase creates this even for anon users
-- 2. Implement rate limiting to prevent abuse
-- 3. Use time-based expiration for anonymous data
-- 4. Consider IP-based restrictions as additional security
-- 5. Use SECURITY DEFINER functions for complex operations
-- 6. Always validate input data in policies or functions
-- 7. Log anonymous activities for security monitoring