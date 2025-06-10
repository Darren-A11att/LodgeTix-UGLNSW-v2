# TODO: Comprehensive Metadata Capture Implementation

## Phase 1: Store Structure Updates

### 1.1 Update Type Definitions
- [x] Create new interfaces in `lib/registration-metadata-types.ts`:
  - [x] `TicketMetadata` interface with event nesting
  - [x] `PackageMetadata` interface with full ticket inclusion
  - [x] `EnhancedTicketSelection` interface
  - [x] `EnhancedPackageSelection` interface
  - [x] `AttendeeSelectionSummary` interface
  - [x] `OrderSummary` interface
  - [x] `RegistrationTableData` interface

### 1.2 Update Registration Store
- [x] Remove old interfaces from `lib/registrationStore.ts`:
  - [x] Keep `PackageSelectionType` (for backward compatibility)
  - [x] Keep `TicketSelectionItem` (for backward compatibility)
  - [x] Keep `PackageSelection` (for backward compatibility)
  - [x] Keep `AttendeeTicketSelections` (for backward compatibility)
- [x] Add new state properties:
  - [x] `functionMetadata: FunctionMetadata | null`
  - [x] `ticketMetadata: Record<string, TicketMetadata>`
  - [x] `packageMetadata: Record<string, PackageMetadata>`
  - [x] `attendeeSelections: Record<string, AttendeeSelectionSummary>`
  - [x] `orderSummary: OrderSummary | null`
  - [x] `registrationTableData: RegistrationTableData`
  - [x] `lodgeBulkSelection: LodgeBulkSelection | null`
- [x] Keep old state properties for now:
  - [x] Keep `packages` (for backward compatibility)
  - [x] Keep `ticketSelections` (for backward compatibility)

### 1.3 Implement New Store Actions
- [x] `captureFunctionMetadata(metadata: FunctionMetadata)`
- [x] `captureTicketMetadata(ticketData: FunctionTicketDefinition)`
- [x] `capturePackageMetadata(packageData: FunctionPackage, includedTickets: FunctionTicketDefinition[])`
- [x] `addAttendeePackageSelection(attendeeId: string, packageId: string, quantity: number)`
- [x] `addAttendeeTicketSelection(attendeeId: string, ticketId: string, quantity: number)`
- [x] `removeAttendeeSelection(attendeeId: string, itemId: string, itemType: 'package' | 'ticket')`
- [x] `updateOrderSummary()`
- [x] `updateRegistrationTableData(data: Partial<RegistrationTableData>)`
- [x] `addLodgeBulkPackageSelection(packageId: string, quantity: number)`
- [x] `addLodgeBulkTicketSelections(selections: Array)` (stub implementation)
- [x] Keep old actions for backward compatibility:
  - [x] Keep `updatePackageSelection`
  - [x] Keep `updateTicketSelections`
  - [x] Keep `addPackageSelection`
  - [x] Keep `removePackageSelection`
  - [x] Keep `addIndividualTicket`
  - [x] Keep `removeIndividualTicket`

## Phase 2: Component Updates

### 2.1 Update Ticket Selection Step
- [x] Update `ticket-selection-step.tsx`:
  - [x] When fetching tickets, call `captureTicketMetadata` for each
  - [x] When fetching packages, call `capturePackageMetadata` for each
  - [x] Update `handleSelectPackage` to use new actions alongside old ones
  - [x] Update `handleToggleIndividualTicket` to use new actions alongside old ones
  - [x] Keep all references to old store structure for backward compatibility
  - [x] Add timestamp capture on each selection (done in store)
  - [x] Keep `currentTickets` derivation using old structure
  - [ ] Update validation functions to check new metadata
  - [x] Add lodge bulk selection metadata capture
  - [x] Call `updateOrderSummary` before navigation

### 2.2 Update Payment Step
- [x] Update `payment-step.tsx`:
  - [ ] Read from `attendeeSelections` instead of `packages`
  - [ ] Use `orderSummary` for totals
  - [x] Update ticket expansion logic (already using resolved pricing)
  - [x] Update API payload construction (already captures complete store state)

### 2.3 Update Summary Components
- [ ] Update all summary components to read from new structure
- [ ] Update summary data getters

## Phase 3: API Updates

### 3.1 Update Registration APIs
- [x] Update `/api/registrations/individuals/route.ts`:
  - [x] Accept new metadata structure (already accepting completeZustandStoreState)
  - [x] Store complete zustand state in registration_data (via raw_registrations)
  - [x] Map new structure to database columns (via RPC functions)
- [x] Update `/api/registrations/lodge/route.ts`:
  - [x] Accept new metadata structure (completeLodgeZustandStoreState)
  - [x] Handle bulk selections with metadata (via RPC)
- [x] Update `/api/registrations/delegation/route.ts`:
  - [x] Accept new metadata structure (completeDelegationZustandStoreState)

### 3.2 Update Ticket Persistence
- [x] Update `/api/registrations/drafts/[draftId]/tickets/route.ts`:
  - [x] Accept enhanced metadata structure
  - [x] Store complete selection data

### 3.3 Update Confirmation Flow
- [ ] Update confirmation number generation to use metadata
- [ ] Update confirmation emails to leverage full details

## Phase 4: Testing

### 4.1 Write Unit Tests
- [x] Test new store actions
- [x] Test metadata capture
- [x] Test selection timestamps
- [x] Test order summary calculations

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