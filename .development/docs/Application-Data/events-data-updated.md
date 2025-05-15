# Events Data (Updated with UUID/Slug System)

This file contains seed data for events in the LodgeTix application, updated to use the new UUID and slug-based identification system.

## Event Identification Evolution

Events in LodgeTix have transitioned from using string IDs to a more robust UUID/slug system:

1. **Old System**: Used semantic string IDs (e.g., "grand-installation-2023")
2. **New System**: Uses both UUIDs and slugs
   - UUID: Primary database identifier (e.g., "d290f1ee-6c54-4b01-90e6-d701748f0855")
   - Slug: URL-friendly identifier for public routes (e.g., "grand-installation-2023")

## Grand Installation Event (Updated Format)

```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0855",
  "slug": "grand-installation-2023",
  "title": "Grand Installation",
  "subtitle": "MW Bro Bernie Khristian Albano",
  "description": "The United Grand Lodge of NSW & ACT cordially invites you to attend the Installation of MW Bro Bernie Khristian Albano as Grand Master. This historic ceremony will bring together Brethren from across Australia and beyond to witness this momentous occasion in Freemasonry.",
  "startDate": "2023-11-25",
  "endDate": "2023-11-26",
  "startTime": "2:00 PM",
  "endTime": "5:00 PM",
  "category": "installation",
  "degreeType": "none",
  "location": {
    "name": "Sydney Masonic Centre",
    "address": "279 Castlereagh St",
    "city": "Sydney",
    "state": "NSW",
    "postalCode": "2000",
    "country": "Australia",
    "mapUrl": "https://maps.google.com"
  },
  "attendance": {
    "expected": 500,
    "description": "500+ Brethren"
  },
  "dressCode": "morning",
  "regalia": "craft",
  "regaliaDescription": "Full Regalia according to rank",
  "imageSrc": "/placeholder.svg",
  "organizerId": "b290f1ee-6c54-4b01-90e6-d701748f0896",
  "organizerName": "United Grand Lodge of NSW & ACT",
  "organizerContact": {
    "email": "info@masons.au",
    "website": "https://www.masons.au"
  },
  "isPublished": true,
  "publishOption": "publish_now",
  "eligibilityRequirements": ["Master Mason in good standing"],
  "sections": {
    "about": "The United Grand Lodge of NSW & ACT cordially invites you to attend the Installation of MW Bro Bernie Khristian Albano as Grand Master. This historic ceremony will bring together Brethren from across Australia and beyond to witness this momentous occasion in Freemasonry.\n\nThe Installation will be conducted with all the pomp and ceremony befitting such an important event in our Masonic calendar. Following the Installation, a Grand Banquet will be held at the Hilton Sydney to celebrate this special occasion.\n\nMW Bro Bernie Khristian Albano brings a wealth of Masonic experience and leadership to the role of Grand Master. His vision for the future of Freemasonry in NSW & ACT will be outlined during his inaugural address.\n\nThis event is open to all Master Masons in good standing. Visitors from other Grand Lodges are most welcome to attend and should bring their Grand Lodge certificate.",
    "schedule": [
      {
        "date": "2023-11-25",
        "items": [
          {
            "time": "12:30 PM",
            "title": "Registration Opens",
            "location": "Sydney Masonic Centre, Ground Floor",
            "description": ""
          },
          {
            "time": "1:30 PM",
            "title": "All Brethren to be Seated",
            "location": "Main Auditorium",
            "description": ""
          },
          {
            "time": "2:00 PM",
            "title": "Grand Installation Ceremony Commences",
            "location": "Main Auditorium",
            "description": "Procession of Grand Officers and Distinguished Guests"
          },
          {
            "time": "5:00 PM",
            "title": "Ceremony Concludes",
            "location": "Sydney Masonic Centre",
            "description": "Followed by refreshments"
          },
          {
            "time": "7:00 PM",
            "title": "Grand Banquet",
            "location": "Grand Ballroom, Hilton Sydney",
            "description": "Dress: Black Tie"
          }
        ]
      },
      {
        "date": "2023-11-26",
        "items": [
          {
            "time": "10:00 AM",
            "title": "Farewell Brunch",
            "location": "Sydney Masonic Centre",
            "description": "Dress: Smart Casual"
          }
        ]
      }
    ],
    "details": [
      {
        "title": "Dress Code",
        "content": "**Installation Ceremony:** Morning Suit or Dark Lounge Suit with Full Regalia according to rank.\n\n**Grand Banquet:** Black Tie with Miniature Jewels only.\n\n**Farewell Brunch:** Smart Casual, no regalia."
      },
      {
        "title": "Regalia Requirements",
        "content": "**Grand Officers:** Full dress regalia with chain collars (if applicable).\n\n**Past Grand Officers:** Full dress regalia with appropriate past rank jewels.\n\n**Worshipful Masters:** Full dress regalia with collar and jewel of office.\n\n**Master Masons:** Craft regalia (apron, collar, and jewel)."
      },
      {
        "title": "Visitors from Other Jurisdictions",
        "content": "Visitors from other Grand Lodges are most welcome and should wear the regalia of their own jurisdiction. Please bring your Grand Lodge certificate for registration."
      },
      {
        "title": "Photography",
        "content": "Official photographers will be present throughout the event. Personal photography is permitted before and after the ceremony but not during the official proceedings."
      }
    ]
  },
  "documents": [
    {
      "title": "Installation Program",
      "fileUrl": "#",
      "documentType": "Program"
    },
    {
      "title": "Accommodation Guide",
      "fileUrl": "#",
      "documentType": "Guide"
    },
    {
      "title": "Sydney Visitor Guide",
      "fileUrl": "#",
      "documentType": "Guide"
    }
  ],
  "relatedEvents": [
    {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0856", 
      "slug": "grand-banquet-2023"
    },
    {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0857", 
      "slug": "farewell-brunch-2023"
    },
    {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0858", 
      "slug": "sydney-harbour-cruise-2023"
    }
  ],
  "legacyId": "grand-installation-2023",
  "createdAt": "2023-01-15T00:00:00Z",
  "updatedAt": "2023-10-20T00:00:00Z"
}
```

