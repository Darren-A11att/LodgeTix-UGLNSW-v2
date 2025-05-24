# Analysis: Service Role Key Usage in API Routes

**Status:** 🟡 YELLOW  
**Severity:** Medium  
**Category:** Security / Architecture

## Overview
The codebase uses the service role key (which bypasses RLS) in several API routes as a "temporary solution" while RLS policies are being developed.

## Service Role Key Usage Locations

### 1. **Admin Client Creation**
- `/utils/supabase/admin.ts` - `createAdminClient()` function
- `/lib/supabase-singleton.ts` - `getServerClient()` function
- Both properly documented with security warnings

### 2. **API Routes Using Admin Client**

#### `/app/api/registrations/route.ts` (POST)
- **Purpose**: Create new registrations
- **Why bypasses RLS**: Needs to insert data for anonymous users
- **Security**: Validates `customerId` from request

#### `/app/api/registrations/[id]/payment/route.ts` (PUT)
- **Purpose**: Update registration with payment details
- **Why bypasses RLS**: Updates payment status after Stripe webhook
- **Security**: Validates registration ownership

#### `/app/api/registrations/[id]/verify-payment/route.ts` (POST)
- **Purpose**: Verify payment after completion
- **Why bypasses RLS**: Needs to read/update payment data
- **Security**: Should validate user owns registration

#### `/app/api/check-tables/route.ts` (GET)
- **Purpose**: Check if database tables exist
- **Why bypasses RLS**: System diagnostics
- **Security**: Should be restricted to admin users only

## Security Implications

### Current State
- RLS is disabled in production
- API routes use service role key to bypass (non-existent) RLS
- No immediate security risk since RLS is already disabled

### Future Considerations
When implementing RLS:
1. These API routes will continue to work (bypass RLS)
2. Need to add proper authorization checks in each route
3. Consider if some operations genuinely need to bypass RLS

## Recommendations

### 1. **Short Term (Before enabling RLS)**
Add authorization checks to each endpoint:
```typescript
// Example for payment route
const { data: registration } = await adminClient
  .from('registrations')
  .select('customer_id')
  .eq('registration_id', registrationId)
  .single();

if (registration?.customer_id !== customerId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

### 2. **Long Term (With RLS enabled)**
Consider which operations actually need service role:
- **Registration creation**: Could use user's auth token
- **Payment updates**: May need service role for webhook processing
- **Check tables**: Should be a separate admin-only endpoint

### 3. **Architecture Improvements**
- Create a dedicated webhook handler with service role
- Use user's auth token for user-initiated operations
- Separate admin operations into admin-specific routes

## Current Risk Assessment
- **Low Risk** currently (RLS already disabled)
- **Medium Risk** when RLS is enabled without proper checks
- All routes do validate basic inputs
- Missing user ownership validation in some routes