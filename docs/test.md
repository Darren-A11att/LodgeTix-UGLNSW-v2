[Middleware] Processing API route: POST /api/registrations/individuals
[updateSession] POST /api/registrations/individuals
[updateSession] Auth cookies present: false
[updateSession] Skipping auth check for public route: /api/registrations/individuals
[updateSession] Completed for http://localhost:3001/api/registrations/individuals
📝 Individuals Registration API
  Received registration data: {
    "registrationType": "individual",
    "functionId": "eebddef5-6833-43e3-8d32-700508b1c089",
    "functionSlug": "grand-proclamation-2025",
    "selectedEvents": [],
    "eventId": "e842bdb2-aff8-46d8-a347-bf50840fff13",
    "primaryAttendee": {
      "attendeeId": "01974831-7b99-71bd-b12a-0456dc127d5f",
      "attendeeType": "mason",
      "isPrimary": true,
      "isPartner": null,
      "title": "W Bro",
      "firstName": "1221pm",
      "lastName": "Sat7June",
      "lodgeNameNumber": "The Leichhardt Lodge No. 133",
      "primaryEmail": "1221pmsat7june@allatt.me",
      "primaryPhone": "0438 871 124",
      "dietaryRequirements": "",
      "specialNeeds": "",
      "contactPreference": "Directly",
      "contactConfirmed": false,
      "isCheckedIn": false,
      "firstTime": false,
      "rank": "GL",
      "postNominals": "",
      "grand_lodge_id": "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
      "lodge_id": "4c1479ba-cbaa-2072-f77a-87882c81f1be",
      "tableAssignment": null,
      "notes": "",
      "paymentStatus": "pending",
      "relationship": "",
      "partner": null,
      "partnerOf": null,
      "guestOfId": null,
      "updatedAt": "2025-06-07T02:22:13.093Z",
      "suffix": "PSGW",
      "grandOfficerStatus": "Present",
      "presentGrandOfficerRole": "Grand Director of Ceremonies",
      "otherGrandOfficerRole": "",
      "grandLodgeOrganisationId": "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
      "lodgeOrganisationId": "4c1479ba-cbaa-2072-f77a-87882c81f1be"
    },
    "additionalAttendees": [],
    "tickets": [
      {
        "id": "01974831-7b99-71bd-b12a-0456dc127d5f-d586ecc1-e410-4ef3-a59c-4a53a866bc33",
        "attendeeId": "01974831-7b99-71bd-b12a-0456dc127d5f",
        "eventTicketId": "d586ecc1-e410-4ef3-a59c-4a53a866bc33",
        "isPackage": false,
        "price": 0
      },
      {
        "id": "01974831-7b99-71bd-b12a-0456dc127d5f-7196514b-d4b8-4fe0-93ac-deb4c205dd09",
        "attendeeId": "01974831-7b99-71bd-b12a-0456dc127d5f",
        "eventTicketId": "7196514b-d4b8-4fe0-93ac-deb4c205dd09",
        "isPackage": false,
        "price": 0
      }
    ],
    "totalAmount": 0,
    "billingDetails": {
      "billToPrimary": true,
      "firstName": "1221pm",
      "lastName": "Sat7June",
      "emailAddress": "1221pmsat7june@allatt.me",
      "mobileNumber": "0438 871 124",
      "addressLine1": "100 Harris Street",
      "businessName": "",
      "suburb": "Chiswick",
      "postcode": "2046",
      "stateTerritory": {
        "id": 3909,
        "name": "New South Wales",
        "isoCode": "NSW",
        "countryCode": "AU"
      },
      "country": {
        "name": "Australia",
        "isoCode": "AU",
        "id": 14
      }
    },
    "customerId": "7e9a6303-0a11-4876-bfdb-f1c245995029"
  }
  Frontend form data logged to raw_registrations table
  ⚠️ No complete Zustand store state provided - capturing only API payload
  Auth header present: true
  Attempting authentication with Authorization header
  Successfully authenticated with Authorization header: 7e9a6303-0a11-4876-bfdb-f1c245995029
  Found event title: Meet & Greet Cocktail Party
  Calling upsert_individual_registration RPC with data: {
    "registrationId": null,
    "functionId": "eebddef5-6833-43e3-8d32-700508b1c089",
    "eventId": "e842bdb2-aff8-46d8-a347-bf50840fff13",
    "eventTitle": "Meet & Greet Cocktail Party",
    "registrationType": "individuals",
    "primaryAttendee": {
      "attendeeId": "01974831-7b99-71bd-b12a-0456dc127d5f",
      "attendeeType": "mason",
      "isPrimary": true,
      "isPartner": null,
      "title": "W Bro",
      "firstName": "1221pm",
      "lastName": "Sat7June",
      "lodgeNameNumber": "The Leichhardt Lodge No. 133",
      "primaryEmail": "1221pmsat7june@allatt.me",
      "primaryPhone": "0438 871 124",
      "dietaryRequirements": "",
      "specialNeeds": "",
      "contactPreference": "Directly",
      "contactConfirmed": false,
      "isCheckedIn": false,
      "firstTime": false,
      "rank": "GL",
      "postNominals": "",
      "grand_lodge_id": "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
      "lodge_id": "4c1479ba-cbaa-2072-f77a-87882c81f1be",
      "tableAssignment": null,
      "notes": "",
      "paymentStatus": "pending",
      "relationship": "",
      "partner": null,
      "partnerOf": null,
      "guestOfId": null,
      "updatedAt": "2025-06-07T02:22:13.093Z",
      "suffix": "PSGW",
      "grandOfficerStatus": "Present",
      "presentGrandOfficerRole": "Grand Director of Ceremonies",
      "otherGrandOfficerRole": "",
      "grandLodgeOrganisationId": "3e893fa6-2cc2-448c-be9c-e3858cc90e11",
      "lodgeOrganisationId": "4c1479ba-cbaa-2072-f77a-87882c81f1be"
    },
    "additionalAttendees": [],
    "tickets": [
      {
        "id": "01974831-7b99-71bd-b12a-0456dc127d5f-d586ecc1-e410-4ef3-a59c-4a53a866bc33",
        "attendeeId": "01974831-7b99-71bd-b12a-0456dc127d5f",
        "eventTicketId": "d586ecc1-e410-4ef3-a59c-4a53a866bc33",
        "isPackage": false,
        "price": 0
      },
      {
        "id": "01974831-7b99-71bd-b12a-0456dc127d5f-7196514b-d4b8-4fe0-93ac-deb4c205dd09",
        "attendeeId": "01974831-7b99-71bd-b12a-0456dc127d5f",
        "eventTicketId": "7196514b-d4b8-4fe0-93ac-deb4c205dd09",
        "isPackage": false,
        "price": 0
      }
    ],
    "totalAmount": 0,
    "subtotal": 0,
    "stripeFee": 0,
    "paymentIntentId": null,
    "billingDetails": {
      "billToPrimary": true,
      "firstName": "1221pm",
      "lastName": "Sat7June",
      "emailAddress": "1221pmsat7june@allatt.me",
      "mobileNumber": "0438 871 124",
      "addressLine1": "100 Harris Street",
      "businessName": "",
      "suburb": "Chiswick",
      "postcode": "2046",
      "stateTerritory": {
        "id": 3909,
        "name": "New South Wales",
        "isoCode": "NSW",
        "countryCode": "AU"
      },
      "country": {
        "name": "Australia",
        "isoCode": "AU",
        "id": 14
      }
    },
    "agreeToTerms": true,
    "billToPrimaryAttendee": false,
    "authUserId": "7e9a6303-0a11-4876-bfdb-f1c245995029",
    "paymentCompleted": false
  }