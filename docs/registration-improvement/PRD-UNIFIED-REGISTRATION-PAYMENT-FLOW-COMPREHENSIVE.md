# Product Requirements Document: Unified Registration and Payment Flow - Comprehensive

## Executive Summary

This PRD documents the comprehensive enhancement of the existing individuals registration flow to create a unified registration and payment system that resolves critical issues in the current implementation. The primary driver is a Stripe Connect fee allocation bug where lodge registrations are overpaying connected accounts by $16.73 per transaction. This solution consolidates all payment processing into a single, consistent flow while maintaining the unique data requirements of each registration type (individuals, lodge, and delegation).

The enhanced system will eliminate the current problem of multiple redundant database updates (3-4 times per registration), fix the premature confirmation number generation issue, ensure correct Stripe fee calculations, and provide a single source of truth for payment completion status. This is not a backward-compatible change but rather a complete replacement of the existing fragmented payment flows with a unified, enhanced individuals flow that can handle all registration types.

## Critical Problem: Stripe Connect Fee Misallocation

### The $16.73 Overpayment Issue - Real Production Example

During our investigation of the payment flows, we discovered a critical bug in production where connected Stripe accounts (event organizers) are receiving more money than they should for lodge registrations. This is a significant financial issue that affects revenue distribution.

**Actual Production Transaction - Lodge Registration (INCORRECT):**
```
Registration Type: Lodge
Ticket Subtotal: $1,150.00 (10 tickets × $115 each)
Processing Fees: $33.46
Customer Pays: $1,183.46
Connected Account Should Receive: $1,150.00 (exact subtotal)
Connected Account Actually Receives: $1,166.73 ❌
Overpayment to Connected Account: $16.73
Platform Loss per Transaction: $16.73
```

**Root Cause Analysis:**
The lodge registration route (`/api/functions/[functionId]/packages/[packageId]/lodge-registration/route.ts`) incorrectly calculates the transfer amount using:
```typescript
// INCORRECT calculation in lodge route
paymentIntentOptions.transfer_data = {
  destination: connectedAccountId,
  amount: amount - applicationFeeAmount, // This is wrong!
};
```

This calculation assumes the platform fee should be deducted from the total amount, but in Stripe Connect's destination charge model, the `transfer_data[amount]` should be the exact amount the connected account receives (the subtotal).

**Actual Production Transaction - Individual Registration (CORRECT):**
```
Registration Type: Individual
Ticket Subtotal: $2,760.00 (2 attendees with various tickets)
Processing Fees: $89.07
Customer Pays: $2,849.07
Connected Account Receives: $2,760.00 ✓ (exact subtotal - correct!)
Platform Keeps: Platform fee portion after Stripe takes their cut
```

**Why Individual Registration Works Correctly:**
The centralized payment flow and the generic payment intent creation endpoint correctly implement:
```typescript
// CORRECT calculation
paymentIntentOptions.transfer_data = {
  destination: connectedAccountId,
  amount: subtotal, // Exact ticket revenue - correct!
};
```

## Current System Analysis

### Detailed Analysis of Existing Payment Flow Issues

Through extensive analysis of the codebase and Stripe logs, we've identified multiple critical issues in the current payment processing system:

#### 1. Multiple Redundant Database Updates (3-4 Times Per Registration)

Our investigation revealed that for a single payment, the system updates the registration status to 'completed' multiple times, creating race conditions and unnecessary database load:

**Without 3D Secure (3 updates):**
1. **Payment Route Update** (`/api/registrations/[id]/payment/route.ts` lines 310-319):
   - Updates registration directly: `status='completed'`, `payment_status='completed'`
   
2. **Registration-Specific API Callback** (lines 343-398 in payment route):
   - For individuals: Calls PUT `/api/registrations/individuals`
   - For lodge: Calls PUT `/api/registrations/lodge`
   - These endpoints update the status AGAIN via RPC functions

3. **Stripe Webhook Update** (`/api/stripe/webhook/route.ts` lines 158-163):
   - On `payment_intent.succeeded` event, updates status a THIRD time

**With 3D Secure (4 updates):**
4. **Payment Verification Route** (`/api/registrations/[id]/verify-payment/route.ts`):
   - After 3D Secure redirect, updates `status='paid'`, `payment_status='completed'`

This redundancy causes:
- Database performance issues
- Race conditions between updates
- Potential for inconsistent state
- Multiple triggers of database webhooks/edge functions

#### 2. Confirmation Number Premature Generation

**The Problem:**
In Stripe logs, we see confirmation numbers like 'IND-328561' appearing in payment intent metadata at creation time, before payment succeeds. This shouldn't happen because confirmation numbers should only be generated AFTER successful payment.

**Evidence from Stripe Logs:**
```json
{
  "metadata": {
    "confirmationNumber": "IND-328561",  // This shouldn't exist yet!
    "registrationId": "abc-123",
    // ... other metadata
  }
}
```

**Root Cause:**
The payment API includes a fallback in metadata generation:
```typescript
confirmationNumber: paymentData.registration.confirmation_number || `REG-${registrationId.substring(0, 8).toUpperCase()}`
```

However, the fact that we see the database-generated format (IND-XXXXXX) instead of the fallback format (REG-XXXXXX) suggests either:
- A timing issue where the registration already has a confirmation number
- The database trigger is firing prematurely
- One of the redundant updates is triggering confirmation generation early

#### 3. Redundant API Callbacks

**Current Anti-Pattern:**
The centralized payment route (`/api/registrations/[id]/payment/route.ts`) makes redundant callbacks:

