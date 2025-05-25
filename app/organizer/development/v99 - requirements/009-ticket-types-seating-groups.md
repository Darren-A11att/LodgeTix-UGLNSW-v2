# Ticket Types, Seating, and Group Bookings Specification
## Enhanced Ticketing System for Masonic Events

---

## 1. Overview

Masonic events often require sophisticated ticket management including:
- **Seated events** (Installation ceremonies with assigned seating)
- **Table bookings** (Festive Board with tables of 8-10)
- **Package deals** (Multi-event bundles, accommodation packages)
- **Group bookings** (Lodge booking entire tables/sections)

This specification addresses the missing database structures and components needed.

---

## 2. Database Schema Enhancements

### 2.1 Ticket Type System

```sql
-- Ticket type enumeration
CREATE TYPE ticket_category AS ENUM (
  'seated',           -- Assigned seating
  'general_admission', -- First come, first served
  'standing',         -- Standing room only
  'table',           -- Table seating (groups)
  'vip',             -- VIP/special access
  'package'          -- Part of a package deal
);

-- Enhanced ticket definitions
ALTER TABLE ticket_definitions ADD COLUMN 
  category ticket_category DEFAULT 'general_admission',
  requires_seat_selection BOOLEAN DEFAULT FALSE,
  max_per_booking INTEGER,
  group_size INTEGER, -- For table bookings (e.g., 8 for table of 8)
  seat_zone TEXT,     -- Zone/section restrictions
  amenities JSONB;    -- VIP perks, meal included, etc.

-- Ticket metadata for special types
CREATE TABLE ticket_type_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_definition_id UUID REFERENCES ticket_definitions(id),
  metadata_key TEXT NOT NULL,
  metadata_value JSONB NOT NULL,
  UNIQUE(ticket_definition_id, metadata_key)
);
```

### 2.2 Venue and Seating Management

```sql
-- Venue layouts for events
CREATE TABLE venue_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  venue_name TEXT NOT NULL,
  layout_type TEXT, -- 'theater', 'banquet', 'ceremony'
  capacity INTEGER,
  layout_data JSONB, -- SVG or coordinate data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual seats
CREATE TABLE venue_seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_layout_id UUID REFERENCES venue_layouts(id),
  section TEXT NOT NULL,
  row TEXT NOT NULL,
  seat_number TEXT NOT NULL,
  seat_type TEXT, -- 'standard', 'wheelchair', 'aisle'
  coordinates JSONB, -- {x, y} for visual display
  is_available BOOLEAN DEFAULT TRUE,
  notes TEXT,
  UNIQUE(venue_layout_id, section, row, seat_number)
);

-- Seat reservations
CREATE TABLE seat_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) UNIQUE,
  seat_id UUID REFERENCES venue_seats(id),
  reserved_at TIMESTAMP DEFAULT NOW(),
  reserved_until TIMESTAMP, -- For temporary holds
  is_confirmed BOOLEAN DEFAULT FALSE,
  special_requirements TEXT
);
```

### 2.3 Table and Group Bookings

```sql
-- Table configurations for banquet events
CREATE TABLE event_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  table_number TEXT NOT NULL,
  table_name TEXT, -- "Head Table", "Lodge Officers", etc.
  capacity INTEGER NOT NULL,
  table_type TEXT, -- 'round', 'rectangular', 'head'
  location_notes TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE(event_id, table_number)
);

-- Group/Table bookings
CREATE TABLE table_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES event_tables(id),
  registration_id UUID REFERENCES registrations(id),
  booking_name TEXT, -- "Leichhardt Lodge Table"
  seats_booked INTEGER NOT NULL,
  group_leader_attendee_id UUID REFERENCES attendees(id),
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Links individual attendees to table bookings
CREATE TABLE table_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_booking_id UUID REFERENCES table_bookings(id),
  attendee_id UUID REFERENCES attendees(id),
  seat_position INTEGER, -- 1-10 for table position
  dietary_requirements TEXT,
  UNIQUE(attendee_id) -- One table per attendee
);
```

### 2.4 Enhanced Package System

