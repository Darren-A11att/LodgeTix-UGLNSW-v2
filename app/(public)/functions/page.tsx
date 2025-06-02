import Link from "next/link"
import { EventCard } from "@/components/event-card"
import { formatCurrency } from "@/lib/formatters"
import { EventRPCService } from "@/lib/api/event-rpc-service"
import { SectionHeader } from "@/components/register/RegistrationWizard/Shared/SectionHeader"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, MapPin, Users } from "lucide-react"

// Mark as dynamic since it uses server-side authentication
export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  // Initialize RPC service
  const eventService = new EventRPCService(true); // server-side
  
  try {
    // Fetch all events with pricing data in a single query
    const events = await eventService.getAllEvents();
    
    // Transform data for EventCard component
    const eventsForDisplay = events.map(event => {
      // Handle different possible data structures safely
      const eventId = event.event?.event?.event_id || event.event?.event_id || event.event_id || event.id;
      const eventStart = event.event_start || event.eventStart;
      
      return {
        id: eventId,
        slug: event.slug,
        title: event.title,
        description: event.description,
        date: eventStart ? new Date(eventStart).toLocaleDateString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'Date TBD',
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
        ticketsAvailable: (event.total_capacity || 0) - (event.tickets_sold || 0),
        eventType: event.event_type
      };
    });
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Section Header */}
          <SectionHeader>
            <h1 className="text-4xl font-bold mb-2 text-masonic-navy">Hero Function 2025</h1>
            <div className="masonic-divider"></div>
            <p className="text-gray-600 text-lg">
              A historic celebration marking the installation of the Grand Master
            </p>
          </SectionHeader>

          {/* Function Details */}
          <div className="mb-8 mt-8">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-6 w-6 text-masonic-navy" />
                    <div>
                      <h3 className="font-semibold text-masonic-navy">Event Period</h3>
                      <p className="text-gray-600">June 2025</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-masonic-navy" />
                    <div>
                      <h3 className="font-semibold text-masonic-navy">Location</h3>
                      <p className="text-gray-600">Sydney, NSW</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-masonic-navy" />
                    <div>
                      <h3 className="font-semibold text-masonic-navy">Expected Attendance</h3>
                      <p className="text-gray-600">500+ Brethren</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-700">
                    Join us for this momentous occasion in the history of the United Grand Lodge of NSW & ACT. 
                    This special function includes multiple events celebrating the installation of our new Grand Master.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events Section */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-masonic-navy mb-2">Function Events</h2>
            <p className="text-gray-600">Select from the following events to build your attendance package</p>
          </div>

          {eventsForDisplay.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No events are currently scheduled.</p>
              <p className="text-gray-500 mt-2">Please check back later for updates.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {eventsForDisplay.map((event) => (
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
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load events:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // Error fallback
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <SectionHeader>
            <h1 className="text-4xl font-bold mb-2 text-masonic-navy">Hero Function 2025</h1>
            <div className="masonic-divider"></div>
            <p className="text-gray-600 text-lg">
              A historic celebration marking the installation of the Grand Master
            </p>
          </SectionHeader>
          
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