```typescript
// After updating registration status itself...
if (!requiresAction && existingRegistration.registration_type === 'individuals') {
  // Makes ANOTHER call to update the same registration
  const updateResponse = await fetch('/api/registrations/individuals', {
    method: 'PUT',
    body: JSON.stringify({
      registrationId,
      paymentIntentId: finalPaymentIntentId,
      totalAmountPaid: totalAmount
    })
  });
}
```

This pattern:
- Duplicates work already done
- Creates additional network overhead
- Increases chances of failure
- Contributes to the multiple update problem

#### 4. Incorrect Metadata Structure

**Current Issue:**
The system sends event-specific metadata instead of function-based metadata:

```typescript
// INCORRECT - Current implementation
metadata: {
  eventId: paymentData.event.event_id,
  eventTitle: paymentData.event.title,
  eventSlug: paymentData.event.slug,
  // Missing function details!
}
```

**Should Be:**
```typescript
// CORRECT - Function-based metadata
metadata: {
  functionId: paymentData.event.function_id,
  functionName: paymentData.function.name,
  functionSlug: paymentData.function.slug,
  // Events are just part of functions
}
```

This matters because LodgeTix operates in "featured function mode" where functions (event series) are the primary organizational unit, not individual events.

## Platform Fee Architecture

### Comprehensive Fee Calculation System

The platform uses a sophisticated fee calculation system implemented in `/lib/utils/stripe-fee-calculator.ts` that ensures correct revenue distribution while accounting for Stripe's processing fees and platform fees.

#### Environment Configuration

**Key Environment Variables:**
```bash
STRIPE_PLATFORM_FEE_PERCENTAGE=0.02  # 2% platform fee
STRIPE_PLATFORM_FEE_CAP=20           # Maximum $20 platform fee per transaction
NEXT_PUBLIC_STRIPE_FEE_MODE=pass_to_customer  # Fees passed to customer
```

#### Fee Calculation Formula

The system uses a precise mathematical formula to ensure the connected account receives exactly the ticket subtotal:

```typescript
// Core formula from stripe-fee-calculator.ts
Customer Payment = ((connectedAmount + platformFee) + stripeFixedFee) / (1 - stripePercentageFee)

Where:
- connectedAmount = subtotal (exact ticket revenue for organizer)
- platformFee = min(subtotal * platformFeePercentage, platformFeeCap)
- stripeFixedFee = $0.30 AUD
- stripePercentageFee = 1.7% (domestic AU cards) or 3.5% (international cards)
```

#### Domestic vs International Card Detection

The system determines card origin based on billing address country:
```typescript
function isDomesticCard(userCountry?: string): boolean {
  if (!userCountry) return false; // Default to international for safety
  return userCountry.toUpperCase() === 'AU';
}
```

#### Fee Rates
```typescript
const STRIPE_RATES = {
  domestic: {
    percentage: 0.017, // 1.7%
    fixed: 0.30,      // $0.30 AUD
    description: "1.7% + $0.30 AUD (Australian cards)"
  },
  international: {
    percentage: 0.035, // 3.5%
    fixed: 0.30,      // $0.30 AUD
    description: "3.5% + $0.30 AUD (International cards)"
  }
}
```

#### Example Calculation

For a $1,150 lodge registration with domestic card:
```
Subtotal (connected amount): $1,150.00
Platform Fee (2%, capped): $20.00 (capped from $23.00)
Stripe Fixed Fee: $0.30
Stripe Percentage: 1.7%

Customer Payment = (($1,150 + $20) + $0.30) / (1 - 0.017)
Customer Payment = $1,170.30 / 0.983
Customer Payment = $1,190.56

Breakdown:
- Connected Account Receives: $1,150.00 (exact subtotal)
- Platform Receives: $20.00 (after Stripe takes their cut)
- Stripe Receives: ~$20.56 (their processing fee)
```

#### Critical Implementation Detail

**The Golden Rule:** The `transfer_data[amount]` in Stripe must ALWAYS be the exact subtotal:
```typescript
paymentIntentOptions.transfer_data = {
  destination: connectedAccountId,
  amount: Math.round(subtotal * 100), // Convert to cents, NO MODIFICATIONS
};
```

This ensures the connected account (event organizer) receives exactly what they expect - the full ticket revenue without any deductions.

## Solution: Enhanced Individuals Flow

### Core Approach

The solution is to enhance the existing, working individuals registration flow (`/api/registrations/individuals/route.ts`) to handle all registration types. This is NOT creating new endpoints or backward compatibility - it's expanding the current individuals flow to become the single, unified registration and payment system for all types.

**Why Enhance Individuals Flow:**
1. It already implements correct Stripe fee calculations
2. It has the proper edge function invocation pattern
3. It handles complex attendee and masonic profile creation
4. It has proven stability in production
5. It already captures complete Zustand store state

### Registration Type Specifications

#### 1. Individual Registration (Current Implementation - Working Correctly)
- **Contacts & Customers:** Creates contact records for each attendee, links to customer records
- **Attendees:** Creates full attendee records with personal details
- **Masonic Profiles:** Associates attendees with their masonic information (lodge, rank, etc.)
- **Tickets:** Reserves tickets linked to specific attendees
- **Data Flow:** Full attendee information capture with partner relationships

