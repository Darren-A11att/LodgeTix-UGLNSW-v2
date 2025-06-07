# Individual Registration Enum Fixes Summary

## Issues Fixed

### 1. Sequence Reference Error ✅
**Error**: `relation "registration_confirmation_seq" does not exist`
- **Cause**: Function was trying to use `nextval('registration_confirmation_seq')` 
- **Fix**: Set `v_confirmation_number := NULL` to let Edge Function handle it after payment
- **Migrations**: `20250608000003`, `20250608000011`

### 2. Customer Type Enum Error ✅
**Error**: `invalid input value for enum customer_type: "individual"`
- **Cause**: Function was using 'individual' but valid values are: `'booking_contact'`, `'sponsor'`, `'donor'`
- **Fix**: Changed to use `'booking_contact'`
- **Migration**: `20250608000012`

### 3. Contact Type Enum Error ✅
**Error**: `invalid input value for enum contact_type: "customer"`
- **Cause**: Function was using 'customer' and 'attendee' but valid values are: `'individual'`, `'organisation'`
- **Fix**: Changed all instances to use `'individual'`
- **Migration**: `20250608000013`

### 4. Contact Preference Case Sensitivity ✅
**Potential Issue**: Using 'Directly' (capital D) instead of 'directly' (lowercase)
- **Fix**: Added `LOWER()` to ensure lowercase values
- **Migration**: `20250608000013`

## Valid Enum Values Reference

### customer_type
- `'booking_contact'` ✓ (used for individual registrations)
- `'sponsor'`
- `'donor'`

### contact_type
- `'individual'` ✓ (used for all contacts in individual registrations)
- `'organisation'`

### attendee_type
- `'mason'`
- `'guest'`
- `'ladypartner'`
- `'guestpartner'`

### attendee_contact_preference
- `'directly'` ✓ (default for individual registrations)
- `'primaryattendee'`
- `'mason'`
- `'guest'`
- `'providelater'`

### registration_type
- `'individuals'` ✓ (used for individual registrations)
- `'groups'`
- `'officials'`
- `'lodge'`
- `'delegation'`

### payment_status
- `'pending'` ✓ (initial status)
- `'completed'` ✓ (after payment)
- `'failed'`
- `'refunded'`
- `'partially_refunded'`
- `'cancelled'`
- `'expired'`

## Testing the Fix

After applying all migrations, the individual registration flow should:
1. Create a registration with NULL confirmation_number
2. Create a customer with type 'booking_contact'
3. Create contacts with type 'individual'
4. Use lowercase 'directly' for contact preferences
5. Allow the Edge Function to generate confirmation numbers after payment

## Migrations Applied

1. `20250608000003_remove_confirmation_number_generation.sql`
2. `20250608000007_fix_ticket_joins.sql`
3. `20250608000008_add_confirmation_number_tracking.sql`
4. `20250608000009_fix_individual_registration_contacts_schema.sql`
5. `20250608000010_recreate_confirmation_views.sql`
6. `20250608000011_fix_function_sequence_reference.sql`
7. `20250608000012_fix_customer_type_enum.sql`
8. `20250608000013_fix_all_enum_mismatches.sql`

All migrations are now synced between local and remote databases.