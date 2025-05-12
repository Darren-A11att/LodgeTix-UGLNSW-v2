# Test Order Data Analysis

This document contains structured data extracted from the console logs of a test order submission, providing insights for Supabase integration.

## Location Data

The system detects user location automatically for enhanced UX:

```json
{
  "ip": "2401:d002:8e05:5400:147e:3f1f:a490:252a",
  "version": "IPv6",
  "city": "Sydney",
  "region": "New South Wales", 
  "region_code": "NSW",
  "country": "Australia",
  "country_code": "AU"
}
```

## Registration Flow

### Initial State
- Registration type: `individual`
- Draft ID: Generated at the start of the registration process
- Store hydration is confirmed before proceeding

### Validation
- Email validation occurs for the primary attendee: `darren@allatt.me`
- Validation errors array is checked before proceeding to the next step

## Attendee Data

Primary attendee information detected in the validation process:

```json
{
  "attendeeId": "82f76327-01e6-43f3-b9b0-92545eda1510",
  "attendeeType": "mason",
  "isPrimary": true,
  "firstName": "Darren",
  "lastName": "Allatt",
  "contactPreference": "Directly",
  "ticket": {
    "ticketDefinitionId": "complete",
    "selectedEvents": [
      "installation",
      "banquet",
      "brunch",
      "tour"
    ]
  },
  "title": "Bro",
  "rank": "EAF",
  "grandLodgeId": "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
  "lodgeId": "4c1479ba-cbaa-2072-f77a-87882c81f1be",
  "lodgeNameNumber": "The Leichhardt Lodge No. 133",
  "primaryPhone": "610438871124",
  "primaryEmail": "darren@allatt.me"
}
```

## Ticket Selection

The system manages ticket packages and individual tickets with relationship tracking:

### Package Selection
- Package selected: `Complete Package` (ID: `complete`)
- Price: $250
- Included events: 
  - Installation Ceremony (ID: `installation`)
  - Grand Banquet (ID: `banquet`)
  - Farewell Brunch (ID: `brunch`)
  - Sydney Tour (ID: `tour`)

### Other Available Packages
- Ceremony & Banquet (ID: `ceremony-banquet`)
- Social Package (ID: `social`)

## Payment Process

### Billing Details
```json
{
  "name": "Darren Allatt",
  "email": "darren@allatt.me",
  "phone": "0438871124",
  "address": {
    "line1": "8 Mapleleaf Drive",
    "city": "Padstow",
    "state": "New South Wales",
    "postal_code": "2211",
    "country": "AU"
  }
}
```

### Payment Intent
```json
{
  "id": "pi_3RNugMKBASow5NsW0CgLW5ok",
  "status": "succeeded",
  "amount": 250,
  "currency": "aud",
  "created": "2025-05-12T11:38:06.000Z"
}
```

## Final Submission Data

### Complete Registration Object
```json
{
  "registrationId": null,
  "registrationType": "individual",
  "primaryAttendee": {
    "attendeeId": "82f76327-01e6-43f3-b9b0-92545eda1510",
    "attendeeType": "mason",
    "isPrimary": true,
    "firstName": "Darren",
    "lastName": "Allatt",
    "contactPreference": "Directly",
    "ticket": {
      "ticketDefinitionId": "complete",
      "selectedEvents": [
        "installation",
        "banquet",
        "brunch",
        "tour"
      ]
    },
    "title": "Bro",
    "rank": "EAF",
    "grandLodgeId": "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
    "lodgeId": "4c1479ba-cbaa-2072-f77a-87882c81f1be",
    "lodgeNameNumber": "The Leichhardt Lodge No. 133",
    "primaryPhone": "610438871124",
    "primaryEmail": "darren@allatt.me"
  },
  "additionalAttendees": [],
  "tickets": [
    {
      "id": "82f76327-01e6-43f3-b9b0-92545eda1510-complete",
      "name": "Complete Package",
      "price": 250,
      "attendeeId": "82f76327-01e6-43f3-b9b0-92545eda1510",
      "isPackage": true,
      "description": "Package: Complete Package"
    }
  ],
  "totalAmount": 250,
  "paymentIntentId": "pi_3RNugMKBASow5NsW0CgLW5ok",
  "billingDetails": {
    "billToPrimary": false,
    "firstName": "Darren",
    "lastName": "Allatt",
    "businessName": "",
    "addressLine1": "8 Mapleleaf Drive",
    "mobileNumber": "0438871124",
    "suburb": "Padstow",
    "postcode": "2211",
    "emailAddress": "darren@allatt.me",
    "country": "AU",
    "stateTerritory": "New South Wales"
  }
}
```

### Confirmation
- Registration successful
- Confirmation number generated: `SUPA-23232`

## Key Functionality Requirements for Supabase

1. **Location Detection**
   - Store user's detected location (country, region)
   - Use location to filter relevant Grand Lodges/Lodges

2. **Caching**
   - Country and region caches for Grand Lodges
   - Lodges by region for faster loading

3. **Registration Draft Management**
   - Create and update draft registrations with unique IDs
   - Auto-save functionality for forms

4. **Ticket Package Management**
   - Package selection should automatically handle included tickets
   - Handle ticket relationship logic (packages vs. individual events)

5. **Payment Processing**
   - Integration with Stripe payment intents
   - Secure handling of payment confirmation
   - Updating registration status based on payment result

6. **Confirmation Generation**
   - Generate unique confirmation numbers
   - Update registration status after successful payment

7. **Data Relationships**
   - Maintain references between attendees, tickets, and registrations
   - Handle primary/related attendee relationships

## Implementation Notes

1. **Data Model Requirements**
   - All IDs should be UUIDs (consistent with frontend implementation)
   - Store timestamps for created/updated times
   - Use enums for status fields and attendee types

2. **Background Processes**
   - Location detection services on initial load
   - Caching frequently accessed data (Grand Lodges, Lodges)
   - Draft auto-save for registration data

3. **API Structure**
   - Separate endpoints for attendees, tickets, and registrations
   - Endpoint for payment confirmation
   - Caching mechanism for location-specific reference data

4. **Real-time Features**
   - Registration draft updates
   - Ticket availability updates
   - Payment status changes