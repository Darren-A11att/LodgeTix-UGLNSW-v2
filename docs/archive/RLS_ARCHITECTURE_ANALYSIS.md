# LodgeTix RLS Architecture Analysis

## Critical Discovery: Anonymous Authentication

After analyzing the codebase, I discovered that **guest checkout uses Supabase anonymous authentication**, not the `anon` role as initially assumed. This fundamentally changes the RLS design.

## How Guest Checkout Actually Works

1. **Anonymous Session Creation**
   - When a user starts registration, `SessionGuard` calls `supabase.auth.signInAnonymously()`
   - This creates a temporary authenticated session with a unique `auth.uid()`
   - The user is now in the `authenticated` role, not `anon`

2. **Data Association**
   - The anonymous `auth.uid()` is stored as `customer_id` in registrations
   - This allows RLS policies to use `auth.uid()` for access control
   - Anonymous users can only access their own data

3. **Role Clarification**
   - `anon` role: Completely unauthenticated requests (browsing public events)
   - `authenticated` role: Both logged-in users AND anonymous sessions
   - Service role: Backend operations that bypass RLS

## Registration Flow Analysis

### Direct Table Insert Flow (Default)
```
1. User browses events (anon role)
2. User clicks "Register" → anonymous auth session created
3. User fills registration form
4. API creates/updates customer with auth.uid()
5. API inserts registration with customer_id = auth.uid()
6. API inserts attendees linked to registration
7. API inserts tickets linked to registration
8. All operations use authenticated role with RLS
```

### RPC Function Flow (Feature Flag)
```
1. Same steps 1-3 as above
2. API calls create_registration_with_attendees RPC
3. RPC runs with SECURITY DEFINER (elevated privileges)
4. RPC creates all records atomically
5. RPC is granted to authenticated role only
```

## RLS Design Principles

### 1. Public Data Access
- Events, organizations, locations, ticket types are public
- Anyone can browse without authentication

### 2. User Data Isolation
- Each user (including anonymous) can only access data where `auth.uid()` matches
- For registrations: `customer_id = auth.uid()`
- For contacts: `auth_user_id = auth.uid()`

### 3. Cascading Access
- If you own a registration, you can access its:
  - Attendees
  - Tickets
  - Related contact records

### 4. Payment Status Lock
- Registrations and attendees can only be modified when `payment_status = 'pending'`
- After payment completion, data becomes read-only for users

### 5. Organization-Based Access
- Event organizers can view all registrations for their events
- Lodge members can update their lodge information

## Security Benefits

1. **No Shared Access**: Anonymous users can't see each other's data
2. **Session Isolation**: Each browser session gets its own auth.uid()
3. **Automatic Cleanup**: Anonymous sessions expire, cleaning up test data
4. **Standard Auth Flow**: Uses Supabase's built-in auth system

## Migration Strategy

### From V2 to V3
The main changes:
1. Removed separate `anon` policies for data modification
2. Use `auth.uid()` matching instead of role-based restrictions
3. Simplified policies since anonymous users are authenticated
4. Added support for `customers` table (uses `user_id` = `auth.uid()`)

### Testing Approach
```sql
-- Test as completely unauthenticated
SET ROLE anon;
SELECT * FROM events WHERE is_published = true; -- Should work
INSERT INTO registrations (...); -- Should fail

-- Test as anonymous authenticated session
SET ROLE authenticated;
SET request.jwt.claims ->> 'sub' = 'anonymous-session-uuid';
INSERT INTO customers (user_id, ...) VALUES ('anonymous-session-uuid', ...); -- Should work
INSERT INTO registrations (customer_id, ...) VALUES ('anonymous-session-uuid', ...); -- Should work
```

## Best Practices

1. **Use Anonymous Auth for Guest Checkout**: More secure than allowing true anonymous inserts
2. **RLS Based on auth.uid()**: Simple, secure, and consistent
3. **RPC for Complex Operations**: Use SECURITY DEFINER functions for multi-table operations
4. **Keep It Simple**: Don't overcomplicate policies - auth.uid() matching handles most cases

## Conclusion

The V3 RLS policies are optimized for how LodgeTix actually works:
- True anonymous users (`anon` role) can only read public data
- Guest checkout users get anonymous auth sessions (`authenticated` role)
- All user data access is controlled by `auth.uid()` matching
- This provides security without breaking functionality