# Implementation Plan for Order Submission to Supabase

## Overview

This document outlines the step-by-step implementation plan for integrating the order submission process with Supabase. The plan is structured to ensure a systematic, testable, and maintainable approach to the implementation.

## Phase 1: Database Preparation

### Step 1: Verify Database Schema

- Confirm that the required tables exist:
  - `Registrations`
  - `Attendees`
  - `attendee_ticket_assignments`
  - `registration_vas`
- Verify the column types, constraints, and relationships
- Ensure necessary indexes are in place for performance

### Step 2: Create Transaction Management Functions

- Create the following PostgreSQL functions in Supabase:
  - `begin_transaction()`
  - `commit_transaction()`
  - `rollback_transaction()`
- Add these via SQL migration or Supabase dashboard

### Step 3: Create Stored Procedures (Optional)

- Consider implementing the `create_complete_registration` stored procedure for optimized transaction handling
- If implemented, create appropriate test cases

## Phase 2: API Implementation

### Step 1: Create Type Definitions

Create a new file at `/lib/api/registration-types.ts`:

```typescript
// Model the request and response types for the registration API
export interface RegistrationSubmissionRequest {
  attendees: UnifiedAttendeeData[];
  tickets: {
    total: number;
    subtotal: number;
    bookingFee?: number;
    ticketAssignments: Record<string, string>; // attendeeId -> ticketDefinitionId
  };
  event: {
    id: string;
    name: string;
    // Other event properties needed
  };
  paymentIntentId: string;
  amount: number;
  registrationType: 'individual' | 'lodge' | 'delegation';
  agreeToTerms: boolean;
  vasItems?: Array<{
    id: string;
    quantity: number;
    price: number;
  }>;
}

export interface RegistrationSubmissionResponse {
  success: boolean;
  registrationId: string;
  confirmationNumber: string;
  error?: string;
  details?: Record<string, any>;
}
```

### Step 2: Create Validation Schema

Create a new file at `/lib/api/registration-validation.ts`:

```typescript
import { z } from 'zod';

// Define the validation schema for registration submissions
export const registrationSubmissionSchema = z.object({
  attendees: z.array(
    z.object({
      attendeeId: z.string().uuid(),
      attendeeType: z.string(),
      isPrimary: z.boolean(),
      isPartner: z.string().uuid().nullable(),
      title: z.string(),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      // Add all other attendee fields with appropriate validation
    })
  ).min(1, 'At least one attendee is required'),
  
  tickets: z.object({
    total: z.number().min(0),
    subtotal: z.number().min(0),
    bookingFee: z.number().min(0).optional(),
    ticketAssignments: z.record(z.string(), z.string())
  }),
  
  event: z.object({
    id: z.string().uuid(),
    name: z.string(),
    // Other event fields
  }),
  
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  amount: z.number().min(0),
  registrationType: z.enum(['individual', 'lodge', 'delegation']),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  
  vasItems: z.array(
    z.object({
      id: z.string().uuid(),
      quantity: z.number().int().min(1),
      price: z.number().min(0)
    })
  ).optional()
});

// Export a helper function to validate the data
export function validateRegistrationSubmission(data: unknown) {
  return registrationSubmissionSchema.safeParse(data);
}
```

### Step 3: Create API Route

