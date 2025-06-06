# Comprehensive Field Mapping: Individual Registration Flow

## Overview
This document provides a complete mapping of all fields from the frontend forms through the API layer, RPC function, and finally to the database tables for individual registrations.

## Field Flow Overview

```
Frontend Forms → API Route (route.ts) → RPC Function (upsert_individual_registration) → Database Tables
```

## 1. Frontend Form Fields (What UI Sends)

### Primary Registration Data
```javascript
{
  // Registration metadata
  registrationId: string | null,        // For draft recovery
  functionId: string,                   // UUID
  eventId: string | null,              // UUID
  customerId: string,                   // auth.uid()
  
  // Primary attendee object
  primaryAttendee: {
    attendeeType: 'Mason' | 'Guest',   // Capital case
    firstName: string,
    lastName: string,
    title: string,
    suffix1: string,
    suffix2: string,
    suffix3: string,
    email: string,                      // Primary contact email
    mobileNumber: string,               // Primary contact phone
    dietaryRequirements: string,
    specialNeeds: string,
    contactPreference: 'directly' | 'via-booking-contact',
    hasPartner: boolean,
    // Partner fields if hasPartner is true
    partnerFirstName: string,
    partnerLastName: string,
    partnerTitle: string,
    partnerDietaryRequirements: string,
    partnerSpecialNeeds: string,
    // Mason-specific fields
    lodgeName: string,
    lodgeNumber: string,
    grandLodge: string,
    isGrandOfficer: boolean,
    grandOfficerTitle: string
  },
  
  // Additional attendees array
  additionalAttendees: [{
    attendeeType: 'Mason' | 'Guest' | 'LadyPartner' | 'GuestPartner',
    firstName: string,
    lastName: string,
    title: string,
    suffix1: string,
    suffix2: string,
    suffix3: string,
    email: string | null,
    mobileNumber: string | null,
    dietaryRequirements: string,
    specialNeeds: string,
    contactPreference: 'directly' | 'via-booking-contact',
    isPartner: boolean,
    partnerOf: string,                  // UUID of related attendee
    guestOfId: string,                  // UUID of host attendee
    // Additional fields same as primary
  }],
  
  // Billing details object
  billingDetails: {
    firstName: string,
    lastName: string,
    emailAddress: string,               // Note: 'emailAddress' not 'email'
    mobileNumber: string,               // Note: 'mobileNumber' not 'phone'
    billingAddress: {
      addressLine1: string,
      city: string,
      state: string,
      postcode: string,
      country: string
    }
  },
  
  // Tickets array
  tickets: [{
    attendeeId: string,                 // UUID
    eventId: string,                    // UUID
    ticketDefinitionId: string,         // UUID
    price: number,
    ticketType: string
  }],
  
  // Payment information
  totalAmount: number,
  subtotal: number,
  stripeFee: number,
  paymentIntentId: string | null,
  
  // Flags
  billToPrimaryAttendee: boolean,
  agreeToTerms: boolean
}
```

## 2. API Route Transformation (route.ts)

The API route extracts and validates data, then prepares it for the RPC function:

### Data Extraction
```javascript
const {
  primaryAttendee,
  additionalAttendees = [],
  tickets = [],
  totalAmount = 0,
  subtotal = 0,
  stripeFee = 0,
  paymentIntentId = null,
  billingDetails,
  eventId,
  functionId,
  customerId,
  billToPrimaryAttendee = false,
  agreeToTerms = true,
  registrationId = null
} = data;
```

### RPC Data Preparation
```javascript
const rpcData = {
  registrationId: registrationId,
  functionId,
  eventId: finalEventId,
  eventTitle,                         // Fetched from events table
  registrationType: 'individuals',
  primaryAttendee,                    // Passed as-is
  additionalAttendees,                // Passed as-is
  tickets,                            // Passed as-is
  totalAmount,
  subtotal,
  stripeFee,
  paymentIntentId,
  billingDetails,                     // Passed as-is
  agreeToTerms,
  billToPrimaryAttendee,
  authUserId: user.id,                // From auth
  paymentCompleted: false
};
```

## 3. RPC Function Processing (upsert_individual_registration)

### Input Parameter
```sql
p_registration_data jsonb
```

### Field Extraction and Mapping

