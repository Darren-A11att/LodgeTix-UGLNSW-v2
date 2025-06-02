import Link from "next/link"
import Image from "next/image"
import { formatCurrency } from "@/lib/formatters"
import { EventRPCService } from "@/lib/api/event-rpc-service"

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export async function FeaturedEventsRedesigned() {
  // Get the featured function ID from environment variable
  const featuredFunctionId = process.env.FEATURED_FUNCTION_ID;
  
  // Initialize RPC service
  const eventService = new EventRPCService(true); // server-side
  
  try {
    // Fetch featured events from the featured function - limit to 2 for alternating layout
    const events = await eventService.getFeaturedEvents(2, featuredFunctionId);
    
    // Transform data for display
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
      imageUrl: event.image_url || '/placeholder.svg?height=400&width=1000',
      price: event.min_price > 0 
        ? `From ${formatCurrency(event.min_price)}` 
        : event.has_free_tickets 
          ? 'Free' 
          : 'View pricing',
      isSoldOut: event.is_sold_out,
      ticketsAvailable: event.total_capacity - event.tickets_sold
    }));
    
    // If no events from database, use defaults
    if (eventsForDisplay.length === 0) {
      return <FeaturedEventsRedesignedFallback />;
    }
    
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-masonic-navy sm:text-5xl">Featured Events</h2>
            <p className="mt-4 text-lg text-gray-600">
              Experience the finest in Masonic tradition and fellowship. Join us for these carefully curated events 
              that celebrate our heritage and strengthen our community bonds.
            </p>
          </div>

          <div className="mt-16 space-y-16">
            {eventsForDisplay.map((event, eventIdx) => (
              <div
                key={event.id}
                className="flex flex-col-reverse lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8"
              >
                <div
                  className={classNames(
                    eventIdx % 2 === 0 ? 'lg:col-start-1' : 'lg:col-start-6 xl:col-start-7',
                    'mt-6 lg:col-span-7 lg:row-start-1 lg:mt-0 xl:col-span-6',
                  )}
                >
                  <h3 className="text-lg font-medium text-masonic-navy">{event.title}</h3>
                  <p className="mt-2 text-base/7 text-gray-500">{event.description}</p>
                  <div className="mt-3 text-base/7 text-gray-500">
                    <time>{event.date}</time>
                    {event.location && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{event.location}</span>
                      </>
                    )}
                  </div>
                </div>
                <div
                  className={classNames(
                    eventIdx % 2 === 0 ? 'lg:col-start-8 xl:col-start-7' : 'lg:col-start-1',
                    'flex-auto lg:col-span-5 lg:row-start-1 xl:col-span-6',
                  )}
                >
                  <Image
                    alt={event.title}
                    src={event.imageUrl}
                    width={1000}
                    height={400}
                    className="aspect-5/2 w-full rounded-lg bg-gray-100 object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Link
              href="/functions"
              className="inline-flex items-center justify-center rounded-md bg-masonic-navy px-6 py-3 text-base font-medium text-white hover:bg-masonic-blue transition-colors"
            >
              View All Events
              <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load featured events:', error);
    // Fallback to static content on error
    return <FeaturedEventsRedesignedFallback />;
  }
}

// Fallback component with default events
function FeaturedEventsRedesignedFallback() {
  const defaultEvents = [
    {
      id: "1",
      slug: "third-degree-ceremony",
      title: "Third Degree Ceremony",
      description: "A solemn ceremony raising a Brother to the sublime degree of a Master Mason. Experience the ancient traditions and profound symbolism of Freemasonry.",
      date: "Saturday, October 14, 2023",
      location: "Lodge Commonwealth No. 400, Sydney",
      imageUrl: "/placeholder.svg?height=400&width=1000",
      price: "$20",
      isSoldOut: false
    },
    {
      id: "2",
      slug: "masonic-education-night",
      title: "Masonic Education Night",
      description: "Learn about the symbolism and history of Freemasonry from distinguished speakers. Deepen your understanding of our ancient craft.",
      date: "Monday, September 25, 2023",
      location: "Lodge Antiquity No. 1, Sydney",
      imageUrl: "/placeholder.svg?height=400&width=1000",
      price: "$15",
      isSoldOut: false
    }
  ];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-masonic-navy sm:text-5xl">Featured Events</h2>
          <p className="mt-4 text-lg text-gray-600">
            Experience the finest in Masonic tradition and fellowship. Join us for these carefully curated events 
            that celebrate our heritage and strengthen our community bonds.
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {defaultEvents.map((event, eventIdx) => (
            <div
              key={event.id}
              className="flex flex-col-reverse lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8"
            >
              <div
                className={classNames(
                  eventIdx % 2 === 0 ? 'lg:col-start-1' : 'lg:col-start-6 xl:col-start-7',
                  'mt-6 lg:col-span-7 lg:row-start-1 lg:mt-0 xl:col-span-6',
                )}
              >
                <h3 className="text-lg font-medium text-masonic-navy">{event.title}</h3>
                <p className="mt-2 text-base/7 text-gray-500">{event.description}</p>
                <div className="mt-3 text-base/7 text-gray-500">
                  <time>{event.date}</time>
                  <span className="mx-2">•</span>
                  <span>{event.location}</span>
                </div>
              </div>
              <div
                className={classNames(
                  eventIdx % 2 === 0 ? 'lg:col-start-8 xl:col-start-7' : 'lg:col-start-1',
                  'flex-auto lg:col-span-5 lg:row-start-1 xl:col-span-6',
                )}
              >
                <Image
                  alt={event.title}
                  src={event.imageUrl}
                  width={1000}
                  height={400}
                  className="aspect-5/2 w-full rounded-lg bg-gray-100 object-cover"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <Link
            href="/functions"
            className="inline-flex items-center justify-center rounded-md bg-masonic-navy px-6 py-3 text-base font-medium text-white hover:bg-masonic-blue transition-colors"
          >
            View All Events
            <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}