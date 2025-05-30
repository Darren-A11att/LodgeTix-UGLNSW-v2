# TODO-003: Update Webhook Handling for Stripe Connect

## Overview
Enhance the webhook handler to support Stripe Connect events and properly handle payment flows with connected accounts.

## Current State
- Basic webhook handling for payment intents (succeeded, failed, requires_action)
- No handling for Connect-specific events
- No differentiation between platform and connected account events

## Required Changes

### 1. Update Webhook Endpoint (`/app/api/stripe/webhook/route.ts`)

#### Add Connect Event Types
```typescript
// Add to the switch statement in webhook handler
switch (event.type) {
  // Existing payment intent events
  case 'payment_intent.succeeded':
    await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
    break;
    
  // Connect-specific events
  case 'account.updated':
    await handleAccountUpdated(event.data.object as Stripe.Account);
    break;
    
  case 'account.application.authorized':
    await handleAccountAuthorized(event.data.object as Stripe.Account);
    break;
    
  case 'account.application.deauthorized':
    await handleAccountDeauthorized(event.data.object as Stripe.Account);
    break;
    
  case 'capability.updated':
    await handleCapabilityUpdated(event.data.object as Stripe.Capability);
    break;
    
  case 'payout.created':
    await handlePayoutCreated(event.data.object as Stripe.Payout);
    break;
    
  case 'payout.failed':
    await handlePayoutFailed(event.data.object as Stripe.Payout);
    break;
    
  case 'payout.paid':
    await handlePayoutPaid(event.data.object as Stripe.Payout);
    break;
    
  case 'transfer.created':
    await handleTransferCreated(event.data.object as Stripe.Transfer);
    break;
    
  case 'application_fee.created':
    await handleApplicationFeeCreated(event.data.object as Stripe.ApplicationFee);
    break;
}
```

#### Implement Connect Event Handlers

```typescript
async function handleAccountUpdated(account: Stripe.Account) {
  console.log("🏦 Account Updated:", account.id);
  
  const adminClient = createAdminClient();
  
  // Update organization's Stripe account status
  const { error } = await adminClient
    .from('organisations')
    .update({
      stripe_account_status: account.charges_enabled ? 'active' : 'pending',
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_details_submitted: account.details_submitted,
      stripe_capabilities: {
        card_payments: account.capabilities?.card_payments,
        transfers: account.capabilities?.transfers
      },
      updated_at: new Date().toISOString()
    })
    .eq('stripe_onbehalfof', account.id);
    
  if (error) {
    console.error("Error updating organization:", error);
  }
  
  // Send notification if account becomes active
  if (account.charges_enabled && account.payouts_enabled) {
    // TODO: Send email notification to organization
    console.log("✅ Account fully activated:", account.id);
  }
}

async function handlePayoutCreated(payout: Stripe.Payout) {
  console.log("💸 Payout Created:", payout.id);
  console.log("Amount:", payout.amount / 100, payout.currency.toUpperCase());
  console.log("Arrival Date:", new Date(payout.arrival_date * 1000).toISOString());
  
  const adminClient = createAdminClient();
  
  // Log payout in database for reporting
  const { error } = await adminClient
    .from('organisation_payouts')
    .insert({
      payout_id: payout.id,
      organisation_stripe_id: payout.destination as string,
      amount: payout.amount / 100,
      currency: payout.currency,
      status: payout.status,
      arrival_date: new Date(payout.arrival_date * 1000).toISOString(),
      method: payout.method,
      description: payout.description,
      metadata: payout.metadata,
      created_at: new Date().toISOString()
    });
    
  if (error) {
    console.error("Error logging payout:", error);
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log("🔄 Transfer Created:", transfer.id);
  console.log("Amount:", transfer.amount / 100, transfer.currency.toUpperCase());
  console.log("Destination:", transfer.destination);
  
  // Log transfer for reconciliation
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
    .from('platform_transfers')
    .insert({
      transfer_id: transfer.id,
      source_transaction: transfer.source_transaction,
      destination_account: transfer.destination as string,
      amount: transfer.amount / 100,
      currency: transfer.currency,
      description: transfer.description,
      metadata: transfer.metadata,
      created_at: new Date().toISOString()
    });
    
  if (error) {
    console.error("Error logging transfer:", error);
  }
}

async function handleApplicationFeeCreated(fee: Stripe.ApplicationFee) {
  console.log("💰 Application Fee Created:", fee.id);
  console.log("Amount:", fee.amount / 100, fee.currency.toUpperCase());
  
  // Update registration with platform fee details
  const registrationId = fee.charge?.metadata?.registration_id;
  
  if (registrationId) {
    const adminClient = createAdminClient();
    
    const { error } = await adminClient
      .from('registrations')
      .update({
        platform_fee_amount: fee.amount / 100,
        platform_fee_id: fee.id,
        updated_at: new Date().toISOString()
      })
      .eq('registration_id', registrationId);
      
    if (error) {
      console.error("Error updating registration with fee:", error);
    }
  }
}
```

