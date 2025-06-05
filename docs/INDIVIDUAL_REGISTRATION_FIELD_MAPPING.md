# Individual Registration Field Mapping

## Registration Data Fields

| Frontend Field | API Sends | RPC Expects | Database Column | Table | Notes |
|----------------|-----------|-------------|-----------------|-------|-------|
| **Registration Level** |
| registrationId | registrationId | p_registration_data->>'registrationId' | registration_id | registrations | UUID |
| customerId | customerId | p_registration_data->>'authUserId' | customer_id, auth_user_id | registrations | From auth.uid() |
| functionId | functionId | p_registration_data->>'functionId' | function_id | registrations | UUID |
| eventId | eventId | p_registration_data->>'eventId' | event_id | registrations | UUID |
| totalAmount | totalAmount | p_registration_data->>'totalAmount' | total_amount | registrations | Decimal |
| subtotal | subtotal | p_registration_data->>'subtotal' | subtotal | registrations | Decimal |
| stripeFee | stripeFee | p_registration_data->>'stripeFee' | stripe_fee | registrations | Decimal |
| paymentIntentId | paymentIntentId | p_registration_data->>'paymentIntentId' | stripe_payment_intent_id | registrations | String |
| agreeToTerms | agreeToTerms | p_registration_data->>'agreeToTerms' | registration_data->'agreeToTerms' | registrations | Boolean in JSONB |
| billToPrimaryAttendee | billToPrimaryAttendee | p_registration_data->>'billToPrimaryAttendee' | registration_data->'billToPrimaryAttendee' | registrations | Boolean in JSONB |
| - | - | - | registration_type | registrations | Always 'individuals' |
| - | - | - | payment_status | registrations | Enum: pending/completed/failed |
| - | - | - | confirmation_number | registrations | Generated |
| - | - | - | booking_contact_id | registrations | Generated UUID |

## Billing Details Fields

| Frontend Field | API Sends | RPC Expects | Database Column | Table | Notes |
|----------------|-----------|-------------|-----------------|-------|-------|
| billingDetails.firstName | billingDetails.firstName | p_registration_data->'billingDetails'->>'firstName' | first_name | customers, contacts | |
| billingDetails.lastName | billingDetails.lastName | p_registration_data->'billingDetails'->>'lastName' | last_name | customers, contacts | |
| billingDetails.emailAddress | billingDetails.emailAddress | p_registration_data->'billingDetails'->>'emailAddress' | email | customers, contacts | |
| billingDetails.mobileNumber | billingDetails.mobileNumber | p_registration_data->'billingDetails'->>'mobileNumber' | phone (customers), mobile_number (contacts) | customers, contacts | Field name mismatch |
| billingDetails.billingAddress.addressLine1 | billingDetails.billingAddress.addressLine1 | p_registration_data->'billingDetails'->'billingAddress'->>'addressLine1' | billing_street_address | contacts | |
| billingDetails.billingAddress.city | billingDetails.billingAddress.city | p_registration_data->'billingDetails'->'billingAddress'->>'city' | billing_city | contacts | |
| billingDetails.billingAddress.state | billingDetails.billingAddress.state | p_registration_data->'billingDetails'->'billingAddress'->>'state' | billing_state | contacts | |
| billingDetails.billingAddress.postcode | billingDetails.billingAddress.postcode | p_registration_data->'billingDetails'->'billingAddress'->>'postcode' | billing_postal_code | contacts | |
| billingDetails.billingAddress.country | billingDetails.billingAddress.country | p_registration_data->'billingDetails'->'billingAddress'->>'country' | billing_country | contacts | |

## Primary Attendee Fields

