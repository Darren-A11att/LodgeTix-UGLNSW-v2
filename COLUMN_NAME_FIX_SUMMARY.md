# Column Name Fixes Summary

This document tracks all database column name mismatches that have been fixed to align with the actual database schema defined in `shared/types/database.ts`.

## Fixed Issues

### 1. Phone vs billing_phone in contacts table
**File**: `/app/api/functions/[functionId]/packages/[packageId]/lodge-registration/route.ts`  
**Issue**: Using 'phone' instead of 'billing_phone'  
**Fix**: Changed from `phone: booking_contact.phone` to `billing_phone: booking_contact.phone`

### 2. Customer metadata column
**File**: `/supabase/migrations/20250103_fix_upsert_lodge_registration_rpc.sql`  
**Issue**: Inserting into non-existent 'metadata' column in customers table  
**Fix**: Removed metadata field from customers insert

### 3. Customer type enum value
**Files**: 
- `/app/api/functions/[functionId]/packages/[packageId]/lodge-registration/route.ts`
- `/supabase/migrations/20250103_fix_upsert_lodge_registration_rpc.sql`
**Issue**: Using invalid enum value 'individual' for customer_type  
**Valid enum values**: 'booking_contact', 'sponsor', 'donor'  
**Fix**: Changed to use 'booking_contact' for lodge registrations

### 4. Contact type enum value  
**File**: `/supabase/migrations/20250103_fix_upsert_lodge_registration_rpc.sql`
**Issue**: Using invalid enum value 'booking_contact' for contact_type  
**Valid enum values**: 'individual', 'organisation'  
**Fix**: Changed to use 'organisation' for lodge contacts

### 5. Payment status enum casting
**File**: `/supabase/migrations/20250103_fix_upsert_lodge_registration_rpc.sql`  
**Issue**: Not casting text parameter to payment_status enum  
**Fix**: Added explicit cast `p_payment_status::payment_status`

### 6. Event tickets column name
**File**: `/supabase/migrations/20250103_fix_upsert_lodge_registration_rpc.sql`  
**Issue**: Using 'et.id' instead of 'et.event_ticket_id'  
**Fix**: Changed to use correct column name 'event_ticket_id'

### 7. Confirmation page attendee handling
**File**: `/components/register/RegistrationWizard/Steps/confirmation-step.tsx`  
**Issue**: Trying to access attendee properties for lodge registrations (which have no attendees)  
**Fix**: Added checks for registration type and handled lodge registrations separately:
- Display booking contact instead of primary attendee
- Show table count instead of attendee count  
- Display lodge-specific ticket information
- Handle null/undefined attendees in getAttendeeTitle function

## Key Learnings

1. **Always check database types**: The source of truth is `shared/types/database.ts`
2. **Enum values matter**: PostgreSQL enums are strict - must use exact valid values
3. **Column names are case-sensitive**: Use exact names from schema
4. **Cast when needed**: Explicit casting required for enum types in RPC functions
5. **Lodge registrations are different**: They don't have attendees, only booking contacts and table bookings

## Migration Applied

Created and applied: `/supabase/migrations/20250103_fix_all_enums_and_columns.sql`

This migration updates the `upsert_lodge_registration` RPC function with all the correct:
- Column names
- Enum values  
- Type casting
- Composite type field references