# Database Mapping Analysis: Requirements to Schema

## Executive Summary

This document analyzes the mapping between our data requirements (based on application code) and the current database schema. It identifies naming discrepancies, missing fields, and recommends API strategies for efficient data access.

## Key Findings

### 1. Major Naming Discrepancies

#### Code → Database Mappings

| Code Usage | Database Column | Table | Action Required |
|------------|-----------------|-------|----------------|
| `customer_id` | `contact_id` | registrations | Update code to use contact_id |
| `organization_id` | `organisation_id` | Multiple tables | Keep database spelling, update code |
| `organizer_id` | `organiser_id` | events | Keep database spelling, update code |
| `location` (simple text) | Location stored in separate table | events → locations | Create computed field or view |
| `min_price` | Not stored, needs calculation | events | Create RPC function |
| `is_sold_out` | Not stored, needs calculation | events | Create view or RPC |
| `tickets_available` | Stored as `available_count` | event_tickets | Update code references |
| `stripe_onbehalfof` | `stripe_onbehalfof` | organisations | Correct (no change) |

### 2. Missing Fields in Database

#### Events Table
- `banner_image_url` - Only has `image_url`
- `long_description` - Only has `description`
- `location` as simple text - Has location_id reference instead
- `total_capacity` - Needs aggregation from tickets
- `min_price` - Needs calculation from tickets

#### Tickets Table  
- `qr_code` - Not stored in database
- `confirmation_email_sent` - Not tracked

#### Registrations Table
- `agree_to_terms` field exists but may not be used consistently
- `customer_id` should be `contact_id`

### 3. Data Structure Differences

#### Partner/Attendee Relationships
- Code expects partner data nested within attendee
- Database uses `related_attendee_id` to link partners
- `is_partner` field is TEXT instead of BOOLEAN

#### Location Data
- Code expects simple location string
- Database has full location table with detailed venue info
- Need view or computed field for simple display

#### Eligibility Criteria
- Properly stored as JSONB in both `event_tickets` and `packages`
- Structure matches requirements

## API Strategy Recommendations

### 1. Views to Create

#### event_display_view
```sql
CREATE VIEW event_display_view AS
SELECT 
  e.*,
  l.place_name || ', ' || l.suburb || ', ' || l.state as location,
  l.place_name,
  l.street_address,
  l.suburb,
  l.state,
  l.postal_code,
  l.latitude,
  l.longitude,
  o.name as organiser_name,
  o.stripe_onbehalfof,
  COALESCE(MIN(et.price), 0) as min_price,
  CASE 
    WHEN SUM(et.available_count) = 0 THEN true 
    ELSE false 
  END as is_sold_out,
  SUM(et.total_capacity) as total_capacity,
  SUM(et.sold_count) as tickets_sold,
  SUM(et.available_count) as tickets_available
FROM events e
LEFT JOIN locations l ON e.location_id = l.location_id
LEFT JOIN organisations o ON e.organiser_id = o.organisation_id
LEFT JOIN event_tickets et ON e.event_id = et.event_id AND et.is_active = true
GROUP BY e.event_id, l.location_id, o.organisation_id;
```

#### registration_detail_view
```sql
CREATE VIEW registration_detail_view AS
SELECT 
  r.*,
  c.first_name,
  c.last_name,
  c.email,
  c.mobile_number as phone,
  c.business_name,
  e.title as event_title,
  e.event_start,
  COUNT(DISTINCT a.attendee_id) as attendee_count,
  COUNT(DISTINCT t.ticket_id) FILTER (WHERE t.status = 'sold') as tickets_purchased,
  SUM(t.price_paid) FILTER (WHERE t.status = 'sold') as total_paid
FROM registrations r
LEFT JOIN contacts c ON r.contact_id = c.contact_id
LEFT JOIN events e ON r.event_id = e.event_id
LEFT JOIN attendees a ON r.registration_id = a.registration_id
LEFT JOIN tickets t ON r.registration_id = t.registration_id
GROUP BY r.registration_id, c.contact_id, e.event_id;
```

### 2. RPC Functions to Create

