# LodgeTix Data Dependencies Documentation

## Overview
This document provides a comprehensive list of all data dependencies, foreign key relationships, and cascade behaviors in the LodgeTix database schema.

## Core Entity Relationships

### 1. Events
**Primary Key**: `event_id` (UUID)

**Dependencies**:
- `parent_event_id` → `events.event_id` (RESTRICT DELETE)
  - Child events cannot be deleted if parent exists
  - Prevents orphaned sub-events
- `organiser_id` → `organisations.organisation_id` (SET NULL)
  - Organisation deletion doesn't delete events
- `display_scope_id` → `display_scopes.id` (NO ACTION)
  - Controls visibility scope
- `location_id` → `locations.location_id` (SET NULL)
  - Location deletion doesn't affect events
- `registration_availability_id` → `eligibility_criteria.id` (NO ACTION)
  - Links to eligibility rules

**Dependent Entities**:
- `event_tickets` → Ticket types for this event
- `packages` → Package deals including this event
- `tickets` → Individual tickets sold (CASCADE DELETE)
- `attendee_events` → Attendee-event associations (CASCADE DELETE)

### 2. Registrations
**Primary Key**: `registration_id` (UUID)

**Dependencies**:
- `contact_id` → `contacts.contact_id` (SET NULL)
  - Contact deletion doesn't delete registration
- `organisation_id` → `organisations.organisation_id` (CASCADE UPDATE, SET NULL)
  - Organisation updates cascade, deletions nullify
- `event_id` → `events.event_id` (NO EXPLICIT FK)
  - Implicit relationship, should be enforced

**Dependent Entities**:
- `attendees` → All attendees in registration (NO CASCADE)
- `tickets` → All tickets in registration (CASCADE DELETE)

### 3. Attendees
**Primary Key**: `attendee_id` (UUID)

**Dependencies**:
- `registration_id` → `registrations.registration_id` (REQUIRED, NO CASCADE)
  - Registration must exist, no automatic deletion
- `contact_id` → `contacts.contact_id` (SET NULL)
  - Contact deletion doesn't delete attendee
- `related_attendee_id` → `attendees.attendee_id` (SET NULL)
  - Self-referential for partners/relationships

**Dependent Entities**:
- `tickets` → Tickets assigned to attendee (CASCADE DELETE)
- `attendee_events` → Event associations (CASCADE DELETE)

### 4. Contacts
**Primary Key**: `contact_id` (UUID)

**Dependencies**:
- `organisation_id` → `organisations.organisation_id` (NO ACTION)
  - Organisation link for business contacts
- `auth_user_id` → `auth.users.id` (IMPLICIT)
  - Links to authentication system

**Dependent Entities**:
- `attendees` → Attendees with this contact (SET NULL)
- `registrations` → Registrations by this contact (SET NULL)
- `customers` → Customer records (NO CASCADE)
- `masonic_profiles` → Masonic information (SET NULL)
- `memberships` → Organisation memberships (CASCADE DELETE)

### 5. Tickets
**Primary Key**: `ticket_id` (UUID)

**Dependencies**:
- `attendee_id` → `attendees.attendee_id` (CASCADE DELETE)
  - Attendee deletion removes their tickets
- `event_id` → `events.event_id` (CASCADE DELETE)
  - Event deletion removes all tickets
- `registration_id` → `registrations.registration_id` (CASCADE DELETE)
  - Registration deletion removes tickets
- `package_id` → `packages.package_id` (SET NULL)
  - Package deletion doesn't affect tickets
- `ticket_type_id` → `event_tickets.id` (NO ACTION)
  - Links to ticket type definition

**Unique Constraint**: `(attendee_id, event_id)`
- Prevents duplicate tickets for same attendee/event

### 6. Organisations
**Primary Key**: `organisation_id` (UUID)

**Dependencies**: None (top-level entity)

**Dependent Entities**:
- `events` → Events organized by (SET NULL)
- `lodges` → Lodge organisations (NO CASCADE)
- `grand_lodges` → Grand lodge organisations (NO CASCADE)
- `contacts` → Associated contacts (NO CASCADE)
- `registrations` → Registrations by organisation (SET NULL)
- `masonic_profiles` → Lodge/Grand lodge associations (NO CASCADE)

