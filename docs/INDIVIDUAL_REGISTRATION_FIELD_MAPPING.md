# Individual Registration Field Mapping Analysis

## Overview
This document provides a comprehensive field mapping for the individual registration flow, tracking data from the frontend forms through the API to the database.

## Key Issues Identified

### 1. Raw Registrations Table ID Mismatch
- **Frontend/API expects**: `id` column
- **Database has**: `raw_id` column
- **Impact**: Raw registration logging fails

### 2. Email Field Inconsistencies
- **Frontend sends**: `email` and `mobileNumber`
- **API/RPC expects**: `primaryEmail` and `primaryPhone`
- **Database attendees table has**: Both `email`/`phone` AND `primary_email`/`primary_phone` columns

### 3. Contact Preference Enum Mismatch
- **Frontend sends**: `"directly"`, `"primaryattendee"`, `"providelater"`
- **Database enum**: Expects capitalized `"Directly"`, `"PrimaryAttendee"`, `"ProvideLater"`

## Data Flow Mapping

### 1. Frontend Form Structure

#### Primary Attendee (IndividualsForm.tsx)
```typescript
{
  attendeeId: string,
  attendeeType: 'mason' | 'guest',
  title: string,
  firstName: string,
  lastName: string,
  suffix?: string,
  contactPreference: 'directly' | 'primaryattendee' | 'providelater',
  primaryPhone: string,    // Note: Frontend uses 'primaryPhone'
  primaryEmail: string,    // Note: Frontend uses 'primaryEmail'
  dietaryRequirements: string,
  specialNeeds: string,
  // Mason-specific fields
  masonicTitle?: string,
  rank?: string,
  grandOfficerStatus?: 'Present' | 'Past',
  presentGrandOfficerRole?: string,
  grand_lodge_id?: string,
  lodge_id?: string,
  lodgeNameNumber?: string,
  // Partner fields
  hasPartner?: boolean,
  partner?: string,
  isPartner?: string | null,
  relationship?: string
}
```

#### Billing Details (from ContactInfo.tsx)
```typescript
{
  firstName: string,
  lastName: string,
  emailAddress: string,    // Note: Different field name
  mobileNumber: string,    // Note: Different field name
  billingAddress: {
    addressLine1: string,
    addressLine2?: string,
    city: string,
    state: string,
    postcode: string,
    country: string
  }
}
```

### 2. API Route Transformation (/api/registrations/individuals/route.ts)

The API route receives data and packages it for the RPC function:

```typescript
const rpcData = {
  registrationId: registrationId || undefined,
  functionId,
  eventId,
  eventTitle,
  registrationType: 'individuals',
  primaryAttendee,              // Passed as-is from frontend
  additionalAttendees,          // Array of attendee objects
  tickets,                      // Array of ticket objects
  totalAmount,
  subtotal,
  stripeFee,
  paymentIntentId,
  billingDetails,              // Passed as-is from frontend
  agreeToTerms,
  billToPrimaryAttendee,
  authUserId: user.id,
  paymentCompleted: false
}
```

### 3. RPC Function Mapping (upsert_individual_registration)

The RPC function processes the data and inserts into multiple tables:

#### Raw Registrations Insert
```sql
INSERT INTO raw_registrations (
  registration_id,      -- Note: Function expects 'id' but table has 'raw_id'
  registration_type,
  raw_data,
  processed
)
```

#### Contacts Table Mapping
```sql
INSERT INTO contacts (
  -- Field mappings with fallbacks
  email,           -- Maps from: billingDetails.emailAddress → billingDetails.email → primaryAttendee.email
  mobile_number,   -- Maps from: billingDetails.mobileNumber → billingDetails.phone → primaryAttendee.mobileNumber
  billing_email,   -- Maps from: billingDetails.emailAddress
  billing_phone,   -- Maps from: billingDetails.mobileNumber
  -- Address fields
  billing_street_address,  -- Maps from: billingDetails.billingAddress.addressLine1
  billing_city,           -- Maps from: billingDetails.billingAddress.city
  billing_state,          -- Maps from: billingDetails.billingAddress.state
  billing_postal_code,    -- Maps from: billingDetails.billingAddress.postcode
  billing_country         -- Maps from: billingDetails.billingAddress.country
)
```

