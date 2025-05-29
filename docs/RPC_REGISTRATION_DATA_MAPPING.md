# RPC vs Registration Wizard Data Mapping

## Overview
This document maps the data collected by the registration wizard against what the RPC function expects, identifying gaps and differences.

## 1. Registration Level Data

### RPC Expects (registration_data)
```typescript
{
  registration_id: string (UUID)
  customer_id: string (UUID)
  event_id: string (UUID)
  registration_type: 'individuals' | 'groups' | 'officials' | 'lodge' | 'delegation'
  status: string ('unpaid')
  payment_status: 'pending' | 'completed' | 'failed' | 'requires_action'
  total_amount_paid: number
  agree_to_terms: boolean
  registration_data: Json[] // Array of JSON objects
}
```

### Wizard Collects
```typescript
{
  registrationType: 'individual' | 'lodge' | 'delegation' 
  agreeToTerms: boolean
  eventId: string
  draftId?: string
  lodgeTicketOrder?: any
  billingDetails: BillingDetailsType
}
```

### Gaps:
- **registration_type**: Wizard uses different values ('individual' vs 'individuals')
- **registration_data**: Expects array but wizard sends single object (FIXED)
- **total_amount_paid**: Calculated from tickets, not directly collected

## 2. Attendee Level Data

### RPC Expects (attendees_data)
```typescript
{
  attendeeid: string
  attendeetype: 'mason' | 'guest' | 'ladypartner' | 'guestpartner'
  isPrimary: boolean
  isPartner: boolean
  dietaryrequirements: string | null
  specialneeds: string | null
  contactpreference: 'directly' | 'primaryattendee' | 'providelater'
  relationship: string | null
  relatedattendeeid: string | null
  eventtitle: string | null // ❌ NOT COLLECTED
  
  // Person data
  person: {
    first_name: string
    last_name: string
    title: string | null
    suffix: string | null
    primary_email: string | null
    primary_phone: string | null
    dietary_requirements: string | null
    special_needs: string | null
  }
  
  // Mason-specific
  masonic_profile?: {
    rank: string | null
    masonic_title: string | null
    grand_officer_status: string | null
    present_grand_officer_role: string | null
    past_titles: string | null // ⚠️ PARTIAL - mapped from otherGrandOfficerRole
    notes: string | null // ❌ NOT COLLECTED
  }
  
  grandlodge_org_id: string | null
  lodge_org_id: string | null
  lodge_name_number: string | null
}
```

### Wizard Collects (UnifiedAttendeeData)
```typescript
{
  attendeeId: string
  attendeeType: 'Mason' | 'Guest' // Note: PascalCase
  isPrimary: boolean
  isPartner?: string | null // FK to parent attendee
  partner?: string | null // FK to partner attendee
  partnerOf?: string | null // Alternative field
  
  // Basic info
  title: string
  firstName: string
  lastName: string
  suffix?: string
  
  // Contact
  primaryEmail: string
  primaryPhone: string
  contactPreference: 'Directly' | 'PrimaryAttendee' | 'ProvideLater' // Note: PascalCase
  
  // Additional
  dietaryRequirements?: string
  specialNeeds?: string
  relationship?: string
  
  // Mason-specific
  masonicTitle?: string
  rank?: string
  grandOfficerStatus?: 'Present' | 'Past'
  presentGrandOfficerRole?: string
  otherGrandOfficerRole?: string // Maps to past_titles
  grandLodgeId?: string
  lodgeId?: string
  lodgeNameNumber?: string
  
  // UI-only fields (not sent to RPC)
  useSameLodge?: boolean // ✅ UI ONLY
  contactConfirmed?: boolean // ✅ NOT USED
  isCheckedIn?: boolean // ✅ POST-REGISTRATION
  firstTime?: boolean // ❓ POTENTIALLY USEFUL
  postNominals?: string // ❌ NOT COLLECTED
  notes?: string // ❌ NOT COLLECTED
}
```

### Key Differences:
1. **eventtitle**: RPC expects this but wizard doesn't collect it
2. **notes**: RPC expects in masonic_profile but not collected
3. **Field name case**: 
   - contactPreference needs lowercase transformation
   - attendeeType needs lowercase transformation
4. **Email/Phone field names**: primaryEmail vs primary_email
5. **Partner relationships**: Complex mapping between isPartner/partner/partnerOf

## 3. Ticket Level Data

### RPC Expects (tickets_data)
```typescript
{
  attendee_id: string
  event_ticket_id: string
  ticket_type: 'package' | 'individual'
  quantity: number
  price_at_assignment: number
  metadata: {
    package_name?: string
    package_description?: string
    ticket_name?: string
    ticket_description?: string
  }
}
```

### Wizard Collects (packages)
```typescript
Record<string, {
  ticketDefinitionId?: string // Package ID
  selectedEvents: string[] // Individual ticket IDs
}>
```

### Transformation:
- Wizard's package structure is transformed into individual ticket records
- Package selections create one ticket record
- Individual selections create multiple ticket records

## 4. Additional Data

### Billing Details (Wizard Only)
```typescript
{
  billToPrimary: boolean
  emailAddress: string
  firstName: string
  lastName: string
  mobileNumber: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}
```
- Stored in registration_data array but not directly used by RPC

### Lodge Ticket Order (Lodge registrations only)
```typescript
{
  lodgeId: string
  ticketAssignments: Record<string, string>
}
```
- Stored in registration_data but not processed by RPC

## Recommendations

### High Priority Fixes:
1. **eventtitle**: Determine if this is required and where it comes from
2. **Case transformations**: Ensure all enums are lowercase before sending to RPC
3. **Partner relationships**: Test the mapping logic thoroughly

### Medium Priority:
1. **notes field**: Add to Mason form if needed for additional information
2. **past_titles**: Clarify if this is the same as otherGrandOfficerRole
3. **firstTime flag**: Determine if this should be collected

### Low Priority:
1. **postNominals**: Add if needed for certificates/reporting
2. **Remove unused fields**: Clean up data model for fields not used

## Transformation Functions Location
All transformations happen in `/lib/api/registration-rpc.ts`:
- `transformToRPCRegistrationData()`
- `transformToRPCAttendeesData()`
- `transformToRPCTicketsData()`

These functions handle the mapping between wizard format and RPC format.