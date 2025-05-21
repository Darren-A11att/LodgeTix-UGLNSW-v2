# Data Mapping Implementation for Order Submission

## Overview

This document outlines how to implement the data mapping between the client-side registration store and the existing Supabase database schema. Rather than creating new tables, we'll leverage the existing schema and focus on implementing the mapping logic correctly.

## Implementation Approach

Based on the existing schema analysis, we'll implement the following components:

1. **Data Transformation Utilities** - Functions to convert client state to database format
2. **Database Transaction Functions** - SQL functions to ensure data integrity
3. **API Route Integration** - Next.js API route to handle and validate submissions
4. **Client-Side Service** - Service to prepare and submit registration data

## 1. Data Transformation Utilities

Create a new file at `/lib/services/registration-mapper.ts`:

```typescript
import { v4 as uuidv4 } from 'uuid';
import type { UnifiedAttendeeData } from '@/shared/types/supabase';
import type { RegistrationType } from '@/lib/registration-types';

/**
 * Maps registration store data to database schema format for Supabase
 */
export function mapRegistrationToDatabase({
  registrationType,
  attendees,
  tickets,
  paymentStatus,
  agreeToTerms,
  event
}: {
  registrationType: RegistrationType;
  attendees: UnifiedAttendeeData[];
  tickets: any;
  paymentStatus: {
    status: string;
    paymentIntentId: string;
    amount: number;
  };
  agreeToTerms: boolean;
  event: any;
}) {
  // Generate a new registration ID
  const registrationId = uuidv4();
  
  // Find primary attendee
  const primaryAttendee = attendees.find(a => a.isPrimary);
  if (!primaryAttendee) {
    throw new Error('No primary attendee found');
  }
  
  // Map registration type to enum value
  const dbRegistrationType = mapRegistrationType(registrationType);
  
  // Prepare registration data
  const registrationData = {
    registrationId,
    registrationDate: new Date().toISOString(),
    status: 'completed',
    totalAmountPaid: paymentStatus.amount,
    totalPricePaid: tickets.total,
    paymentStatus: 'completed',
    agreeToTerms,
    stripePaymentIntentId: paymentStatus.paymentIntentId,
    primaryAttendeeId: primaryAttendee.attendeeId,
    registrationType: dbRegistrationType,
    eventId: event.id
  };
  
  // Map attendees
  const attendeesData = attendees.map(attendee => ({
    attendeeid: attendee.attendeeId,
    registrationid: registrationId,
    attendeetype: attendee.attendeeType,
    person_id: null, // Not used in client state, would be created or linked later
    isPartner: attendee.isPartner,
    title: attendee.title,
    firstName: attendee.firstName,
    lastName: attendee.lastName,
    lodgeNameNumber: attendee.lodgeNameNumber,
    primaryEmail: attendee.primaryEmail,
    primaryPhone: attendee.primaryPhone,
    dietaryRequirements: attendee.dietaryRequirements,
    specialNeeds: attendee.specialNeeds,
    contactPreference: attendee.contactPreference,
    contactConfirmed: attendee.contactConfirmed,
    isCheckedIn: false, // Default to false for new registrations
    firstTime: attendee.firstTime,
    rank: attendee.rank,
    postNominals: attendee.postNominals,
    grandLodgeId: attendee.grandLodgeId,
    lodgeId: attendee.lodgeId,
    relationship: attendee.relationship,
    partnerOf: attendee.partnerOf,
    guestOfId: attendee.guestOfId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  
  // Map ticket assignments
  const ticketAssignments = Object.entries(tickets.ticketAssignments || {})
    .map(([attendeeId, ticketDefId]) => ({
      id: uuidv4(),
      registration_id: registrationId,
      attendee_id: attendeeId,
      ticket_definition_id: ticketDefId,
      price_at_assignment: getTicketPrice(tickets, attendeeId),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  
  // Map VAS items if any
  const vasItems = (tickets.vasItems || []).map((item: any) => ({
    id: uuidv4(),
    registration_id: registrationId,
    vas_id: item.id,
    quantity: item.quantity,
    price_at_purchase: item.price,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  // Prepare customer data from primary attendee
  const customerData = {
    firstName: primaryAttendee.firstName,
    lastName: primaryAttendee.lastName,
    email: primaryAttendee.primaryEmail,
    phone: primaryAttendee.primaryPhone,
    // Add other customer fields as needed
  };
  
  return {
    registrationId,
    registrationData,
    attendeesData,
    ticketAssignments,
    vasItems,
    customerData
  };
}

/**
 * Maps client registration type to database enum value
 */
function mapRegistrationType(type: RegistrationType): string {
  const mapping: Record<string, string> = {
    'individual': 'Individuals',
    'lodge': 'Groups',
    'delegation': 'Officials'
  };
  return mapping[type] || 'Individuals';
}

/**
 * Gets the price for a specific ticket
 */
function getTicketPrice(tickets: any, attendeeId: string): number {
  // If tickets have individual prices, use those
  if (tickets.prices && tickets.prices[attendeeId]) {
    return tickets.prices[attendeeId];
  }
  
  // Otherwise estimate from total (fallback)
  const assignmentCount = Object.keys(tickets.ticketAssignments || {}).length;
  return assignmentCount > 0 ? tickets.total / assignmentCount : 0;
}
```

