-- Fix for registration API trying to set non-existent user_id column
-- The customers table uses 'id' as the primary key which matches auth.uid()
-- There is no 'user_id' column in the customers table

-- This migration documents the bug and provides the correct schema reference
-- The registration API at /app/api/registrations/route.ts line 197 needs to be fixed
-- It should NOT set user_id when creating a customer record

-- Correct customer table structure:
-- customers.id = auth.uid() (the primary key)
-- customers.contact_id = reference to contacts table
-- The auth user link is: auth.users -> contacts (via auth_user_id) -> customers (via contact_id)

-- Verify the current structure
DO $$
BEGIN
  -- Check if user_id column exists (it shouldn't)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'user_id'
  ) THEN
    RAISE WARNING 'Unexpected: customers table has a user_id column. The RLS policies may need adjustment.';
  ELSE
    RAISE NOTICE 'Confirmed: customers table correctly uses id as primary key (no user_id column).';
  END IF;
END $$;

-- Note: The API code needs to be fixed to remove the line:
-- user_id: customerId, // This line should be removed as the column doesn't exist