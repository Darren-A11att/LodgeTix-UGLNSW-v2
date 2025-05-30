# TODO-004: Database Queries for Organization & Event Data

## Overview
Implement efficient database queries to fetch all necessary organization and event data for Stripe Connect payment processing, including parent/child event relationships and comprehensive metadata.

## Required Data Structure

### Complete Registration Data Query
```typescript
interface RegistrationWithFullContext {
  registration: {
    registration_id: string;
    registration_type: string;
    attendee_count: number;
    subtotal: number;
    total_amount: number;
    // ... other registration fields
  };
  
  event: {
    event_id: string;
    title: string;
    slug: string;
    parent_event_id: string | null;
    event_start: string;
    event_end: string;
    type: string;
    // ... other event fields
  };
  
  organization: {
    organisation_id: string;
    name: string;
    type: string;
    stripe_onbehalfof: string; // Connected account ID
    // ... other org fields
  };
  
  parent_event?: {
    event_id: string;
    title: string;
    slug: string;
    // ... parent event details
  };
  
  child_events?: Array<{
    event_id: string;
    title: string;
    slug: string;
    event_start: string;
    // ... child event details
  }>;
  
  attendees: Array<{
    attendee_id: string;
    first_name: string;
    last_name: string;
    attendee_type: string;
    // ... attendee details
  }>;
  
  tickets: Array<{
    ticket_id: string;
    event_ticket_id: string;
    price_paid: number;
    ticket_name: string;
    event_title: string;
    // ... ticket details
  }>;
}
```

## Implementation

### 1. Main Registration Query Function

```typescript
// In /lib/api/registration-queries.ts

import { createAdminClient } from '@/utils/supabase/admin';

export async function getRegistrationWithFullContext(
  registrationId: string
): Promise<RegistrationWithFullContext | null> {
  const adminClient = createAdminClient();
  
  // Main registration query with event and organization
  const { data: registration, error: regError } = await adminClient
    .from('registrations')
    .select(`
      *,
      events!inner (
        event_id,
        title,
        subtitle,
        slug,
        type,
        parent_event_id,
        event_start,
        event_end,
        location_id,
        max_attendees,
        is_multi_day,
        is_published,
        featured,
        degree_type,
        dress_code,
        regalia,
        regalia_description,
        important_information,
        organisations!inner (
          organisation_id,
          name,
          type,
          abbreviation,
          stripe_onbehalfof,
          website,
          city,
          state,
          country
        )
      )
    `)
    .eq('registration_id', registrationId)
    .single();
    
  if (regError || !registration) {
    console.error('Error fetching registration:', regError);
    return null;
  }
  
  // Fetch attendees
  const { data: attendees } = await adminClient
    .from('attendees')
    .select(`
      *,
      masonic_profiles (
        *,
        lodges (
          lodge_id,
          name,
          number
        ),
        grand_lodges (
          grand_lodge_id,
          name,
          abbreviation
        )
      )
    `)
    .eq('registration_id', registrationId)
    .order('is_primary_contact', { ascending: false });
    
  // Fetch tickets with event details
  const { data: tickets } = await adminClient
    .from('tickets')
    .select(`
      *,
      event_tickets!inner (
        id,
        title,
        description,
        price,
        ticket_type,
        event_id,
        events!inner (
          event_id,
          title,
          slug
        )
      )
    `)
    .eq('registration_id', registrationId);
    
  // Fetch parent event if exists
  let parentEvent = null;
  if (registration.events.parent_event_id) {
    const { data: parent } = await adminClient
      .from('events')
      .select(`
        event_id,
        title,
        subtitle,
        slug,
        event_start,
        event_end,
        type,
        image_url,
        max_attendees
      `)
      .eq('event_id', registration.events.parent_event_id)
      .single();
      
    parentEvent = parent;
  }
  
  // Fetch child events if this is a parent event
  const { data: childEvents } = await adminClient
    .from('events')
    .select(`
      event_id,
      title,
      subtitle,
      slug,
      event_start,
      event_end,
      type,
      is_purchasable_individually
    `)
    .eq('parent_event_id', registration.events.parent_event_id || registration.event_id)
    .order('event_start');
    
  return {
    registration: {
      registration_id: registration.registration_id,
      registration_type: registration.registration_type,
      attendee_count: registration.attendee_count,
      subtotal: registration.subtotal,
      total_amount: registration.total_amount,
      status: registration.status,
      payment_status: registration.payment_status,
      created_at: registration.created_at,
      confirmation_number: registration.confirmation_number
    },
    event: registration.events,
    organization: registration.events.organisations,
    parent_event: parentEvent,
    child_events: childEvents || [],
    attendees: attendees || [],
    tickets: tickets || []
  };
}
```