## 2. Database Transaction Functions

Create a new migration file at `/supabase/migrations/20250523-registration-transaction-functions.sql`:

```sql
-- Add transaction management functions if they don't exist

-- Begin transaction function
CREATE OR REPLACE FUNCTION public.begin_transaction()
RETURNS json LANGUAGE plpgsql AS $$
BEGIN
  BEGIN;
  RETURN json_build_object('status', 'transaction_started');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Commit transaction function
CREATE OR REPLACE FUNCTION public.commit_transaction()
RETURNS json LANGUAGE plpgsql AS $$
BEGIN
  COMMIT;
  RETURN json_build_object('status', 'transaction_committed');
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Rollback transaction function
CREATE OR REPLACE FUNCTION public.rollback_transaction()
RETURNS json LANGUAGE plpgsql AS $$
BEGIN
  ROLLBACK;
  RETURN json_build_object('status', 'transaction_rolled_back');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Helper function to find or create a customer
CREATE OR REPLACE FUNCTION public.find_or_create_customer(
  p_email TEXT,
  p_firstName TEXT,
  p_lastName TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Check if customer exists
  SELECT id INTO v_customer_id
  FROM public."Customers"
  WHERE email = p_email
  LIMIT 1;
  
  -- If customer found, return the ID
  IF v_customer_id IS NOT NULL THEN
    RETURN v_customer_id;
  END IF;
  
  -- Otherwise create a new customer
  v_customer_id := uuid_generate_v4();
  
  INSERT INTO public."Customers" (
    id,
    firstName,
    lastName,
    email,
    phone,
    createdAt,
    updatedAt
  ) VALUES (
    v_customer_id,
    p_firstName,
    p_lastName,
    p_email,
    p_phone,
    NOW(),
    NOW()
  );
  
  RETURN v_customer_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating customer: %', SQLERRM;
END;
$$;
```

## 3. API Route Implementation

