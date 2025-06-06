# Comprehensive Field Mapping: Lodge Registration Flow

## Overview
This document provides a complete mapping of all fields from the frontend forms through the API layers, RPC function, and finally to the database tables for lodge registrations.

## Field Flow Overview

```
Frontend Forms → LodgeRegistrationStep → New API Route → upsert_lodge_registration RPC → Database Tables
                                      ↓
                          Legacy API Route (deprecated)
```

## 1. Frontend Form Fields (What UI Sends)

### From LodgeRegistrationStep.tsx
```javascript
{
  // Core package data
  functionId: string,                    // UUID
  functionSlug: string,                  // For navigation only
  packageId: string,                     // UUID from selected package
  tableCount: number,                    // Number of packages/tables
  
  // Calculated amounts (in cents)
  amount: number,                        // Total amount including fees
  subtotal: number,                      // Subtotal before fees
  stripeFee: number,                     // Processing fee amount
  
  // Payment data
  paymentMethodId: string,               // Stripe payment method
  
  // Billing details (from CheckoutForm)
  billingDetails: {
    title: string,
    firstName: string,
    lastName: string,
    emailAddress: string,
    mobileNumber: string,
    phone: string,
    addressLine1: string,
    suburb: string,
    stateTerritory: { name: string },
    postcode: string,
    country: { isoCode: string },
    businessName: string                 // Lodge name
  },
  
  // Booking contact (from LodgesForm → useLodgeRegistrationStore)
  bookingContact: {
    email: string,
    firstName: string,
    lastName: string,
    title: string,
    mobile: string,
    phone: string,
    addressLine1: string,
    addressLine2: string,
    suburb: string,
    postcode: string,
    stateTerritory: string,
    country: { code: string, name: string },
    businessName: string,                // Lodge name
    dietaryRequirements: string,
    additionalInfo: string               // Special needs
  },
  
  // Lodge details (from LodgesForm → useLodgeRegistrationStore)
  lodgeDetails: {
    lodgeName: string,
    lodge_id: string,                    // UUID
    organisation_id: string,             // UUID
    grand_lodge_id: string,              // UUID
    lodgeNumber: string                  // Optional
  }
}
```

### From LodgesForm.tsx Store Data
```javascript
// useLodgeRegistrationStore provides:
{
  customer: {
    title: string,
    firstName: string,
    lastName: string,
    email: string,
    mobile: string,
    phone: string,
    dietaryRequirements: string,
    specialNeeds: string
  },
  
  lodgeDetails: {
    grand_lodge_id: string,              // UUID
    lodge_id: string,                    // UUID
    lodgeName: string,
    organisation_id: string              // UUID from lodge selection
  },
  
  tableOrder: {
    packageCount: number,
    totalTickets: number,
    totalPrice: number
  }
}

// useRegistrationStore provides:
{
  lodgeTicketOrder: {
    tableCount: number,                  // Same as packageCount
    totalTickets: number,                // tableCount * baseQuantity
    galaDinnerTickets: number,           // Same as totalTickets
    ceremonyTickets: number,             // Same as totalTickets
    eventId: string,                     // First event UUID
    galaDinnerEventId: string,           // Gala dinner event UUID
    ceremonyEventId: string              // Ceremony event UUID
  }
}
```

## 2. API Route Transformations

### New API Route (`/api/functions/[functionId]/packages/[packageId]/lodge-registration`)

The new route directly receives structured data from the frontend:

```javascript
// Direct extraction - minimal transformation
const {
  tableCount,
  bookingContact,                        // Passed as-is
  lodgeDetails,                          // Passed as-is
  paymentMethodId,
  amount,                                // In cents
  subtotal,                              // In cents
  stripeFee,                             // In cents
  billingDetails,                        // Passed as-is
  registrationId,                        // Optional for updates
} = body;
```

### Legacy API Route (`/api/registrations/lodge`) - DEPRECATED

