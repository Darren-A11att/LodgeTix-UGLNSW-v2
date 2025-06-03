# Lodge Registration Field Mapping Audit

## Database Schema vs Application Field Mapping

### Contacts Table Columns
Based on `supabase/table_definitions/contacts.sql`:

```sql
contact_id (uuid)
title (text)
first_name (text) 
last_name (text)
suffix_1 (text)
suffix_2 (text)
suffix_3 (text)
contact_preference (text)
mobile_number (text)
email (text)
address_line_1 (text)
address_line_2 (text)
suburb_city (text)
state (text)
country (text)
postcode (text)
dietary_requirements (text)
special_needs (text)
type (contact_type)
has_partner (boolean)
is_partner (boolean)
organisation_id (uuid)
auth_user_id (uuid)
billing_organisation_name (varchar)
billing_email (varchar)
billing_phone (varchar)  -- NOT 'phone'!
billing_street_address (varchar)
billing_city (varchar)
billing_state (varchar)
billing_postal_code (varchar)
billing_country (varchar)
stripe_customer_id (varchar)
business_name (text)
source_type (text)
source_id (uuid)
```

### Application Field Names

#### LodgeRegistrationStore (Customer object)
```typescript
title: string
firstName: string
lastName: string
suffix?: string
email: string
mobile: string
phone?: string  // Maps to billing_phone
dietaryRequirements?: string
additionalInfo?: string  // Maps to special_needs
```

#### BookingContactSection Component Mapping
```typescript
// Field mapping in component:
'primaryEmail' -> 'email'
'primaryPhone' -> 'mobile'
```

#### API Route Field Mapping Issues

1. **Incorrect in fallback code**: `phone` -> Should be `billing_phone`
2. **RPC function**: Uses `billing_phone` correctly

### Field Mapping Discrepancies Found

1. **Phone Field**
   - Frontend: `phone`
   - Database: `billing_phone`
   - Status: FIXED in fallback code

2. **Mobile Field**
   - Frontend: `mobile`
   - Database: `mobile_number`
   - Status: NEEDS FIXING

3. **Additional Info Field**
   - Frontend: `additionalInfo`
   - Database: `special_needs`
   - Status: NEEDS FIXING

4. **Address Fields**
   - Frontend: `addressLine1`, `addressLine2`
   - Database: `address_line_1`, `address_line_2`
   - Status: NEEDS FIXING

5. **Suffix Field**
   - Frontend: `suffix`
   - Database: `suffix_1`
   - Status: NEEDS FIXING

6. **Organisation ID Field**
   - Frontend: `organisationId`
   - Database: `organisation_id`
   - Status: NEEDS CHECKING

### Required Updates

1. Update API route to map fields correctly
2. Update RPC function to use correct column names
3. Add billing address fields to the form if needed
4. Ensure all field mappings are consistent