Create a new API route at `/app/api/registrations/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { mapRegistrationToDatabase } from '@/lib/services/registration-mapper';
import { logger } from '@/lib/api-logger';

// Input validation schema
const registrationSubmissionSchema = z.object({
  attendees: z.array(
    z.object({
      attendeeId: z.string().uuid(),
      attendeeType: z.string(),
      isPrimary: z.boolean(),
      isPartner: z.string().uuid().nullable().optional(),
      title: z.string().optional(),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      // Add validation for other attendee fields
    })
  ).min(1, 'At least one attendee is required'),
  
  tickets: z.object({
    total: z.number().min(0),
    subtotal: z.number().min(0).optional(),
    ticketAssignments: z.record(z.string(), z.string()),
    // Optional fields
    bookingFee: z.number().min(0).optional(),
    vasItems: z.array(
      z.object({
        id: z.string(),
        quantity: z.number().int().min(1),
        price: z.number().min(0)
      })
    ).optional()
  }),
  
  event: z.object({
    id: z.string().uuid(),
    name: z.string(),
    // Other event fields optional
  }),
  
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  amount: z.number().min(0),
  registrationType: z.enum(['individual', 'lodge', 'delegation']),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();
  
  logger.info({
    requestId,
    message: 'Registration submission received',
    endpoint: '/api/registrations'
  });
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registrationSubmissionSchema.safeParse(body);
    
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
    
    const validatedData = validationResult.data;
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Map client data to database schema
    const {
      registrationId,
      registrationData,
      attendeesData,
      ticketAssignments,
      vasItems,
      customerData
    } = mapRegistrationToDatabase(validatedData);
    
    // Begin transaction
    const { error: txError } = await supabase.rpc('begin_transaction');
    
    if (txError) {
      logger.error({
        requestId,
        message: 'Failed to start transaction',
        error: txError
      });
      
      return NextResponse.json({
        success: false,
        error: 'Failed to start transaction'
      }, { status: 500 });
    }
    
    try {
      // Step 1: Find or create customer
      const { data: findCustomerResult, error: customerError } = await supabase.rpc(
        'find_or_create_customer',
        {
          p_email: customerData.email,
          p_firstName: customerData.firstName,
          p_lastName: customerData.lastName,
          p_phone: customerData.phone
        }
      );
      
      if (customerError) {
        throw new Error(`Failed to process customer: ${customerError.message}`);
      }
      
      const customerId = findCustomerResult;
      
      // Step 2: Create registration record
      const { error: regError } = await supabase
        .from('Registrations')
        .insert({
          ...registrationData,
          customerId
        });
      
      if (regError) {
        throw new Error(`Failed to create registration: ${regError.message}`);
      }
      
      // Step 3: Create attendee records
      for (const attendee of attendeesData) {
        const { error: attError } = await supabase
          .from('Attendees')
          .insert(attendee);
        
        if (attError) {
          throw new Error(`Failed to create attendee: ${attError.message}`);
        }
      }
      
      // Step 4: Create ticket assignments
      for (const assignment of ticketAssignments) {
        const { error: ticketError } = await supabase
          .from('attendee_ticket_assignments')
          .insert(assignment);
        
        if (ticketError) {
          throw new Error(`Failed to create ticket assignment: ${ticketError.message}`);
        }
      }
      
      // Step 5: Create VAS records if any
      if (vasItems.length > 0) {
        for (const vasItem of vasItems) {
          const { error: vasError } = await supabase
            .from('registration_vas')
            .insert(vasItem);
          
          if (vasError) {
            throw new Error(`Failed to create VAS item: ${vasError.message}`);
          }
        }
      }
      
      // Generate confirmation number
      const confirmationNumber = generateConfirmationNumber();
      
      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      
      if (commitError) {
        throw new Error(`Failed to commit transaction: ${commitError.message}`);
      }
      
      const duration = performance.now() - startTime;
      
      logger.info({
        requestId,
        message: 'Registration completed successfully',
        registrationId,
        confirmationNumber,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return NextResponse.json({
        success: true,
        registrationId,
        confirmationNumber
      });
    } catch (error) {
      // Rollback transaction
      await supabase.rpc('rollback_transaction');
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error({
        requestId,
        message: 'Registration processing failed',
        error: errorMessage,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      
      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 500 });
    }
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

// Helper function to generate a confirmation number
function generateConfirmationNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LT-${timestamp}-${random}`;
}
```

## 4. Client-Side Service Implementation

Create a new service at `/lib/services/registration-service.ts`:

```typescript
import type { UnifiedAttendeeData } from '@/shared/types/supabase';
import type { RegistrationType } from '@/lib/registration-types';

// API endpoint
const REGISTRATION_ENDPOINT = '/api/registrations';

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

/**
 * Error class for registration submission failures
 */
export class RegistrationSubmissionError extends Error {
  public details?: Record<string, any>;
  
