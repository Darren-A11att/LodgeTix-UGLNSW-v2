# TODO-004: Order Review Step Migration

## Overview
Update order review step to display simplified data structure and calculate totals using new schema.

## Current Implementation
- **Location**: `/components/register/RegistrationWizard/Steps/OrderReviewStepUpdated.tsx`
- **Data sources**:
  - Complex attendee/people/customer relationships
  - Manual price calculations
  - Multiple data fetches

## New Schema Changes
- **Simplified data**:
  - Single contacts array
  - Direct ticket assignments
  - Server-side price calculations via RPC

## Migration Tasks
- [ ] Update order summary to use contacts instead of attendees
- [ ] Use RPC for order total calculation
- [ ] Simplify attendee display logic
- [ ] Update ticket grouping logic
- [ ] Remove complex relationship mapping

## Component Updates
```typescript
// Old: Complex data assembly
const attendeeWithDetails = {
  ...attendee,
  person: personData,
  masonicProfile: masonicData,
  tickets: assignedTickets
}

// New: Direct contact usage
const contactWithTickets = {
  ...contact,
  tickets: contact.ticket_selections
}
```

## Display Changes
- [ ] Update attendee cards to show contact info
- [ ] Simplify masonic details display
- [ ] Update ticket grouping by contact
- [ ] Use server-calculated totals
- [ ] Remove redundant data fetching

## API Integration
```typescript
// Old: Client-side calculation
const total = tickets.reduce((sum, t) => sum + t.price, 0)

// New: Server-side RPC
const { data } = await supabase.rpc('calculate_order_total', {
  p_registration_id: tempRegistrationId
})
```

## Testing Requirements
- [ ] Test order display for all registration types
- [ ] Verify price calculations match
- [ ] Test partner ticket display
- [ ] Test package breakdowns
- [ ] Verify responsive design