#### 2. Lodge Registration (To Be Integrated)
- **Contact & Customer:** Creates single lodge contact and customer record
- **No Attendees:** This is an organization-level purchase, not individual attendees
- **Tickets:** Reserves bulk tickets without attendee assignment
- **Unique Fields:** Table count, lodge details, grand lodge information
- **Important:** No separate lodge_registrations table - uses main registrations table with type='lodge'

#### 3. Delegation Registration (Two Distinct Branches)
- **Branch A - Tickets Only:**
  - Similar to lodge: organization-level purchase
  - Creates booking contact and customer
  - No individual attendee records
  - Bulk ticket purchase
  
- **Branch B - Full Registration:**
  - Similar to individuals: creates attendee records
  - Booking contact for primary organizer
  - Individual delegate records with details
  - Tickets assigned to specific delegates

- **Key Terminology:** Uses "booking contact" (not "leader contact" or "delegation leader")
- **Branch Detection:** Determined by presence of attendees array in payload

## Detailed Implementation Flow

### Step 1: Registration Creation (Enhanced Individuals Endpoint)
**Endpoint:** `POST /api/registrations/individuals` (enhanced to handle ALL registration types)

This is the critical change - we're enhancing the existing individuals endpoint rather than creating new ones. The endpoint will detect the registration type and branch accordingly.

**Current Implementation (Lines 1-540):**
- Already handles individual registrations correctly
- Captures complete Zustand store state
- Logs to raw_registrations for debugging
- Calls RPC function `upsert_individual_registration`

**Enhanced Implementation:**
```typescript
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Detect registration type from payload
    const registrationType = data.registrationType || 'individuals';
    
    // Continue with existing raw_registrations logging
    // Continue with existing Zustand store capture
    
    // Branch based on registration type
    switch (registrationType) {
      case 'individuals':
        // Use existing implementation unchanged
        // Creates: contacts → customers → registration → attendees → tickets
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('upsert_individual_registration', {
            p_registration_data: individualData
          });
        break;
        
      case 'lodge':
        // New branch for lodge
        // Creates: lodge contact → customer → registration → tickets (NO attendees)
        const lodgeData = {
          registrationType: 'lodge',
          functionId: data.functionId,
          lodgeDetails: data.lodgeDetails,
          tickets: data.tickets,
          totalAmount: data.totalAmount,
          subtotal: data.subtotal,
          // NO attendees array
        };
        
        const { data: lodgeResult, error: lodgeError } = await supabase
          .rpc('upsert_lodge_registration', {
            p_registration_data: lodgeData
          });
        break;
        
      case 'delegation':
        // Determine which branch based on attendees
        const hasDelegates = data.attendees && data.attendees.length > 0;
        
        if (hasDelegates) {
          // Branch B: Full registration (like individuals)
          // Creates: booking contact → customers → registration → attendees → tickets
          const { data: delegationResult, error: delegationError } = await supabase
            .rpc('upsert_delegation_registration', {
              p_registration_data: delegationData
            });
        } else {
          // Branch A: Tickets only (like lodge)
          // Creates: booking contact → customer → registration → tickets (NO attendees)
          const { data: delegationResult, error: delegationError } = await supabase
            .rpc('upsert_delegation_registration', {
              p_registration_data: ticketsOnlyData
            });
        }
        break;
    }
    
    // Common response for all types
    return NextResponse.json({
      success: true,
      registrationId: result.registrationId,
      registrationType
    });
  }
}
```

**Critical Implementation Details:**

1. **Zustand Store Capture for All Types:**
   ```typescript
   // Lodge store capture
   if (registrationType === 'lodge' && data.completeLodgeZustandStoreState) {
     const storeCapture = await captureCompleteLodgeStoreState(data, calculatedPricing);
     await storeZustandCaptureInRawRegistrations(supabase, storeCapture, registrationId);
   }
   
   // Delegation store capture
   if (registrationType === 'delegation' && data.completeDelegationZustandStoreState) {
     const storeCapture = await captureCompleteDelegationStoreState(data, calculatedPricing);
     await storeZustandCaptureInRawRegistrations(supabase, storeCapture, registrationId);
   }
   ```

2. **Maintain Raw Registration Logging:**
   - Log initial form submission for ALL types
   - Log complete Zustand store state for ALL types
   - Critical for debugging and data recovery

3. **Status Management:**
   - ALL registrations created with status='pending', payment_status='pending'
   - NO confirmation numbers at this stage
   - Consistent across all types

### Step 2: Unified Payment Intent Creation
**Endpoint:** `POST /api/payments/create-intent` (NEW unified payment endpoint)

This new endpoint consolidates all payment intent creation logic from the various registration-specific routes into a single, consistent implementation.

**Why a New Unified Endpoint:**
1. Single source of truth for fee calculations
2. Consistent metadata structure across all types
3. Eliminates the current lodge overpayment bug
4. Easier to maintain and test
5. Reduces code duplication

**Request Payload:**
```typescript
interface CreatePaymentIntentRequest {
  registrationId: string;
  billingDetails: {
    name: string;
    email: string;
    phone?: string;
    address: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country: string; // Critical for domestic/international fee determination
    };
  };
  sessionId?: string; // For tracking
  referrer?: string;  // For analytics
}
```