#### Registration Fields
```sql
-- Direct extractions
v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
v_customer_id := (p_registration_data->>'authUserId')::uuid;
v_function_id := (p_registration_data->>'functionId')::uuid;
v_payment_status := COALESCE(p_registration_data->>'paymentStatus', 'pending');

-- Generated fields
v_confirmation_number := COALESCE(
    p_registration_data->>'confirmationNumber',
    'IND-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0')
);
```

#### Contact Email/Phone Extraction Logic
```sql
-- For booking contact
v_attendee_email := COALESCE(
    p_registration_data->'billingDetails'->>'emailAddress',  -- Primary source
    p_registration_data->'billingDetails'->>'email',        -- Fallback
    p_registration_data->'primaryAttendee'->>'email',       -- Secondary fallback
    ''
);

v_attendee_phone := COALESCE(
    p_registration_data->'billingDetails'->>'mobileNumber',  -- Primary source
    p_registration_data->'billingDetails'->>'phone',        -- Fallback
    p_registration_data->'primaryAttendee'->>'mobileNumber', -- Secondary fallback
    ''
);
```

## 4. Database Table Mappings

### raw_registrations Table
```sql
INSERT INTO raw_registrations (
    registration_id,         -- v_registration_id
    registration_type,       -- 'individuals'
    raw_data,               -- p_registration_data (full JSON)
    processed               -- false
) 
-- Note: raw_id is auto-generated
-- Returns: raw_id (NOT 'id' - this was the bug!)
```

### customers Table
```sql
INSERT INTO customers (
    customer_id,            -- v_customer_id (authUserId)
    first_name,             -- billingDetails.firstName
    last_name,              -- billingDetails.lastName
    email,                  -- billingDetails.emailAddress
    phone,                  -- billingDetails.mobileNumber
    customer_type,          -- 'booking_contact'::customer_type
    auth_user_id,           -- v_customer_id
    created_at,             -- CURRENT_TIMESTAMP
    updated_at              -- CURRENT_TIMESTAMP
)
```

### contacts Table (Booking Contact)
```sql
INSERT INTO contacts (
    contact_id,             -- gen_random_uuid()
    type,                   -- 'customer'::contact_type
    first_name,             -- billingDetails.firstName
    last_name,              -- billingDetails.lastName
    email,                  -- v_attendee_email (see extraction logic)
    mobile_number,          -- v_attendee_phone (see extraction logic)
    auth_user_id,           -- v_customer_id
    billing_email,          -- v_attendee_email
    billing_phone,          -- v_attendee_phone
    billing_street_address, -- billingDetails.billingAddress.addressLine1
    billing_city,           -- billingDetails.billingAddress.city
    billing_state,          -- billingDetails.billingAddress.state
    billing_postal_code,    -- billingDetails.billingAddress.postcode
    billing_country,        -- billingDetails.billingAddress.country || 'Australia'
    created_at,             -- CURRENT_TIMESTAMP
    updated_at              -- CURRENT_TIMESTAMP
)
```

### registrations Table
```sql
INSERT INTO registrations (
    registration_id,        -- v_registration_id
    customer_id,            -- v_customer_id
    auth_user_id,           -- v_customer_id
    function_id,            -- v_function_id
    event_id,               -- eventId (nullable)
    booking_contact_id,     -- v_booking_contact_id
    registration_type,      -- 'individuals'::registration_type
    confirmation_number,    -- v_confirmation_number
    payment_status,         -- v_payment_status::payment_status
    total_amount,           -- totalAmount || 0
    subtotal,               -- subtotal || 0
    stripe_fee,             -- stripeFee || 0
    stripe_payment_intent_id, -- paymentIntentId
    registration_data,      -- JSON object with billing info
    created_at,             -- CURRENT_TIMESTAMP
    updated_at              -- CURRENT_TIMESTAMP
)
```

