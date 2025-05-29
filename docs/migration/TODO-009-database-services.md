# TODO-009: Database Services & API Layer Migration

## Overview
Update all database service layers to work with new schema and RPC functions.

## Current Implementation
- **Locations**:
  - `/lib/api/` - API services
  - `/lib/supabase.ts` - Database client
  - `/lib/services/` - Business logic services
- **Issues**:
  - Multiple service files
  - Redundant logic
  - Complex table mappings

## New Schema Changes
- **Improvements**:
  - Single service per domain
  - RPC-first approach
  - No table name mappings needed

## Migration Tasks
- [ ] Create new unified service classes
- [ ] Replace direct table queries with RPC calls
- [ ] Remove table name mapping utilities
- [ ] Update error handling
- [ ] Add proper TypeScript types

## Service Architecture
```typescript
// Old: Multiple services
- registrationAdminService.ts
- customerAdminService.ts
- ticketService.ts
- attendeeAccessService.ts

// New: Domain services
- RegistrationService.ts (handles all registration operations)
- EventService.ts (handles events and tickets)
- ContactService.ts (handles all contact operations)
```

## Example Service Migration
```typescript
// Old: Direct table access
class RegistrationService {
  async createRegistration(data) {
    const { data: customer } = await supabase
      .from('customers')
      .insert(...)
    const { data: registration } = await supabase
      .from('registrations')
      .insert(...)
    // ... more inserts
  }
}

// New: RPC-based
class RegistrationService {
  async createRegistration(data: RegistrationData) {
    return await supabase.rpc('create_registration_with_payment', {
      p_event_id: data.eventId,
      p_contact_data: data.contacts,
      p_ticket_selections: data.tickets,
      p_payment_method_id: data.paymentMethodId
    })
  }
}
```

## Type Definitions
```typescript
// Generate types from database
npm run generate-types

// Use generated types
import { Database } from '@/types/supabase'
type Contact = Database['public']['Tables']['contacts']['Row']
type Registration = Database['public']['Tables']['registrations']['Row']
```

## Service Methods to Migrate
- [ ] Registration creation
- [ ] Payment processing
- [ ] Ticket selection
- [ ] Contact management
- [ ] Order calculations
- [ ] Email notifications

## Testing Requirements
- [ ] Unit test each service
- [ ] Test RPC error handling
- [ ] Test type safety
- [ ] Test transaction rollback
- [ ] Integration tests