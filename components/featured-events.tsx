import Link from "next/link"
import { getFeaturedEvents, getEventByIdOrSlug } from "@/lib/event-facade"
import { EventCard } from "@/components/event-card"
import { formatCurrency } from "@/lib/formatters"

export async function FeaturedEvents() {
  // Fetch featured events from Supabase (or mock data, depending on feature flag)
  const events = await getFeaturedEvents()
  
  // Fetch parent event details for child events
  const eventsWithParentInfo = await Promise.all(
    events.map(async (event) => {
      if (event.parentEventId) {
        const parentEvent = await getEventByIdOrSlug(event.parentEventId);
        return {
          ...event,
          parentEventSlug: parentEvent?.slug || null
        };
      }
      return event;
    })
  );
  
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Featured Events</h2>
          <Link href="/events" className="text-blue-800 hover:underline">
            View all
          </Link>
        </div>
        
        {eventsWithParentInfo.length === 0 ? (
          <p className="text-center text-gray-500">No featured events available at this time.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eventsWithParentInfo.slice(0, 3).map((event) => (
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
                parentEventId={event.parentEventId || null}
                parentEventSlug={'parentEventSlug' in event ? event.parentEventSlug : null}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// Fallback component with hardcoded events
export function FeaturedEventsFallback() {
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
          <EventCard
            id="1"
            slug="third-degree-ceremony"
            title="Third Degree Ceremony"
            description="A solemn ceremony raising a Brother to the sublime degree of a Master Mason."
            date="October 10, 2023"
            location="Lodge Commonwealth No. 400, Sydney"
            imageUrl="/placeholder.svg?height=200&width=400"
            price="$20"
          />
          <EventCard
            id="2"
            slug="masonic-lecture-series"
            title="Masonic Education Night"
            description="Learn about the symbolism and history of Freemasonry from distinguished speakers."
            date="September 25, 2023"
            location="Lodge Antiquity No. 1, Sydney"
            imageUrl="/placeholder.svg?height=200&width=400"
            price="$15"
          />
          <EventCard
            id="3"
            slug="annual-charity-gala"
            title="Annual Charity Gala"
            description="A formal dinner raising funds for the Masonic charities of NSW & ACT."
            date="December 5, 2023"
            location="Grand Ballroom, Hilton Sydney"
            imageUrl="/placeholder.svg?height=200&width=400"
            price="$95"
          />
        </div>
      </div>
    </section>
  )
}