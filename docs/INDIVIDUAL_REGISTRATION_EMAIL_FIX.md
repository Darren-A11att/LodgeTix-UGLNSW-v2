# Individual Registration Email Field Fix

## Issue Summary
The `upsert_individual_registration` RPC function was looking for incorrect field names when extracting email and phone data from attendees, causing email fields to be empty in the database.

## Root Cause
The function was expecting:
- `primaryEmail` field for email
- `primaryPhone` field for phone

But the frontend was sending:
- `email` field for email
- `mobileNumber` field for phone

## Fix Applied

### Migration Files Created:

1. **20250607_007_fix_individual_registration_email_field.sql**
   - Updates the field mapping to look for `email` first, then `primaryEmail` as fallback
   - Updates the field mapping to look for `mobileNumber` first, then `phone` and `primaryPhone` as fallbacks
   - Maintains backward compatibility

2. **20250607_008_create_raw_registrations_table.sql**
   - Creates a `raw_registrations` table to log all incoming registration data for debugging
   - Updates the function to log raw data before processing
   - Helps identify field mapping issues in the future

3. **20250607_009_fix_individual_registration_contacts_schema.sql**
   - Ensures contacts table has required columns
   - Further refines the field mapping logic
   - Adds better error handling

## Field Mapping Logic

### For Primary Attendee Email:
```sql
v_attendee_email := COALESCE(
    v_attendee->>'email',           -- Frontend field
    v_attendee->>'primaryEmail',    -- Legacy field (fallback)
    p_registration_data->'billingDetails'->>'emailAddress',
    p_registration_data->'billingDetails'->>'email'
);
```

### For Primary Attendee Phone:
```sql
v_attendee_phone := COALESCE(
    v_attendee->>'mobileNumber',    -- Frontend field
    v_attendee->>'phone',
    v_attendee->>'primaryPhone',    -- Legacy field (fallback)
    p_registration_data->'billingDetails'->>'mobileNumber',
    p_registration_data->'billingDetails'->>'phone'
);
```

## Testing
After applying these migrations, test the individual registration flow to ensure:
1. Email addresses are properly saved to the database
2. Phone numbers are properly saved to the database
3. The raw_registrations table captures incoming data for debugging
4. Confirmation emails are sent successfully

## Deployment Steps
1. Apply migrations in order:
   ```bash
   supabase db push
   ```
2. Verify the functions are updated
3. Test the registration flow
4. Check raw_registrations table for any errors