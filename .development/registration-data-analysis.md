# Registration Data Analysis

This document analyzes the data structure produced after a successful payment in the LodgeTix-UGLNSW registration system.

## Overview

When a user completes the registration process and makes a successful payment, the system prepares a `registrationData` object that will be submitted to the backend (Supabase). This data represents the complete record of the registration transaction.

## Data Structure

After payment success, the following data structure is created:

```typescript
const registrationData = {
  registrationType: string,           // "myself-others" | "lodge" | "delegation"
  primaryAttendee: MasonAttendee,     // Primary Mason's details
  additionalAttendees: Attendee[],    // Array of additional attendees (Masons, Guests, Partners)
  tickets: Ticket[],                  // Array of tickets purchased for all attendees
  totalAmount: number,                // Total payment amount
  paymentIntentId: string,            // Stripe Payment Intent ID
  billingDetails: {                   // Billing details used for payment
    ...formValues,                    // All form fields
    country: string,                  // Country ISO code
    stateTerritory: string,           // State/Territory name
  },
}
```

## Detailed Component Analysis

### 1. registrationType
One of three possible values:
- `"myself-others"`: Registering for self and possibly others
- `"lodge"`: Registering on behalf of a lodge
- `"delegation"`: Registering a delegation

### 2. primaryAttendee (MasonAttendee)
```typescript
{
  id: string,                           // Unique identifier
  type: "mason",                        // Type identifier
  firstName: string,                    // First name
  lastName: string,                     // Last name
  masonicTitle: string,                 // "Bro" | "W Bro" | "VW Bro" | "RW Bro" | "MW Bro"
  rank: string,                         // "EAF" | "FCF" | "MM" | "IM" | "GL"
  grandRank?: string,                   // Grand rank if applicable
  grandOfficerStatus?: string,          // "Past" | "Present"
  presentGrandOfficerRole?: string,     // Specific grand officer role if present
  otherGrandOfficerRole?: string,       // Custom role description
  grandLodge: string,                   // Grand Lodge affiliation
  lodgeName: string,                    // Lodge name
  lodgeNumber?: string,                 // Lodge number
  mobile: string,                       // Mobile phone
  email: string,                        // Email address
  dietaryRequirements?: string,         // Dietary requirements
  specialNeeds?: string,                // Special needs/accommodations
  hasPartner: boolean,                  // Whether attending with partner
  partner?: PartnerAttendee,            // Partner details if applicable
  isPrimaryAttendee: true               // Flag for primary attendee
}
```

### 3. additionalAttendees (Array)
Array of additional attendees, which can be of three types:

#### Mason Attendee
```typescript
{
  id: string,                           // Unique identifier
  type: "mason",                        // Type identifier
  /* Same fields as primaryAttendee but with isPrimaryAttendee = false */
  sameLodgeAsPrimary?: boolean,         // Whether from same lodge as primary
}
```

#### Guest Attendee
```typescript
{
  id: string,                           // Unique identifier
  type: "guest",                        // Type identifier
  firstName: string,                    // First name
  lastName: string,                     // Last name
  title: string,                        // Title (Mr, Mrs, etc.)
  contactPreference: string,            // How to contact this guest
  mobile?: string,                      // Mobile phone (optional)
  email?: string,                       // Email (optional)
  dietaryRequirements?: string,         // Dietary requirements
  specialNeeds?: string,                // Special needs/accommodations
  hasPartner: boolean,                  // Whether attending with partner
  partner?: PartnerAttendee             // Partner details if applicable
}
```

#### Partner Attendee
```typescript
{
  id: string,                           // Unique identifier
  type: "partner",                      // Type identifier
  firstName: string,                    // First name
  lastName: string,                     // Last name
  relationship: string,                 // Relationship to main attendee
  title: string,                        // Title (Mr, Mrs, etc.)
  contactPreference: string,            // How to contact this partner
  mobile?: string,                      // Mobile phone (optional)
  email?: string,                       // Email (optional)
  dietaryRequirements?: string,         // Dietary requirements
  specialNeeds?: string,                // Special needs/accommodations
  relatedAttendeeId: string             // ID of related attendee
}
```

### 4. tickets (Array)
```typescript
{
  id: string,                           // Unique identifier
  name: string,                         // Ticket name/description
  price: number,                        // Ticket price
  description: string,                  // Detailed description
  attendeeId: string,                   // ID of attendee this ticket is for
  isPackage?: boolean,                  // Whether this is a package ticket
  includedTicketTypes?: string[]        // Included tickets if it's a package
}
```

### 5. totalAmount
Numeric value representing the total cost of all tickets in dollars.

### 6. paymentIntentId
String identifier from Stripe representing the successful payment transaction.

### 7. billingDetails
```typescript
{
  billToPrimary: boolean,               // Whether billing to primary attendee
  firstName: string,                    // First name
  lastName: string,                     // Last name
  businessName?: string,                // Business name (optional)
  addressLine1: string,                 // Street address
  mobileNumber: string,                 // Mobile phone
  suburb: string,                       // Suburb/City
  postcode: string,                     // Postal code
  emailAddress: string,                 // Email address
  country: string,                      // Country ISO code
  stateTerritory: string                // State/Territory name
}
```

## Stripe Payment Integration

After successful payment, these additional details are stored in the Zustand store:

```typescript
{
  clientSecret: string,                 // Stripe client secret
  paymentIntentId: string,              // Stripe payment intent ID
  paymentMethodId: null,                // Not currently used
  last4: string                         // Display info (e.g., "Billed to: John Smith")
}
```

## Database Considerations

When implementing the backend storage, consider:

1. **Relational Structure**: The data naturally fits a relational model with:
   - Registrations table (main record)
   - Attendees table (linked to registration)
   - Tickets table (linked to attendees)
   - Payment records table

2. **Indexing**: Consider indexing on:
   - Payment intent ID for lookup
   - Attendee email addresses for user searches
   - Lodge information for administrative queries

3. **Sensitive Data**: Ensure proper encryption for:
   - Personal contact information
   - Payment details

## Future Enhancements

Potential improvements to the data structure:

1. **Metadata Field**: Add a flexible metadata field for event-specific data that doesn't fit the standard model

2. **Versioning**: Add a schema version field to support future structure changes

3. **Status Tracking**: Add fields to track registration status (confirmed, canceled, etc.)

4. **Communication Log**: Add structure to track communications with registrants

5. **Related Registrations**: Add support for linking related registrations (family groups, etc.)