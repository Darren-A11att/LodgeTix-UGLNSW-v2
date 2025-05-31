# RLS Implementation Options

## The Permission Problem

You're encountering multiple permission errors:
1. `permission denied for schema auth` - Can't access auth schema
2. `must be owner of table events` - Can't modify table policies
3. General insufficient privileges

This indicates you're using a restricted database user, even in the Dashboard.

## Your Options

### Option 1: Use Supabase Dashboard UI (Easiest)

Instead of SQL, use the visual interface:

1. **Go to Supabase Dashboard**
2. **Navigate to Authentication → Policies**
3. **For each table, click "New Policy"**
4. **Use the policy templates or create custom ones**

The UI handles permissions correctly and doesn't require SQL access.

### Option 2: Request Full Access

Contact whoever manages your Supabase project and request:
- Full database access temporarily
- Or ask them to run the RLS script for you
- Or get the service_role key

### Option 3: Use Service Role Connection

If you have the service_role key:

```bash
# Windows
set DATABASE_URL=postgresql://postgres:[SERVICE_ROLE_KEY]@[PROJECT_REF].supabase.co:5432/postgres

# Mac/Linux
export DATABASE_URL="postgresql://postgres:[SERVICE_ROLE_KEY]@[PROJECT_REF].supabase.co:5432/postgres"

# Then run
psql $DATABASE_URL -f 20250531_rls_policies_dashboard_script.sql
```

### Option 4: Manual Policy Creation via UI

For each table, create these policies in the Dashboard UI:

#### Events Table
1. **Policy Name**: `Public can view published events`
   - Allowed operation: SELECT
   - Target roles: anon, authenticated
   - USING expression: `is_published = true`

2. **Policy Name**: `Organizers can manage their events`
   - Allowed operation: ALL
   - Target roles: authenticated
   - USING expression: `organiser_id IN (SELECT organisation_id FROM contacts WHERE auth_user_id = auth.uid())`

#### Registrations Table
1. **Policy Name**: `Users can view own registrations`
   - Allowed operation: SELECT
   - Target roles: authenticated
   - USING expression: `customer_id = auth.uid()::text`

2. **Policy Name**: `Users can create own registrations`
   - Allowed operation: INSERT
   - Target roles: authenticated
   - WITH CHECK expression: `customer_id = auth.uid()::text`

3. **Policy Name**: `Users can update pending registrations`
   - Allowed operation: UPDATE
   - Target roles: authenticated
   - USING expression: `customer_id = auth.uid()::text AND payment_status = 'pending'`

(Continue this pattern for other tables...)

## Checking Current Status

Run the minimal setup script to see what's currently configured:

```sql
-- This only reads, doesn't modify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

SELECT tablename, policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public';
```

## Why These Restrictions Exist

Supabase restricts permissions for security:
- Prevents accidental damage
- Ensures proper access control
- Protects system tables

## Recommended Approach

1. **First**: Run `20250531_rls_minimal_setup.sql` to see current status
2. **Then**: Use the Dashboard UI to create policies visually
3. **Or**: Get proper permissions and run the full script

## Testing Without Full Implementation

Even without RLS, you can test the app:
- Use the service role key in your app temporarily
- This bypasses RLS for development
- Remember to switch back for production

```env
# For testing only - bypasses RLS
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Warning**: Never expose the service role key in client-side code!