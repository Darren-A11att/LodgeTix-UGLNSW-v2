# Individuals Registration - Product Requirements Document

## Executive Summary
This document outlines the critical database issues identified in the production individuals registration flow and specifies the requirements for fixing these issues. The registration was successfully processed by Stripe, but critical data is missing from the database, preventing proper confirmation page display and order tracking.

## Current State Issues

### 1. Contacts Table Integration
**Issue**: No attendees or booking contacts are being added to the contacts table
**Requirements**:
- All attendees (masons, guests and guests who are partners) must be created as contacts in the `contacts` table
- Booking contact must be created as a contact (unless "bill to primary attendee" is selected)
- Contact creation must include all captured fields mapped correctly

### 2. Contact Field Mapping
**Requirements for Attendee � Contact mapping**:
```typescript
// For each attendee, create contact with:
{
  contact_id: uuid(),
  email: attendee.email,
  first_name: attendee.first_name,
  last_name: attendee.last_name,
  mobile_number: attendee.phone,
  title: attendee.attendee_type === 'mason' ? attendee.masonic_title : attendee.title,
  type: 'individual' as contact_type,
  contact_preference: attendee.contact_preference,
  dietary_requirements: attendee.dietary_requirements,
  special_needs: attendee.special_needs,
  has_partner: attendee.has_partner,
  is_partner: attendee.is_partner,
  // Billing fields populated only for primary attendee if bill_to_primary_attendee
  billing_email: booking_contact.email,
  billing_phone: booking_contact.phone,
  billing_street_address: booking_contact.address_line_1,
  billing_city: booking_contact.suburb_city,
  billing_state: booking_contact.state,
  billing_postal_code: booking_contact.postcode,
  billing_country: booking_contact.country
}
```

### 3. Registration Contact Assignment
**Issue**: `contact_id` not set in registrations table
**Requirements**:
- If `bill_to_primary_attendee` is true: Set `contact_id` to primary attendee's contact_id
- If `bill_to_primary_attendee` is false: Create separate booking contact and set as `contact_id`

### 4. Payment Amount Fields
**Issue**: `total_price_paid` not populated correctly
**Requirements**:
- `total_amount_paid`: Order total INCLUDING stripe fee (already working)
- `total_price_paid`: Order total EXCLUDING stripe fee (currently missing)
- Both fields must be populated on successful payment

### 5. Confirmation Number
**Issue**: Generated confirmation number not saved to database
**Requirements**:
- Update `registrations.confirmation_number` with generated confirmation value
- Format: `FUNC-YYYYMMDD-XXXX` (e.g., FUNC-20250604-1234)

### 6. Ticket Pricing Fields
**Issue**: Multiple pricing fields not populated in tickets table
**Requirements for each ticket**:
```typescript
{
  price_paid: event_ticket.price, // Less any discounts
  original_price: event_ticket.price,
  ticket_price: event_ticket.price,
  payment_status: 'PAID', // After successful payment
  ticket_status: 'sold', // Changed from 'reserved'
  status: 'sold', // Changed from 'reserved'
  contact_id: attendee_contact_id, // From newly created contact
  purchased_at: new Date().toISOString()
}
```

### 7. Attendee Title and Suffix Logic
**Issue**: Title and suffix fields not populated correctly
**Requirements**:
- **Title**: 
  - Mason attendee: Use `masonic_title` field
  - Guest attendee: Use `title` field
- **Suffix**:
  - If rank !== 'GL': Use rank value
  - If rank === 'GL': Use grand_rank value

### 8. Masonic Profiles
**Issue**: No masonic profiles created for mason attendees
**Requirements**:
- For each attendee where `attendee_type === 'mason'`:
  - Create entry in `masonic_profiles` table
  - Link to contact via `contact_id`
  - Populate all masonic fields:
```typescript
{
  masonic_profile_id: uuid(),
  contact_id: newly_created_contact_id,
  masonic_title: attendee.masonic_title,
  rank: attendee.rank,
  grand_rank: attendee.grand_rank,
  grand_officer: attendee.grand_officer,
  grand_office: attendee.grand_office,
  lodge_id: attendee.lodge_id,
  grand_lodge_id: attendee.grand_lodge_id
}
```

### 9. Primary Attendee Tracking
**Issue**: `primary_attendee_id` not set in registrations table
**Requirements**:
- Identify primary attendee (first attendee or marked as primary)
- Set `registrations.primary_attendee_id` to that attendee's ID

## Database Views Requirements

### Create `individuals_registered_view`
Purpose: Comprehensive view for confirmation page and order management

