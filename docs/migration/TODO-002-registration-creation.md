# TODO-002: Registration Creation Migration

## Overview
Migrate from complex multi-table registration creation to simplified single RPC call.

## Current Implementation
- **Location**: `/app/api/registrations/route.ts`
- **Tables affected**:
  - `customers` (create/update)
  - `registrations` (create)
  - `attendees` (create multiple)
  - `people` (linked to attendees)
  - `masonicprofiles` (linked to people)
  - `tickets` (create multiple)
- **Complexity**: 6+ separate table inserts with complex relationships

## New Schema Changes
- **Single RPC call**: `create_registration_with_payment`
- **Simplified structure**:
  - Single `contacts` table replaces attendees/people/customers
  - Direct ticket assignment
  - Atomic transaction

## Migration Tasks
- [ ] Update registration API to use new RPC
- [ ] Map attendee data to new contact structure
- [ ] Remove people/masonicprofiles logic
- [ ] Simplify ticket creation
- [ ] Update error handling for new structure

## Data Mapping
```typescript
// Old: Multiple entities
{
  attendees: { firstName, lastName, email, ... },
  people: { first_name, last_name, primary_email, ... },
  customers: { email, first_name, last_name, ... },
  masonicprofiles: { rank, lodge_affiliation_id, ... }
}

// New: Single contact
{
  contacts: {
    first_name,
    last_name,
    email,
    phone,
    masonic_rank,
    lodge_id,
    contact_type: 'mason' | 'guest'
  }
}
```

## Code Changes Required
```typescript
// Old: Multiple inserts
await supabase.from('customers').insert(...)
await supabase.from('registrations').insert(...)
await supabase.from('attendees').insert(...)
await supabase.from('people').insert(...)
await supabase.from('tickets').insert(...)

// New: Single RPC
await supabase.rpc('create_registration_with_payment', {
  p_event_id: eventId,
  p_contact_data: mappedContacts,
  p_ticket_selections: ticketData,
  p_payment_method_id: paymentMethodId
})
```

## Testing Requirements
- [ ] Test all registration types (individual, lodge, delegation)
- [ ] Test partner registration flows
- [ ] Test data mapping accuracy
- [ ] Verify atomic transaction behavior
- [ ] Test error scenarios