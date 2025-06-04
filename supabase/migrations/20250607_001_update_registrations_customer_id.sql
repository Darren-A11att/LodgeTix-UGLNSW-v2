-- Update registrations table to use customer_id instead of contact_id
-- First, add customer_id column if it doesn't exist
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(customer_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_registrations_customer_id ON registrations(customer_id);

-- Note: Since registrations table doesn't have contact_id column,
-- we'll need to ensure customer_id is properly set during registration creation
-- via the RPC functions. No data migration needed here.

-- Now we need to update the foreign key constraint
-- First drop the old constraint if it exists
ALTER TABLE registrations 
DROP CONSTRAINT IF EXISTS registrations_customer_id_fkey;

-- Add the new constraint to customers table
ALTER TABLE registrations
ADD CONSTRAINT registrations_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES customers(customer_id) 
ON DELETE SET NULL;

-- Update any RLS policies that might be using contact_id
-- Drop old policies
DROP POLICY IF EXISTS "registrations_select_own" ON registrations;
DROP POLICY IF EXISTS "registrations_insert_own" ON registrations;
DROP POLICY IF EXISTS "registrations_update_own" ON registrations;

-- Create new policies using customer_id and auth_user_id
CREATE POLICY "registrations_select_own" ON registrations
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid() OR
    customer_id = auth.uid()
  );

CREATE POLICY "registrations_insert_own" ON registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_id = auth.uid() OR
    customer_id = auth.uid()
  );

CREATE POLICY "registrations_update_own" ON registrations
  FOR UPDATE TO authenticated
  USING (
    (auth_user_id = auth.uid() OR customer_id = auth.uid()) AND 
    payment_status IN ('pending', 'unpaid')
  );

-- Add comment explaining the change
COMMENT ON COLUMN registrations.customer_id IS 'References the booking contact customer record';