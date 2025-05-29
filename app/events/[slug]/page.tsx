import Link from "next/link"
import Image from "next/image"
import { CalendarDays, Clock, MapPin, Share2, TicketIcon, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getEventByIdOrSlug, getChildEventsByParentId } from "@/lib/event-facade"
import { Badge } from "@/components/ui/badge"

// Generate static params for all parent events
export async function generateStaticParams() {
  // This will be populated by events where parent_event_id is null
  return []
}

export default async function ParentEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const parentEvent = await getEventByIdOrSlug(slug)

  if (!parentEvent || parentEvent.parent_event_id) {
    // If it's not found or it's actually a child event, redirect to proper URL
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="mb-4 text-3xl font-bold">Event Not Found</h1>
        <p className="mb-8">The event you're looking for could not be found.</p>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    )
  }

  // Fetch child events for this parent
  const childEvents = await getChildEventsByParentId(parentEvent.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <TicketIcon className="mr-2 h-5 w-5 text-purple-600" />
          <span className="font-bold">LodgeTix</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button size="sm" asChild className="bg-masonic-navy hover:bg-masonic-blue">
            <Link href={`/events/${slug}/register`}>
              <TicketIcon className="mr-2 h-4 w-4" /> Purchase Tickets
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-72 w-full md:h-96">
        <Image 
          src={parentEvent.imageUrl || "/placeholder.svg"} 
          alt={parentEvent.title} 
          fill 
          className="object-cover" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-12">
          <h1 className="mb-2 text-3xl font-bold md:text-5xl">{parentEvent.title}</h1>
          {parentEvent.subtitle && (
            <p className="text-lg md:text-xl opacity-90">{parentEvent.subtitle}</p>
          )}
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Event Info */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold">About This Event</h2>
            <Button asChild className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
              <Link href={`/events/${slug}/register`}>
                <TicketIcon className="mr-2 h-4 w-4" /> Purchase Tickets
              </Link>
            </Button>
          </div>
          <p className="mb-6 text-gray-700 whitespace-pre-line">{parentEvent.description}</p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <CalendarDays className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-gray-600">{parentEvent.date}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-gray-600">{parentEvent.location}</p>
              </div>
            </div>
            {parentEvent.dressCode && (
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-purple-600 mt-0.5"
                >
                  <path d="M6 2v6a6 6 0 0 0 12 0V2"></path>
                  <path d="M12 2v20"></path>
                </svg>
                <div>
                  <p className="font-medium">Dress Code</p>
                  <p className="text-gray-600">{parentEvent.dressCode}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Child Events Section */}
        <div>
          <h2 className="mb-6 text-2xl font-bold">Available Events</h2>
          
          {childEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No events are currently available.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {childEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {event.imageUrl && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      {event.featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                    </div>
                    {event.subtitle && (
                      <CardDescription>{event.subtitle}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{event.time || "Time TBD"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="mt-4 text-sm text-gray-600 line-clamp-3">
                        {event.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <Link href={`/events/${parentEvent.slug}/${event.slug}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-gray-900 py-12 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-xl font-bold text-white">LodgeTix</h3>
              <p>Connecting Brethren through Masonic events.</p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">For Brethren</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/events" className="hover:text-white">
                    Browse Events
                  </Link>
                </li>
                <li>
                  <Link href="/account/tickets" className="hover:text-white">
                    My Tickets
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">For Lodges</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/organizer/dashboard" className="hover:text-white">
                    Lodge Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/organizer/create-event" className="hover:text-white">
                    Create Event
                  </Link>
                </li>
                <li>
                  <Link href="/organizer/resources" className="hover:text-white">
                    Resources
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} LodgeTix. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}