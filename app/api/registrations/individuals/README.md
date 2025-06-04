# Individuals Registration API

This dedicated API endpoint handles all individual registrations, separate from lodge and delegation registrations.

## Endpoints

### POST /api/registrations/individuals
Creates a new individual registration.

**Request Body:**
```json
{
  "functionId": "uuid",
  "eventId": "uuid", // Optional
  "customerId": "auth.uid()",
  "primaryAttendee": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+61412345678",
    "attendeeType": "mason|guest",
    "contactPreference": "directly|primaryattendee|mason|guest|providelater",
    "masonicTitle": "W Bro", // If mason
    "title": "Mr", // If guest
    "rank": "PM|GL|etc",
    "grandRank": "PGM|etc", // If rank is GL
    "grandOfficer": "true|false",
    "grandOffice": "Grand Secretary|etc",
    "lodge_id": "uuid",
    "grand_lodge_id": "uuid",
    "hasPartner": true,
    "dietaryRequirements": "Vegetarian",
    "specialNeeds": "Wheelchair access",
    "isPrimary": true
  },
  "additionalAttendees": [...], // Same structure as primaryAttendee
  "tickets": [
    {
      "attendeeId": "uuid",
      "ticketTypeId": "uuid", // For individual tickets
      "eventId": "uuid",
      "price": 100.00,
      "isFromPackage": false
    },
    {
      "attendeeId": "uuid",
      "packageId": "uuid", // For package tickets
      "isFromPackage": true,
      "price": 250.00
    }
  ],
  "billingDetails": {
    "firstName": "John",
    "lastName": "Doe",
    "emailAddress": "john@example.com",
    "mobileNumber": "+61412345678",
    "businessName": "Optional Business",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4",
    "suburb": "Sydney",
    "stateTerritory": { "name": "NSW", "code": "NSW" },
    "postcode": "2000",
    "country": { "name": "Australia", "code": "AU" }
  },
  "billToPrimaryAttendee": false,
  "totalAmount": 350.00,
  "subtotal": 340.00,
  "stripeFee": 10.00,
  "agreeToTerms": true,
  "registrationId": "uuid" // Optional - for draft recovery
}
```

**Response:**
```json
{
  "success": true,
  "registrationId": "uuid",
  "confirmationNumber": "FUNC-20250107-1234",
  "registrationData": {
    "registration_id": "uuid",
    "confirmation_number": "FUNC-20250107-1234",
    "customer_id": "uuid",
    "booking_contact_id": "uuid",
    "primary_attendee_id": "uuid"
  }
}
```

### PUT /api/registrations/individuals
Updates payment status after successful payment.

**Request Body:**
```json
{
  "registrationId": "uuid",
  "paymentIntentId": "pi_xxx",
  "totalAmountPaid": 350.00
}
```

**Response:**
```json
{
  "success": true,
  "registrationId": "uuid",
  "confirmationNumber": "FUNC-20250107-1234"
}
```

### GET /api/registrations/individuals?registrationId=uuid
Fetches complete registration details from the comprehensive view.

**Response:**
```json
{
  "success": true,
  "registration": {
    "registration_id": "uuid",
    "confirmation_number": "FUNC-20250107-1234",
    "registration_status": "registered",
    "payment_status": "paid",
    "total_attendees": 2,
    "total_tickets": 4,
    "attendees": [...],
    // Full registration data from individuals_registration_complete_view
  }
}
```

## Key Features

1. **Separated Concerns**: Dedicated endpoint for individuals keeps logic separate from lodge/delegation registrations
2. **Comprehensive Data Creation**: Creates records in all required tables:
   - customers (always)
   - contacts (based on contactPreference)
   - attendees (always)
   - masonic_profiles (for masons with contacts)
   - tickets (with package expansion)
   - registrations

3. **Package Expansion**: Automatically expands packages into individual tickets
4. **Contact Preference Handling**: Only creates contacts when preference is 'directly'
5. **Auth User ID Management**: Properly sets auth_user_id for RLS policies

## Database Changes

Uses the `upsert_individual_registration` RPC function which handles all data creation atomically.

## Migration Path

Frontend should update API calls from:
- `/api/registrations` → `/api/registrations/individuals` for individual registrations
- Payment updates can continue using `/api/registrations/[id]/payment` or the new PUT endpoint