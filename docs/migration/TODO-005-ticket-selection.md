# TODO-005: Ticket Selection Migration

## Overview
Migrate ticket selection to work with new event_tickets structure and simplified assignment model.

## Current Implementation
- **Location**: `/components/register/RegistrationWizard/Steps/TicketSelectionStepUpdated.tsx`
- **Complexity**:
  - Multiple ticket type lookups
  - Complex package expansion
  - Manual availability tracking

## New Schema Changes
- **Improvements**:
  - Direct event_tickets table
  - Built-in availability tracking
  - Package relationships in database
  - Real-time reservation system

## Migration Tasks
- [ ] Update ticket fetching to use new schema
- [ ] Implement ticket reservation RPC calls
- [ ] Update package selection logic
- [ ] Add real-time availability updates
- [ ] Simplify ticket assignment logic

## API Updates
```typescript
// Old: Complex ticket fetching
const tickets = await supabase
  .from('eventtickets')
  .select('*, events!inner(*)')
  .eq('event_id', eventId)

// New: Simplified with availability
const { data } = await supabase.rpc('calculate_available_tickets', {
  p_event_id: eventId
})
```

## Reservation System
```typescript
// New: Reserve tickets during selection
await supabase.rpc('reserve_tickets_for_checkout', {
  p_event_id: eventId,
  p_ticket_type_id: ticketTypeId,
  p_quantity: quantity,
  p_session_id: sessionId
})
```

## UI Updates
- [ ] Add real-time availability indicators
- [ ] Show reserved ticket countdown
- [ ] Update package UI for new structure
- [ ] Add reservation expiry warnings
- [ ] Improve sold-out handling

## Component Changes
- [ ] Update TicketSelection component
- [ ] Modify package expansion logic
- [ ] Add reservation management
- [ ] Update state management
- [ ] Add WebSocket for real-time updates

## Testing Requirements
- [ ] Test ticket availability updates
- [ ] Test reservation system
- [ ] Test package selection
- [ ] Test concurrent user scenarios
- [ ] Test reservation expiry