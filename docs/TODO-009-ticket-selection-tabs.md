# TODO-009: Implement Ticket Selection Tabs (Same/Individual)

## Objective
Add two-tab ticket selection interface allowing users to either apply the same tickets to all attendees or select tickets individually for each delegate.

## Requirements
1. Two tabs: "Same Tickets for All" and "Individual Tickets"
2. Same Tickets tab shows packages and individual tickets
3. Individual Tickets tab shows table with per-delegate selection
4. Support for bulk orders (lodges without attendee details)

## Implementation Details

### 1. Tab Interface Structure
```typescript
<Tabs defaultValue="same" className="w-full">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="same">Same Tickets for All</TabsTrigger>
    <TabsTrigger value="individual">Individual Tickets</TabsTrigger>
  </TabsList>
  <TabsContent value="same">...</TabsContent>
  <TabsContent value="individual">...</TabsContent>
</Tabs>
```

### 2. Same Tickets for All Tab
**Features:**
- Grid layout for ticket packages
- Table for individual ticket selection
- Checkbox selection for each ticket type
- Applies selections to all attendees
- Special handling for bulk orders (lodge tables)

**Bulk Order Support:**
- Detects when lodge has ordered tables but no attendees
- Stores selections under 'lodge-bulk' key
- Shows total attendee count (tables × 10)

### 3. Individual Tickets Tab
**Table Structure:**
- Columns: Title, First Name, Last Name, Grand Rank/Relationship, Tickets, Total
- Each row represents one delegate
- Package dropdown selection per attendee
- Individual ticket checkboxes per attendee
- Real-time total calculation

**Features:**
- Disabled for bulk orders until attendee details provided
- Shows informative message for bulk orders
- Per-attendee ticket customization
- Grand total calculation at bottom

### 4. State Management
```typescript
// Bulk order selections
ticketSelections['lodge-bulk'] = {
  package: selectedPackageId,
  tickets: [...selectedTicketIds]
}

// Individual selections
ticketSelections[attendeeId] = {
  package: packageId,
  tickets: [ticketId1, ticketId2]
}
```

### 5. Summary Updates
- Updated ticket summary to handle lodge bulk orders
- Shows "Lodge Order (X tables)" with attendee count
- Multiplies quantities for bulk selections
- Accurate footer counts

## Technical Implementation

### Key Functions
- `handleSamePackageChange`: Updates package for all attendees
- `handleSameTicketToggle`: Toggles individual ticket for all
- `handleIndividualPackageChange`: Updates package for one attendee
- `handleIndividualTicketToggle`: Toggles ticket for one attendee

### Bulk Order Detection
```typescript
const isBulkOrder = registrationType === 'lodge' && 
  lodgeTicketOrder && 
  attendees.length <= 1;
```

## Result
Users can now choose between bulk ticket selection (efficient for large groups) or individual customization (flexible for diverse needs).

## Status: ✅ COMPLETED

The ticket selection tabs have been successfully implemented with full support for both bulk and individual selection modes.