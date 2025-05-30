# TODO-005: Stripe Connect Testing & Validation Procedures

## Overview
Comprehensive testing procedures to validate the Stripe Connect implementation, ensuring payments are properly routed to connected accounts with correct fees and metadata.

## Test Environment Setup

### 1. Stripe Test Mode Configuration
```bash
# Environment variables for testing
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxx
STRIPE_PLATFORM_FEE_PERCENTAGE=0.05
```

### 2. Create Test Connected Accounts

```typescript
// Script to create test connected accounts
// /scripts/create-test-stripe-accounts.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

async function createTestConnectedAccount(orgName: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'AU',
    email: `${orgName.toLowerCase().replace(/\s/g, '-')}@test.com`,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'non_profit',
    business_profile: {
      name: orgName,
      mcc: '8398', // Non-profit organizations
    },
    metadata: {
      test_account: 'true',
      organisation_name: orgName,
    },
  });
  
  console.log(`Created test account for ${orgName}: ${account.id}`);
  return account;
}

// Create test accounts for different organization types
async function setupTestAccounts() {
  const testOrgs = [
    'Test Grand Lodge of NSW',
    'Test Lodge No. 123',
    'Test Masonic Centre'
  ];
  
  for (const org of testOrgs) {
    await createTestConnectedAccount(org);
  }
}
```

### 3. Update Test Organizations in Database

```sql
-- Update test organizations with test Stripe account IDs
UPDATE organisations 
SET stripe_onbehalfof = 'acct_test_grand_lodge',
    stripe_account_status = 'active',
    stripe_payouts_enabled = true,
    stripe_details_submitted = true
WHERE name = 'Grand Lodge of NSW & ACT';

-- Create test events linked to test organizations
INSERT INTO events (
  event_id,
  title,
  slug,
  organiser,
  event_start,
  event_end,
  created_at
) VALUES (
  gen_random_uuid(),
  'Test Grand Installation 2025',
  'test-grand-installation-2025',
  (SELECT organisation_id FROM organisations WHERE stripe_onbehalfof = 'acct_test_grand_lodge'),
  '2025-06-01 10:00:00+00',
  '2025-06-01 18:00:00+00',
  NOW()
);
```

## Testing Procedures

### Test Case 1: Basic Payment Flow with Connected Account

```typescript
// Test script: /tests/stripe-connect/basic-payment.test.ts

describe('Stripe Connect Basic Payment', () => {
  it('should create payment intent with connected account', async () => {
    // 1. Create test registration
    const registration = await createTestRegistration({
      eventId: 'test-event-id',
      registrationType: 'individual',
      attendeeCount: 2,
      totalAmount: 250.00
    });
    
    // 2. Create payment intent
    const response = await fetch(`/api/registrations/${registration.id}/payment`, {
      method: 'PUT',
      body: JSON.stringify({
        paymentMethodId: 'pm_card_visa',
        totalAmount: 250.00,
        billingDetails: {
          name: 'Test User',
          email: 'test@example.com'
        }
      })
    });
    
    const result = await response.json();
    
    // 3. Verify payment intent
    expect(result.success).toBe(true);
    expect(result.paymentIntentId).toBeDefined();
    
    // 4. Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      result.paymentIntentId
    );
    
    // 5. Validate Connect parameters
    expect(paymentIntent.on_behalf_of).toBe('acct_test_grand_lodge');
    expect(paymentIntent.application_fee_amount).toBe(1250); // 5% of $250
    expect(paymentIntent.metadata.organisation_id).toBeDefined();
    expect(paymentIntent.metadata.organisation_name).toBeDefined();
  });
});
```

### Test Case 2: Comprehensive Metadata Validation

```typescript
it('should include all required metadata', async () => {
  const paymentIntent = await createTestPaymentIntent();
  
  // Required metadata fields
  const requiredFields = [
    'registration_id',
    'registration_type',
    'parent_event_id',
    'parent_event_title',
    'organisation_id',
    'organisation_name',
    'total_attendees',
    'total_amount',
    'platform_fee',
    'tickets_count',
    'created_at',
    'environment'
  ];
  
  requiredFields.forEach(field => {
    expect(paymentIntent.metadata[field]).toBeDefined();
    expect(paymentIntent.metadata[field]).not.toBe('');
  });
  
  // Validate data formats
  expect(parseInt(paymentIntent.metadata.total_attendees)).toBeGreaterThan(0);
  expect(parseFloat(paymentIntent.metadata.total_amount)).toBeGreaterThan(0);
  expect(new Date(paymentIntent.metadata.created_at)).toBeInstanceOf(Date);
});
```

### Test Case 3: Statement Descriptor Validation

```typescript
it('should format statement descriptor correctly', async () => {
  const testCases = [
    {
      eventTitle: 'Grand Installation 2025',
      expected: 'Grand Installation 2025'
    },
    {
      eventTitle: 'Very Long Event Title That Exceeds Maximum Characters',
      expected: 'Very Long Event Title T' // 22 chars max
    },
    {
      eventTitle: 'Event with Special!@# Characters',
      expected: 'Event with Special Cha'
    }
  ];
  
  for (const testCase of testCases) {
    const paymentIntent = await createTestPaymentIntent({
      eventTitle: testCase.eventTitle
    });
    
    expect(paymentIntent.statement_descriptor_suffix).toBe(testCase.expected);
  }
});
```

