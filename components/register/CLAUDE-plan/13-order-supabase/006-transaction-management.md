# Transaction Management for Order Submission

## Overview

This document outlines the transaction management approach for order submission to Supabase. Proper transaction management is critical to ensure data consistency across multiple tables and prevent partial or incomplete registrations.

## Why Transactions Are Critical

When submitting a registration, we need to create records in multiple tables:
1. **Registrations** - Main registration record
2. **Attendees** - Individual attendees (could be multiple)
3. **attendee_ticket_assignments** - Ticket assignments for each attendee
4. **registration_vas** - Optional value-added services

If any part of this process fails, we need to roll back all changes to maintain data integrity. Transactions ensure that all database operations either succeed together or fail together, preventing inconsistent states.

## Transaction Approaches in Supabase

Supabase (PostgreSQL) offers multiple approaches for transaction management. We'll implement a stored procedure approach for maximum reliability.

### 1. Database Functions for Transaction Control

First, we'll create PostgreSQL functions for transaction management:

```sql
-- Create these functions in Supabase SQL editor or migrations

-- Begin a new transaction
CREATE OR REPLACE FUNCTION public.begin_transaction()
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN;
  RETURN json_build_object('status', 'transaction_started');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Commit an ongoing transaction
CREATE OR REPLACE FUNCTION public.commit_transaction()
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  COMMIT;
  RETURN json_build_object('status', 'transaction_committed');
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Rollback an ongoing transaction
CREATE OR REPLACE FUNCTION public.rollback_transaction()
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  ROLLBACK;
  RETURN json_build_object('status', 'transaction_rolled_back');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;
```

### 2. Create a Complete Registration Stored Procedure

For maximum reliability, we'll create a stored procedure that handles the entire registration process in a transaction:

```sql
CREATE OR REPLACE FUNCTION public.create_complete_registration(
  p_registration_data JSONB,
  p_attendees JSONB,
  p_ticket_assignments JSONB,
  p_vas_items JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_registration_id UUID;
  v_attendee JSONB;
  v_ticket JSONB;
  v_vas JSONB;
  v_result JSONB;
BEGIN
  -- Start transaction
  BEGIN
    -- Insert main registration record
    INSERT INTO public."Registrations" (
      "registrationId",
      "customerId",
      "eventId",
      "registrationDate",
      "status",
      "totalAmountPaid",
      "totalPricePaid",
      "paymentStatus",
      "agreeToTerms",
      "stripePaymentIntentId",
      "primaryAttendeeId",
      "registrationType",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      (p_registration_data->>'registrationId')::UUID,
      (p_registration_data->>'customerId')::UUID,
      (p_registration_data->>'eventId')::UUID,
      COALESCE((p_registration_data->>'registrationDate')::TIMESTAMP WITH TIME ZONE, NOW()),
      COALESCE(p_registration_data->>'status', 'completed'),
      (p_registration_data->>'totalAmountPaid')::NUMERIC,
      (p_registration_data->>'totalPricePaid')::NUMERIC,
      (p_registration_data->>'paymentStatus')::payment_status,
      COALESCE((p_registration_data->>'agreeToTerms')::BOOLEAN, FALSE),
      p_registration_data->>'stripePaymentIntentId',
      (p_registration_data->>'primaryAttendeeId')::UUID,
      (p_registration_data->>'registrationType')::registration_type,
      NOW(),
      NOW()
    )
    RETURNING "registrationId" INTO v_registration_id;

    -- Process attendees
    FOR v_attendee IN SELECT * FROM jsonb_array_elements(p_attendees)
    LOOP
      INSERT INTO public."Attendees" (
        "attendeeid",
        "registrationid",
        "attendeetype",
        "person_id",
        "isPartner",
        "title",
        "firstName",
        "lastName",
        "lodgeNameNumber",
        "primaryEmail",
        "primaryPhone",
        "dietaryRequirements",
        "specialNeeds",
        "contactPreference",
        "contactConfirmed",
        "isCheckedIn",
        "firstTime",
        "rank",
        "postNominals",
        "grandLodgeId",
        "lodgeId",
        "relationship",
        "partnerOf",
        "guestOfId",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        (v_attendee->>'attendeeId')::UUID,
        v_registration_id,
        (v_attendee->>'attendeeType'),
        (v_attendee->>'personId')::UUID,
        (v_attendee->>'isPartner')::UUID,
        v_attendee->>'title',
        v_attendee->>'firstName',
        v_attendee->>'lastName',
        v_attendee->>'lodgeNameNumber',
        v_attendee->>'primaryEmail',
        v_attendee->>'primaryPhone',
        v_attendee->>'dietaryRequirements',
        v_attendee->>'specialNeeds',
        v_attendee->>'contactPreference',
        COALESCE((v_attendee->>'contactConfirmed')::BOOLEAN, FALSE),
        COALESCE((v_attendee->>'isCheckedIn')::BOOLEAN, FALSE),
        (v_attendee->>'firstTime')::BOOLEAN,
        v_attendee->>'rank',
        v_attendee->>'postNominals',
        (v_attendee->>'grandLodgeId')::UUID,
        (v_attendee->>'lodgeId')::UUID,
        v_attendee->>'relationship',
        (v_attendee->>'partnerOf')::UUID,
        (v_attendee->>'guestOfId')::UUID,
        NOW(),
        NOW()
      );
    END LOOP;

    -- Process ticket assignments
    FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_ticket_assignments)
    LOOP
      INSERT INTO public."attendee_ticket_assignments" (
        "id",
        "registration_id",
        "attendee_id",
        "ticket_definition_id",
        "price_at_assignment",
        "created_at",
        "updated_at"
      )
      VALUES (
        (v_ticket->>'id')::UUID,
        v_registration_id,
        (v_ticket->>'attendee_id')::UUID,
        (v_ticket->>'ticket_definition_id')::UUID,
        (v_ticket->>'price_at_assignment')::NUMERIC,
        NOW(),
        NOW()
      );
    END LOOP;

    -- Process VAS items if provided
    IF p_vas_items IS NOT NULL THEN
      FOR v_vas IN SELECT * FROM jsonb_array_elements(p_vas_items)
      LOOP
        INSERT INTO public."registration_vas" (
          "id",
          "registration_id",
          "vas_id",
          "quantity",
          "price_at_purchase",
          "created_at",
          "updated_at"
        )
        VALUES (
          (v_vas->>'id')::UUID,
          v_registration_id,
          (v_vas->>'vas_id')::UUID,
          (v_vas->>'quantity')::INTEGER,
          (v_vas->>'price_at_purchase')::NUMERIC,
          NOW(),
          NOW()
        );
      END LOOP;
    END IF;

    -- Success response
    v_result := jsonb_build_object(
      'success', TRUE,
      'registrationId', v_registration_id,
      'message', 'Registration created successfully'
    );

    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback on any error
      ROLLBACK;
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'errorCode', SQLSTATE
      );
  END;
END;
$$;
```

