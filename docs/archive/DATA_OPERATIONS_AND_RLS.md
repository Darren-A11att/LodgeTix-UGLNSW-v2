# Data Operations and RLS Requirements

## Overview
This document details every data operation (CRUD), Postgres function call, and Row Level Security (RLS) policy needed for each component and page in the LodgeTix platform.

## Homepage Components

### Featured Events Section
**Component**: `components/featured-events-section.tsx`

#### Operations
```typescript
// FETCH
supabase
  .from('events')
  .select(`
    event_id,
    slug,
    title,
    subtitle,
    description,
    event_start,
    event_end,
    location,
    image_url,
    parent_event_id,
    min_price,
    total_capacity,
    sold_count,
    reserved_count
  `)
  .eq('featured', true)
  .eq('is_published', true)
  .gt('event_start', new Date().toISOString())
  .order('event_start', { ascending: true })
  .limit(3)
```

#### RLS Policies Required
```sql
-- Public read access for published events
CREATE POLICY "Anyone can view published events" ON events
  FOR SELECT
  USING (is_published = true);
```

### Event Card Component
**Component**: `components/event-card.tsx`
- **Operations**: None (receives data as props)
- **RLS**: N/A (display component only)

## Events List Page

### All Events Display
**Route**: `/events`

#### Operations
```typescript
// FETCH - Parent Events
const { data: parentEvents } = await supabase
  .from('events')
  .select(`
    event_id,
    slug,
    title,
    subtitle,
    description,
    event_start,
    location,
    image_url,
    total_capacity,
    sold_count,
    reserved_count
  `)
  .is('parent_event_id', null)
  .eq('is_published', true)
  .order('event_start', { ascending: true })

// FETCH - Child Events with parent info
const { data: childEvents } = await supabase
  .from('events')
  .select(`
    event_id,
    slug,
    title,
    subtitle,
    description,
    event_start,
    location,
    image_url,
    parent_event_id,
    parent_events:parent_event_id(
      event_id,
      slug,
      title
    )
  `)
  .not('parent_event_id', 'is', null)
  .eq('is_published', true)
  .order('event_start', { ascending: true })

// FETCH - Calculate min price using RPC
const { data: eventPricing } = await supabase
  .rpc('calculate_event_min_prices', {
    event_ids: events.map(e => e.event_id)
  })
```

#### RLS Policies Required
```sql
-- Same as featured events (public read for published)
```

## Event Detail Pages

### Parent Event Page
**Route**: `/events/[slug]`

#### Operations
```typescript
// FETCH - Main event with organization
const { data: event } = await supabase
  .from('events')
  .select(`
    *,
    organisations!inner(
      organisation_id,
      name,
      type,
      stripe_onbehalfof
    ),
    locations(*)
  `)
  .eq('slug', slug)
  .single()

// FETCH - Child events
const { data: childEvents } = await supabase
  .from('events')
  .select(`
    event_id,
    slug,
    title,
    subtitle,
    description,
    event_start,
    location,
    image_url
  `)
  .eq('parent_event_id', event.event_id)
  .eq('is_published', true)
  .order('event_start')

// FETCH - Packages if any
const { data: packages } = await supabase
  .from('packages')
  .select('*')
  .eq('parent_event_id', event.event_id)
  .eq('is_active', true)

// RPC - Get aggregated availability
const { data: availability } = await supabase
  .rpc('get_event_availability', {
    p_event_id: event.event_id
  })
```

#### RLS Policies Required
```sql
-- Public read for events, organizations, locations
-- Package visibility tied to event visibility
CREATE POLICY "View packages for visible events" ON packages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.event_id = packages.event_id 
      AND events.is_published = true
    )
  );
```

### Child Event Page
**Route**: `/events/[parentSlug]/[childSlug]`

#### Operations
```typescript
// FETCH - Child event with parent context
const { data: event } = await supabase
  .from('events')
  .select(`
    *,
    parent_event:parent_event_id(*),
    organisations!inner(*),
    locations(*)
  `)
  .eq('slug', childSlug)
  .single()

// FETCH - Available tickets with real-time counts
const { data: tickets } = await supabase
  .from('event_tickets')
  .select('*')
  .eq('event_id', event.event_id)
  .eq('is_active', true)
  .eq('status', 'Active')
  .order('price')

// SUBSCRIBE - Real-time availability
const channel = supabase
  .channel(`tickets:${event.event_id}`)
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'event_tickets' },
    payload => updateAvailability(payload)
  )
  .subscribe()
```

#### RLS Policies Required
```sql
-- Public read for active tickets
CREATE POLICY "View active tickets" ON event_tickets
  FOR SELECT
  USING (is_active = true AND status = 'Active');
```

