# Stripe Connect Sync Implementation

## Overview
This Edge Function handles synchronization between LodgeTix events/tickets and Stripe Products/Prices on connected accounts.

## Edge Function: stripe-sync

### Purpose
- Sync events to Stripe Products on the organization's connected account
- Sync ticket types to Stripe Prices
- Handle updates and deletions
- Manage rate limits and retries

### Implementation

```typescript
// supabase/functions/stripe-sync/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SyncRequest {
  type: 'event' | 'ticket'
  action: 'create' | 'update' | 'delete'
  id: string
  connectedAccountId?: string
}

serve(async (req) => {
  try {
    const { type, action, id, connectedAccountId } = await req.json() as SyncRequest

    if (type === 'event') {
      await syncEvent(id, action, connectedAccountId)
    } else if (type === 'ticket') {
      await syncTicketType(id, action, connectedAccountId)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function syncEvent(eventId: string, action: string, accountId?: string) {
  // Fetch event data with organization
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      organisations!inner(
        organisation_id,
        name,
        stripe_onbehalfof
      )
    `)
    .eq('event_id', eventId)
    .single()

  if (error || !event) {
    throw new Error('Event not found')
  }

  const connectedAccountId = accountId || event.organisations.stripe_onbehalfof
  if (!connectedAccountId) {
    console.log('No connected account for organization')
    return
  }

  if (action === 'delete' && event.stripe_product_id) {
    // Archive the product instead of deleting
    await stripe.products.update(
      event.stripe_product_id,
      { active: false },
      { stripeAccount: connectedAccountId }
    )
    return
  }

  const productData = {
    name: event.title,
    description: event.description?.substring(0, 500),
    metadata: {
      event_id: event.event_id,
      parent_event_id: event.parent_event_id || '',
      event_type: event.type || 'general',
      event_slug: event.slug,
      organisation_id: event.organisations.organisation_id,
      event_start: event.event_start || '',
      event_end: event.event_end || '',
      last_synced: new Date().toISOString()
    },
    images: event.image_url ? [event.image_url] : [],
    active: event.is_published
  }

  let product: Stripe.Product

  if (event.stripe_product_id) {
    // Update existing product
    try {
      product = await stripe.products.update(
        event.stripe_product_id,
        productData,
        { stripeAccount: connectedAccountId }
      )
    } catch (err) {
      // Product might not exist on this account, create it
      product = await stripe.products.create(
        { ...productData, id: event.stripe_product_id },
        { stripeAccount: connectedAccountId }
      )
    }
  } else {
    // Create new product
    product = await stripe.products.create(
      productData,
      { stripeAccount: connectedAccountId }
    )

    // Store Stripe product ID
    await supabase
      .from('events')
      .update({ stripe_product_id: product.id })
      .eq('event_id', eventId)
  }

  // Log sync
  await supabase
    .from('stripe_sync_log')
    .insert({
      entity_type: 'event',
      entity_id: eventId,
      stripe_object_id: product.id,
      connected_account_id: connectedAccountId,
      action,
      status: 'success',
      synced_at: new Date().toISOString()
    })
}

async function syncTicketType(ticketId: string, action: string, accountId?: string) {
  // Fetch ticket type with event and organization
  const { data: ticket, error } = await supabase
    .from('event_tickets')
    .select(`
      *,
      events!inner(
        event_id,
        title,
        stripe_product_id,
        organisations!inner(
          organisation_id,
          stripe_onbehalfof
        )
      )
    `)
    .eq('id', ticketId)
    .single()

  if (error || !ticket) {
    throw new Error('Ticket type not found')
  }

  const connectedAccountId = accountId || ticket.events.organisations.stripe_onbehalfof
  if (!connectedAccountId) {
    console.log('No connected account for organization')
    return
  }

  if (!ticket.events.stripe_product_id) {
    // Sync parent event first
    await syncEvent(ticket.event_id, 'create', connectedAccountId)
  }

  if (action === 'delete' && ticket.stripe_price_id) {
    // Archive the price instead of deleting
    await stripe.prices.update(
      ticket.stripe_price_id,
      { active: false },
      { stripeAccount: connectedAccountId }
    )
    return
  }

  const priceData = {
    product: ticket.events.stripe_product_id,
    currency: 'aud',
    unit_amount: Math.round(ticket.price * 100),
    nickname: ticket.name,
    metadata: {
      ticket_id: ticket.id,
      ticket_name: ticket.name,
      event_id: ticket.event_id,
      eligibility: JSON.stringify(ticket.eligibility_criteria || {}),
      total_capacity: String(ticket.total_capacity || 0),
      created_at: new Date().toISOString()
    }
  }

  let price: Stripe.Price

  if (ticket.stripe_price_id) {
    // Prices are immutable, so create a new one and archive the old
    try {
      await stripe.prices.update(
        ticket.stripe_price_id,
        { active: false },
        { stripeAccount: connectedAccountId }
      )
    } catch (err) {
      console.log('Could not archive old price:', err)
    }
  }

  // Always create new price (prices are immutable)
  price = await stripe.prices.create(
    priceData,
    { stripeAccount: connectedAccountId }
  )

  // Store new Stripe price ID
  await supabase
    .from('event_tickets')
    .update({ stripe_price_id: price.id })
    .eq('id', ticketId)

  // Log sync
  await supabase
    .from('stripe_sync_log')
    .insert({
      entity_type: 'ticket',
      entity_id: ticketId,
      stripe_object_id: price.id,
      connected_account_id: connectedAccountId,
      action,
      status: 'success',
      synced_at: new Date().toISOString()
    })
}
```

### Database Schema for Sync Tracking

```sql
-- Table to track sync status
CREATE TABLE stripe_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'event' or 'ticket'
  entity_id UUID NOT NULL,
  stripe_object_id TEXT NOT NULL,
  connected_account_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  status TEXT NOT NULL, -- 'success', 'failed'
  error_message TEXT,
  synced_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying sync status
