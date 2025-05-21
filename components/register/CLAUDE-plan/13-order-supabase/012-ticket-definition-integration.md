# Ticket Definition Integration for Order Submission

## Overview

This document outlines how to integrate ticket definitions with the order submission process. While we don't have direct access to the ticket_definitions table data, we can infer its structure from the event migration file and design a robust integration approach.

## Inferred Ticket Definitions Structure

Based on the migration file and database references, we can infer that the ticket_definitions table has a structure similar to:

```sql
CREATE TABLE public.ticket_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public."Events"(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  quantity_available INTEGER,
  is_active BOOLEAN DEFAULT true,
  ticket_type TEXT, -- Likely an enum or category (general, vip, etc.)
  special_requirements TEXT[], -- Possible array of requirements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

The ticket assignment table (which we've seen references to) likely has a structure like:

```sql
CREATE TABLE public.attendee_ticket_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES public."Registrations"("registrationId"),
  attendee_id UUID REFERENCES public."Attendees"(attendeeid),
  ticket_definition_id UUID REFERENCES public.ticket_definitions(id),
  price_at_assignment NUMERIC NOT NULL, -- Price when assigned (preserved for historical record)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Integration Requirements

For the ticket integration with order submission, we need to:

1. **Map client-side ticket selections to database ticket definition IDs**
2. **Record the price at assignment for each ticket**
3. **Create ticket assignments for each attendee**
4. **Calculate and validate total amounts**

## Client-Side Ticket Data Structure

On the client side, the ticket data is likely structured like:

```typescript
// In registration store
interface TicketData {
  total: number;
  subtotal: number;
  bookingFee?: number;
  ticketAssignments: Record<string, string>; // attendeeId -> ticketDefinitionId
  vasItems?: Array<{
    id: string;
    quantity: number;
    price: number;
  }>;
  // Possibly other fields
}
```

## Integration Approach

### 1. Ticket Assignment Mapping

When preparing data for the API:

```typescript
// In registration-mapper.ts
function mapTicketAssignments(data: RegistrationSubmissionData) {
  const { registrationId, tickets } = data;
  
  return Object.entries(tickets.ticketAssignments).map(([attendeeId, ticketDefId]) => ({
    id: uuidv4(),
    registration_id: registrationId,
    attendee_id: attendeeId,
    ticket_definition_id: ticketDefId,
    price_at_assignment: getTicketPrice(tickets, attendeeId, ticketDefId),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

// Helper to get price from ticket data
function getTicketPrice(
  tickets: TicketData, 
  attendeeId: string, 
  ticketDefId: string
): number {
  // Option 1: If individual ticket prices are stored in the client state
  if (tickets.prices && tickets.prices[attendeeId]) {
    return tickets.prices[attendeeId];
  }
  
  // Option 2: If ticket prices are stored by ticket definition ID
  if (tickets.ticketPrices && tickets.ticketPrices[ticketDefId]) {
    return tickets.ticketPrices[ticketDefId];
  }
  
  // Option 3: Equal distribution fallback
  const assignmentCount = Object.keys(tickets.ticketAssignments).length;
  return assignmentCount > 0 ? tickets.subtotal / assignmentCount : 0;
}
```

### 2. Ticket Data Validation

When validating registration submission:

```typescript
// In registration-validation.ts
const ticketsSchema = z.object({
  total: z.number().min(0, "Total must be a positive number"),
  subtotal: z.number().min(0, "Subtotal must be a positive number"),
  bookingFee: z.number().min(0, "Booking fee must be a positive number").optional(),
  ticketAssignments: z.record(
    z.string().uuid("Attendee ID must be a valid UUID"),
    z.string().uuid("Ticket definition ID must be a valid UUID")
  ).refine(assignments => Object.keys(assignments).length > 0, {
    message: "At least one ticket must be assigned"
  }),
  vasItems: z.array(
    z.object({
      id: z.string().uuid("VAS ID must be a valid UUID"),
      quantity: z.number().int().positive("Quantity must be a positive integer"),
      price: z.number().min(0, "Price must be a positive number")
    })
  ).optional()
});

// Add to registration submission schema
const registrationSubmissionSchema = z.object({
  // ...other fields
  tickets: ticketsSchema,
  // ...other fields
});
```

### 3. Ticket Assignment Creation in API

In the API route handler:

```typescript
// In /app/api/registrations/route.ts
async function processRegistration(
  supabase: any, 
  data: RegistrationSubmissionData,
  requestId: string
): Promise<RegistrationResult> {
  // ...transaction handling
  
  try {
    // ...registration and attendee creation
    
    // Create ticket assignments
    for (const [attendeeId, ticketDefId] of Object.entries(data.tickets.ticketAssignments)) {
      const ticketAssignment = {
        id: uuidv4(),
        registration_id: registrationId,
        attendee_id: attendeeId,
        ticket_definition_id: ticketDefId,
        price_at_assignment: getTicketPrice(data.tickets, attendeeId, ticketDefId),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: ticketError } = await supabase
        .from('attendee_ticket_assignments')
        .insert(ticketAssignment);
      
      if (ticketError) {
        throw new Error(`Failed to create ticket assignment: ${ticketError.message}`);
      }
    }
    
    // ...rest of transaction
  }
  catch (error) {
    // ...error handling
  }
}
```

### 4. Additional Ticket Validation

For increased security and data integrity, consider additional validation in the API:

