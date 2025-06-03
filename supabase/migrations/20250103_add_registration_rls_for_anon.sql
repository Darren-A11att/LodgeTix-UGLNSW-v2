-- Add RLS policies for anonymous users to create registrations
-- This is a better approach than using service role key

-- Enable RLS on registrations table if not already enabled
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Anonymous users can create own registrations" ON registrations;

-- Allow anonymous users to insert their own registrations
CREATE POLICY "Anonymous users can create own registrations" 
ON registrations 
FOR INSERT 
TO anon
WITH CHECK (
    -- Allow insert if the auth_user_id matches or is null (for truly anonymous)
    auth.uid() IS NULL OR auth.uid() = (
        SELECT auth_user_id 
        FROM contacts 
        WHERE contact_id = registrations.contact_id
    )
);

-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Users can view own registrations" ON registrations;

-- Allow users to view their own registrations
CREATE POLICY "Users can view own registrations" 
ON registrations 
FOR SELECT 
USING (
    -- Public registrations (when we add that feature)
    -- OR registrations linked to the current user
    auth.uid() = (
        SELECT auth_user_id 
        FROM contacts 
        WHERE contact_id = registrations.contact_id
    )
    -- OR registrations without auth (for anonymous viewing by registration ID)
    OR (
        SELECT auth_user_id 
        FROM contacts 
        WHERE contact_id = registrations.contact_id
    ) IS NULL
);

-- Drop existing update policy if it exists  
DROP POLICY IF EXISTS "Users can update own registrations" ON registrations;

-- Allow users to update their own registrations
CREATE POLICY "Users can update own registrations" 
ON registrations 
FOR UPDATE 
USING (
    auth.uid() = (
        SELECT auth_user_id 
        FROM contacts 
        WHERE contact_id = registrations.contact_id
    )
    OR (
        SELECT auth_user_id 
        FROM contacts 
        WHERE contact_id = registrations.contact_id
    ) IS NULL
)
WITH CHECK (
    auth.uid() = (
        SELECT auth_user_id 
        FROM contacts 
        WHERE contact_id = registrations.contact_id
    )
    OR (
        SELECT auth_user_id 
        FROM contacts 
        WHERE contact_id = registrations.contact_id
    ) IS NULL
);

-- Also ensure contacts table allows anonymous inserts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous users can create contacts" ON contacts;

CREATE POLICY "Anonymous users can create contacts" 
ON contacts 
FOR INSERT 
TO anon
WITH CHECK (
    -- Allow if auth_user_id is null or matches current user
    auth_user_id IS NULL OR auth_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;

CREATE POLICY "Users can view own contacts" 
ON contacts 
FOR SELECT 
USING (
    auth_user_id = auth.uid() OR auth_user_id IS NULL
);

-- Also ensure tickets table allows operations
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create tickets for own registrations" ON tickets;

CREATE POLICY "Users can create tickets for own registrations" 
ON tickets 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM registrations r
        JOIN contacts c ON c.contact_id = r.contact_id
        WHERE r.registration_id = tickets.registration_id
        AND (c.auth_user_id = auth.uid() OR c.auth_user_id IS NULL)
    )
);

DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;

CREATE POLICY "Users can view own tickets" 
ON tickets 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM registrations r
        JOIN contacts c ON c.contact_id = r.contact_id
        WHERE r.registration_id = tickets.registration_id
        AND (c.auth_user_id = auth.uid() OR c.auth_user_id IS NULL)
    )
);

-- Grant necessary permissions
GRANT INSERT, SELECT, UPDATE ON registrations TO anon;
GRANT INSERT, SELECT ON contacts TO anon;
GRANT INSERT, SELECT ON tickets TO anon;
GRANT SELECT ON packages TO anon;
GRANT SELECT ON event_tickets TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON functions TO anon;

-- Add comment
COMMENT ON POLICY "Anonymous users can create own registrations" ON registrations IS 
'Allows anonymous users to create registrations. This is needed for lodge registrations where users may not have accounts.';