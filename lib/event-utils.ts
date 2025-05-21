import { findById, findBySlug, generateUUID, isUUID } from '@/lib/uuid-slug-utils';
import type { EventType } from '@/shared/types/event';

// Extended Event interface to match the EventType from shared/types/event.ts
// but with backward compatibility for existing mock data
export interface Event extends Partial<EventType> {
  id: string;                // UUID (required)
  slug: string;              // URL-friendly identifier (required)
  title: string;             // Event title (required)
  description: string;       // Event description (required)
  
  // Either eventStart/eventEnd or date/time can be used
  date: string;              // Legacy date string format
  eventStart?: string;       // ISO date string
  eventEnd?: string;         // ISO date string
  
  location: string;          // Event location (required)
  imageUrl: string;          // Image URL (required)
  price: string;             // Formatted price with currency symbol
  
  // Optional fields
  organizer?: string;        // Event organizer name
  organizerName?: string;    // Alias for organizer in new schema
  category?: string;         // Event category
  status?: "Published" | "Draft" | "Members Only"; // Publication status
  ticketsSold?: number;      // Number of tickets sold
  revenue?: string;          // Formatted revenue string
  dressCode?: string;        // Required dress code
  regalia?: string;          // Required regalia
  degreeType?: string;       // Degree type for ceremony
  tickets?: Ticket[];        // Array of available tickets
  longDescription?: string;  // Extended description
  time?: string;             // Time string if not using eventStart/eventEnd
  
  // New fields from Supabase schema
  featured?: boolean;        // Featured status for homepage display
  sections?: any;            // Structured sections data
  location_json?: any;       // Structured location data
  is_published?: boolean;    // Publication status as boolean
  type?: string;             // Event type
  degree_type?: string;      // Degree type for ceremonies
  organizer_name?: string;   // Organizer name
  organizer_contact?: any;   // Organizer contact information
  regalia_description?: string; // Extended regalia description
  related_events?: string[]; // Related event IDs
  parentEventId?: string;    // Parent event ID
  createdAt?: string;        // Creation timestamp
  updatedAt?: string;        // Last update timestamp
  
  // Additional fields for compatibility
  eventIncludes?: string[];  // What's included with registration
  importantInformation?: string[]; // Important information for attendees
  isMultiDay?: boolean;      // Is this a multi-day event
  isPurchasableIndividually?: boolean; // Can be purchased individually
  maxAttendees?: number;     // Maximum attendance limit
  latitude?: number;         // Venue latitude
  longitude?: number;        // Venue longitude
  
  // UI-specific derived fields
  day?: string;              // Formatted day
  imageSrc?: string;         // Alias for imageUrl
  startTimeFormatted?: string; // Formatted start time
  endTimeFormatted?: string; // Formatted end time
  until?: string;            // End time notation
}

export interface Ticket {
  id: string;        // UUID
  slug?: string;     // URL-friendly identifier (optional for tickets)
  name: string;      // Ticket name
  price: number;     // Ticket price as number
  available: boolean; // Availability status
  description?: string; // Ticket description
  quantity?: number; // Quantity available
}

// Convert string date to ISO date format for consistency
function convertToISODate(dateStr: string): string {
  try {
    // Try to parse the date - will throw if invalid format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date.toISOString();
  } catch (error) {
    // If we can't parse it, just use the original string
    // This keeps backward compatibility with existing mock data
    return dateStr;
  }
}

