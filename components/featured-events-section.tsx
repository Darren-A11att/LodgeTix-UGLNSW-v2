import Link from "next/link"
import { EventCard } from "@/components/event-card"
import { formatCurrency } from "@/lib/formatters"
import { FEATURED_FUNCTION_ID, getFeaturedFunctionInfo } from "@/lib/utils/function-slug-resolver"

export async function FeaturedEventsSection() {
  try {
    // Get featured function info (including slug)
    const featuredFunction = await getFeaturedFunctionInfo(true);
    
    // Fetch events for the featured function using the API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events?function_id=eq.${FEATURED_FUNCTION_ID}&is_published=eq.true&order=event_start.asc&limit=3`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    
    const events = await response.json();
    
    // Transform data for EventCard component
    const eventsForDisplay = events.map((event: any) => ({
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
      location: event.location_id, // Will need to fetch location details separately if needed
      imageUrl: event.image_url || '/placeholder.svg',
      price: 'View pricing', // Will need to fetch ticket prices separately
      functionSlug: featuredFunction.slug,
      // Additional metadata
      eventStart: event.event_start,
      eventEnd: event.event_end
    }));
    
    // If no events from database, use defaults
    if (eventsForDisplay.length === 0) {
      return <FeaturedEventsFallback />;
    }
    
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Featured Events</h2>
            <Link href="/functions" className="text-blue-800 hover:underline">
              View all
            </Link>
          </div>
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
                functionSlug={event.functionSlug}
              />
            ))}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Failed to load featured events:', error);
    // Fallback to static content on error
    return <FeaturedEventsFallback />;
  }
}

// Fallback component with default events
function FeaturedEventsFallback() {
  const defaultEvents = [
    {
      id: "1",
      slug: "third-degree-ceremony",
      title: "Third Degree Ceremony",
      description: "A solemn ceremony raising a Brother to the sublime degree of a Master Mason.",
      date: "October 10, 2023",
      location: "Lodge Commonwealth No. 400, Sydney",
      imageUrl: "/placeholder.svg?height=200&width=400",
      price: "$20"
    },
    {
      id: "2",
      slug: "masonic-education-night",
      title: "Masonic Education Night",
      description: "Learn about the symbolism and history of Freemasonry from distinguished speakers.",
      date: "September 25, 2023",
      location: "Lodge Antiquity No. 1, Sydney",
      imageUrl: "/placeholder.svg?height=200&width=400",
      price: "$15"
    },
    {
      id: "3",
      slug: "annual-charity-gala",
      title: "Annual Charity Gala",
      description: "A formal dinner raising funds for the Masonic charities of NSW & ACT.",
      date: "December 5, 2023",
      location: "Grand Ballroom, Hilton Sydney",
      imageUrl: "/placeholder.svg?height=200&width=400",
      price: "$95"
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Featured Events</h2>
          <Link href="/functions" className="text-blue-800 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {defaultEvents.map((event) => (
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
      </div>
    </section>
  );
}