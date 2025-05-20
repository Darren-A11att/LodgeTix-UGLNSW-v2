import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, TicketIcon } from "lucide-react"
import { getEventById } from "@/lib/event-facade"
import { TicketSelectionWithOrder } from "./components/ticket-selection-with-order"

export default async function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Server-side data fetching from facade
  const event = await getEventById(id)
  
  if (!event) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href={`/events/${event.slug}`} className="flex items-center">
          <ArrowLeft className="mr-2 h-5 w-5" />
          <span>Back to Event</span>
        </Link>
        <div className="flex items-center">
          <TicketIcon className="mr-2 h-5 w-5 text-blue-600" />
          <span className="font-bold">LodgeTix</span>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{event.title} - Tickets</h1>
          <p className="text-gray-500">
            {event.date} • {event.location}
          </p>
        </div>

        <TicketSelectionWithOrder 
          tickets={event.tickets || []} 
          eventId={event.id}
          eventSlug={event.slug}
        />
      </main>
    </div>
  )
}