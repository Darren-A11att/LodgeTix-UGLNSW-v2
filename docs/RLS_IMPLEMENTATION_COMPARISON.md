# RLS Implementation Comparison

## Evolution of Understanding

### Version 1: Initial Implementation ❌
**Assumption**: Anonymous users need direct table access for guest checkout
**Problem**: Massive security vulnerability - anonymous users could modify any data
```sql
-- WRONG: This applied to anonymous users too!
CREATE POLICY "events_auth_delete" ON events
  FOR DELETE TO authenticated
  USING (...) -- "Applies to anonymous users" 
```

### Version 2: Overcorrection ⚠️
**Assumption**: Lock down everything for anonymous users
**Problem**: Might break guest checkout if implemented strictly
```sql
-- Only allowed anonymous to INSERT into contacts/registrations
-- Blocked all other access
CREATE POLICY "registrations_anon_insert_only" ON registrations
  FOR INSERT TO anon
  WITH CHECK (true);
```

### Version 3: Correct Implementation ✅
**Discovery**: Guest checkout uses anonymous authentication (not anon role)
**Solution**: RLS based on auth.uid() matching
```sql
-- Anonymous sessions are authenticated with temporary auth.uid()
CREATE POLICY "registrations_auth_insert_own" ON registrations
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid()::text);
```

## Key Insights

| Aspect | Initial Misunderstanding | Actual Implementation |
|--------|-------------------------|----------------------|
| Guest Checkout | Uses `anon` role | Uses `authenticated` role with anonymous auth |
| User Identification | No way to identify anonymous users | Each gets unique `auth.uid()` |
| Data Isolation | Complex role-based policies needed | Simple `auth.uid()` matching |
| Security Model | Role-based (anon vs authenticated) | Identity-based (auth.uid()) |

## Role Comparison

### `anon` Role (Unauthenticated)
- **When used**: Browsing public website without any interaction
- **Access**: READ only on public data (events, ticket types, etc.)
- **Cannot**: Create registrations, view user data, modify anything

### `authenticated` Role (Including Anonymous Sessions)
- **When used**: After `signInAnonymously()` or regular login
- **Access**: Full CRUD on own data (based on auth.uid())
- **Can**: Complete entire registration flow

## Final Architecture

```
┌─────────────────┐
│  Public Browse  │ ──► anon role ──► SELECT public data only
└────────┬────────┘
         │ Click "Register"
         ▼
┌─────────────────┐
│ Anonymous Auth  │ ──► authenticated role ──► auth.uid() = 'anon-123'
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Records  │ ──► All records tagged with auth.uid()
│ - Customer      │     customer.user_id = 'anon-123'
│ - Registration  │     registration.customer_id = 'anon-123'
│ - Attendees     │     (linked via registration)
│ - Tickets       │     (linked via registration)
└─────────────────┘
```

## Implementation Checklist

### ✅ Use V3 Policies
1. Apply helper functions first (`20250531_rls_helper_functions.sql`)
2. Apply V3 policies (`20250531_enable_rls_policies_v3.sql`)
3. Delete V1 and V2 migration files

### ✅ Key Policy Patterns
```sql
-- For user-owned tables (customers, contacts)
USING (auth_user_id = auth.uid())
-- or
USING (user_id = auth.uid()::text)

-- For related tables (registrations, attendees, tickets)
USING (
  EXISTS (
    SELECT 1 FROM parent_table
    WHERE parent_table.id = this_table.parent_id
    AND parent_table.owner_id = auth.uid()
  )
)
```

### ✅ Testing Strategy
1. Test public browsing (anon role)
2. Test guest checkout (anonymous auth)
3. Test registered user flow
4. Test event organizer functions
5. Verify payment lock works

## Why V3 is Correct

1. **Matches Actual Implementation**: Based on code analysis, not assumptions
2. **Simpler**: Uses auth.uid() instead of complex role checks
3. **More Secure**: Each session isolated by unique ID
4. **Maintains Functionality**: Guest checkout works as designed
5. **Standard Pattern**: Uses Supabase's recommended approach

## Recommendations

1. **Use V3 policies** - they match the actual application architecture
2. **Keep anonymous auth** for guest checkout - it's more secure
3. **Monitor usage** - anonymous sessions expire, which is good for cleanup
4. **Consider RPC functions** for complex multi-table operations
5. **Document this pattern** for future developers