The legacy route has different field mapping:

```javascript
const {
  functionId,
  packageId,
  tableCount = 1,
  lodgeDetails,
  billingDetails,
  totalAmount = 0,
  subtotal = 0,
  stripeFee = 0,
  paymentIntentId = null,
  customerId,                            // From auth
  agreeToTerms = true,
  registrationId = null
} = data;

// Transforms booking contact
const bookingContact = {
  email: billingDetails.emailAddress,
  firstName: billingDetails.firstName,
  lastName: billingDetails.lastName,
  title: billingDetails.title,
  mobile: billingDetails.mobileNumber,
  phone: billingDetails.phone,
  addressLine1: billingDetails.addressLine1,
  addressLine2: billingDetails.addressLine2,
  suburb: billingDetails.suburb,
  postcode: billingDetails.postcode,
  stateTerritory: billingDetails.stateTerritory,
  country: billingDetails.country || { code: 'AU', name: 'Australia' },
  businessName: lodgeDetails.lodgeName,
  dietaryRequirements: billingDetails.dietaryRequirements,
  additionalInfo: billingDetails.specialNeeds
};
```

## 3. RPC Function Processing (upsert_lodge_registration)

### Input Parameters
```sql
p_function_id uuid,
p_package_id uuid,
p_table_count integer,
p_booking_contact jsonb,
p_lodge_details jsonb,
p_payment_status text DEFAULT 'pending',
p_stripe_payment_intent_id text DEFAULT NULL,
p_registration_id uuid DEFAULT NULL,
p_total_amount numeric DEFAULT 0,
p_subtotal numeric DEFAULT 0,
p_stripe_fee numeric DEFAULT 0,
p_metadata jsonb DEFAULT NULL
```

### Field Extraction and Processing

#### Customer ID Resolution
```sql
v_customer_id := COALESCE(
    auth.uid(),                          -- Current auth session
    (p_booking_contact->>'authUserId')::uuid  -- From booking contact
);
```

#### Organisation Details Extraction
```sql
v_organisation_id := (p_lodge_details->>'lodge_id')::uuid;
v_organisation_name := p_lodge_details->>'lodgeName';
v_organisation_number := p_lodge_details->>'lodgeNumber';
```

#### Attendee Count Calculation
```sql
v_total_attendees := p_table_count * 10;  -- Fixed 10 attendees per table
```

## 4. Database Table Mappings

### raw_payloads Table (Legacy Route Only)
```sql
INSERT INTO raw_payloads (
    raw_data,                            -- Full JSON payload
    created_at                           -- Timestamp
)
-- Note: raw_id is auto-generated
```

### customers Table
```sql
INSERT INTO customers (
    customer_id,                         -- v_customer_id (auth.uid())
    customer_type,                       -- 'booking_contact'
    first_name,                          -- p_booking_contact->>'firstName'
    last_name,                           -- p_booking_contact->>'lastName'
    email,                               -- p_booking_contact->>'email'
    phone,                               -- p_booking_contact->>'mobile'
    business_name,                       -- p_lodge_details->>'lodgeName'
    business_number,                     -- p_lodge_details->>'lodgeNumber'
    created_at,                          -- now()
    updated_at                           -- now()
)
```

### registrations Table
```sql
INSERT INTO registrations (
    registration_id,                     -- v_registration_id (provided or generated)
    function_id,                         -- p_function_id
    customer_id,                         -- v_customer_id
    auth_user_id,                        -- v_customer_id
    organisation_id,                     -- v_organisation_id (lodge_id)
    organisation_name,                   -- v_organisation_name
    organisation_number,                 -- v_organisation_number
    primary_attendee,                    -- JSON object with booking contact details
    attendee_count,                      -- v_total_attendees (tables * 10)
    registration_type,                   -- 'lodge'
    status,                              -- 'pending'
    payment_status,                      -- p_payment_status
    stripe_payment_intent_id,            -- p_stripe_payment_intent_id
    registration_date,                   -- now()
    agree_to_terms,                      -- p_booking_contact->>'agreeToTerms' || true
    total_amount_paid,                   -- p_total_amount
    total_price_paid,                    -- p_total_amount
    subtotal,                            -- p_subtotal
    stripe_fee,                          -- p_stripe_fee
    includes_processing_fee,             -- p_stripe_fee > 0
    created_at,                          -- now()
    updated_at,                          -- now()
    confirmation_number,                 -- NULL (generated by edge function)
    registration_data                    -- JSONB with all details
)
```

