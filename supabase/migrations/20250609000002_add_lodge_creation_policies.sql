-- Add RLS policies to allow anon and authenticated users to create organisations and lodges during registration

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "organisations_insert" ON "public"."organisations";
DROP POLICY IF EXISTS "lodges_insert" ON "public"."lodges";

-- Create policy for organisations table
-- Allows anon and authenticated users to create new organisations of type 'lodge'
CREATE POLICY "organisations_insert" 
ON "public"."organisations" 
FOR INSERT 
TO anon, authenticated
WITH CHECK (type = 'lodge');

-- Create policy for lodges table  
-- Allows anon and authenticated users to create new lodges
CREATE POLICY "lodges_insert" 
ON "public"."lodges" 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Add comments explaining the policies
COMMENT ON POLICY "organisations_insert" ON "public"."organisations" IS 'Allows anon and authenticated users to create lodge organisations during registration';
COMMENT ON POLICY "lodges_insert" ON "public"."lodges" IS 'Allows anon and authenticated users to create new lodges during registration';