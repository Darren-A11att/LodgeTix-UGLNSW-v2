# Ticket Definitions Data

This file contains seed data for ticket definitions in the LodgeTix application.

## Grand Installation Event Tickets

```json
[
  {
    "id": "installation-ceremony-ticket",
    "eventId": "grand-installation-2023",
    "name": "Installation Ceremony",
    "price": 75.00,
    "description": "Admission to the Grand Installation Ceremony at Sydney Masonic Centre",
    "available": true,
    "isPackage": false,
    "capacity": 600,
    "soldCount": 430,
    "allowedAttendeeTypes": ["mason", "guest"],
    "salesEndDate": "2023-11-24T23:59:59Z",
    "createdAt": "2023-01-15T00:00:00Z",
    "updatedAt": "2023-10-20T00:00:00Z"
  },
  {
    "id": "grand-banquet-ticket",
    "eventId": "grand-installation-2023",
    "name": "Grand Banquet",
    "price": 150.00,
    "description": "Formal dinner with wine at Hilton Sydney (Black Tie)",
    "available": true,
    "isPackage": false,
    "capacity": 400,
    "soldCount": 320,
    "allowedAttendeeTypes": ["mason", "lady_partner", "guest", "guest_partner"],
    "salesEndDate": "2023-11-20T23:59:59Z",
    "createdAt": "2023-01-15T00:00:00Z",
    "updatedAt": "2023-10-20T00:00:00Z"
  },
  {
    "id": "farewell-brunch-ticket",
    "eventId": "grand-installation-2023",
    "name": "Farewell Brunch",
    "price": 45.00,
    "description": "Sunday morning brunch at Sydney Masonic Centre",
    "available": true,
    "isPackage": false,
    "capacity": 300,
    "soldCount": 215,
    "allowedAttendeeTypes": ["mason", "lady_partner", "guest", "guest_partner"],
    "salesEndDate": "2023-11-24T23:59:59Z",
    "createdAt": "2023-01-15T00:00:00Z",
    "updatedAt": "2023-10-20T00:00:00Z"
  },
  {
    "id": "complete-package",
    "eventId": "grand-installation-2023",
    "name": "Complete Package",
    "price": 250.00,
    "description": "Includes all events (save $20)",
    "available": true,
    "isPackage": true,
    "includedTicketTypes": [
      "installation-ceremony-ticket",
      "grand-banquet-ticket",
      "farewell-brunch-ticket"
    ],
    "capacity": 300,
    "soldCount": 178,
    "allowedAttendeeTypes": ["mason", "guest"],
    "salesEndDate": "2023-11-20T23:59:59Z",
    "createdAt": "2023-01-15T00:00:00Z",
    "updatedAt": "2023-10-20T00:00:00Z"
  }
]
```

## Individual Event Tickets

