# Comprehensive Registration System Audit Report

## Executive Summary

This audit reveals significant mismatches between the frontend data structures, API routes, RPC functions, and database schema. These mismatches are causing registration failures and need immediate attention.

## Critical Issues Found

### 1. **Non-Existent Column References**

The `upsert_individual_registration` function references columns that don't exist in the database:

#### In `attendees` table:
- Function uses: `primary_email`, `primary_phone`, `attendee_data`
- Actual columns: `email`, `phone` (no attendee_data column)

#### In `registrations` table:
- Function uses: `event_id`, `booking_contact_id`
- These columns don't exist in the registrations table

#### In `attendees` table suffix fields:
- Function uses: `suffix_1`, `suffix_2`, `suffix_3`
- Actual column: `suffix` (single field)

### 2. **Field Name Mismatches**

| Frontend Sends | API/RPC Expects | Database Has |
|----------------|-----------------|--------------|
| `emailAddress` | `email` | `email` |
| `mobileNumber` | `mobile_number` | `phone` (customers), `mobile_number` (contacts) |
| `primaryEmail` | `primary_email` | `email` |
| `primaryPhone` | `primary_phone` | `phone` |

### 3. **Enum Value Mismatches**

| Enum Type | Invalid Values Being Used | Valid Values |
|-----------|---------------------------|--------------|
| `customer_type` | 'individual' | 'booking_contact', 'sponsor', 'donor' |
| `contact_type` | 'customer', 'attendee' | 'individual', 'organisation' |
| `attendee_contact_preference` | 'Directly' (capital D) | 'directly' (lowercase) |

### 4. **Missing Delegation RPC**

- No `upsert_delegation_registration` function exists
- Delegations are handled through direct database inserts in `/api/registrations/route.ts`
- This is inconsistent with individuals and lodge registrations which use RPC functions

## Data Flow Analysis

### Individual Registration Flow

1. **Frontend** collects:
   ```javascript
   {
     primaryAttendee: {
       primaryEmail: "user@example.com",
       primaryPhone: "+61412345678",
       contactPreference: "Directly"
     },
     billingDetails: {
       emailAddress: "billing@example.com",
       mobileNumber: "+61412345678"
     }
   }
   ```

2. **API Route** (`/api/registrations/individuals`) passes to RPC as-is

3. **RPC Function** tries to insert:
   - `primary_email` → attendees table (column doesn't exist)
   - `primary_phone` → attendees table (column doesn't exist)
   - `mobile_number` → contacts table (correct)
   - `email` → contacts table (correct after mapping)

4. **Database** expects:
   - attendees: `email`, `phone`
   - contacts: `email`, `mobile_number`

### Lodge Registration Flow

1. **Frontend** → **API** → **RPC** → **Database**
   - More straightforward as it uses structured parameters
   - Main issue is with booking contact field mappings

### Delegation Registration Flow

1. **Frontend** → **API** → Direct database inserts
   - No RPC function
   - Handled inconsistently compared to other registration types

## Recommended Fixes

### Priority 1: Fix Column References (Critical)

1. **Fix attendees table column references**:
   - Change `primary_email` → `email`
   - Change `primary_phone` → `phone`
   - Remove `attendee_data` references or add the column
   - Change `suffix_1/2/3` → `suffix`

2. **Fix registrations table references**:
   - Remove `event_id` and `booking_contact_id` from INSERT
   - Or add these columns to the table if needed

### Priority 2: Standardize Field Mappings

1. **Create consistent field mapping layer**:
   ```sql
   -- In RPC function
   v_attendee_email := COALESCE(
     v_attendee->>'primaryEmail',
     v_attendee->>'email'
   );
   -- Then insert as 'email' into attendees table
   ```

2. **Fix enum value mappings**:
   - Always use lowercase for enums
   - Map frontend values to correct database enums

### Priority 3: Create Missing RPC Functions

1. **Create `upsert_delegation_registration` function**:
   - Follow same pattern as individuals/lodge
   - Handle delegation-specific fields
   - Ensure consistency

### Priority 4: Add Validation Layer

1. **Add Zod schemas for validation**:
   - Validate at API route level
   - Transform field names before passing to RPC
   - Ensure enum values are correct

## Impact Assessment

### Current Impact:
- Individual registrations failing due to column mismatches
- Enum validation errors preventing data insertion
- Inconsistent handling of delegation registrations

### Risk If Not Fixed:
- Complete registration failure for production users
- Data integrity issues
- Difficulty in debugging and maintaining

## Next Steps

1. **Immediate**: Create migration to fix column references
2. **Short-term**: Standardize field mappings across all layers
3. **Medium-term**: Add comprehensive validation and transformation layer
4. **Long-term**: Refactor to use consistent naming conventions throughout

## Appendix: Complete Field Mapping

### Individuals Registration

```typescript
// Frontend → Database Mapping
{
  // Billing Details → Customers
  "billingDetails.emailAddress" → "customers.email",
  "billingDetails.mobileNumber" → "customers.phone",
  
  // Billing Details → Contacts  
  "billingDetails.emailAddress" → "contacts.email",
  "billingDetails.mobileNumber" → "contacts.mobile_number",
  
  // Primary Attendee → Attendees
  "primaryAttendee.primaryEmail" → "attendees.email", // NOT primary_email
  "primaryAttendee.primaryPhone" → "attendees.phone", // NOT primary_phone
  "primaryAttendee.contactPreference" → "attendees.contact_preference", // lowercase
  
  // Tickets
  "tickets[].ticketDefinitionId" → "tickets.event_ticket_id",
  "tickets[].price" → "tickets.ticket_price"
}
```

### Lodge Registration

```typescript
// Frontend → Database Mapping
{
  // Booking Contact → Customers
  "bookingContact.email" → "customers.email",
  "bookingContact.mobile" → "customers.phone",
  
  // Lodge Details → Registration Data
  "lodgeDetails.lodgeName" → "registration_data.lodgeName",
  "lodgeDetails.lodge_id" → "registration_data.lodge_id"
}
```

### Delegation Registration

```typescript
// Currently uses direct database inserts
// Should be refactored to use RPC function for consistency
```