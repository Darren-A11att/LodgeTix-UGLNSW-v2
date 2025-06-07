-- Basic test of the comprehensive individual registration RPC
-- This can be run directly in the Supabase SQL editor

-- Test data for individual registration with attendees and tickets
SELECT public.upsert_individual_registration(
  jsonb_build_object(
    'registrationId', gen_random_uuid(),
    'authUserId', gen_random_uuid(), 
    'functionId', (SELECT function_id FROM functions LIMIT 1),
    'eventTitle', 'Test Individual Registration',
    'eventId', gen_random_uuid(),
    'totalAmount', 250.75,
    'subtotal', 225.00,
    'stripeFee', 25.75,
    'agreeToTerms', true,
    'billToPrimaryAttendee', false,
    'billingDetails', jsonb_build_object(
      'firstName', 'John',
      'lastName', 'Smith',
      'emailAddress', 'john.smith@test.com',
      'mobileNumber', '+61400123456',
      'billingAddress', jsonb_build_object(
        'addressLine1', '123 Test Street',
        'city', 'Sydney',
        'state', 'NSW',
        'postcode', '2000',
        'country', 'Australia'
      )
    ),
    'attendees', jsonb_build_array(
      jsonb_build_object(
        'isPrimary', true,
        'attendeeType', 'mason',
        'firstName', 'John',
        'lastName', 'Smith',
        'title', 'Mr',
        'suffix', 'PM',
        'email', 'john.smith@test.com',
        'primaryEmail', 'john.smith@test.com',
        'phone', '+61400123456',
        'primaryPhone', '+61400123456',
        'contactPreference', 'directly',
        'dietaryRequirements', 'No dairy',
        'specialNeeds', 'Wheelchair access',
        'hasPartner', true,
        'rank', 'Past Master',
        'grand_lodge_id', gen_random_uuid(),
        'lodge_id', gen_random_uuid(),
        'lodgeNameNumber', 'Lodge Test No. 123',
        'grandOfficerStatus', 'current',
        'presentGrandOfficerRole', 'Deputy Grand Master'
      ),
      jsonb_build_object(
        'isPrimary', false,
        'isPartner', true,
        'attendeeType', 'guest',
        'firstName', 'Jane',
        'lastName', 'Smith',
        'title', 'Mrs',
        'email', 'jane.smith@test.com',
        'primaryEmail', 'jane.smith@test.com',
        'phone', '+61400123457',
        'contactPreference', 'through_primary',
        'dietaryRequirements', 'Vegetarian'
      )
    ),
    'tickets', jsonb_build_array(
      jsonb_build_object(
        'attendeeId', gen_random_uuid(),
        'eventTicketId', gen_random_uuid(),
        'ticketDefinitionId', gen_random_uuid(),
        'price', 125.00,
        'type', 'individual'
      ),
      jsonb_build_object(
        'attendeeId', gen_random_uuid(),
        'eventTicketId', gen_random_uuid(),
        'ticketDefinitionId', gen_random_uuid(),
        'price', 125.00,
        'type', 'partner'
      )
    ),
    'enhancedPricing', jsonb_build_object(
      'resolvedFromDatabase', true,
      'ticketPriceResolver', 'v1.0',
      'priceValidation', jsonb_build_object(
        'isValid', true,
        'totalValue', 250.00,
        'zeroTickets', jsonb_build_array()
      )
    ),
    'zustandStoreState', jsonb_build_object(
      'registrationStore', jsonb_build_object(
        'currentStep', 'payment',
        'completedSteps', jsonb_build_array('registration-type', 'attendee-details', 'ticket-selection', 'order-review'),
        'isValid', true
      ),
      'capturedAt', now(),
      'version', '2.0.0'
    )
  )
) AS test_result;