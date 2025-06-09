# TODO: Registration Improvement Implementation Checklist

## Phase 1: Create Unified Payment Service (Week 1)

### 1.1 Build Core Payment Service
- [ ] Create `/lib/services/unified-payment-service.ts`
  - [ ] Import and use stripe-fee-calculator.ts for fee calculations
  - [ ] Ensure transfer_data[amount] = exact subtotal (no modifications!)
  - [ ] Build comprehensive metadata structure for all registration types
  - [ ] Implement domestic vs international card detection
  - [ ] Add platform fee capping logic

### 1.2 Create Unified Payment Endpoint
- [ ] Create `/app/api/payments/create-intent/route.ts`
  - [ ] Accept registrationId and billingDetails in request
  - [ ] Use getRegistrationWithFullContext from stripe-queries.ts
  - [ ] Calculate fees using calculateStripeFees()
  - [ ] Build metadata with function details (NOT event details)
  - [ ] Set transfer_data.amount to exact subtotal
  - [ ] Return clientSecret, paymentIntentId, totalAmount, processingFees
  - [ ] NO status updates in this endpoint

### 1.3 Test Fee Calculations
- [ ] Write unit tests for fee calculator integration
- [ ] Test domestic card: 1.7% + $0.30
- [ ] Test international card: 3.5% + $0.30
- [ ] Test platform fee capping at $20
- [ ] Verify connected account receives exact subtotal
- [ ] Test with real Stripe test mode

## Phase 2: Enhance Individuals Registration Flow (Week 2)

### 2.1 Enhance Individuals Endpoint
- [ ] Update `/api/registrations/individuals/route.ts` POST method
  - [ ] Add registrationType detection from payload
  - [ ] Keep existing individual registration logic unchanged
  - [ ] Add lodge branch (no attendees)
  - [ ] Add delegation branch A (tickets only)
  - [ ] Add delegation branch B (with attendees)
  - [ ] Maintain raw_registrations logging for all types

### 2.2 Update Zustand Store Capture
- [ ] Update `/lib/utils/zustand-store-capture.ts`
  - [ ] Ensure captureCompleteLodgeStoreState works
  - [ ] Ensure captureCompleteDelegationStoreState works
  - [ ] Keep existing individual capture unchanged
  - [ ] Verify all types log to raw_registrations

### 2.3 Update PUT Method for Payment Completion
- [ ] Keep direct edge function invocation pattern
- [ ] Ensure it works for all registration types
- [ ] Update edge function payload with correct registration_type
- [ ] Remove any payment intent creation logic

## Phase 3: Clean Up Payment Route and Webhook (Week 2)

### 3.1 Remove Redundant Code from Payment Route
- [ ] Update `/app/api/registrations/[id]/payment/route.ts`
  - [ ] DELETE lines 343-398 (redundant callbacks to individuals/lodge)
  - [ ] DELETE lines 310-341 (status update logic)
  - [ ] Keep ONLY payment intent creation/confirmation
  - [ ] Route should NOT update registration status
  - [ ] Test that no status updates occur

### 3.2 Ensure Webhook is Authoritative
- [ ] Review `/app/api/stripe/webhook/route.ts`
  - [ ] Verify it's the ONLY place setting status='completed'
  - [ ] Ensure it updates tickets to 'sold'
  - [ ] Verify webhook signature validation
  - [ ] Test with Stripe CLI webhook forwarding
  - [ ] Ensure idempotency for duplicate events

### 3.3 Create Confirmation Polling Endpoint
- [ ] Create `/app/api/registrations/[id]/confirmation/route.ts`
  - [ ] Implement GET method for polling
  - [ ] Max 10 attempts with 500ms intervals
  - [ ] Return confirmation_number and registration_type
  - [ ] Implement fallback temporary confirmation
  - [ ] Test timeout scenarios

