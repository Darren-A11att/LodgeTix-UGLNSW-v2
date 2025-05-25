# Ticket Types, Seating, and Group Bookings Specification (v2)
## Based on Actual Database Schema (Verified via Supabase Types)

---

## 1. Current Database State Analysis

Based on the verified Supabase database schema from `/supabase/supabase.ts`, here's what currently exists:

### 1.1 Ticket System Tables

#### **ticket_definitions**
```typescript
{
  id: string                              // UUID
  name: string                           // "Adult", "Child", etc.
  price: number                          // Base price
  description: string | null             // What's included
  eligibility_attendee_types: string[] | null  // ['Mason', 'Guest']
  eligibility_mason_rank: string | null  // Specific rank required
  event_id: string | null               // Links to Events table
  package_id: string | null             // Links to packages table
  is_active: boolean | null             // Available for purchase
  created_at: string
}
```
**Missing**: No ticket category/type field (seated vs general admission)

#### **tickets** (Individual ticket records - verified)
```typescript
{
  ticket_id: string                      // UUID primary key
  attendee_id: string                    // Links to attendees.attendeeid
  event_id: string                       // Links to events.id
  ticket_definition_id: string | null    // Links to ticket_definitions.id
  seat_info: string | null               // ⚠️ Unstructured text field
  status: string                         // Default: 'reserved'
  price_paid: number                     // Amount paid for this ticket
  event_ticket_id: string | null         // Links to eventtickets
  package_id: string | null              // Links to eventpackages
  registration_id: string | null         // Links to registrations
  checked_in_at: string | null           // Check-in timestamp
  // ... other fields
}
```
**Issue**: `seat_info` is just a string - no proper seat management structure

#### **eventtickets** (Inventory tracking - verified)
```typescript
{
  event_ticket_id: string                // UUID primary key
  event_id: string                       // Links to events.id
  ticket_definition_id: string | null    // Links to ticket_definitions.id
  total_capacity: number                 // Total tickets available
  available_count: number                // Currently available
  sold_count: number                     // Default: 0
  reserved_count: number                 // Default: 0
  price: number                          // Current price
  status: string                         // Default: 'active'
  created_at: string
  updated_at: string
}
```

### 1.2 Package System Tables

#### **eventpackages** (verified table name)
```typescript
{
  id: string
  name: string
  description: string | null
  includes_description: string[] | null  // Array of text descriptions
  parent_event_id: string | null         // Links to events.id
  created_at: string
}
```
**Missing**: No price field, no structured components with quantities

#### **package_events**
Links packages to multiple events (many-to-many relationship)

#### **eventpackagetickets** (verified)
```typescript
{
  id: string
  package_id: string                     // Links to eventpackages.id
  event_ticket_id: string                // Links to eventtickets.event_ticket_id
  quantity: number                       // Default: 1
  created_at: string
  updated_at: string
}
```
Links packages to specific ticket types with quantities

#### **package_vas_options**
Links packages to value-added services with optional price overrides

### 1.3 Additional Verified Tables

#### **event_capacity** (Event-level capacity tracking)
```typescript
{
  event_id: string                       // Links to events.id (one-to-one)
  max_capacity: number                   // Total event capacity
  reserved_count: number                 // Default: 0
  sold_count: number                     // Default: 0
  created_at: string
  updated_at: string
}
```

#### **attendee_ticket_assignments** (Links attendees to tickets)
```typescript
{
  id: string
  registration_id: string                // Links to registrations
  attendee_id: string | null             // Links to attendees
  ticket_definition_id: string           // Links to ticket_definitions
  price_at_assignment: number            // Price when assigned
  created_at: string
}
```

#### **value_added_services** (Additional purchasable items)
```typescript
{
  id: string
  name: string                           // "Parking", "Program Book"
  price: number
  description: string | null
  type: string | null                    // Category of service
  is_active: boolean | null
  created_at: string
}
```

### 1.4 What's Completely Missing (Verified)

1. **No Ticket Categories** - ticket_definitions has no category field (seated/GA/table)
2. **No Venue/Seating Tables** - No venue layouts, seat maps, or structured allocation
3. **No Table Booking System** - No support for table reservations at banquets
4. **No Group Booking Tables** - No way to book as a group with seating together
5. **No Package Pricing** - eventpackages table has no price field
6. **No Seating Structure** - tickets.seat_info is just an unstructured string
7. **No Print Queue Tables** - No print_jobs or document generation tracking
8. **No Email Templates Table** - No email_templates for system communications

