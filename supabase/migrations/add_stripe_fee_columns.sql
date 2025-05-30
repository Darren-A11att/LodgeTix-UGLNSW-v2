-- Add columns to track Stripe fees in registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS stripe_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS includes_processing_fee BOOLEAN DEFAULT false;

-- Create a view to show fee breakdown and organization revenue
CREATE OR REPLACE VIEW public.registration_fee_summary AS
SELECT 
  r.registration_id,
  r.confirmation_number,
  r.subtotal as ticket_subtotal,
  r.stripe_fee as processing_fee,
  r.total_amount as total_charged,
  r.platform_fee_amount as marketplace_fee,
  (r.subtotal - COALESCE(r.platform_fee_amount, 0)) as organization_receives,
  r.created_at,
  r.payment_status,
  e.title as event_title,
  o.name as organization_name,
  o.stripe_onbehalfof as connected_account_id
FROM registrations r
LEFT JOIN events e ON r.event_id = e.event_id
LEFT JOIN organisations o ON e.organiser_id = o.organisation_id;

-- Add comment to explain the columns
COMMENT ON COLUMN public.registrations.subtotal IS 'Original ticket price total before any fees';
COMMENT ON COLUMN public.registrations.stripe_fee IS 'Stripe processing fee passed to customer';
COMMENT ON COLUMN public.registrations.includes_processing_fee IS 'Whether the total_amount includes the processing fee';
COMMENT ON VIEW public.registration_fee_summary IS 'View showing fee breakdown and organization revenue for each registration';