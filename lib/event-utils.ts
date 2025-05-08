export interface Event {
  id: string
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
}

export interface Ticket {
  id: string
  name: string
  price: number
  available: boolean
  description?: string
  quantity?: number
}

// This would normally be fetched from a database
export const getEvents = (): Event[] => {
  return [
    {
      id: "1",
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
    },
    {
      id: "2",
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
    },
    {
      id: "3",
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
    },
    {
      id: "4",
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
    },
  ]
}

export const getEventById = (id: string): Event | undefined => {
  return getEvents().find((event) => event.id === id)
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
