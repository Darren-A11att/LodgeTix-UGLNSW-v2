# Payment Processing Flows

## Overview
LodgeTix-UGLNSW-v2 implements a comprehensive payment processing system using Stripe for secure credit card payments. The system supports both standard payments and Stripe Connect for multi-party marketplace transactions.

## Payment Infrastructure

### 1. Stripe Integration
- **Payment Gateway**: Stripe
- **Card Processing**: Stripe Elements for PCI compliance
- **Connect Platform**: Supports platform fees and on-behalf-of payments
- **Webhook Integration**: Real-time payment status updates
- **Security**: PCI DSS Level 1 compliance via Stripe

### 2. Fee Structure
```typescript
// Australian Cards
Base Rate: 1.75% + $0.30

// International Cards  
Base Rate: 2.9% + $0.30

// Platform Fee (optional)
Platform Fee: 5% of subtotal (configurable)
```

## Payment Flow Architecture

### 1. Client-Side Payment Flow
```
User enters billing details
    ↓
Stripe Elements validates card
    ↓
Create payment method
    ↓
Submit to backend
    ↓
Process payment intent
    ↓
Handle 3D Secure if required
    ↓
Confirm payment success
```

### 2. Server-Side Payment Flow
```
Receive payment request
    ↓
Validate session and data
    ↓
Calculate fees
    ↓
Create/update Stripe customer
    ↓
Create payment intent
    ↓
Process payment
    ↓
Update registration status
    ↓
Send confirmation
```

## Key Components

### 1. Payment Step Component (`/components/register/RegistrationWizard/Steps/payment-step.tsx`)

**Responsibilities**:
- Orchestrates the payment process
- Manages billing form state
- Calculates fees and totals
- Handles payment processing UI
- Manages error states

**Key Features**:
- Two-column 60/40 layout (billing/summary)
- Real-time fee calculation
- Progressive payment status display
- Session validation
- Error recovery

**State Management**:
```typescript
{
  isProcessingPayment: boolean
  paymentError: string | null
  currentRegistrationId: string | null
  processingSteps: ProcessingStep[]
  showProcessingSteps: boolean
}
```

### 2. Billing Details Form (`/components/register/RegistrationWizard/payment/BillingDetailsForm.tsx`)

**Fields Collected**:
- Contact information (name, email, phone)
- Business name (optional)
- Billing address
- Country/state selection

**Validation**:
- Zod schema validation
- Real-time field validation
- Country-specific formatting

### 3. Payment Method Component (`/components/register/RegistrationWizard/payment/PaymentMethod.tsx`)

**Stripe Elements Integration**:
- Card number field
- Expiry date field
- CVC field
- Postal code field

**Features**:
- Real-time card validation
- Card brand detection
- Error state management
- Loading states

### 4. Checkout Form (`/components/register/RegistrationWizard/payment/CheckoutForm.tsx`)

**Responsibilities**:
- Manages Stripe Elements
- Creates payment methods
- Handles form submission
- Provides payment feedback

## API Endpoints

### 1. Create Payment Intent (`/api/stripe/create-payment-intent`)

**Purpose**: Initialize a Stripe payment intent

**Request**:
```typescript
{
  amount: number           // In cents
  currency: string        // e.g., "aud"
  registrationId?: string
  eventId?: string
  metadata?: object
  idempotencyKey?: string
}
```

**Process**:
1. Validate request data
2. Fetch registration/event details
3. Calculate platform fees
4. Create/update Stripe customer
5. Create payment intent with metadata
6. Return client secret

**Response**:
```typescript
{
  clientSecret: string
  id: string
  status: string
}
```

### 2. Process Payment (`/api/registrations/[id]/payment`)

**Purpose**: Complete payment processing

**Request**:
```typescript
{
  paymentMethodId: string
  totalAmount: number
  subtotal: number
  stripeFee: number
  billingDetails: object
}
```

**Process**:
1. Validate registration exists
2. Confirm payment with Stripe
3. Handle 3D Secure if required
4. Update registration status
5. Generate confirmation number

**Response**:
```typescript
{
  success: boolean
  confirmationNumber: string
  requiresAction?: boolean
  clientSecret?: string
}
```

### 3. Verify Payment (`/api/registrations/[id]/verify-payment`)

**Purpose**: Verify payment status after 3D Secure

**Process**:
1. Check payment intent status
2. Update registration if successful
3. Handle failure cases
4. Return final status

## Stripe Connect Integration