**Implementation Using stripe-queries.ts:**
```typescript
export async function POST(request: Request) {
  const { registrationId, billingDetails } = await request.json();
  
  // Use optimized query to fetch all required data in one call
  const paymentData = await getRegistrationWithFullContext(registrationId);
  
  if (!paymentData) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }
  
  // Calculate fees using stripe-fee-calculator.ts
  const feeCalculation = calculateStripeFees(
    paymentData.registration.subtotal,
    { userCountry: billingDetails.address.country }
  );
  
  // Build comprehensive metadata
  const metadata = buildPaymentIntentMetadata({
    // Common fields for ALL registration types
    registrationId: registrationId,
    registrationType: paymentData.registration.registration_type,
    
    // Function details (NOT event!) - Critical fix
    functionId: paymentData.function?.function_id || paymentData.event.function_id,
    functionName: paymentData.function?.name || '',
    functionSlug: paymentData.function?.slug || '',
    
    // Organization with connected account
    organisationId: paymentData.organization.organisation_id,
    organisationName: paymentData.organization.name,
    
    // Financial details from fee calculator
    subtotal: feeCalculation.connectedAmount,
    platformFee: feeCalculation.platformFee,
    stripeFee: feeCalculation.stripeFee,
    totalAmount: feeCalculation.customerPayment,
    currency: 'aud',
    isDomesticCard: feeCalculation.isDomestic,
    cardCountry: billingDetails.address.country,
    
    // NO confirmation number - hasn't been generated yet
    
    // Type-specific metadata...
  });
  
  // Create payment intent with CORRECT transfer amount
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(feeCalculation.customerPayment * 100), // Customer pays full amount
    currency: 'aud',
    automatic_payment_methods: { enabled: true },
    metadata: metadata,
    
    // CRITICAL: Connected account receives EXACT subtotal
    transfer_data: {
      destination: paymentData.organization.stripe_onbehalfof,
      amount: Math.round(paymentData.registration.subtotal * 100), // NO MODIFICATIONS!
    },
    
    // Statement descriptor
    statement_descriptor_suffix: paymentData.function?.name
      ?.substring(0, 22)
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim(),
  });
  
  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    totalAmount: feeCalculation.customerPayment,
    processingFees: feeCalculation.processingFeesDisplay
  });
}
```

**Comprehensive Metadata Structure:**

```typescript
// Common metadata for ALL registration types
const commonMetadata = {
  // Registration identification
  registrationId: string,
  registrationType: 'individuals' | 'lodge' | 'delegation',
  
  // Function details (replacing incorrect event details)
  functionId: string,        // e.g., "abc-123-def"
  functionName: string,      // e.g., "Grand Installation 2024"
  functionSlug: string,      // e.g., "grand-installation-2024"
  
  // Organization and connected account
  organisationId: string,
  organisationName: string,
  stripe_onbehalfof: string, // Connected account ID
  
  // Financial breakdown (all amounts in dollars)
  subtotal: number,          // Exact ticket revenue
  platformFee: number,       // Platform's fee (capped)
  stripeFee: number,         // Stripe's processing fee
  totalAmount: number,       // What customer pays
  processingFeesDisplay: number, // Total fees shown to customer
  currency: 'aud',
  isDomesticCard: boolean,
  cardCountry: string,
  platformFeePercentage: number,
  platformFeeCap: number,
  
  // Session tracking
  sessionId: string,
  deviceType: 'desktop' | 'mobile' | 'tablet',
  appVersion: string,
  referrer?: string,
  
  // Counts
  totalAttendees: number,
  ticketsCount: number,
  
  // Timestamps
  createdAt: string, // ISO timestamp
  
  // EXPLICITLY NO confirmation number at this stage
};

// Type-specific metadata additions
switch (registrationType) {
  case 'individuals':
    metadata = {
      ...commonMetadata,
      // Primary attendee details
      primaryAttendeeName: string,      // "John Smith"
      primaryAttendeeEmail: string,     // "john@example.com"
      primaryAttendeePhone?: string,
      
      // Attendee breakdown
      attendeeTypes: {                  // e.g., { mason: 2, guest: 1 }
        [key: string]: number
      },
      attendeeNames: string[],          // All attendee names
      
      // Masonic details (if applicable)
      primaryLodgeName?: string,
      primaryLodgeNumber?: string,
      primaryGrandLodge?: string,
    };
    break;
    
  case 'lodge':
    metadata = {
      ...commonMetadata,
      // Lodge identification
      lodgeId: string,
      lodgeName: string,               // "St George Lodge"
      lodgeNumber: string,             // "No. 6"
      
      // Grand Lodge details
      grandLodgeId: string,
      grandLodgeName: string,          // "UGLNSW & ACT"
      grandLodgeAbbreviation: string,  // "UGLNSW"
      
      // Lodge contact person
      lodgeContactName: string,
      lodgeContactEmail: string,
      lodgeContactPhone?: string,
      
      // Lodge-specific data
      tableCount: number,              // For dinner events
      lodgeCity?: string,
      lodgeState?: string,
    };
    break;
    
  case 'delegation':
    metadata = {
      ...commonMetadata,
      // Booking contact (not "leader")
      bookingContactName: string,
      bookingContactEmail: string,
      bookingContactPhone?: string,
      
      // Delegation details
      delegationName: string,          // Organization name
      delegationType: 'ticketsOnly' | 'fullRegistration',
      
      // For full registration only
      delegateCount?: number,
      attendeeTypes?: {
        [key: string]: number
      },
      delegateNames?: string[],
    };
    break;
}
```

**Critical Success Factors:**
1. **Exact Subtotal Transfer:** `transfer_data[amount]` = subtotal * 100 (in cents)
2. **Correct Fee Calculation:** Use stripe-fee-calculator.ts formula
3. **Function Metadata:** Replace event details with function details
4. **No Confirmation Number:** Not generated until payment succeeds
5. **Type-Specific Fields:** Include relevant fields for each registration type