// This would normally be fetched from a database
// Note: Includes both UUIDs and slugs, enhanced to match Supabase schema
export const getEvents = (): Event[] => {
  return [
    {
      // Core fields
      id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
      slug: "third-degree-ceremony",
      title: "Third Degree Ceremony",
      description: "A solemn ceremony raising a Brother to the sublime degree of a Master Mason.",
      
      // Date and time fields (both formats for compatibility)
      date: "October 10, 2023",
      time: "19:00",
      eventStart: "2023-10-10T19:00:00.000Z",
      eventEnd: "2023-10-10T21:30:00.000Z",
      
      // Location
      location: "Harmony Lodge No. 123, Manchester",
      location_json: {
        name: "Harmony Lodge No. 123",
        address: "123 Mason Street, Manchester, UK",
        coordinates: {
          lat: 53.4808, 
          long: -2.2426
        }
      },
      latitude: 53.4808,
      longitude: -2.2426,
      
      // Image and pricing
      imageUrl: "/placeholder.svg?height=200&width=400",
      imageSrc: "/placeholder.svg?height=200&width=400",
      price: "£20",
      
      // Categorization
      category: "Degree Ceremony",
      type: "Ceremony",
      degreeType: "Third Degree",
      degree_type: "Third Degree",
      
      // Publication status (both formats)
      status: "Published",
      is_published: true,
      featured: true,
      
      // Attire and requirements
      dressCode: "Dark Suit",
      dress_code: "Dark Suit",
      regalia: "Craft Regalia",
      regalia_description: "Craft Regalia according to rank",
      
      // Sales information
      ticketsSold: 32,
      revenue: "£640",
      
      // Metadata
      createdAt: "2023-06-01T12:00:00.000Z",
      updatedAt: "2023-06-10T14:30:00.000Z",
      isMultiDay: false,
      isPurchasableIndividually: true,
      maxAttendees: 100,
      
      // Additional information
      organizer: "Harmony Lodge No. 123",
      organizer_name: "Harmony Lodge No. 123",
      organizer_contact: {
        email: "secretary@harmonylodge.org",
        phone: "+44 123 456 7890"
      },
      
      // Content arrays
      importantInformation: [
        "Candidates must arrive 1 hour early",
        "Dark suit is mandatory",
        "Bring valid Masonic ID"
      ],
      eventIncludes: [
        "Ceremony attendance",
        "Festive board dinner",
        "Ritual book"
      ],
      
      // Structured content
      sections: {
        agenda: [
          { time: "18:00", description: "Lodge opens" },
          { time: "19:00", description: "Ceremony begins" },
          { time: "21:00", description: "Festive board" }
        ],
        eligibilityRequirements: [
          "Must be a Fellow Craft Mason",
          "Must have completed proficiency"
        ]
      },
      
      // Related events
      related_events: ["d290f1ee-6c54-4b01-90e6-d701748f0852"],
      
      // Tickets
      tickets: [
        { id: "3df9e4a0-6f83-4c01-8f90-3e28940f347a", name: "Lodge Member", price: 20, available: true, description: "For members of Harmony Lodge" },
        { id: "5ac12b90-1f94-5d12-9f01-4e39050f448b", name: "Visiting Brother", price: 25, available: true, description: "For visiting Brethren" },
      ],
    },
    {
      // Core fields
      id: "d290f1ee-6c54-4b01-90e6-d701748f0852",
      slug: "masonic-lecture-series",
      title: "Masonic Lecture Series",
      description: "Learn about the symbolism and history of Freemasonry from distinguished speakers.",
      longDescription: "A special lecture series featuring prominent Masonic scholars discussing the rich symbolism and storied history of Freemasonry. Light refreshments will be served after the presentations, providing an opportunity for discussion and fellowship.",
      
      // Date and time fields
      date: "September 25, 2023",
      time: "18:30",
      eventStart: "2023-09-25T18:30:00.000Z",
      eventEnd: "2023-09-25T21:00:00.000Z",
      
      // Location
      location: "Wisdom Lodge No. 456, Birmingham",
      location_json: {
        name: "Wisdom Lodge No. 456",
        address: "456 Freemason Way, Birmingham, UK",
        coordinates: {
          lat: 52.4862, 
          long: -1.8904
        }
      },
      latitude: 52.4862,
      longitude: -1.8904,
      
      // Image and pricing
      imageUrl: "/placeholder.svg?height=200&width=400",
      imageSrc: "/placeholder.svg?height=200&width=400",
      price: "£15",
      
      // Categorization
      category: "Lecture",
      type: "Educational",
      
      // Publication status
      status: "Published",
      is_published: true,
      featured: true,
      
      // Sales information
      ticketsSold: 45,
      revenue: "£675",
      
      // Metadata
      createdAt: "2023-06-15T10:20:00.000Z",
      updatedAt: "2023-07-05T16:15:00.000Z",
      isMultiDay: false,
      isPurchasableIndividually: true,
      maxAttendees: 75,
      
      // Additional information
      organizer: "Research Lodge of Birmingham",
      organizer_name: "Research Lodge of Birmingham",
      organizer_contact: {
        email: "education@birminghammasons.org",
        phone: "+44 121 456 7890"
      },
      
      // Content arrays
      importantInformation: [
        "Open to Master Masons only",
        "Bring a notebook",
        "Questions encouraged"
      ],
      eventIncludes: [
        "Three lectures",
        "Q&A session",
        "Refreshments",
        "Educational materials"
      ],
      
      // Structured content
      sections: {
        speakers: [
          { name: "W.Bro. John Smith", topic: "Ancient Symbols in Modern Freemasonry" },
          { name: "Bro. Michael Johnson", topic: "The Evolution of Ritual" }
        ],
        schedule: [
          { time: "18:30", activity: "Welcome and Introduction" },
          { time: "18:45", activity: "First Lecture" },
          { time: "19:30", activity: "Break" },
          { time: "19:45", activity: "Second Lecture" },
          { time: "20:30", activity: "Q&A Session" },
          { time: "21:00", activity: "Conclusion and Refreshments" }
        ]
      },
      
      // Related events
      related_events: ["d290f1ee-6c54-4b01-90e6-d701748f0851"],
      
      // Tickets
      tickets: [
        { id: "6ef9e4a2-7f83-4c01-8f90-4e28940f347a", name: "Standard Ticket", price: 15, available: true, description: "General admission" },
        { id: "7ac12b90-2f94-5d12-9f01-5e39050f448b", name: "Premium Seating", price: 25, available: true, description: "Front row seats with complimentary materials" },
      ],
    },
    {
      // Core fields
      id: "d290f1ee-6c54-4b01-90e6-d701748f0853",
      slug: "annual-ladies-night",
      title: "Annual Ladies Night",
      description: "A formal dinner and dance celebrating the partners who support our Masonic journey.",
      
      // Date and time fields
      date: "October 5, 2023",
      time: "19:00",
      eventStart: "2023-10-05T19:00:00.000Z",
      eventEnd: "2023-10-05T23:30:00.000Z",
      
      // Location
      location: "Grand Hotel, Edinburgh",
      location_json: {
        name: "Grand Hotel",
        address: "1 Princes Street, Edinburgh, UK",
        coordinates: {
          lat: 55.9533, 
          long: -3.1883
        }
      },
      latitude: 55.9533,
      longitude: -3.1883,
      
      // Image and pricing
      imageUrl: "/placeholder.svg?height=200&width=400",
      imageSrc: "/placeholder.svg?height=200&width=400",
      price: "£75",
      
      // Categorization
      category: "Social Event",
      type: "Social",
      
      // Publication status
      status: "Draft",
      is_published: false,
      featured: false,
      
      // Attire
      dressCode: "Black Tie",
      dress_code: "Black Tie",
      
      // Sales information
      ticketsSold: 0,
      revenue: "£0",
      
      // Metadata
      createdAt: "2023-07-10T09:30:00.000Z",
      updatedAt: "2023-07-10T09:30:00.000Z",
      isMultiDay: false,
      isPurchasableIndividually: true,
      maxAttendees: 200,
      
      // Additional information
      organizer: "Edinburgh Provincial Grand Lodge",
      organizer_name: "Edinburgh Provincial Grand Lodge",
      organizer_contact: {
        email: "social@edinburghmasons.org",
        phone: "+44 131 456 7890"
      },
      
      // Content arrays
      importantInformation: [
        "Pre-booking required by September 20th",
        "Dietary requirements must be specified in advance",
        "Photography allowed"
      ],
      eventIncludes: [
        "Welcome drinks reception",
        "3-course dinner",
        "Live band entertainment",
        "Professional photographs"
      ],
      
      // Structured content
      sections: {
        menu: [
          { course: "Starter", options: ["Smoked Salmon", "Vegetable Soup", "Mushroom Tartlet"] },
          { course: "Main", options: ["Beef Wellington", "Grilled Sea Bass", "Vegetable Wellington"] },
          { course: "Dessert", options: ["Sticky Toffee Pudding", "Lemon Tart", "Cheese Board"] }
        ],
        schedule: [
          { time: "19:00", activity: "Drinks Reception" },
          { time: "19:45", activity: "Call to Dinner" },
          { time: "20:00", activity: "Dinner Service" },
          { time: "21:30", activity: "Speeches" },
          { time: "22:00", activity: "Dancing" },
          { time: "23:30", activity: "Carriages" }
        ]
      },
      
      // Tickets
      tickets: [
        { id: "8ef9e4a2-8f83-4c01-8f90-5e28940f347a", name: "Single Ticket", price: 75, available: true, description: "Admission for one person" },
        { id: "9ac12b90-3f94-5d12-9f01-6e39050f448b", name: "Couple Ticket", price: 140, available: true, description: "Admission for a Mason and partner" },
      ],
    },
    {
      // Core fields
      id: "d290f1ee-6c54-4b01-90e6-d701748f0854",
      slug: "installation-ceremony",
      title: "Installation Ceremony",
      description: "Join us for the Installation of W.Bro. James Wilson as Worshipful Master of Harmony Lodge No. 123.",
      
      // Date and time fields
      date: "November 15, 2023",
      time: "17:30",
      eventStart: "2023-11-15T17:30:00.000Z",
      eventEnd: "2023-11-15T22:00:00.000Z",
      
      // Location
      location: "Masonic Hall, Manchester",
      location_json: {
        name: "Manchester Masonic Hall",
        address: "Bridge Street, Manchester, UK",
        coordinates: {
          lat: 53.4808, 
          long: -2.2426
        }
      },
      latitude: 53.4808,
      longitude: -2.2426,
      
      // Image and pricing
      imageUrl: "/placeholder.svg?height=400&width=800",
      imageSrc: "/placeholder.svg?height=400&width=800",
      price: "£30",
      
      // Categorization
      category: "Installation",
      type: "Installation",
      
      // Publication status
      status: "Published",
      is_published: true,
      featured: true,
      
      // Attire and requirements
      dressCode: "Dark Suit",
      dress_code: "Dark Suit",
      regalia: "Craft Regalia",
      regalia_description: "Craft Regalia according to rank",
      
      // Sales information
      ticketsSold: 45,
      revenue: "£1,350",
      
      // Metadata
      createdAt: "2023-08-01T11:00:00.000Z",
      updatedAt: "2023-09-10T15:45:00.000Z",
      isMultiDay: false,
      isPurchasableIndividually: true,
      maxAttendees: 100,
      
      // Additional information
      organizer: "Harmony Lodge No. 123",
      organizer_name: "Harmony Lodge No. 123",
      organizer_contact: {
        email: "secretary@harmonylodge.org",
        phone: "+44 123 456 7890"
      },
      
      // Content arrays
      importantInformation: [
        "Tyling at 17:30 sharp",
        "Visiting brethren must have valid Masonic ID",
        "Festive board includes wine"
      ],
      eventIncludes: [
        "Installation ceremony",
        "Festive board dinner",
        "Commemorative program"
      ],
      
      // Structured content
      sections: {
        agenda: [
          { time: "17:30", description: "Lodge opens" },
          { time: "18:00", description: "Installation ceremony begins" },
          { time: "20:00", description: "Lodge closes" },
          { time: "20:15", description: "Festive board" }
        ]
      },
      
      // Related events
      related_events: ["d290f1ee-6c54-4b01-90e6-d701748f0855"],
      
      // Tickets
      tickets: [
        { id: "aef9e4a2-9f83-4c01-8f90-6e28940f347a", name: "Lodge Member", price: 25, available: true, description: "For members of Harmony Lodge" },
        { id: "bac12b90-4f94-5d12-9f01-7e39050f448b", name: "Visiting Brother", price: 30, available: true, description: "For Masons from other Lodges" },
        { id: "cef13b90-5f94-5d12-9f01-8e39050f448b", name: "Grand Officer", price: 35, available: true, description: "For current and past Grand Officers" }
      ],
    },
    {
      // Core fields
      id: "d290f1ee-6c54-4b01-90e6-d701748f0855",
      slug: "grand-installation-2025",
      title: "Grand Installation 2025",
      description: "Join us for the Installation of MW Bro Bernie Khristian Albano as Grand Master of the United Grand Lodge of NSW & ACT.",
      longDescription: "The United Grand Lodge of NSW & ACT invites you to the Installation of MW Bro Bernie Khristian Albano as Grand Master. This prestigious ceremony will be followed by a gala banquet and an optional farewell brunch the following day. Special accommodation rates are available at partner hotels.",
      
      // Date and time fields
      date: "May 15-17, 2025",
      time: "10:00",
      eventStart: "2025-05-15T10:00:00.000Z",
      eventEnd: "2025-05-17T14:00:00.000Z",
      
      // Location
      location: "Sydney Masonic Centre, Sydney",
      location_json: {
        name: "Sydney Masonic Centre",
        address: "66 Goulburn Street, Sydney, NSW 2000, Australia",
        coordinates: {
          lat: -33.8768, 
          long: 151.2091
        }
      },
      latitude: -33.8768,
      longitude: 151.2091,
      
      // Image and pricing
      imageUrl: "/placeholder.svg?height=400&width=800",
      imageSrc: "/placeholder.svg?height=400&width=800",
      price: "£75",
      
      // Categorization
      category: "Installation",
      type: "Grand Installation",
      
      // Publication status
      status: "Published",
      is_published: true,
      featured: true,
      
      // Attire and requirements
      dressCode: "Morning Suit or Dark Lounge Suit",
      dress_code: "Morning Suit or Dark Lounge Suit",
      regalia: "Full Regalia according to rank",
      regalia_description: "Grand Officers in full regalia with chains of office. Past Grand Officers in full dress regalia. Other brethren in craft regalia with highest Masonic rank.",
      
      // Sales information
      ticketsSold: 0,
      revenue: "£0",
      
      // Metadata
      createdAt: "2024-01-15T09:00:00.000Z",
      updatedAt: "2024-02-20T14:30:00.000Z",
      isMultiDay: true,
      isPurchasableIndividually: true,
      maxAttendees: 500,
      
      // Additional information
      organizer: "United Grand Lodge of NSW & ACT",
      organizer_name: "United Grand Lodge of NSW & ACT",
      organizer_contact: {
        email: "grandinstallation@masonicevents.com.au",
        phone: "+61 2 9267 9100",
        website: "https://masonicevents.com.au/grandinstallation2025"
      },
      
      // Content arrays
      importantInformation: [
        "Registration required by April 30, 2025",
        "Delegations must be registered together",
        "International visitors should contact the Grand Secretary's office"
      ],
      eventIncludes: [
        "Installation ceremony attendance",
        "Official program and commemorative gift",
        "Access to live streaming for international Brethren unable to attend"
      ],
      
      // Structured content
      sections: {
        schedule: [
          { day: "Friday, May 15", events: [
            { time: "10:00", activity: "Registration opens" },
            { time: "14:00", activity: "Grand Officers rehearsal" },
            { time: "19:00", activity: "Welcome reception (optional)" }
          ]},
          { day: "Saturday, May 16", events: [
            { time: "09:00", activity: "Registration and seating" },
            { time: "11:00", activity: "Grand Installation Ceremony" },
            { time: "14:00", activity: "Break" },
            { time: "19:00", activity: "Grand Banquet (optional)" }
          ]},
          { day: "Sunday, May 17", events: [
            { time: "09:30", activity: "Farewell Brunch (optional)" },
            { time: "11:30", activity: "Grand Master's Address" },
            { time: "14:00", activity: "Event concludes" }
          ]}
        ],
        accommodation: [
          { hotel: "Hilton Sydney", distance: "50m", rate: "AUD 250 per night" },
          { hotel: "Sheraton Grand Sydney Hyde Park", distance: "800m", rate: "AUD 280 per night" }
        ],
        eligibilityRequirements: [
          "Must be a Master Mason in good standing",
          "Properly attired according to rank",
          "Valid Masonic credentials required"
        ]
      },
      
      // Related events
      related_events: ["d290f1ee-6c54-4b01-90e6-d701748f0854"],
      parentEventId: null,
      
      // Tickets
      tickets: [
        { id: "def9e4a2-0f83-4c01-8f90-7e28940f347a", name: "Standard Access", price: 75, available: true, description: "General admission to the Installation Ceremony" },
        { id: "eac12b90-5f94-5d12-9f01-8e39050f448b", name: "VIP Access", price: 120, available: true, description: "Premium seating and commemorative medal" },
        { id: "fef13b90-6f94-5d12-9f01-9e39050f448b", name: "Full Weekend Pass", price: 200, available: true, description: "Includes all events: Installation, Banquet, and Brunch" }
      ],
    },
  ]
}

