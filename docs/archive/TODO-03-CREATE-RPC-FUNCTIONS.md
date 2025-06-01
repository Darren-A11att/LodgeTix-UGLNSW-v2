# TODO: Create PostgreSQL RPC Functions

## Overview
Create Postgres functions for complex operations that require multiple tables or business logic.

## Functions to Create

### 1. get_event_with_details(event_slug TEXT)
**Purpose**: Fetch complete event data in one call
- [ ] Get main event from event_display_view
- [ ] Include child events if parent
- [ ] Include available packages
- [ ] Include ticket types with availability
- [ ] Return as structured JSON

### 2. get_eligible_tickets(event_id UUID, registration_id UUID)
**Purpose**: Determine which tickets each attendee can purchase
- [ ] Check registration type
- [ ] Check attendee types (mason/guest)
- [ ] Apply eligibility criteria rules
- [ ] Check mason rank requirements
- [ ] Return eligible tickets per attendee

### 3. create_registration_with_attendees(registration_data JSON)
**Purpose**: Atomic registration creation
- [ ] Create registration record
- [ ] Create attendee records
- [ ] Create masonic profiles if needed
- [ ] Handle partner relationships
- [ ] Return complete registration

### 4. reserve_tickets(ticket_selections JSON)
**Purpose**: Atomic ticket reservation
- [ ] Check availability
- [ ] Create ticket records with 'reserved' status
- [ ] Update availability counts (via triggers)
- [ ] Set reservation expiry
- [ ] Return reservation confirmation

### 5. complete_payment(registration_id UUID, payment_intent_id TEXT)
**Purpose**: Finalize payment and tickets
- [ ] Update registration payment status
- [ ] Change tickets from 'reserved' to 'sold'
- [ ] Generate confirmation number
- [ ] Update sold counts
- [ ] Return confirmation data

### 6. get_registration_summary(registration_id UUID)
**Purpose**: Complete registration data for review/confirmation
- [ ] Get registration details
- [ ] Include all attendees with details
- [ ] Include all tickets with event info
- [ ] Calculate totals
- [ ] Return structured summary

### 7. calculate_event_pricing(event_ids UUID[])
**Purpose**: Batch calculate min prices for events
- [ ] Get minimum ticket price per event
- [ ] Check for free tickets
- [ ] Include package pricing
- [ ] Return price mapping

### 8. check_ticket_availability(event_id UUID)
**Purpose**: Real-time availability check
- [ ] Get current counts
- [ ] Check reservation expiries
- [ ] Return availability status
- [ ] Include waitlist info if applicable

## Implementation Guidelines
- [ ] Use SECURITY DEFINER for functions needing elevated permissions
- [ ] Add proper error handling and validation
- [ ] Use transactions where needed
- [ ] Return consistent JSON structures
- [ ] Add function comments and documentation
- [ ] Create TypeScript types for function returns

## Testing Requirements
- [ ] Unit test each function with various inputs
- [ ] Test error conditions
- [ ] Verify transaction rollback
- [ ] Performance test with realistic data
- [ ] Test concurrent access scenarios