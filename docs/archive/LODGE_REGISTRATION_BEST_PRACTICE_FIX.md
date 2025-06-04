# Lodge Registration Best Practice Fix

## The Right Approach

You're absolutely correct - using the service role key is NOT best practice. Here's the proper solution:

### 1. Use RLS Policies (Recommended)
I've created proper RLS policies that allow anonymous users to create registrations:

```sql
-- Allow anonymous users to create registrations
CREATE POLICY "Anonymous users can create own registrations" 
ON registrations 
FOR INSERT 
TO anon
WITH CHECK (
    auth.uid() IS NULL OR auth.uid() = (
        SELECT auth_user_id 
        FROM contacts 
        WHERE contact_id = registrations.contact_id
    )
);
```

### 2. Use RPC Functions with SECURITY DEFINER
The `upsert_lodge_registration` RPC function already uses `SECURITY DEFINER`, which means:
- It runs with the privileges of the function owner (usually postgres)
- It bypasses RLS policies automatically
- This is the PostgreSQL recommended way to handle elevated permissions

### 3. Why Service Role is Bad Practice
Using service role everywhere:
- ❌ Bypasses ALL security checks
- ❌ Creates potential security vulnerabilities
- ❌ Makes it harder to track access patterns
- ❌ Goes against the principle of least privilege

### 4. The Correct Implementation

**Option A: Apply RLS Policies (Best)**
```bash
# Apply the new migration
supabase db push
```

Then revert the API route to use regular client (see route-fixed.ts).

**Option B: Fix Why RPC is Failing**
The RPC function with SECURITY DEFINER should work. If it's failing, we should debug why rather than bypassing security.

**Option C: Use Service Role ONLY for Specific Operations**
If absolutely necessary, use service role only for the specific operation that needs it, not for everything.

### 5. Security Best Practices
1. Always use RLS policies when possible
2. Use RPC functions with SECURITY DEFINER for complex operations
3. Only use service role as a last resort and for specific operations
4. Log all service role usage for audit trails
5. Never expose service role key to client

### Recommendation
Apply the RLS migration and use the fixed route that relies on:
1. RLS policies for direct operations
2. RPC function with SECURITY DEFINER for complex operations
3. No service role usage

This maintains security while allowing the functionality you need.