/**
 * Get an event by its identifier (either UUID or slug)
 * @param idOrSlug - UUID or slug string
 */
export const getEventByIdOrSlug = (idOrSlug: string): Event | undefined => {
  if (!idOrSlug) return undefined;
  
  const events = getEvents();
  
  // Check if the identifier is a UUID
  if (isUUID(idOrSlug)) {
    return findById(events, idOrSlug);
  }
  
  // Otherwise, treat it as a slug
  return findBySlug(events, idOrSlug);
}

/**
 * Legacy method for backward compatibility
 * @deprecated Use getEventByIdOrSlug instead
 */
export const getEventById = (id: string): Event | undefined => {
  return getEventByIdOrSlug(id);
}

/**
 * Get events by category
 */
export const getEventsByCategory = (category: string): Event[] => {
  if (!category) return [];
  
  return getEvents().filter((event) => 
    event.category?.toLowerCase() === category.toLowerCase() ||
    event.type?.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Format currency amount with proper locale and symbol
 */
export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  if (amount === undefined || amount === null) return '';
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

/**
 * Map legacy string IDs to new UUID-based events
 * This helps during the transition period
 */
export const legacyIdToEventMapping: Record<string, string> = {
  "1": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "2": "d290f1ee-6c54-4b01-90e6-d701748f0852",
  "3": "d290f1ee-6c54-4b01-90e6-d701748f0853",
  "4": "d290f1ee-6c54-4b01-90e6-d701748f0854",
  "grand-installation": "d290f1ee-6c54-4b01-90e6-d701748f0855"
};