### attendees Table
```sql
INSERT INTO attendees (
    attendee_id,            -- gen_random_uuid()
    registration_id,        -- v_registration_id
    attendee_type,          -- LOWER(attendeeType)::attendee_type
    is_primary,             -- true/false
    related_attendee_id,    -- partnerOf || guestOfId (for additional attendees)
    first_name,             -- firstName
    last_name,              -- lastName
    title,                  -- title
    suffix_1,               -- suffix1 (note the underscore in DB)
    suffix_2,               -- suffix2
    suffix_3,               -- suffix3
    dietary_requirements,   -- dietaryRequirements
    special_needs,          -- specialNeeds
    contact_preference,     -- LOWER(contactPreference)::attendee_contact_preference
    primary_email,          -- email || primaryEmail
    primary_phone,          -- mobileNumber || phone || primaryPhone
    attendee_data,          -- Full attendee JSON object
    created_at,             -- CURRENT_TIMESTAMP
    updated_at              -- CURRENT_TIMESTAMP
)
```

### contacts Table (Attendee Contacts)
Created only if `contact_preference = 'directly'` AND has email or phone:

```sql
INSERT INTO contacts (
    contact_id,             -- gen_random_uuid()
    type,                   -- 'individual'::contact_type
    first_name,             -- firstName
    last_name,              -- lastName
    email,                  -- v_attendee_email (from attendee)
    mobile_number,          -- v_attendee_phone (from attendee)
    title,                  -- title
    suffix_1,               -- suffix1
    suffix_2,               -- suffix2
    suffix_3,               -- suffix3
    dietary_requirements,   -- dietaryRequirements
    special_needs,          -- specialNeeds
    contact_preference,     -- LOWER(contactPreference)::attendee_contact_preference
    has_partner,            -- hasPartner || false
    is_partner,             -- isPartner || false
    source_id,              -- attendee_id
    source_type,            -- 'attendee'
    created_at,             -- CURRENT_TIMESTAMP
    updated_at              -- CURRENT_TIMESTAMP
)
```

### tickets Table
```sql
INSERT INTO tickets (
    attendee_id,            -- attendeeId (from ticket object)
    registration_id,        -- v_registration_id
    event_id,               -- eventId (from ticket object)
    event_ticket_id,        -- ticketDefinitionId (from ticket object)
    price_paid,             -- price || 0
    status,                 -- 'pending'::ticket_status
    ticket_number,          -- 'TKT-' || random 6 digits
    created_at,             -- CURRENT_TIMESTAMP
    updated_at              -- CURRENT_TIMESTAMP
)
```

## Key Transformation Notes

### 1. Case Sensitivity
- Frontend sends capital case: `'Mason'`, `'Guest'`
- RPC converts to lowercase: `LOWER(attendeeType)`
- Database expects lowercase enums: `'mason'`, `'guest'`

### 2. Field Name Differences
- Frontend: `emailAddress` → Database: `email`
- Frontend: `mobileNumber` → Database: `phone` or `mobile_number`
- Frontend: `suffix1` → Database: `suffix_1` (with underscore)

### 3. Enum Casting
All enums require explicit casting in the RPC function:
- `v_attendee_type::attendee_type`
- `v_contact_preference::attendee_contact_preference`
- `v_payment_status::payment_status`
- `'individuals'::registration_type`
- `'customer'::contact_type`

### 4. Email/Phone Field Mapping
The RPC function has fallback logic for email/phone fields:
- Primary source: billingDetails
- Secondary source: primaryAttendee
- Different field names accepted: email/primaryEmail, mobileNumber/phone/primaryPhone

### 5. ID Generation
- `registration_id`: Can be provided or auto-generated
- `attendee_id`: Always auto-generated
- `contact_id`: Always auto-generated
- `raw_id`: Auto-generated (NOT 'id' - this was the error!)

### 6. Conditional Logic
- Contacts are only created for attendees with `contact_preference = 'directly'`
- Partner relationships use `partnerOf` field
- Guest relationships use `guestOfId` field

## Common Issues and Solutions

1. **"column 'id' does not exist"**: The raw_registrations table uses `raw_id`, not `id`
2. **Email field not found**: Check for both `emailAddress` and `email` field names
3. **Enum casting errors**: Ensure explicit casting with `::[enum_type]`
4. **Case sensitivity**: Convert attendee types to lowercase before casting
5. **Missing fields**: Use COALESCE with appropriate defaults

## Payment Completion Flow

When `paymentCompleted = true`, the RPC function:
1. Updates existing registration payment status
2. Sets stripe_payment_intent_id
3. Updates total_amount if provided
4. Returns confirmation_number from existing registration
5. Marks raw_registrations entry as processed
