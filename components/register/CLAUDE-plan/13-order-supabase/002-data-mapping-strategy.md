# Data Mapping Strategy

## Overview

This document outlines how we'll map data from the client-side registration store to the Supabase database schema. This mapping is essential to ensure proper data transformation before sending to our API endpoint.

## Registration Store to Database Mapping

### Registration Table Mapping

| Registration Store Field | Database Field | Transformation/Notes |
|-------------------------|----------------|----------------------|
| `draftId` | N/A | Not stored in final registration |
| `registrationType` | `registrationType` | Convert to enum: "Individuals", "Groups", or "Officials" |
| N/A | `registrationId` | Generate UUID v4 |
| N/A | `registrationDate` | Current timestamp |
| N/A | `status` | Set to "completed" |
| `paymentStatus.amount` | `totalAmountPaid` | Direct mapping |
| `paymentStatus.status` | `paymentStatus` | Map to enum value |
| `agreeToTerms` | `agreeToTerms` | Direct boolean mapping |
| `paymentStatus.paymentIntentId` | `stripePaymentIntentId` | Direct mapping |
| N/A | `primaryAttendeeId` | Set to ID of attendee where `isPrimary === true` |
| Derived from primary attendee | `customerId` | Look up or create customer record based on primary attendee |

### Attendee Table Mapping

For each attendee in the `attendees` array:

| Registration Store Field | Database Field | Transformation/Notes |
|-------------------------|----------------|----------------------|
| `attendeeId` | `attendeeId` | Direct mapping |
| Reference to registration | `registrationId` | Set to created registration ID |
| `attendeeType` | `attendeeType` | Direct mapping (Mason, Guest, etc.) |
| `isPrimary` | N/A | Used for determining primaryAttendeeId |
| `isPartner` | `isPartner` | Direct mapping |
| `title` | `title` | Direct mapping |
| `firstName` | `firstName` | Direct mapping |
| `lastName` | `lastName` | Direct mapping |
| `lodgeNameNumber` | `lodgeNameNumber` | Direct mapping |
| `primaryEmail` | `primaryEmail` | Direct mapping |
| `primaryPhone` | `primaryPhone` | Direct mapping |
| `dietaryRequirements` | `dietaryRequirements` | Direct mapping |
| `specialNeeds` | `specialNeeds` | Direct mapping |
| `contactPreference` | `contactPreference` | Direct mapping |
| `contactConfirmed` | `contactConfirmed` | Direct mapping |
| `isCheckedIn` | `isCheckedIn` | Default to false |
| `firstTime` | `firstTime` | Direct mapping if Mason |
| `rank` | `rank` | Direct mapping if Mason |
| `postNominals` | `postNominals` | Direct mapping if Mason |
| `grandLodgeId` | `grandLodgeId` | Direct mapping |
| `lodgeId` | `lodgeId` | Direct mapping |
| `partner` | `partner` | Partner attendee ID |
| `partnerOf` | `partnerOf` | Parent attendee ID |
| `guestOfId` | `guestOfId` | Host Mason ID for guests |
| `relationship` | `relationship` | Direct mapping |

### Ticket Assignment Mapping

For each ticket assignment in the packages object:

| Registration Store Field | Database Field | Transformation/Notes |
|-------------------------|----------------|----------------------|
| N/A | `id` | Generate UUID v4 |
| Registration reference | `registration_id` | Set to created registration ID |
| Attendee ID from key | `attendee_id` | Key from packages record |
| `ticketDefinitionId` | `ticket_definition_id` | Direct mapping |
| From ticket data | `price_at_assignment` | Look up price from tickets data |

### VAS Item Mapping (if applicable)

For any value-added services in the order:

| Registration Store Field | Database Field | Transformation/Notes |
|-------------------------|----------------|----------------------|
| N/A | `id` | Generate UUID v4 |
| Registration reference | `registration_id` | Set to created registration ID |
| VAS ID from selection | `vas_id` | From selected VAS |
| `quantity` | `quantity` | Direct mapping |
| From VAS data | `price_at_purchase` | Current price of the VAS |

## Data Validation Strategy

Before sending data to the API, we should implement the following validations:

1. **Required fields check** - Ensure all required fields have values
2. **Type checking** - Ensure all fields have the correct data types
3. **Enum validation** - Ensure fields that use enums have valid values
4. **Relationship integrity** - Ensure all referenced IDs exist
5. **Business rules** - Apply business-specific validation rules

## Error Handling Approach

1. **Client-side validation** - Catch obvious errors before API call
2. **Transactional operations** - Use database transactions to ensure all-or-nothing operations
3. **Detailed error messages** - Return informative error messages to the client
4. **Logging** - Log errors for debugging and monitoring
5. **Recovery options** - Provide guidance for recovering from errors

## Future Considerations

1. **Idempotency** - Implement idempotency to prevent duplicate registrations
2. **Partial saves** - Consider allowing partial saves for large registrations
3. **Asynchronous processing** - For very large registrations, consider async processing
4. **Audit trails** - Implement audit logging for all registration operations