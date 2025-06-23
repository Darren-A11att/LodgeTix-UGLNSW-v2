# Product Requirements Document: Square Orders API Migration for Lodge Registration

## Overview
Migrate the Lodge registration flow from using direct Square Payments API to Square's Commerce API (Orders API) to enable better inventory management, tracking, and reconciliation capabilities.

## Background
Currently, the lodge registration process directly creates payments without utilizing Square's order management system. This migration will standardize the order management process across all registration types and leverage Square's inventory tracking capabilities.

## Objectives
1. Implement Square's Orders API for lodge registrations
2. Enable inventory tracking through Square's catalog system
3. Standardize order management across all registration types
4. Improve reconciliation and reporting capabilities
5. Fix the current "lodgeTableOrder is not defined" error as part of the migration

## Technical Requirements

### Database Schema Changes
1. **packages table**
   - Add `catalog_object_id` column (TEXT) to store Square catalog object ID
   - Migrate `qty` column to `quantity` for consistency with Square's API

2. **event_tickets table**
   - Add `catalog_object_id` column (TEXT) to store Square catalog object ID

### API Integration Flow
1. **Create Customer** (Square Customers API)
   - Create new customer for each registration (no deduplication initially)
   - Store Square customer ID for reference

2. **Create Order** (Square Orders API)
   - Create order with line items based on selected packages
   - Map package quantity × user selected quantity to line item quantity
   - Use catalog_object_id for inventory allocation
   - Check inventory availability before order creation
   - Return error if inventory unavailable (no overselling)

3. **Update Order** (Square Orders API)
   - Update order with all lodge registration metadata
   - Handle billing details and additional information

4. **Pay Order** (Square Orders API)
   - Process payment for the created order (replaces direct payment API)
   - Link payment to order for complete tracking

### Data Mapping
- User selected package quantity × Package `quantity` → OrderLineItem `quantity`
- Package `catalog_object_id` → OrderLineItem `catalog_object_id`
- Remove `tableCount` concept entirely
- All lodge registration metadata → Order metadata
- Use existing Square location ID for orders

## Functional Requirements

### Lodge Registration Form
1. Fetch packages with catalog_object_id from database
2. Calculate order totals including Square fees
3. Do NOT display inventory counts to users
4. Show "Sold Out" error if inventory unavailable

### Order Creation
1. Generate unique identifiers for each line item
2. Map lodge package selections to order line items
3. Include all lodge registration metadata captured during the process
4. Fail order creation if inventory unavailable

### Payment Processing
1. Create customer record in Square (no deduplication)
2. Create order with proper line items
3. Process payment through Orders API (Pay Order endpoint)
4. Store order ID and payment references
5. Only create database registration after successful payment

### Error Handling
1. If order creation fails, show error and return to previous page
2. Do not fall back to old payment flow
3. Do not create database registration if payment fails
4. Clear error messages when user navigates back

## Non-Functional Requirements
1. **Performance**: API calls should complete within 3 seconds
2. **Reliability**: Implement proper error handling and rollback
3. **Security**: Protect sensitive customer data
4. **Compatibility**: Maintain backward compatibility during migration

## Success Criteria
1. Lodge registrations successfully create orders in Square
2. Inventory is properly tracked for packages
3. Orders appear correctly in Square dashboard
4. Reconciliation reports show complete order information
5. No "lodgeTableOrder is not defined" errors

## Out of Scope
- Migration of other registration types (will be done separately)
- Historical data migration
- Square catalog item creation (assumed to exist)

## Dependencies
- Square API credentials and permissions
- Database migration capabilities
- Existing Square catalog items

## Timeline
- Phase 1: Database schema updates and API research
- Phase 2: Test-driven development of new API flow
- Phase 3: Integration and testing
- Phase 4: Deployment and monitoring

## Risks
1. API rate limits during high-volume periods
2. Catalog item mismatches
3. Payment processing delays
4. Data consistency during migration

## Implementation Notes
1. catalog_object_id will be populated manually for existing packages
2. No fallback for missing catalog items - registration should fail
3. Refunds will be handled manually through Square interface
4. Replace tableCount concept with package quantity multiplier
5. All metadata from lodge registration process should be included in order