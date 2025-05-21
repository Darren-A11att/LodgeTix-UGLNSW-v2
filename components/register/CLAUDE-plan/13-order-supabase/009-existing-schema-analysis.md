# Existing Schema Analysis for Order Submission to Supabase

## Overview

This document analyzes the existing Supabase schema related to order submission and identifies what can be reused versus what needs to be modified or created for the integration.

## Existing Schema Structure

Based on the examination of the schema files in the codebase, we have identified the following key tables and their relationships:

### 1. Primary Tables

1. **Registrations** - Main registration record
   - Located at: `/supabase/schema/public/Registrations.sql`
   - Contains core registration data
   
2. **Events** - Event information
   - Located at: `/supabase/schema/events.sql`
   - Uses UUID as primary key
   - Has recently been migrated from string IDs to UUIDs

3. **Attendees** - Individual attendees
   - Referenced in Registrations documentation
   - Stores attendee details including type (Mason, Guest, etc.)

4. **attendee_ticket_assignments** - Tickets assigned to attendees
   - Referenced in Registrations documentation
   - Links attendees to specific ticket types

5. **registration_vas** - Value-added services for registrations
   - Referenced in Registrations documentation
   - Stores merchandise or add-on purchases

### 2. Recent Schema Changes

Recent migrations indicate:

1. **UUID Migration (20250512-event-uuid-migration.sql)**
   - Events table has been migrated from string IDs to UUIDs
   - The migration updated references in Registrations and ticket_definitions
   - Added a LegacyEventIds table to maintain backward compatibility

2. **Content Tables Creation (20250521-content-tables.sql)**
   - Added content-related tables for site content
   - Not directly related to registration process

### 3. Registration Schema Details

The Registrations table has the following structure:

```sql
create table public."Registrations" (
  "registrationId" uuid not null,
  "customerId" uuid null,
  "eventId" uuid null,
  "registrationDate" timestamp with time zone null,
  status character varying(50) null,
  "totalAmountPaid" numeric null,
  "totalPricePaid" numeric null,
  "paymentStatus" public.payment_status null default 'pending'::payment_status,
  "agreeToTerms" boolean null default false,
  "stripePaymentIntentId" text null,
  "primaryAttendeeId" uuid null,
  "registrationType" public.registration_type null,
  "createdAt" timestamp with time zone null default now(),
  "updatedAt" timestamp with time zone null default now(),
  constraint registrations_consolidated_pkey primary key ("registrationId"),
  constraint registrations_consolidated_eventId_fkey foreign KEY ("eventId") references "Events" (id),
  constraint registrations_customer_id_fkey foreign KEY ("customerId") references "Customers" (id)
)
```

Important notes:
- Uses UUID for registrationId
- Has foreign key relationships to Events and Customers
- Includes payment-related fields (stripePaymentIntentId, totalAmountPaid)
- Has a registration_type enum field
- Tracks primaryAttendeeId for the main contact

### 4. Related Tables Details

The related tables have the following structures (based on the documentation):

**Attendees**:
```sql
-- Inferred structure
create table public."Attendees" (
  "attendeeid" uuid not null,
  "registrationid" uuid null,
  "attendeetype" character varying null,
  "person_id" uuid null,
  "isPartner" uuid null,
  "title" text null,
  "firstName" text null,
  "lastName" text null,
  -- Additional fields as documented
  constraint attendees_pkey primary key ("attendeeid"),
  constraint attendees_registrationid_fkey foreign key ("registrationid") references "Registrations" ("registrationId")
)
```

**attendee_ticket_assignments**:
```sql
-- Inferred structure
create table public."attendee_ticket_assignments" (
  "id" uuid not null,
  "registration_id" uuid null,
  "attendee_id" uuid null,
  "ticket_definition_id" uuid null,
  "price_at_assignment" numeric null,
  "created_at" timestamp with time zone null,
  "updated_at" timestamp with time zone null,
  constraint attendee_ticket_assignments_pkey primary key ("id"),
  constraint attendee_ticket_assignments_registration_id_fkey foreign key ("registration_id") references "Registrations" ("registrationId"),
  constraint attendee_ticket_assignments_attendee_id_fkey foreign key ("attendee_id") references "Attendees" ("attendeeid")
)
```

## What Can Be Reused

Based on the schema analysis, we can reuse the following:

