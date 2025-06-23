-- Create payment_gateway table for database-driven fee configuration
-- Replaces environment variable-based payment fee configuration

-- Create table
CREATE TABLE payment_gateway (
  -- Primary key - auto-generated serial
  payment_gateway_id SERIAL PRIMARY KEY,
  
  -- UUID for external references - auto-generated
  payment_gateway_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Payment gateway identifier
  payment_gateway TEXT NOT NULL CHECK (payment_gateway IN ('square', 'stripe')),
  
  -- Fee mode
  fee_mode TEXT NOT NULL CHECK (fee_mode IN ('pass_on', 'absorb')),
  
  -- Card processing fees (stored as percentages, e.g., 2.20 for 2.20%)
  domestic_card_percentage NUMERIC(4,2) NOT NULL DEFAULT 0,
  domestic_card_fixed NUMERIC(10,2) NOT NULL DEFAULT 0,
  international_card_percentage NUMERIC(4,2) NOT NULL DEFAULT 0,
  international_card_fixed NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Platform fees
  platform_fee_percentage NUMERIC(4,2) NOT NULL DEFAULT 0,
  platform_fee_min NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee_cap NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  enabled_on TIMESTAMP WITH TIME ZONE,
  disabled_on TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT payment_gateway_uuid_unique UNIQUE (payment_gateway_uuid),
  CONSTRAINT valid_percentages CHECK (
    domestic_card_percentage >= 0 AND domestic_card_percentage <= 99.99 AND
    international_card_percentage >= 0 AND international_card_percentage <= 99.99 AND
    platform_fee_percentage >= 0 AND platform_fee_percentage <= 99.99
  ),
  CONSTRAINT valid_amounts CHECK (
    domestic_card_fixed >= 0 AND
    international_card_fixed >= 0 AND
    platform_fee_min >= 0 AND
    platform_fee_cap >= 0
  ),
  CONSTRAINT platform_fee_cap_greater_than_min CHECK (
    platform_fee_cap >= platform_fee_min OR platform_fee_cap = 0
  )
);

-- Create index for active configuration lookup
CREATE INDEX idx_payment_gateway_active ON payment_gateway(is_active) WHERE is_active = TRUE;

-- Create index for gateway type
CREATE INDEX idx_payment_gateway_type ON payment_gateway(payment_gateway);

-- Add comment to table
COMMENT ON TABLE payment_gateway IS 'Stores payment gateway configuration including fee structures. Replaces environment variable-based configuration.';

-- Add column comments
COMMENT ON COLUMN payment_gateway.payment_gateway IS 'Payment processor identifier (square or stripe)';
COMMENT ON COLUMN payment_gateway.fee_mode IS 'Whether fees are passed to customer or absorbed by merchant';
COMMENT ON COLUMN payment_gateway.domestic_card_percentage IS 'Percentage fee for domestic cards (stored as 2.20 for 2.20%)';
COMMENT ON COLUMN payment_gateway.domestic_card_fixed IS 'Fixed fee for domestic cards in dollars';
COMMENT ON COLUMN payment_gateway.international_card_percentage IS 'Percentage fee for international cards (stored as 2.20 for 2.20%)';
COMMENT ON COLUMN payment_gateway.international_card_fixed IS 'Fixed fee for international cards in dollars';
COMMENT ON COLUMN payment_gateway.platform_fee_percentage IS 'Platform fee percentage (stored as 2.00 for 2.00%)';
COMMENT ON COLUMN payment_gateway.platform_fee_min IS 'Minimum platform fee in dollars';
COMMENT ON COLUMN payment_gateway.platform_fee_cap IS 'Maximum platform fee in dollars';
COMMENT ON COLUMN payment_gateway.is_active IS 'Whether this configuration is currently active';

-- Create function to ensure only one active configuration
CREATE OR REPLACE FUNCTION ensure_single_active_payment_gateway()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting is_active to TRUE
  IF NEW.is_active = TRUE THEN
    -- Deactivate all other configurations
    UPDATE payment_gateway 
    SET 
      is_active = FALSE,
      disabled_on = NOW()
    WHERE payment_gateway_id != NEW.payment_gateway_id 
      AND is_active = TRUE;
    
    -- Set enabled_on timestamp
    NEW.enabled_on = NOW();
  ELSIF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
    -- Set disabled_on timestamp when deactivating
    NEW.disabled_on = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single active configuration
CREATE TRIGGER trigger_ensure_single_active_payment_gateway
  BEFORE INSERT OR UPDATE OF is_active
  ON payment_gateway
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_payment_gateway();

-- Insert initial Square configuration (current production values)
INSERT INTO payment_gateway (
  payment_gateway,
  fee_mode,
  domestic_card_percentage,
  domestic_card_fixed,
  international_card_percentage,
  international_card_fixed,
  platform_fee_percentage,
  platform_fee_min,
  platform_fee_cap,
  is_active
) VALUES (
  'square',
  'pass_on',
  2.20,     -- 2.2%
  0.00,     -- No fixed fee
  2.20,     -- 2.2%
  0.00,     -- No fixed fee
  2.00,     -- 2% platform fee
  1.00,     -- $1 minimum
  20.00,    -- $20 cap
  TRUE
);

-- Create RLS policies
ALTER TABLE payment_gateway ENABLE ROW LEVEL SECURITY;

-- Policy for reading active configuration (available to all authenticated users and anonymous)
CREATE POLICY "Read active payment gateway configuration" ON payment_gateway
  FOR SELECT
  USING (is_active = TRUE);

-- Policy for admin users to manage configurations (future use)
CREATE POLICY "Admin manage payment gateway" ON payment_gateway
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@lodgetix.com'
    )
  );