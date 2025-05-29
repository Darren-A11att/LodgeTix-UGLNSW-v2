import Link from "next/link"
import { getFeaturedEvents } from "@/lib/services/homepage-service"
import { getEventByIdOrSlug } from "@/lib/event-facade"
import { EventCard } from "@/components/event-card"

export async function FeaturedEventsSection() {
  // Fetch featured events from Supabase
  const featuredEvents = await getFeaturedEvents();
  
  // Fetch parent event details for child events
  const eventsWithParentInfo = await Promise.all(
    featuredEvents.map(async (event) => {
      if (event.parent_event_id) {
        const parentEvent = await getEventByIdOrSlug(event.parent_event_id);
        return {
          ...event,
          parentEventSlug: parentEvent?.slug || null
        };
      }
      return event;
    })
  );
  
  // Default events to use if we don't have any from Supabase
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

  // Use events from Supabase if available, otherwise use defaults
  const events = eventsWithParentInfo.length > 0 ? eventsWithParentInfo : defaultEvents;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Featured Events</h2>
          <Link href="/events" className="text-blue-800 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
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
              parentEventId={event.parent_event_id || null}
              parentEventSlug={'parentEventSlug' in event ? event.parentEventSlug : null}
            />
          ))}
        </div>
      </div>
    </section>
  );
}