---

## 2. Recommended Database Enhancements

### 2.1 Add Ticket Categories (Minimal Change)

```sql
-- Add category to existing ticket_definitions table
ALTER TABLE ticket_definitions ADD COLUMN 
  category TEXT DEFAULT 'general_admission' 
  CHECK (category IN ('seated', 'general_admission', 'table', 'standing', 'vip'));

ALTER TABLE ticket_definitions ADD COLUMN 
  requires_seat_selection BOOLEAN DEFAULT FALSE;

ALTER TABLE ticket_definitions ADD COLUMN 
  max_per_booking INTEGER; -- Limit per transaction

-- For table bookings (e.g., table of 8)
ALTER TABLE ticket_definitions ADD COLUMN 
  group_size INTEGER; -- NULL for individual tickets, 8 for table of 8
```

### 2.2 Structured Seat Management (Replace seatinfo string)

```sql
-- Create venue layouts
CREATE TABLE venue_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES Events(id),
  venue_name TEXT NOT NULL,
  layout_type TEXT, -- 'theater', 'banquet', 'ceremony'
  total_seats INTEGER,
  layout_data JSONB, -- Store SVG or coordinate data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual seats
CREATE TABLE venue_seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_layout_id UUID REFERENCES venue_layouts(id),
  section TEXT NOT NULL, -- 'Orchestra', 'Balcony', 'East', 'West'
  row_label TEXT NOT NULL, -- 'A', 'B', 'C' or '1', '2', '3'
  seat_number TEXT NOT NULL, -- '1', '2', '3' etc.
  seat_type TEXT DEFAULT 'standard', -- 'standard', 'wheelchair', 'aisle'
  coordinates JSONB, -- {x: 100, y: 200} for visual display
  is_blocked BOOLEAN DEFAULT FALSE, -- For unavailable seats
  UNIQUE(venue_layout_id, section, row_label, seat_number)
);

-- Link tickets to specific seats
CREATE TABLE ticket_seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES Tickets(ticketid) UNIQUE,
  seat_id UUID REFERENCES venue_seats(id),
  reserved_at TIMESTAMP DEFAULT NOW(),
  is_confirmed BOOLEAN DEFAULT FALSE
);

-- Migrate existing seatinfo data
-- UPDATE ticket_seats SET ... FROM Tickets WHERE seatinfo IS NOT NULL;
```

### 2.3 Table Booking System (For Festive Boards)

```sql
-- Define tables for banquet events
CREATE TABLE event_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES Events(id),
  table_number TEXT NOT NULL, -- '1', '2', 'Head Table'
  table_name TEXT, -- 'Officers Table', 'Past Masters'
  capacity INTEGER NOT NULL, -- Usually 8 or 10
  table_type TEXT DEFAULT 'round', -- 'round', 'rectangular', 'head'
  location_description TEXT, -- 'Near stage', 'By entrance'
  is_available BOOLEAN DEFAULT TRUE,
  min_booking INTEGER DEFAULT 1, -- Can book partial tables
  UNIQUE(event_id, table_number)
);

-- Table reservations
CREATE TABLE table_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES event_tables(id),
  registration_id UUID REFERENCES Registrations(registrationId),
  booking_name TEXT, -- "Leichhardt Lodge Table"
  seats_reserved INTEGER NOT NULL,
  lead_attendee_id UUID REFERENCES Attendees(attendeeid),
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link attendees to specific seats at tables
CREATE TABLE table_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_booking_id UUID REFERENCES table_bookings(id),
  attendee_id UUID REFERENCES Attendees(attendeeid) UNIQUE,
  seat_position INTEGER, -- 1-10 for position at table
  dietary_notes TEXT -- Specific to this seating
);
```

### 2.4 Enhanced Package System

```sql
-- Add pricing to packages
ALTER TABLE packages ADD COLUMN price DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE packages ADD COLUMN savings_amount DECIMAL; -- vs individual purchase
ALTER TABLE packages ADD COLUMN max_quantity INTEGER;
ALTER TABLE packages ADD COLUMN min_quantity INTEGER DEFAULT 1;

-- Package components (what's included)
CREATE TABLE package_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES packages(id),
  component_type TEXT NOT NULL, -- 'ticket', 'accommodation', 'meal'
  -- For tickets
  ticket_definition_id UUID REFERENCES ticket_definitions(id),
  quantity INTEGER DEFAULT 1,
  -- For other items
  description TEXT,
  value DECIMAL, -- For calculating savings
  is_optional BOOLEAN DEFAULT FALSE
);

-- Package pricing tiers (early bird, etc.)
CREATE TABLE package_price_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES packages(id),
  tier_name TEXT NOT NULL, -- 'Early Bird', 'Regular'
  price DECIMAL NOT NULL,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  quantity_limit INTEGER
);
```

