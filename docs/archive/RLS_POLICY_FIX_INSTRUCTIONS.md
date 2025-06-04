# RLS Policy Fix Instructions

## Issue
The Row Level Security (RLS) policies for the customers, registrations, attendees, and tickets tables are using incorrect column names, causing the error:
```
Failed to create customer record: new row violates row-level security policy for table "customers"
```

## Root Cause
The RLS policies were created with outdated column names:
- `customers` table policies use `id` instead of `customer_id`
- `registrations` table policies use `customer_id` instead of `contact_id`
- `registrations` organizer policy uses `event_id` instead of `function_id`

## Solution

### Option 1: Apply via Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `/supabase/migrations/20250103_fix_customers_rls_policies.sql`
4. Click "Run" to execute the migration
5. You should see success messages for each policy created

### Option 2: Apply via Supabase CLI
If you have Docker running and Supabase CLI set up:
```bash
# Start Supabase locally
npx supabase start

# Apply the migration
npx supabase migration up --local

# Push to remote database
npx supabase db push
```

### Option 3: Apply directly to remote database
```bash
# If you have the remote database URL
npx supabase db push --db-url "your-database-url"
```

## Verification
After applying the migration, test the registration flow:
1. Try creating a new individual registration
2. The customer record should be created successfully
3. The registration should complete without RLS errors

## What This Migration Does
1. Drops incorrect RLS policies
2. Creates new policies with correct column names:
   - `customers` policies now use `customer_id`
   - `registrations` policies now use `contact_id`
   - `attendees` and `tickets` policies reference the corrected `registrations` policies
   - Organizer policies now use `function_id` instead of `event_id`

## Important Notes
- These policies allow users to only access their own data
- Organizers can see registrations for their functions
- Users can only modify pending registrations (not paid ones)
- All operations require authentication