# PRD: Comprehensive Ticket & Package Metadata Capture in Zustand Store

## Overview
Enhance the Zustand registration store to capture ALL metadata visible to users during the registration process, creating a complete snapshot of selections with full pricing, event details, and timestamps.

## Goals
1. Capture comprehensive metadata for every user selection (tickets, packages, events)
2. Store complete snapshots at selection time with timestamps
3. Ensure APIs consume the enriched data structure
4. Maintain data consistency between frontend display and backend storage
5. Enable better debugging, confirmation emails, and audit trails

## Requirements

### 1. Status Fields
- **Ticket Status**: 'unpaid' (set at selection)
- **Registration Status**: 'draft' (overall workflow status)
- **Payment Status**: 'unpaid' (payment processing status)
- **Availability Snapshot**: Capture availability at selection time
- **NO** check_in_status

### 2. Registration Table Column Mapping
Capture all columns from the registrations table EXCEPT registration_data:
- registration_id
- function_id
- customer_id
- confirmation_number
- booking_contact_id
- event_id
- total_amount
- stripe_fee
- status
- payment_status
- payment_intent_id
- stripe_payment_intent_id
- created_at
- updated_at
- created_by
- organization_id

### 3. Comprehensive Metadata Structure

#### Ticket Metadata
```typescript
interface TicketMetadata {
  // Core identifiers
  ticketId: string;
  name: string;
  description: string | null;
  price: number;
  
  // Event information (nested)
  event: {
    eventId: string;
    eventTitle: string;
    eventSubtitle: string | null;
    eventSlug: string;
    startDate: string | null;
    endDate: string | null;
    venue: string | null;
  };
  
  // Availability snapshot
  availability: {
    isActive: boolean;
    totalCapacity: number | null;
    availableCount: number | null;
    reservedCount: number | null;
    soldCount: number | null;
    status: 'available' | 'low_stock' | 'sold_out';
  };
  
  // Status & timestamps
  status: 'unpaid';
  selectionTimestamp: string; // ISO timestamp
  functionId: string;
}
```

#### Package Metadata
```typescript
interface PackageMetadata {
  // Core identifiers
  packageId: string;
  name: string;
  description: string | null;
  
  // Pricing
  price: number;
  originalPrice: number | null;
  discount: number | null;
  
  // Included items with FULL metadata
  includedTickets: TicketMetadata[]; // Full nested ticket data
  includesDescription: string[] | null;
  
  // Status & timestamps
  status: 'unpaid';
  selectionTimestamp: string;
  functionId: string;
}
```

#### Enhanced Selection Structure
```typescript
interface EnhancedTicketSelection {
  ticket: TicketMetadata;
  quantity: number;
  subtotal: number;
  selectionTimestamp: string;
}

interface EnhancedPackageSelection {
  package: PackageMetadata;
  quantity: number;
  subtotal: number;
  selectionTimestamp: string;
}

interface AttendeeSelectionSummary {
  attendeeId: string;
  attendeeName: string;
  attendeeType: string;
  packages: EnhancedPackageSelection[];
  individualTickets: EnhancedTicketSelection[];
  attendeeSubtotal: number;
  status: 'unpaid';
}
```

### 4. Complete Order Summary
```typescript
interface OrderSummary {
  // Registration details
  registrationId?: string;
  functionId: string;
  functionName: string;
  registrationType: 'individuals' | 'lodge' | 'delegation';
  
  // Attendee summary
  totalAttendees: number;
  attendeeSummaries: AttendeeSelectionSummary[];
  
  // Pricing breakdown
  subtotal: number;
  processingFees: number;
  stripeFee: number;
  totalAmount: number;
  currency: 'AUD';
  
  // Item counts
  totalTickets: number;
  totalPackages: number;
  
  // Status & timestamps
  status: 'draft';
  paymentStatus: 'unpaid';
  createdAt: string;
  updatedAt: string;
  selectionCompleteTimestamp: string;
}
```

