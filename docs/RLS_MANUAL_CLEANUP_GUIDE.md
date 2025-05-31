# RLS Manual Cleanup Guide

## The Permission Problem

When you get the error:
```
ERROR: 42501: must be owner of relation registrations
```

This means that existing RLS policies were created by a different database user (likely the Supabase service role or through the dashboard), and your current migration user doesn't have permission to drop them.

## Solution Options

### Option 1: Use Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Policies
3. For each table, manually remove any existing policies
4. Then run the migration `20250531_enable_rls_policies_v5.sql`

### Option 2: Drop Policies via SQL Editor as Superuser

Run this in the Supabase SQL Editor (which runs as superuser):

```sql
-- Drop all existing policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;
```

Then apply the new policies.

### Option 3: Use the Safe Migration (V5)

The V5 migration uses `CREATE POLICY IF NOT EXISTS` which won't fail if policies already exist. However, this means:
- New policies won't be created if conflicting ones exist
- You may end up with a mix of old and new policies

To use V5:
```bash
supabase migration up 20250531_enable_rls_policies_v5.sql
```

## Checking Existing Policies

To see what policies currently exist:

```sql
-- List all RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Common Conflicting Policies

If you previously applied any RLS policies, you might have these that need removal:
- `registrations_anon_insert` (from earlier versions)
- Any policies with "anon" in the name for data modification
- Policies that don't match the naming convention of V5

## After Cleanup

Once you've removed conflicting policies, you can:
1. Run the V5 migration to create the correct policies
2. Test that guest checkout and user registration work correctly
3. Verify that users can only see their own data

## Troubleshooting

If you're still having issues:
1. Check which user owns the tables:
   ```sql
   SELECT tablename, tableowner 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. Ensure your migration runs with sufficient privileges
3. Consider using Supabase CLI with the service role key for migrations:
   ```bash
   supabase db push --db-url "postgresql://postgres:[SERVICE_ROLE_KEY]@[PROJECT_REF].supabase.co:5432/postgres"
   ```