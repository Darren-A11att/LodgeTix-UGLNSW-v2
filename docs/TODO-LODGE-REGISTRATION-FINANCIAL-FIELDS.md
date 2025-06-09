# TODO: Lodge Registration Financial Fields Implementation

## Prerequisites
- [ ] Verify all existing lodge registrations in database
- [ ] Backup `upsert_lodge_registration` function
- [ ] Document current field values for comparison

## Phase 1: RPC Function Updates

### 1.1 Create Migration File
- [ ] Create new migration: `20250609000004_fix_lodge_registration_financial_fields.sql`
- [ ] Add organisation lookup logic to fetch `stripe_onbehalfof`
- [ ] Add platform fee calculation (2% capped at $20)
- [ ] Update INSERT statement to include all three fields:
  - [ ] `booking_contact_id` = `customer_id`
  - [ ] `connected_account_id` = organisation's `stripe_onbehalfof`
  - [ ] `platform_fee_amount` = calculated platform fee
- [ ] Update return JSON to include `connectedAccountId`

### 1.2 Update ON CONFLICT Clause
- [ ] Ensure UPDATE clause also sets the three fields on conflicts
- [ ] Test upsert behavior for existing registrations

## Phase 2: API Updates

### 2.1 Update TypeScript Types
- [ ] Add `connectedAccountId` to RPC response type
- [ ] Update any shared types that expect registration data

### 2.2 Update API Response
- [ ] Modify `/app/api/registrations/lodge/route.ts` POST handler
- [ ] Include `connectedAccountId` in success response
- [ ] Pass through to `registrationData` object

### 2.3 Update Payment Flow
- [ ] Verify payment intent creation uses `connected_account_id`
- [ ] Ensure Stripe Connect integration works with new field

## Phase 3: Testing

### 3.1 Write Database Tests
- [ ] Test organisation with valid `stripe_onbehalfof`
- [ ] Test organisation with NULL `stripe_onbehalfof`
- [ ] Test registration without organisation_id
- [ ] Test platform fee calculation scenarios:
  - [ ] Small amount (< $1000, fee = 2%)
  - [ ] Large amount (> $1000, fee capped at $20)
  - [ ] Zero subtotal

### 3.2 Write Integration Tests
- [ ] Test full lodge registration flow
- [ ] Verify all fields populated correctly
- [ ] Test API response includes all expected data
- [ ] Test payment processing with connected account

### 3.3 Manual Testing
- [ ] Create lodge registration via UI
- [ ] Verify fields in database
- [ ] Check Stripe dashboard for correct routing
- [ ] Test with different organisation types

## Phase 4: Data Migration

### 4.1 Analyze Existing Data
- [ ] Query count of lodge registrations missing fields
- [ ] Identify patterns in missing data
- [ ] Create backup of registrations table

### 4.2 Create Update Script
- [ ] Write script to populate missing `booking_contact_id`
- [ ] Write script to lookup and populate `connected_account_id`
- [ ] Write script to calculate and populate `platform_fee_amount`
- [ ] Add dry-run mode for testing

### 4.3 Execute Migration
- [ ] Run in dry-run mode first
- [ ] Review proposed changes
- [ ] Execute actual update
- [ ] Verify all fields populated

## Phase 5: Deployment

### 5.1 Staging Deployment
- [ ] Deploy migration to staging
- [ ] Run all tests in staging
- [ ] Verify with test transactions
- [ ] Monitor for errors

### 5.2 Production Deployment
- [ ] Schedule maintenance window
- [ ] Deploy migration
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Verify Stripe webhooks working

## Phase 6: Monitoring & Validation

### 6.1 Create Monitoring Queries
- [ ] Query to check for registrations with missing fields
- [ ] Query to verify platform fee calculations
- [ ] Query to check connected account usage

### 6.2 Set Up Alerts
- [ ] Alert if new registration missing required fields
- [ ] Alert if platform fee calculation fails
- [ ] Alert if organisation lookup fails

### 6.3 Documentation
- [ ] Update API documentation
- [ ] Document new fields in database schema
- [ ] Update developer onboarding guide
- [ ] Create runbook for troubleshooting

## Rollback Plan
- [ ] Keep original function definition
- [ ] Prepare rollback migration
- [ ] Document rollback procedure
- [ ] Test rollback in staging

## Success Metrics
- [ ] 100% of new lodge registrations have all financial fields
- [ ] No increase in registration failure rate
- [ ] Stripe payments route correctly to connected accounts
- [ ] Platform fees accurately calculated and recorded

## Notes
- Platform fee is a percentage of subtotal defined in environment varaibles, capped at $20
- Always use function's organiser_id to find the organisation's `stripe_onbehalfof` for connected_account_id
- booking_contact_id should always equal customer_id for consistency