Create the file at `/app/api/registrations/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { validateRegistrationSubmission } from '@/lib/api/registration-validation';
import { logger } from '@/lib/api-logger';
import type { RegistrationSubmissionRequest, RegistrationSubmissionResponse } from '@/lib/api/registration-types';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();
  
  logger.info({
    requestId,
    message: 'Registration submission received',
    endpoint: '/api/registrations'
  });
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate the data
    const validationResult = validateRegistrationSubmission(body);
    
    if (!validationResult.success) {
      logger.warn({
        requestId,
        message: 'Validation failed',
        errors: validationResult.error.format()
      });
      
      return NextResponse.json({
        success: false,
        error: 'Invalid registration data',
        details: validationResult.error.format()
      }, { status: 400 });
    }
    
    const validatedData = validationResult.data as RegistrationSubmissionRequest;
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Process the registration
    const result = await processRegistration(supabase, validatedData, requestId);
    
    const duration = performance.now() - startTime;
    
    if (!result.success) {
      logger.error({
        requestId,
        message: 'Registration processing failed',
        error: result.error,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
    
    logger.info({
      requestId,
      message: 'Registration processed successfully',
      registrationId: result.registrationId,
      duration: `${duration.toFixed(2)}ms`
    });
    
    return NextResponse.json({
      success: true,
      registrationId: result.registrationId,
      confirmationNumber: result.confirmationNumber
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error({
      requestId,
      message: 'Unexpected error processing registration',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration.toFixed(2)}ms`
    });
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// Helper function to process the registration
async function processRegistration(
  supabase: any, 
  data: RegistrationSubmissionRequest,
  requestId: string
): Promise<RegistrationSubmissionResponse & { error?: string }> {
  // Begin transaction
  const { error: txError } = await supabase.rpc('begin_transaction');
  
  if (txError) {
    return { 
      success: false, 
      error: `Failed to start transaction: ${txError.message}`,
      registrationId: '',
      confirmationNumber: '' 
    };
  }
  
  try {
    // Generate IDs and confirmation number
    const registrationId = uuidv4();
    const confirmationNumber = generateConfirmationNumber();
    
    // Find primary attendee
    const primaryAttendee = data.attendees.find(a => a.isPrimary);
    if (!primaryAttendee) {
      throw new Error('No primary attendee found');
    }
    
    // Step 1: Get or create customer
    const { data: customer, error: customerError } = await getOrCreateCustomer(supabase, primaryAttendee);
    
    if (customerError) {
      throw new Error(`Failed to process customer: ${customerError.message}`);
    }
    
    // Step 2: Create registration record
    const { error: regError } = await supabase
      .from('Registrations')
      .insert({
        registrationId: registrationId,
        customerId: customer.id,
        eventId: data.event.id,
        registrationDate: new Date().toISOString(),
        status: 'completed',
        totalAmountPaid: data.amount,
        totalPricePaid: data.tickets.total,
        paymentStatus: 'completed',
        agreeToTerms: data.agreeToTerms,
        stripePaymentIntentId: data.paymentIntentId,
        primaryAttendeeId: primaryAttendee.attendeeId,
        registrationType: mapRegistrationType(data.registrationType)
      });
    
    if (regError) {
      throw new Error(`Failed to create registration: ${regError.message}`);
    }
    
    // Step 3: Create attendee records
    for (const attendee of data.attendees) {
      const { error: attError } = await supabase
        .from('Attendees')
        .insert({
          attendeeid: attendee.attendeeId,
          registrationid: registrationId,
          attendeetype: attendee.attendeeType,
          // Map all other attendee fields
          title: attendee.title,
          firstName: attendee.firstName,
          lastName: attendee.lastName,
          // ... other fields
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      
      if (attError) {
        throw new Error(`Failed to create attendee: ${attError.message}`);
      }
    }
    
    // Step 4: Create ticket assignments
    for (const [attendeeId, ticketDefId] of Object.entries(data.tickets.ticketAssignments)) {
      const { error: ticketError } = await supabase
        .from('attendee_ticket_assignments')
        .insert({
          id: uuidv4(),
          registration_id: registrationId,
          attendee_id: attendeeId,
          ticket_definition_id: ticketDefId,
          price_at_assignment: getTicketPrice(data, attendeeId)
        });
      
      if (ticketError) {
        throw new Error(`Failed to create ticket assignment: ${ticketError.message}`);
      }
    }
    
    // Step 5: Create VAS records if any
    if (data.vasItems && data.vasItems.length > 0) {
      for (const vasItem of data.vasItems) {
        const { error: vasError } = await supabase
          .from('registration_vas')
          .insert({
            id: uuidv4(),
            registration_id: registrationId,
            vas_id: vasItem.id,
            quantity: vasItem.quantity,
            price_at_purchase: vasItem.price
          });
        
        if (vasError) {
          throw new Error(`Failed to create VAS item: ${vasError.message}`);
        }
      }
    }
    
    // Commit transaction
    const { error: commitError } = await supabase.rpc('commit_transaction');
    
    if (commitError) {
      throw new Error(`Failed to commit transaction: ${commitError.message}`);
    }
    
    return {
      success: true,
      registrationId,
      confirmationNumber
    };
  } catch (error) {
    // Rollback transaction
    await supabase.rpc('rollback_transaction');
    
    logger.error({
      requestId,
      message: 'Transaction rolled back',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      registrationId: '',
      confirmationNumber: ''
    };
  }
}

// Helper functions
function generateConfirmationNumber(): string {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LT-${timestamp}-${random}`;
}

function mapRegistrationType(type: string): string {
  const mapping: Record<string, string> = {
    'individual': 'Individuals',
    'lodge': 'Groups',
    'delegation': 'Officials'
  };
  return mapping[type] || 'Individuals';
}

async function getOrCreateCustomer(supabase: any, primaryAttendee: any) {
  // Check if customer exists
  const { data: existingCustomers, error: lookupError } = await supabase
    .from('Customers')
    .select('*')
    .eq('email', primaryAttendee.primaryEmail)
    .limit(1);
  
  if (lookupError) {
    return { error: lookupError };
  }
  
  if (existingCustomers && existingCustomers.length > 0) {
    return { data: existingCustomers[0] };
  }
  
  // Create new customer
  const customerId = uuidv4();
  const { data: newCustomer, error: createError } = await supabase
    .from('Customers')
    .insert({
      id: customerId,
      firstName: primaryAttendee.firstName,
      lastName: primaryAttendee.lastName,
      email: primaryAttendee.primaryEmail,
      phone: primaryAttendee.primaryPhone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .select()
    .single();
  
  if (createError) {
    return { error: createError };
  }
  
  return { data: newCustomer };
}

function getTicketPrice(data: RegistrationSubmissionRequest, attendeeId: string): number {
  // If we have direct pricing, use it
  // Otherwise estimate from total
  // This is a placeholder - implement based on actual data structure
  return data.tickets.total / Object.keys(data.tickets.ticketAssignments).length;
}
```

## Phase 3: Client-Side Integration

### Step 1: Create Registration Service

Create a new file at `/lib/services/registration-service.ts`:

```typescript
import type { UnifiedAttendeeData } from '@/shared/types/supabase';
import type { RegistrationSubmissionRequest, RegistrationSubmissionResponse } from '@/lib/api/registration-types';

const API_ENDPOINT = '/api/registrations';

export class RegistrationSubmissionError extends Error {
  public details?: Record<string, any>;
  
  constructor(message: string, details?: Record<string, any>) {
    super(message);
    this.name = 'RegistrationSubmissionError';
    this.details = details;
  }
}

export async function submitRegistration(
  data: RegistrationSubmissionRequest,
  options: {
    retryCount?: number;
    retryDelay?: number;
  } = {}
): Promise<RegistrationSubmissionResponse> {
  const { retryCount = 3, retryDelay = 1000 } = options;
  
  // Client-side validation
  validateRegistrationData(data);
  
  // Set up fetch controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    // Attempt submission with retries
    return await withRetry(
      async () => {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new RegistrationSubmissionError(
            responseData.error || `Server error: ${response.status}`,
            responseData.details
          );
        }
        
        return responseData as RegistrationSubmissionResponse;
      },
      retryCount,
      retryDelay
    );
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new RegistrationSubmissionError('Registration request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper for client-side validation
function validateRegistrationData(data: RegistrationSubmissionRequest): void {
  // Ensure primary attendee exists
  if (!data.attendees.some(a => a.isPrimary)) {
    throw new RegistrationSubmissionError('No primary attendee specified');
  }
  
  // Ensure all attendees have required fields
  for (const attendee of data.attendees) {
    if (!attendee.firstName || !attendee.lastName) {
      throw new RegistrationSubmissionError('All attendees must have a name');
    }
    
    if (attendee.isPrimary && !attendee.primaryEmail) {
      throw new RegistrationSubmissionError('Primary attendee must have an email');
    }
  }
  
  // Ensure we have payment data
  if (!data.paymentIntentId || !data.amount) {
    throw new RegistrationSubmissionError('Payment information is missing');
  }
  
  // Ensure tickets are assigned
  if (!data.tickets || !data.tickets.ticketAssignments) {
    throw new RegistrationSubmissionError('Ticket information is missing');
  }
}

// Helper for retrying operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  delay: number
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Only retry for network errors, not validation errors
      if (
        error instanceof RegistrationSubmissionError ||
        !isRetryableError(error) ||
        attempt >= maxRetries
      ) {
        throw error;
      }
      
      lastError = error;
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  // Should never get here, but TypeScript needs it
  throw lastError || new Error('Unknown error during retry');
}

// Determine if an error is retryable
function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Server errors (5xx) are retryable
  if (error instanceof RegistrationSubmissionError && error.message.includes('Server error: 5')) {
    return true;
  }
  
  return false;
}
```

### Step 2: Update Payment Step Component

Update `/components/register/RegistrationWizard/Steps/PaymentStepUpdated.tsx`:

```typescript
import { submitRegistration } from '@/lib/services/registration-service';

// In the component
const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
  setIsSubmitting(true);
  
  try {
    // Update payment status in store
    setPaymentStatus({
      status: 'completed',
      paymentIntentId,
      amount: total,
      timestamp: new Date().toISOString(),
    });
    
    // Prepare submission data
    const submissionData = {
      attendees,
      tickets,
      event,
      paymentIntentId,
      amount: total,
      registrationType: useRegistrationStore.getState().registrationType!,
      agreeToTerms: useRegistrationStore.getState().agreeToTerms
    };
    
    // Submit registration
    const result = await submitRegistration(submissionData);
    
    // Store confirmation number and registration ID
    if (result.confirmationNumber) {
      useRegistrationStore.getState().setConfirmationNumber(result.confirmationNumber);
    }
    
    setPaymentSuccess(true);
    
    // Navigate to confirmation after a short delay
    setTimeout(() => {
      onNext();
    }, 1500);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save registration';
    setPaymentError(message);
    
    // Also update store with error
    setPaymentStatus({
      status: 'failed',
      error: message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    setIsSubmitting(false);
  }
}, [attendees, tickets, event, total, setPaymentStatus, onNext]);
```

### Step 3: Update Confirmation Step

Update `/components/register/RegistrationWizard/Steps/ConfirmationStepUpdated.tsx`:

```typescript
// In the component's properties and state
const { 
  attendees,
  tickets,
  event,
  registrationType,
  paymentStatus,
  clearRegistration,
  confirmationNumber  // Added this
} = useRegistrationStore();

// Update the Badge display
<Badge variant="success" className="text-lg px-4 py-2">
  Confirmation: {confirmationNumber || registrationId || 'REG-' + Date.now()}
</Badge>
```

## Phase 4: Testing and Validation

### Step 1: Create Unit Tests for Validation

Create tests for the validation functions in `/lib/api/registration-validation.test.ts`

### Step 2: Create Mock API for Testing

Create a mock API for development testing

### Step 3: Integration Testing

Test the complete flow from payment to confirmation

### Step 4: Error Handling Testing

Test different error scenarios and recovery mechanisms

## Phase 5: Deployment and Monitoring

### Step 1: Database Migrations

Create proper migration files for production deployment

### Step 2: Monitoring Setup

Set up logging and monitoring for registrations

### Step 3: Performance Testing

Test with realistic load to ensure performance

### Step 4: Gradual Rollout

Consider a phased rollout strategy:
1. Developer testing
2. Internal users
3. Limited external users
4. Full production

## Implementation Timeline

| Phase | Task | Estimated Duration | Dependencies |
|-------|------|-------------------|--------------|
| 1 | Database Preparation | 2 days | None |
| 2 | API Implementation | 3 days | Phase 1 |
| 3 | Client-Side Integration | 2 days | Phase 2 |
| 4 | Testing and Validation | 3 days | Phase 3 |
| 5 | Deployment and Monitoring | 2 days | Phase 4 |

Total estimated time: 12 working days

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Database schema incompatibility | High | Low | Thorough schema verification before implementation |
| Transaction failures | High | Medium | Robust error handling and recovery mechanisms |
| Performance issues | Medium | Medium | Performance testing and optimization |
| Data inconsistency | High | Low | Transaction-based approach ensures consistency |
| Stripe integration issues | High | Low | Thorough testing of payment flow |

## Success Criteria

The implementation will be considered successful when:

1. Users can complete the registration process end-to-end
2. All data is correctly stored in Supabase
3. Confirmation details are properly displayed
4. System handles errors gracefully
5. Performance metrics are within acceptable ranges