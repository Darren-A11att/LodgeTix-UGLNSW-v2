# API Route Updates Required for RLS Implementation

## Overview
This document outlines the specific changes needed in API routes to work with the new RLS policies.

## Routes That Need to Switch from Service Role to User Auth

### 1. POST /api/registrations

**Current Implementation:**
```typescript
const adminClient = createAdminClient();
// Uses service role key to bypass RLS
```

**Required Change:**
```typescript
// Use the user's authenticated client
const supabase = await createClient();

// The user's auth token will be automatically included
// RLS policies will enforce that customer_id = auth.uid()
```

**Why This Works:**
- Anonymous users have INSERT permission via RLS policy
- The policy ensures customer_id matches auth.uid()
- No need for manual validation

### 2. GET /api/registrations/[id]

**Current Implementation:**
```typescript
const adminClient = createAdminClient();
// Bypasses RLS to read any registration
```

**Required Change:**
```typescript
const supabase = await createClient();

// RLS will automatically filter to only user's registrations
const { data, error } = await supabase
  .from('registrations')
  .select('*')
  .eq('registration_id', id)
  .single();

// If user doesn't own this registration, it will return null
if (!data) {
  return NextResponse.json(
    { error: 'Registration not found' },
    { status: 404 }
  );
}
```

## Routes That Should Keep Service Role

### 1. PUT /api/registrations/[id]/payment

**Why Keep Service Role:**
- Called by Stripe webhooks with no user context
- Needs to update payment status regardless of user
- Security is handled by webhook signature verification

**No Change Needed**

### 2. POST /api/send-confirmation-email

**Why Keep Service Role:**
- System-generated emails
- Needs to access registration data for any user
- Called after successful payment processing

**No Change Needed**

### 3. GET /api/check-tables

**Why Keep Service Role:**
- System diagnostic endpoint
- Needs to check table structure
- Should be restricted to admin users (add auth check)

**Recommended Addition:**
```typescript
// Add admin check
const user = await getCurrentUser();
if (!user?.isAdmin) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

## New Endpoints Needed

### 1. POST /api/registrations/[id]/attendees

**Purpose:** Add attendees to lodge/group registrations after purchase

```typescript
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const attendees = await request.json();
  
  // RLS will ensure user owns this registration
  const { data, error } = await supabase
    .from('attendees')
    .insert(attendees.map(a => ({
      ...a,
      registrationid: params.id
    })));
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ attendees: data });
}
```

### 2. PUT /api/registrations/[id]/assign-tickets

**Purpose:** Assign tickets to specific attendees

```typescript
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const assignments = await request.json();
  
  // Update ticket assignments
  // RLS ensures user owns the registration
  const updates = assignments.map(async ({ ticketId, attendeeId }) => {
    return supabase
      .from('attendee_ticket_assignments')
      .upsert({
        ticket_id: ticketId,
        attendee_id: attendeeId,
        registration_id: params.id
      });
  });
  
  const results = await Promise.all(updates);
  // Handle results...
}
```

## Frontend Updates Required

### 1. Registration Creation
No changes needed - already uses user's session

### 2. Registration Viewing
```typescript
// Current
const response = await fetch(`/api/registrations/${id}`);

// No change needed, but handle 404 if user doesn't own it
if (response.status === 404) {
  // User doesn't have access to this registration
  router.push('/');
}
```

### 3. Anonymous to Permanent User Conversion

Add after successful payment:
```typescript
// In payment success handler
const { data: { user }, error } = await supabase.auth.updateUser({
  email: billingDetails.email,
  password: generateSecurePassword(), // Or let user set it
  data: {
    full_name: `${billingDetails.firstName} ${billingDetails.lastName}`,
    billing_email: billingDetails.email
  }
});

if (user) {
  // Send password reset email so user can set their password
  await supabase.auth.resetPasswordForEmail(billingDetails.email);
}
```

## Testing Checklist

### Before Enabling RLS
- [ ] Update /api/registrations to use user client
- [ ] Update /api/registrations/[id] to use user client
- [ ] Test registration creation flow
- [ ] Test registration viewing
- [ ] Test payment processing (should still work)

### After Enabling RLS
- [ ] Anonymous user can create registration
- [ ] User can only see their own registrations
- [ ] Payment webhooks still process
- [ ] Lodge registrations can be updated with attendees
- [ ] Tickets can be assigned to attendees

## Rollback Plan

If issues occur after enabling RLS:

1. **Quick Fix:** Temporarily disable RLS
```sql
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendees DISABLE ROW LEVEL SECURITY;
-- etc for other tables
```

2. **Revert API Routes:** Switch back to admin client if needed

3. **Monitor:** Check error logs for RLS policy violations