### 2. Helper Query Functions

```typescript
// Get all ticket types for an event (including child events)
export async function getEventTicketTypes(eventId: string) {
  const adminClient = createAdminClient();
  
  // Get parent event ID if this is a child event
  const { data: event } = await adminClient
    .from('events')
    .select('event_id, parent_event_id')
    .eq('event_id', eventId)
    .single();
    
  const parentEventId = event?.parent_event_id || eventId;
  
  // Get all tickets for parent and child events
  const { data: tickets } = await adminClient
    .from('event_tickets')
    .select(`
      *,
      events!inner (
        event_id,
        title,
        slug,
        event_start
      )
    `)
    .or(`event_id.eq.${parentEventId},event_id.in.(
      SELECT event_id FROM events WHERE parent_event_id = '${parentEventId}'
    )`)
    .order('price');
    
  return tickets || [];
}

// Get organization by event
export async function getOrganizationByEvent(eventId: string) {
  const adminClient = createAdminClient();
  
  const { data } = await adminClient
    .from('events')
    .select(`
      organisations!inner (
        *
      )
    `)
    .eq('event_id', eventId)
    .single();
    
  return data?.organisations || null;
}

// Get registration summary for metadata
export async function getRegistrationSummary(registrationId: string) {
  const adminClient = createAdminClient();
  
  // Get attendee type breakdown
  const { data: attendeeStats } = await adminClient
    .from('attendees')
    .select('attendee_type')
    .eq('registration_id', registrationId);
    
  const attendeeBreakdown = attendeeStats?.reduce((acc, curr) => {
    acc[curr.attendee_type] = (acc[curr.attendee_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Get ticket type breakdown
  const { data: ticketStats } = await adminClient
    .from('tickets')
    .select(`
      event_tickets!inner (
        title,
        ticket_type
      )
    `)
    .eq('registration_id', registrationId);
    
  const ticketBreakdown = ticketStats?.reduce((acc, curr) => {
    const type = curr.event_tickets.ticket_type || 'standard';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    attendee_types: Object.entries(attendeeBreakdown || {})
      .map(([type, count]) => `${type}:${count}`)
      .join(','),
    ticket_types: Object.entries(ticketBreakdown || {})
      .map(([type, count]) => `${type}:${count}`)
      .join(',')
  };
}
```

### 3. Lodge-Specific Queries

```typescript
// Get lodge registration details
export async function getLodgeRegistrationDetails(registrationId: string) {
  const adminClient = createAdminClient();
  
  const { data } = await adminClient
    .from('registrations')
    .select(`
      *,
      lodge_registrations!inner (
        *,
        lodges!inner (
          lodge_id,
          name,
          number,
          meeting_location,
          grand_lodges!inner (
            grand_lodge_id,
            name,
            abbreviation
          )
        )
      )
    `)
    .eq('registration_id', registrationId)
    .single();
    
  return data;
}
```

### 4. Optimized Query for Payment Processing

```typescript
// Single optimized query for payment processing
export async function getPaymentProcessingData(registrationId: string) {
  const adminClient = createAdminClient();
  
  // Use RPC function for complex joins if available
  const { data, error } = await adminClient.rpc('get_payment_processing_data', {
    p_registration_id: registrationId
  });
  
  if (error || !data) {
    // Fallback to regular queries
    return await getRegistrationWithFullContext(registrationId);
  }
  
  return data;
}
```

### 5. Create RPC Function for Optimal Performance