### 2. Update Payment Intent Handler for Connect

```typescript
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("💰 Payment Intent Succeeded:", paymentIntent.id);
  console.log("Amount:", paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
  
  // Check if this is a Connect payment
  const connectedAccountId = paymentIntent.on_behalf_of;
  const applicationFeeAmount = paymentIntent.application_fee_amount;
  
  if (connectedAccountId) {
    console.log("🏦 Connected Account:", connectedAccountId);
    console.log("💸 Platform Fee:", applicationFeeAmount ? applicationFeeAmount / 100 : 0);
  }
  
  const registrationId = paymentIntent.metadata?.registration_id;
  
  if (!registrationId) {
    console.error("No registration ID found in payment intent metadata");
    return;
  }
  
  const adminClient = createAdminClient();
  
  // Update registration with Connect details
  const updateData: any = {
    status: 'paid',
    payment_status: 'completed',
    stripe_payment_intent_id: paymentIntent.id,
    total_amount_paid: paymentIntent.amount / 100,
    updated_at: new Date().toISOString()
  };
  
  // Add Connect-specific fields
  if (connectedAccountId) {
    updateData.connected_account_id = connectedAccountId;
    updateData.platform_fee_amount = applicationFeeAmount ? applicationFeeAmount / 100 : 0;
  }
  
  const { error: updateError } = await adminClient
    .from('registrations')
    .update(updateData)
    .eq('registration_id', registrationId);
    
  if (updateError) {
    console.error("Error updating registration:", updateError);
  }
  
  // Log payment for connected account reporting
  if (connectedAccountId) {
    const { error: logError } = await adminClient
      .from('connected_account_payments')
      .insert({
        payment_intent_id: paymentIntent.id,
        connected_account_id: connectedAccountId,
        registration_id: registrationId,
        amount: paymentIntent.amount / 100,
        platform_fee: applicationFeeAmount ? applicationFeeAmount / 100 : 0,
        currency: paymentIntent.currency,
        status: 'succeeded',
        created_at: new Date().toISOString()
      });
      
    if (logError) {
      console.error("Error logging connected account payment:", logError);
    }
  }
}
```

### 3. Handle Multiple Webhook Endpoints

```typescript
// Add support for both platform and connected account webhooks
export async function POST(request: NextRequest) {
  const accountId = request.headers.get('stripe-account');
  
  console.group(accountId ? 
    `🔔 Connected Account Webhook (${accountId})` : 
    "🔔 Platform Webhook"
  );
  
  // Use different webhook secrets for platform vs connected accounts
  const webhookSecret = accountId ? 
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET! : 
    process.env.STRIPE_WEBHOOK_SECRET!;
    
  // ... rest of webhook handling
}
```

### 4. Database Schema Updates

```sql
-- Add tables for Connect tracking
CREATE TABLE organisation_payouts (
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

CREATE TABLE platform_transfers (
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

CREATE TABLE connected_account_payments (
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

-- Update organisations table
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'pending';
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS stripe_capabilities JSONB;

-- Update registrations table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS connected_account_id TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10,2);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS platform_fee_id TEXT;
```

## Implementation Checklist

- [ ] Add Connect event types to webhook handler
- [ ] Implement account.updated handler
- [ ] Implement payout event handlers
- [ ] Implement transfer.created handler
- [ ] Implement application_fee.created handler
- [ ] Update payment_intent.succeeded for Connect
- [ ] Add support for multiple webhook endpoints
- [ ] Create database tables for Connect tracking
- [ ] Update organisation and registration tables
- [ ] Add proper logging for all Connect events
- [ ] Test with Stripe CLI for all event types

## Testing with Stripe CLI

```bash
# Forward platform webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test Connect events
stripe trigger account.updated
stripe trigger payout.created
stripe trigger transfer.created
stripe trigger payment_intent.succeeded --add payment_intent:on_behalf_of=acct_xxx

# Test with specific connected account
stripe trigger payment_intent.succeeded \
  --add payment_intent:on_behalf_of=acct_1234567890 \
  --add payment_intent:application_fee_amount=500 \
  --add payment_intent:metadata.registration_id=test-reg-id
```

## Environment Variables Needed

```bash
# Existing
STRIPE_WEBHOOK_SECRET=whsec_xxx

# New for Connect
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_xxx_connect
```

## Monitoring and Alerts

1. Set up alerts for:
   - Failed payouts
   - Account deauthorization
   - Transfer failures
   - Capability changes

2. Create dashboard showing:
   - Active connected accounts
   - Pending payouts
   - Platform fees collected
   - Transfer history