1. **Existing Table Structure**
   - The Registrations table is already set up with proper fields for our integration
   - The Attendees table has the correct structure for storing attendee information
   - The attendee_ticket_assignments table provides the needed relationship for ticket allocation
   - The registration_vas table is available for add-on items if needed

2. **Existing Data Types and Constraints**
   - UUID primary keys are already in use
   - Appropriate indexes are already created
   - Foreign key relationships are properly established
   - The payment_status and registration_type enums are defined

3. **Event UUID Migration**
   - The Events table already uses UUIDs, which aligns with our registration approach
   - Compatibility with legacy event IDs is maintained

## What Needs to Be Modified or Created

### 1. Transaction Management

There's no evidence of transaction management functions currently in the database. We need to create:

```sql
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
```

### 2. API Route

No existing API route for registration submission was found. We need to create:

`/app/api/registrations/route.ts` - For handling POST requests with registration data

### 3. Client-Side Integration

The client-side integration needs to be created or updated, specifically:

1. **Registration Service** - A new service to handle API calls
2. **Payment Step Update** - Modify PaymentStepUpdated.tsx to use the registration service
3. **Confirmation Step Update** - Update ConfirmationStepUpdated.tsx to display registration details

### 4. Validation Schema

No existing validation schema was found for registration submissions. We need to create:

`/lib/api/registration-validation.ts` - Using Zod for validating registration data

## Data Mapping Strategy

### Client State to Database Mapping

Based on the existing schema, here's how we should map the client-side registration store state to the database tables:

#### 1. Registrations Table

| Registration Store Field | Database Field | Transformation/Notes |
|-------------------------|----------------|----------------------|
| `registrationType` | `registrationType` | Map to enum: "Individuals", "Groups", or "Officials" |
| N/A | `registrationId` | Generate UUID v4 |
| N/A | `registrationDate` | Current timestamp |
| N/A | `status` | Set to "completed" |
| `paymentStatus.amount` | `totalAmountPaid` | Direct mapping |
| `tickets.total` | `totalPricePaid` | Direct mapping |
| `paymentStatus.status` | `paymentStatus` | Map to enum value |
| `agreeToTerms` | `agreeToTerms` | Direct boolean mapping |
| `paymentStatus.paymentIntentId` | `stripePaymentIntentId` | Direct mapping |
| Primary attendee ID | `primaryAttendeeId` | ID of attendee where `isPrimary === true` |
| Derived from primary attendee | `customerId` | Look up or create customer record |

#### 2. Attendees Table

For each attendee in the `attendees` array:

| Registration Store Field | Database Field | Transformation/Notes |
|-------------------------|----------------|----------------------|
| `attendeeId` | `attendeeid` | Direct mapping |
| Registration reference | `registrationid` | Set to created registration ID |
| `attendeeType` | `attendeetype` | Direct mapping (Mason, Guest, etc.) |
| `isPartner` | `isPartner` | Direct mapping |
| `title` | `title` | Direct mapping |
| `firstName` | `firstName` | Direct mapping |
| `lastName` | `lastName` | Direct mapping |
| Other attendee fields | Corresponding fields | Direct mapping |

#### 3. attendee_ticket_assignments Table

For each ticket assignment in the packages object:

| Registration Store Field | Database Field | Transformation/Notes |
|-------------------------|----------------|----------------------|
| N/A | `id` | Generate UUID v4 |
| Registration reference | `registration_id` | Set to created registration ID |
| Attendee ID from key | `attendee_id` | Key from packages record |
| `ticketDefinitionId` | `ticket_definition_id` | Direct mapping |
| From ticket data | `price_at_assignment` | Look up price from tickets data |

#### 4. registration_vas Table (if applicable)

For any value-added services in the order:

| Registration Store Field | Database Field | Transformation/Notes |
|-------------------------|----------------|----------------------|
| N/A | `id` | Generate UUID v4 |
| Registration reference | `registration_id` | Set to created registration ID |
| VAS ID from selection | `vas_id` | From selected VAS |
| `quantity` | `quantity` | Direct mapping |
| From VAS data | `price_at_purchase` | Current price of the VAS |

## Conclusion

The existing schema provides a solid foundation for our registration submission integration. Most of the database structure is already in place, with appropriate tables, relationships, and constraints. Our implementation will focus on:

1. Creating transaction management functions for data integrity
2. Implementing the API route for registration submission
3. Developing client-side integration with proper error handling
4. Creating validation schema for data validation

This approach leverages the existing schema while adding only the necessary components for a robust integration.