```sql
-- Package types
CREATE TYPE package_category AS ENUM (
  'multi_event',      -- Multiple events bundle
  'accommodation',    -- Event + hotel
  'all_inclusive',    -- Events + meals + accommodation
  'group_discount',   -- Bulk purchase discount
  'early_bird',       -- Time-based discount
  'vip_experience'    -- Premium package
);

-- Enhanced package definitions
CREATE TABLE package_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  function_id UUID REFERENCES functions(id),
  name TEXT NOT NULL,
  category package_category NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  savings_amount DECIMAL, -- vs individual purchases
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  includes_accommodation BOOLEAN DEFAULT FALSE,
  includes_meals BOOLEAN DEFAULT FALSE,
  is_transferable BOOLEAN DEFAULT FALSE,
  terms_conditions TEXT
);

-- Package components (what's included)
CREATE TABLE package_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_definition_id UUID REFERENCES package_definitions(id),
  component_type TEXT, -- 'ticket', 'accommodation', 'meal', 'merchandise'
  component_id UUID, -- References appropriate table
  quantity INTEGER DEFAULT 1,
  is_mandatory BOOLEAN DEFAULT TRUE
);

-- Package customizations allowed
CREATE TABLE package_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_definition_id UUID REFERENCES package_definitions(id),
  customization_type TEXT,
  options JSONB,
  price_adjustment DECIMAL
);
```

---

## 3. Component Specifications

### 3.1 Seat Selection Component

```typescript
// components/organizer/seating/SeatSelector.tsx

interface SeatSelectorProps {
  eventId: string
  ticketDefinitionId: string
  numberOfSeats: number
  onSeatsSelected: (seats: SelectedSeat[]) => void
}

interface SelectedSeat {
  seatId: string
  section: string
  row: string
  seatNumber: string
  ticketId?: string
}

export function SeatSelector({ eventId, ticketDefinitionId, numberOfSeats, onSeatsSelected }: SeatSelectorProps) {
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([])
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null)
  const { data: venueLayout } = useVenueLayout(eventId)
  const { data: availability } = useSeatAvailability(eventId)
  
  return (
    <div className="space-y-4">
      {/* Stage/Front indicator */}
      <div className="text-center p-4 bg-gray-100 rounded">
        <span className="text-sm font-medium">STAGE / EAST</span>
      </div>
      
      {/* Seat map */}
      <div className="relative">
        <SeatMap
          layout={venueLayout}
          availability={availability}
          selectedSeats={selectedSeats}
          hoveredSeat={hoveredSeat}
          onSeatClick={handleSeatClick}
          onSeatHover={setHoveredSeat}
        />
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 justify-center">
        <SeatLegend />
      </div>
      
      {/* Selected seats summary */}
      <Card>
        <CardHeader>
          <CardTitle>Selected Seats ({selectedSeats.length}/{numberOfSeats})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map(seat => (
              <Badge key={seat.seatId} variant="secondary">
                {seat.section} Row {seat.row} Seat {seat.seatNumber}
                <button
                  onClick={() => handleRemoveSeat(seat.seatId)}
                  className="ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Auto-select best available */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={handleAutoSelect}
          disabled={selectedSeats.length === numberOfSeats}
        >
          Auto-select Best Available Seats
        </Button>
      </div>
    </div>
  )
}
```

### 3.2 Table Booking Component

```typescript
// components/organizer/tables/TableBookingManager.tsx

interface TableBookingManagerProps {
  eventId: string
  registrationId: string
  attendees: Attendee[]
}

export function TableBookingManager({ eventId, registrationId, attendees }: TableBookingManagerProps) {
  const [selectedTable, setSelectedTable] = useState<EventTable | null>(null)
  const [tableAttendees, setTableAttendees] = useState<TableAssignment[]>([])
  const { data: availableTables } = useAvailableTables(eventId)
  
  return (
    <div className="space-y-6">
      {/* Table selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Table</CardTitle>
          <CardDescription>
            Choose a table for your group. Tables seat 8-10 people.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTables?.map(table => (
              <TableCard
                key={table.id}
                table={table}
                isSelected={selectedTable?.id === table.id}
                onSelect={() => setSelectedTable(table)}
                availableSeats={table.capacity - table.seatsBooked}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {selectedTable && (
        <Card>
          <CardHeader>
            <CardTitle>Assign Attendees to Table {selectedTable.tableNumber}</CardTitle>
            <CardDescription>
              Drag and drop attendees to assign seating positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TableSeatingChart
              table={selectedTable}
              assignedAttendees={tableAttendees}
              availableAttendees={attendees}
              onAssignment={handleAttendeeAssignment}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Special requests */}
      <Card>
        <CardHeader>
          <CardTitle>Special Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any special seating requirements or requests..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSaveTableBooking}>
          Confirm Table Booking
        </Button>
      </div>
    </div>
  )
}
```

