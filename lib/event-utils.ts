import { findById, findBySlug, generateUUID, isUUID } from '@/lib/uuid-slug-utils';

export interface Event {
  id: string        // UUID
  slug: string      // URL-friendly identifier
  title: string
  description: string
  date: string
  location: string
  imageUrl: string
  price: string
  organizer?: string
  category?: string
  status?: "Published" | "Draft" | "Members Only"
  ticketsSold?: number
  revenue?: string
  dressCode?: string
  regalia?: string
  degreeType?: string
  tickets?: Ticket[]
  longDescription?: string
  time?: string
}

export interface Ticket {
  id: string        // UUID
  slug?: string     // URL-friendly identifier (optional for tickets)
  name: string
  price: number
  available: boolean
  description?: string
  quantity?: number
}

// This would normally be fetched from a database
// Note: Now includes both UUIDs and slugs
export const getEvents = (): Event[] => {
  return [
    {
      id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
      slug: "third-degree-ceremony",
      title: "Third Degree Ceremony",
      description: "A solemn ceremony raising a Brother to the sublime degree of a Master Mason.",
      date: "October 10, 2023",
      location: "Harmony Lodge No. 123, Manchester",
      imageUrl: "/placeholder.svg?height=200&width=400",
      price: "£20",
      category: "Degree Ceremony",
      status: "Published",
      ticketsSold: 32,
      revenue: "£640",
      dressCode: "Dark Suit",
      regalia: "Craft Regalia",
      degreeType: "Third Degree",
      tickets: [
        { id: "1", name: "Lodge Member", price: 20, available: true },
        { id: "2", name: "Visiting Brother", price: 25, available: true },
      ],
    },
    {
      id: "d290f1ee-6c54-4b01-90e6-d701748f0852",
      slug: "masonic-lecture-series",
      title: "Masonic Lecture Series",
      description: "Learn about the symbolism and history of Freemasonry from distinguished speakers.",
      date: "September 25, 2023",
      location: "Wisdom Lodge No. 456, Birmingham",
      imageUrl: "/placeholder.svg?height=200&width=400",
      price: "£15",
      category: "Lecture",
      status: "Published",
      ticketsSold: 45,
      revenue: "£675",
      tickets: [
        { id: "1", name: "Standard Ticket", price: 15, available: true },
        { id: "2", name: "Premium Seating", price: 25, available: true },
      ],
    },
    {
      id: "d290f1ee-6c54-4b01-90e6-d701748f0853",
      slug: "annual-ladies-night",
      title: "Annual Ladies Night",
      description: "A formal dinner and dance celebrating the partners who support our Masonic journey.",
      date: "October 5, 2023",
      location: "Grand Hotel, Edinburgh",
      imageUrl: "/placeholder.svg?height=200&width=400",
      price: "£75",
      category: "Social Event",
      status: "Draft",
      ticketsSold: 0,
      revenue: "£0",
      tickets: [
        { id: "1", name: "Single Ticket", price: 75, available: true },
        { id: "2", name: "Couple Ticket", price: 140, available: true },
      ],
    },
    {
      id: "d290f1ee-6c54-4b01-90e6-d701748f0854",
      slug: "installation-ceremony",
      title: "Installation Ceremony",
      description: "Join us for the Installation of W.Bro. James Wilson as Worshipful Master of Harmony Lodge No. 123.",
      date: "November 15, 2023",
      location: "Masonic Hall, Manchester",
      imageUrl: "/placeholder.svg?height=400&width=800",
      price: "£30",
      category: "Installation",
      status: "Published",
      ticketsSold: 45,
      revenue: "£1,350",
      dressCode: "Dark Suit",
      regalia: "Craft Regalia",
      tickets: [
        { id: "1", name: "Lodge Member", price: 25, available: true },
        { id: "2", name: "Visiting Brother", price: 30, available: true },
        { id: "3", name: "Grand Officer", price: 35, available: true },
      ],
    },
    {
      id: "d290f1ee-6c54-4b01-90e6-d701748f0855",
      slug: "grand-installation",
      title: "Grand Installation 2025",
      description: "Join us for the Installation of MW Bro Bernie Khristian Albano as Grand Master of the United Grand Lodge of NSW & ACT.",
      date: "May 15-17, 2025",
      location: "Sydney Masonic Centre, Sydney",
      imageUrl: "/placeholder.svg?height=400&width=800",
      price: "£75",
      category: "Installation",
      status: "Published",
      ticketsSold: 0,
      revenue: "£0",
      dressCode: "Morning Suit or Dark Lounge Suit",
      regalia: "Full Regalia according to rank",
      tickets: [
        { id: "1", name: "Standard Access", price: 75, available: true },
        { id: "2", name: "VIP Access", price: 120, available: true },
        { id: "3", name: "Full Weekend Pass", price: 200, available: true },
      ],
    },
  ]
}

/**
 * Get an event by its identifier (either UUID or slug)
 * @param idOrSlug - UUID or slug string
 */
export const getEventByIdOrSlug = (idOrSlug: string): Event | undefined => {
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

export const getEventsByCategory = (category: string): Event[] => {
  return getEvents().filter((event) => event.category?.toLowerCase() === category.toLowerCase())
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
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