  constructor(message: string, details?: Record<string, any>) {
    super(message);
    this.name = 'RegistrationSubmissionError';
    this.details = details;
  }
}

/**
 * Interface for registration submission data
 */
export interface RegistrationSubmissionData {
  attendees: UnifiedAttendeeData[];
  tickets: {
    total: number;
    subtotal?: number;
    bookingFee?: number;
    ticketAssignments: Record<string, string>;
    vasItems?: Array<{
      id: string;
      quantity: number;
      price: number;
    }>;
  };
  event: {
    id: string;
    name: string;
    [key: string]: any;
  };
  paymentIntentId: string;
  amount: number;
  registrationType: RegistrationType;
  agreeToTerms: boolean;
}

/**
 * Interface for registration submission response
 */
export interface RegistrationSubmissionResponse {
  success: boolean;
  registrationId: string;
  confirmationNumber: string;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Client-side validation of registration data
 */
export function validateRegistrationData(data: RegistrationSubmissionData): void {
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
  
  // Ensure we have event data
  if (!data.event || !data.event.id) {
    throw new RegistrationSubmissionError('Event information is missing');
  }
  
  // Ensure tickets are assigned
  if (!data.tickets || !data.tickets.ticketAssignments || Object.keys(data.tickets.ticketAssignments).length === 0) {
    throw new RegistrationSubmissionError('Ticket information is missing');
  }
  
  // Ensure terms are agreed to
  if (!data.agreeToTerms) {
    throw new RegistrationSubmissionError('Terms and conditions must be accepted');
  }
}

/**
 * Submit registration data to the API
 */
export async function submitRegistration(
  data: RegistrationSubmissionData,
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
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    // Attempt submission with retries
    return await withRetry(
      async () => {
        const response = await fetch(REGISTRATION_ENDPOINT, {
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

/**
 * Helper for retrying operations
 */
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

/**
 * Determine if an error is retryable
 */
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

## 5. Update Payment Step Component

Update `/components/register/RegistrationWizard/Steps/PaymentStepUpdated.tsx` to use the registration service:

```typescript
// Import new registration service
import { submitRegistration } from '@/lib/services/registration-service';

// In the handlePaymentSuccess callback function
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
      tickets: {
        total: tickets?.total || 0,
        subtotal: tickets?.subtotal,
        bookingFee: tickets?.bookingFee,
        ticketAssignments: tickets?.ticketAssignments || {},
        vasItems: tickets?.vasItems
      },
      event: {
        id: event?.id,
        name: event?.name,
        ...event
      },
      paymentIntentId,
      amount: total,
      registrationType: useRegistrationStore.getState().registrationType!,
      agreeToTerms: useRegistrationStore.getState().agreeToTerms
    };
    
    // Submit registration
    const result = await submitRegistration(submissionData);
    
    // Store confirmation number and registration ID
    useRegistrationStore.getState().setConfirmationNumber(result.confirmationNumber);
    
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

## 6. Update Confirmation Step Component

Update `/components/register/RegistrationWizard/Steps/ConfirmationStepUpdated.tsx` to display the confirmation number:

```typescript
// In the component's properties and state
const { 
  attendees,
  tickets,
  event,
  registrationType,
  paymentStatus,
  clearRegistration,
  confirmationNumber  // Add this from the store
} = useRegistrationStore();

// Update the Badge display
<Badge variant="success" className="text-lg px-4 py-2">
  Confirmation: {confirmationNumber || registrationId || 'REG-' + Date.now()}
</Badge>
```

## Conclusion

By implementing these components, we'll successfully integrate the registration process with the existing Supabase schema. This approach:

1. **Reuses the existing database schema** - No new tables or structural changes needed
2. **Leverages proper data mapping** - Transforms client state to database format
3. **Ensures data integrity** - Uses transactions for ACID compliance
4. **Provides robust error handling** - Client and server validation with clear error messages
5. **Supports retries and recovery** - For network issues and transient errors

The implementation focuses on adapting to the existing structure while providing a reliable registration submission process.