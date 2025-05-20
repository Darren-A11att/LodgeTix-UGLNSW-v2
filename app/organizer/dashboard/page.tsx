import { getEvents } from "@/lib/event-facade"
import OrganizerDashboardClient from "./client"

export default async function OrganizerDashboardWrapper() {
  // Fetch events server-side
  const events = await getEvents()
  
  // Transform to match expected format
  const formattedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    date: event.date || "Date TBD",
    status: event.status || "Published",
    ticketsSold: event.ticketsSold || 0,
    revenue: event.revenue || "$0",
  }))
  
  return <OrganizerDashboardClient events={formattedEvents} />
}