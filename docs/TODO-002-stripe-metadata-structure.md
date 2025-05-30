# TODO-002: Comprehensive Stripe Metadata Structure

## Overview
Implement a comprehensive metadata structure for all Stripe objects (payment intents, customers, products) to ensure full data availability for reporting, reconciliation, and debugging.

## Metadata Limitations
- Stripe allows up to 50 keys per object
- Each key can be up to 40 characters
- Each value can be up to 500 characters
- Total metadata size cannot exceed 8KB

## Required Metadata Structure

### 1. Payment Intent Metadata

```typescript
interface PaymentIntentMetadata {
  // Registration Core
  registration_id: string;
  registration_type: 'individual' | 'lodge' | 'delegation';
  confirmation_number: string; // REG-XXXXXXXX
  
  // Event Hierarchy
  parent_event_id: string;
  parent_event_title: string; // Truncated to 500 chars
  parent_event_slug: string;
  child_event_count: string; // Number of child events
  
  // Organization
  organisation_id: string;
  organisation_name: string;
  organisation_type: string; // 'grand_lodge', 'lodge', etc.
  
  // Attendee Information
  total_attendees: string;
  primary_attendee_name: string;
  primary_attendee_email: string;
  attendee_types: string; // "mason:5,guest:3,partner:2"
  
  // Lodge Information (if applicable)
  lodge_id?: string;
  lodge_name?: string;
  lodge_number?: string;
  grand_lodge_id?: string;
  
  // Ticket Details
  tickets_count: string;
  ticket_types: string; // "standard:5,vip:2"
  ticket_ids: string; // Comma-separated list
  
  // Financial
  subtotal: string;
  total_amount: string;
  platform_fee: string;
  platform_fee_percentage: string;
  currency: string;
  
  // Tracking
  created_at: string; // ISO timestamp
  environment: string; // 'production' | 'development'
  app_version: string; // From package.json
  
  // User Session
  user_id?: string; // If authenticated
  session_id: string; // For tracking conversion
  
  // Additional Context
  referrer?: string; // Where user came from
  device_type?: string; // 'mobile' | 'desktop' | 'tablet'
}
```

### 2. Create Stripe Products for Events

```typescript
// When an event is created/updated, sync with Stripe
async function syncEventToStripeProduct(event: Event, connectedAccountId: string) {
  const product = await stripe.products.create({
    name: event.title,
    description: event.description?.substring(0, 500),
    
    metadata: {
      event_id: event.event_id,
      parent_event_id: event.parent_event_id || '',
      event_type: event.type || 'general',
      event_slug: event.slug,
      
      organisation_id: event.organiser,
      
      event_start: event.event_start?.toISOString() || '',
      event_end: event.event_end?.toISOString() || '',
      
      location_id: event.location_id || '',
      max_attendees: String(event.max_attendees || 0),
      
      is_multi_day: String(event.is_multi_day),
      is_published: String(event.is_published),
      is_featured: String(event.featured),
      
      created_at: new Date().toISOString(),
      last_synced: new Date().toISOString()
    },
    
    // Add images if available
    images: event.image_url ? [event.image_url] : [],
    
    // Set as service since these are event tickets
    type: 'service',
    
    // Category for reporting
    tax_code: 'txcd_90020000', // Entertainment events
    
  }, {
    stripeAccount: connectedAccountId // Create on connected account
  });
  
  // Store Stripe product ID in database
  await updateEventWithStripeProductId(event.event_id, product.id);
}
```

### 3. Create Stripe Prices for Tickets

```typescript
async function syncTicketToStripePrice(ticket: EventTicket, productId: string, connectedAccountId: string) {
  const price = await stripe.prices.create({
    product: productId,
    currency: 'aud',
    unit_amount: Math.round(ticket.price * 100),
    
    nickname: ticket.title,
    
    metadata: {
      ticket_id: ticket.id,
      ticket_type: ticket.ticket_type,
      event_id: ticket.event_id,
      
      includes_meal: String(ticket.includes_meal || false),
      includes_drinks: String(ticket.includes_drinks || false),
      
      max_quantity: String(ticket.max_quantity || 0),
      min_quantity: String(ticket.min_quantity || 1),
      
      eligibility: ticket.eligibility || 'all',
      
      created_at: new Date().toISOString()
    }
  }, {
    stripeAccount: connectedAccountId
  });
  
  // Store Stripe price ID
  await updateTicketWithStripePriceId(ticket.id, price.id);
}
```

### 4. Enhanced Customer Creation

