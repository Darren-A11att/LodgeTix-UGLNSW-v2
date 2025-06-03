# Lodge Registration Field Mapping Fix Summary

## Overview
Completed a comprehensive audit of all fields used in the lodge registration process and fixed mismatches between frontend field names and database column names.

## Issues Found and Fixed

### 1. Database Column Mismatches
The following field mappings were incorrect:

| Frontend Field | Database Column | Status |
|----------------|-----------------|---------|
| `phone` | `billing_phone` | ✅ Fixed |
| `mobile` | `mobile_number` | ✅ Fixed |
| `additionalInfo` | `special_needs` | ✅ Fixed |
| `suffix` | `suffix_1` | ✅ Fixed |

### 2. Missing Field Mappings
Added mappings for address fields that were missing:
- `addressLine1` → `address_line_1`
- `addressLine2` → `address_line_2`
- `suburb` → `suburb_city`
- `stateTerritory.name` → `state`
- `country.name` → `country`

## Files Updated

### 1. API Route (`/app/api/functions/[functionId]/packages/[packageId]/lodge-registration/route.ts`)
- Updated the fallback contact creation to use correct database column names
- Added comprehensive field mapping with comments
- Included address fields in the contact creation

### 2. RPC Function (`/supabase/migrations/20250103_fix_upsert_lodge_registration_rpc.sql`)
- Added comments to clarify field mappings
- Ensured consistent mapping between JSONB extraction and database columns

### 3. Documentation
- Created `/docs/LODGE_REGISTRATION_FIELD_MAPPING.md` with complete field audit
- Created test script `/scripts/test-lodge-field-mappings.ts` for validation

## Complete Field Mapping Reference

```typescript
// Frontend → Database Column Mapping
{
  'title': 'title',
  'firstName': 'first_name',
  'lastName': 'last_name',
  'suffix': 'suffix_1',
  'email': 'email',
  'mobile': 'mobile_number',
  'phone': 'billing_phone',
  'addressLine1': 'address_line_1',
  'addressLine2': 'address_line_2',
  'suburb': 'suburb_city',
  'state': 'state',
  'postcode': 'postcode',
  'country': 'country',
  'dietaryRequirements': 'dietary_requirements',
  'additionalInfo': 'special_needs',
  'organisationId': 'organisation_id',
  'authUserId': 'auth_user_id',
  'businessName': 'business_name',
}
```

## Testing
Run the field mapping test to verify all mappings:
```bash
bun run scripts/test-lodge-field-mappings.ts
```

## Next Steps
1. Apply the updated RPC migration if not already applied
2. Test the complete lodge registration flow end-to-end
3. Monitor for any additional field mapping issues

## Prevention
To prevent future field mapping issues:
1. Always check database schema before adding new fields
2. Use the field mapping documentation as reference
3. Run the field mapping test after any schema changes
4. Keep field names consistent between frontend and backend where possible