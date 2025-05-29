# RPC Registration Data Migration Analysis

## Overview
This document provides a comprehensive comparison between the data collected by the registration wizard and the data expected by the `create_registration` RPC function.

## 1. RPC Function Expected Data Structure

### Registration Data
```json
{
  "registration_id": "UUID",
  "customer_id": "UUID",
  "event_id": "UUID",
  "registration_type": "string",
  "status": "string",
  "payment_status": "string",
  "total_amount_paid": "number",
  "total_price_paid": "number",
  "agree_to_terms": "boolean",
  "stripe_payment_intent_id": "string",
  "primary_attendee_id": "UUID",
  "registration_data": "jsonb" // Stores complete registration state
}
```

### Attendee Data
```json
{
  "attendeeid": "UUID",
  "attendeetype": "mason|guest",
  "isPrimary": "boolean",
  "isPartner": "boolean",
  "dietaryrequirements": "string",
  "specialneeds": "string",
  "contactpreference": "directly|primaryattendee|providelater",
  "relationship": "string",
  "relatedattendeeid": "UUID",
  "eventtitle": "string",
  "person": {
    "first_name": "string",
    "last_name": "string",
    "title": "string",
    "suffix": "string",
    "primary_email": "string",
    "primary_phone": "string",
    "dietary_requirements": "string",
    "special_needs": "string"
  },
  // Mason-specific fields
  "masonic_profile": {
    "rank": "string",
    "masonic_title": "string",
    "grand_officer_status": "string",
    "present_grand_officer_role": "string",
    "past_titles": "string",
    "notes": "string"
  },
  "grandlodge_org_id": "UUID",
  "lodge_org_id": "UUID",
  "lodge_name_number": "string" // Legacy field
}
```

### Ticket Data
```json
{
  "attendee_id": "UUID",
  "event_ticket_id": "UUID",
  "ticket_type": "package|individual",
  "quantity": "number",
  "price_at_assignment": "number",
  "metadata": {
    "package_name": "string",
    "package_description": "string",
    "ticket_name": "string",
    "ticket_description": "string"
  }
}
```

## 2. Registration Wizard Collected Data

### Registration Store State
```typescript
interface RegistrationState {
  draftId: string | null;
  eventId: string | null;
  registrationType: RegistrationType | null;
  attendees: UnifiedAttendeeData[];
  packages: Record<string, PackageSelectionType>;
  billingDetails: BillingDetailsType | null;
  agreeToTerms: boolean;
  status: string;
  lastSaved: number | null;
  error: string | null;
  availableTickets: TicketType[];
  currentStep: number;
  confirmationNumber: string | null;
  draftRecoveryHandled: boolean;
  anonymousSessionEstablished: boolean;
  lodgeTicketOrder: LodgeTicketOrder | null;
}
```

### UnifiedAttendeeData Structure
```typescript
interface UnifiedAttendeeData {
  attendeeId: string;
  attendeeType: 'Mason' | 'Guest';
  isPrimary: boolean;
  isPartner: string | null; // FK to related attendee
  
  // Personal Information
  title: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  primaryPhone: string;
  
  // Preferences
  dietaryRequirements: string;
  specialNeeds: string;
  contactPreference: string;
  
  // Relationships
  relationship: string;
  partner: string | null;
  partnerOf: string | null;
  guestOfId: string | null;
  
  // Mason-specific
  rank?: string;
  suffix?: string; // Grand rank
  lodgeNameNumber?: string;
  lodgeId?: string | null;
  grandLodgeId?: string | null;
  grandOfficerStatus?: string;
  presentGrandOfficerRole?: string;
  otherGrandOfficerRole?: string;
  masonicTitle?: string;
  
  // Organization IDs
  grandLodgeOrganisationId?: string;
  lodgeOrganisationId?: string;
  
  // System fields
  notes?: string;
  useSameLodge?: boolean;
}
```

### Billing Details Structure
```typescript
interface BillingDetailsType {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  businessName?: string;
  businessNumber?: string;
}
```

## 3. Field Mapping Analysis

### Fields RPC Expects but Wizard Doesn't Collect

1. **eventtitle** (attendees table)
   - Purpose: Unknown
   - Current handling: Set to null in transformation
   - Impact: May need to add this field if required

