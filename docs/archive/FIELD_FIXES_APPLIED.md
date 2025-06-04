# Field Name Fixes Applied to Individual Registration Process

## Summary of Changes Made

### 1. Registration API Route (`/app/api/registrations/route.ts`)

#### Fixed Fields:
- **Line 30**: Added `functionId` extraction from request data
- **Line 43-50**: Added validation for `functionId` 
- **Line 136**: Changed `event_id` → `function_id` in registration record
- **Line 137**: Changed `customer_id` → `contact_id` in registration record
- **Line 227**: Changed `id` → `customer_id` in customer record creation
- **Line 228**: Removed non-existent `user_id` field
- **Line 264**: Fixed `customer_type` to use valid enum value `'booking_contact'`
- **Line 213-222**: Added null check for `userClient`

### 2. Individual Registration API Route (`/app/api/functions/[functionId]/individual-registration/route.ts`)

#### Fixed Fields:
- **Line 207**: Changed `registrationResult.customer_id` → `registrationResult.contact_id`

## Database Schema Alignment

### Registrations Table
- ✅ Now uses `function_id` (not `event_id`)
- ✅ Now uses `contact_id` (not `customer_id`)

### Customers Table
- ✅ Now uses `customer_id` as primary key (not `id`)
- ✅ Removed non-existent `user_id` field
- ✅ Uses correct `customer_type` enum values

### Attendees Table
- ✅ All fields already correctly aligned

### Tickets Table
- ✅ All fields already correctly aligned
- ✅ Correctly uses `event_id` (tickets are linked to events, not functions)

## Remaining Frontend Components to Check

The following components may need field name updates:
1. `IndividualsForm.tsx`
2. `LodgesForm.tsx`
3. `DelegationsForm.tsx`
4. Payment-related components
5. Confirmation step components

## Testing Required

After all fixes are applied:
1. Test complete individual registration flow
2. Test lodge registration flow
3. Test delegation registration flow
4. Verify payment processing works correctly
5. Confirm registration data is saved with correct field names

## Migration Considerations

For existing data:
- Old registrations may have `event_id` stored in metadata
- Migration script DB-008 backs up old values to metadata fields
- No data loss should occur from these changes