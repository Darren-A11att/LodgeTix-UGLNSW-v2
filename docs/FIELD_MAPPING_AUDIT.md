# Individual Registration Field Mapping Audit

## Summary
This document outlines the field mapping issues found between the frontend registration data and the database schema expectations.

## Key Issues Found

### 1. Email Field Mapping
- **Frontend sends**: `billingDetails.emailAddress`
- **Database expects**: `email` (in contacts table)
- **Fix**: Map `emailAddress` → `email` in RPC function

### 2. Phone Field Mapping
- **Frontend sends**: `billingDetails.mobileNumber`
- **Database expects**: `mobile_number` (in contacts table)
- **Fix**: Map `mobileNumber` → `mobile_number`

### 3. Contact Type Field
- **Frontend sends**: No explicit type field
- **Database expects**: `type` (required enum: 'customer', 'attendee', etc.)
- **Fix**: Set appropriate type based on context

## Frontend Data Structure

```javascript
{
  registrationType: "individuals",
  functionId: "uuid",
  primaryAttendee: {
    firstName: "string",
    lastName: "string",
    attendeeType: "mason" | "guest",
    primaryEmail: "string",
    primaryPhone: "string",
    mobileNumber: "string",  // Also used
    contactPreference: "Directly" | "Through Lodge",
    // ... other fields
  },
  billingDetails: {
    firstName: "string",
    lastName: "string",
    emailAddress: "string",  // Note: not 'email'
    mobileNumber: "string",  // Note: not 'mobile_number'
    billingAddress: {
      addressLine1: "string",
      city: "string",
      state: "string",
      postcode: "string",
      country: "string"
    }
  },
  tickets: [...],
  totalAmount: number,
  subtotal: number,
  stripeFee: number
}
```

## Database Schema (contacts table)

```sql
contacts (
  contact_id: uuid PRIMARY KEY,
  type: contact_type NOT NULL,  -- enum: 'customer', 'attendee'
  first_name: text NOT NULL,
  last_name: text NOT NULL,
  email: text NOT NULL,
  mobile_number: text,  -- Note: not 'mobileNumber'
  auth_user_id: uuid,
  billing_email: text,
  billing_phone: text,
  billing_street_address: text,
  billing_city: text,
  billing_state: text,
  billing_postal_code: text,
  billing_country: text,
  -- ... other fields
)
```

## Field Mapping Rules

### Billing Contact (booking_contact_id)
- `type` = 'customer'
- `email` = `billingDetails.emailAddress` || `billingDetails.email` || `primaryAttendee.primaryEmail`
- `mobile_number` = `billingDetails.mobileNumber` || `billingDetails.phone` || `primaryAttendee.primaryPhone`
- `first_name` = `billingDetails.firstName`
- `last_name` = `billingDetails.lastName`

### Attendee Contact (if contactPreference = 'Directly')
- `type` = 'attendee'
- `email` = `attendee.primaryEmail` || `attendee.email`
- `mobile_number` = `attendee.primaryPhone` || `attendee.mobileNumber`
- `first_name` = `attendee.firstName`
- `last_name` = `attendee.lastName`

## Implementations

### Migration Files Created
1. `20250607_007_fix_individual_registration_email_field.sql` - Initial fix attempt
2. `20250607_008_create_raw_registrations_table.sql` - For debugging payloads
3. `20250607_009_fix_individual_registration_contacts_schema.sql` - Comprehensive fix

### API Updates
- Added raw payload logging to `/api/registrations/individuals/route.ts`
- Raw payloads now logged to `raw_registrations` table for debugging

## Testing Recommendations

1. Test individual registration flow end-to-end
2. Verify all fields are properly mapped in the database
3. Check that emails are sent correctly with proper contact details
4. Validate that the raw_registrations table captures all payloads

## Next Steps

1. Apply the migrations in order:
   ```bash
   supabase migration up
   ```

2. Test the registration flow with different scenarios:
   - Guest registration
   - Mason registration
   - Multiple attendees
   - Different contact preferences

3. Monitor the `raw_registrations` table to verify field mapping