### Step 3: Client-Side Payment Processing
**Frontend Flow:** Stripe Elements Integration

The client-side handles payment collection and 3D Secure authentication when required.

**Implementation:**
```typescript
// In the payment component
const stripe = useStripe();
const elements = useElements();

// Step 1: Create payment intent via our unified endpoint
const { clientSecret, paymentIntentId } = await fetch('/api/payments/create-intent', {
  method: 'POST',
  body: JSON.stringify({
    registrationId,
    billingDetails: {
      name: cardholderName,
      email: email,
      address: {
        country: billingCountry, // Critical for fee calculation
        postal_code: postalCode,
        // ... other address fields
      }
    }
  })
}).then(res => res.json());

// Step 2: Confirm payment with Stripe
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  clientSecret,
  confirmParams: {
    return_url: `${window.location.origin}/api/registrations/${registrationId}/verify-payment`,
  },
  redirect: 'if_required', // Only redirect for 3D Secure
});

// Step 3: Handle result
if (error) {
  // Show error to customer
} else if (paymentIntent.status === 'succeeded') {
  // Payment succeeded without 3D Secure
  // Poll for confirmation number
  await pollForConfirmation(registrationId);
} else if (paymentIntent.status === 'requires_action') {
  // 3D Secure required - Stripe will handle redirect
}
```

**3D Secure Flow:**
1. Stripe automatically redirects to bank's 3D Secure page
2. Customer completes authentication
3. Returns to our verify-payment endpoint
4. We check payment status and continue flow

### Step 4: Webhook Processing - Single Source of Truth
**Endpoint:** `POST /api/stripe/webhook`

This is the AUTHORITATIVE and ONLY place where payment completion is recorded.

**Current Implementation Analysis:**
- Located at `/app/api/stripe/webhook/route.ts`
- Already handles multiple Stripe events
- Updates registration status on payment_intent.succeeded

**Enhanced Implementation:**
```typescript
export async function POST(request: Request) {
  // Verify webhook signature
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      sig,
      webhookSecret
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Extract registration ID from metadata
      const registrationId = paymentIntent.metadata.registrationId;
      
      if (!registrationId) {
        console.error('No registration ID in payment intent metadata');
        break;
      }
      
      // CRITICAL: This is the ONLY place we update status to 'completed'
      const supabase = await createClient();
      
      // Update registration status
      const { error: updateError } = await supabase
        .from('registrations')
        .update({
          status: 'completed',
          payment_status: 'completed',
          stripe_payment_intent_id: paymentIntent.id,
          total_amount_paid: paymentIntent.amount / 100,
          updated_at: new Date().toISOString()
        })
        .eq('registration_id', registrationId);
      
      if (updateError) {
        console.error('Failed to update registration:', updateError);
        // Stripe will retry webhook
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
      }
      
      // Update tickets to sold
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({
          status: 'sold',
          ticket_status: 'sold',
          purchased_at: new Date().toISOString()
        })
        .eq('registration_id', registrationId)
        .eq('status', 'reserved');
      
      if (ticketError) {
        console.error('Failed to update tickets:', ticketError);
        // Non-critical - continue
      }
      
      // Database webhook will trigger edge function for confirmation generation
      console.log(`Payment completed for registration ${registrationId}`);
      break;
      
    case 'payment_intent.payment_failed':
      // Handle failed payments
      // Update registration status to 'failed'
      break;
      
    // ... other event types
  }
  
  return NextResponse.json({ received: true });
}
```

**Why Webhook is Authoritative:**
1. **Guaranteed Delivery:** Stripe retries webhooks until acknowledged
2. **Single Source:** Eliminates race conditions from multiple updates
3. **Secure:** Webhook signatures prevent tampering
4. **Reliable:** Works even if customer closes browser
5. **Idempotent:** Can handle duplicate events safely

### Step 5: Remove Redundant Callbacks
**File:** `/api/registrations/[id]/payment/route.ts`

**Current Problem (Lines 343-398):**
```typescript
// This code creates redundant updates - MUST BE REMOVED
if (!requiresAction && existingRegistration.registration_type === 'individuals') {
  const updateResponse = await fetch('/api/registrations/individuals', {
    method: 'PUT',
    // ... redundant update
  });
}

if (!requiresAction && existingRegistration.registration_type === 'lodge') {
  const updateResponse = await fetch('/api/registrations/lodge', {
    method: 'PUT',
    // ... redundant update
  });
}
```

**Solution:**
1. **Delete lines 343-398** completely
2. **Remove the payment route's status update** (lines 310-341)
3. **Keep only** payment intent creation logic
4. Let the webhook be the single source of truth

**After Cleanup:**
```typescript
// The payment route should ONLY:
// 1. Create/confirm payment intent
// 2. Return client secret
// 3. NOT update any registration status
```

### Step 6: Confirmation Generation - Direct Edge Function Invocation

The current individuals flow successfully uses direct edge function invocation for confirmation generation. We will maintain this pattern for all registration types.

**Current Pattern (Working Well):**
In `/api/registrations/individuals/route.ts` (lines 634-677), after payment completion:

