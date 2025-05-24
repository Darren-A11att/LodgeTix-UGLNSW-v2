# RLS Policy Design for LodgeTix Registration System

## Overview
This document outlines a comprehensive RLS (Row Level Security) strategy for the LodgeTix registration system, considering the complex requirements of different registration types, anonymous users, and the need to update attendee information post-purchase.

## Key Requirements

### 1. Registration Types & Attendee Information
- **Individual Registration**: Full attendee details at registration time
- **Lodge Registration**: May purchase multiple tickets WITHOUT attendee details
- **Delegation Registration**: May have partial attendee information
- **Groups**: Similar to Lodge, may not have all attendee details

### 2. User Types
- **Anonymous Users**: Can start and complete registration
- **Billing Contact**: Person who pays (should convert to permanent user)
- **Event Organizers**: Need to see all registrations for their events
- **System Admins**: Need full access for support

### 3. Data Access Patterns
- Anonymous users need to create registrations
- Users need to update attendee details AFTER purchase
- Lodge secretaries need to manage their lodge's registrations
- Billing contacts need to access all registrations they paid for

## Database Schema Understanding

### Core Tables
1. **registrations**: Main registration record
   - Links to customer (billing contact)
   - Has registration_type (individuals, lodge, delegation, groups)
   - Contains payment information

2. **attendees**: Individual attendee records
   - May be empty initially for lodge/group registrations
   - Can be updated post-registration
   - Links back to registration

3. **tickets**: Ticket assignments
   - May exist without attendee assignment initially
   - Can be reassigned to attendees later

4. **customers**: Billing contact information
   - Created from anonymous user on successful payment
   - Should become permanent user account

5. **events**: Event information
   - Needs public read access for published events

## RLS Policy Strategy

### Phase 1: Registration Creation (Anonymous User)

```sql
-- Allow anonymous users to create registrations
CREATE POLICY "anon_create_registration" ON registrations
FOR INSERT TO anon
WITH CHECK (
  auth.uid() = customer_id
);

-- Allow anonymous users to create customer records for themselves
CREATE POLICY "anon_create_customer" ON customers
FOR INSERT TO anon
WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

-- Allow anonymous users to create attendees for their registrations
CREATE POLICY "anon_create_attendees" ON attendees
FOR INSERT TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
);

-- Allow anonymous users to create tickets
CREATE POLICY "anon_create_tickets" ON tickets
FOR INSERT TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = tickets.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);
```

### Phase 2: Post-Registration Access (Converted User)

```sql
-- Users can view and update their own registrations
CREATE POLICY "users_manage_own_registrations" ON registrations
FOR ALL TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Users can manage attendees for their registrations
CREATE POLICY "users_manage_registration_attendees" ON attendees
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = attendees.registrationid 
    AND registrations.customer_id = auth.uid()
  )
);

-- Users can manage tickets for their registrations
CREATE POLICY "users_manage_registration_tickets" ON tickets
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = tickets.registration_id 
    AND registrations.customer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations 
    WHERE registrations.registration_id = tickets.registration_id 
    AND registrations.customer_id = auth.uid()
  )
);
```

### Phase 3: Public Access

```sql
-- Everyone can view published events
CREATE POLICY "public_view_published_events" ON events
FOR SELECT TO anon, authenticated
USING (
  is_published = true 
  AND (
    publish_option = 'public' 
    OR publish_option IS NULL
  )
);

-- Everyone can view ticket definitions for published events
CREATE POLICY "public_view_ticket_definitions" ON ticket_definitions
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = ticket_definitions.event_id
    AND events.is_published = true
  )
);
```

## Operations That Need Service Role Key

### 1. Payment Processing (Webhooks)
- **Route**: `/api/registrations/[id]/payment`
- **Why**: Stripe webhooks don't have user context
- **Operations**: Update payment status, confirm registration

### 2. Admin Operations
- **Route**: `/api/admin/*` (future)
- **Why**: Need to see all registrations across users
- **Operations**: View all registrations, generate reports

### 3. System Diagnostics
- **Route**: `/api/check-tables`
- **Why**: System health checks
- **Operations**: Check table existence

### 4. Email Notifications
- **Route**: `/api/send-confirmation-email`
- **Why**: Need to access registration data to send emails
- **Operations**: Read registration and attendee data

## Operations That Should Use RLS

### 1. Registration Creation
- **Route**: `/api/registrations` (POST)
- **Current**: Uses service role
- **Should**: Use user's auth token with RLS
- **Change Required**: Yes

### 2. Registration Viewing
- **Route**: `/api/registrations/[id]` (GET)
- **Current**: Uses service role
- **Should**: Use user's auth token with RLS
- **Change Required**: Yes

### 3. Attendee Updates
- **Route**: Future `/api/attendees` endpoints
- **Should**: Use user's auth token with RLS
- **Why**: Users updating their own attendee details

## Implementation Plan

### Step 1: Create Migration File
```sql
-- Enable RLS on all tables
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_definitions ENABLE ROW LEVEL SECURITY;

-- Add all policies from above sections
```

### Step 2: Update API Routes

#### `/api/registrations/route.ts` (POST)
```typescript
// Change from:
const adminClient = createAdminClient();

// To:
const supabase = await createClient();
// Let RLS handle permissions
```

#### `/api/registrations/[id]/route.ts` (GET)
```typescript
// Use user's client, not admin client
const supabase = await createClient();
```

### Step 3: Handle Special Cases

#### Lodge Registration Flow
1. Lodge secretary creates registration with X tickets
2. No attendee records created initially
3. Tickets created but not assigned to attendees
4. Later: Secretary or authorized person adds attendee details
5. Tickets get assigned to specific attendees

#### Anonymous to Permanent User Conversion
```typescript
// After successful payment
const { data: { user }, error } = await supabase.auth.updateUser({
  email: billingDetails.email,
  data: {
    full_name: `${billingDetails.firstName} ${billingDetails.lastName}`,
    registration_ids: [registrationId]
  }
});
```

## Security Considerations

### 1. Data Isolation
- Users can only see their own registrations
- No cross-user data access
- Lodge members might need special access (future feature)

### 2. Anonymous User Lifecycle
- Create anonymous session
- Complete registration and payment
- Convert to permanent user
- Maintain access to their registrations

### 3. Future Enhancements
- Role-based access (lodge_secretary, event_organizer)
- Delegation management (authorized representatives)
- Transfer registration ownership

## Testing Strategy

### 1. Anonymous User Flow
- [ ] Can create registration
- [ ] Can add attendees
- [ ] Can complete payment
- [ ] Converts to permanent user
- [ ] Can still access registration after conversion

### 2. Lodge Registration Flow
- [ ] Can create registration without attendees
- [ ] Can purchase multiple tickets
- [ ] Can add attendees later
- [ ] Can assign tickets to attendees

### 3. Security Tests
- [ ] User A cannot see User B's registrations
- [ ] Anonymous users cannot see other registrations
- [ ] Webhooks can update payment status
- [ ] Public can view published events