## Registration Flow

### Registration Type Selection
**Route**: `/events/[slug]/register`

#### Operations
```typescript
// INSERT - Create anonymous session
const { data: { session } } = await supabase.auth.signInAnonymously()

// INSERT - Initialize registration
const { data: registration } = await supabase
  .from('registrations')
  .insert({
    event_id: eventId,
    customer_id: session.user.id,
    status: 'draft',
    registration_type: null,
    created_at: new Date().toISOString()
  })
  .select()
  .single()

// FETCH - Check for existing draft
const { data: existingDraft } = await supabase
  .from('registrations')
  .select('*')
  .eq('customer_id', session.user.id)
  .eq('event_id', eventId)
  .eq('status', 'draft')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
```

#### RLS Policies Required
```sql
-- Users can create their own registrations
CREATE POLICY "Users can create own registrations" ON registrations
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations" ON registrations
  FOR SELECT
  USING (auth.uid() = customer_id);
```

### Individual Registration Form
**Component**: `components/register/Forms/attendee/IndividualsForm.tsx`

#### Operations
```typescript
// FETCH - Reference data
const { data: grandLodges } = await supabase
  .from('grand_lodges')
  .select('grand_lodge_id, name, abbreviation, country')
  .order('name')

// FETCH - Lodges filtered by grand lodge
const { data: lodges } = await supabase
  .from('lodges')
  .select('lodge_id, name, number, display_name')
  .eq('grand_lodge_id', selectedGrandLodgeId)
  .order('number')

// UPDATE - Save registration type
await supabase
  .from('registrations')
  .update({ 
    registration_type: 'individuals',
    updated_at: new Date().toISOString()
  })
  .eq('registration_id', registrationId)

// INSERT/UPDATE - Save attendees (upsert)
await supabase
  .from('attendees')
  .upsert(
    attendees.map(a => ({
      attendee_id: a.attendee_id || crypto.randomUUID(),
      registration_id: registrationId,
      is_primary: a.is_primary,
      attendee_type: a.attendee_type,
      first_name: a.first_name,
      last_name: a.last_name,
      email: a.email,
      phone: a.phone,
      contact_preference: a.contact_preference,
      dietary_requirements: a.dietary_requirements,
      special_needs: a.special_needs,
      has_partner: a.has_partner,
      created_at: new Date().toISOString()
    })),
    { onConflict: 'attendee_id' }
  )

// INSERT - Save masonic profiles
await supabase
  .from('masonic_profiles')
  .upsert(
    masonAttendees.map(a => ({
      person_id: a.attendee_id,
      grand_lodge_id: a.grand_lodge_id,
      lodge_id: a.lodge_id,
      rank: a.mason_rank,
      grand_officer: a.grand_officer_status,
      grand_office: a.grand_officer_role
    })),
    { onConflict: 'person_id' }
  )

// DELETE - Remove attendees no longer in form
await supabase
  .from('attendees')
  .delete()
  .eq('registration_id', registrationId)
  .not('attendee_id', 'in', currentAttendeeIds)
```

#### RLS Policies Required
```sql
-- Users can manage attendees for their registrations
CREATE POLICY "Users can manage own attendees" ON attendees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM registrations 
      WHERE registrations.registration_id = attendees.registration_id
      AND registrations.customer_id = auth.uid()
    )
  );

-- Public read for reference data
CREATE POLICY "Anyone can view grand lodges" ON grand_lodges
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view lodges" ON lodges
  FOR SELECT
  USING (true);
```

### Lodge Registration Form
**Component**: `components/register/Forms/attendee/LodgesForm.tsx`

#### Operations
```typescript
// UPDATE - Registration type and organization
await supabase
  .from('registrations')
  .update({
    registration_type: 'lodge',
    organisation_id: lodgeId,
    updated_at: new Date().toISOString()
  })
  .eq('registration_id', registrationId)

// UPDATE - Customer record with booking contact
await supabase
  .from('customers')
  .update({
    first_name: bookingContact.first_name,
    last_name: bookingContact.last_name,
    email: bookingContact.email,
    phone: bookingContact.mobile_number,
    business_name: lodgeName,
    customer_type: 'lodge'
  })
  .eq('customer_id', customerId)

// No attendees created for lodge registrations
```

#### RLS Policies Required
```sql
-- Users can update their customer record
CREATE POLICY "Users can update own customer record" ON customers
  FOR UPDATE
  USING (auth.uid() = customer_id);
```

### Delegation Registration Forms
**Component**: `components/register/Forms/attendee/DelegationsForm.tsx`