```typescript
// Direct invocation of edge function - NOT relying on database webhook
const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('generate-confirmation', {
  body: {
    type: 'UPDATE',
    table: 'registrations',
    schema: 'public',
    record: {
      id: registrationId,
      registration_id: registrationId,
      status: 'completed',
      payment_status: 'completed',
      confirmation_number: null, // Will be generated by edge function
      registration_type: registrationType, // 'individuals', 'lodge', or 'delegation'
      function_id: existingRegistration.function_id,
      customer_id: existingRegistration.auth_user_id || '',
      created_at: existingRegistration.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    old_record: {
      // Previous state for edge function logic
      status: 'pending',
      payment_status: 'pending',
      confirmation_number: null,
      // ... other fields
    }
  },
});
```

**Edge Function Behavior:**
The `generate-confirmation` edge function:
1. Receives the registration update payload
2. Generates type-specific confirmation number:
   - Individuals: `IND-XXXXXX`
   - Lodge: `LDG-XXXXXX`
   - Delegation: `DEL-XXXXXX`
3. Updates the registration with the confirmation number
4. Returns success/failure status

**Why Direct Invocation:**
1. **More Reliable:** Don't rely on database webhooks which can be delayed
2. **Immediate Feedback:** Know if generation succeeded or failed
3. **Better Error Handling:** Can retry or handle failures gracefully
4. **Proven Pattern:** Already working successfully in production

**Enhanced PUT Endpoint for Payment Completion:**
```typescript
export async function PUT(request: Request) {
  const { registrationId, paymentIntentId, totalAmountPaid } = await request.json();
  
  // Existing payment update logic...
  
  // After successful payment update, invoke edge function
  try {
    console.log("Invoking confirmation generation edge function...");
    
    const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('generate-confirmation', {
      body: {
        type: 'UPDATE',
        table: 'registrations',
        schema: 'public',
        record: {
          registration_id: registrationId,
          status: 'completed',
          payment_status: 'completed',
          registration_type: registrationType,
          // Include all necessary fields for edge function
        }
      }
    });
    
    if (edgeFunctionError) {
      console.error('Edge function error:', edgeFunctionError);
      // Don't fail the entire request - confirmation can be generated later
    } else {
      console.log('Confirmation generation triggered successfully');
    }
  } catch (error) {
    console.error('Failed to invoke edge function:', error);
    // Non-critical failure - continue
  }
  
  return NextResponse.json({ success: true, registrationId });
}
```

### Step 7: Polling for Confirmation Number
**New Endpoint:** `GET /api/registrations/[id]/confirmation`

After invoking the edge function, we need to poll for the generated confirmation number since it's created asynchronously.

