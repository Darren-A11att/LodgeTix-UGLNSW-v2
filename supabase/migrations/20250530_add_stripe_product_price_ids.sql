-- Add Stripe product ID to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS stripe_product_id text;

-- Add Stripe price ID to event_tickets table
ALTER TABLE public.event_tickets 
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_stripe_product_id 
ON public.events(stripe_product_id) 
WHERE stripe_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_tickets_stripe_price_id 
ON public.event_tickets(stripe_price_id)
WHERE stripe_price_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.events.stripe_product_id IS 'Stripe Product ID for this event (synced to connected account)';
COMMENT ON COLUMN public.event_tickets.stripe_price_id IS 'Stripe Price ID for this ticket type (synced to connected account)';