### 3.4 Create Stripe Metadata Update Endpoint
- [ ] Create `/app/api/stripe/update-metadata/route.ts`
  - [ ] Accept paymentIntentId, confirmationNumber, registrationId
  - [ ] Preserve existing metadata when updating
  - [ ] Add confirmationGeneratedAt timestamp
  - [ ] Handle ticket numbers (UUID fallback for now)
  - [ ] Make it fire-and-forget (non-critical)

## Phase 4: Frontend Updates (Week 3)

### 4.1 Update Payment Component
- [ ] Update to use new `/api/payments/create-intent` endpoint
- [ ] Pass billingDetails with country for fee calculation
- [ ] Handle 3D Secure with redirect_if_required
- [ ] Remove any direct status updates

### 4.2 Implement Confirmation Flow
- [ ] After payment success, poll for confirmation
- [ ] Update Stripe metadata in background
- [ ] Route to type-specific confirmation page
- [ ] Handle temporary confirmation numbers

### 4.3 Update Confirmation Pages
- [ ] Ensure routes exist:
  - [ ] `/functions/[slug]/register/confirmation/individuals/[confirmationNumber]`
  - [ ] `/functions/[slug]/register/confirmation/lodge/[confirmationNumber]`
  - [ ] `/functions/[slug]/register/confirmation/delegation/[confirmationNumber]`
- [ ] Display type-specific information
- [ ] Add download/email functionality

## Phase 5: Testing (Week 3)

### 5.1 Unit Tests
- [ ] Test unified payment service
  - [ ] Fee calculations with domestic/international cards
  - [ ] Platform fee capping at $20
  - [ ] Metadata building for all types
  - [ ] Exact subtotal in transfer_data

### 5.2 Integration Tests
- [ ] Test enhanced individuals endpoint
  - [ ] Individual registration (unchanged)
  - [ ] Lodge registration (no attendees)
  - [ ] Delegation tickets only
  - [ ] Delegation with attendees
  - [ ] Zustand store capture for all types

### 5.3 End-to-End Tests
- [ ] Complete flow for each registration type
- [ ] Test 3D Secure scenarios
- [ ] Verify webhook processing
- [ ] Test confirmation generation timing
- [ ] Verify no duplicate status updates

### 5.4 Stripe Test Mode Validation
- [ ] Use Stripe test cards
- [ ] Verify transfer amounts in dashboard
- [ ] Check metadata completeness
- [ ] Test webhook delivery

## Phase 6: Production Deployment (Week 4)

### 6.1 Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Code review completed
- [ ] Stripe test mode validation done
- [ ] Rollback plan documented

### 6.2 Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run full test suite on staging
- [ ] Test with production-like data
- [ ] Monitor logs for errors

### 6.3 Production Deployment
- [ ] Deploy during low-traffic period
- [ ] Use feature flags if possible
- [ ] Monitor Stripe dashboard
- [ ] Check for fee accuracy
- [ ] Verify confirmation generation

### 6.4 Post-Deployment Monitoring
- [ ] Monitor for 24-48 hours
- [ ] Check Stripe transfer amounts
- [ ] Verify no duplicate updates
- [ ] Review error rates
- [ ] Gather user feedback

## Critical Success Criteria

### Financial Accuracy
- [ ] Lodge registrations transfer exact subtotal (no $16.73 overpayment)
- [ ] All registration types use same fee calculation
- [ ] Platform fee correctly capped at $20

### System Efficiency
- [ ] Registration status updated only once (by webhook)
- [ ] No redundant API callbacks
- [ ] Confirmation numbers generated after payment

### Data Integrity
- [ ] Function metadata in Stripe (not event)
- [ ] All registration types handled by enhanced individuals flow
- [ ] Raw registrations captured for all types

### User Experience
- [ ] Smooth payment flow
- [ ] Quick confirmation generation
- [ ] Type-specific confirmation pages
- [ ] Clear error handling

## Post-Implementation TODOs

- [ ] Update documentation
- [ ] Train support team
- [ ] Monitor for edge cases
- [ ] Plan ticket number generation enhancement
- [ ] Consider performance optimizations
- [ ] Review and optimize database queries