### 3.3 Package Builder Component

```typescript
// components/organizer/packages/PackageBuilder.tsx

interface PackageBuilderProps {
  functionId: string
  childEvents: ChildEvent[]
  onSave: (packageDef: PackageDefinition) => Promise<void>
}

export function PackageBuilder({ functionId, childEvents, onSave }: PackageBuilderProps) {
  const [packageData, setPackageData] = useState<PackageFormData>({
    name: '',
    category: 'multi_event',
    components: [],
    price: 0,
    customizations: []
  })
  
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Package Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Package Name</Label>
            <Input
              value={packageData.name}
              onChange={(e) => setPackageData({ ...packageData, name: e.target.value })}
              placeholder="e.g., Grand Installation Full Experience"
            />
          </div>
          
          <div>
            <Label>Category</Label>
            <Select
              value={packageData.category}
              onValueChange={(value) => setPackageData({ ...packageData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multi_event">Multi-Event Bundle</SelectItem>
                <SelectItem value="accommodation">Event + Accommodation</SelectItem>
                <SelectItem value="all_inclusive">All Inclusive</SelectItem>
                <SelectItem value="group_discount">Group Discount</SelectItem>
                <SelectItem value="vip_experience">VIP Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Package Components */}
      <Card>
        <CardHeader>
          <CardTitle>Package Components</CardTitle>
          <CardDescription>
            Select what's included in this package
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tickets">
            <TabsList>
              <TabsTrigger value="tickets">Event Tickets</TabsTrigger>
              <TabsTrigger value="accommodation">Accommodation</TabsTrigger>
              <TabsTrigger value="extras">Extras</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tickets" className="space-y-4">
              {childEvents.map(event => (
                <Card key={event.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TicketSelector
                      event={event}
                      onSelect={(tickets) => handleAddTickets(event.id, tickets)}
                    />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="accommodation">
              <AccommodationSelector
                onSelect={(accommodation) => handleAddAccommodation(accommodation)}
              />
            </TabsContent>
            
            <TabsContent value="extras">
              <ExtrasSelector
                options={['Parking', 'Merchandise', 'Welcome Gift']}
                onSelect={(extras) => handleAddExtras(extras)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingCalculator
            components={packageData.components}
            onPriceSet={(price, savings) => {
              setPackageData({ 
                ...packageData, 
                price, 
                savingsAmount: savings 
              })
            }}
          />
        </CardContent>
      </Card>
      
      {/* Customizations */}
      <Card>
        <CardHeader>
          <CardTitle>Allow Customizations</CardTitle>
          <CardDescription>
            Let buyers customize parts of the package
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomizationBuilder
            onAdd={(customization) => {
              setPackageData({
                ...packageData,
                customizations: [...packageData.customizations, customization]
              })
            }}
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={() => handleSave()}>
          Create Package
        </Button>
      </div>
    </div>
  )
}
```

---

## 4. Organizer Portal Features

### 4.1 Seat Management Dashboard

