# Final RLS Implementation Guide

## Current Status

We've created multiple versions to handle various issues:
- **V1-V3**: Had various issues (security vulnerabilities, incorrect assumptions)
- **V4**: Correct policies but can't drop existing ones due to permissions
- **V5**: Tried to use `IF NOT EXISTS` (syntax not supported)
- **V6**: Checks for existing policies before creating (recommended)

## Use Version 6

The V6 migration (`20250531_enable_rls_policies_v6.sql`) is the most robust:
- ✅ Checks if policies exist before creating
- ✅ Handles permission errors gracefully
- ✅ Reports on policy status
- ✅ Uses correct column names (customers.id not user_id)

## How to Apply

```bash
# 1. First apply helper functions
supabase migration up 20250531_rls_helper_functions.sql

# 2. Then apply V6 policies
supabase migration up 20250531_enable_rls_policies_v6.sql
```

## What V6 Does

1. **Creates a helper function** to check policy existence
2. **Enables RLS** on all tables (safe if already enabled)
3. **Conditionally creates policies** only if they don't exist
4. **Handles permission errors** gracefully
5. **Reports status** showing policy counts per table
6. **Cleans up** the helper function when done

## If You Still Have Issues

### Option 1: Manual Dashboard Cleanup
1. Go to Supabase Dashboard
2. Navigate to Authentication → Policies
3. Remove any conflicting policies
4. Re-run the V6 migration

### Option 2: Direct SQL as Superuser
In Supabase SQL Editor:
```sql
-- List existing policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Drop specific conflicting policies
DROP POLICY IF EXISTS "conflicting_policy_name" ON table_name;
```

### Option 3: Use Service Role
If running via CLI with service role:
```bash
supabase db push --db-url "postgresql://postgres:[SERVICE_ROLE_KEY]@[PROJECT_REF].supabase.co:5432/postgres"
```

## Key Architecture Points

1. **Guest checkout uses anonymous auth** (not anon role)
2. **customers.id = auth.uid()** (no user_id column)
3. **Authenticated role includes anonymous sessions**
4. **RLS based on auth.uid() matching**

## Testing After Implementation

1. Test public event browsing (no auth)
2. Test guest checkout (anonymous auth)
3. Test registered user access
4. Verify users only see their own data
5. Test event organizer functions

## Clean Up Old Versions

Once V6 is successfully applied:
```bash
# Remove old versions
rm 20250531_enable_rls_policies.sql
rm 20250531_enable_rls_policies_v2.sql
rm 20250531_enable_rls_policies_v3.sql
rm 20250531_enable_rls_policies_v4.sql
rm 20250531_enable_rls_policies_v5.sql
```

Keep only:
- `20250531_rls_helper_functions.sql`
- `20250531_enable_rls_policies_v6.sql`
- This README