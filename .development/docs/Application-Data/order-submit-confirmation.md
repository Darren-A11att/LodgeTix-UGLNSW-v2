main-app.js?v=1747049620183:2292 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
supabase-browser.ts:86 Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.

registrationStore.ts:396 Registration store hydration finished.
locationStore.ts:173 [LocationStore] Fetching IP data from ipapi.co...
auth-provider.tsx:51 Auth state changed: INITIAL_SESSION
locationStore.ts:188 [LocationStore] Received IP data: {ip: '2401:d002:8e05:5400:147e:3f1f:a490:252a', network: '2401:d002:8e00::/40', version: 'IPv6', city: 'Sydney', region: 'New South Wales', …}
locationStore.ts:199 [LocationStore] Mapped IP data: {ip: '2401:d002:8e05:5400:147e:3f1f:a490:252a', version: 'IPv6', city: 'Sydney', region: 'New South Wales', region_code: 'NSW', …}
locationStore.ts:207 [LocationStore] Setting final IP data state: {ip: '2401:d002:8e05:5400:147e:3f1f:a490:252a', version: 'IPv6', city: 'Sydney', region: 'New South Wales', region_code: 'NSW', …}
locationStore.ts:214 [LocationStore] Triggering preloads for country: Australia (Code: AU), region: NSW
locationStore.ts:414 [LocationStore] GLs for country Australia already cached and fresh.
locationStore.ts:447 [LocationStore] GLs for region NSW already cached and fresh.
locationStore.ts:480 [LocationStore] Lodges for region NSW already cached and fresh (byRegion).

registration-wizard.tsx:291 Zustand Store Updated: {draftId: null, registrationType: 'individual', attendees: Array(1), packages: {…}, billingDetails: {…}, …}
registration-wizard.tsx:37 isValidEmail: Email string for validation: 'darren@allatt.me', Length: 16, CharCodes: 100,97,114,114,101,110,64,97,108,108,97,116,116,46,109,101
registration-wizard.tsx:43 isValidEmail: Testing 'darren@allatt.me' with pattern '^[^\s@]+@[^\s@]+\.[^\s@]+$'. Result: true
registration-wizard.tsx:196 !!!!!!!!!!!! VALIDATION ERRORS !!!!!!!!!!!!: []
registration-wizard.tsx:197 !!!!!!!!!!!! ALL ATTENDEES FOR VALIDATION !!!!!!!!!!!!: [
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
]
locationStore.ts:234 [LocationStore] Fetching initial GLs. Country: AU, Region: NSW, Global Cache Expired: false
locationStore.ts:243 [LocationStore] Using FRESH country cache for Australia
AttendeeDetails.tsx:44 [AttendeeDetails] Initial agreeToTerms prop: false
locationStore.ts:234 [LocationStore] Fetching initial GLs. Country: AU, Region: NSW, Global Cache Expired: false
locationStore.ts:243 [LocationStore] Using FRESH country cache for Australia
AttendeeDetails.tsx:44 [AttendeeDetails] Initial agreeToTerms prop: false
registration-wizard.tsx:291 Zustand Store Updated: {draftId: null, registrationType: 'individual', attendees: Array(1), packages: {…}, billingDetails: {…}, …}
ticket-selection-step.tsx:88 [TicketSelectionStep] Raw allStoreAttendees on render: [{…}]
ticket-selection-step.tsx:99 [derivedCurrentTickets] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, Selection from store: {ticketDefinitionId: 'complete', selectedEvents: Array(4)}
ticket-selection-step.tsx:113 [derivedCurrentTickets] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, Derived Package Ticket: {id: 'complete', name: 'Complete Package', price: 250, description: 'Includes all events (save $80)', attendeeId: '82f76327-01e6-43f3-b9b0-92545eda1510', …}
ticket-selection-step.tsx:142 [TicketSelectionStep] Final derivedCurrentTickets for UI: [{…}]
ticket-selection-step.tsx:157 TicketSelectionStep RENDER - currentTickets (placeholder): [{…}] Length: 1
ticket-selection-step.tsx:163 TicketSelectionStep RENDER - calculated localTotalAmount (based on placeholder): 250
ticket-selection-step.tsx:293 [isPackageSelectedForAttendee] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, PackageName: Complete Package, PackageID: complete, StoreDefId: complete, IsSelected: true
ticket-selection-step.tsx:293 [isPackageSelectedForAttendee] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, PackageName: Ceremony & Banquet, PackageID: ceremony-banquet, StoreDefId: complete, IsSelected: false
ticket-selection-step.tsx:293 [isPackageSelectedForAttendee] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, PackageName: Social Package, PackageID: social, StoreDefId: complete, IsSelected: false
ticket-selection-step.tsx:218 [isIndividualTicketDirectlySelected] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, TicketTypeID: installation, StoreDefId: complete, StoreEvents: ["installation","banquet","brunch","tour"], IsSelected: false
ticket-selection-step.tsx:218 [isIndividualTicketDirectlySelected] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, TicketTypeID: banquet, StoreDefId: complete, StoreEvents: ["installation","banquet","brunch","tour"], IsSelected: false
ticket-selection-step.tsx:218 [isIndividualTicketDirectlySelected] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, TicketTypeID: brunch, StoreDefId: complete, StoreEvents: ["installation","banquet","brunch","tour"], IsSelected: false
ticket-selection-step.tsx:218 [isIndividualTicketDirectlySelected] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, TicketTypeID: tour, StoreDefId: complete, StoreEvents: ["installation","banquet","brunch","tour"], IsSelected: false
ticket-selection-step.tsx:88 [TicketSelectionStep] Raw allStoreAttendees on render: [{…}]
ticket-selection-step.tsx:99 [derivedCurrentTickets] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, Selection from store: {ticketDefinitionId: 'complete', selectedEvents: Array(4)}
ticket-selection-step.tsx:113 [derivedCurrentTickets] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, Derived Package Ticket: {id: 'complete', name: 'Complete Package', price: 250, description: 'Includes all events (save $80)', attendeeId: '82f76327-01e6-43f3-b9b0-92545eda1510', …}
ticket-selection-step.tsx:142 [TicketSelectionStep] Final derivedCurrentTickets for UI: [{…}]
ticket-selection-step.tsx:157 TicketSelectionStep RENDER - currentTickets (placeholder): [{…}] Length: 1
ticket-selection-step.tsx:163 TicketSelectionStep RENDER - calculated localTotalAmount (based on placeholder): 250
ticket-selection-step.tsx:293 [isPackageSelectedForAttendee] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, PackageName: Complete Package, PackageID: complete, StoreDefId: complete, IsSelected: true
ticket-selection-step.tsx:293 [isPackageSelectedForAttendee] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, PackageName: Ceremony & Banquet, PackageID: ceremony-banquet, StoreDefId: complete, IsSelected: false
ticket-selection-step.tsx:293 [isPackageSelectedForAttendee] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, PackageName: Social Package, PackageID: social, StoreDefId: complete, IsSelected: false
ticket-selection-step.tsx:218 [isIndividualTicketDirectlySelected] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, TicketTypeID: installation, StoreDefId: complete, StoreEvents: ["installation","banquet","brunch","tour"], IsSelected: false
ticket-selection-step.tsx:218 [isIndividualTicketDirectlySelected] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, TicketTypeID: banquet, StoreDefId: complete, StoreEvents: ["installation","banquet","brunch","tour"], IsSelected: false
ticket-selection-step.tsx:218 [isIndividualTicketDirectlySelected] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, TicketTypeID: brunch, StoreDefId: complete, StoreEvents: ["installation","banquet","brunch","tour"], IsSelected: false
ticket-selection-step.tsx:218 [isIndividualTicketDirectlySelected] Attendee: 82f76327-01e6-43f3-b9b0-92545eda1510, TicketTypeID: tour, StoreDefId: complete, StoreEvents: ["installation","banquet","brunch","tour"], IsSelected: false
registration-wizard.tsx:291 Zustand Store Updated: {draftId: null, registrationType: 'individual', attendees: Array(1), packages: {…}, billingDetails: {…}, …}
registration-wizard.tsx:291 Zustand Store Updated: {draftId: null, registrationType: 'individual', attendees: Array(1), packages: {…}, billingDetails: {…}, …}
stripe.js:1 You may test your Stripe.js integration over HTTP. However, live Stripe.js integrations must use HTTPS.
value @ stripe.js:1
e @ stripe.js:1
Qf @ stripe.js:1
initStripe @ index.mjs:157
eval @ index.mjs:196
Promise.then
loadStripe @ index.mjs:195
eval @ PaymentMethod.tsx:17
(app-pages-browser)/./components/register/payment/PaymentMethod.tsx @ _app-pages-browser_components_register_steps_payment-step_tsx.js:73
options.factory @ webpack.js?v=1747049620183:712

