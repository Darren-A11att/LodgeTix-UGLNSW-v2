CheckoutForm.tsx:59 💳 Stripe Payment Confirmation
CheckoutForm.tsx:60 Stripe Billing Details being sent: {
  "name": "Darren Allatt",
  "email": "darren@allatt.me",
  "phone": "0438871124",
  "address": {
    "line1": "100 Harris Street",
    "city": "Sydney",
    "state": "New South Wales",
    "postal_code": "2046",
    "country": "AU"
  }
}
CheckoutForm.tsx:61 Client Secret: pi_3RNYFYK...
CheckoutForm.tsx:76 💳 Stripe Payment Result (973ms)
CheckoutForm.tsx:80 Payment Intent: {
  "id": "pi_3RNYFYKBASow5NsW0XM7wXkM",
  "status": "succeeded",
  "amount": 445,
  "currency": "aud",
  "created": "2025-05-11T11:40:56.000Z"
}
registration-wizard.tsx:22 Zustand Store Updated: {registrationId: 'c2fabc45-ad91-4716-8ec4-ea861dc80821', confirmationNumber: 'LNSW-QLXR-5ZEC', registrationType: 'myself-others', currentStep: 5, attendeeDetails: {…}, …}
payment-step.tsx:141 📝 Registration Submission
payment-step.tsx:142 Registration Data: {
  "registrationId": "c2fabc45-ad91-4716-8ec4-ea861dc80821",
  "registrationType": "myself-others",
  "primaryAttendee": {
    "type": "mason",
    "id": "70158ba9-dff9-4a10-ba80-23528636f506",
    "masonicTitle": "Bro",
    "rank": "GL",
    "hasPartner": true,
    "dietaryRequirements": "",
    "isPrimaryAttendee": true,
    "firstName": "Darren",
    "lastName": "Allatt_2",
    "grandRank": "PSGW",
    "grandOfficerStatus": "Present",
    "presentGrandOfficerRole": "Other",
    "otherGrandOfficerRole": "Board of Management",
    "email": "darren@allatt.me",
    "mobile": "0438871124",
    "partner": {
      "type": "partner",
      "id": "69b32e48-8e5a-4ccd-bc31-881e634ceb5b",
      "relatedAttendeeId": "70158ba9-dff9-4a10-ba80-23528636f506",
      "relationship": "Spouse",
      "title": "Ms",
      "contactPreference": "Mason/Guest",
      "firstName": "Caitlin",
      "lastName": "Ellis",
      "dietaryRequirements": "",
      "specialNeeds": ""
    },
    "grandLodge": "UGL",
    "lodgeName": "Lodge"
  },
  "additionalAttendees": [
    {
      "type": "partner",
      "id": "69b32e48-8e5a-4ccd-bc31-881e634ceb5b",
      "relatedAttendeeId": "70158ba9-dff9-4a10-ba80-23528636f506",
      "relationship": "Spouse",
      "title": "Ms",
      "contactPreference": "Mason/Guest",
      "firstName": "Caitlin",
      "lastName": "Ellis",
      "dietaryRequirements": "",
      "specialNeeds": ""
    }
  ],
  "tickets": [
    {
      "id": "f1bef0b2-40fa-439b-86b1-3a37e93745d9",
      "name": "Complete Package",
      "price": 250,
      "description": "Includes all events (save $80)",
      "attendeeId": "70158ba9-dff9-4a10-ba80-23528636f506",
      "isPackage": true,
      "includedTicketTypes": [
        "installation",
        "banquet",
        "brunch",
        "tour"
      ]
    },
    {
      "id": "5c67df74-b906-42c6-a25a-29ee0ed24e85",
      "name": "Farewell Brunch",
      "price": 45,
      "description": "Sunday morning brunch",
      "attendeeId": "69b32e48-8e5a-4ccd-bc31-881e634ceb5b",
      "isPackage": false
    },
    {
      "id": "1c8681d5-74c4-4c33-998c-6ab5814d58da",
      "name": "Grand Banquet",
      "price": 150,
      "description": "Formal dinner with wine at the venue",
      "attendeeId": "69b32e48-8e5a-4ccd-bc31-881e634ceb5b",
      "isPackage": false
    }
  ],
  "totalAmount": 445,
  "paymentIntentId": "pi_3RNYFYKBASow5NsW0XM7wXkM",
  "billingDetails": {
    "billToPrimary": false,
    "firstName": "Darren",
    "lastName": "Allatt",
    "businessName": "",
    "addressLine1": "100 Harris Street",
    "mobileNumber": "0438871124",
    "suburb": "Sydney",
    "postcode": "2046",
    "emailAddress": "darren@allatt.me",
    "country": "AU",
    "stateTerritory": "New South Wales"
  }
}
payment-step.tsx:143 Total Amount: $445.00
payment-step.tsx:144 Payment Intent ID: pi_3RNYFYKBASow5NsW0XM7wXkM
payment-step.tsx:145 Registration ID: c2fabc45-ad91-4716-8ec4-ea861dc80821
payment-step.tsx:146 Confirmation Number: LNSW-QLXR-5ZEC
payment-step.tsx:152 ✅ Registration Success
payment-step.tsx:153 Successfully saved registration with ID: c2fabc45-ad91-4716-8ec4-ea861dc80821
payment-step.tsx:154 Confirmation Number: LNSW-QLXR-5ZEC
registration-wizard.tsx:22 Zustand Store Updated: {registrationId: 'c2fabc45-ad91-4716-8ec4-ea861dc80821', confirmationNumber: 'LNSW-QLXR-5ZEC', registrationType: 'myself-others', currentStep: 6, attendeeDetails: {…}, …}
