# TODO: Registration Data Normalization

## Phase 1: Individual Registration API Fix

### 1. Create Test Suite for Registration Data Storage
- [ ] Create test file for individual registration API
- [ ] Write test for customer record creation
- [ ] Write test for contact record creation
- [ ] Write test for attendee record creation
- [ ] Write test for ticket record creation
- [ ] Write test for registration record with all fields
- [ ] Write test for price calculation
- [ ] Write test for transaction rollback on failure

### 2. Create Data Transformation Services
- [ ] Create customer data transformer (billing → customer)
- [ ] Create contact data transformer (attendee → contact)
- [ ] Create attendee data transformer with masonic_status JSONB
- [ ] Create ticket data transformer with price lookup
- [ ] Create registration data transformer with totals

### 3. Update Individual Registration API
- [ ] Add transaction wrapper for atomic operations
- [ ] Create customer record from billing details
- [ ] Create contact record for primary attendee
- [ ] Create registration record with all fields
- [ ] Create attendee record with proper links
- [ ] Create ticket records with proper pricing
- [ ] Update registration with calculated totals
- [ ] Return complete registration data

### 4. Fix Field Mapping Issues
- [ ] Map emailAddress → email
- [ ] Map mobileNumber → phone/mobile_number
- [ ] Map addressLine1 → address_line_1
- [ ] Map stateTerritory object → state string
- [ ] Map country object → country string
- [ ] Store masonic data in masonic_status JSONB

### 5. Implement Price Calculation
- [ ] Fetch ticket prices from event_tickets table
- [ ] Calculate subtotal from all tickets
- [ ] Calculate Stripe fee (2.75% + $0.30)
- [ ] Store all monetary values properly
- [ ] Handle package pricing

## Phase 2: Data Validation & Error Handling

### 6. Add Comprehensive Validation
- [ ] Validate all required fields before insertion
- [ ] Validate email formats
- [ ] Validate phone number formats
- [ ] Validate monetary values
- [ ] Validate foreign key references exist

### 7. Add Error Handling
- [ ] Add try-catch blocks with transaction rollback
- [ ] Add meaningful error messages
- [ ] Add logging for debugging
- [ ] Handle duplicate key errors
- [ ] Handle missing reference errors

## Phase 3: Testing & Verification

### 8. Integration Testing
- [ ] Test complete registration flow
- [ ] Test with different attendee types
- [ ] Test with packages vs individual tickets
- [ ] Test price calculations
- [ ] Test data retrieval from all tables

### 9. Fix Confirmation Page Data Loading
- [ ] Update confirmation views to join all tables
- [ ] Ensure all data is available for display
- [ ] Test confirmation email generation
- [ ] Verify PDF generation works

## Phase 4: Other Registration Types

### 10. Fix Lodge Registration API
- [ ] Apply same normalization pattern
- [ ] Handle organisation data
- [ ] Handle multiple attendees
- [ ] Test thoroughly

### 11. Fix Delegation Registration API
- [ ] Apply same normalization pattern
- [ ] Handle delegation-specific fields
- [ ] Test thoroughly

## Phase 5: Data Migration

### 12. Create Migration Script
- [ ] Analyze existing registration_data JSON
- [ ] Create script to normalize existing data
- [ ] Test on sample data
- [ ] Run migration with rollback capability
- [ ] Verify all data migrated correctly

## Immediate Priority Questions

1. **Stripe Fee Calculation**: Should the Stripe fee always be added to the total, or only when `includes_processing_fee` is true?

2. **Ticket Pricing**: Should we look up prices from `event_tickets` table or trust the price in the registration data?

3. **Customer vs Contact**: Should we create both a customer AND contact record for the booking person, or consolidate into one?

4. **Attendee IDs**: The frontend generates attendee IDs. Should we use those or generate new ones in the database?

5. **Organisation Data**: For individual registrations, should we still capture lodge/organisation data somewhere?

6. **Payment Intent**: Should we create the Stripe payment intent during registration creation or wait until payment step?

7. **Reservation System**: Should tickets be marked as 'reserved' first, then 'sold' after payment?