| Frontend Field | API Sends | RPC Expects | Database Column | Table | Notes |
|----------------|-----------|-------------|-----------------|-------|-------|
| primaryAttendee.attendeeId | primaryAttendee.attendeeId | - | attendee_id | attendees | Generated in RPC |
| primaryAttendee.attendeeType | primaryAttendee.attendeeType | p_registration_data->'primaryAttendee'->>'attendeeType' | attendee_type | attendees | Enum: 'mason'/'guest', needs lowercase |
| primaryAttendee.firstName | primaryAttendee.firstName | p_registration_data->'primaryAttendee'->>'firstName' | first_name | attendees | |
| primaryAttendee.lastName | primaryAttendee.lastName | p_registration_data->'primaryAttendee'->>'lastName' | last_name | attendees | |
| primaryAttendee.title | primaryAttendee.title | p_registration_data->'primaryAttendee'->>'title' | title | attendees | |
| primaryAttendee.suffix1 | primaryAttendee.suffix1 | p_registration_data->'primaryAttendee'->>'suffix1' | suffix_1 | attendees | |
| primaryAttendee.suffix2 | primaryAttendee.suffix2 | p_registration_data->'primaryAttendee'->>'suffix2' | suffix_2 | attendees | |
| primaryAttendee.suffix3 | primaryAttendee.suffix3 | p_registration_data->'primaryAttendee'->>'suffix3' | suffix_3 | attendees | |
| primaryAttendee.dietaryRequirements | primaryAttendee.dietaryRequirements | p_registration_data->'primaryAttendee'->>'dietaryRequirements' | dietary_requirements | attendees | |
| primaryAttendee.specialNeeds | primaryAttendee.specialNeeds | p_registration_data->'primaryAttendee'->>'specialNeeds' | special_needs | attendees | |
| primaryAttendee.contactPreference | primaryAttendee.contactPreference | p_registration_data->'primaryAttendee'->>'contactPreference' | contact_preference | attendees | Enum: needs lowercase |
| primaryAttendee.email OR primaryAttendee.primaryEmail | Varies | Multiple fallbacks | primary_email | attendees | |
| primaryAttendee.mobileNumber OR primaryAttendee.phone OR primaryAttendee.primaryPhone | Varies | Multiple fallbacks | primary_phone | attendees | |
| - | primaryAttendee (full object) | p_registration_data->'primaryAttendee' | attendee_data | attendees | JSONB |
| - | - | - | is_primary | attendees | Always true for primary |
| - | - | - | registration_id | attendees | From v_registration_id |
| - | - | - | related_attendee_id | attendees | NULL for primary |

## Additional Attendees Fields

| Frontend Field | API Sends | RPC Expects | Database Column | Table | Notes |
|----------------|-----------|-------------|-----------------|-------|-------|
| additionalAttendees[].attendeeType | Same as primary | Same as primary | attendee_type | attendees | Enum: needs lowercase |
| additionalAttendees[].partnerOf | partnerOf | p_registration_data->'additionalAttendees'->>'partnerOf' | related_attendee_id | attendees | UUID reference |
| additionalAttendees[].guestOfId | guestOfId | p_registration_data->'additionalAttendees'->>'guestOfId' | related_attendee_id | attendees | UUID reference |
| (All other fields same as primary attendee) |

## Tickets Fields

| Frontend Field | API Sends | RPC Expects | Database Column | Table | Notes |
|----------------|-----------|-------------|-----------------|-------|-------|
| tickets[].attendeeId | tickets[].attendeeId | p_registration_data->'tickets'->>'attendeeId' | attendee_id | tickets | UUID |
| tickets[].eventId | tickets[].eventId | p_registration_data->'tickets'->>'eventId' | event_id | tickets | UUID |
| tickets[].ticketDefinitionId | tickets[].ticketDefinitionId | p_registration_data->'tickets'->>'ticketDefinitionId' | event_ticket_id | tickets | UUID - field name mismatch |
| tickets[].price | tickets[].price | p_registration_data->'tickets'->>'price' | price_paid | tickets | Decimal |
| - | - | - | registration_id | tickets | From v_registration_id |
| - | - | - | status | tickets | Always 'pending' |
| - | - | - | ticket_number | tickets | Generated |

## Contact Records (Created for attendees with contactPreference='directly')

| Frontend Field | API Sends | RPC Expects | Database Column | Table | Notes |
|----------------|-----------|-------------|-----------------|-------|-------|
| - | - | - | contact_id | contacts | Generated UUID |
| - | - | - | type | contacts | 'individual' or 'customer' |
| Same fields as attendee | - | From attendee data | first_name, last_name, email, mobile_number, etc. | contacts | |
| - | - | - | source_id | contacts | attendee_id |
| - | - | - | source_type | contacts | 'attendee' |

## Raw Registrations Debug Table

| Frontend Field | API Sends | RPC Expects | Database Column | Table | Notes |
|----------------|-----------|-------------|-----------------|-------|-------|
| - | All data | p_registration_data | raw_data | raw_registrations | JSONB |
| - | - | - | raw_id | raw_registrations | Primary key - NOT 'id' |
| - | - | - | registration_id | raw_registrations | UUID |
| - | - | - | registration_type | raw_registrations | 'individuals' |
| - | - | - | processed | raw_registrations | Boolean |
| - | - | - | error_message | raw_registrations | Text |

## Known Issues

1. **Column "id" does not exist** - The raw_registrations table uses `raw_id` as primary key, not `id`. The RPC function line 36 needs to be fixed.
2. **attendee_type enum** - Must be lowercase ('mason', 'guest'), but frontend may send capitalized
3. **contact_preference enum** - Must be lowercase ('directly', 'primaryattendee', etc.)
4. **Field name mismatches**:
   - ticketDefinitionId → event_ticket_id
   - price → price_paid
   - phone → mobile_number (in contacts table)
5. **Multiple fallback fields** for email and phone make debugging complex