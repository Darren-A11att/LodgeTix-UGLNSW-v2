# RLS Implementation via Supabase Dashboard

## The Permission Problem

The error `permission denied for schema public` indicates that the migration user doesn't have sufficient privileges to create database objects. This is a security feature in Supabase where migrations run with limited permissions.

## Solution: Use Supabase Dashboard

Since the Supabase Dashboard SQL Editor runs with superuser privileges, we'll implement RLS there.

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to the SQL Editor section

### 2. Run the Helper Functions First
Copy and paste the contents of `20250531_rls_helper_functions.sql` into the SQL editor and run it.

### 3. Run the RLS Policies Script
Copy and paste the contents of `20250531_rls_policies_dashboard_script.sql` into the SQL editor and run it.

This script will:
- Enable RLS on all tables
- Drop any existing policies (clean slate)
- Create all the correct policies
- Grant appropriate permissions
- Report the final status

### 4. Verify Implementation
After running, you should see output like:
```
=== RLS Policy Implementation Complete ===

Table events              : 5 policies
Table registrations       : 4 policies
Table tickets            : 3 policies
... (etc)

All policies have been created successfully!
```

## Alternative: Using Supabase CLI with Admin Connection

If you prefer using the CLI, you can connect as the postgres user:

```bash
# Set the database URL with the service role key
export DATABASE_URL="postgresql://postgres:[YOUR-SERVICE-ROLE-KEY]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations with admin privileges
supabase db push
```

## What Gets Implemented

### Security Model
1. **Anonymous users** can only view public data
2. **Authenticated users** (including anonymous auth sessions) can:
   - Create and manage their own registrations
   - View their own data only
   - Modify data only when payment is pending

### Key Points
- Guest checkout uses anonymous authentication (not anon role)
- `customers.id = auth.uid()` (primary key matches auth user)
- All user data access is controlled by `auth.uid()` matching

## Testing After Implementation

1. **Public Access Test**
   ```sql
   -- Run as anon user
   SET ROLE anon;
   SELECT * FROM events WHERE is_published = true; -- Should work
   INSERT INTO registrations (...); -- Should fail
   ```

2. **Guest Checkout Test**
   - Start a registration without logging in
   - Verify anonymous session can complete registration
   - Confirm can only see own data

3. **Registered User Test**
   - Log in as a user
   - Verify can see own registrations
   - Confirm cannot see other users' data

## Troubleshooting

If policies aren't working as expected:

1. **Check Policy Status**
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd
   FROM pg_policies 
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

2. **Test Specific Access**
   ```sql
   -- Test as specific user
   SET ROLE authenticated;
   SET request.jwt.claims ->> 'sub' = 'test-user-id';
   SELECT * FROM registrations;
   ```

3. **Review Supabase Logs**
   Check the Logs section in Supabase Dashboard for RLS policy violations

## Benefits of Dashboard Implementation

1. **No permission issues** - runs as superuser
2. **Immediate feedback** - see results right away
3. **Easy rollback** - can modify policies directly
4. **Visual interface** - can review policies in the UI

## Next Steps

After successful implementation:
1. Test all user flows thoroughly
2. Monitor for any access issues
3. Document any custom policies needed for your use case
4. Consider setting up monitoring for policy violations