# Product Requirements Document: Unified Registration and Payment Flow

## Executive Summary

This PRD outlines the implementation of a unified registration and payment flow for LodgeTix that addresses critical issues with Stripe Connect fee allocation, eliminates redundant database updates, and provides a consistent experience across all registration types (individual, lodge, and delegation).

## Problem Statement

### Current Issues:
1. **Incorrect Stripe Fee Allocation**: Connected accounts are receiving incorrect amounts due to inconsistent transfer_data calculations across different registration flows
2. **Multiple Redundant Updates**: Registration status is updated 3-4 times during payment flow, causing race conditions
3. **Confirmation Number Timing**: Confirmation numbers appear in payment metadata before payment succeeds
4. **Inconsistent Data Flow**: Different registration types use different payment flows and data structures
5. **Poor Entity Orchestration**: Contact, customer, attendee, and ticket creation is not properly coordinated

## Goals

1. **Ensure Correct Stripe Fee Allocation**: Connected accounts receive exactly the subtotal amount
2. **Single Source of Truth**: Webhook is the authoritative source for payment completion
3. **Eliminate Redundancy**: Each step in the flow has one clear responsibility
4. **Type-Specific Flexibility**: Support unique requirements of each registration type
5. **Consistent Metadata**: Proper function-based metadata (not event-based)

## Success Criteria

1. Connected accounts receive exactly the subtotal amount (no overpayment/underpayment)
2. Registration status is updated only once per payment
3. Confirmation numbers are generated after payment success
4. All registration types use the same payment flow
5. Stripe metadata contains accurate function information

## Technical Requirements

### Registration Types

1. **Individual Registration**
   - Creates contacts, customers, attendees with masonic profiles
   - Reserves tickets for each attendee

2. **Lodge Registration**
   - Creates lodge contact and customer
   - Purchases tickets without attendees
   - No separate lodge_registrations table

3. **Delegation Registration**
   - Branch A: Tickets only (like lodge)
   - Branch B: Full registration with attendees (like individual)
   - Uses "booking contact" terminology

### API Endpoints

1. **Registration Creation**
   - `POST /api/registrations/create`
   - Type-specific branching for entity creation
   - Returns registrationId with status='pending'

2. **Payment Intent Creation**
   - `POST /api/payments/create-intent`
   - Unified payment service for all types
   - Calculates correct transfer_data amounts

3. **Webhook Handler**
   - `POST /api/stripe/webhook`
   - Single source of truth for payment completion
   - Updates status='completed' once

4. **Confirmation Polling**
   - `GET /api/registrations/{id}/confirmation`
   - Polls for edge-function-generated confirmation number

### Stripe Integration

#### Fee Calculation
```
Customer pays: subtotal + stripeFee
Connected account receives: subtotal (exact amount)
Platform keeps: 0% (platform fee removed)
Stripe takes: processing fee from total
```

#### Metadata Structure

**Common Metadata**:
- registrationId
- registrationType
- functionId, functionName, functionSlug (NOT event details)
- organisationId, organisationName
- Financial: subtotal, stripeFee, totalAmount
- Tracking: sessionId, deviceType, appVersion

**Type-Specific Metadata**:
- Individual: primaryAttendee details, attendeeTypes
- Lodge: lodgeId, lodgeName, lodgeNumber, tableCount
- Delegation: bookingContact, delegationName, attendeeTypes

### Database Workflows

1. **Registration Creation**
   - Atomic transaction for all entity creation
   - Proper foreign key relationships
   - Raw registration logging preserved

2. **Payment Status Updates**
   - Only webhook updates to 'completed'
   - Triggers edge function for confirmation number
   - No redundant API callbacks

3. **Confirmation Number Generation**
   - Database webhook triggers edge function
   - Format: IND-XXXXXX, LDG-XXXXXX, DEL-XXXXXX
   - Polling mechanism for async retrieval

### Routing

Type-specific confirmation pages:
- Individual: `/functions/{slug}/register/confirmation/individuals/{confirmationNumber}`
- Lodge: `/functions/{slug}/register/confirmation/lodge/{confirmationNumber}`
- Delegation: `/functions/{slug}/register/confirmation/delegation/{confirmationNumber}`

## Implementation Plan

### Phase 1: Create Unified Payment Service
- Consolidate payment logic from multiple endpoints
- Implement correct fee calculations
- Ensure proper metadata structure

### Phase 2: Refactor Registration APIs
- Remove payment logic from registration endpoints
- Implement type-specific branching
- Ensure atomic entity creation

### Phase 3: Update Webhook Flow
- Make webhook authoritative for status updates
- Remove redundant callbacks
- Implement confirmation polling

### Phase 4: Testing & Migration
- Comprehensive testing of all registration types
- Migration of existing registrations
- Monitoring and validation

## Security Considerations

1. API endpoints require authentication
2. Webhook signature validation
3. Idempotency for payment operations
4. No sensitive data in metadata

## Monitoring & Analytics

1. Track payment success rates by type
2. Monitor confirmation generation times
3. Alert on fee calculation discrepancies
4. Dashboard for registration metrics

## Future Considerations

1. Support for additional registration types
2. Dynamic fee structures
3. Multi-currency support
4. Enhanced reporting capabilities