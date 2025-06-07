# PRD: Registration Data Normalization and Storage

## Problem Statement

Currently, the registration system is storing all data as JSON in the `registration_data` column without properly normalizing and storing data across the related database tables. This causes:

1. **No ticket records**: Tickets are stored in JSON but not created in the `tickets` table
2. **Field mismatches**: JSON field names don't match database column names
3. **Zero monetary values**: All prices show as 0 despite having real values
4. **Missing related records**: No records created in contacts, customers, or attendees tables
5. **Incomplete data**: Many required fields in the registration table are not populated
6. **Data integrity issues**: No proper foreign key relationships established

## Objectives

1. **Normalize all registration data** into proper database tables
2. **Create all required records** in registrations, tickets, contacts, customers, and attendees tables
3. **Properly calculate and store monetary values** including Stripe fees
4. **Establish all foreign key relationships** between tables
5. **Maintain data integrity** across the system
6. **Ensure no data loss** - capture ALL collected information

## Requirements

### Functional Requirements

1. **Registration Record Creation**
   - Create complete registration record with all fields populated
   - Generate and store confirmation number
   - Link to function, event, and customer
   - Store payment details and status
   - Calculate and store all monetary fields

2. **Customer Record Creation**
   - Create customer record for booking contact
   - Map billing details to customer fields
   - Link to contact record
   - Set proper customer_type ('booking_contact')

3. **Contact Record Creation**
   - Create contact for primary attendee
   - Map personal and contact information
   - Store dietary requirements and special needs
   - Set contact preferences

4. **Attendee Record Creation**
   - Create attendee records for all attendees
   - Link to registration and contact
   - Store masonic details in `masonic_status` JSONB
   - Set proper attendee_type and contact_preference

5. **Ticket Record Creation**
   - Create ticket record for each ticket/package
   - Link to attendee, event, and registration
   - Store proper pricing information
   - Set ticket status and type

### Non-Functional Requirements

1. **Transaction Safety**: All operations must be atomic - either all succeed or all fail
2. **Data Validation**: Validate all data before insertion
3. **Error Handling**: Comprehensive error handling with meaningful messages
4. **Performance**: Efficient bulk operations where possible
5. **Backwards Compatibility**: Maintain existing API contracts

## Technical Design

### Data Flow

1. **Individual Registration API** receives registration data
2. **Validation Layer** validates all input data
3. **Service Layer** orchestrates record creation:
   - Create customer record
   - Create contact record(s)
   - Create registration record
   - Create attendee record(s)
   - Create ticket record(s)
   - Update registration with calculated totals

### Field Mapping

#### Registration Data → Customer Table
```
billingDetails.firstName → first_name
billingDetails.lastName → last_name
billingDetails.businessName → business_name
billingDetails.emailAddress → email
billingDetails.mobileNumber → phone
billingDetails.addressLine1 → address_line1
billingDetails.suburb → city
billingDetails.stateTerritory.name → state
billingDetails.postcode → postal_code
billingDetails.country.name → country
```

#### Primary Attendee → Contact Table
```
primaryAttendee.title → title
primaryAttendee.firstName → first_name
primaryAttendee.lastName → last_name
primaryAttendee.primaryEmail → email
primaryAttendee.primaryPhone → mobile_number
primaryAttendee.dietaryRequirements → dietary_requirements
primaryAttendee.specialNeeds → special_needs
primaryAttendee.contactPreference → contact_preference
```

#### Primary Attendee → Attendee Table
```
primaryAttendee.attendeeId → attendee_id
primaryAttendee.attendeeType → attendee_type
primaryAttendee.title → title
primaryAttendee.firstName → first_name
primaryAttendee.lastName → last_name
primaryAttendee.primaryEmail → primary_email
primaryAttendee.primaryPhone → primary_phone
primaryAttendee.isPrimary → is_primary
primaryAttendee.contactPreference → contact_preference
primaryAttendee.dietaryRequirements → dietary_requirements
primaryAttendee.specialNeeds → special_needs
```

#### Masonic Data → attendee.masonic_status JSONB
```
{
  "rank": primaryAttendee.rank,
  "grand_lodge_id": primaryAttendee.grand_lodge_id,
  "lodge_id": primaryAttendee.lodge_id,
  "lodge_name": primaryAttendee.lodgeNameNumber,
  "post_nominals": primaryAttendee.postNominals,
  "first_time": primaryAttendee.firstTime
}
```

#### Tickets → Tickets Table
```
ticket.attendeeId → attendee_id
ticket.eventTicketId → event_ticket_id
eventId → event_id
registrationId → registration_id
Calculate price from event_tickets table
Set status to 'sold'
```

### Price Calculation

1. Fetch ticket prices from `event_tickets` table
2. Calculate subtotal
3. Calculate Stripe fee (2.75% + $0.30)
4. Calculate total (subtotal + stripe_fee if includes_processing_fee)

## Success Criteria

1. All registration data properly stored across normalized tables
2. All monetary values correctly calculated and stored
3. All foreign key relationships established
4. No data loss - all captured information stored
5. Confirmation email successfully triggered
6. Registration confirmation page displays all data correctly

## Testing Requirements

1. Unit tests for each data transformation
2. Integration tests for complete registration flow
3. Validation tests for all required fields
4. Transaction rollback tests
5. Price calculation accuracy tests
6. End-to-end registration flow tests

## Migration Strategy

1. Fix new registrations first
2. Create migration script for existing registrations
3. Validate all migrated data
4. Update reporting queries to use normalized data

## Timeline

- Phase 1: Fix individual registration API (1 day)
- Phase 2: Add comprehensive testing (1 day)
- Phase 3: Fix lodge and delegation APIs (1 day)
- Phase 4: Migrate existing data (1 day)
- Phase 5: Update reporting and views (1 day)