### Test Case 4: Webhook Event Handling

```typescript
// Test webhook handler
it('should handle connect webhooks correctly', async () => {
  // 1. Simulate payment intent succeeded webhook
  const webhookPayload = {
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_123',
        amount: 25000,
        currency: 'aud',
        on_behalf_of: 'acct_test_grand_lodge',
        application_fee_amount: 1250,
        metadata: {
          registration_id: 'test-reg-id'
        }
      }
    }
  };
  
  const response = await sendWebhook(webhookPayload);
  expect(response.status).toBe(200);
  
  // 2. Verify database updates
  const registration = await getRegistration('test-reg-id');
  expect(registration.payment_status).toBe('completed');
  expect(registration.connected_account_id).toBe('acct_test_grand_lodge');
  expect(registration.platform_fee_amount).toBe(12.50);
  
  // 3. Test account.updated webhook
  const accountWebhook = {
    type: 'account.updated',
    data: {
      object: {
        id: 'acct_test_grand_lodge',
        charges_enabled: true,
        payouts_enabled: true
      }
    }
  };
  
  const accountResponse = await sendWebhook(accountWebhook);
  expect(accountResponse.status).toBe(200);
  
  // Verify organization updated
  const org = await getOrganizationByStripeId('acct_test_grand_lodge');
  expect(org.stripe_account_status).toBe('active');
});
```

### Test Case 5: Error Scenarios

```typescript
describe('Error Handling', () => {
  it('should handle missing connected account', async () => {
    // Create registration for org without Stripe account
    const response = await createPaymentForOrgWithoutStripe();
    
    expect(response.status).toBe(400);
    expect(response.error).toContain('connected Stripe account');
  });
  
  it('should handle inactive connected account', async () => {
    // Test with account that can't accept charges
    const response = await createPaymentForInactiveAccount();
    
    expect(response.status).toBe(400);
    expect(response.error).toContain('cannot accept charges');
  });
  
  it('should handle Connect API errors gracefully', async () => {
    // Test with invalid account ID
    const response = await createPaymentWithInvalidAccount();
    
    expect(response.status).toBe(500);
    expect(response.error).toBeDefined();
  });
});
```

## Manual Testing Checklist

### Pre-Payment Testing
- [ ] Verify organization has `stripe_onbehalfof` populated
- [ ] Check organization account status is 'active'
- [ ] Confirm event is linked to correct organization
- [ ] Validate test Stripe accounts are in test mode

### Payment Flow Testing
- [ ] Create individual registration
- [ ] Create lodge registration
- [ ] Create delegation registration
- [ ] Process payment with test card
- [ ] Verify payment appears in connected account dashboard
- [ ] Check platform fee is collected correctly
- [ ] Confirm metadata is complete and accurate

### Post-Payment Testing
- [ ] Check registration status updated to 'paid'
- [ ] Verify tickets status updated to 'completed'
- [ ] Confirm webhook events are received
- [ ] Validate payment appears in Stripe Dashboard
- [ ] Check connected account balance updated
- [ ] Verify platform account received fee

### Statement Testing
- [ ] Make test purchase with real test card
- [ ] Check statement descriptor format
- [ ] Verify organization name appears correctly
- [ ] Confirm no special characters cause issues

## Stripe CLI Testing Commands

```bash
# Listen to all webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger specific events
stripe trigger payment_intent.succeeded \
  --add payment_intent:metadata.registration_id=test-123 \
  --add payment_intent:on_behalf_of=acct_test_account \
  --add payment_intent:application_fee_amount=500

# Test account events
stripe trigger account.updated \
  --add account:id=acct_test_account

# Test payout events
stripe trigger payout.paid \
  --add payout:destination=acct_test_account

# List test accounts
stripe accounts list --limit 10

# Check account status
stripe accounts retrieve acct_test_account
```

## Production Readiness Checklist

### Code Review
- [ ] All payment intents include `on_behalf_of`
- [ ] Platform fees are calculated correctly
- [ ] Error handling covers all Connect scenarios
- [ ] Metadata includes all required fields
- [ ] Statement descriptors are properly formatted

### Database
- [ ] Organizations have connected account IDs
- [ ] New Connect tracking tables created
- [ ] Indexes added for performance
- [ ] Migration scripts tested

### Monitoring
- [ ] Webhook endpoint monitoring setup
- [ ] Error alerting configured
- [ ] Payment success rate tracking
- [ ] Platform fee reporting ready

### Documentation
- [ ] API documentation updated
- [ ] Organization onboarding guide created
- [ ] Troubleshooting guide prepared
- [ ] Support team trained on Connect

## Common Issues & Solutions

### Issue 1: Payment Intent Creation Fails
```
Error: No such destination: 'acct_xxx'
```
**Solution**: Verify the connected account ID exists and is active in your Stripe account.

### Issue 2: Webhook Signature Verification Fails
```
Error: Webhook signature verification failed
```
**Solution**: Ensure you're using the correct webhook secret for the environment.

### Issue 3: Platform Fee Not Applied
```
Issue: application_fee_amount is 0 or missing
```
**Solution**: Check fee calculation and ensure it's passed as integer (cents).

### Issue 4: Metadata Too Large
```
Error: Metadata exceeds maximum size
```
**Solution**: Truncate long values and remove non-essential fields.