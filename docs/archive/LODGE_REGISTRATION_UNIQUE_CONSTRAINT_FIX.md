# Lodge Registration Unique Constraint Fix

## Issue
The lodge registration was failing with error:
```
Error in upsert_lodge_registration: there is no unique or exclusion constraint matching the ON CONFLICT specification 42P10
```

## Root Cause
The RPC function was using `ON CONFLICT (email)` but:
1. There is no unique constraint on the `email` column in the `contacts` table
2. Email uniqueness is not a requirement for lodge registrations
3. Each registration should create a new contact record

## Solution Applied

### 1. Updated RPC Function
Created new migration: `20250103_fix_lodge_registration_insert_only.sql`
- Removed `ON CONFLICT (email)` clause
- Changed to always INSERT new contact records for new registrations
- Only UPDATE existing contacts when `registration_id` is provided (for retry scenarios)

### 2. Updated API Route Fallback
Modified `/api/functions/[functionId]/packages/[packageId]/lodge-registration/route.ts`
- Changed from `upsert()` to `insert()` for contact creation
- Removed ON CONFLICT handling

## Key Changes

### RPC Function Logic:
```sql
-- If registration_id provided (retry case)
-- Check for existing contact and UPDATE if found

-- Otherwise, always INSERT new contact
INSERT INTO contacts (...) VALUES (...)
-- No ON CONFLICT clause
```

### API Route Logic:
```typescript
// Changed from:
.upsert({ ... })

// To:
.insert({ ... })
```

## Benefits
1. Each lodge registration creates its own contact record
2. No conflicts with existing emails
3. Proper handling of retry scenarios via registration_id
4. Maintains audit trail of all registrations

## To Apply
Run the new migration:
```bash
supabase db push
```

This fix ensures lodge registrations work correctly without requiring email uniqueness.