#### Primary Attendee JSON Structure
```sql
primary_attendee := jsonb_build_object(
    'firstName', p_booking_contact->>'firstName',
    'lastName', p_booking_contact->>'lastName',
    'email', p_booking_contact->>'email',
    'mobile', p_booking_contact->>'mobile',
    'dietaryRequirements', p_booking_contact->>'dietaryRequirements',
    'additionalInfo', p_booking_contact->>'additionalInfo'
)
```

#### Registration Data JSON Structure
```sql
registration_data := jsonb_build_object(
    'bookingContact', p_booking_contact,
    'lodgeDetails', p_lodge_details,
    'packageId', p_package_id,
    'tableCount', p_table_count,
    'metadata', p_metadata               -- Contains billingDetails, amounts
)
```

### organisations Table (Reference Only)
Lodge details reference existing records:
```sql
-- Lodge selection provides:
organisation_id                          -- From lodges table
organisation_name                        -- Lodge name
organisation_number                      -- Lodge number
```

### packages Table (Reference Only)
Package selection provides:
```sql
-- Package data includes:
package_id                               -- UUID
package_price                            -- Price per package
qty                                      -- Base quantity (10 for lodges)
eligible_registration_types              -- Must include 'lodges'
```

## Key Transformation Notes

### 1. Payment Processing Flow
- **New Route**: Processes Stripe payment inline before registration
- **Legacy Route**: Creates registration first, then processes payment separately

### 2. Field Name Consistency
- Frontend uses camelCase: `emailAddress`, `mobileNumber`
- Database uses snake_case: `email`, `phone`, `mobile_number`
- RPC function handles the transformation

### 3. Amount Handling
- Frontend sends amounts in cents (e.g., 195000 for $1950)
- RPC function receives amounts in dollars (e.g., 1950.00)
- New route converts: `amount / 100`

### 4. Lodge vs Organisation
- Frontend uses "lodge" terminology
- Database uses "organisation" for the entity
- `lodge_id` maps to `organisation_id` in registrations table

### 5. Attendee Count
- Not directly provided by frontend
- Calculated as: `table_count * 10` (fixed ratio)

### 6. Confirmation Number
- Set to NULL in RPC function
- Generated by edge function after payment completion
- Format: `LDG-[6 digits][2 letters]`

## Common Issues and Solutions

1. **Missing lodge_id**: Ensure lodge selection completes before submission
2. **Auth failures**: New route creates anonymous session if needed
3. **Package eligibility**: Filter packages where `eligible_registration_types` includes 'lodges'
4. **Stripe Connect**: New route handles connected accounts and platform fees
5. **Field name mismatches**: Use exact field names from this document

## Payment Completion Flow

When updating after payment:
1. Only `payment_status` and `stripe_payment_intent_id` are updated
2. Other fields remain unchanged
3. Status changes from 'pending' to 'completed'
4. Confirmation number generation triggered by database webhook

## Deprecated vs Active Routes

### Active Route (Recommended)
- Path: `/api/functions/[functionId]/packages/[packageId]/lodge-registration`
- Integrated payment processing
- Better error handling
- Stripe Connect support

### Legacy Route (Deprecated)
- Path: `/api/registrations/lodge`
- Separate payment step required
- Uses raw_payloads for debugging
- Will be removed in future version