**Implementation:**
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const registrationId = params.id;
  const maxAttempts = 10;
  const delayMs = 500;
  
  const supabase = await createClient();
  
  // Poll for confirmation number
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase
      .from('registrations')
      .select('confirmation_number, registration_type')
      .eq('registration_id', registrationId)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    
    if (data?.confirmation_number) {
      // Confirmation number generated successfully
      return NextResponse.json({
        confirmationNumber: data.confirmation_number,
        registrationType: data.registration_type
      });
    }
    
    // Wait before next attempt
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Timeout - confirmation number not generated in time
  console.error(`Confirmation number generation timeout for ${registrationId}`);
  
  // Fallback: Generate a temporary confirmation number
  const fallbackConfirmation = `TEMP-${registrationId.substring(0, 8).toUpperCase()}`;
  
  return NextResponse.json({
    confirmationNumber: fallbackConfirmation,
    isTemporary: true,
    message: 'Confirmation number generation delayed. Check your email for the official confirmation.'
  });
}
```

**Client-Side Polling:**
```typescript
async function pollForConfirmation(registrationId: string): Promise<ConfirmationResult> {
  const response = await fetch(`/api/registrations/${registrationId}/confirmation`);
  const data = await response.json();
  
  if (data.confirmationNumber) {
    return {
      confirmationNumber: data.confirmationNumber,
      registrationType: data.registrationType,
      isTemporary: data.isTemporary || false
    };
  }
  
  throw new Error('Failed to get confirmation number');
}
```

**Polling Strategy:**
1. **Immediate Check:** First check right after edge function invocation
2. **Retry Logic:** 10 attempts with 500ms delay (5 seconds total)
3. **Fallback:** If timeout, provide temporary confirmation
4. **Email Backup:** Official confirmation sent via email regardless

### Step 8: Update Stripe Metadata with Confirmation Details

After successfully obtaining the confirmation number, we update the Stripe payment intent metadata. This provides a complete audit trail in Stripe's dashboard.

**Implementation:**
```typescript
// After polling returns confirmation number
export async function updateStripeMetadata(
  paymentIntentId: string,
  confirmationNumber: string,
  ticketNumbers?: string[]
) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
  });
  
  try {
    // Fetch existing metadata to preserve it
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Update with confirmation details
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        ...paymentIntent.metadata,
        confirmationNumber: confirmationNumber,
        confirmationGeneratedAt: new Date().toISOString(),
        ticketNumbers: ticketNumbers?.join(',') || 'pending',
        ticketCount: ticketNumbers?.length.toString() || paymentIntent.metadata.ticketsCount,
      }
    });
    
    console.log(`Updated Stripe metadata for ${paymentIntentId} with confirmation ${confirmationNumber}`);
  } catch (error) {
    console.error('Failed to update Stripe metadata:', error);
    // Non-critical - don't fail the flow
  }
}
```

**Ticket Number Generation:**
Currently, ticket numbers would use UUIDs as fallback. Future enhancement would implement server-side ticket number generation similar to confirmation numbers:
- Format: `TKT-XXXXXX` or event-specific format
- Generated via edge function or database trigger
- Stored in tickets table

**Complete Flow After Payment:**
```typescript
// In the client after payment success
async function completeRegistrationFlow(registrationId: string, paymentIntentId: string) {
  // 1. Poll for confirmation number
  const { confirmationNumber, registrationType } = await pollForConfirmation(registrationId);
  
  // 2. Update Stripe metadata (fire and forget)
  fetch('/api/stripe/update-metadata', {
    method: 'POST',
    body: JSON.stringify({
      paymentIntentId,
      confirmationNumber,
      registrationId
    })
  });
  
  // 3. Navigate to confirmation page
  const confirmationUrl = getConfirmationUrl(registrationType, functionSlug, confirmationNumber);
  router.push(confirmationUrl);
}
```

### Step 9: Type-Specific Confirmation Page Routing

The final step routes users to their type-specific confirmation page with the generated confirmation number.

**Routing Implementation:**
```typescript
function getConfirmationUrl(
  registrationType: 'individuals' | 'lodge' | 'delegation',
  functionSlug: string,
  confirmationNumber: string
): string {
  const baseUrl = `/functions/${functionSlug}/register/confirmation`;
  
  const routes = {
    individuals: `${baseUrl}/individuals/${confirmationNumber}`,
    lodge: `${baseUrl}/lodge/${confirmationNumber}`,
    delegation: `${baseUrl}/delegation/${confirmationNumber}`
  };
  
  return routes[registrationType];
}
```

**Page Structure:**
```
app/(public)/functions/[slug]/register/confirmation/
├── individuals/[confirmationNumber]/page.tsx
├── lodge/[confirmationNumber]/page.tsx
└── delegation/[confirmationNumber]/page.tsx
```

**Confirmation Page Features:**
Each type-specific page should display:

**Individuals Confirmation:**
- Confirmation number prominently displayed
- List of attendees registered
- Ticket details for each attendee
- QR codes for each ticket
- Event details and schedule
- Download/email options

**Lodge Confirmation:**
- Confirmation number
- Lodge details
- Number of tickets purchased
- Table assignment (if applicable)
- Event logistics
- Contact person details

**Delegation Confirmation:**
- Confirmation number
- Delegation/organization name
- Booking contact details
- For full registration: delegate list
- For tickets only: ticket count
- Event information

**Server-Side Confirmation Page:**
```typescript
export default async function ConfirmationPage({
  params
}: {
  params: { slug: string; confirmationNumber: string }
}) {
  const supabase = await createClient();
  
  // Fetch registration details using confirmation number
  const { data: registration } = await supabase
    .from('registrations')
    .select(`
      *,
      attendees (*),
      tickets (*, event_tickets (*)),
      functions (*)
    `)
    .eq('confirmation_number', params.confirmationNumber)
    .eq('registration_type', 'individuals')
    .single();
    
  if (!registration) {
    notFound();
  }
  
  return (
    <ConfirmationLayout>
      <ConfirmationHeader 
        confirmationNumber={params.confirmationNumber}
        registrationType="individuals"
      />
      <AttendeeSummary attendees={registration.attendees} />
      <TicketDetails tickets={registration.tickets} />
      <EventInformation function={registration.functions} />
      <ActionButtons 
        onDownload={() => downloadConfirmation(registration)}
        onEmail={() => emailConfirmation(registration)}
      />
    </ConfirmationLayout>
  );
}
```

## Summary of Key Changes from Current System

### 1. Single Status Update - Webhook as Authority
**Current Problem:** Registration status is updated 3-4 times by different endpoints
**Solution:** ONLY the Stripe webhook updates status='completed'
**Impact:** Eliminates race conditions and ensures consistency

### 2. Removal of Redundant API Callbacks
**Current Problem:** Payment route makes unnecessary callbacks to registration endpoints
**Solution:** Delete lines 343-398 from `/api/registrations/[id]/payment/route.ts`
**Impact:** Reduces network overhead and duplicate processing

### 3. Enhanced Individuals Flow for All Types
**Current Problem:** Different registration types use different payment flows
**Solution:** Enhance `/api/registrations/individuals` to handle lodge and delegation
**Impact:** Single, consistent flow for all registration types

### 4. Unified Payment Service
**Current Problem:** Lodge route has incorrect fee calculation causing $16.73 overpayment
**Solution:** New `/api/payments/create-intent` endpoint with correct fee calculations
**Impact:** Connected accounts receive exact subtotal amount

### 5. Direct Edge Function Invocation
**Current Approach:** Direct invocation after payment completion
**Keep:** Maintain this pattern - it's working well
**Impact:** Reliable confirmation generation without webhook delays

### 6. Function-Based Metadata
**Current Problem:** Stripe metadata contains event_id and event_slug
**Solution:** Replace with functionId, functionName, functionSlug
**Impact:** Correct alignment with featured function architecture

## Success Metrics and KPIs

### Financial Accuracy
- **Metric:** Connected account transfer amounts
- **Target:** 100% accuracy - exact subtotal transferred
- **Current:** Lodge registrations overpay by $16.73
- **Measurement:** Compare transfer_data[amount] with registration subtotal

### System Efficiency
- **Metric:** Number of database updates per registration
- **Target:** 1 update (webhook only)
- **Current:** 3-4 updates
- **Measurement:** Database query logs

### Confirmation Generation
- **Metric:** Time from payment to confirmation number
- **Target:** < 5 seconds
- **Current:** Sometimes premature (race condition)
- **Measurement:** Timestamp comparison

### Registration Type Consistency
- **Metric:** Code paths for payment processing
- **Target:** 1 unified path
- **Current:** 3 different paths
- **Measurement:** Code coverage analysis

### Metadata Accuracy
- **Metric:** Stripe dashboard data completeness
- **Target:** 100% function information present
- **Current:** Missing or incorrect function details
- **Measurement:** Stripe API audit

## Detailed Migration Strategy

### Phase 1: Create Unified Payment Service (Week 1)
**Tasks:**
1. Implement `/api/payments/create-intent` endpoint
2. Integrate stripe-fee-calculator.ts
3. Build comprehensive metadata structure
4. Test with all registration types
5. Verify fee calculations

**Validation:**
- Unit tests for fee calculations
- Integration tests with Stripe test mode
- Manual verification of transfer amounts

### Phase 2: Enhance Individuals Flow (Week 2)
**Tasks:**
1. Add type detection to POST `/api/registrations/individuals`
2. Implement lodge branch (no attendees)
3. Implement delegation branches (tickets only vs full)
4. Update Zustand store capture for all types
5. Test entity creation for each type

**Validation:**
- Test data creation for each registration type
- Verify raw_registrations logging
- Check RPC function calls

### Phase 3: Clean Up Payment Route (Week 2)
**Tasks:**
1. Remove redundant callbacks (lines 343-398)
2. Remove status update logic (lines 310-341)
3. Update to use new payment endpoint
4. Test payment flow without updates

**Validation:**
- Verify no status updates from payment route
- Check webhook is sole updater
- Test with payment success and 3D Secure

### Phase 4: Update Frontend (Week 3)
**Tasks:**
1. Update payment component to use new endpoint
2. Implement confirmation polling
3. Add type-specific routing logic
4. Update confirmation pages
5. Test complete user journey

**Validation:**
- End-to-end testing for each type
- Verify confirmation page routing
- Test error scenarios

### Phase 5: Production Rollout (Week 4)
**Tasks:**
1. Deploy to staging environment
2. Run parallel testing with production
3. Monitor logs and metrics
4. Gradual rollout with feature flags
5. Full production deployment

**Post-Deployment:**
- Monitor Stripe dashboard for fee accuracy
- Check confirmation generation timing
- Verify no duplicate status updates
- Review error rates

## Comprehensive Testing Requirements

### Unit Tests
```typescript
describe('Unified Payment Service', () => {
  describe('Fee Calculations', () => {
    it('should transfer exact subtotal to connected account', () => {
      const result = calculateStripeFees(1150, { userCountry: 'AU' });
      expect(result.connectedAmount).toBe(1150);
      expect(result.customerPayment).toBeGreaterThan(1150);
    });
    
    it('should cap platform fee at maximum', () => {
      const result = calculateStripeFees(5000, { userCountry: 'AU' });
      expect(result.platformFee).toBe(20); // Capped
    });
  });
});
```

### Integration Tests
```typescript
describe('Registration Flow', () => {
  it('should handle lodge registration without attendees', async () => {
    const response = await request(app)
      .post('/api/registrations/individuals')
      .send({
        registrationType: 'lodge',
        lodgeDetails: { /* ... */ },
        tickets: [ /* ... */ ],
        // No attendees array
      });
      
    expect(response.status).toBe(200);
    expect(response.body.registrationType).toBe('lodge');
  });
});
```

### End-to-End Tests
1. Complete individual registration with payment
2. Complete lodge registration without attendees
3. Complete delegation with tickets only
4. Complete delegation with full registration
5. Test 3D Secure flow for each type
6. Test webhook processing and confirmation generation

## Security Considerations

### Authentication & Authorization
- Maintain existing auth checks in registration endpoint
- Verify user owns registration before payment
- Validate customer ID matches authenticated user

### Webhook Security
```typescript
// Mandatory signature verification
const sig = headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
```

### Idempotency
- Payment intents are idempotent by design
- Webhook processing must handle duplicate events
- Use registration ID as idempotency key

### Data Privacy
- No PII in Stripe metadata
- Use IDs instead of names where possible
- Secure storage of billing details

### Rate Limiting
- Implement rate limiting on payment endpoints
- Prevent abuse of polling endpoint
- Monitor for unusual patterns

## Future Enhancements

### Ticket Number Generation
**Current:** Using ticket UUIDs as fallback
**Future:** Implement server-side generation
- Format: `TKT-XXXXXX` or event-specific
- Edge function or database trigger
- Update tickets table with generated numbers

### Enhanced Reporting
- Stripe Connect reporting dashboard
- Fee reconciliation reports
- Registration analytics by type

### Additional Registration Types
The architecture supports adding new types:
- VIP registrations
- Sponsor registrations
- Staff registrations

### Multi-Currency Support
- Structure already supports currency field
- Would need fee calculation updates
- Stripe Connect supports multiple currencies

### Automated Testing
- Implement automated E2E tests in CI/CD
- Stripe webhook testing with ngrok
- Load testing for high-volume events

## Conclusion

This comprehensive enhancement of the individuals registration flow addresses critical issues in the current system while providing a solid foundation for future growth. The primary focus on fixing the Stripe Connect fee allocation ensures financial accuracy, while the consolidation of payment flows improves maintainability and reliability.

The solution maintains successful patterns from the current implementation while eliminating problematic redundancies and inconsistencies. By making the Stripe webhook the single source of truth for payment completion, we ensure data consistency and eliminate race conditions.

This is not a minor fix but a strategic improvement that will benefit both the platform's financial accuracy and the overall user experience.