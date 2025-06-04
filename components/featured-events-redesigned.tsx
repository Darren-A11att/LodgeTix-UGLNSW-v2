import Link from "next/link"
import Image from "next/image"
import { formatCurrency } from "@/lib/formatters"
import { FEATURED_FUNCTION_ID, getFeaturedFunctionInfo } from "@/lib/utils/function-slug-resolver"

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export async function FeaturedEventsRedesigned() {
  try {
    // Get featured function info (including slug)
    const featuredFunction = await getFeaturedFunctionInfo(true);
    
    // Fetch events for the featured function with location details - limit to 2 for alternating layout
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events?function_id=eq.${FEATURED_FUNCTION_ID}&is_published=eq.true&order=event_start.asc&limit=2&select=*,locations(place_name,suburb,state)`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    
    const events = await response.json();
    
    // Transform data for display
    const eventsForDisplay = events.map(event => {
      // Format location string from nested location data
      let locationString = '';
      if (event.locations) {
        locationString = event.locations.place_name;
        if (event.locations.suburb && event.locations.state) {
          locationString += `, ${event.locations.suburb}, ${event.locations.state}`;
        } else if (event.locations.suburb || event.locations.state) {
          locationString += `, ${event.locations.suburb || event.locations.state}`;
        }
      }
      
      return {
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
        location: locationString || 'Location TBA',
        imageUrl: event.image_url || '/placeholder.svg?height=400&width=1000',
        price: 'View pricing',
        functionSlug: featuredFunction.slug
      };
    });
    
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