```sql
CREATE VIEW individuals_registered_view AS
SELECT 
  r.registration_id,
  r.confirmation_number,
  r.registration_date,
  r.payment_status,
  r.total_amount_paid,
  r.total_price_paid,
  r.stripe_fee,
  r.subtotal,
  
  -- Booking contact details
  bc.first_name as booking_first_name,
  bc.last_name as booking_last_name,
  bc.email as booking_email,
  bc.mobile_number as booking_phone,
  bc.billing_street_address,
  bc.billing_city,
  bc.billing_state,
  bc.billing_postal_code,
  
  -- Function details
  f.name as function_name,
  f.start_date as function_start_date,
  f.end_date as function_end_date,
  
  -- Attendees array
  COALESCE(
    json_agg(
      json_build_object(
        'attendee_id', a.attendee_id,
        'full_name', CONCAT(ac.first_name, ' ', ac.last_name),
        'email', ac.email,
        'phone', ac.mobile_number,
        'attendee_type', a.attendee_type,
        'is_primary', a.is_primary,
        'tickets', (
          SELECT json_agg(
            json_build_object(
              'ticket_id', t.ticket_id,
              'event_name', e.title,
              'event_date', e.event_start,
              'price_paid', t.price_paid,
              'qr_code_url', t.qr_code_url
            )
          )
          FROM tickets t
          JOIN events e ON t.event_id = e.event_id
          WHERE t.attendee_id = a.attendee_id
        )
      )
    ) FILTER (WHERE a.attendee_id IS NOT NULL),
    '[]'::json
  ) as attendees
  
FROM registrations r
LEFT JOIN contacts bc ON r.contact_id = bc.contact_id
LEFT JOIN functions f ON r.function_id = f.function_id
LEFT JOIN attendees a ON r.registration_id = a.registration_id
LEFT JOIN contacts ac ON a.contact_id = ac.contact_id
WHERE r.registration_type = 'individuals'
GROUP BY r.registration_id, bc.contact_id, f.function_id;
```

## Implementation Strategy

### 1. Single RPC Function Approach
Created `upsert_individual_registration` RPC that handles both registration creation and payment completion:
- Creates all contacts first with proper `auth_user_id` for booking contact
- Creates masonic profiles for mason attendees
- Creates registration with proper contact_id and auth_user_id
- Creates attendees with contact_id references
- When `paymentCompleted: true` is passed, updates ticket statuses and pricing
- Uses upsert pattern to handle both new registrations and updates

### Key auth_user_id Implementation:
- Booking contact gets `auth_user_id` when created (for RLS policies)
- Primary attendee contact gets `auth_user_id` when billing to primary
- Registration record also gets `auth_user_id` for RLS enforcement

### 2. API Endpoint Updates
Updated `/api/registrations/route.ts` to:
- Use new RPC function for individuals registration type
- Ensure all data is properly structured before database insertion
- Handle the upsert pattern for draft recovery

Updated `/api/registrations/[id]/payment/route.ts` to:
- Call the same RPC function with `paymentCompleted: true` for payment completion
- Eliminates need for separate payment completion function

### 3. Database Column Alignment
All fields now match the `shared/types/database.ts` schema:
- Removed non-existent `auth_user_id` field from registrations
- Removed non-existent `contact_id` field from tickets
- Using exact column names from database types

## Testing Requirements

### Unit Tests
- Contact creation for all attendee types
- Masonic profile creation
- Title/suffix logic
- Payment amount calculations

### Integration Tests
- Complete registration flow with multiple attendees
- Bill to primary attendee vs separate billing contact
- Partner ticket handling
- Confirmation page data retrieval

### Validation Points
1. All attendees appear in contacts table
2. Masonic profiles created for masons only
3. Correct contact_id set on registration
4. All ticket pricing fields populated
5. Confirmation number saved and retrievable
6. View returns complete registration data

## Migration Considerations
- Existing registrations may need data backfill
- Create migration script to populate missing fields
- Ensure no breaking changes to existing lodge/delegation flows

## Success Criteria
1. Confirmation page displays all registration details
2. All attendees trackable as contacts
3. Complete audit trail of pricing
4. Proper masonic profile tracking
5. Accurate billing contact assignment
6. auth_user_id properly set for RLS enforcement
7. Comprehensive view available for all registration data

## Comprehensive View
Created `individuals_registration_complete_view` that returns ALL data from the RPC:
- All registration fields including auth_user_id
- Complete booking contact details
- All attendees with their contact records
- Masonic profiles for mason attendees
- All tickets with pricing and status
- Summary counts for reporting

This view can be used to:
- Verify all data was created correctly
- Display complete registration details on confirmation page
- Debug any issues with the registration process
- Generate reports on registration data