```typescript
// components/organizer/seating/SeatManagementDashboard.tsx

export function SeatManagementDashboard({ eventId }: { eventId: string }) {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Seats"
          value={venue.totalSeats}
          icon={Grid}
        />
        <MetricCard
          title="Sold"
          value={venue.soldSeats}
          icon={CheckCircle}
          trend={`${venue.occupancyRate}%`}
        />
        <MetricCard
          title="Reserved"
          value={venue.reservedSeats}
          icon={Clock}
        />
        <MetricCard
          title="Available"
          value={venue.availableSeats}
          icon={Circle}
        />
      </div>
      
      {/* Interactive Seat Map */}
      <Card>
        <CardHeader>
          <CardTitle>Venue Layout</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Layout
            </Button>
            <Button size="sm" variant="outline">
              Block Seats
            </Button>
            <Button size="sm" variant="outline">
              Manage Zones
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <InteractiveSeatMap
            layout={venue.layout}
            onSeatClick={handleSeatClick}
            onZoneSelect={handleZoneSelect}
          />
        </CardContent>
      </Card>
      
      {/* Seat Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Seat Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  <SelectItem value="orchestra">Orchestra</SelectItem>
                  <SelectItem value="balcony">Balcony</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Block Selected</Button>
              <Button variant="outline">Release Selected</Button>
              <Button variant="outline">Change Pricing</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4.2 Table Management Interface

```typescript
// components/organizer/tables/TableManagement.tsx

export function TableManagement({ eventId }: { eventId: string }) {
  const [showAddTable, setShowAddTable] = useState(false)
  const { data: tables } = useEventTables(eventId)
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Table Management</h2>
        <Button onClick={() => setShowAddTable(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>
      
      {/* Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables?.map(table => (
          <TableManagementCard
            key={table.id}
            table={table}
            onEdit={() => handleEditTable(table.id)}
            onViewBookings={() => handleViewBookings(table.id)}
            onBlock={() => handleBlockTable(table.id)}
          />
        ))}
      </div>
      
      {/* Add/Edit Table Modal */}
      {showAddTable && (
        <TableFormModal
          onSave={handleSaveTable}
          onClose={() => setShowAddTable(false)}
        />
      )}
    </div>
  )
}
```

---

## 5. API Enhancements

### 5.1 Seat Management Procedures

```sql
-- Reserve seats
CREATE OR REPLACE FUNCTION sp_reserve_seats(
  p_ticket_ids UUID[],
  p_seat_ids UUID[],
  p_hold_duration INTERVAL DEFAULT '10 minutes'
)
RETURNS TABLE (
  success BOOLEAN,
  reserved_seats JSONB
)
LANGUAGE plpgsql;

-- Auto-select best available seats
CREATE OR REPLACE FUNCTION sp_auto_select_seats(
  p_event_id UUID,
  p_number_of_seats INTEGER,
  p_preferences JSONB -- {together: true, zone: 'orchestra'}
)
RETURNS TABLE (
  seat_ids UUID[],
  seat_details JSONB
)
LANGUAGE plpgsql;
```

### 5.2 Table Booking Procedures

```sql
-- Book a table
CREATE OR REPLACE FUNCTION sp_book_table(
  p_registration_id UUID,
  p_table_id UUID,
  p_attendee_assignments JSONB
)
RETURNS TABLE (
  booking_id UUID,
  success BOOLEAN
)
LANGUAGE plpgsql;

-- Get table availability
CREATE OR REPLACE FUNCTION sp_get_table_availability(
  p_event_id UUID,
  p_min_seats INTEGER DEFAULT 1
)
RETURNS TABLE (
  table_info JSONB
)
LANGUAGE plpgsql;
```

---

## 6. Implementation Priority

### Phase 1: Basic Ticket Types
1. Add ticket category field
2. Update ticket creation UI
3. Implement basic categorization

### Phase 2: Seat Management
1. Create venue layout system
2. Build seat selector component
3. Implement reservation logic

### Phase 3: Table Bookings
1. Add table definitions
2. Create table booking UI
3. Implement group assignments

### Phase 4: Enhanced Packages
1. Upgrade package builder
2. Add multi-event bundles
3. Implement customizations

---

## 7. Testing Considerations

### 7.1 Seat Selection
- Concurrent seat selection
- Reservation timeouts
- Accessibility compliance
- Mobile responsiveness

### 7.2 Table Bookings
- Partial table fills
- Group size validation
- Special requirements
- Seating preferences

### 7.3 Package Logic
- Component validation
- Pricing calculations
- Inventory tracking
- Cross-event conflicts