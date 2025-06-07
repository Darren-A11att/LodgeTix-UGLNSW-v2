# Registration System Comprehensive Fixes Summary

## Overview

This document summarizes all the fixes applied to align the registration system's frontend, API routes, RPC functions, and database schema. The fixes ensure all three registration types (individuals, lodge, delegation) work correctly.

## Migrations Applied

### 1. Individual Registration Fixes

#### Migration: `20250608000014_fix_registration_column_mismatches.sql`
**Purpose**: Fix column mismatches in `upsert_individual_registration` function

**Key Fixes**:
- Changed `primary_email` → `email` (attendees table)
- Changed `primary_phone` → `phone` (attendees table)
- Removed `attendee_data` column reference (doesn't exist)
- Changed `suffix_1/2/3` → `suffix` (attendees table)
- Removed `event_id` and `booking_contact_id` from registrations INSERT (columns don't exist)
- Changed `total_amount_paid` → `total_amount_paid` (registrations table)
- Changed `event_ticket_id` → `event_id` (tickets table)
- Changed `ticket_status` → `status` (tickets table)
- Changed `ticket_price` → `price_paid` (tickets table)
- Stored event_id and booking_contact_id in registration_data JSONB instead
- Added masonic_status JSONB updates for Mason-specific data

### 2. Lodge Registration Fixes

#### Migration: `20250608000015_fix_lodge_registration_columns.sql`
**Purpose**: Fix column mismatches in `upsert_lodge_registration` function

**Key Fixes**:
- Removed `metadata` column from INSERT (doesn't exist in registrations)
- Removed `payment_completed_at` column updates (doesn't exist)
- Stored metadata in registration_data JSONB instead
- Set confirmation_number to NULL for Edge Function handling

### 3. Delegation Registration Creation

#### Migration: `20250608000016_create_delegation_registration_rpc.sql`
**Purpose**: Create missing RPC function for delegation registrations

**Key Features**:
- New `upsert_delegation_registration` function following same pattern as individuals
- Handles delegates array (primary delegate is Head of Delegation)
- Stores delegation details in registration_data and masonic_status
- Maps fields correctly to database columns
- Creates contacts for delegates who want direct communication

#### New API Route: `/api/registrations/delegation/route.ts`
**Purpose**: Dedicated endpoint for delegation registrations using the new RPC

## Field Mapping Reference

### Frontend → Database Mappings

#### Common Fields (All Registration Types)
```typescript
// Billing Details → Customers Table
billingDetails.emailAddress → customers.email
billingDetails.mobileNumber → customers.phone
billingDetails.firstName → customers.first_name
billingDetails.lastName → customers.last_name

// Billing Details → Contacts Table
billingDetails.emailAddress → contacts.email
billingDetails.mobileNumber → contacts.mobile_number
```

#### Individual Registration Specific
```typescript
// Attendee → Attendees Table
primaryAttendee.primaryEmail → attendees.email
primaryAttendee.primaryPhone → attendees.phone
primaryAttendee.contactPreference → attendees.contact_preference (lowercase)
primaryAttendee.suffix → attendees.suffix

// Tickets
tickets[].ticketDefinitionId → tickets.event_id
tickets[].price → tickets.price_paid
```

#### Lodge Registration Specific
```typescript
// Lodge Details → Registration Data
lodgeDetails.lodgeName → registration_data.lodgeName
lodgeDetails.lodge_id → organisation_id
lodgeDetails.lodgeName → organisation_name
```

#### Delegation Registration Specific
```typescript
// Delegation Details → Registration
delegationDetails.name → organisation_name
delegationDetails.grand_lodge_id → organisation_id
delegates[] → attendees table (with masonic_status for role)
```

## Enum Value Fixes

All enum mismatches have been corrected:

| Enum Type | Old (Invalid) | New (Valid) |
|-----------|---------------|-------------|
| customer_type | 'individual' | 'booking_contact' |
| contact_type | 'customer', 'attendee' | 'individual' |
| attendee_contact_preference | 'Directly' | 'directly' (lowercase) |

## Code Updates Required

### 1. Update Main Registrations Route

In `/app/api/registrations/route.ts`, add after line 226:

```typescript
// For delegation registration, redirect to dedicated endpoint
if (finalRegistrationType === 'delegation') {
  console.log("Delegation registration should use /api/registrations/delegation endpoint");
  console.groupEnd();
  return NextResponse.json(
    { error: "Please use /api/registrations/delegation endpoint for delegation registrations" },
    { status: 400 }
  );
}
```

### 2. Update Registration Wizard

In `registration-wizard.tsx`, update the endpoint selection (around line 776):

```typescript
const endpoint = storeState.registrationType === 'individuals' || storeState.registrationType === 'individual'
  ? '/api/registrations/individuals'
  : storeState.registrationType === 'lodge'
  ? '/api/registrations/lodge'
  : storeState.registrationType === 'delegation'
  ? '/api/registrations/delegation'
  : '/api/registrations';
```

## Testing Checklist

### Individual Registration
- [ ] Can create registration without errors
- [ ] Attendee data saved correctly with email/phone (not primary_email/primary_phone)
- [ ] Tickets created with correct event_id and price_paid
- [ ] Masonic data stored in masonic_status JSONB
- [ ] Confirmation number generated by Edge Function after payment

### Lodge Registration
- [ ] Can create registration without errors
- [ ] Booking contact saved correctly
- [ ] Table count and attendee count calculated
- [ ] Metadata stored in registration_data JSONB
- [ ] Confirmation number generated by Edge Function after payment

### Delegation Registration
- [ ] Can create registration without errors
- [ ] All delegates saved as attendees
- [ ] Head of Delegation marked as primary
- [ ] Delegation details stored correctly
- [ ] Tickets created for each delegate
- [ ] Confirmation number generated by Edge Function after payment

## Debug Functions

Two debug functions are available in the database:

1. `debug_enum_values()` - Shows all enum types and their valid values
2. `debug_table_columns()` - Shows all columns for registration-related tables

Use these in the Supabase SQL Editor to verify the schema:

```sql
-- Check enum values
SELECT * FROM debug_enum_values();

-- Check table columns
SELECT * FROM debug_table_columns();
```

## Next Steps

1. Apply all migrations to both local and remote databases
2. Update the frontend code (main route and registration wizard)
3. Test all three registration types thoroughly
4. Monitor for any additional field mapping issues
5. Consider refactoring to use consistent naming conventions throughout the system