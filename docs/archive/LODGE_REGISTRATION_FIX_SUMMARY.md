# Lodge Registration Fix Summary

## Issues Fixed

### 4. Database Structure Mismatches
Fixed incorrect table relationships and column references:

#### Package Structure
- **Issue**: Code expected a `package_includes` junction table that doesn't exist
- **Fix**: Packages are directly linked to events via `event_id`, and have an `included_items` array column
- **Note**: The `included_items` column is of type `package_item[]` (PostgreSQL array)

#### Tickets Table Columns
- **Issue**: RPC tried to insert non-existent columns (`customer_id`, `attendee_number`, `is_primary`, `metadata`, etc.)
- **Fix**: Updated to use actual columns: `ticket_type_id`, `price_paid`, `original_price`, `ticket_status`, `package_id`

## Issues Fixed (continued from above)

### 1. Enum Value Mismatches
Fixed several enum values that didn't match the database constraints:

#### contact_type enum
- **Issue**: Used 'customer' which is not a valid value
- **Fix**: Changed to 'organisation' (valid values: 'individual', 'organisation', 'mason', 'guest')

#### payment_status enum  
- **Issue**: Used 'paid' which is not a valid value
- **Fix**: Changed to 'completed' (valid values: 'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'expired')

#### registration_type enum
- **Issue**: Used 'lodges' (plural) which is not a valid value
- **Fix**: Changed to 'lodge' (singular) (valid values: 'individual', 'lodge', 'delegation')

### 2. Database Schema Mismatches
The RPC function `upsert_lodge_registration` had several column mismatches with the actual database schema:

#### Contacts Table
- **Issue**: RPC expected a `suffix` column that doesn't exist
- **Fix**: Changed to use `suffix_1` column (the actual column name)
- **Note**: The contacts table has `suffix_1`, `suffix_2`, and `suffix_3` columns, not a single `suffix` column

#### Registrations Table  
- **Issue**: API fallback code used `customer_id` which doesn't exist
- **Fix**: Changed to use `contact_id` (the actual foreign key column)
- **Note**: The registrations table links to contacts via `contact_id`, not `customer_id`

#### Missing Columns in RPC
- **Issue**: RPC didn't include financial columns when creating registrations
- **Fix**: Added `total_amount_paid`, `subtotal`, `stripe_fee`, and `includes_processing_fee` columns

### 2. Next.js 15 Dynamic Route Parameters
- **Issue**: Route handlers didn't await the `params` object (required in Next.js 15)
- **Fix**: Updated both POST and PUT endpoints to properly await params:
  ```typescript
  { params }: { params: Promise<{ functionId: string; packageId: string }> }
  const { functionId, packageId } = await params;
  ```

### 3. API Fallback Logic
Fixed the fallback logic in the API route when RPC is not available:
- Creates contact record first with proper column names
- Uses `contact_id` instead of `customer_id` in registrations
- Generates proper confirmation number
- Maps ticket columns correctly

## Files Modified

1. **`/supabase/migrations/20250103_fix_upsert_lodge_registration_rpc.sql`** (NEW)
   - Fixed RPC function to match actual database schema
   - Added missing columns and proper type casting
   - Granted permissions to both authenticated and anon users

2. **`/app/api/functions/[functionId]/packages/[packageId]/lodge-registration/route.ts`**
   - Fixed Next.js 15 params handling
   - Updated fallback logic to use correct column names
   - Added contact creation before registration
   - Fixed ticket creation with proper column mapping

## Next Steps

1. **Apply the updated migration** (with all enum fixes):
   ```bash
   npx supabase migration up --file supabase/migrations/20250103_fix_upsert_lodge_registration_rpc.sql
   ```
   
   Or if the migration was already applied, drop and recreate the function:
   ```sql
   DROP FUNCTION IF EXISTS public.upsert_lodge_registration;
   ```
   Then reapply the migration.

2. **Test the lodge registration flow**:
   - The RPC function should now work without column errors
   - The fallback logic (if RPC fails) should also work correctly

3. **Verify ticket creation**:
   - Check that tickets are created with the correct status values
   - Ensure the registration flow completes successfully

## Notes

- The `customers` table exists but is not used in the fallback logic (only in the RPC)
- The tickets table structure is different from what the original code expected
- Financial amounts are stored in cents in the database (multiplied by 100)
- Confirmation numbers follow the pattern: `LDG-YYMMDD-XXXXXXXX`