2. **notes** (masonic_profile)
   - Purpose: Additional notes about the mason
   - Current handling: Set to null
   - Impact: Consider adding a notes field to mason form

3. **past_titles** (masonic_profile)
   - Purpose: Historical masonic titles
   - Current handling: Maps from otherGrandOfficerRole
   - Impact: May need clarification on field usage

### Fields Wizard Collects but RPC Doesn't Use

1. **useSameLodge**
   - Purpose: UI convenience flag
   - Current handling: Not sent to RPC
   - Impact: None - UI only

2. **contactConfirmed**
   - Purpose: Unknown
   - Current handling: Not used
   - Impact: Consider removing from model

3. **isCheckedIn**
   - Purpose: Event day tracking
   - Current handling: Not used during registration
   - Impact: None - used post-registration

4. **firstTime**
   - Purpose: First-time attendee flag
   - Current handling: Not collected or used
   - Impact: Consider adding if needed

5. **postNominals**
   - Purpose: Post-nominal titles
   - Current handling: Not collected
   - Impact: Consider adding to mason form

6. **tableAssignment**
   - Purpose: Seating assignment
   - Current handling: Not used during registration
   - Impact: None - assigned later

7. **paymentStatus** (on attendee)
   - Purpose: Individual payment tracking
   - Current handling: Only at registration level
   - Impact: None - tracked at registration level

### Field Name/Format Differences

1. **Contact Preference**
   - Wizard: 'Directly', 'PrimaryAttendee', 'ProvideLater'
   - RPC expects: 'directly', 'primaryattendee', 'providelater'
   - Transformation: toLowerCase() applied

2. **Attendee Type**
   - Wizard: 'Mason', 'Guest'
   - RPC expects: 'mason', 'guest'
   - Transformation: toLowerCase() applied

3. **Email/Phone Fields**
   - Wizard: primaryEmail, primaryPhone
   - RPC person: primary_email, primary_phone
   - Transformation: Field name mapping applied

4. **Masonic Title**
   - Wizard: Stored in 'title' field
   - RPC: Expects in masonic_profile.masonic_title
   - Transformation: Duplicated to both locations

5. **Grand Rank/Suffix**
   - Wizard: Uses 'suffix' for grand rank
   - RPC: Uses person.suffix
   - Transformation: Mapped correctly

6. **Partner Relationships**
   - Wizard: Uses isPartner (FK), partner, partnerOf
   - RPC: Uses relatedattendeeid
   - Transformation: Maps isPartner or partnerOf to relatedattendeeid

## 4. Critical Issues and Recommendations

### High Priority

1. **Missing Event Title**
   - Currently sending null for eventtitle
   - Need to determine if this is required
   - May need to add field to forms

2. **Contact Preference Validation**
   - Ensure lowercase transformation is consistent
   - Add enum validation in forms

3. **Partner Relationship Mapping**
   - Complex logic for partner relationships
   - Need thorough testing of all scenarios

### Medium Priority

1. **Notes Field**
   - Consider adding notes field to mason form
   - Would allow additional context

2. **Past Titles**
   - Clarify difference between otherGrandOfficerRole and past_titles
   - May need separate field

3. **First Time Attendee**
   - Not currently collected
   - Determine if needed for reporting

### Low Priority

1. **Post Nominals**
   - Not critical for registration
   - Could be added later if needed

2. **Field Cleanup**
   - Remove unused fields from UnifiedAttendeeData
   - Simplify data model

## 5. Testing Recommendations

1. **Test All Attendee Types**
   - Primary Mason
   - Additional Mason
   - Guest of Mason
   - Partner of Mason
   - Partner of Guest

2. **Test Contact Preferences**
   - Each option for primary/non-primary
   - Ensure data persists correctly

3. **Test Grand Officer Scenarios**
   - Present Grand Officer with role
   - Present Grand Officer with "Other" role
   - Past Grand Officer

4. **Test Lodge Selection**
   - Direct selection
   - "Use same lodge" option
   - Different grand lodges

5. **Test Billing Details**
   - "Bill to Primary" checkbox
   - Manual entry
   - Country/state selection

## 6. Implementation Notes

- The transformation functions in `/lib/api/registration-rpc.ts` handle most mapping
- Raw registration state is stored in registration_data JSONB for recovery
- Consider adding validation to ensure required RPC fields are present
- May need to update forms to collect missing required fields