eval @ react-dom-client.development.js:16309
content_script.js:1 Uncaught TypeError: Cannot read properties of null (reading 'ControlLooksLikePasswordCredentialField')
    at shouldOfferCompletionListForField (content_script.js:1:414930)
    at HTMLDocument.keyDownEventHandler (content_script.js:1:417552)
shouldOfferCompletionListForField @ content_script.js:1
keyDownEventHandler @ content_script.js:1
content_script.js:1 Uncaught TypeError: Cannot read properties of null (reading 'ControlLooksLikePasswordCredentialField')
    at shouldOfferCompletionListForField (content_script.js:1:414930)
    at HTMLDocument.keyDownEventHandler (content_script.js:1:417552)
shouldOfferCompletionListForField @ content_script.js:1
keyDownEventHandler @ content_script.js:1
CheckoutForm.tsx:59 💳 Stripe Payment Confirmation
CheckoutForm.tsx:60 Stripe Billing Details being sent: {
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
CheckoutForm.tsx:61 Client Secret: pi_3RNugMK...
CheckoutForm.tsx:76 💳 Stripe Payment Result (1117ms)
CheckoutForm.tsx:80 Payment Intent: {
  "id": "pi_3RNugMKBASow5NsW0CgLW5ok",
  "status": "succeeded",
  "amount": 250,
  "currency": "aud",
  "created": "2025-05-12T11:38:06.000Z"
}
registration-wizard.tsx:291 Zustand Store Updated: {draftId: null, registrationType: 'individual', attendees: Array(1), packages: {…}, billingDetails: {…}, …}
payment-step.tsx:207 📝 Registration Submission
payment-step.tsx:208 Registration Data: {
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
payment-step.tsx:209 Total Amount: $250.00
payment-step.tsx:210 Payment Intent ID: pi_3RNugMKBASow5NsW0CgLW5ok
payment-step.tsx:211 Registration ID: null
registration-wizard.tsx:291 Zustand Store Updated: {draftId: null, registrationType: 'individual', attendees: Array(1), packages: {…}, billingDetails: {…}, …}
payment-step.tsx:219 ✅ Registration Success
payment-step.tsx:220 Successfully saved registration with ID: null
payment-step.tsx:221 Confirmation Number from Supabase: SUPA-23232
registration-wizard.tsx:291 Zustand Store Updated: {draftId: null, registrationType: 'individual', attendees: Array(1), packages: {…}, billingDetails: {…}, …}
