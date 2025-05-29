# TODO-010: TypeScript Type Definitions Migration

## Overview
Update all TypeScript type definitions to match new simplified schema.

## Current Implementation
- **Locations**:
  - `/database.types.ts` - Generated Supabase types
  - `/shared/types/` - Business logic types
  - Component-level type definitions
- **Issues**:
  - Mismatched naming conventions
  - Redundant type definitions
  - Complex nested types

## New Schema Changes
- **Improvements**:
  - Consistent snake_case
  - Flattened structure
  - Single source of truth

## Migration Tasks
- [ ] Generate new Supabase types
- [ ] Update business logic types
- [ ] Remove redundant definitions
- [ ] Update component props
- [ ] Add proper discriminated unions

## Type Generation
```bash
# Generate types from new schema
npx supabase gen types typescript --project-id [NEW_PROJECT_ID] > database.types.ts
```

## Core Type Updates
```typescript
// Old: Multiple related types
interface Attendee {
  attendeeId: string
  attendeeType: 'mason' | 'guest'
  personId?: string
}

interface Person {
  person_id: string
  first_name: string
  last_name: string
}

interface MasonicProfile {
  person_id: string
  rank: string
  lodge_affiliation_id: string
}

// New: Single contact type
interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  contact_type: 'mason' | 'guest'
  masonic_rank?: string
  lodge_id?: string
  dietary_requirements?: string
  special_needs?: string
}
```

## Registration Types
```typescript
// Old
interface Registration {
  registration_id: string
  customer_id: string
  attendees: Attendee[]
  tickets: Ticket[]
}

// New
interface Registration {
  id: string
  event_id: string
  contact_id: string
  status: 'draft' | 'pending' | 'confirmed' | 'cancelled'
  total_amount: number
  payment_status: 'pending' | 'completed' | 'failed'
  contacts: Contact[]
  tickets: Ticket[]
}
```

## Component Prop Updates
```typescript
// Update all component interfaces
interface ContactFormProps {
  contact: Contact
  onChange: (contact: Contact) => void
  eventId: string
}

interface TicketSelectionProps {
  eventId: string
  contacts: Contact[]
  onSelect: (selections: TicketSelection[]) => void
}
```

## Utility Type Helpers
```typescript
// Create utility types
type ContactType = Database['public']['Enums']['contact_type']
type TicketStatus = Database['public']['Enums']['ticket_status']
type PaymentStatus = Database['public']['Enums']['payment_status']

// Helper functions
function isContactMason(contact: Contact): contact is Contact & { masonic_rank: string } {
  return contact.contact_type === 'mason'
}
```

## Testing Requirements
- [ ] Type check entire codebase
- [ ] Fix all type errors
- [ ] Test runtime behavior
- [ ] Verify API contracts
- [ ] Update tests