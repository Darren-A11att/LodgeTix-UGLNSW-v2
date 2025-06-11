-- Create supabase_functions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- Only create http_request function if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'supabase_functions' 
        AND p.proname = 'http_request'
    ) THEN
        -- Create http_request function
        -- This is a placeholder for the actual Edge Functions webhook functionality
        CREATE FUNCTION supabase_functions.http_request(
            url text,
            method text,
            headers jsonb DEFAULT '{}'::jsonb,
            payload jsonb DEFAULT '{}'::jsonb,
            timeout_ms integer DEFAULT 5000
        )
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        BEGIN
            -- This is a placeholder function
            -- In production, this would trigger an actual HTTP request
            -- For development branches, we'll just log the request
            RAISE NOTICE 'HTTP Request: % % %', method, url, payload;
        END;
        $func$;
    END IF;
END $$;

-- Grant necessary permissions (safe to re-run)
GRANT USAGE ON SCHEMA supabase_functions TO postgres, anon, authenticated, service_role;
-- Only grant permissions if function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'supabase_functions' 
        AND p.proname = 'http_request'
    ) THEN
        GRANT EXECUTE ON FUNCTION supabase_functions.http_request TO postgres, anon, authenticated, service_role;
    END IF;
END $$;