## Grand Banquet Event (Updated Format)

```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0856",
  "slug": "grand-banquet-2023",
  "title": "Grand Banquet",
  "subtitle": "Celebrating the Installation of MW Bro Bernie Khristian Albano",
  "description": "Join us for a formal dinner celebrating the Installation of the new Grand Master. The evening will include speeches, entertainment, and fine dining.",
  "startDate": "2023-11-25",
  "endDate": "2023-11-25",
  "startTime": "7:00 PM",
  "endTime": "11:00 PM",
  "category": "festive-board",
  "location": {
    "name": "Grand Ballroom, Hilton Sydney",
    "address": "488 George St",
    "city": "Sydney",
    "state": "NSW",
    "postalCode": "2000",
    "country": "Australia"
  },
  "dressCode": "black",
  "regalia": "none",
  "regaliaDescription": "Miniature Jewels only",
  "imageSrc": "/placeholder.svg",
  "organizerId": "b290f1ee-6c54-4b01-90e6-d701748f0896",
  "organizerName": "United Grand Lodge of NSW & ACT",
  "isPublished": true,
  "parentEventId": "d290f1ee-6c54-4b01-90e6-d701748f0855",
  "legacyId": "grand-banquet-2023",
  "createdAt": "2023-01-15T00:00:00Z",
  "updatedAt": "2023-10-20T00:00:00Z"
}
```

## Farewell Brunch Event (Updated Format)

