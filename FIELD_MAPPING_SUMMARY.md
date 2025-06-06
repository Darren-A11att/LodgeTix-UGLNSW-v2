# Individual Registration Field Mapping Summary

## Overview
Created a comprehensive field mapping document to track data flow from frontend to database for individual registration flow.

## Key Issues Resolved

### 1. Raw Registrations Table ID Column
- **Issue**: RPC function tried to use `id` column, but table has `raw_id`
- **Fix**: Updated RPC function to use correct column name `raw_id`

### 2. Email/Phone Field Inconsistencies
- **Issue**: Frontend sends different field names than database expects
  - Frontend: `emailAddress`, `mobileNumber`  
  - Database: `email`, `phone`, `primary_email`, `primary_phone`
- **Fix**: Added multiple fallbacks in RPC function to handle all variations

### 3. Contact Preference Enum Case
- **Issue**: Frontend sends lowercase values, database expects capitalized
- **Fix**: Added case conversion in RPC function

### 4. Missing/Extra Columns
- **Issue**: RPC function referenced non-existent columns
- **Fix**: Removed references to missing columns, used existing ones

## Documents Created

1. **`/docs/INDIVIDUAL_REGISTRATION_FIELD_MAPPING.md`**
   - Complete field mapping from frontend → API → RPC → database
   - Lists all data transformations
   - Identifies all mismatches
   - Includes recommended fixes

## Migrations Applied

1. **`20250608000028_fix_field_mapping_issues.sql`**
   - Updated upsert_individual_registration RPC function
   - Fixed all identified field mapping issues
   - Added flexible field name handling
   - Ensures data flows correctly through entire stack

## Result
The individual registration flow now handles field mapping correctly, with the RPC function accommodating variations in field names from the frontend while correctly mapping to database columns.