# Raw ID Column Fix Summary

## Issue
- **Error**: `Failed to create registration: column "raw_id" does not exist`
- **Root Cause**: The `raw_registrations` table uses `raw_id` as primary key, but some RPC function versions were referencing `id`

## Solution Applied

### 1. Database Schema
The `raw_registrations` table correctly has `raw_id` as primary key:
```sql
CREATE TABLE IF NOT EXISTS "public"."raw_registrations" (
    "raw_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "raw_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);
```

### 2. Migrations Applied
- `20250608000026_fix_raw_registrations_id_column.sql` - Initial fix
- `20250608000029_fix_raw_id_references.sql` - Comprehensive fix
- `20250608000030_hotfix_raw_id_in_rpc.sql` - Hotfix for jsonb parameter version

### 3. Fixed RPC Function
The `upsert_individual_registration` function now:
- Correctly inserts into `raw_registrations` using `raw_id` column
- Stores the `raw_id` in a variable for later use
- Updates `raw_registrations` using `raw_id` in WHERE clauses
- Handles errors properly using `raw_id` reference

## Testing Instructions

### Option 1: Test via Browser
1. Navigate to the registration flow
2. Fill out individual registration form
3. Submit and check if error occurs

### Option 2: Test via API
```bash
# Create test registration
curl -X POST http://localhost:3003/api/registrations/individuals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "primaryAttendee": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "mobileNumber": "0400123456",
      "attendeeType": "mason",
      "contactPreference": "directly"
    },
    "additionalAttendees": [],
    "tickets": [],
    "totalAmount": 100,
    "subtotal": 90,
    "stripeFee": 10,
    "billingDetails": {
      "firstName": "Test",
      "lastName": "User",
      "emailAddress": "test@example.com",
      "mobileNumber": "0400123456",
      "billingAddress": {
        "addressLine1": "123 Test St",
        "city": "Sydney",
        "state": "NSW",
        "postcode": "2000",
        "country": "Australia"
      }
    },
    "functionId": "YOUR_FUNCTION_ID",
    "customerId": "YOUR_USER_ID",
    "agreeToTerms": true
  }'
```

## Verification
Check if the registration succeeds without "raw_id" column errors. The fix has been applied to both local and remote databases.

## Next Steps
If the error persists:
1. Check Supabase logs for the exact error
2. Verify migrations were applied: `npx supabase db push --dry-run`
3. Check RPC function signature matches what's deployed
4. Clear any schema caches if necessary