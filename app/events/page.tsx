import Link from "next/link"
import { EventCard } from "@/components/event-card"
import { formatCurrency } from "@/lib/formatters"
import { EventRPCService } from "@/lib/api/event-rpc-service"

export default async function EventsPage() {
  // Initialize RPC service
  const eventService = new EventRPCService(true); // server-side
  
  try {
    // Fetch all events with pricing data in a single query
    const events = await eventService.getAllEvents();
    
    // Transform data for EventCard component
    const eventsForDisplay = events.map(event => ({
      id: event.event_id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      date: new Date(event.event_start).toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      location: event.location,
      imageUrl: event.image_url || '/placeholder.svg',
      price: event.min_price > 0 
        ? `From ${formatCurrency(event.min_price)}` 
        : event.has_free_tickets 
          ? 'Free' 
          : 'View pricing',
      parentEventId: event.parent_event_id,
      parentEventSlug: event.parent_slug,
      // Additional metadata
      isSoldOut: event.is_sold_out,
      ticketsAvailable: event.total_capacity - event.tickets_sold,
      eventType: event.event_type
    }));
    
    // Separate parent and child events for better organisation
    const parentEvents = eventsForDisplay.filter(e => !e.parentEventId);
    const childEvents = eventsForDisplay.filter(e => e.parentEventId);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Upcoming Events</h1>
            <p className="text-gray-600">
              Discover and attend Masonic events across NSW & ACT
            </p>
          </div>

          {eventsForDisplay.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No events are currently scheduled.</p>
              <p className="text-gray-500 mt-2">Please check back later for updates.</p>
            </div>
          ) : (
            <>
              {/* Main Events Section */}
              {parentEvents.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold mb-6">Major Events</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {parentEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        id={event.id}
                        slug={event.slug}
                        title={event.title}
                        description={event.description}
                        date={event.date}
                        location={event.location}
                        imageUrl={event.imageUrl}
                        price={event.price}
                        parentEventId={null}
                        parentEventSlug={null}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Related Events Section */}
              {childEvents.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold mb-6">Related Events</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {childEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        id={event.id}
                        slug={event.slug}
                        title={event.title}
                        description={event.description}
                        date={event.date}
                        location={event.location}
                        imageUrl={event.imageUrl}
                        price={event.price}
                        parentEventId={event.parentEventId}
                        parentEventSlug={event.parentEventSlug}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load events:', error);
    
    // Error fallback
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Upcoming Events</h1>
            <p className="text-gray-600">
              Discover and attend Masonic events across NSW & ACT
            </p>
          </div>
          
          <div className="text-center py-16">
            <p className="text-red-600 text-lg">Unable to load events at this time.</p>
            <p className="text-gray-500 mt-2">Please try again later or contact support.</p>
            <Link 
              href="/" 
              className="mt-4 inline-block px-6 py-2 bg-masonic-navy text-white rounded hover:bg-masonic-blue transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}