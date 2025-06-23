# TODO Checklist: Square Orders API Migration for Lodge Registration

## Phase 1: Database Schema Updates
- [ ] Create database migration for packages table
  - [ ] Add `catalog_items` JSONB column
  - [ ] Rename `qty` column to `quantity`
  - [ ] Add migration rollback script
- [ ] Create database migration for event_tickets table
  - [ ] Add `catalog_object_id` TEXT column
  - [ ] Add migration rollback script
- [ ] Update Supabase types to reflect new schema

## Phase 2: Square API Integration Research
- [ ] Research Square Customers API
  - [ ] Understand customer creation requirements
  - [ ] Identify required vs optional fields
  - [ ] Test API endpoints in sandbox
- [ ] Research Square Orders API
  - [ ] Understand order structure and requirements
  - [ ] Study line item configuration
  - [ ] Research inventory allocation process
  - [ ] Test order creation flow in sandbox
- [ ] Research Square catalog integration
  - [ ] Understand catalog object structure
  - [ ] Verify inventory tracking capabilities
- [ ] Document API rate limits and best practices

## Phase 3: Test-Driven Development Setup
- [ ] Write tests for database schema changes
- [ ] Write tests for Square customer creation
- [ ] Write tests for order creation with line items
- [ ] Write tests for order payment processing
- [ ] Write tests for error handling scenarios
- [ ] Write integration tests for full flow

## Phase 4: Core Implementation
- [ ] Create Square customer service
  - [ ] Implement create customer function
  - [ ] Implement customer lookup/update
  - [ ] Add error handling and logging
- [ ] Create Square orders service
  - [ ] Implement create order function
  - [ ] Implement line item mapping
  - [ ] Implement update order function
  - [ ] Implement pay order function
- [ ] Update lodge registration API route
  - [ ] Integrate customer creation
  - [ ] Integrate order creation
  - [ ] Update payment processing flow
  - [ ] Update response structure
- [ ] Update lodge registration form
  - [ ] Fetch catalog_object_id with packages
  - [ ] Update data structures for orders
  - [ ] Fix lodgeTableOrder undefined error

## Phase 5: Data Consolidation
- [ ] Consolidate lodgeTicketOrder and lodgeTableOrder
  - [ ] Create new unified lodgeOrder structure
  - [ ] Update all references in components
  - [ ] Update store actions and state
  - [ ] Remove deprecated properties

## Phase 6: Testing and Validation
- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Test lodge registration end-to-end
- [ ] Verify Square dashboard integration
- [ ] Test error scenarios
- [ ] Test refund capabilities

## Phase 7: Documentation and Cleanup
- [ ] Update API documentation
- [ ] Update component documentation
- [ ] Remove temporary files and scripts
- [ ] Update developer guidelines
- [ ] Create migration guide

## Phase 8: Deployment Preparation
- [ ] Create deployment checklist
- [ ] Prepare rollback procedures
- [ ] Update monitoring and alerts
- [ ] Prepare customer communication

## Critical Path Items
1. Database migrations must complete before API changes
2. Square API integration must be tested in sandbox first
3. Tests must be written before implementation
4. Data consolidation should fix current errors

## Success Metrics
- [ ] All tests passing
- [ ] Lodge registration creates Square orders
- [ ] No "lodgeTableOrder is not defined" errors
- [ ] Orders visible in Square dashboard
- [ ] Inventory properly tracked