```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0857",
  "slug": "farewell-brunch-2023",
  "title": "Farewell Brunch",
  "description": "A casual brunch to conclude the Installation weekend. Meet with the new Grand Master and fellow Brethren in a relaxed setting.",
  "startDate": "2023-11-26",
  "endDate": "2023-11-26",
  "startTime": "10:00 AM",
  "endTime": "12:00 PM",
  "category": "social",
  "location": {
    "name": "Sydney Masonic Centre",
    "address": "279 Castlereagh St",
    "city": "Sydney",
    "state": "NSW",
    "postalCode": "2000",
    "country": "Australia"
  },
  "dressCode": "casual",
  "regalia": "none",
  "imageSrc": "/placeholder.svg",
  "organizerId": "b290f1ee-6c54-4b01-90e6-d701748f0896",
  "organizerName": "United Grand Lodge of NSW & ACT",
  "isPublished": true,
  "parentEventId": "d290f1ee-6c54-4b01-90e6-d701748f0855",
  "legacyId": "farewell-brunch-2023",
  "createdAt": "2023-01-15T00:00:00Z",
  "updatedAt": "2023-10-20T00:00:00Z"
}
```

## Sydney Harbour Cruise Event (Updated Format)

```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0858",
  "slug": "sydney-harbour-cruise-2023",
  "title": "Sydney Harbour Cruise",
  "description": "A pre-Installation cruise on Sydney Harbour for interstate and international visitors. Enjoy spectacular views of Sydney's landmarks.",
  "startDate": "2023-11-24",
  "endDate": "2023-11-24",
  "startTime": "2:00 PM",
  "endTime": "5:00 PM",
  "category": "social",
  "location": {
    "name": "Circular Quay",
    "address": "Circular Quay",
    "city": "Sydney",
    "state": "NSW",
    "postalCode": "2000",
    "country": "Australia"
  },
  "dressCode": "casual",
  "regalia": "none",
  "imageSrc": "/placeholder.svg",
  "organizerId": "b290f1ee-6c54-4b01-90e6-d701748f0896",
  "organizerName": "United Grand Lodge of NSW & ACT",
  "isPublished": true,
  "parentEventId": "d290f1ee-6c54-4b01-90e6-d701748f0855",
  "legacyId": "sydney-harbour-cruise-2023",
  "createdAt": "2023-01-15T00:00:00Z",
  "updatedAt": "2023-10-20T00:00:00Z"
}
```

## Third Degree Ceremony Event (Updated Format)

```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "slug": "third-degree-ceremony-2023",
  "title": "Third Degree Ceremony",
  "description": "A solemn ceremony raising a Brother to the sublime degree of a Master Mason.",
  "startDate": "2023-10-10",
  "endDate": "2023-10-10",
  "startTime": "7:00 PM",
  "endTime": "10:00 PM",
  "category": "degree-ceremony",
  "degreeType": "third",
  "location": {
    "name": "Lodge Commonwealth No. 400",
    "address": "Masonic Centre",
    "city": "Sydney",
    "state": "NSW",
    "postalCode": "2000",
    "country": "Australia"
  },
  "dressCode": "dark",
  "regalia": "craft",
  "imageSrc": "/placeholder.svg?height=200&width=400",
  "organizerId": "b290f1ee-6c54-4b01-90e6-d701748f1234",
  "organizerName": "Lodge Commonwealth No. 400",
  "isPublished": true,
  "price": "$20",
  "legacyId": "third-degree-ceremony-2023",
  "createdAt": "2023-08-15T00:00:00Z",
  "updatedAt": "2023-09-01T00:00:00Z"
}
```

## Masonic Education Night Event (Updated Format)

```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0852",
  "slug": "masonic-lecture-series-2023",
  "title": "Masonic Education Night",
  "description": "Learn about the symbolism and history of Freemasonry from distinguished speakers.",
  "startDate": "2023-09-25",
  "endDate": "2023-09-25",
  "startTime": "7:00 PM",
  "endTime": "9:00 PM",
  "category": "lecture",
  "location": {
    "name": "Lodge Antiquity No. 1",
    "address": "Masonic Centre",
    "city": "Sydney",
    "state": "NSW",
    "postalCode": "2000",
    "country": "Australia"
  },
  "dressCode": "dark",
  "regalia": "craft",
  "imageSrc": "/placeholder.svg?height=200&width=400",
  "organizerId": "b290f1ee-6c54-4b01-90e6-d701748f5678",
  "organizerName": "Lodge Antiquity No. 1",
  "isPublished": true,
  "price": "$15",
  "legacyId": "masonic-education-night-2023",
  "createdAt": "2023-08-01T00:00:00Z",
  "updatedAt": "2023-08-15T00:00:00Z"
}
```