```sql
-- Create RPC function for efficient data fetching
CREATE OR REPLACE FUNCTION get_payment_processing_data(p_registration_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'registration', row_to_json(r.*),
    'event', row_to_json(e.*),
    'organization', row_to_json(o.*),
    'parent_event', CASE 
      WHEN e.parent_event_id IS NOT NULL THEN (
        SELECT row_to_json(pe.*)
        FROM events pe
        WHERE pe.event_id = e.parent_event_id
      )
      ELSE NULL
    END,
    'child_events', COALESCE((
      SELECT json_agg(row_to_json(ce.*))
      FROM events ce
      WHERE ce.parent_event_id = COALESCE(e.parent_event_id, e.event_id)
    ), '[]'::json),
    'attendees', COALESCE((
      SELECT json_agg(
        json_build_object(
          'attendee', row_to_json(a.*),
          'masonic_profile', row_to_json(mp.*),
          'lodge', row_to_json(l.*),
          'grand_lodge', row_to_json(gl.*)
        )
      )
      FROM attendees a
      LEFT JOIN masonic_profiles mp ON a.attendee_id = mp.attendee_id
      LEFT JOIN lodges l ON mp.lodge_id = l.lodge_id
      LEFT JOIN grand_lodges gl ON mp.grand_lodge_id = gl.grand_lodge_id
      WHERE a.registration_id = r.registration_id
    ), '[]'::json),
    'tickets', COALESCE((
      SELECT json_agg(
        json_build_object(
          'ticket', row_to_json(t.*),
          'event_ticket', row_to_json(et.*),
          'ticket_event', row_to_json(te.*)
        )
      )
      FROM tickets t
      INNER JOIN event_tickets et ON t.event_ticket_id = et.id
      INNER JOIN events te ON et.event_id = te.event_id
      WHERE t.registration_id = r.registration_id
    ), '[]'::json),
    'summary', json_build_object(
      'total_attendees', r.attendee_count,
      'total_amount', r.total_amount,
      'attendee_breakdown', (
        SELECT json_object_agg(attendee_type, count)
        FROM (
          SELECT attendee_type, COUNT(*) as count
          FROM attendees
          WHERE registration_id = r.registration_id
          GROUP BY attendee_type
        ) att_stats
      )
    )
  ) INTO result
  FROM registrations r
  INNER JOIN events e ON r.event_id = e.event_id
  INNER JOIN organisations o ON e.organiser = o.organisation_id
  WHERE r.registration_id = p_registration_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Usage in Payment Processing

```typescript
// In payment route
const paymentData = await getPaymentProcessingData(registrationId);

if (!paymentData) {
  throw new Error('Registration not found');
}

// Validate organization has Stripe account
if (!paymentData.organization.stripe_onbehalfof) {
  throw new Error('Organization not configured for payments');
}

// Build comprehensive metadata
const metadata = {
  // Registration details
  registration_id: paymentData.registration.registration_id,
  registration_type: paymentData.registration.registration_type,
  confirmation_number: paymentData.registration.confirmation_number,
  
  // Event hierarchy
  event_id: paymentData.event.event_id,
  event_title: paymentData.event.title,
  parent_event_id: paymentData.parent_event?.event_id || '',
  parent_event_title: paymentData.parent_event?.title || '',
  child_event_count: String(paymentData.child_events.length),
  
  // Organization
  organisation_id: paymentData.organization.organisation_id,
  organisation_name: paymentData.organization.name,
  
  // Summary data
  total_attendees: String(paymentData.summary.total_attendees),
  attendee_types: formatAttendeeBreakdown(paymentData.summary.attendee_breakdown),
  
  // Add more as needed...
};
```

## Implementation Checklist

- [ ] Create registration query functions file
- [ ] Implement getRegistrationWithFullContext
- [ ] Implement helper query functions
- [ ] Create lodge-specific queries
- [ ] Create optimized payment data query
- [ ] Create RPC function for performance
- [ ] Add proper TypeScript types
- [ ] Add error handling and logging
- [ ] Test query performance
- [ ] Add database indexes if needed

## Performance Considerations

1. **Use Indexes**:
   ```sql
   CREATE INDEX idx_attendees_registration_id ON attendees(registration_id);
   CREATE INDEX idx_tickets_registration_id ON tickets(registration_id);
   CREATE INDEX idx_events_parent_event_id ON events(parent_event_id);
   CREATE INDEX idx_events_organiser ON events(organiser);
   ```

2. **Consider Caching**:
   - Cache organization data (changes rarely)
   - Cache event hierarchy (parent/child relationships)

3. **Use RPC for Complex Queries**:
   - Single round trip to database
   - Reduced data transfer
   - Better performance for complex joins