#### get_event_with_children
```sql
CREATE OR REPLACE FUNCTION get_event_with_children(p_event_slug TEXT)
RETURNS JSON AS $$
DECLARE
  v_event JSON;
  v_children JSON;
  v_packages JSON;
BEGIN
  -- Get main event
  SELECT row_to_json(e.*) INTO v_event
  FROM event_display_view e
  WHERE e.slug = p_event_slug;
  
  -- Get child events if parent
  SELECT json_agg(c.*) INTO v_children
  FROM event_display_view c
  WHERE c.parent_event_id = (v_event->>'event_id')::UUID;
  
  -- Get packages
  SELECT json_agg(p.*) INTO v_packages
  FROM packages p
  WHERE p.parent_event_id = (v_event->>'event_id')::UUID
     OR p.event_id = (v_event->>'event_id')::UUID;
  
  RETURN json_build_object(
    'event', v_event,
    'children', v_children,
    'packages', v_packages
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### get_eligible_tickets_for_registration
```sql
CREATE OR REPLACE FUNCTION get_eligible_tickets_for_registration(
  p_event_id UUID,
  p_registration_id UUID
)
RETURNS TABLE (
  ticket_type_id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  available_count INTEGER,
  eligibility_status TEXT,
  eligible_attendee_ids UUID[]
) AS $$
BEGIN
  -- Complex eligibility logic based on:
  -- 1. Registration type
  -- 2. Attendee types
  -- 3. Mason ranks
  -- 4. Grand lodge affiliations
  -- Returns which attendees can select which tickets
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Direct Table Access Strategy

#### Simple CRUD Operations - Use Direct Access
- **Grand Lodges**: Direct read from `grand_lodges` table
- **Lodges**: Direct read with grand_lodge_id filter
- **Reference Data**: Titles, ranks, relationships - store in app constants

#### Complex Queries - Use Views/RPCs
- **Event Display**: Use `event_display_view` for all event cards/lists
- **Registration Summary**: Use RPC for complete registration data
- **Ticket Eligibility**: Use RPC for complex eligibility rules

### 4. Real-time Subscriptions

```typescript
// Only subscribe to ticket availability changes
supabase
  .channel('event-tickets')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'event_tickets',
    filter: `event_id=eq.${eventId}`
  }, handleAvailabilityChange)
  .subscribe()
```

## Code Changes Required

### 1. Update Field References

```typescript
// Before
const customerId = registration.customer_id;

// After  
const contactId = registration.contact_id;
```

### 2. Update Type Definitions

```typescript
// Update shared/types/register.ts
interface Registration {
  registration_id: string;
  contact_id: string; // was customer_id
  organisation_id: string; // British spelling
  // ...
}
```

### 3. Create Adapter Functions

```typescript
// lib/adapters/event-adapter.ts
export function adaptEventFromDB(dbEvent: Tables<'event_display_view'>): DisplayEvent {
  return {
    id: dbEvent.event_id,
    slug: dbEvent.slug,
    title: dbEvent.title,
    location: dbEvent.location, // Computed from view
    minPrice: dbEvent.min_price, // Computed from view
    isSoldOut: dbEvent.is_sold_out, // Computed from view
    // ...
  };
}
```

## Storage Strategy for Generated Content

### QR Codes
- **Option 1**: Generate on-demand, don't store
- **Option 2**: Store in Supabase Storage with pattern: `/tickets/{registration_id}/{ticket_id}.png`
- **Recommendation**: Generate on-demand for flexibility

### PDFs
- **Store in Supabase Storage**: `/confirmations/{registration_id}/confirmation.pdf`
- Add URL to registration or create separate documents table

### Email Status
- Create `email_log` table to track sent emails
- Or add `confirmation_sent_at` timestamp to registrations

## Next Steps

1. Create database views for common queries
2. Implement RPC functions for complex operations
3. Update code to match database field names
4. Create adapter layer for data transformation
5. Set up Supabase Storage buckets for documents
6. Implement real-time subscriptions for ticket availability

## Performance Optimizations

### Indexes to Verify/Add
```sql
-- Critical for event queries
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_parent_published ON events(parent_event_id, is_published);

-- Critical for ticket queries
CREATE INDEX idx_event_tickets_event_active ON event_tickets(event_id, is_active);
CREATE INDEX idx_tickets_registration_status ON tickets(registration_id, status);

-- Critical for registration queries
CREATE INDEX idx_registrations_contact_event ON registrations(contact_id, event_id);
CREATE INDEX idx_attendees_registration ON attendees(registration_id);
```