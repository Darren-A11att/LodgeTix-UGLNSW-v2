# Registration and Ticketing Workflows

## Overview
The LodgeTix-UGLNSW-v2 application provides a comprehensive multi-step registration wizard for Masonic events. The workflow adapts based on the registration type selected and guides users through collecting attendee information, selecting tickets, processing payment, and confirming their registration.

## Registration Types

### 1. Individual Registration
- For single Masons or guests registering themselves
- Can add partners during registration
- Direct payment and ticket selection

### 2. Lodge Registration
- For Lodge representatives booking entire tables
- Simplified single-step process with integrated payment
- Customer-based model (not attendee-based)
- Uses `LodgeRegistrationStep` component

### 3. Delegation Registration
- For delegation leaders registering multiple attendees
- Supports bulk attendee management
- Group-based ticket selection

### 4. Grand Lodge Registration
- For Grand Lodge officials registering groups
- Special fields for Grand Officer ranks
- Priority ticket access

### 5. Masonic Orders Registration
- For members of specific Masonic orders
- Order-specific validation and fields
- Customized ticket eligibility

## Multi-Step Registration Wizard

### Step 1: Registration Type Selection
**Component**: `RegistrationTypeStep`
- User selects their registration type
- Anonymous authentication established
- Draft recovery check performed
- Session guard ensures authentication

### Step 2: Attendee Details / Lodge Details
**Individual/Delegation/Grand Lodge/Masonic Orders**:
**Component**: `AttendeeDetailsStep`
- Collect attendee information
- Dynamic forms based on attendee type (Mason/Guest)
- Partner management
- Contact preference selection
- Terms and conditions acceptance

**Lodge Registration**:
**Component**: `LodgeRegistrationStep`
- Single-step process combining:
  - Lodge selection
  - Table booking
  - Payment processing
- No individual attendee collection

### Step 3: Ticket Selection
**Component**: `TicketSelectionStep`
- Display available tickets/packages
- Per-attendee ticket selection
- Package vs individual ticket choice
- Real-time pricing updates
- Availability checking

### Step 4: Order Review
**Component**: `OrderReviewStep`
- Summary of all attendees
- Selected tickets/packages
- Total pricing breakdown
- Edit capabilities for each section
- Final validation before payment

### Step 5: Payment
**Component**: `PaymentStep`
- Billing details collection
- Stripe payment integration
- Real-time payment processing
- Error handling and retry logic
- Payment confirmation

### Step 6: Confirmation
**Component**: `ConfirmationStep`
- Display confirmation number
- Registration summary
- Email confirmation sent
- QR code generation for tickets
- PDF ticket download option

## State Management

### Registration Store (Zustand)
```typescript
{
  // Navigation
  currentStep: number
  registrationType: string
  
  // Data
  eventId: string
  attendees: UnifiedAttendeeData[]
  packages: Record<string, PackageSelection>
  billingDetails: BillingDetails
  
  // Status
  status: 'draft' | 'pending' | 'paid' | 'completed'
  confirmationNumber: string | null
  registrationId: string | null
  
  // Session
  anonymousSessionEstablished: boolean
  draftRecoveryHandled: boolean
}
```

### Lodge Registration Store
Separate store for lodge-specific registrations:
```typescript
{
  lodge: LodgeDetails
  tables: TableBooking[]
  paymentStatus: PaymentStatus
  confirmationNumber: string
}
```

## Key Workflows

### 1. Draft Recovery
- Automatic detection of incomplete registrations
- Modal prompt to continue or start fresh
- Preserves all entered data
- Session persistence across browser refreshes

### 2. Attendee Management
**Adding Attendees**:
- Primary attendee always required
- Additional Masons/Guests can be added
- Partners linked to primary attendees
- Automatic attendee ID generation

**Contact Preferences**:
- `Directly`: Requires email/phone
- `PrimaryAttendee`: Contact via primary
- `ProvideLater`: Defer contact info

### 3. Validation Flow
**Real-time Validation**:
- Form fields validated on change
- Step-level validation before progression
- Server-side validation on submission

**Validation Rules**:
- Masons: Require lodge, rank, Grand Lodge
- Guests: Flexible contact requirements
- Partners: Linked to parent attendee
- Lodge: Require valid lodge selection

### 4. Payment Processing
**Flow**:
1. Create payment intent via API
2. Collect card details via Stripe Elements
3. Confirm payment with Stripe
4. Update registration status
5. Generate confirmation

**Error Handling**:
- Retry logic for network failures
- Clear error messaging
- Fallback payment methods
- Manual payment verification

### 5. Session Management
**Anonymous Authentication**:
- Automatic session creation
- Turnstile verification
- Session persistence
- Upgrade path to full accounts

**Data Persistence**:
- LocalStorage for draft data
- Server-side draft saving
- Automatic recovery on return
- Session timeout handling

## API Integration

### Registration API (`/api/registrations`)
- POST: Create new registration
- GET: Retrieve registration details
- PUT: Update draft registration
- Handles attendee, ticket, and payment data

### Payment APIs
- `/api/stripe/create-payment-intent`: Initialize payment
- `/api/registrations/[id]/payment`: Process payment
- `/api/registrations/[id]/verify-payment`: Confirm status

### Email Confirmation
- `/api/send-confirmation-email`: Trigger confirmation
- Includes QR codes and PDF attachments
- Attendee-specific details

## Special Features

### 1. Package vs Individual Tickets
- Packages: Pre-bundled event access
- Individual: À la carte selection
- Mutual exclusivity per attendee
- Price optimization logic

### 2. Lodge Table Booking
- Minimum 10 attendees per table
- Bulk pricing discounts
- Table assignment logic
- Waitlist management

### 3. Accessibility
- Screen reader support
- Keyboard navigation
- High contrast mode
- Mobile-responsive design

### 4. Multi-Event Support
- Parent/child event relationships
- Cross-event ticket packages
- Hierarchical navigation
- Event-specific eligibility

## Error Handling

### User-Facing Errors
- Form validation messages
- Payment failure notifications
- Session timeout warnings
- Network error recovery

### System Errors
- Sentry error tracking
- Detailed logging
- Graceful fallbacks
- Admin notifications

## Performance Optimizations

### Code Splitting
- Lazy loading for wizard steps
- Dynamic imports for heavy components
- Route-based splitting
- Suspense boundaries

### Data Management
- Debounced validation
- Optimistic updates
- Minimal re-renders
- Efficient state updates

### Caching
- API response caching
- Static asset optimization
- Browser caching headers
- CDN integration

## Future Enhancements

1. **Saved Registrations**: Allow users to save and return later
2. **Group Templates**: Pre-fill common group configurations
3. **Waitlist Management**: Automatic promotion from waitlist
4. **Mobile App**: Native mobile experience
5. **Analytics Dashboard**: Registration insights and reporting