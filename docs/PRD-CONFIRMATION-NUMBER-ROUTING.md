# PRD: Confirmation Number Based Routing System

## Overview
Implement a confirmation number based routing system for the registration confirmation page, where confirmation numbers are generated only after successful payment via a Supabase Edge Function.

## Background
Currently, the system generates confirmation numbers during registration creation. The new approach:
1. Edge Function listens for `status = 'completed'` AND `payment_status = 'completed'`
2. Generates sequential confirmation numbers
3. Updates the registration record
4. Confirmation page uses confirmation number for routing instead of registration ID

## Goals
1. Ensure confirmation numbers are only assigned to paid registrations
2. Maintain sequential, human-readable confirmation numbers
3. Provide a clean confirmation URL: `/confirmation/[confirmationNumber]`
4. Display complete registration details on confirmation page

## Technical Requirements

### Database Changes
1. **Remove confirmation number generation from RPC functions**
   - Update `upsert_individual_registration` to not generate confirmation numbers
   - Confirmation number remains NULL until payment completes

2. **Create comprehensive view**
   ```sql
   CREATE VIEW individuals_registration_confirmation_view AS
   SELECT 
     r.*,
     -- Include all related data
   FROM registrations r
   WHERE confirmation_number IS NOT NULL;
   ```

### API Changes
1. **New endpoint**: `GET /api/registrations/confirmation/[confirmationNumber]`
2. **Update existing endpoints** to handle NULL confirmation numbers
3. **Post-payment service** must wait for Edge Function to assign confirmation number

### Frontend Changes
1. **Route structure**: `/functions/[slug]/register/confirmation/[confirmationNumber]`
2. **Confirmation component** fetches data by confirmation number
3. **Payment success** redirects to confirmation page after number is assigned

### Edge Function Integration
- Already deployed and listening for status updates
- Generates sequential integers for confirmation numbers
- Updates registration record atomically

## User Flow
1. User completes registration form
2. Registration saved with NULL confirmation number
3. User completes payment
4. Payment service updates status to 'completed'
5. Edge Function assigns confirmation number
6. User redirected to `/confirmation/[confirmationNumber]`
7. Confirmation page displays all registration details

## Success Criteria
1. No confirmation numbers assigned to unpaid registrations
2. Sequential confirmation numbers without gaps
3. Fast confirmation page load times
4. All registration data accessible via confirmation number

## Implementation Tasks

### Phase 1: Database Layer
- [ ] Update RPC function to remove confirmation number generation
- [ ] Create confirmation number based view
- [ ] Add indexes for performance

### Phase 2: API Layer
- [ ] Create confirmation number GET endpoint
- [ ] Update post-payment flow to poll for confirmation number
- [ ] Handle edge cases (timeout, missing number)

### Phase 3: Frontend Layer
- [ ] Update routing structure
- [ ] Modify confirmation page data fetching
- [ ] Add loading state while waiting for confirmation number

### Phase 4: Testing & Validation
- [ ] End-to-end payment flow testing
- [ ] Edge case handling (failed payments, timeouts)
- [ ] Performance testing with concurrent registrations

## Risk Mitigation
1. **Race conditions**: Edge Function handles sequential generation atomically
2. **Missing numbers**: Implement retry logic in post-payment service
3. **User experience**: Show loading state while confirmation number generates

## Timeline
- Phase 1: 2 hours
- Phase 2: 3 hours
- Phase 3: 2 hours
- Phase 4: 2 hours
Total: ~1 day of implementation