```typescript
async function createOrUpdateStripeCustomer(attendee: Attendee, connectedAccountId: string) {
  const customerData = {
    email: attendee.email,
    name: `${attendee.first_name} ${attendee.last_name}`,
    phone: attendee.phone_number,
    
    address: attendee.city && attendee.country ? {
      city: attendee.city,
      country: attendee.country,
      postal_code: attendee.postal_code,
      state: attendee.state,
      line1: attendee.address_line_1,
      line2: attendee.address_line_2
    } : undefined,
    
    metadata: {
      attendee_id: attendee.attendee_id,
      registration_id: attendee.registration_id,
      
      attendee_type: attendee.attendee_type,
      is_primary: String(attendee.is_primary_contact),
      
      // Masonic information
      mason_type: attendee.mason_type || '',
      lodge_name: attendee.lodge_name || '',
      lodge_number: attendee.lodge_number || '',
      grand_lodge: attendee.grand_lodge || '',
      masonic_rank: attendee.masonic_rank || '',
      
      // Dietary/Access
      dietary_requirements: attendee.dietary_requirements || '',
      accessibility_needs: attendee.accessibility_requirements || '',
      
      created_at: attendee.created_at,
      updated_at: new Date().toISOString()
    }
  };
  
  // Check if customer exists
  const existingCustomers = await stripe.customers.list({
    email: attendee.email,
    limit: 1
  }, {
    stripeAccount: connectedAccountId
  });
  
  if (existingCustomers.data.length > 0) {
    // Update existing
    return await stripe.customers.update(
      existingCustomers.data[0].id,
      customerData,
      { stripeAccount: connectedAccountId }
    );
  } else {
    // Create new
    return await stripe.customers.create(
      customerData,
      { stripeAccount: connectedAccountId }
    );
  }
}
```

### 5. Implementation Helper Functions

```typescript
// Helper to safely truncate metadata values
function truncateMetadataValue(value: string, maxLength: number = 500): string {
  if (!value) return '';
  return value.length > maxLength ? value.substring(0, maxLength - 3) + '...' : value;
}

// Helper to format metadata key (max 40 chars, lowercase, underscores)
function formatMetadataKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .substring(0, 40);
}

// Helper to build metadata object with validation
function buildMetadata(data: Record<string, any>): Record<string, string> {
  const metadata: Record<string, string> = {};
  let totalSize = 0;
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    
    const formattedKey = formatMetadataKey(key);
    const stringValue = truncateMetadataValue(String(value));
    
    // Check total size (8KB limit)
    const entrySize = formattedKey.length + stringValue.length;
    if (totalSize + entrySize > 8000) {
      console.warn(`Metadata size limit approaching, skipping key: ${key}`);
      continue;
    }
    
    metadata[formattedKey] = stringValue;
    totalSize += entrySize;
  }
  
  return metadata;
}
```

### 6. Aggregate Child Events Data

```typescript
async function getChildEventsMetadata(parentEventId: string): Promise<Record<string, string>> {
  const { data: childEvents } = await adminClient
    .from('events')
    .select('event_id, title, slug, event_start')
    .eq('parent_event_id', parentEventId)
    .order('event_start');
  
  if (!childEvents || childEvents.length === 0) {
    return {};
  }
  
  return {
    child_event_count: String(childEvents.length),
    child_event_ids: childEvents.map(e => e.event_id).join(',').substring(0, 500),
    child_event_titles: childEvents.map(e => e.title).join('|').substring(0, 500),
    child_event_slugs: childEvents.map(e => e.slug).join(',').substring(0, 500),
    child_event_dates: childEvents
      .map(e => e.event_start ? new Date(e.event_start).toISOString().split('T')[0] : '')
      .join(',')
      .substring(0, 500)
  };
}
```

## Implementation Checklist

- [ ] Create metadata builder utility functions
- [ ] Update payment intent creation with full metadata
- [ ] Implement event-to-product sync functionality
- [ ] Implement ticket-to-price sync functionality
- [ ] Create/update Stripe customers with metadata
- [ ] Add child events aggregation
- [ ] Add session tracking metadata
- [ ] Add device detection for metadata
- [ ] Implement metadata validation (size limits)
- [ ] Add error handling for metadata operations

## Database Schema Updates Needed

```sql
-- Add Stripe IDs to events table
ALTER TABLE events ADD COLUMN stripe_product_id TEXT;

-- Add Stripe IDs to event_tickets table
ALTER TABLE event_tickets ADD COLUMN stripe_price_id TEXT;

-- Add index for faster lookups
CREATE INDEX idx_events_stripe_product_id ON events(stripe_product_id);
CREATE INDEX idx_event_tickets_stripe_price_id ON event_tickets(stripe_price_id);
```

## Notes

1. **Metadata is searchable** - Use Stripe Dashboard to search by any metadata field
2. **Consider privacy** - Don't include sensitive personal information
3. **Use consistent formats** - Dates as ISO strings, booleans as 'true'/'false'
4. **Plan for reporting** - Structure metadata to support business intelligence needs
5. **Version tracking** - Include app version for debugging production issues