## Implementing Transactions in the API Route

The API route in Next.js will use either approach based on needs:

### Method 1: Using Transaction Control Functions

```typescript
// In /app/api/registrations/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registrationSchema.parse(body);
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Begin transaction
    const { data: txBegin, error: txBeginError } = await supabase.rpc('begin_transaction');
    
    if (txBeginError) {
      return NextResponse.json({ error: 'Failed to start transaction' }, { status: 500 });
    }
    
    try {
      // Generate IDs
      const registrationId = uuidv4();
      
      // Step 1: Create registration record
      const { error: regError } = await supabase
        .from('Registrations')
        .insert({
          // Registration data...
        });
      
      if (regError) throw regError;
      
      // Step 2: Create attendee records
      for (const attendee of validatedData.attendees) {
        const { error: attError } = await supabase
          .from('Attendees')
          .insert({
            // Attendee data...
          });
        
        if (attError) throw attError;
      }
      
      // Step 3: Create ticket assignments
      // ...
      
      // Step 4: Create VAS items if any
      // ...
      
      // Commit transaction
      const { data: txCommit, error: txCommitError } = await supabase.rpc('commit_transaction');
      
      if (txCommitError) {
        throw new Error(`Failed to commit transaction: ${txCommitError.message}`);
      }
      
      return NextResponse.json({
        success: true,
        registrationId,
        confirmationNumber: generateConfirmationNumber()
      });
    } catch (error) {
      // Rollback transaction on error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  } catch (error) {
    // Handle various errors...
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
```

### Method 2: Using the Stored Procedure

```typescript
// In /app/api/registrations/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registrationSchema.parse(body);
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Prepare data for stored procedure
    const registrationId = uuidv4();
    
    const registrationData = {
      registrationId,
      customerId: validatedData.customerId,
      eventId: validatedData.event.id,
      registrationDate: new Date().toISOString(),
      status: 'completed',
      totalAmountPaid: validatedData.amount,
      totalPricePaid: validatedData.tickets.total,
      paymentStatus: 'completed',
      agreeToTerms: validatedData.agreeToTerms,
      stripePaymentIntentId: validatedData.paymentIntentId,
      primaryAttendeeId: validatedData.attendees.find(a => a.isPrimary)?.attendeeId,
      registrationType: mapRegistrationType(validatedData.registrationType)
    };
    
    // Transform attendees data
    const attendeesData = validatedData.attendees.map(a => ({
      attendeeId: a.attendeeId,
      attendeeType: a.attendeeType,
      // ...other attendee fields
    }));
    
    // Transform ticket assignments
    const ticketAssignments = Object.entries(validatedData.tickets.ticketAssignments)
      .map(([attendeeId, ticketDefId]) => ({
        id: uuidv4(),
        attendee_id: attendeeId,
        ticket_definition_id: ticketDefId,
        price_at_assignment: getPriceForTicket(validatedData, attendeeId)
      }));
    
    // Call stored procedure
    const { data, error } = await supabase.rpc('create_complete_registration', {
      p_registration_data: registrationData,
      p_attendees: attendeesData,
      p_ticket_assignments: ticketAssignments,
      p_vas_items: validatedData.vasItems || null
    });
    
    if (error) {
      console.error('Registration procedure error:', error);
      return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 });
    }
    
    if (!data.success) {
      console.error('Registration procedure failed:', data.error);
      return NextResponse.json({ error: data.error }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      registrationId,
      confirmationNumber: generateConfirmationNumber()
    });
  } catch (error) {
    // Handle various errors...
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
```