### 1. Platform Architecture
```
Customer → Platform (LodgeTix) → Connected Account (Event Organizer)
           ↓                      ↓
        Platform Fee         Event Revenue
```

### 2. Connected Account Setup
- Organizations register Stripe accounts
- Platform stores `stripe_onbehalfof` ID
- Accounts must be verified and charges-enabled

### 3. Payment Distribution
- **Direct Charges**: Funds go to connected account
- **Application Fee**: Platform takes percentage
- **Refunds**: Handled by connected account

## Fee Calculation

### 1. Fee Calculator Utility (`/lib/utils/stripe-fee-calculator.ts`)

**Calculation Logic**:
```typescript
// Base Stripe fee (Australian card)
stripeFee = amount * 0.0175 + 0.30

// Platform fee (if applicable)
platformFee = subtotal * 0.05

// Total amount
total = subtotal + stripeFee + platformFee
```

### 2. Fee Display
- Transparent fee breakdown
- Tooltip with fee explanation
- International card rate notice

## Payment Security

### 1. PCI Compliance
- No card data touches server
- Stripe Elements handles sensitive data
- Tokenization for all card details
- HTTPS required in production

### 2. Session Security
- Anonymous session validation
- CSRF protection
- Secure cookie handling
- Payment intent tied to session

### 3. Data Validation
- Server-side validation of all inputs
- Amount verification
- Registration state validation
- Idempotency for duplicate prevention

## Error Handling

### 1. Client-Side Errors
- Card validation errors → Inline messages
- Network errors → Retry mechanism
- Session errors → Re-authentication prompt
- Payment declined → Clear messaging

### 2. Server-Side Errors
- Invalid amount → 400 Bad Request
- Missing session → 401 Unauthorized
- Payment failure → Detailed error response
- Stripe errors → Mapped to user-friendly messages

### 3. Recovery Mechanisms
- Automatic retry for network issues
- Payment intent reuse on failure
- Session refresh on expiry
- Clear error state management

## Payment Metadata

### 1. Payment Intent Metadata
Comprehensive tracking information:
```typescript
{
  // Registration
  registrationId: string
  registrationType: string
  confirmationNumber: string
  
  // Event
  parentEventId: string
  parentEventTitle: string
  childEventCount: number
  
  // Organization
  organisationId: string
  organisationName: string
  
  // Attendees
  totalAttendees: number
  primaryAttendeeName: string
  attendeeTypes: object
  
  // Financial
  subtotal: number
  platformFee: number
  currency: string
  
  // Tracking
  appVersion: string
  environment: string
}
```

### 2. Customer Metadata
Stored on Stripe customer:
```typescript
{
  attendeeId: string
  lodgeName?: string
  lodgeNumber?: string
  grandLodge?: string
  masonicRank?: string
}
```

## Webhook Integration

### 1. Webhook Endpoint (`/api/stripe/webhook`)

**Events Handled**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `customer.created`

**Security**:
- Signature verification
- Event deduplication
- Retry logic
- Error logging

### 2. Event Processing
1. Verify webhook signature
2. Parse event data
3. Update database records
4. Trigger side effects (emails, etc.)
5. Return acknowledgment

## Testing

### 1. Test Cards
```
Success: 4242 4242 4242 4242
3D Secure: 4000 0027 6000 3184
Decline: 4000 0000 0000 0002
```

### 2. Test Mode
- Separate Stripe keys for test/production
- Test webhook endpoints
- Simulated payment delays
- Error scenario testing

## Performance Optimizations

### 1. Payment Intent Caching
- Reuse failed payment intents
- Idempotency keys for duplicates
- Minimize API calls

### 2. Parallel Processing
- Create customer while showing form
- Pre-calculate fees
- Lazy load Stripe.js

### 3. Progressive Enhancement
- Show processing steps
- Optimistic UI updates
- Graceful degradation

## Monitoring and Analytics

### 1. Payment Metrics
- Success rate tracking
- Average processing time
- Fee analysis
- Error frequency

### 2. Debugging
- Comprehensive logging
- Stripe dashboard integration
- Error tracking (Sentry)
- Performance monitoring

## Future Enhancements

1. **Alternative Payment Methods**: 
   - Apple Pay / Google Pay
   - Bank transfers
   - Buy now, pay later options

2. **Subscription Support**:
   - Recurring payments
   - Membership management
   - Auto-renewal

3. **Advanced Features**:
   - Split payments
   - Deposit/installment options
   - Group payment coordination
   - Refund automation

4. **Regional Expansion**:
   - Multi-currency support
   - Local payment methods
   - Tax calculation
   - Regional compliance