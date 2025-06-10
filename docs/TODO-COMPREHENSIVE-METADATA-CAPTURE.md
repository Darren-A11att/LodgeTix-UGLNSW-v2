# TODO: Comprehensive Metadata Capture Implementation

## Phase 1: Store Structure Updates

### 1.1 Update Type Definitions
- [ ] Create new interfaces in `lib/registration-types.ts`:
  - [ ] `TicketMetadata` interface with event nesting
  - [ ] `PackageMetadata` interface with full ticket inclusion
  - [ ] `EnhancedTicketSelection` interface
  - [ ] `EnhancedPackageSelection` interface
  - [ ] `AttendeeSelectionSummary` interface
  - [ ] `OrderSummary` interface
  - [ ] `RegistrationTableData` interface

### 1.2 Update Registration Store
- [ ] Remove old interfaces from `lib/registrationStore.ts`:
  - [ ] Remove `PackageSelectionType`
  - [ ] Remove `TicketSelectionItem`
  - [ ] Remove `PackageSelection`
  - [ ] Remove `AttendeeTicketSelections`
- [ ] Add new state properties:
  - [ ] `ticketMetadata: Record<string, TicketMetadata>`
  - [ ] `packageMetadata: Record<string, PackageMetadata>`
  - [ ] `attendeeSelections: Record<string, AttendeeSelectionSummary>`
  - [ ] `orderSummary: OrderSummary | null`
  - [ ] `registrationTableData: RegistrationTableData`
- [ ] Remove old state properties:
  - [ ] Remove `packages`
  - [ ] Remove `ticketSelections`

### 1.3 Implement New Store Actions
- [ ] `captureTicketMetadata(ticketData: FunctionTicketDefinition)`
- [ ] `capturePackageMetadata(packageData: FunctionPackage, includedTickets: FunctionTicketDefinition[])`
- [ ] `addAttendeePackageSelection(attendeeId: string, packageId: string, quantity: number)`
- [ ] `addAttendeeTicketSelection(attendeeId: string, ticketId: string, quantity: number)`
- [ ] `removeAttendeeSelection(attendeeId: string, itemId: string, itemType: 'package' | 'ticket')`
- [ ] `updateOrderSummary()`
- [ ] `updateRegistrationTableData(data: Partial<RegistrationTableData>)`
- [ ] Remove old actions:
  - [ ] `updatePackageSelection`
  - [ ] `updateTicketSelections`
  - [ ] `addPackageSelection`
  - [ ] `removePackageSelection`
  - [ ] `addIndividualTicket`
  - [ ] `removeIndividualTicket`

## Phase 2: Component Updates

### 2.1 Update Ticket Selection Step
- [ ] Update `ticket-selection-step.tsx`:
  - [ ] When fetching tickets, call `captureTicketMetadata` for each
  - [ ] When fetching packages, call `capturePackageMetadata` for each
  - [ ] Replace `handleSelectPackage` to use new actions
  - [ ] Replace `handleToggleIndividualTicket` to use new actions
  - [ ] Update all references to old store structure
  - [ ] Add timestamp capture on each selection
  - [ ] Update `currentTickets` derivation to use new structure
  - [ ] Update validation functions

### 2.2 Update Payment Step
- [ ] Update `payment-step.tsx`:
  - [ ] Read from `attendeeSelections` instead of `packages`
  - [ ] Use `orderSummary` for totals
  - [ ] Update ticket expansion logic
  - [ ] Update API payload construction

### 2.3 Update Summary Components
- [ ] Update all summary components to read from new structure
- [ ] Update summary data getters

## Phase 3: API Updates

### 3.1 Update Registration APIs
- [ ] Update `/api/registrations/individuals/route.ts`:
  - [ ] Accept new metadata structure
  - [ ] Store complete zustand state in registration_data
  - [ ] Map new structure to database columns
- [ ] Update `/api/registrations/lodge/route.ts`:
  - [ ] Accept new metadata structure
  - [ ] Handle bulk selections with metadata
- [ ] Update `/api/registrations/delegation/route.ts`:
  - [ ] Accept new metadata structure

### 3.2 Update Ticket Persistence
- [ ] Update `/api/registrations/drafts/[draftId]/tickets/route.ts`:
  - [ ] Accept enhanced metadata structure
  - [ ] Store complete selection data

### 3.3 Update Confirmation Flow
- [ ] Update confirmation number generation to use metadata
- [ ] Update confirmation emails to leverage full details

## Phase 4: Testing

### 4.1 Write Unit Tests
- [ ] Test new store actions
- [ ] Test metadata capture
- [ ] Test selection timestamps
- [ ] Test order summary calculations

### 4.2 Write Integration Tests
- [ ] Test individual registration scenarios:
  - [ ] Single attendee with package
  - [ ] Single attendee with multiple tickets
  - [ ] Multiple attendees with mixed selections
  - [ ] Selection changes and updates
- [ ] Test lodge registration scenarios:
  - [ ] Bulk package selection
  - [ ] Bulk individual tickets
- [ ] Test API integration:
  - [ ] Registration creation with metadata
  - [ ] Payment processing with enriched data

### 4.3 Write E2E Tests
- [ ] Complete registration flow with metadata capture
- [ ] Verify data persists correctly
- [ ] Verify confirmation shows correct details

## Phase 5: Migration & Cleanup

### 5.1 Data Migration
- [ ] Create migration script for existing drafts
- [ ] Handle legacy data structure in APIs temporarily

### 5.2 Code Cleanup
- [ ] Remove all references to old structure
- [ ] Remove backward compatibility code
- [ ] Update documentation

## Phase 6: Verification

### 6.1 Manual Testing
- [ ] Test all registration types
- [ ] Verify metadata capture
- [ ] Check API payloads
- [ ] Verify persistence and hydration

### 6.2 Performance Testing
- [ ] Ensure metadata capture doesn't slow selection
- [ ] Check store size limits
- [ ] Verify API response times

## Implementation Order
1. Phase 1.1-1.3: Store structure (Day 1)
2. Phase 4.1: Write failing tests (Day 1)
3. Phase 2.1: Ticket selection updates (Day 2)
4. Phase 2.2-2.3: Other component updates (Day 3)
5. Phase 3.1-3.3: API updates (Day 4)
6. Phase 4.2-4.3: Integration tests (Day 5)
7. Phase 5: Migration & cleanup (Day 6)
8. Phase 6: Verification (Day 7)