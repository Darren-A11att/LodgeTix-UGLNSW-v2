# Individuals Registration V2 - Product Requirements Document

## Executive Summary
This document outlines the comprehensive requirements for the individuals registration flow, ensuring all necessary data is properly created across all required tables with complete column population.

## Critical Requirements

### 1. Tables to Populate
The registration process must populate the following tables:
- **registrations** - One record per registration
- **customers** - Booking contact (ALWAYS created)
- **contacts** - Booking contact + attendees with contactPreference='directly'
- **attendees** - ALL attendees
- **masonic_profiles** - Mason attendees only
- **tickets** - Individual tickets + expanded package tickets

### 2. Customer Table Logic
- **ALWAYS create customer record** for booking contact
- Even if "bill to primary attendee" is selected
- Customer record gets populated with booking contact details
- `customer_id` in registrations table is FK to customers table (not contacts)

### 3. Package Expansion Requirements
When a package is selected:
- Create individual tickets for EACH event_ticket_id in package's `included_items` array
- Price calculation: `event_ticket.price - (event_ticket.price * package.discount / 100)`
- Each expanded ticket must reference the `package_id`
- Set `is_from_package = true` for package-derived tickets

Expected ticket structure for packages:
```javascript
// Frontend sends this for a package selection:
{
  attendeeId: "uuid",
  ticketTypeId: null, // Not used for packages
  eventId: "uuid", // Optional, will be determined from event_tickets
  isFromPackage: true,
  packageId: "package-uuid",
  price: 250.00 // Total package price
}

// RPC will expand this into multiple tickets based on package.included_items:
// For each item in included_items array:
{
  event_ticket_id: "ticket-type-uuid",
  quantity: 1
}
```

### 4. Contact Creation Logic
- **Only create contact** if `contactPreference = 'directly'`
- Skip contact creation for other preferences ('primaryattendee', 'mason', 'guest', 'providelater')
- Booking contact ALWAYS gets a contact record (regardless of preference)

### 5. Complete Column Population

#### Customers Table
```sql
{
  customer_id: auth.uid(), -- Primary key
  email: billingDetails.emailAddress,
  first_name: billingDetails.firstName,
  last_name: billingDetails.lastName,
  phone: billingDetails.mobileNumber,
  business_name: billingDetails.businessName,
  address_line1: billingDetails.addressLine1,
  address_line2: billingDetails.addressLine2,
  city: billingDetails.suburb,
  state: billingDetails.stateTerritory.name,
  postal_code: billingDetails.postcode,
  country: billingDetails.country.name,
  billing_email: billingDetails.emailAddress,
  billing_phone: billingDetails.mobileNumber,
  billing_organisation_name: billingDetails.businessName,
  billing_street_address: billingDetails.addressLine1,
  billing_city: billingDetails.suburb,
  billing_state: billingDetails.stateTerritory.name,
  billing_postal_code: billingDetails.postcode,
  billing_country: billingDetails.country.name,
  customer_type: 'booking_contact',
  organisation_id: null, -- or lodge org_id if applicable
  contact_id: booking_contact.contact_id, -- FK to contacts
  stripe_customer_id: null, -- populated later
  created_at: now(),
  updated_at: now()
}
```

#### Contacts Table (Booking Contact)
```sql
{
  contact_id: uuid(),
  auth_user_id: auth.uid(), -- ALWAYS for booking contact
  email: billingDetails.emailAddress,
  first_name: billingDetails.firstName,
  last_name: billingDetails.lastName,
  mobile_number: billingDetails.mobileNumber,
  type: 'individual',
  title: billingDetails.title,
  business_name: billingDetails.businessName,
  -- Address fields
  address_line_1: billingDetails.addressLine1,
  address_line_2: billingDetails.addressLine2,
  suburb_city: billingDetails.suburb,
  state: billingDetails.stateTerritory.name,
  postcode: billingDetails.postcode,
  country: billingDetails.country.name,
  -- Billing fields (same as address for booking contact)
  billing_email: billingDetails.emailAddress,
  billing_phone: billingDetails.mobileNumber,
  billing_organisation_name: billingDetails.businessName,
  billing_street_address: billingDetails.addressLine1,
  billing_city: billingDetails.suburb,
  billing_state: billingDetails.stateTerritory.name,
  billing_postal_code: billingDetails.postcode,
  billing_country: billingDetails.country.name,
  -- Other fields
  organisation_id: null,
  stripe_customer_id: null,
  created_at: now(),
  updated_at: now()
}
```

