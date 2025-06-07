# TODO-001: Update Payment Intent Creation for Stripe Connect

## Overview
Update the payment processing flow to use Stripe Connect with direct charges, sending payments directly to connected accounts while collecting platform fees.

## Current State
- Payments go directly to the platform's Stripe account
- No use of connected accounts
- Organizations have `stripe_onbehalfof` field but it's not used

## Required Changes

### 1. Update Payment API Route (`/app/api/registrations/[id]/payment/route.ts`)

#### Fetch Organization Data
```typescript
// Before creating payment intent, fetch the organization's connected account
const { data: registration } = await adminClient
  .from('registrations')
  .select(`
    *,
    events!inner(
      event_id,
      title,
      slug,
      organiser,
      organisations!inner(
        organisation_id,
        name,
        stripe_onbehalfof
      )
    )
  `)
  .eq('registration_id', registrationId)
  .single();

// Validate connected account exists
if (!registration?.events?.organisations?.stripe_onbehalfof) {
  throw new Error('Organization does not have a connected Stripe account');
}

const connectedAccountId = registration.events.organisations.stripe_onbehalfof;
```

#### Update Payment Intent Creation
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(totalAmount * 100), // Amount in cents
  currency: 'aud',
  payment_method: paymentMethodId,
  confirmation_method: 'manual',
  confirm: false,
  
  // STRIPE CONNECT PARAMETERS
  on_behalf_of: connectedAccountId, // Route payment to connected account
  
  // Platform fee (5% example - make this configurable)
  application_fee_amount: Math.round(totalAmount * 0.05 * 100),
  
  // Statement descriptor (max 22 chars)
  statement_descriptor_suffix: registration.events.title.substring(0, 22).replace(/[^a-zA-Z0-9 ]/g, ''),
  
  // Comprehensive metadata
  metadata: {
    // Registration details
    registration_id: registrationId,
    registration_type: registration.registration_type,
    
    // Event hierarchy
    parent_event_id: registration.events.parent_event_id || registration.event_id,
    parent_event_title: registration.events.title,
    parent_event_slug: registration.events.slug,
    
    // Organization details
    organisation_id: registration.events.organisations.organisation_id,
    organisation_name: registration.events.organisations.name,
    
    // Attendee summary
    total_attendees: registration.attendee_count,
    
    // Financial details
    subtotal: registration.subtotal,
    total_amount_paid: totalAmount,
    platform_fee: (totalAmount * 0.05).toFixed(2),
    
    // Timestamps
    created_at: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  },
});
```

### 2. Update Lodge Registration Route (`/app/api/registrations/lodge/route.ts`)

Add similar organization fetching and payment intent parameters for lodge-specific registrations.

### 3. Add Child Events and Tickets to Metadata

```typescript
// Fetch child events and tickets
const { data: tickets } = await adminClient
  .from('tickets')
  .select(`
    *,
    event_tickets!inner(
      title,
      price,
      event_id
    )
  `)
  .eq('registration_id', registrationId);

// Add to metadata (Stripe has 500 char limit per value)
const ticketSummary = tickets?.map(t => ({
  id: t.ticket_id,
  type: t.event_tickets.title,
  price: t.event_tickets.price,
  event: t.event_id
}));

metadata: {
  ...previousMetadata,
  
  // Ticket details (stringify if needed for length)
  tickets_count: tickets?.length || 0,
  tickets_summary: JSON.stringify(ticketSummary).substring(0, 500),
  
  // Add child event IDs if this is a parent event
  child_event_ids: childEventIds?.join(',') || ''
}
```

### 4. Error Handling

```typescript
try {
  // Check if connected account is active
  const account = await stripe.accounts.retrieve(connectedAccountId);
  
  if (!account.charges_enabled) {
    throw new Error('Connected account cannot accept charges yet');
  }
  
  // Create payment intent...
} catch (error) {
  if (error.type === 'StripeInvalidRequestError' && error.code === 'account_invalid') {
    // Handle invalid connected account
    return NextResponse.json({
      error: 'The organization\'s payment account is not properly configured'
    }, { status: 400 });
  }
  
  // Handle other errors...
}
```

### 5. Update Confirmation Logic

When confirming the payment intent:
```typescript
const confirmedIntent = await stripe.paymentIntents.confirm(
  paymentIntent.id,
  {
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${registration.events.slug}/confirmation?registration_id=${registrationId}`,
  },
  {
    stripeAccount: connectedAccountId // Important for Connect
  }
);
```

## Implementation Checklist

- [ ] Update `/app/api/registrations/[id]/payment/route.ts` to fetch organization data
- [ ] Add `on_behalf_of` parameter to payment intent creation
- [ ] Add `application_fee_amount` for platform fees (make percentage configurable)
- [ ] Add `statement_descriptor_suffix` with event title
- [ ] Implement comprehensive metadata structure
- [ ] Add proper error handling for connected account issues
- [ ] Update lodge registration route with same changes
- [ ] Test with test connected accounts
- [ ] Add logging for Connect-specific operations

## Testing Notes

1. Test with Stripe test connected accounts
2. Verify funds appear in connected account dashboard
3. Confirm platform fees are collected correctly
4. Check statement descriptors on bank statements
5. Validate metadata appears in Stripe Dashboard

## Configuration Needed

Add to environment variables:
```bash
# Platform fee percentage (0.05 = 5%)
STRIPE_PLATFORM_FEE_PERCENTAGE=0.05
```

## Related Files
- `/app/api/registrations/[id]/payment/route.ts`
- `/app/api/registrations/lodge/route.ts`
- `/app/api/stripe/create-payment-intent/route.ts`
- `/utils/supabase/admin.ts`