## Transaction Isolation Level Considerations

In our PostgreSQL transaction, we should set the appropriate isolation level:

```sql
-- Add this to the begin_transaction function
CREATE OR REPLACE FUNCTION public.begin_transaction()
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN;
  -- Set isolation level to SERIALIZABLE for maximum consistency
  EXECUTE 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE';
  RETURN json_build_object('status', 'transaction_started');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;
```

The available isolation levels in PostgreSQL are:
- **READ UNCOMMITTED**: Not supported in PostgreSQL (behaves like READ COMMITTED)
- **READ COMMITTED**: Default level, only sees committed changes
- **REPEATABLE READ**: Guarantees that any data read during a transaction will stay the same for the duration of the transaction
- **SERIALIZABLE**: Strictest level, ensures transactions appear to execute in series

For registration submissions, SERIALIZABLE is recommended to prevent any data anomalies.

## Transaction Timeout Handling

To prevent long-running transactions from causing issues:

1. Set a statement timeout in PostgreSQL:

```sql
-- Add to begin_transaction function
EXECUTE 'SET statement_timeout = 30000'; -- 30 seconds timeout
```

2. Implement client-side timeout handling:

```typescript
// In client-side submission code
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

try {
  const response = await fetch('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: controller.signal
  });
  
  clearTimeout(timeoutId);
  
  // Process response...
} catch (error) {
  clearTimeout(timeoutId);
  
  if (error.name === 'AbortError') {
    // Handle timeout
    setError('Registration request timed out. Please try again.');
  } else {
    // Handle other errors
  }
}
```

## Database Locking Considerations

Registration operations may cause contention if many users are registering simultaneously. Consider:

1. **Optimistic Locking**: Use version numbers or timestamps to detect conflicts
2. **Advisory Locks**: Use PostgreSQL advisory locks for critical operations
3. **Row-level Locks**: PostgreSQL handles these automatically based on isolation level

Example of using an advisory lock in the stored procedure:

```sql
-- Add to the create_complete_registration function
-- Lock using event ID to prevent concurrent registrations to the same event if it has limited space
PERFORM pg_advisory_xact_lock(('x' || md5((p_registration_data->>'eventId')::TEXT))::bit(64)::bigint);
```

## Monitoring and Observability

To monitor transaction performance and identify issues:

1. **Logging**: Add detailed logging for transaction stages
2. **Metrics**: Track transaction duration, success/failure rates
3. **Alerts**: Set up alerts for failed transactions or slow performance

Implement logging in the API route:

```typescript
// In the API route
const startTime = performance.now();
const transactionId = uuidv4();

logger.info({
  transactionId,
  message: 'Starting registration transaction',
  registrationType: validatedData.registrationType,
  attendeeCount: validatedData.attendees.length
});

// Process transaction
// ...

const duration = performance.now() - startTime;
logger.info({
  transactionId,
  message: 'Registration transaction completed',
  registrationId,
  duration: `${duration.toFixed(2)}ms`,
  success: true
});
```

## Recovery Strategies

If a transaction fails, we need recovery strategies:

1. **Automatic Retries**: For transient errors, implement automatic retries
2. **Manual Intervention**: For persistent errors, provide support contact information
3. **Data Preservation**: Allow users to download their registration data if submission fails
4. **Offline Processing**: Consider allowing registration data to be saved and processed later

Example retry mechanism:

```typescript
// Helper function for retrying operations
async function withRetry(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Only retry transient errors
      if (!isTransientError(error) || attempt === maxRetries) {
        throw error;
      }
      
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt)); // Exponential backoff
    }
  }
  
  throw lastError;
}

// Using the retry mechanism
await withRetry(() => supabase.rpc('create_complete_registration', {
  // Parameters...
}));
```

## Conclusion

By implementing robust transaction management, we ensure:

1. **Data Integrity**: All registration data is saved atomically
2. **Consistency**: Database remains in a consistent state
3. **Reliability**: Registration process is resilient to errors
4. **Performance**: Transactions are optimized for speed and resource usage
5. **Observability**: Transaction processes are monitored and logged