#### Operations
```typescript
// Similar to Individual but with delegation context
// UPDATE - Registration with delegation info
await supabase
  .from('registrations')
  .update({
    registration_type: 'delegation',
    organisation_id: delegationOrgId,
    registration_data: {
      delegation_name: delegation.name,
      delegation_type: delegationType,
      delegation_order: delegation.order_number
    }
  })
  .eq('registration_id', registrationId)

// INSERT/UPDATE - Attendees with delegation flag
// Similar to individuals but all attendees linked to delegation
```

### Ticket Selection Page
**Route**: `/events/[slug]/register/[registrationId]/tickets`

#### Operations
```typescript
// FETCH - Available tickets with eligibility
const { data: tickets } = await supabase
  .rpc('get_eligible_tickets', {
    p_event_id: eventId,
    p_registration_id: registrationId
  })

// INSERT - Create reserved tickets immediately on selection
await supabase
  .from('tickets')
  .insert({
    ticket_id: crypto.randomUUID(),
    event_id: eventId,
    ticket_type_id: selectedTicketTypeId,
    attendee_id: attendeeId,
    registration_id: registrationId,
    status: 'reserved',
    price_paid: ticketPrice,
    created_at: new Date().toISOString()
  })

// DELETE - Remove deselected tickets
await supabase
  .from('tickets')
  .delete()
  .eq('registration_id', registrationId)
  .eq('status', 'reserved')
  .in('ticket_id', deselectedTicketIds)

// SUBSCRIBE - Real-time availability
const channel = supabase
  .channel(`event-${eventId}-availability`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'event_tickets',
      filter: `event_id=eq.${eventId}`
    },
    (payload) => updateAvailability(payload)
  )
  .subscribe()
```

#### RLS Policies Required
```sql
-- Users can create tickets for their registrations
CREATE POLICY "Users can create own tickets" ON tickets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.registration_id = tickets.registration_id
      AND registrations.customer_id = auth.uid()
    )
  );

-- Users can delete their reserved tickets
CREATE POLICY "Users can delete own reserved tickets" ON tickets
  FOR DELETE
  USING (
    status = 'reserved' AND
    EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.registration_id = tickets.registration_id
      AND registrations.customer_id = auth.uid()
    )
  );
```

### Order Review Page
**Route**: `/events/[slug]/register/[registrationId]/review`

#### Operations
```typescript
// FETCH - Complete registration data
const { data } = await supabase
  .rpc('get_registration_summary', {
    p_registration_id: registrationId
  })

// No write operations on review page
```

#### RLS Policies Required
```sql
-- RPC function handles authorization internally
```

### Payment Page
**Route**: `/events/[slug]/register/[registrationId]/payment`

#### Operations
```typescript
// FETCH - Registration total
const { data: registration } = await supabase
  .from('registrations')
  .select('registration_id, total_amount_paid, event_id')
  .eq('registration_id', registrationId)
  .single()

// RPC - Create payment intent
const { data: paymentIntent } = await supabase
  .rpc('create_payment_intent', {
    p_registration_id: registrationId,
    p_payment_method_id: paymentMethodId
  })

// UPDATE - After successful payment
await supabase
  .from('registrations')
  .update({
    status: 'paid',
    payment_status: 'completed',
    stripe_payment_intent_id: paymentIntentId,
    total_amount_paid: amount,
    updated_at: new Date().toISOString()
  })
  .eq('registration_id', registrationId)

// UPDATE - Update ticket statuses
await supabase
  .from('tickets')
  .update({
    status: 'sold',
    purchased_at: new Date().toISOString()
  })
  .eq('registration_id', registrationId)
  .eq('status', 'reserved')
```

#### RLS Policies Required
```sql
-- Users can update their registration payment status
CREATE POLICY "Users can update own registration payment" ON registrations
  FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Users can update their ticket status
CREATE POLICY "Users can update own ticket status" ON tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.registration_id = tickets.registration_id
      AND registrations.customer_id = auth.uid()
    )
  );
```

### Confirmation Page
**Route**: `/events/[slug]/register/[registrationId]/confirmation`

#### Operations
```typescript
// FETCH - Complete registration details
const { data } = await supabase
  .rpc('get_registration_confirmation', {
    p_registration_id: registrationId
  })

// RPC - Generate tickets (if not already done)
await supabase
  .rpc('generate_ticket_qr_codes', {
    p_registration_id: registrationId
  })

// No write operations - display only
```

## Admin/Organizer Operations

### Event Management