## Annual Charity Gala Event (Updated Format)

```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0853",
  "slug": "annual-charity-gala-2023",
  "title": "Annual Charity Gala",
  "description": "A formal dinner raising funds for the Masonic charities of NSW & ACT.",
  "startDate": "2023-12-05",
  "endDate": "2023-12-05",
  "startTime": "7:00 PM",
  "endTime": "11:00 PM",
  "category": "charity",
  "location": {
    "name": "Grand Ballroom, Hilton Sydney",
    "address": "488 George St",
    "city": "Sydney",
    "state": "NSW",
    "postalCode": "2000",
    "country": "Australia"
  },
  "dressCode": "black",
  "regalia": "none",
  "imageSrc": "/placeholder.svg?height=200&width=400",
  "organizerId": "b290f1ee-6c54-4b01-90e6-d701748f0896",
  "organizerName": "United Grand Lodge of NSW & ACT",
  "isPublished": true,
  "price": "$95",
  "legacyId": "annual-charity-gala-2023",
  "createdAt": "2023-09-01T00:00:00Z",
  "updatedAt": "2023-10-01T00:00:00Z"
}
```

## May 2025 Grand Installation (Updated Format)

```json
{
  "id": "d290f1ee-6c54-4b01-90e6-d701748f0854",
  "slug": "grand-installation-2025",
  "title": "Grand Installation",
  "subtitle": "MW Bro Bernie Khristian Albano",
  "description": "The United Grand Lodge of NSW & ACT cordially invites you to attend the Installation of MW Bro Bernie Khristian Albano as Grand Master.",
  "startDate": "2025-05-15",
  "endDate": "2025-05-17",
  "category": "installation",
  "location": {
    "name": "Sydney Masonic Centre",
    "address": "279 Castlereagh St",
    "city": "Sydney",
    "state": "NSW",
    "postalCode": "2000",
    "country": "Australia"
  },
  "dressCode": "morning",
  "regalia": "craft",
  "organizerId": "b290f1ee-6c54-4b01-90e6-d701748f0896",
  "organizerName": "United Grand Lodge of NSW & ACT",
  "isPublished": true,
  "legacyId": "grand-installation-2025"
}
```

## Legacy ID to UUID/Slug Mapping

For reference during the transition period:

```json
{
  "grand-installation-2023": {
    "uuid": "d290f1ee-6c54-4b01-90e6-d701748f0855",
    "slug": "grand-installation-2023"
  },
  "grand-banquet-2023": {
    "uuid": "d290f1ee-6c54-4b01-90e6-d701748f0856",
    "slug": "grand-banquet-2023"
  },
  "farewell-brunch-2023": {
    "uuid": "d290f1ee-6c54-4b01-90e6-d701748f0857",
    "slug": "farewell-brunch-2023"
  },
  "sydney-harbour-cruise-2023": {
    "uuid": "d290f1ee-6c54-4b01-90e6-d701748f0858",
    "slug": "sydney-harbour-cruise-2023"
  },
  "third-degree-ceremony-2023": {
    "uuid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "slug": "third-degree-ceremony-2023"
  },
  "masonic-education-night-2023": {
    "uuid": "d290f1ee-6c54-4b01-90e6-d701748f0852",
    "slug": "masonic-lecture-series-2023"
  },
  "annual-charity-gala-2023": {
    "uuid": "d290f1ee-6c54-4b01-90e6-d701748f0853",
    "slug": "annual-charity-gala-2023"
  },
  "grand-installation-2025": {
    "uuid": "d290f1ee-6c54-4b01-90e6-d701748f0854",
    "slug": "grand-installation-2025"
  }
}
```