```typescript
// In the API route, before processing
async function validateTickets(
  supabase: any,
  data: RegistrationSubmissionData
): Promise<void> {
  // Get all ticket definition IDs from the submission
  const ticketDefIds = Object.values(data.tickets.ticketAssignments);
  
  // Verify these tickets exist and belong to the specified event
  const { data: ticketDefs, error } = await supabase
    .from('ticket_definitions')
    .select('id, event_id, price, is_active')
    .in('id', ticketDefIds)
    .eq('event_id', data.event.id);
  
  if (error) {
    throw new Error(`Failed to validate tickets: ${error.message}`);
  }
  
  // Check all assigned tickets were found and are active
  if (ticketDefs.length !== new Set(ticketDefIds).size) {
    throw new Error('Some assigned tickets do not exist or do not belong to this event');
  }
  
  const inactiveTickets = ticketDefs.filter(t => !t.is_active);
  if (inactiveTickets.length > 0) {
    throw new Error('Some assigned tickets are no longer active');
  }
  
  // Optional: Verify pricing is consistent
  // This could detect client-side manipulation of prices
  let calculatedTotal = 0;
  for (const ticketDef of ticketDefs) {
    // Count how many of this ticket type were assigned
    const count = ticketDefIds.filter(id => id === ticketDef.id).length;
    calculatedTotal += count * ticketDef.price;
  }
  
  // Allow for small floating point differences
  if (Math.abs(calculatedTotal - data.tickets.subtotal) > 0.01) {
    throw new Error('Ticket price calculation does not match server-side calculation');
  }
}
```

## Enhancing the Confirmation Experience

Use ticket information to enhance the confirmation page:

```tsx
// In ConfirmationStep component
const ticketSummary = (
  <div>
    <h3 className="text-lg font-semibold mb-2">Ticket Summary</h3>
    <div className="space-y-2">
      {attendees.map((attendee) => {
        const ticketDefId = tickets.ticketAssignments[attendee.attendeeId];
        const ticketName = getTicketName(ticketDefId); // Helper function to get ticket name
        
        return (
          <div key={attendee.attendeeId} className="flex justify-between">
            <span>{attendee.firstName} {attendee.lastName}</span>
            <Badge variant="outline">
              <Ticket className="w-3 h-3 mr-1" />
              {ticketName}
            </Badge>
          </div>
        );
      })}
      
      <div className="pt-2 mt-2 border-t">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(tickets.subtotal)}</span>
        </div>
        {tickets.bookingFee && (
          <div className="flex justify-between text-sm">
            <span>Booking Fee</span>
            <span>{formatCurrency(tickets.bookingFee)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold mt-1">
          <span>Total</span>
          <span>{formatCurrency(tickets.total)}</span>
        </div>
      </div>
    </div>
  </div>
);
```

## Ticket Availability Updates

After a successful registration, you may want to update ticket availability:

```typescript
// In the API route, after successful registration
async function updateTicketAvailability(
  supabase: any,
  ticketAssignments: Record<string, string>
): Promise<void> {
  // Count tickets by definition ID
  const ticketCounts: Record<string, number> = {};
  
  Object.values(ticketAssignments).forEach(ticketDefId => {
    ticketCounts[ticketDefId] = (ticketCounts[ticketDefId] || 0) + 1;
  });
  
  // Update each ticket definition quantity
  for (const [ticketDefId, count] of Object.entries(ticketCounts)) {
    const { error } = await supabase.rpc(
      'decrease_ticket_quantity',
      { 
        p_ticket_id: ticketDefId,
        p_quantity: count
      }
    );
    
    if (error) {
      // Log but don't fail the transaction - this is a non-critical update
      console.error(`Failed to update ticket availability: ${error.message}`);
    }
  }
}

// And the corresponding database function:
/*
CREATE OR REPLACE FUNCTION public.decrease_ticket_quantity(
  p_ticket_id UUID,
  p_quantity INTEGER
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.ticket_definitions
  SET quantity_available = GREATEST(0, quantity_available - p_quantity)
  WHERE id = p_ticket_id
    AND quantity_available IS NOT NULL;
END;
$$;
*/
```

## PDF Ticket Generation

For PDF ticket generation, include ticket-specific details:

```typescript
// In the ticket generation utility
function generateTicketData(
  attendees: AttendeeData[],
  tickets: TicketData,
  event: EventData,
  registrationId: string
): TicketPdfData[] {
  return attendees.map(attendee => {
    const ticketDefId = tickets.ticketAssignments[attendee.attendeeId];
    
    return {
      ticketId: `TKT-${attendee.attendeeId.substring(0, 8)}`,
      registrationId,
      ticketType: getTicketName(ticketDefId), // Get name from ticket definition
      attendeeId: attendee.attendeeId,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: formatDate(event.event_start),
      eventTime: formatTime(event.event_start),
      eventVenue: event.location,
      attendeeName: `${attendee.firstName} ${attendee.lastName}`,
      attendeeType: attendee.attendeeType,
      confirmationNumber: registrationId,
      purchaseDate: formatDate(new Date()),
      qrCodeData: `REG:${registrationId}:ATT:${attendee.attendeeId}:TKT:${ticketDefId}`,
      specialInstructions: getTicketInstructions(ticketDefId, event)
    };
  });
}
```

## Conclusion

By implementing this ticket definition integration approach, we can:

1. Create a robust mapping between client-side ticket selections and database records
2. Ensure data integrity through multi-layered validation
3. Accurately record ticket assignments for each attendee
4. Support proper ticket pricing and availability tracking
5. Enhance the confirmation experience with ticket-specific information

This integration plan accommodates the existing database schema while providing all necessary functionality for the order submission process.