#### Operations
```typescript
// INSERT - Create event
const { data: event } = await supabase
  .from('events')
  .insert({
    title,
    slug: generateSlug(title),
    organisation_id: orgId,
    // ... other fields
  })
  .select()
  .single()

// UPDATE - Modify event
await supabase
  .from('events')
  .update(eventData)
  .eq('event_id', eventId)

// DELETE - Soft delete (unpublish)
await supabase
  .from('events')
  .update({ is_published: false })
  .eq('event_id', eventId)

// INSERT - Create ticket types
await supabase
  .from('event_tickets')
  .insert(ticketTypes)
```

#### RLS Policies Required
```sql
-- Organization members can manage their events
CREATE POLICY "Org members can manage events" ON events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organisation_memberships
      WHERE organisation_memberships.organisation_id = events.organisation_id
      AND organisation_memberships.user_id = auth.uid()
      AND organisation_memberships.role IN ('admin', 'organizer')
    )
  );
```

### Registration Management

#### Operations
```typescript
// FETCH - View all registrations for events
const { data: registrations } = await supabase
  .from('registrations')
  .select(`
    *,
    events!inner(
      event_id,
      title,
      organisation_id
    ),
    customers(
      first_name,
      last_name,
      email,
      phone
    )
  `)
  .eq('events.organisation_id', orgId)
  .order('created_at', { ascending: false })

// UPDATE - Modify registration (refunds, etc)
await supabase
  .from('registrations')
  .update({
    payment_status: 'refunded',
    notes: refundNotes
  })
  .eq('registration_id', registrationId)
```

#### RLS Policies Required
```sql
-- Org members can view registrations for their events
CREATE POLICY "Org members view registrations" ON registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organisation_memberships om ON om.organisation_id = e.organisation_id
      WHERE e.event_id = registrations.event_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'organizer', 'viewer')
    )
  );
```

## Postgres Functions (RPC)

### Core Functions Needed

```sql
-- 1. Get eligible tickets based on registration
CREATE OR REPLACE FUNCTION get_eligible_tickets(
  p_event_id UUID,
  p_registration_id UUID
) RETURNS TABLE (
  ticket_id UUID,
  name TEXT,
  price NUMERIC,
  available_count INTEGER,
  eligible_attendee_ids UUID[]
) AS $$
BEGIN
  -- Complex logic to determine eligibility
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Calculate event minimum prices
CREATE OR REPLACE FUNCTION calculate_event_min_prices(
  event_ids UUID[]
) RETURNS TABLE (
  event_id UUID,
  min_price NUMERIC
) AS $$
BEGIN
  -- Aggregate pricing across tickets
END;
$$ LANGUAGE plpgsql;

-- 3. Get registration summary
CREATE OR REPLACE FUNCTION get_registration_summary(
  p_registration_id UUID
) RETURNS JSON AS $$
BEGIN
  -- Return complete registration data as JSON
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create payment intent
CREATE OR REPLACE FUNCTION create_payment_intent(
  p_registration_id UUID,
  p_payment_method_id TEXT
) RETURNS JSON AS $$
BEGIN
  -- Handle Stripe integration
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Get event availability
CREATE OR REPLACE FUNCTION get_event_availability(
  p_event_id UUID
) RETURNS TABLE (
  total_capacity INTEGER,
  total_sold INTEGER,
  total_reserved INTEGER,
  available INTEGER
) AS $$
BEGIN
  -- Aggregate ticket availability
END;
$$ LANGUAGE plpgsql;
```

## Global RLS Policies

### Authentication Requirements
```sql
-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

-- Anonymous users can register
CREATE POLICY "Anon users can register" ON registrations
  FOR INSERT
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');
```

### Service Role Bypass
```sql
-- Service role bypasses all RLS
-- Used for admin operations and background jobs
```

## Performance Considerations

### Indexes Required
```sql
-- Event queries
CREATE INDEX idx_events_featured_published ON events(featured, is_published, event_start);
CREATE INDEX idx_events_parent_published ON events(parent_event_id, is_published);
CREATE INDEX idx_events_slug ON events(slug);

-- Ticket queries
CREATE INDEX idx_tickets_registration_status ON tickets(registration_id, status);
CREATE INDEX idx_event_tickets_event_active ON event_tickets(event_id, is_active, status);

-- Registration queries
CREATE INDEX idx_registrations_customer_status ON registrations(customer_id, status);
CREATE INDEX idx_registrations_event ON registrations(event_id);

-- Attendee queries
CREATE INDEX idx_attendees_registration ON attendees(registration_id);
```

### Query Optimization
- Use `select()` with specific columns, not `*`
- Batch operations where possible
- Use RPC functions for complex queries
- Implement pagination for lists
- Cache reference data (grand lodges, etc)

This comprehensive guide covers all data operations, RLS policies, and performance considerations for every component in the LodgeTix platform.