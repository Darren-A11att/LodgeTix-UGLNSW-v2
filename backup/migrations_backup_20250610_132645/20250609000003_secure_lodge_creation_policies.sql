-- Enhanced security for lodge creation policies

-- Drop existing policies
DROP POLICY IF EXISTS "organisations_public_insert" ON "public"."organisations";
DROP POLICY IF EXISTS "lodges_public_insert" ON "public"."lodges";

-- Create more secure policies with additional constraints

-- 1. Organisations insert policy with validation
CREATE POLICY "organisations_public_insert_secure" 
ON "public"."organisations" 
FOR INSERT 
TO public 
WITH CHECK (
    type = 'lodge' 
    AND length(name) >= 3 
    AND length(name) <= 100
    AND name !~ '[<>\"'';%]'  -- Basic XSS prevention
);

-- 2. Lodges insert policy with validation
CREATE POLICY "lodges_public_insert_secure" 
ON "public"."lodges" 
FOR INSERT 
TO public 
WITH CHECK (
    length(name) >= 3 
    AND length(name) <= 100
    AND name !~ '[<>\"'';%]'  -- Basic XSS prevention
    AND (number IS NULL OR (number >= 1 AND number <= 99999))
    AND grand_lodge_id IS NOT NULL
);

-- 3. Add rate limiting table for tracking lodge creation
CREATE TABLE IF NOT EXISTS public.lodge_creation_rate_limit (
    ip_address inet NOT NULL,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (ip_address, created_at)
);

-- Create index for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_lodge_creation_rate_limit_created 
ON public.lodge_creation_rate_limit(created_at);

-- 4. Function to check rate limit (5 creations per hour per IP)
CREATE OR REPLACE FUNCTION check_lodge_creation_rate_limit(user_ip inet)
RETURNS boolean AS $$
DECLARE
    recent_count integer;
BEGIN
    -- Count creations in the last hour
    SELECT COUNT(*) INTO recent_count
    FROM public.lodge_creation_rate_limit
    WHERE ip_address = user_ip
    AND created_at > now() - interval '1 hour';
    
    -- Allow if under limit
    RETURN recent_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to enforce rate limiting
CREATE OR REPLACE FUNCTION enforce_lodge_rate_limit()
RETURNS trigger AS $$
DECLARE
    client_ip inet;
BEGIN
    -- Get client IP from request headers (requires app to pass it)
    client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
    
    -- If we can't get IP, allow the operation (fallback)
    IF client_ip IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check rate limit
    IF NOT check_lodge_creation_rate_limit(client_ip::inet) THEN
        RAISE EXCEPTION 'Rate limit exceeded. Maximum 5 lodge creations per hour.';
    END IF;
    
    -- Record this creation attempt
    INSERT INTO public.lodge_creation_rate_limit (ip_address)
    VALUES (client_ip::inet)
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to organisations table
DROP TRIGGER IF EXISTS enforce_lodge_rate_limit_trigger ON public.organisations;
CREATE TRIGGER enforce_lodge_rate_limit_trigger
    BEFORE INSERT ON public.organisations
    FOR EACH ROW
    WHEN (NEW.type = 'lodge')
    EXECUTE FUNCTION enforce_lodge_rate_limit();

-- 6. Cleanup old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_lodge_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM public.lodge_creation_rate_limit
    WHERE created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON POLICY "organisations_public_insert_secure" ON "public"."organisations" IS 'Secure policy for public lodge organisation creation with validation';
COMMENT ON POLICY "lodges_public_insert_secure" ON "public"."lodges" IS 'Secure policy for public lodge creation with validation';
COMMENT ON TABLE public.lodge_creation_rate_limit IS 'Tracks lodge creation attempts for rate limiting';
COMMENT ON FUNCTION check_lodge_creation_rate_limit IS 'Checks if IP has exceeded lodge creation rate limit';
COMMENT ON FUNCTION enforce_lodge_rate_limit IS 'Enforces rate limiting on lodge creation';