CREATE INDEX idx_stripe_sync_log_entity ON stripe_sync_log(entity_type, entity_id);
CREATE INDEX idx_stripe_sync_log_status ON stripe_sync_log(status, created_at);
```

### Triggering the Sync

#### Option 1: Database Triggers (Recommended)
```sql
-- Function to call Edge Function
CREATE OR REPLACE FUNCTION trigger_stripe_sync()
RETURNS trigger AS $$
BEGIN
  -- Use pg_notify to send async notification
  PERFORM pg_notify(
    'stripe_sync',
    json_build_object(
      'type', TG_TABLE_NAME,
      'action', TG_OP,
      'id', CASE 
        WHEN TG_TABLE_NAME = 'events' THEN NEW.event_id
        WHEN TG_TABLE_NAME = 'event_tickets' THEN NEW.id
      END
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for events table
CREATE TRIGGER sync_event_to_stripe
AFTER INSERT OR UPDATE ON events
FOR EACH ROW
WHEN (NEW.stripe_product_id IS DISTINCT FROM OLD.stripe_product_id 
  OR NEW.title IS DISTINCT FROM OLD.title
  OR NEW.description IS DISTINCT FROM OLD.description
  OR NEW.is_published IS DISTINCT FROM OLD.is_published)
EXECUTE FUNCTION trigger_stripe_sync();

-- Triggers for event_tickets table  
CREATE TRIGGER sync_ticket_to_stripe
AFTER INSERT OR UPDATE ON event_tickets
FOR EACH ROW
EXECUTE FUNCTION trigger_stripe_sync();
```

#### Option 2: Application Trigger
```typescript
// In your event creation/update API
async function createEvent(eventData: any) {
  const event = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single()

  // Trigger sync asynchronously
  fetch(`${process.env.SUPABASE_URL}/functions/v1/stripe-sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'event',
      action: 'create',
      id: event.event_id
    })
  }).catch(console.error) // Don't wait for response

  return event
}
```

### Error Handling and Retries

```typescript
// Enhanced sync with retry logic
async function syncWithRetry(
  syncFn: () => Promise<void>,
  maxRetries = 3,
  delay = 1000
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await syncFn()
      return
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}
```

### Monitoring and Alerts

```sql
-- View to monitor sync health
CREATE VIEW stripe_sync_health AS
SELECT 
  entity_type,
  COUNT(*) FILTER (WHERE status = 'success' AND synced_at > NOW() - INTERVAL '1 day') as success_24h,
  COUNT(*) FILTER (WHERE status = 'failed' AND synced_at > NOW() - INTERVAL '1 day') as failed_24h,
  MAX(synced_at) as last_sync
FROM stripe_sync_log
GROUP BY entity_type;

-- Alert query for failed syncs
SELECT * FROM stripe_sync_log 
WHERE status = 'failed' 
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Best Practices

1. **Idempotency**: Ensure syncs can be safely retried
2. **Rate Limiting**: Respect Stripe's API limits (100 requests/second)
3. **Error Logging**: Log all failures for debugging
4. **Monitoring**: Set up alerts for sync failures
5. **Batch Operations**: Consider batching multiple updates
6. **Async Processing**: Never block user operations for sync

## Testing

```typescript
// Test the Edge Function locally
deno run --allow-net --allow-env supabase/functions/stripe-sync/index.ts

// Test payload
curl -X POST http://localhost:54321/functions/v1/stripe-sync \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "event",
    "action": "create",
    "id": "test-event-id"
  }'
```

This implementation ensures reliable synchronization between LodgeTix and Stripe Connect while maintaining system performance and user experience.