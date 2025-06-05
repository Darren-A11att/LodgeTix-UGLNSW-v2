# Field Mapping Audit Report

This document tracks all field-to-column mapping issues found during the comprehensive audit of the registration system.

## Individual Registration Issues

### 1. Attendees Table Column Mismatches
- **Frontend sends**: `primaryEmail` → **Database expects**: `email`
- **Frontend sends**: `primaryPhone` → **Database expects**: `phone`
- **Frontend sends**: `suffix1`, `suffix2`, `suffix3` → **Database has**: only `suffix` (single column)
- **RPC tries to insert**: `primary_email`, `primary_phone` → **Fixed**: Migration created to add these columns
- **RPC tries to insert**: `suffix_1`, `suffix_2`, `suffix_3` → **Fixed**: Migration created to add these columns
- **RPC tries to insert**: `attendee_data` → **Fixed**: Migration created to add this column

### 2. Payment Status Issues
- **API used**: `'paid'` → **Fixed**: Changed to `'completed'`
- **API used**: `'processing'` → **Fixed**: Changed to `'pending'`
- **API used**: `'requires_action'` → **Fixed**: Changed to `'pending'`
- **Zod schema missing**: `'unpaid'` → **Fixed**: Added to PaymentStatusSchema

### 3. Contact Preference Enum
- **Frontend sends**: `"Directly"` (capitalized) → **Database expects**: `"directly"` (lowercase)

## Lodge Registration Issues

### 1. Missing Lodge Number
- **Issue**: Frontend form doesn't collect `lodgeNumber` but RPC expects it
- **Location**: `LodgesForm.tsx` missing field, RPC expects `p_lodge_details->>'lodgeNumber'`

### 2. Billing Details Field Names
- **Frontend sends**: `emailAddress`, `mobileNumber`
- **Backend maps to**: `email`, `mobile`

### 3. Missing Address Collection
- Lodge registration form doesn't collect full address details
- API uses hardcoded defaults (lodge name as addressLine1, 'NSW' as state, etc.)

### 4. Lodge Details Structure Mismatch
- **Frontend sends**: `{ lodgeName, lodgeId, organisation_id }`
- **Backend expects**: `{ lodgeName, lodgeNumber, lodge_id }`

### 5. Phone Field Mapping
- **Form field**: `primaryPhone` → **Store field**: `mobile`

## Common Issues Across All Registration Types

### 1. Inconsistent Field Naming
- Email fields: `email`, `emailAddress`, `primaryEmail`
- Phone fields: `phone`, `mobile`, `mobileNumber`, `primaryPhone`
- Organisation ID: `organisation_id`, `organisationId`

### 2. Missing Columns (Fixed via Migrations)
- `attendees.masonic_status` - Added
- `attendees.attendee_data` - Added
- `registrations.event_id` - Added
- `registrations.booking_contact_id` - Added

### 3. Enum Value Case Sensitivity
- Contact preferences use mixed case in frontend but lowercase in database
- Some enums expect specific casing that doesn't match frontend

## Action Items

1. **Standardize field names** across frontend and backend
2. **Add missing form fields** (lodge number, full address for lodge registration)
3. **Fix enum value casing** to be consistent
4. **Create field mapping utilities** to handle transformations
5. **Update RPC functions** to handle both old and new field names for backward compatibility
6. **Add validation** at API level to catch field mapping issues early

## Migration Status

- ✅ `20250608000020_add_missing_columns.sql` - Adds missing registration columns
- ✅ `20250608000021_fix_attendees_table_columns.sql` - Adds missing attendee columns
- ⏳ Need migration for enum value standardization
- ⏳ Need to update frontend forms to collect missing fields