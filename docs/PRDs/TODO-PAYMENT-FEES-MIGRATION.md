# TODO: Payment Fees Database Migration

## Phase 1: Database Setup
- [ ] Create database migration for `payment_fees` table
- [ ] Add auto-generation triggers for payment_fees_id and payment_fees_uuid
- [ ] Create ENUM types for payment_gateway, fee_mode, and status
- [ ] Add RLS policies for payment_fees table
- [ ] Create indexes for performance (payment_gateway + status)
- [ ] Add check constraints for percentage and monetary values

## Phase 2: Data Access Layer
- [ ] Create payment-fees-service.ts for database operations
- [ ] Implement getActivePaymentFees(gateway: string) method
- [ ] Add caching layer for fee configuration
- [ ] Create type definitions for PaymentFeeConfiguration
- [ ] Write tests for service methods

## Phase 3: Update Fee Calculator
- [ ] Refactor square-fee-calculator.ts to use database values
- [ ] Update percentage handling (2.20 instead of 0.022)
- [ ] Implement zero-fee fallback logic
- [ ] Update all fee calculation tests
- [ ] Remove environment variable references

## Phase 4: Code Cleanup
- [ ] Remove all payment fee environment variables from code
- [ ] Update payment.ts config file
- [ ] Fix all case inconsistencies (square vs SQUARE)
- [ ] Update all imports and references
- [ ] Remove legacy Stripe fallback logic

## Phase 5: Testing & Validation
- [ ] Write comprehensive tests for new system
- [ ] Test zero-fee fallback scenario
- [ ] Test percentage conversion (2.20% to 0.022)
- [ ] Validate all registration types calculate correctly
- [ ] Performance test database queries

## Phase 6: Migration & Deployment
- [ ] Create seed data for current fee configuration
- [ ] Document new database configuration process
- [ ] Update .env.example to remove old variables
- [ ] Create admin UI for fee management (future)
- [ ] Plan rollback strategy