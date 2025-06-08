-- Add RLS policies to allow anonymous users to create organisations and lodges

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "organisations_anon_insert" ON "public"."organisations";
DROP POLICY IF EXISTS "lodges_anon_insert" ON "public"."lodges";

-- Create policy for organisations table
-- Allows anonymous users to create new organisations of type 'lodge'
CREATE POLICY "organisations_anon_insert" 
ON "public"."organisations" 
FOR INSERT 
TO anon 
WITH CHECK (type = 'lodge');

-- Create policy for lodges table  
-- Allows anonymous users to create new lodges
CREATE POLICY "lodges_anon_insert" 
ON "public"."lodges" 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Add a comment explaining the policies
COMMENT ON POLICY "organisations_anon_insert" ON "public"."organisations" IS 'Allows anonymous users to create lodge organisations during registration';
COMMENT ON POLICY "lodges_anon_insert" ON "public"."lodges" IS 'Allows anonymous users to create new lodges during registration';