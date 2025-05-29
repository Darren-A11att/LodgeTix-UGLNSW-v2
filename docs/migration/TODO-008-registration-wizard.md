# TODO-008: Registration Wizard Container Migration

## Overview
Update the main registration wizard to work with simplified schema and new RPC functions.

## Current Implementation
- **Location**: `/components/register/RegistrationWizard/registration-wizard.tsx`
- **Complexity**:
  - Complex state management
  - Multiple context providers
  - Complicated step flow

## New Schema Changes
- **Simplifications**:
  - Unified contact model
  - Single registration RPC
  - Cleaner state structure

## Migration Tasks
- [ ] Update wizard state structure
- [ ] Simplify step definitions
- [ ] Update context providers
- [ ] Implement new save/load logic
- [ ] Update progress tracking

## State Structure
```typescript
// Old: Complex nested state
{
  registrationType: string,
  attendees: Attendee[],
  people: Person[],
  tickets: Ticket[],
  billingDetails: BillingDetails,
  // ... many more
}

// New: Simplified flat state
{
  registrationType: 'individual' | 'lodge' | 'delegation',
  contacts: Contact[],
  ticketSelections: TicketSelection[],
  paymentMethodId?: string,
  sessionId: string
}
```

## Step Configuration
```typescript
// Simplified step flow
const steps = [
  { id: 'type', component: RegistrationTypeStep },
  { id: 'contacts', component: ContactDetailsStep },
  { id: 'tickets', component: TicketSelectionStep },
  { id: 'review', component: OrderReviewStep },
  { id: 'payment', component: PaymentStep }
]
```

## Draft Saving
```typescript
// Old: Complex manual saving
await saveToMultipleTables(state)

// New: Single RPC
await supabase.rpc('save_registration_draft', {
  p_draft_data: state,
  p_event_id: eventId
})
```

## Context Updates
- [ ] Simplify RegistrationContext
- [ ] Remove redundant providers
- [ ] Update context methods
- [ ] Streamline data flow
- [ ] Add better error handling

## Component Updates
- [ ] Update wizard container
- [ ] Simplify navigation logic
- [ ] Update progress indicator
- [ ] Improve error boundaries
- [ ] Add loading states

## Testing Requirements
- [ ] Test complete flow
- [ ] Test draft save/load
- [ ] Test navigation
- [ ] Test error recovery
- [ ] Test session management