#### Contacts Table (Attendees - only if contactPreference='directly')
```sql
{
  contact_id: uuid(),
  auth_user_id: null, -- Only booking contact gets auth_user_id
  email: attendee.email,
  first_name: attendee.firstName,
  last_name: attendee.lastName,
  mobile_number: attendee.phone,
  type: 'individual',
  title: attendee.attendeeType === 'mason' ? attendee.masonicTitle : attendee.title,
  -- Suffix logic for masons
  suffix_1: attendee.rank === 'GL' ? attendee.grandRank : attendee.rank,
  suffix_2: attendee.rank === 'GL' ? 'Grand Officer' : null,
  suffix_3: attendee.rank === 'GL' ? attendee.grandOffice : null,
  -- Suffix logic for guests
  suffix_1: attendee.isPartner ? attendee.relationship : 'guest',
  suffix_2: attendee.isPartner ? `${partner.firstName} ${partner.lastName}` : null,
  suffix_3: null,
  -- Other fields
  contact_preference: attendee.contactPreference,
  dietary_requirements: attendee.dietaryRequirements,
  special_needs: attendee.specialNeeds,
  has_partner: attendee.hasPartner,
  is_partner: attendee.isPartner,
  organisation_id: attendee.attendeeType === 'mason' ? lodge.organisation_id : null,
  created_at: now(),
  updated_at: now()
}
```

#### Attendees Table (ALL attendees)
```sql
{
  attendee_id: uuid(),
  registration_id: registration.registration_id,
  contact_id: contact?.contact_id || null, -- Only if contact created
  auth_user_id: isPrimary && billToPrimary ? auth.uid() : null, -- NEW FIELD
  attendee_type: attendee.attendeeType,
  first_name: attendee.firstName,
  last_name: attendee.lastName,
  email: contactPreference === 'directly' ? attendee.email : null,
  phone: contactPreference === 'directly' ? attendee.phone : null,
  title: attendee.attendeeType === 'mason' ? attendee.masonicTitle : attendee.title,
  suffix: attendee.rank === 'GL' ? attendee.grandRank : attendee.rank,
  is_primary: attendee.isPrimary,
  has_partner: attendee.hasPartner,
  is_partner: attendee.isPartner ? 'true' : null,
  contact_preference: attendee.contactPreference,
  dietary_requirements: attendee.dietaryRequirements,
  special_needs: attendee.specialNeeds,
  related_attendee_id: attendee.relatedAttendeeId,
  person_id: null,
  event_title: event.title,
  created_at: now(),
  updated_at: now()
}
```

#### Masonic Profiles (Mason attendees only)
```sql
{
  masonic_profile_id: uuid(),
  contact_id: contact.contact_id, -- REQUIRED - must have contact
  masonic_title: attendee.masonicTitle,
  rank: attendee.rank,
  grand_rank: attendee.grandRank,
  grand_officer: attendee.grandOfficer,
  grand_office: attendee.grandOffice,
  lodge_id: attendee.lodge_id,
  grand_lodge_id: attendee.grand_lodge_id,
  created_at: now(),
  updated_at: now()
}
```

#### Tickets Table
```sql
{
  ticket_id: uuid(),
  attendee_id: attendee.attendee_id,
  event_id: ticket.eventId,
  registration_id: registration.registration_id,
  ticket_type_id: ticket.ticketTypeId,
  -- Pricing
  ticket_price: eventTicket.price,
  original_price: eventTicket.price,
  price_paid: isFromPackage ? 
    eventTicket.price - (eventTicket.price * package.discount / 100) : 
    eventTicket.price,
  -- Status fields (initial)
  status: 'reserved',
  ticket_status: 'reserved',
  payment_status: 'unpaid',
  -- Package info
  is_partner_ticket: ticket.isPartnerTicket || false,
  package_id: ticket.packageId || null,
  -- Other fields
  currency: 'AUD',
  seat_info: null,
  checked_in_at: null,
  reservation_id: null,
  reservation_expires_at: null,
  purchased_at: null,
  qr_code_url: null,
  created_at: now(),
  updated_at: now()
}
```

