import { getEvents } from "@/lib/event-facade"
import { EventCard } from "@/components/event-card"
import { formatCurrency } from "@/lib/formatters"

export default async function EventsPage() {
  const events = await getEvents()
  
  // Filter for published parent events only (no parent_event_id)
  const publishedEvents = events.filter(event => 
    event.isPublished && !event.parent_event_id
  )
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upcoming Events</h1>
          <p className="text-lg text-gray-600">
            Discover and register for upcoming Masonic events and ceremonies
          </p>
        </div>
        
        {publishedEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No events are currently available.</p>
            <p className="text-gray-400 mt-2">Please check back later for upcoming events.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publishedEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                slug={event.slug}
                title={event.title}
                description={event.description}
                date={event.date || event.eventStart}
                location={event.location}
                imageUrl={event.imageUrl}
                price={event.price || formatCurrency(0)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}