#### Attendees Table Mapping
```sql
INSERT INTO attendees (
  -- Contact fields with complex mapping
  primary_email,    -- Maps from: attendee.email → attendee.primaryEmail → billingDetails.emailAddress
  primary_phone,    -- Maps from: attendee.mobileNumber → attendee.phone → attendee.primaryPhone → billingDetails.mobileNumber
  contact_preference,  -- Needs case conversion: 'directly' → 'Directly'
  
  -- New columns added by migration
  suffix_1,         -- Maps from: attendee.suffix1
  suffix_2,         -- Maps from: attendee.suffix2
  suffix_3,         -- Maps from: attendee.suffix3
  attendee_data,    -- Stores complete attendee JSON
  
  -- Legacy columns (still exist)
  email,            -- Duplicate of primary_email
  phone             -- Duplicate of primary_phone
)
```

### 4. Database Schema

#### raw_registrations table
```sql
CREATE TABLE raw_registrations (
  raw_id uuid PRIMARY KEY,     -- Issue: Should be 'id'
  raw_data jsonb NOT NULL,
  created_at timestamp,
  -- Added by migration:
  registration_id uuid,
  registration_type text,
  processed boolean,
  error_message text
)
```

#### attendees table
```sql
CREATE TABLE attendees (
  attendee_id uuid PRIMARY KEY,
  -- Contact fields (duplicated)
  email text,                  -- Legacy field
  phone text,                  -- Legacy field
  primary_email text,          -- New field (migration)
  primary_phone text,          -- New field (migration)
  contact_preference attendee_contact_preference,  -- Enum type
  -- Suffix fields (added by migration)
  suffix_1 text,
  suffix_2 text,
  suffix_3 text,
  -- JSON storage
  attendee_data jsonb,
  -- Other fields...
)
```

## Recommended Fixes

### 1. Fix Raw Registrations Table
```sql
ALTER TABLE raw_registrations RENAME COLUMN raw_id TO id;
```

### 2. Standardize Email/Phone Field Names
- Option A: Update frontend to use `primaryEmail` and `primaryPhone`
- Option B: Update RPC function to handle both field names
- Option C: Add view or computed columns for compatibility

### 3. Fix Contact Preference Enum Handling
- Update RPC function to convert lowercase values to proper case
- Or update frontend to send properly cased values

### 4. Remove Duplicate Columns
- Deprecate `email` and `phone` columns in attendees table
- Use only `primary_email` and `primary_phone`

## Migration Status

### Created Migrations
1. **20250607_010_fix_raw_registrations_id_column.sql**
   - Renames `raw_id` to `id` in raw_registrations table
   - Fixes the immediate error preventing registration logging

2. **20250607_011_fix_field_mapping_issues.sql**
   - Updates upsert_individual_registration RPC function with:
     - Fixed raw_registrations insert to use `id` column
     - Multiple fallbacks for email field mapping (emailAddress → email → primaryEmail)
     - Multiple fallbacks for phone field mapping (mobileNumber → phone → primaryPhone)
     - Automatic case conversion for contact preference enum
     - Populates both legacy and new email/phone columns for compatibility

## Testing Checklist

- [ ] Raw registration logging works correctly
- [ ] Email fields map correctly from frontend to database
- [ ] Phone fields map correctly from frontend to database
- [ ] Contact preference enum values are handled correctly
- [ ] Billing address fields map correctly
- [ ] Suffix fields are saved properly
- [ ] Partner relationships are maintained
- [ ] Payment completion updates work correctly