```json
[
  {
    "id": "sydney-harbour-cruise-ticket",
    "eventId": "sydney-harbour-cruise-2023",
    "name": "Sydney Harbour Cruise",
    "price": 85.00,
    "description": "Pre-Installation cruise on Sydney Harbour with refreshments included",
    "available": true,
    "isPackage": false,
    "capacity": 150,
    "soldCount": 98,
    "allowedAttendeeTypes": ["mason", "lady_partner", "guest", "guest_partner"],
    "salesEndDate": "2023-11-23T23:59:59Z",
    "createdAt": "2023-01-15T00:00:00Z",
    "updatedAt": "2023-10-20T00:00:00Z"
  },
  {
    "id": "third-degree-ticket",
    "eventId": "third-degree-ceremony-2023",
    "name": "Third Degree Ceremony",
    "price": 20.00,
    "description": "Admission to the Third Degree Ceremony",
    "available": true,
    "isPackage": false,
    "capacity": 100,
    "soldCount": 85,
    "allowedAttendeeTypes": ["mason"],
    "salesEndDate": "2023-10-09T23:59:59Z",
    "createdAt": "2023-08-15T00:00:00Z",
    "updatedAt": "2023-09-01T00:00:00Z"
  },
  {
    "id": "education-night-ticket",
    "eventId": "masonic-education-night-2023",
    "name": "Masonic Education Night",
    "price": 15.00,
    "description": "Admission to the Masonic Education Night lecture series",
    "available": true,
    "isPackage": false,
    "capacity": 120,
    "soldCount": 95,
    "allowedAttendeeTypes": ["mason", "guest"],
    "salesEndDate": "2023-09-24T23:59:59Z",
    "createdAt": "2023-08-01T00:00:00Z",
    "updatedAt": "2023-08-15T00:00:00Z"
  },
  {
    "id": "charity-gala-standard",
    "eventId": "annual-charity-gala-2023",
    "name": "Charity Gala - Standard",
    "price": 95.00,
    "description": "Standard admission to the Annual Charity Gala",
    "available": true,
    "isPackage": false,
    "capacity": 250,
    "soldCount": 180,
    "allowedAttendeeTypes": ["mason", "lady_partner", "guest", "guest_partner"],
    "salesEndDate": "2023-12-03T23:59:59Z",
    "createdAt": "2023-09-01T00:00:00Z",
    "updatedAt": "2023-10-01T00:00:00Z"
  },
  {
    "id": "charity-gala-vip",
    "eventId": "annual-charity-gala-2023",
    "name": "Charity Gala - VIP",
    "price": 150.00,
    "description": "VIP admission with premium seating and complimentary champagne",
    "available": true,
    "isPackage": false,
    "capacity": 50,
    "soldCount": 35,
    "allowedAttendeeTypes": ["mason", "lady_partner", "guest", "guest_partner"],
    "salesEndDate": "2023-12-03T23:59:59Z",
    "createdAt": "2023-09-01T00:00:00Z",
    "updatedAt": "2023-10-01T00:00:00Z"
  },
  {
    "id": "charity-gala-table",
    "eventId": "annual-charity-gala-2023",
    "name": "Charity Gala - Table of 10",
    "price": 850.00,
    "description": "Reserved table for 10 guests with premium wine selection",
    "available": true,
    "isPackage": true,
    "capacity": 10,
    "soldCount": 8,
    "allowedAttendeeTypes": ["mason", "lodge_contact"],
    "salesEndDate": "2023-11-28T23:59:59Z",
    "createdAt": "2023-09-01T00:00:00Z",
    "updatedAt": "2023-10-01T00:00:00Z"
  }
]
```

## May 2025 Grand Installation Tickets

```json
[
  {
    "id": "installation-ceremony-ticket-2025",
    "eventId": "grand-installation-2025",
    "name": "Installation Ceremony",
    "price": 75.00,
    "description": "Admission to the Grand Installation Ceremony",
    "available": true,
    "isPackage": false,
    "capacity": 600,
    "soldCount": 0,
    "allowedAttendeeTypes": ["mason", "guest"],
    "salesEndDate": "2025-05-14T23:59:59Z",
    "createdAt": "2024-11-01T00:00:00Z",
    "updatedAt": "2024-11-01T00:00:00Z"
  },
  {
    "id": "grand-banquet-ticket-2025",
    "eventId": "grand-installation-2025",
    "name": "Grand Banquet",
    "price": 150.00,
    "description": "Formal dinner with wine at Hilton Sydney",
    "available": true,
    "isPackage": false,
    "capacity": 400,
    "soldCount": 0,
    "allowedAttendeeTypes": ["mason", "lady_partner", "guest", "guest_partner"],
    "salesEndDate": "2025-05-10T23:59:59Z",
    "createdAt": "2024-11-01T00:00:00Z",
    "updatedAt": "2024-11-01T00:00:00Z"
  },
  {
    "id": "farewell-brunch-ticket-2025",
    "eventId": "grand-installation-2025",
    "name": "Farewell Brunch",
    "price": 45.00,
    "description": "Sunday morning brunch",
    "available": true,
    "isPackage": false,
    "capacity": 300,
    "soldCount": 0,
    "allowedAttendeeTypes": ["mason", "lady_partner", "guest", "guest_partner"],
    "salesEndDate": "2025-05-14T23:59:59Z",
    "createdAt": "2024-11-01T00:00:00Z",
    "updatedAt": "2024-11-01T00:00:00Z"
  },
  {
    "id": "complete-package-2025",
    "eventId": "grand-installation-2025",
    "name": "Complete Package",
    "price": 250.00,
    "description": "Includes all events (save $20)",
    "available": true,
    "isPackage": true,
    "includedTicketTypes": [
      "installation-ceremony-ticket-2025",
      "grand-banquet-ticket-2025",
      "farewell-brunch-ticket-2025"
    ],
    "capacity": 300,
    "soldCount": 0,
    "allowedAttendeeTypes": ["mason", "guest"],
    "salesEndDate": "2025-05-10T23:59:59Z",
    "createdAt": "2024-11-01T00:00:00Z",
    "updatedAt": "2024-11-01T00:00:00Z"
  }
]
```