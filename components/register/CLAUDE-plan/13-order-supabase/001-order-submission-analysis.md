# Order Submission Analysis

## Current Process Analysis

Based on a review of the codebase, the registration process follows these steps:
1. Users go through the registration wizard
2. In the payment step, they enter payment details 
3. When payment succeeds, there's a call to `saveRegistration()` in PaymentStepUpdated.tsx
4. This sends a POST request to '/api/registrations' 
5. Upon success, users are directed to the confirmation step

However, the actual implementation of the `/api/registrations` endpoint appears to be missing, so we need to create this endpoint. 

## Database Schema Analysis

Based on Supabase's database schema:

### Primary Tables for Registration:
1. **Registrations** - Main registration record
2. **Attendees** - Individual attendees within a registration 
3. **attendee_ticket_assignments** - Tickets assigned to attendees
4. **registration_vas** - Value-added services for registration

### Data Flow Requirements:
1. Create a registration record first
2. Create records for all attendees
3. Create ticket assignments for each attendee
4. Create VAS records if applicable

## Data Structure Needed

To properly submit an order to Supabase, we need to send:

### Registration Data:
- `registrationId` (UUID) - Can be generated server-side
- `customerId` (UUID) - From primary attendee
- `eventId` (UUID) - From event context
- `registrationDate` (Timestamp) - Current timestamp
- `status` (String) - "completed"
- `totalAmountPaid` (Number) - From payment intent
- `paymentStatus` (Enum) - "completed"
- `agreeToTerms` (Boolean) - From registration store
- `stripePaymentIntentId` (String) - From payment intent
- `primaryAttendeeId` (UUID) - Primary attendee ID (will be set after attendee creation)
- `registrationType` (Enum) - "Individuals", "Groups", or "Officials"

### Attendee Data (For Each Attendee):
- `attendeeId` (UUID) - From registration store
- `registrationId` (UUID) - Reference to created registration
- `attendeeType` (Enum) - "Mason", "Guest", etc.
- Personal details (name, contact info, etc.)
- Masonic details for Mason attendees (rank, lodge, etc.)
- `dietaryRequirements` (String)
- `specialNeeds` (String)
- Relationship data (partner, guestOf, etc.)

### Ticket Assignment Data:
- `id` (UUID) - Generated server-side
- `registration_id` (UUID) - Reference to created registration
- `attendee_id` (UUID) - Reference to created attendee
- `ticket_definition_id` (UUID) - Ticket type assigned
- `price_at_assignment` (Number) - Price when assigned

### VAS Data (if applicable):
- `id` (UUID) - Generated server-side
- `registration_id` (UUID) - Reference to created registration
- `vas_id` (UUID) - Reference to value-added service
- `quantity` (Number) - Number of items
- `price_at_purchase` (Number) - Price when purchased

## API Implementation Needs

We need to create:
1. A server-side route that receives this data
2. Transaction logic to ensure all records are created together
3. Error handling if any part fails
4. Response with confirmation details

The next files will detail the implementation of each component needed for this integration.