### 7. Packages
**Primary Key**: `package_id` (UUID)

**Dependencies**:
- `event_id` → `events.event_id` (CASCADE DELETE)
  - Event deletion removes packages
- `parent_event_id` → `events.event_id` (CASCADE DELETE)
  - Parent event deletion removes packages

**Dependent Entities**:
- `tickets` → Tickets from this package (SET NULL)

### 8. Event Tickets (Ticket Types)
**Primary Key**: `id` (UUID)

**Dependencies**:
- `event_id` → `events.event_id` (NO CASCADE)
  - Event must exist but deletion behavior undefined

**Dependent Entities**:
- `tickets.ticket_type_id` → Individual tickets of this type

### 9. Masonic Profiles
**Primary Key**: `masonic_profile_id` (UUID)

**Dependencies**:
- `contact_id` → `contacts.contact_id` (SET NULL, UNIQUE)
  - One-to-one relationship with contact
- `lodge_id` → `organisations.organisation_id` (SET NULL)
  - Lodge affiliation
- `grand_lodge_id` → `organisations.organisation_id` (NO ACTION)
  - Grand lodge affiliation

**Constraints**:
- Must have either `lodge_id` OR `grand_lodge_id` (check constraint)

**Dependent Entities**:
- `memberships.profile_id` → Membership records (SET NULL)

### 10. Memberships
**Primary Key**: `membership_id` (UUID)

**Dependencies**:
- `contact_id` → `contacts.contact_id` (CASCADE DELETE)
  - Contact deletion removes memberships
- `profile_id` → `masonic_profiles.masonic_profile_id` (SET NULL)
  - Profile deletion doesn't remove membership

**Unique Constraint**: `(contact_id, membership_type, membership_entity_id)`
- Prevents duplicate memberships

## Critical Dependencies

### Circular Dependencies
1. **Attendees ↔ Attendees** (via `related_attendee_id`)
   - Self-referential for partner relationships
   - SET NULL on delete prevents cascade issues

2. **Events ↔ Events** (via `parent_event_id`)
   - Parent-child event hierarchy
   - RESTRICT DELETE prevents orphaned children

### Mandatory Relationships
1. **Attendees** → **Registrations** (REQUIRED)
   - Attendee cannot exist without registration
   - No cascade delete (manual cleanup needed)

2. **Tickets** → **Events** (REQUIRED)
   - Ticket must belong to an event
   - CASCADE DELETE removes tickets with event

3. **Tickets** → **Attendees** (OPTIONAL but constrained)
   - Unique constraint with event_id
   - CASCADE DELETE with attendee

### Optional Relationships
1. **Registrations** → **Contacts** (OPTIONAL)
   - Anonymous registrations possible
   - SET NULL on contact deletion

2. **Attendees** → **Contacts** (OPTIONAL)
   - Guest attendees may not have contact records
   - SET NULL on contact deletion

## Business Logic Dependencies

### Event Capacity Management
- `events.sold_count` and `reserved_count` must be >= 0
- `event_tickets` tracks availability per ticket type
- Ticket creation should update event counts

### Registration State Machine
- Payment status: `pending` → `completed` → `refunded`
- Registration status affects ticket validity
- Confirmation number generated on payment completion

### Membership Constraints
- One membership per `(contact, type, entity)`
- Active/inactive status for temporal validity
- Permissions array for role-based access

## Data Integrity Risks

### High Risk Areas
1. **Registration → Attendee** relationship
   - No cascade delete could leave orphaned attendees
   - Manual cleanup required on registration deletion

2. **Event deletion with active registrations**
   - Would cascade delete all tickets
   - No protection for paid registrations

3. **Contact deletion impact**
   - Sets NULL on registrations/attendees
   - Could lose booking contact information

### Recommended Safeguards
1. Implement soft deletes for critical entities
2. Add application-level checks before hard deletes
3. Create audit trails for deletion operations
4. Add database triggers for complex cascades
5. Regular orphaned data cleanup jobs

## Query Optimization Indexes
The schema includes strategic indexes for:
- Foreign key relationships
- Status fields (`payment_status`, `ticket_status`)
- Temporal queries (`created_at`, `event_start`)
- Search fields (`slug`, `confirmation_number`)
- JSON fields (`eligibility_criteria`, `registration_data`)