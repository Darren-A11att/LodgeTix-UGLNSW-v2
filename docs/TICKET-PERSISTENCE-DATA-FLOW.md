# Ticket Selection Persistence - Data Flow Design

## Overview
This document defines the complete data flow for persisting attendee ticket selections from frontend to database.

## Data Flow Architecture

### 1. Frontend Selection Flow
```typescript
// User selects tickets in ticket-selection-step.tsx
User clicks package/ticket → updatePackageSelection() → Store state updated
```

### 2. Step Transition Flow  
```typescript
// When moving to next step
handleContinue() → ensureAllAttendeesHaveTickets() → persistTicketsToDatabase() → goToNextStep()
```

### 3. Data Transformation Pipeline

#### A. Store State → Expanded Tickets
```typescript
// Current store structure
packages: Record<attendeeId, PackageSelectionType>

// Transform to expanded ticket structure
expandedTickets: ExpandedTicket[] = [
  {
    attendeeId: string,           // Store attendee ID
    eventId: string,
    ticketTypeId: string,
    packageId?: string,
    price: number,
    isFromPackage: boolean,
    quantity: number
  }
]
```

#### B. Expanded Tickets → Database Format
```typescript
// Transform for database insertion
databaseTickets: DatabaseTicket[] = [
  {
    attendee_id: string,          // Resolved from store attendeeId  
    event_id: string,
    ticket_type_id: string,
    package_id?: string,
    price_paid: number,
    original_price: number,
    registration_id: string,
    status: 'Active',
    payment_status: 'Unpaid',
    is_partner_ticket: boolean
  }
]
```

#### C. Attendee Data → JSONB Update
```typescript
// Update attendee_data with selected_tickets
attendee_data: {
  ...existing_data,
  selected_tickets: {
    packages: [
      {
        packageId: string,
        quantity: number,
        tickets: [
          { ticketId: string, quantity: number }
        ]
      }
    ],
    individualTickets: [
      { ticketId: string, quantity: number }
    ]
  }
}
```

## Implementation Components

### 1. Frontend Components

#### A. Enhanced Registration Store
```typescript
// lib/registrationStore.ts - New actions
interface RegistrationStore {
  // Existing state
  packages: Record<string, PackageSelectionType>;
  
  // New actions for persistence  
  persistTicketsToDatabase: (functionId: string, registrationId: string) => Promise<void>;
  buildTicketSelectionPayload: () => TicketSelectionPayload;
  expandPackagesToDatabaseFormat: () => DatabaseTicket[];
}
```

#### B. Step Integration  
```typescript
// ticket-selection-step.tsx - Enhanced validation
const handleContinue = async () => {
  if (ensureAllAttendeesHaveTickets()) {
    // NEW: Persist tickets before step transition
    await persistTicketsToDatabase(functionId, registrationId);
    goToNextStep();
  } else {
    setValidationErrors(attendeesWithoutTickets);
    setShowValidationModal(true);
  }
};
```

### 2. API Layer

#### A. New Persistence Endpoint
```typescript
// app/api/registrations/[id]/tickets/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { tickets, attendeeUpdates } = await request.json();
  
  // Call RPC to persist tickets and update attendee_data
  const result = await supabase.rpc('persist_attendee_tickets', {
    p_registration_id: params.id,
    p_tickets: tickets,
    p_attendee_updates: attendeeUpdates
  });
  
  return NextResponse.json(result);
}
```

#### B. Enhanced Individual Registration API
```typescript
// app/api/registrations/individuals/route.ts - Modified
export async function POST(request: NextRequest) {
  const data = await request.json();
  
  // Transform ticket selections to database format
  const databaseTickets = transformTicketsForDatabase(data.tickets);
  const attendeeUpdates = buildAttendeeDataUpdates(data.attendees);
  
  // Call enhanced RPC function
  const result = await supabase.rpc('create_individual_registration_with_tickets', {
    ...existing_params,
    p_tickets: databaseTickets,
    p_attendee_updates: attendeeUpdates
  });
  
  return NextResponse.json(result);
}
```

