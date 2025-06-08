-- Create supabase_functions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- Create http_request function if it doesn't exist
-- This is a placeholder for the actual Edge Functions webhook functionality
CREATE OR REPLACE FUNCTION supabase_functions.http_request(
    url text,
    method text,
    headers jsonb DEFAULT '{}'::jsonb,
    payload jsonb DEFAULT '{}'::jsonb,
    timeout_ms integer DEFAULT 5000
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This is a placeholder function
    -- In production, this would trigger an actual HTTP request
    -- For development branches, we'll just log the request
    RAISE NOTICE 'HTTP Request: % % %', method, url, payload;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA supabase_functions TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION supabase_functions.http_request TO postgres, anon, authenticated, service_role;