### 5. Updated Store Interface
```typescript
interface RegistrationState {
  // ... existing fields ...
  
  // NEW: Comprehensive metadata storage
  ticketMetadata: Record<string, TicketMetadata>; // ticketId -> metadata
  packageMetadata: Record<string, PackageMetadata>; // packageId -> metadata
  attendeeSelections: Record<string, AttendeeSelectionSummary>; // attendeeId -> summary
  orderSummary: OrderSummary | null;
  
  // NEW: Registration table mapping
  registrationTableData: {
    function_id: string | null;
    customer_id: string | null;
    booking_contact_id: string | null;
    event_id: string | null;
    total_amount: number;
    stripe_fee: number;
    status: 'draft' | 'pending' | 'completed' | 'cancelled';
    payment_status: 'unpaid' | 'paid' | 'failed' | 'refunded';
    payment_intent_id: string | null;
    stripe_payment_intent_id: string | null;
    organization_id: string | null;
  };
  
  // REMOVE: Old structures (no backward compatibility)
  // packages: Record<string, PackageSelectionType>; // REMOVE
  // ticketSelections: Record<string, AttendeeTicketSelections>; // REMOVE
}
```

### 6. New Store Actions
```typescript
// Comprehensive metadata actions
captureTicketMetadata: (ticketData: FunctionTicketDefinition) => void;
capturePackageMetadata: (packageData: FunctionPackage, includedTickets: FunctionTicketDefinition[]) => void;
addAttendeePackageSelection: (attendeeId: string, packageId: string, quantity: number) => void;
addAttendeeTicketSelection: (attendeeId: string, ticketId: string, quantity: number) => void;
removeAttendeeSelection: (attendeeId: string, itemId: string, itemType: 'package' | 'ticket') => void;
updateOrderSummary: () => void; // Recalculates totals
updateRegistrationTableData: (data: Partial<RegistrationTableData>) => void;
```

## Implementation Details

### 1. Data Flow
1. When tickets/packages load → Capture metadata immediately
2. When user selects → Create snapshot with timestamp
3. When quantity changes → Update selection with new timestamp
4. On each change → Recalculate order summary
5. On API submission → Send complete metadata structure

### 2. Lodge Registration Specifics
- Keep current terminology (tables/attendees)
- Capture bulk selection metadata
- Store per-table pricing breakdowns

### 3. API Updates Required
- Registration creation APIs must consume new structure
- Payment APIs use enriched metadata
- Confirmation emails leverage full details
- Update all consuming endpoints

### 4. Frontend State Management
- Hydration must work with new structure
- Persistence uses enhanced metadata
- Components update to read from new structure

## Test Scenarios

### Individual Registration Tests
1. **Single Mason with Package**
   - Capture package metadata with all included tickets
   - Verify pricing calculations
   - Check timestamps

2. **Single Mason with Multiple Individual Tickets**
   - Each ticket has full metadata
   - Event details nested correctly
   - Subtotals accurate

3. **Mason + Partner with Own Packages**
   - Separate attendee summaries
   - Independent selections tracked
   - Combined order summary

4. **Mason + Partner with Individual Tickets**
   - Mix of packages and individual tickets
   - Correct attendee attribution
   - Price rollups

5. **Complex Scenarios**
   - Mason + Partner + 2 Guests, mixed selections
   - Package changes (add/remove)
   - Quantity updates
   - Price changes after selection

### Lodge Registration Tests
1. **Bulk Package Selection**
   - Metadata for all attendees
   - Per-table breakdowns
   - Total calculations

2. **Bulk Individual Tickets**
   - Multiple ticket types
   - Quantity multipliers
   - Correct totals

## Success Criteria
1. ✅ All user-visible data captured in store
2. ✅ Complete snapshots at selection time
3. ✅ APIs successfully consume new structure
4. ✅ No data loss during migration
5. ✅ Improved debugging and audit capabilities
6. ✅ All tests pass with new structure

## Migration Strategy
1. Update store types and actions
2. Update ticket selection component
3. Update all API endpoints
4. Update payment flow
5. Update confirmation flow
6. Remove old structures

## Timeline
- Store updates: 2 days
- Component updates: 2 days
- API updates: 1 day
- Testing: 2 days
- Total: 7 days