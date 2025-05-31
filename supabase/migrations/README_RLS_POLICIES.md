# RLS Policy Migration Guide

## Which Migration to Use

### ✅ USE THIS ONE:
- `20250531_enable_rls_policies_v4.sql` - Fixed customers table column reference

### ❌ DO NOT USE:
- `20250531_enable_rls_policies.sql` (V1) - Has security vulnerabilities
- `20250531_enable_rls_policies_v2.sql` (V2) - Based on incorrect assumptions
- `20250531_enable_rls_policies_v3.sql` (V3) - Has incorrect customers.user_id reference

## Migration Order

1. First apply: `20250531_rls_helper_functions.sql`
2. Then apply: `20250531_enable_rls_policies_v4.sql`
3. Optionally apply: `20250602_fix_registration_api_customer_bug.sql` (just for documentation)

## Why V4?

V4 fixes a critical error in V3 where the customers table policies referenced a non-existent `user_id` column.

The correct structure is:
- `customers.id` = `auth.uid()` (primary key matches auth user ID)
- No `user_id` column exists in the customers table
- The API has a bug where it tries to set `user_id` when creating customers

V4 is based on the discovery that LodgeTix uses **anonymous authentication** for guest checkout:
- Guest users get a temporary `auth.uid()` via `signInAnonymously()`
- They use the `authenticated` role, not `anon`
- RLS policies use `auth.uid()` matching for data isolation

## Clean Up

After successfully applying V3, you should:
1. Delete the V1 and V2 migration files
2. Update any documentation referencing the old approach
3. Test thoroughly with guest checkout flow

## Testing

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Test guest checkout
-- 1. Browse events without auth (anon role)
-- 2. Start registration (creates anonymous auth)
-- 3. Complete registration flow
-- 4. Verify can only see own data
```