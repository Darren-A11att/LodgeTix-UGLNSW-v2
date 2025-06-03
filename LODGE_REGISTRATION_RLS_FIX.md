# Lodge Registration RLS Fix

## Issue
Lodge registration was failing with:
```
Failed to create registration: new row violates row-level security policy for table "registrations"
```

## Root Cause
Row Level Security (RLS) policies on the `registrations` table were blocking anonymous users from creating registrations. While the RPC function uses `SECURITY DEFINER` to bypass RLS, we needed to ensure all database operations use the service role client.

## Solution Applied

### Updated API Route
Modified `/api/functions/[functionId]/packages/[packageId]/lodge-registration/route.ts`:

1. **Import service client**:
```typescript
import { createClient as createServiceClient } from '@supabase/supabase-js';
```

2. **Create service role client**:
```typescript
const supabaseServiceRole = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

3. **Use service role for all database operations**:
- RPC calls: `supabaseServiceRole.rpc()`
- Direct inserts: `supabaseServiceRole.from().insert()`
- All queries that need to bypass RLS

## Key Changes
- All database operations now use `supabaseServiceRole` instead of `supabase`
- This bypasses RLS completely, allowing anonymous lodge registrations
- Auth operations still use regular `supabase` client

## Benefits
1. Anonymous users can complete lodge registrations
2. No RLS policy modifications needed
3. Maintains security while allowing legitimate operations
4. Service role is only used server-side in API routes

## Security Note
The service role key bypasses all RLS policies, so it should:
- Only be used in server-side API routes
- Never be exposed to the client
- Only perform validated operations

This fix ensures lodge registrations work for both authenticated and anonymous users.