# Ticket System Synchronization - Developer Handover

## What's Changed in the Database

We've implemented an automatic inventory tracking system that keeps ticket counts synchronized across our database tables. The system uses database triggers to maintain real-time accuracy of ticket availability.

## The Core Concept

Think of it like a warehouse inventory system:
- **event_tickets** table = Product catalog (defines what tickets are available)
- **tickets** table = Individual items sold (actual ticket instances)
- The database now automatically updates inventory counts when tickets are created, modified, or deleted

## Key Business Rules

### 1. Every Ticket Must Have a Type
Previously, tickets could be created without specifying which ticket type they belonged to. This is no longer optional. Every ticket must be linked to a ticket type (Gold, Silver, Bronze, etc.) for the inventory system to work.

### 2. Automatic Count Management
The database now handles all counting automatically through triggers. When a ticket is:
- **Created**: Reduces available count, increases reserved/sold count
- **Status changed**: Moves counts between reserved/sold/cancelled buckets
- **Deleted**: Returns the ticket to the available pool

### 3. Status Transitions
The system recognizes these ticket statuses:
- `available` - Not yet allocated to anyone
- `reserved` - Held for someone but not paid
- `sold` - Paid and confirmed
- `cancelled` - Was reserved/sold but now released
- `used` - Ticket has been scanned/used at the event

## What Needs to Change in Our Application

### 1. Ticket Creation Flow

**Current Issue**: Some tickets are being created without a `ticket_type_id`, which means they don't participate in inventory tracking.

**Required Change**: The ticket creation process must always include which type of ticket is being created. This means:
- The UI needs to ensure a ticket type is selected before creating tickets
- The API should validate that ticket_type_id is present
- Consider whether to reject tickets without a type or have a default type

### 2. Availability Checking

**Current Situation**: We might not be checking if tickets are actually available before creating them.

**Recommended Approach**: 
- Before creating tickets, check the `available_count` in the `event_tickets` table
- Show real-time availability to users during the booking process
- Handle the edge case where multiple users try to book the last tickets simultaneously

### 3. Status Management

**Important**: The database triggers respond to status changes, so:
- Be deliberate about when and how ticket statuses are updated
- Understand that changing a ticket from 'reserved' to 'sold' will automatically update multiple counts
- Consider implementing a reservation timeout system if tickets can be held without payment

### 4. Data Migration Consideration

