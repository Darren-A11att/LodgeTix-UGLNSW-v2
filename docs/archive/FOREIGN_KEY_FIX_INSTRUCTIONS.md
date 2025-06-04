# Foreign Key Constraint Fix Instructions

## Issue
The registration process was failing with:
```
Failed to save registration: insert or update on table "registrations" violates foreign key constraint "registrations_customer_id_fkey"
```

## Root Cause
The `registrations` table has a foreign key constraint from `contact_id` to the `contacts` table. We were trying to insert the auth user ID into `contact_id`, but that ID doesn't exist in the `contacts` table.

## Solution
We've implemented a two-part solution:

### 1. Code Changes (Already Applied)
- Set `contact_id` to `null` (it's an optional field)
- Added `auth_user_id` field to link registrations to authenticated users
- Updated the registration API to include `auth_user_id`

### 2. Database Migration Required
Apply the migration: `/supabase/migrations/20250103_add_auth_user_id_to_registrations.sql`

This migration:
- Adds `auth_user_id` column to `registrations` table
- Updates all RLS policies to use `auth_user_id` instead of `contact_id`
- Maintains security by ensuring users can only access their own data

## How to Apply the Migration

### Via Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of the migration file
4. Click "Run"

### Via Supabase CLI
```bash
# If using local Supabase
npx supabase migration up --local
npx supabase db push

# Or directly to remote
npx supabase db push --db-url "your-database-url"
```

## What Changes
- Registrations are now linked to auth users via `auth_user_id`
- Contact records are optional (created by RPC functions when needed)
- RLS policies work correctly for user data isolation
- No foreign key violations when creating registrations

## Testing
After applying the migration:
1. Clear your browser cache
2. Try the registration flow again
3. It should complete without foreign key errors