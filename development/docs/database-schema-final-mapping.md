# Final Database Schema Mapping Guide

## Overview
After analyzing the actual database schema from schema.json and database.types.ts, we've identified the exact column naming conventions used in the database.

## Key Findings

### 1. Table Names
All table names are lowercase:
- `attendees` 
- `registrations`
- `tickets`
- `people`
- `customers`
- `masonicprofiles`
- `eventtickets`
- `events`
- `eventpackages`

### 2. Column Naming Patterns

#### Attendees Table (ALL LOWERCASE, NO UNDERSCORES)
- `attendeeid` (NOT attendee_id)
- `registrationid` (NOT registration_id)
- `attendeetype` (NOT attendee_type)
- `relatedattendeeid` (NOT related_attendee_id)
- `contactpreference` (NOT contact_preference)
- `dietaryrequirements` (NOT dietary_requirements)
- `specialneeds` (NOT special_needs)
- `eventtitle` (NOT event_title)
- `createdat` (NOT created_at)
- `updatedat` (NOT updated_at)

#### Registrations Table (USES UNDERSCORES)
- `registration_id`
- `customer_id`
- `event_id`
- `registration_date`
- `payment_status`
- `stripe_payment_intent_id`
- `primary_attendee_id`
- `registration_type`
- `registration_data`
- `confirmation_number`
- `created_at`
- `updated_at`

#### Tickets Table (USES UNDERSCORES)
- `ticket_id`
- `attendee_id`
- `event_id`
- `registration_id`
- `event_ticket_id`
- `ticket_definition_id`
- `price_paid`
- `is_partner_ticket`
- `package_id`
- All columns use underscores

#### People Table (USES UNDERSCORES)
- `person_id`
- `first_name`
- `last_name`
- `primary_email`
- `primary_phone`
- All columns use underscores

#### MasonicProfiles Table (ALL LOWERCASE, NO UNDERSCORES)
- `masonicprofileid` (NOT masonic_profile_id)
- `person_id` (exception - has underscore)
- `masonictitle` (NOT masonic_title)
- `grandrank` (NOT grand_rank)
- `grandofficer` (NOT grand_officer)
- `grandoffice` (NOT grand_office)
- `lodgeid` (NOT lodge_id)
- `createdat` (NOT created_at)
- `updatedat` (NOT updated_at)

### 3. Data Type Mappings

#### Enums
- `attendee_type`: 'mason' | 'guest' | 'ladypartner' | 'guestpartner'
- `attendee_contact_preference`: 'directly' | 'primaryattendee' | 'mason' | 'guest' | 'providelater'
- `payment_status`: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled' | 'expired'
- `registration_type`: 'individuals' | 'groups' | 'officials' | 'lodge' | 'delegation'

#### Common Types
- UUIDs: All ID fields
- JSONB: registration_data (stored as array)
- Numeric: price fields (10,2 precision)
- Timestamp with timezone: all date/time fields

### 4. Foreign Key Relationships

- `attendees.registrationid` → `registrations.registration_id`
- `attendees.person_id` → `people.person_id`
- `attendees.relatedattendeeid` → `attendees.attendeeid`
- `tickets.attendee_id` → `attendees.attendeeid`
- `tickets.registration_id` → `registrations.registration_id`
- `masonicprofiles.person_id` → `people.person_id`
- `registrations.customer_id` → `customers.id`

### 5. RPC Function Expectations

The RPC functions expect snake_case input parameters but must map to the actual database column names:

#### Input Format (what the frontend sends):
```json
{
  "attendee_id": "uuid",
  "attendee_type": "mason",
  "contact_preference": "directly"
}
```

#### Database Storage (actual column names):
```sql
INSERT INTO attendees (attendeeid, attendeetype, contactpreference)
```

### 6. Critical Issues Fixed

1. **Column Name Mismatch**: The database uses inconsistent naming - some tables use snake_case, others use all lowercase without underscores
2. **Non-existent Columns**: Removed attempts to insert into columns that don't exist (e.g., package_name in tickets)
3. **Data Type Casting**: Proper enum casting is required for PostgreSQL enum types
4. **Foreign Key References**: Must use exact column names for foreign key relationships

### 7. Implementation Strategy

1. **Frontend**: Continue sending snake_case format
2. **RPC Functions**: Handle mapping from snake_case to actual database columns
3. **Direct Queries**: Use exact database column names
4. **Type Definitions**: Should reflect actual database structure

This mapping ensures data integrity while maintaining backward compatibility with existing frontend code.