**Existing Data**: We have some tickets in the system without `ticket_type_id` set. Decide whether to:
- Leave them as-is (they won't affect inventory counts)
- Assign them to appropriate ticket types retroactively
- Create a "legacy" ticket type for historical data

## User Experience Improvements to Consider

### 1. Real-time Availability Display
Since the database now tracks exact availability, consider showing:
- "Only X tickets left" warnings
- Real-time updates as tickets are sold
- Different messaging for low stock situations

### 2. Reservation Timer
If implementing a hold/reservation system:
- Consider how long tickets should be held
- Implement automatic cancellation of expired reservations
- Show countdown timers to users

### 3. Overselling Protection
The database will allow overselling (available_count can go negative), so the application should:
- Check availability before creating tickets
- Handle race conditions gracefully
- Provide clear messaging when tickets sell out

## Testing Recommendations

### 1. Inventory Accuracy
- Create tickets and verify counts update correctly
- Change ticket statuses and confirm count transfers
- Delete tickets and ensure availability increases

### 2. Edge Cases
- Try to create more tickets than available
- Test concurrent ticket creation
- Verify what happens with tickets that have no type

### 3. Performance
- Monitor query performance with the new foreign key relationships
- Check if batch operations work efficiently
- Ensure the UI remains responsive during peak booking times

## Questions to Discuss

1. **Default Behavior**: What should happen if someone tries to create a ticket without selecting a type?

2. **Inventory Rules**: Should we allow overselling for certain event types or ticket categories?

3. **Reservation Policy**: How long should tickets be held in 'reserved' status before automatic cancellation?

4. **Historical Data**: How should we handle the existing tickets that don't have a ticket type assigned?

5. **Reporting**: What new reports or dashboards would be valuable now that we have accurate inventory tracking?

## Database Functions Available

The following utility functions are available if needed:
- `recalculate_event_ticket_counts()` - Rebuilds all ticket type counts from scratch
- `recalculate_event_counts()` - Rebuilds all event-level counts
- `initialize_event_ticket_availability()` - Sets initial availability for new ticket types

These can be useful for data cleanup or troubleshooting but shouldn't be needed during normal operations.

## Technical Specifications

### event_tickets Table (Ticket Type Definitions)

This table defines the types of tickets available for each event (like "Gold", "Silver", "Bronze").

**Key Fields:**
- `id` (UUID) - Primary key, unique identifier for the ticket type
- `event_id` (UUID) - Links to the events table
- `name` (TEXT, required) - Display name like "Grand Dinner - Gold Ticket"
- `description` (TEXT, optional) - Detailed description of what's included
- `price` (NUMERIC, required) - Ticket price
- `total_capacity` (INTEGER, optional) - Maximum tickets available of this type
- `available_count` (INTEGER) - **AUTO-MANAGED** - Current tickets available
- `reserved_count` (INTEGER, default: 0) - **AUTO-MANAGED** - Tickets on hold
- `sold_count` (INTEGER, default: 0) - **AUTO-MANAGED** - Tickets sold
- `status` (VARCHAR, default: 'Active') - Whether this ticket type is active
- `is_active` (BOOLEAN, default: true) - Another way to enable/disable
- `eligibility_criteria` (JSONB) - Rules for who can buy this ticket type
- `created_at` (TIMESTAMPTZ) - When created
- `updated_at` (TIMESTAMPTZ) - **AUTO-UPDATED** when counts change

**Important Notes:**
- The `available_count`, `reserved_count`, and `sold_count` fields are automatically maintained by database triggers
- Never update these count fields directly from the application
- The `eligibility_criteria` field supports complex rules about attendee types, mason ranks, etc.

**Eligibility Criteria Structure (JSONB):**
```json
{
  "rules": [
    {
      "type": "attendee_type",      // or "registration_type", "grand_lodge", "mason_rank"
      "operator": "in",             // or "equals", "not_in"
      "value": ["mason", "guest"]   // can be string or array of strings
    }
  ],
  "operator": "AND"  // or "OR" - how to combine multiple rules (default: AND)
}
```

**Related Enum Types in Database:**
- Attendee Types: 'mason', 'guest', 'ladypartner', 'guestpartner'
- Registration Types: 'individuals', 'groups', 'officials', 'lodge', 'delegation'
- Customer Types: 'booking_contact', 'sponsor', 'donor'

### tickets Table (Individual Ticket Instances)

This table contains actual tickets purchased/reserved by attendees.

**Key Fields:**
- `ticket_id` (UUID) - Primary key
- `attendee_id` (UUID, optional) - Links to attendees table
- `event_id` (UUID, required) - Links to events table
- `ticket_type_id` (UUID, **NOW REQUIRED**) - Links to event_tickets.id
- `price_paid` (NUMERIC, required) - Actual price paid (may differ from list price)
- `status` (VARCHAR, required) - One of: 'available', 'reserved', 'sold', 'cancelled', 'used'
  - Has CHECK constraint enforcing these exact values
- `registration_id` (UUID, optional) - Links to registrations table
- `package_id` (UUID, optional) - If part of a package deal
- `seat_info` (VARCHAR, optional) - Seat assignment if applicable
- `checked_in_at` (TIMESTAMPTZ, optional) - When ticket was scanned/used
- `reservation_id` (UUID, optional) - For tracking reservations
- `reservation_expires_at` (TIMESTAMPTZ, optional) - When hold expires
- `original_price` (NUMERIC, optional) - List price before discounts
- `currency` (VARCHAR, default: 'AUD') - Currency code
- `payment_status` (VARCHAR, default: 'Unpaid') - Payment tracking
- `purchased_at` (TIMESTAMPTZ, optional) - When payment completed
- `is_partner_ticket` (BOOLEAN, default: false) - For companion tickets
- `created_at` (TIMESTAMPTZ) - When created
- `updated_at` (TIMESTAMPTZ) - Last modified

**Legacy Fields (being phased out):**
- `id` (UUID, optional) - Old primary key field
- `ticket_price` (NUMERIC, optional) - Duplicate of price_paid
- `ticket_status` (VARCHAR, optional) - Duplicate of status

### events Table (Affected Fields)

The events table also maintains aggregate counts:
- `reserved_count` (INTEGER, default: 0) - **AUTO-MANAGED** - Total reserved across all ticket types
  - Has CHECK constraint: reserved_count >= 0
- `sold_count` (INTEGER, default: 0) - **AUTO-MANAGED** - Total sold across all ticket types
  - Has CHECK constraint: sold_count >= 0

### Status Values and Their Meanings

**Valid Ticket Statuses:**
- `available` - Ticket exists but not assigned to anyone
- `reserved` - Held for someone, counts against available inventory
- `sold` - Paid for and confirmed
- `cancelled` - Was reserved/sold but released back to pool
- `used` - Ticket has been scanned at the event

**Status Transitions That Affect Counts:**
- `reserved` → `sold`: Decrements reserved_count, increments sold_count
- `sold` → `cancelled`: Decrements sold_count, increments available_count
- `reserved` → `cancelled`: Decrements reserved_count, increments available_count
- Creating new ticket with `reserved`: Decrements available_count, increments reserved_count
- Creating new ticket with `sold`: Decrements available_count, increments sold_count

### Foreign Key Relationships

**New Constraint Added:**
- `tickets.ticket_type_id` → `event_tickets.id` (ON DELETE RESTRICT)
  - This means you cannot delete a ticket type if tickets exist for it
  - Every ticket must reference a valid ticket type

**Existing Relationships to Be Aware Of:**
- `tickets.event_id` → `events.event_id`
- `tickets.attendee_id` → `attendees.attendee_id`
- `tickets.registration_id` → `registrations.registration_id`
- `tickets.package_id` → `packages.package_id`
- `event_tickets.event_id` → `events.event_id`

### Database Functions Available

These PostgreSQL functions can be called if needed:

1. **recalculate_event_ticket_counts()**
   - Returns: void
   - Purpose: Recalculates all counts in event_tickets table from scratch
   - When to use: If counts get out of sync

2. **recalculate_event_counts()**
   - Returns: void
   - Purpose: Recalculates all counts in events table from scratch
   - When to use: If event-level counts are incorrect

3. **initialize_event_ticket_availability()**
   - Returns: void
   - Purpose: Sets available_count = total_capacity for any uninitialized ticket types
   - When to use: After creating new ticket types

### Database Triggers (Automatic - No Action Required)

These triggers fire automatically on the tickets table:

1. **update_event_tickets_counts_trigger**
   - Fires: AFTER INSERT, UPDATE, or DELETE on tickets
   - Purpose: Updates counts in event_tickets table

2. **update_events_counts_trigger**
   - Fires: AFTER INSERT, UPDATE, or DELETE on tickets
   - Purpose: Updates counts in events table

### Indexes for Performance

- **idx_tickets_ticket_type_id** - Index on tickets.ticket_type_id for fast lookups

### Validation Rules to Implement

1. **Required Fields for Ticket Creation:**
   - event_id (must exist in events table)
   - ticket_type_id (must exist in event_tickets table)
   - price_paid (numeric value)
   - status (must be valid status value)

2. **Business Logic Constraints:**
   - Check available_count > 0 before creating reserved/sold tickets
   - Validate price_paid against event_tickets.price (flag discrepancies)
   - Ensure attendee_id exists in attendees table if provided
   - If reservation_expires_at is set, ensure it's in the future

3. **Data Type Validations:**
   - All ID fields must be valid UUIDs
   - Numeric fields (prices) should handle decimal places appropriately
   - Timestamps should be in UTC

### Current Data Status

**Existing Issues to Be Aware Of:**
1. There are 4 existing tickets in the system without `ticket_type_id` set
2. These tickets won't participate in the event_tickets inventory counts
3. They do still affect the overall events table counts
4. Decision needed: Leave as-is or assign to ticket types retroactively

**Current Ticket Status Breakdown:**
- All existing tickets (4 total) are in 'reserved' status
- No tickets are currently in 'sold' status
- The event_tickets counts show 0 for all types (because existing tickets lack ticket_type_id)

## Next Steps

1. Review existing ticket creation flows to ensure ticket_type_id is always included
2. Add availability checking before ticket creation
3. Update any reports or displays that show ticket availability
4. Plan approach for handling existing tickets without types
5. Consider UX improvements for showing real-time availability
6. Update TypeScript interfaces to match these specifications
7. Add validation for the required fields and constraints

The database layer is ready and working - now we need to ensure the application layer takes full advantage of these new capabilities while maintaining data integrity.