### 3. Database Layer

#### A. New RPC Function for Ticket Persistence
```sql
-- persist_attendee_tickets(p_registration_id, p_tickets, p_attendee_updates)
CREATE OR REPLACE FUNCTION persist_attendee_tickets(
  p_registration_id UUID,
  p_tickets JSONB,
  p_attendee_updates JSONB
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}';
  v_ticket JSONB;
  v_attendee_update JSONB;
  v_ticket_id UUID;
BEGIN
  -- Insert tickets
  FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_tickets)
  LOOP
    INSERT INTO tickets (
      attendee_id,
      event_id, 
      ticket_type_id,
      package_id,
      price_paid,
      original_price,
      registration_id,
      status,
      payment_status,
      is_partner_ticket
    ) VALUES (
      (v_ticket->>'attendee_id')::UUID,
      (v_ticket->>'event_id')::UUID,
      (v_ticket->>'ticket_type_id')::UUID,
      CASE WHEN v_ticket->>'package_id' IS NOT NULL 
           THEN (v_ticket->>'package_id')::UUID 
           ELSE NULL END,
      (v_ticket->>'price_paid')::NUMERIC,
      (v_ticket->>'original_price')::NUMERIC,
      p_registration_id,
      v_ticket->>'status',
      v_ticket->>'payment_status',
      (v_ticket->>'is_partner_ticket')::BOOLEAN
    ) RETURNING ticket_id INTO v_ticket_id;
  END LOOP;
  
  -- Update attendee_data with selected_tickets
  FOR v_attendee_update IN SELECT * FROM jsonb_array_elements(p_attendee_updates)
  LOOP
    UPDATE attendees 
    SET attendee_data = COALESCE(attendee_data, '{}'::JSONB) || 
                       jsonb_build_object('selected_tickets', v_attendee_update->'selected_tickets')
    WHERE attendee_id = (v_attendee_update->>'attendee_id')::UUID;
  END LOOP;
  
  v_result := jsonb_build_object('success', true, 'tickets_created', jsonb_array_length(p_tickets));
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### B. Enhanced Individual Registration RPC  
```sql
-- Modify existing create_individual_registration_jsonb to include ticket creation
CREATE OR REPLACE FUNCTION create_individual_registration_with_tickets(
  -- existing parameters
  p_tickets JSONB DEFAULT '[]'::JSONB,
  p_attendee_updates JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB AS $$
BEGIN
  -- Existing registration creation logic
  -- ...
  
  -- NEW: Create tickets if provided
  IF jsonb_array_length(p_tickets) > 0 THEN
    PERFORM persist_attendee_tickets(v_registration_id, p_tickets, p_attendee_updates);
  END IF;
  
  -- Return existing result structure
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Data Validation & Error Handling

### 1. Frontend Validation
- Ensure all attendees have ticket selections
- Validate package/individual ticket exclusivity
- Check quantity constraints

### 2. API Validation  
- Validate attendee ID mapping
- Ensure ticket availability
- Verify price consistency

### 3. Database Constraints
- Foreign key constraints on attendee_id, event_id, ticket_type_id
- Check constraints on quantities and prices
- RLS policies for data access

## Testing Strategy

### 1. Unit Tests
- Store action tests for ticket persistence
- Data transformation function tests
- RPC function tests with sample data

### 2. Integration Tests
- Full wizard flow with ticket persistence
- API endpoint testing with real database
- Error handling for edge cases

### 3. End-to-End Tests
- Complete registration flow
- Step transition with persistence
- Data consistency verification

## Success Metrics

1. ✅ Tickets persisted in database on step transition
2. ✅ attendee_data.selected_tickets contains complete payload
3. ✅ No data loss during wizard navigation
4. ✅ Existing registration flows unaffected
5. ✅ Performance impact < 200ms per persistence operation