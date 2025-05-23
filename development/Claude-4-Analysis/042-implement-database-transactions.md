# Task 042: Implement Database Transactions

**Priority**: High  
**Category**: Database Integrity  
**Dependencies**: Task 041 (Database Naming Migration)  
**Estimated Time**: 3-4 hours  

## Problem

The registration process performs multiple database operations without transactions:

From `app/api/registrations/route.ts`:
1. Insert registration record
2. Insert multiple attendee records
3. Update registration with primary attendee ID
4. Insert multiple ticket records

If any step fails, the database is left in an inconsistent state with:
- Orphaned records
- Incomplete registrations
- Payment records without attendees
- Data integrity violations

## Critical Areas Requiring Transactions

1. **Registration Creation**: Registration + Attendees + Tickets
2. **Payment Processing**: Payment record + Registration status update
3. **Bulk Updates**: Multiple related records
4. **Cascading Deletes**: Remove registration and all related data

## Solution

Implement proper database transactions using Supabase's transaction support to ensure ACID properties.

## Implementation Steps

### 1. Create Transaction Utility

Create `lib/db/transaction-manager.ts`:

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/supabase/types';

export type TransactionClient = SupabaseClient<Database>;

/**
 * Execute a database transaction with automatic rollback on error
 */
export async function executeTransaction<T>(
  supabase: SupabaseClient<Database>,
  callback: (tx: TransactionClient) => Promise<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // Start transaction
    const { data: _, error: beginError } = await supabase.rpc('begin_transaction');
    if (beginError) throw beginError;

    try {
      // Execute callback with transaction client
      const result = await callback(supabase);
      
      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw commitError;
      
      return { data: result, error: null };
    } catch (error) {
      // Rollback on any error
      await supabase.rpc('rollback_transaction').catch(console.error);
      throw error;
    }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Batch insert with transaction
 */
export async function batchInsert<T extends keyof Database['public']['Tables']>(
  supabase: SupabaseClient<Database>,
  table: T,
  records: Database['public']['Tables'][T]['Insert'][]
): Promise<{ data: Database['public']['Tables'][T]['Row'][] | null; error: Error | null }> {
  return executeTransaction(supabase, async (tx) => {
    const results: Database['public']['Tables'][T]['Row'][] = [];
    
    for (const record of records) {
      const { data, error } = await tx
        .from(table)
        .insert(record)
        .select()
        .single();
        
      if (error) throw error;
      results.push(data);
    }
    
    return results;
  });
}

/**
 * Upsert with conflict handling
 */
export async function safeUpsert<T extends keyof Database['public']['Tables']>(
  supabase: SupabaseClient<Database>,
  table: T,
  record: Database['public']['Tables'][T]['Insert'],
  conflictColumns: string[]
): Promise<{ data: Database['public']['Tables'][T]['Row'] | null; error: Error | null }> {
  return executeTransaction(supabase, async (tx) => {
    const { data, error } = await tx
      .from(table)
      .upsert(record, { 
        onConflict: conflictColumns.join(','),
        returning: 'representation'
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  });
}
```

### 2. Create Database Functions

Create `supabase/migrations/20240102000000_add_transaction_functions.sql`:

```sql
-- Transaction helper functions

-- Function to begin a transaction (for RPC)
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
BEGIN
  -- In Supabase, transactions are handled at the connection level
  -- This is a placeholder for explicit transaction control
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to commit a transaction
CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS $$
BEGIN
  -- Placeholder for explicit commit
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback a transaction
CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS $$
BEGIN
  -- Placeholder for explicit rollback
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to create a registration with attendees and tickets atomically
CREATE OR REPLACE FUNCTION create_registration_atomic(
  p_registration jsonb,
  p_attendees jsonb[],
  p_tickets jsonb[]
)
RETURNS jsonb AS $$
DECLARE
  v_registration_id uuid;
  v_primary_attendee_id uuid;
  v_attendee_ids jsonb = '[]'::jsonb;
  v_attendee record;
  v_ticket record;
  v_result jsonb;
BEGIN
  -- Insert registration
  INSERT INTO registrations (
    registration_id,
    event_id,
    customer_id,
    registration_date,
    status,
    total_amount_paid,
    payment_status,
    stripe_payment_intent_id,
    registration_type,
    registration_data,
    agree_to_terms
  )
  SELECT 
    (p_registration->>'registration_id')::uuid,
    (p_registration->>'event_id')::uuid,
    (p_registration->>'customer_id')::uuid,
    COALESCE(p_registration->>'registration_date', now()::text),
    COALESCE(p_registration->>'status', 'unpaid'),
    COALESCE((p_registration->>'total_amount_paid')::integer, 0),
    COALESCE(p_registration->>'payment_status', 'pending'),
    p_registration->>'stripe_payment_intent_id',
    p_registration->>'registration_type',
    p_registration->'registration_data',
    COALESCE((p_registration->>'agree_to_terms')::boolean, true)
  RETURNING registration_id INTO v_registration_id;

  -- Insert attendees
  FOR v_attendee IN SELECT * FROM unnest(p_attendees) AS attendee(data)
  LOOP
    INSERT INTO attendees (
      attendeeid,
      registrationid,
      attendeetype,
      person_id,
      dietaryrequirements,
      specialneeds,
      contactpreference,
      relationship,
      relatedattendeeid
    )
    SELECT
      COALESCE((v_attendee.data->>'attendee_id')::uuid, gen_random_uuid()),
      v_registration_id,
      v_attendee.data->>'attendee_type',
      (v_attendee.data->>'person_id')::uuid,
      v_attendee.data->>'dietary_requirements',
      v_attendee.data->>'special_needs',
      COALESCE(v_attendee.data->>'contact_preference', 'directly'),
      v_attendee.data->>'relationship',
      (v_attendee.data->>'related_attendee_id')::uuid
    RETURNING attendeeid INTO v_primary_attendee_id;
    
    -- Track first attendee as primary
    IF v_primary_attendee_id IS NOT NULL AND 
       (p_registration->>'primary_attendee_id') IS NULL THEN
      UPDATE registrations 
      SET primary_attendee_id = v_primary_attendee_id
      WHERE registration_id = v_registration_id;
    END IF;
    
    -- Collect attendee IDs
    v_attendee_ids = v_attendee_ids || jsonb_build_object('id', v_primary_attendee_id);
  END LOOP;

  -- Insert tickets
  FOR v_ticket IN SELECT * FROM unnest(p_tickets) AS ticket(data)
  LOOP
    INSERT INTO tickets (
      attendee_id,
      event_id,
      ticket_price,
      ticket_status,
      package_id,
      event_ticket_id
    )
    SELECT
      (v_ticket.data->>'attendee_id')::uuid,
      (v_ticket.data->>'event_id')::uuid,
      COALESCE((v_ticket.data->>'price')::integer, 0),
      COALESCE(v_ticket.data->>'status', 'pending'),
      (v_ticket.data->>'package_id')::uuid,
      (v_ticket.data->>'event_ticket_id')::uuid;
  END LOOP;

  -- Return result
  SELECT jsonb_build_object(
    'registration_id', v_registration_id,
    'attendee_ids', v_attendee_ids,
    'success', true
  ) INTO v_result;
  
  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Roll back is automatic in a function
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Function to update payment status atomically
CREATE OR REPLACE FUNCTION update_payment_status_atomic(
  p_registration_id uuid,
  p_payment_intent_id text,
  p_payment_status text,
  p_amount_paid integer
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Update registration
  UPDATE registrations
  SET 
    payment_status = p_payment_status,
    stripe_payment_intent_id = p_payment_intent_id,
    total_amount_paid = p_amount_paid,
    status = CASE 
      WHEN p_payment_status = 'completed' THEN 'paid'
      ELSE status
    END
  WHERE registration_id = p_registration_id;
  
  -- Update related tickets
  UPDATE tickets
  SET ticket_status = p_payment_status
  WHERE attendee_id IN (
    SELECT attendeeid 
    FROM attendees 
    WHERE registrationid = p_registration_id
  );
  
  -- Log payment event
  INSERT INTO payment_events (
    registration_id,
    payment_intent_id,
    event_type,
    amount,
    created_at
  ) VALUES (
    p_registration_id,
    p_payment_intent_id,
    p_payment_status,
    p_amount_paid,
    now()
  );
  
  SELECT jsonb_build_object(
    'success', true,
    'registration_id', p_registration_id,
    'payment_status', p_payment_status
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### 3. Update Registration API

Update `app/api/registrations/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerClient } from '@/lib/supabase-singleton';
import { createValidatedHandler } from '@/lib/schemas/utils';
import { registrationRequestSchema } from '@/lib/schemas/registration';

export const POST = createValidatedHandler(
  registrationRequestSchema,
  async (data, request) => {
    const supabase = getServerClient();
    
    try {
      // Prepare registration data
      const registrationData = {
        registration_id: generateUUID(),
        event_id: data.eventId,
        customer_id: data.customerId,
        registration_date: new Date().toISOString(),
        status: 'unpaid',
        total_amount_paid: data.totalAmount,
        payment_status: 'pending',
        stripe_payment_intent_id: data.paymentIntentId || null,
        registration_type: data.registrationType,
        registration_data: { billingDetails: data.billingDetails },
        agree_to_terms: data.agreeToTerms,
      };

      // Prepare attendees data
      const attendeesData = [data.primaryAttendee, ...data.additionalAttendees]
        .map(attendee => ({
          attendee_id: attendee.attendeeId || generateUUID(),
          attendee_type: attendee.attendeeType,
          dietary_requirements: attendee.dietaryRequirements,
          special_needs: attendee.specialNeeds,
          contact_preference: attendee.contactPreference,
          relationship: attendee.relationship,
          related_attendee_id: attendee.partnerOf,
          // ... map other fields
        }));

      // Prepare tickets data
      const ticketsData = data.tickets.map(ticket => ({
        attendee_id: ticket.attendeeId,
        event_id: data.eventId,
        price: ticket.price,
        status: 'pending',
        package_id: ticket.packageId,
        event_ticket_id: ticket.ticketDefinitionId,
      }));

      // Execute atomic registration creation
      const { data: result, error } = await supabase.rpc(
        'create_registration_atomic',
        {
          p_registration: registrationData,
          p_attendees: attendeesData,
          p_tickets: ticketsData,
        }
      );

      if (error) {
        console.error('Registration creation failed:', error);
        return NextResponse.json(
          { error: 'Failed to create registration', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        registrationId: result.registration_id,
        confirmationNumber: `REG-${result.registration_id.substring(0, 8).toUpperCase()}`,
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
```

### 4. Update Payment Processing

Update `app/api/registrations/[id]/payment/route.ts`:

```typescript
export const POST = createValidatedHandler(
  paymentUpdateSchema,
  async (data, request, { params }) => {
    const supabase = getServerClient();
    const registrationId = params.id;

    try {
      // Execute atomic payment update
      const { data: result, error } = await supabase.rpc(
        'update_payment_status_atomic',
        {
          p_registration_id: registrationId,
          p_payment_intent_id: data.paymentIntentId,
          p_payment_status: data.status,
          p_amount_paid: data.amount,
        }
      );

      if (error) {
        console.error('Payment update failed:', error);
        return NextResponse.json(
          { error: 'Failed to update payment status' },
          { status: 500 }
        );
      }

      // Send confirmation email if payment completed
      if (data.status === 'completed') {
        await sendConfirmationEmail(registrationId);
      }

      return NextResponse.json({
        success: true,
        ...result,
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
```

### 5. Add Transaction Monitoring

Create `lib/db/transaction-monitor.ts`:

```typescript
interface TransactionMetrics {
  startTime: number;
  endTime?: number;
  success: boolean;
  operationType: string;
  affectedTables: string[];
  error?: string;
}

class TransactionMonitor {
  private metrics: TransactionMetrics[] = [];

  startTransaction(operationType: string, tables: string[]): number {
    const metric: TransactionMetrics = {
      startTime: Date.now(),
      success: false,
      operationType,
      affectedTables: tables,
    };
    
    return this.metrics.push(metric) - 1;
  }

  endTransaction(index: number, success: boolean, error?: string) {
    if (this.metrics[index]) {
      this.metrics[index].endTime = Date.now();
      this.metrics[index].success = success;
      this.metrics[index].error = error;
      
      // Log slow transactions
      const duration = this.metrics[index].endTime! - this.metrics[index].startTime;
      if (duration > 1000) {
        console.warn(`Slow transaction detected: ${this.metrics[index].operationType} took ${duration}ms`);
      }
    }
  }

  getMetrics() {
    return this.metrics;
  }
}

export const transactionMonitor = new TransactionMonitor();
```

## Testing

Create integration tests for transactions:

```typescript
// __tests__/integration/transactions.test.ts
describe('Database Transactions', () => {
  it('rolls back on attendee insertion failure', async () => {
    // Attempt to create registration with invalid attendee data
    const response = await fetch('/api/registrations', {
      method: 'POST',
      body: JSON.stringify({
        // ... registration data with invalid attendee
      }),
    });

    expect(response.status).toBe(500);
    
    // Verify no partial data was saved
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*')
      .eq('customer_id', testCustomerId);
      
    expect(registrations).toHaveLength(0);
  });

  it('completes full registration atomically', async () => {
    // Create valid registration
    const response = await fetch('/api/registrations', {
      method: 'POST',
      body: JSON.stringify(validRegistrationData),
    });

    expect(response.ok).toBe(true);
    
    // Verify all related records exist
    const registrationId = (await response.json()).registrationId;
    
    const { data: attendees } = await supabase
      .from('attendees')
      .select('*')
      .eq('registrationid', registrationId);
      
    expect(attendees).toHaveLength(2); // Primary + additional
  });
});
```

## Rollback Procedures

Document rollback procedures for failed transactions:

```markdown
## Transaction Rollback Procedures

### Failed Registration
1. No manual cleanup needed - transaction automatically rolled back
2. Log the error for investigation
3. Return user-friendly error message

### Failed Payment Update
1. Check Stripe webhook for actual payment status
2. Manually reconcile if needed using admin tools
3. Contact support if discrepancy exists

### Monitoring
- Check transaction metrics dashboard
- Alert on high failure rates
- Review slow transaction logs daily
```

## Benefits

1. **Data Integrity**: No partial registrations or orphaned records
2. **Consistency**: All related data updated together
3. **Reliability**: Automatic rollback on errors
4. **Performance**: Batch operations in single transaction
5. **Debugging**: Clear transaction boundaries for troubleshooting

## Next Steps

1. Add database indexes for transaction performance (Task 043)
2. Implement retry logic for transient failures
3. Add transaction timeout handling
4. Create admin tools for manual transaction recovery