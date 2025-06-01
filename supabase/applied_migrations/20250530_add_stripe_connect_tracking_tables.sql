-- Add tables for Stripe Connect tracking

-- Track payouts to connected accounts
CREATE TABLE IF NOT EXISTS public.organisation_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id TEXT NOT NULL UNIQUE,
  organisation_stripe_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  arrival_date TIMESTAMPTZ NOT NULL,
  method TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track transfers from platform to connected accounts
CREATE TABLE IF NOT EXISTS public.platform_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transfer_id TEXT NOT NULL UNIQUE,
  source_transaction TEXT,
  destination_account TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track payments made through connected accounts
CREATE TABLE IF NOT EXISTS public.connected_account_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_intent_id TEXT NOT NULL,
  connected_account_id TEXT NOT NULL,
  registration_id UUID REFERENCES registrations(registration_id),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2),
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update organisations table with Connect status fields
ALTER TABLE public.organisations 
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_capabilities JSONB;

-- Update registrations table with Connect-specific fields
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS connected_account_id TEXT,
ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_fee_id TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organisation_payouts_stripe_id ON public.organisation_payouts(organisation_stripe_id);
CREATE INDEX IF NOT EXISTS idx_organisation_payouts_created_at ON public.organisation_payouts(created_at);
CREATE INDEX IF NOT EXISTS idx_platform_transfers_destination ON public.platform_transfers(destination_account);
CREATE INDEX IF NOT EXISTS idx_connected_payments_account ON public.connected_account_payments(connected_account_id);
CREATE INDEX IF NOT EXISTS idx_connected_payments_registration ON public.connected_account_payments(registration_id);

-- Add comments
COMMENT ON TABLE public.organisation_payouts IS 'Tracks Stripe payouts to connected accounts';
COMMENT ON TABLE public.platform_transfers IS 'Tracks transfers from platform to connected accounts';
COMMENT ON TABLE public.connected_account_payments IS 'Tracks payments processed through connected accounts';
COMMENT ON COLUMN public.organisations.stripe_account_status IS 'Status of Stripe Connect account: pending, active, restricted, etc';
COMMENT ON COLUMN public.organisations.stripe_capabilities IS 'JSON object containing Stripe capability statuses';
COMMENT ON COLUMN public.registrations.connected_account_id IS 'Stripe connected account ID that received the payment';
COMMENT ON COLUMN public.registrations.platform_fee_amount IS 'Platform fee amount in dollars';
COMMENT ON COLUMN public.registrations.platform_fee_id IS 'Stripe application fee ID';