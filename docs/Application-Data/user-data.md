# User Data

This file contains seed data for users in the LodgeTix application.

## Organizer Users

```json
[
  {
    "id": "admin-user-1",
    "email": "admin@lodgetix.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+61 4 1234 5678",
    "masonicInfo": {
      "grandLodgeId": "uglnsw-act",
      "lodgeId": "lodge-commonwealth-400",
      "memberNumber": "10052",
      "rank": "PM",
      "title": "W Bro"
    },
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "lastSignIn": "2023-11-01T00:00:00Z"
  },
  {
    "id": "event-manager-1",
    "email": "events@lodgetix.com",
    "firstName": "Robert",
    "lastName": "Smith",
    "phone": "+61 4 2345 6789",
    "masonicInfo": {
      "grandLodgeId": "uglnsw-act",
      "lodgeId": "sydney-lodge-1169",
      "memberNumber": "12345",
      "rank": "PM",
      "title": "VW Bro"
    },
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "lastSignIn": "2023-10-15T00:00:00Z"
  },
  {
    "id": "lodge-secretary-1",
    "email": "secretary@lodgecommonwealth.com.au",
    "firstName": "Michael",
    "lastName": "Johnson",
    "phone": "+61 4 3456 7890",
    "masonicInfo": {
      "grandLodgeId": "uglnsw-act",
      "lodgeId": "lodge-commonwealth-400",
      "memberNumber": "20156",
      "rank": "PM",
      "title": "W Bro"
    },
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "lastSignIn": "2023-10-28T00:00:00Z"
  }
]
```

## Regular Users (Masons)

```json
[
  {
    "id": "mason-user-1",
    "email": "jamesw@example.com",
    "firstName": "James",
    "lastName": "Wilson",
    "phone": "+61 4 4567 8901",
    "masonicInfo": {
      "grandLodgeId": "uglnsw-act",
      "lodgeId": "lodge-commonwealth-400",
      "memberNumber": "30198",
      "rank": "MM",
      "title": "Bro"
    },
    "createdAt": "2023-02-15T00:00:00Z",
    "updatedAt": "2023-02-15T00:00:00Z",
    "lastSignIn": "2023-10-20T00:00:00Z"
  },
  {
    "id": "mason-user-2",
    "email": "davidb@example.com",
    "firstName": "David",
    "lastName": "Brown",
    "phone": "+61 4 5678 9012",
    "masonicInfo": {
      "grandLodgeId": "uglnsw-act",
      "lodgeId": "university-lodge-275",
      "memberNumber": "25478",
      "rank": "MM",
      "title": "Bro"
    },
    "createdAt": "2023-03-10T00:00:00Z",
    "updatedAt": "2023-03-10T00:00:00Z",
    "lastSignIn": "2023-10-25T00:00:00Z"
  },
  {
    "id": "mason-user-3",
    "email": "roberts@example.com",
    "firstName": "Robert",
    "lastName": "Stevens",
    "phone": "+61 4 6789 0123",
    "masonicInfo": {
      "grandLodgeId": "uglnsw-act",
      "lodgeId": "lodge-harmony-15",
      "memberNumber": "19845",
      "rank": "WM",
      "title": "W Bro"
    },
    "createdAt": "2023-01-20T00:00:00Z",
    "updatedAt": "2023-01-20T00:00:00Z",
    "lastSignIn": "2023-10-29T00:00:00Z"
  },
  {
    "id": "mason-user-4",
    "email": "williamj@example.com",
    "firstName": "William",
    "lastName": "Jones",
    "phone": "+61 4 7890 1234",
    "masonicInfo": {
      "grandLodgeId": "uglvic",
      "lodgeId": "australia-felix-lodge-1",
      "memberNumber": "12587",
      "rank": "PM",
      "title": "W Bro"
    },
    "createdAt": "2023-02-05T00:00:00Z",
    "updatedAt": "2023-02-05T00:00:00Z",
    "lastSignIn": "2023-10-15T00:00:00Z"
  },
  {
    "id": "mason-user-5",
    "email": "thomasb@example.com",
    "firstName": "Thomas",
    "lastName": "Black",
    "phone": "+61 4 8901 2345",
    "masonicInfo": {
      "grandLodgeId": "uglqld",
      "lodgeId": "north-australian-lodge-1",
      "memberNumber": "30145",
      "rank": "MM",
      "title": "Bro"
    },
    "createdAt": "2023-03-15T00:00:00Z",
    "updatedAt": "2023-03-15T00:00:00Z",
    "lastSignIn": "2023-10-22T00:00:00Z"
  },
  {
    "id": "mason-user-6",
    "email": "georgem@example.com",
    "firstName": "George",
    "lastName": "Mitchell",
    "phone": "+61 4 9012 3456",
    "masonicInfo": {
      "grandLodgeId": "ugle",
      "memberNumber": "45879",
      "rank": "MM",
      "title": "Bro"
    },
    "createdAt": "2023-04-10T00:00:00Z",
    "updatedAt": "2023-04-10T00:00:00Z",
    "lastSignIn": "2023-10-18T00:00:00Z"
  }
]
```

