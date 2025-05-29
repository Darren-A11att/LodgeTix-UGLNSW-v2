# TODO-001: Payment Processing Migration

## Overview
Migrate payment processing from current complex multi-table update to new simplified schema.

## Current Implementation
- **Location**: `/app/api/registrations/[id]/payment/route.ts`
- **Tables affected**: 
  - `registrations` (update payment status)
  - `tickets` (update ticket status)
  - `attendees` (indirect relationship)
- **Process**:
  1. Create Stripe payment intent
  2. Update registration payment status
  3. Update all related tickets
  4. Generate confirmation number

## New Schema Changes
- **Single RPC call**: `confirm_payment_and_issue_tickets`
- **Simplified flow**:
  1. Call RPC with payment details
  2. RPC handles all updates atomically
  3. Returns confirmation data

## Migration Tasks
- [ ] Update payment route to use new RPC function
- [ ] Remove multi-table update logic
- [ ] Update response structure to match new schema
- [ ] Handle 3D Secure flows with new structure
- [ ] Update confirmation number generation

## Code Changes Required
```typescript
// Old: Multiple table updates
await adminClient.from('registrations').update(...)
await adminClient.from('tickets').update(...)

// New: Single RPC call
await adminClient.rpc('confirm_payment_and_issue_tickets', {
  p_registration_id: registrationId,
  p_payment_intent_id: paymentIntentId,
  p_amount_paid: totalAmount
})
```

## Testing Requirements
- [ ] Test successful payment flow
- [ ] Test 3D Secure authentication
- [ ] Test payment failure scenarios
- [ ] Verify atomic transaction behavior
- [ ] Test confirmation email generation