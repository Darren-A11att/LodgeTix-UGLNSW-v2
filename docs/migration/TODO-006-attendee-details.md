# TODO-006: Attendee Details Migration

## Overview
Migrate from complex attendee/people/mason structure to simplified contacts model.

## Current Implementation
- **Locations**: 
  - `/components/register/Forms/attendee/IndividualsForm.tsx`
  - `/components/register/Forms/attendee/LodgesForm.tsx`
  - `/components/register/Forms/attendee/DelegationsForm.tsx`
- **Complexity**:
  - Separate forms for masons vs guests
  - Complex lodge/grand lodge lookups
  - Partner relationship management

## New Schema Changes
- **Unified contact model**:
  - Single form component
  - Contact type field (mason/guest)
  - Simplified relationships
  - Direct lodge assignment

## Migration Tasks
- [ ] Create unified ContactForm component
- [ ] Merge mason/guest form logic
- [ ] Update lodge selection to new structure
- [ ] Simplify partner management
- [ ] Update form validation

## Form Structure Changes
```typescript
// Old: Separate forms
<MasonForm data={mason} />
<GuestForm data={guest} />

// New: Unified form
<ContactForm 
  data={contact}
  contactType={contact.contact_type}
  eventId={eventId}
/>
```

## Data Model Migration
```typescript
// Old: Complex structure
{
  attendee: { firstName, lastName, ... },
  person: { first_name, last_name, ... },
  masonicProfile: { rank, lodge_id, ... }
}

// New: Flat structure
{
  contact: {
    first_name,
    last_name,
    email,
    phone,
    contact_type: 'mason' | 'guest',
    masonic_rank,
    lodge_id,
    dietary_requirements,
    special_needs
  }
}
```

## Component Updates
- [ ] Create ContactForm base component
- [ ] Add contact type toggle
- [ ] Show/hide fields based on type
- [ ] Update partner selection
- [ ] Simplify lodge lookup

## Lodge Selection
```typescript
// Old: Complex grand lodge → lodge lookup
const lodges = await fetchLodgesByGrandLodge(grandLodgeId)

// New: Direct organisation lookup
const { data } = await supabase
  .from('organisations')
  .select('*')
  .eq('organisation_type', 'lodge')
  .ilike('name', `%${search}%`)
```

## Testing Requirements
- [ ] Test all registration types
- [ ] Test contact type switching
- [ ] Test lodge selection
- [ ] Test partner flows
- [ ] Test form validation
- [ ] Test data persistence