## Grand Officers

```json
[
  {
    "id": "grand-master-1",
    "email": "grandmaster@masons.au",
    "firstName": "Bernie Khristian",
    "lastName": "Albano",
    "phone": "+61 4 1111 1111",
    "masonicInfo": {
      "grandLodgeId": "uglnsw-act",
      "lodgeId": "lodge-harmony-15",
      "memberNumber": "10001",
      "rank": "GM",
      "title": "MW Bro"
    },
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "lastSignIn": "2023-11-01T00:00:00Z"
  },
  {
    "id": "deputy-grand-master-1",
    "email": "dgm@masons.au",
    "firstName": "Richard",
    "lastName": "Anderson",
    "phone": "+61 4 2222 2222",
    "masonicInfo": {
      "grandLodgeId": "uglnsw-act",
      "lodgeId": "sydney-lodge-1169",
      "memberNumber": "10002",
      "rank": "DGM",
      "title": "RW Bro"
    },
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "lastSignIn": "2023-10-30T00:00:00Z"
  },
  {
    "id": "grand-secretary-1",
    "email": "gsec@masons.au",
    "firstName": "Christopher",
    "lastName": "Thompson",
    "phone": "+61 4 3333 3333",
    "masonicInfo": {
      "grandLodgeId": "uglnsw-act",
      "lodgeId": "lodge-commonwealth-400",
      "memberNumber": "10003",
      "rank": "GO",
      "title": "RW Bro"
    },
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "lastSignIn": "2023-10-29T00:00:00Z"
  }
]
```

## Organizer Accounts

```json
[
  {
    "id": "org-account-1",
    "userId": "admin-user-1",
    "organizationId": "uglnsw-act",
    "role": "admin",
    "permissions": ["manage_events", "manage_tickets", "manage_users", "manage_organizations", "manage_finances"],
    "dashboardStats": {
      "totalEvents": 10,
      "ticketsSold": 1243,
      "totalRevenue": 187450,
      "attendees": 987
    },
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  },
  {
    "id": "org-account-2",
    "userId": "event-manager-1",
    "organizationId": "uglnsw-act",
    "role": "editor",
    "permissions": ["manage_events", "manage_tickets"],
    "dashboardStats": {
      "totalEvents": 8,
      "ticketsSold": 895,
      "totalRevenue": 134250,
      "attendees": 756
    },
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  },
  {
    "id": "org-account-3",
    "userId": "lodge-secretary-1",
    "organizationId": "lodge-commonwealth-400",
    "role": "admin",
    "permissions": ["manage_events", "manage_tickets", "manage_finances"],
    "dashboardStats": {
      "totalEvents": 4,
      "ticketsSold": 210,
      "totalRevenue": 4200,
      "attendees": 195
    },
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
]
```

## Auth Sessions

```json
[
  {
    "id": "session-1",
    "userId": "admin-user-1",
    "createdAt": "2023-11-01T00:00:00Z",
    "expiresAt": "2023-11-08T00:00:00Z",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "ipAddress": "192.168.1.1"
  },
  {
    "id": "session-2",
    "userId": "event-manager-1",
    "createdAt": "2023-10-15T00:00:00Z",
    "expiresAt": "2023-10-22T00:00:00Z",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "ipAddress": "192.168.1.2"
  },
  {
    "id": "session-3",
    "userId": "mason-user-1",
    "createdAt": "2023-10-20T00:00:00Z",
    "expiresAt": "2023-10-27T00:00:00Z",
    "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    "ipAddress": "192.168.1.3"
  }
]
```