---

## 3. Implementation Approach

### 3.1 Phase 1: Minimal Changes (Quick Win)
1. Add `category` field to `ticket_definitions`
2. Add `requires_seat_selection` boolean
3. Update UI to show ticket categories
4. Keep using `seatinfo` as text for now

### 3.2 Phase 2: Structured Seating
1. Create venue and seat tables
2. Build seat selection UI
3. Migrate existing `seatinfo` data
4. Phase out string-based seat info

### 3.3 Phase 3: Table Bookings
1. Implement table management
2. Build table selection UI
3. Support partial table bookings
4. Add seating arrangements

### 3.4 Phase 4: Enhanced Packages
1. Add package pricing
2. Build package components
3. Implement package builder UI
4. Support cross-event packages

---

## 4. Organizer Portal Components Needed

### 4.1 Ticket Type Manager
```typescript
// components/organizer/tickets/TicketTypeManager.tsx
interface TicketTypeManagerProps {
  eventId: string
  onUpdate: () => void
}

export function TicketTypeManager({ eventId, onUpdate }: TicketTypeManagerProps) {
  return (
    <div>
      {/* List ticket types with categories */}
      {/* Add/Edit ticket type with category selection */}
      {/* Configure seat selection requirements */}
      {/* Set group sizes for table bookings */}
    </div>
  )
}
```

### 4.2 Venue Layout Editor
```typescript
// components/organizer/venue/VenueLayoutEditor.tsx
interface VenueLayoutEditorProps {
  eventId: string
  venueLayout?: VenueLayout
}

export function VenueLayoutEditor({ eventId, venueLayout }: VenueLayoutEditorProps) {
  return (
    <div>
      {/* Upload venue diagram */}
      {/* Define sections and rows */}
      {/* Mark seats as available/blocked */}
      {/* Set seat types (standard, wheelchair, etc.) */}
    </div>
  )
}
```

### 4.3 Table Configuration
```typescript
// components/organizer/tables/TableConfiguration.tsx
interface TableConfigurationProps {
  eventId: string
}

export function TableConfiguration({ eventId }: TableConfigurationProps) {
  return (
    <div>
      {/* Define number of tables */}
      {/* Set table capacity (8 or 10) */}
      {/* Name special tables */}
      {/* Configure minimum bookings */}
    </div>
  )
}
```

---

## 5. Migration Strategy

### 5.1 Data Migration Scripts
```sql
-- Example: Migrate existing seatinfo to structured format
INSERT INTO venue_seats (venue_layout_id, section, row_label, seat_number)
SELECT 
  vl.id,
  SPLIT_PART(t.seatinfo, '-', 1) as section,
  SPLIT_PART(t.seatinfo, '-', 2) as row_label,
  SPLIT_PART(t.seatinfo, '-', 3) as seat_number
FROM Tickets t
JOIN Events e ON t.eventid = e.id
JOIN venue_layouts vl ON vl.event_id = e.id
WHERE t.seatinfo IS NOT NULL
AND t.seatinfo ~ '^[A-Z]+-[A-Z0-9]+-[0-9]+$'; -- Pattern: "SECTION-ROW-SEAT"
```

### 5.2 Backwards Compatibility
- Keep `seatinfo` field during transition
- Write to both old and new format
- Gradually phase out string-based seats
- Provide migration tools for organizers

---

## 6. Benefits of This Approach

1. **Minimal Breaking Changes** - Enhances existing tables rather than replacing
2. **Gradual Migration** - Can implement in phases
3. **Backwards Compatible** - Old data remains accessible
4. **Flexible** - Supports various event types (theater, banquet, ceremony)
5. **Scalable** - Proper relational structure for complex scenarios

---

## 7. Next Steps

1. **Confirm Requirements** with stakeholders
2. **Create Migration Plan** for existing events
3. **Design UI/UX** for seat and table selection
4. **Build Organizer Tools** for venue management
5. **Test with Real Events** before full rollout