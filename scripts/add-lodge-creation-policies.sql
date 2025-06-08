-- Add RLS policies to allow anonymous users to create organisations and lodges

-- Policy for creating organisations
CREATE POLICY "organisations_anon_insert" 
ON "public"."organisations" 
FOR INSERT 
TO anon 
WITH CHECK (type = 'lodge');

-- Policy for creating lodges
CREATE POLICY "lodges_anon_insert" 
ON "public"."lodges" 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Ensure the policies don't already exist (in case this script is run multiple times)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "organisations_anon_insert" ON "public"."organisations";
    DROP POLICY IF EXISTS "lodges_anon_insert" ON "public"."lodges";
    
    -- Create the new policies
    CREATE POLICY "organisations_anon_insert" 
    ON "public"."organisations" 
    FOR INSERT 
    TO anon 
    WITH CHECK (type = 'lodge');
    
    CREATE POLICY "lodges_anon_insert" 
    ON "public"."lodges" 
    FOR INSERT 
    TO anon 
    WITH CHECK (true);
    
    RAISE NOTICE 'Successfully created RLS policies for lodge and organisation creation';
END $$;