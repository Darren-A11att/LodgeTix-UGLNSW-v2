-- Fix RLS policies for payment_gateway table
-- The previous policy was causing permission errors when checking auth.users table

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admin manage payment gateway" ON payment_gateway;

-- Create a simpler read policy that works for everyone (including API routes)
DROP POLICY IF EXISTS "Read active payment gateway configuration" ON payment_gateway;

CREATE POLICY "Anyone can read active payment gateway configuration" ON payment_gateway
  FOR SELECT
  USING (is_active = TRUE);

-- For now, only allow modifications through direct database access or service role
-- This prevents accidental changes while still allowing reads from API routes