#### Registrations Table
```sql
{
  registration_id: uuid(),
  function_id: functionId,
  customer_id: customer.customer_id, -- FK to customers (not contact_id)
  auth_user_id: auth.uid(),
  registration_type: 'individuals',
  registration_date: now(),
  status: 'pending', -- Changes to 'registered' on payment
  payment_status: 'pending', -- Changes to 'paid' on payment
  total_amount_paid: 0, -- Updated on payment
  total_price_paid: subtotal, -- Order total excluding stripe fee
  subtotal: subtotal,
  stripe_fee: stripeFee,
  includes_processing_fee: stripeFee > 0,
  confirmation_number: 'FUNC-YYYYMMDD-XXXX',
  stripe_payment_intent_id: null, -- Updated on payment
  agree_to_terms: true,
  primary_attendee_id: primaryAttendee.attendee_id,
  organisation_id: null,
  registration_data: [fullRequestData],
  connected_account_id: null,
  platform_fee_amount: null,
  platform_fee_id: null,
  confirmation_pdf_url: null,
  created_at: now(),
  updated_at: now()
}
```

### 6. Payment Success Updates

When payment succeeds, update the following:

#### Registrations Table
- `status`: 'pending' → 'registered'
- `payment_status`: 'pending' → 'paid'
- `total_amount_paid`: totalAmount (including stripe fee)
- `stripe_payment_intent_id`: paymentIntentId
- `updated_at`: now()

#### Tickets Table
- `status`: 'reserved' → 'sold'
- `ticket_status`: 'reserved' → 'sold'
- `payment_status`: 'unpaid' → 'paid'
- `purchased_at`: now()
- `updated_at`: now()

#### Anonymous to Permanent User Conversion
- Convert anonymous auth user to permanent user
- Use customer email from billing details
- Maintain same auth.uid() throughout

Implementation approach:
```sql
-- After successful payment, update auth.users
UPDATE auth.users 
SET 
  email = customer.email,
  email_confirmed_at = NOW(),
  is_anonymous = false
WHERE id = auth.uid() 
  AND is_anonymous = true;
```

Note: This conversion should happen in a separate API endpoint or as part of the payment success webhook to ensure proper error handling and rollback capabilities.

### 7. Database Schema Changes Required

1. **Add auth_user_id to attendees table**:
```sql
ALTER TABLE attendees ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_attendees_auth_user_id ON attendees(auth_user_id);
```

2. **Update registrations table FK**:
```sql
-- Already done according to user
-- customer_id now references customers table instead of contacts
```

### 8. RPC Function Logic Flow

1. **Extract auth_user_id** from parameters
2. **Create Customer Record** (ALWAYS)
3. **Create Booking Contact** in contacts table (ALWAYS)
4. **Process Each Attendee**:
   - Create contact ONLY if contactPreference='directly'
   - Create attendee record (ALWAYS)
   - If mason AND has contact, create masonic profile
   - Set auth_user_id on primary attendee if billToPrimary
5. **Create Registration** with customer_id
6. **Process Tickets**:
   - For regular tickets: create as-is
   - For package tickets: expand and create individual tickets
7. **On Payment Success**:
   - Update all status fields
   - Convert anonymous user to permanent

### 9. Critical Validation Rules

1. **Mason attendees**: Can only have masonic profile if contact exists
2. **Package expansion**: Must calculate discounted price correctly
3. **Contact creation**: Respect contactPreference strictly
4. **auth_user_id**: Only on customer, booking contact, and primary attendee (if applicable)
5. **Status updates**: Must be atomic - all or nothing

### 10. Error Handling

- If contact creation fails for attendee, continue (not critical)
- If customer creation fails, abort entire registration
- If ticket expansion fails, abort entire registration
- Log all errors for debugging

## Implementation Notes

1. **Transaction Safety**: Entire RPC must be wrapped in transaction
2. **Data Consistency**: Use RETURNING clauses to get created IDs
3. **Performance**: Create indexes on all FK relationships
4. **Security**: SECURITY DEFINER on RPC with proper checks
5. **Debugging**: Include detailed logging for each step