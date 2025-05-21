# API Route Implementation Plan

## Overview

This document outlines the implementation of the `/api/registrations` route that will handle order submissions to Supabase. This API endpoint will receive registration data from the client, process it, and store it in the Supabase database.

## Route Location

Create a new API route at:
```
/app/api/registrations/route.ts
```

## Request Handler Structure

The route will implement a POST handler to process registration submissions:

```typescript
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Validation schema will be defined here

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    
    // Validate input
    const validatedData = registrationSchema.parse(body);
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Process registration in a transaction
    const { data, error } = await processRegistration(supabase, validatedData);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true,
      registrationId: data.registrationId,
      confirmationNumber: data.confirmationNumber
    });
  } catch (error) {
    console.error('Error processing registration:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid registration data', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to process registration' 
    }, { status: 500 });
  }
}
```

## Input Validation Schema

We'll use Zod to validate the input data:

```typescript
const registrationSchema = z.object({
  attendees: z.array(
    z.object({
      attendeeId: z.string().uuid(),
      attendeeType: z.enum(['Mason', 'Guest']),
      isPrimary: z.boolean(),
      isPartner: z.string().uuid().nullable(),
      title: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      // ... other attendee fields
    })
  ),
  tickets: z.object({
    total: z.number(),
    subtotal: z.number(),
    bookingFee: z.number().optional(),
    ticketAssignments: z.record(z.string(), z.string())
  }),
  event: z.object({
    id: z.string().uuid(),
    name: z.string(),
    // ... other event fields
  }),
  paymentIntentId: z.string(),
  amount: z.number(),
  registrationType: z.enum(['individual', 'lodge', 'delegation'])
});
```

## Transaction Processing

The core of our implementation will be the `processRegistration` function that handles the transaction:

```typescript
async function processRegistration(supabase, data) {
  // Start a transaction
  const { data: transaction, error: txError } = await supabase.rpc('begin_transaction');
  
  if (txError) {
    return { error: txError };
  }
  
  try {
    // Generate registration ID and confirmation number
    const registrationId = uuidv4();
    const confirmationNumber = generateConfirmationNumber();
    
    // Find primary attendee
    const primaryAttendee = data.attendees.find(a => a.isPrimary);
    if (!primaryAttendee) {
      throw new Error('No primary attendee found');
    }
    
    // 1. Create or get customer record
    const customer = await getOrCreateCustomer(supabase, primaryAttendee);
    
    // 2. Create registration record
    const { error: regError } = await supabase
      .from('Registrations')
      .insert({
        registrationId,
        customerId: customer.id,
        eventId: data.event.id,
        registrationDate: new Date().toISOString(),
        status: 'completed',
        totalAmountPaid: data.amount,
        totalPricePaid: data.tickets.total,
        paymentStatus: 'completed',
        agreeToTerms: true,
        stripePaymentIntentId: data.paymentIntentId,
        primaryAttendeeId: primaryAttendee.attendeeId,
        registrationType: mapRegistrationType(data.registrationType),
      });
    
    if (regError) {
      throw regError;
    }
    
    // 3. Create attendee records
    for (const attendee of data.attendees) {
      const { error: attError } = await supabase
        .from('Attendees')
        .insert({
          // Map attendee data to database schema
          attendeeid: attendee.attendeeId,
          registrationid: registrationId,
          // ... other fields
        });
      
      if (attError) {
        throw attError;
      }
      
      // 4. Create ticket assignments
      if (data.tickets.ticketAssignments[attendee.attendeeId]) {
        const { error: ticketError } = await supabase
          .from('attendee_ticket_assignments')
          .insert({
            id: uuidv4(),
            registration_id: registrationId,
            attendee_id: attendee.attendeeId,
            ticket_definition_id: data.tickets.ticketAssignments[attendee.attendeeId],
            price_at_assignment: getPriceForTicket(data, attendee.attendeeId)
          });
        
        if (ticketError) {
          throw ticketError;
        }
      }
    }
    
    // 5. Create VAS records if applicable
    if (data.vas && data.vas.length > 0) {
      for (const vas of data.vas) {
        const { error: vasError } = await supabase
          .from('registration_vas')
          .insert({
            id: uuidv4(),
            registration_id: registrationId,
            vas_id: vas.id,
            quantity: vas.quantity,
            price_at_purchase: vas.price
          });
        
        if (vasError) {
          throw vasError;
        }
      }
    }
    
    // Commit the transaction
    await supabase.rpc('commit_transaction');
    
    return { 
      data: { 
        registrationId,
        confirmationNumber
      }
    };
  } catch (error) {
    // Rollback the transaction on error
    await supabase.rpc('rollback_transaction');
    return { error };
  }
}
```

## Helper Functions

Several helper functions will be needed:

```typescript
// Generate a human-readable confirmation number
function generateConfirmationNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LT-${timestamp}-${random}`;
}

// Map registration type to database enum
function mapRegistrationType(type) {
  const mapping = {
    'individual': 'Individuals',
    'lodge': 'Groups',
    'delegation': 'Officials'
  };
  return mapping[type] || 'Individuals';
}

// Get or create a customer record
async function getOrCreateCustomer(supabase, primaryAttendee) {
  // Check if customer exists by email
  const { data: existingCustomers } = await supabase
    .from('Customers')
    .select('*')
    .eq('email', primaryAttendee.primaryEmail)
    .limit(1);
  
  if (existingCustomers && existingCustomers.length > 0) {
    return existingCustomers[0];
  }
  
  // Create new customer if not found
  const customerId = uuidv4();
  const { data, error } = await supabase
    .from('Customers')
    .insert({
      id: customerId,
      firstName: primaryAttendee.firstName,
      lastName: primaryAttendee.lastName,
      email: primaryAttendee.primaryEmail,
      phone: primaryAttendee.primaryPhone,
      // Add other customer fields as needed
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

// Get price for a ticket
function getPriceForTicket(data, attendeeId) {
  // Implementation depends on how ticket prices are stored
  // This is a placeholder
  return data.tickets.total / Object.keys(data.tickets.ticketAssignments).length;
}
```

## Error Handling and Logging

Comprehensive error handling is crucial for this endpoint:

1. Input validation errors will return 400 Bad Request with details
2. Database errors will be caught and logged
3. Transaction failures will be rolled back automatically
4. Unexpected errors will return 500 Internal Server Error

## Security Considerations

1. Ensure authentication is properly implemented for organizer-only endpoints
2. Validate all input data thoroughly
3. Use parameterized queries to prevent SQL injection
4. Implement rate limiting to prevent abuse
5. Log all registration attempts for audit purposes

## Testing Strategy

1. Unit tests for input validation
2. Integration tests for database interactions
3. End-to-end tests for the complete registration flow
4. Mock Stripe payment intents for testing
5. Test error scenarios and recovery mechanisms