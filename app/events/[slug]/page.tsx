import Link from "next/link"
import Image from "next/image"
import { CalendarDays, MapPin, Share2, TicketIcon } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EventRPCService } from "@/lib/api/event-rpc-service"
import { formatCurrency } from "@/lib/formatters"

export default async function ParentEventPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  
  // Initialize RPC service
  const eventService = new EventRPCService(true); // server-side
  
  try {
    // Fetch all event data in a single RPC call
    const eventData = await eventService.getEventDetailData(slug);
    
    // Handle not found
    if (!eventData || eventData.parent_event_id) {
      return notFound();
    }
    
    // Format date and time
    const eventDate = new Date(eventData.event_start);
    const formattedDate = eventDate.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = eventDate.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    
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
                <TicketIcon className="mr-2 h-4 w-4" /> 
                {eventData.is_sold_out ? 'Sold Out' : 'Purchase Tickets'}
              </Link>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative h-72 w-full md:h-96">
          <Image 
            src={eventData.image_url || "/placeholder.svg"} 
            alt={eventData.title} 
            fill 
            className="object-cover" 
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-12">
            <h1 className="mb-2 text-3xl font-bold md:text-5xl">{eventData.title}</h1>
            {eventData.subtitle && (
              <p className="text-lg md:text-xl opacity-90">{eventData.subtitle}</p>
            )}
          </div>
        </div>

        <main className="container mx-auto max-w-7xl px-4 py-8">
          {/* Event Info */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold">About This Event</h2>
              <div className="text-right">
                {eventData.min_price > 0 ? (
                  <>
                    <p className="text-sm text-gray-600">Starting from</p>
                    <p className="text-2xl font-bold text-masonic-gold">
                      {formatCurrency(eventData.min_price)}
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-semibold text-gray-700">
                    {eventData.has_free_tickets ? 'Free Entry' : 'View pricing'}
                  </p>
                )}
              </div>
            </div>
            
            <p className="mb-6 text-gray-700 whitespace-pre-line">
              {eventData.long_description || eventData.description}
            </p>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-gray-600">{formattedDate}</p>
                  <p className="text-gray-600">{formattedTime}</p>
                  {eventData.event_end && (
                    <p className="text-gray-600 text-sm">
                      Ends: {new Date(eventData.event_end).toLocaleDateString('en-AU')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-gray-600">{eventData.location}</p>
                  {eventData.venue_name && (
                    <>
                      <p className="text-gray-600">{eventData.venue_name}</p>
                      {eventData.venue_address && (
                        <p className="text-gray-600 text-sm">
                          {eventData.venue_address}, {eventData.venue_city} {eventData.venue_state} {eventData.venue_postcode}
                        </p>
                      )}
                      {eventData.venue_map_url && (
                        <a 
                          href={eventData.venue_map_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View map
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
              {eventData.dress_code && (
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
                    <p className="text-gray-600">{eventData.dress_code}</p>
                    {eventData.regalia && (
                      <p className="text-gray-600 text-sm">Regalia: {eventData.regalia}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Event Status and Package Info */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {eventData.is_sold_out ? (
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">
                  Sold Out
                </span>
              ) : eventData.total_capacity > 0 && (
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                  {eventData.total_capacity - eventData.tickets_sold} tickets available
                </span>
              )}
              {eventData.is_package && (
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-full">
                  Package Event
                </span>
              )}
              {eventData.event_type && (
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                  {eventData.event_type}
                </span>
              )}
            </div>
          </div>

          {/* Child Events Section */}
          {eventData.child_events && eventData.child_events.length > 0 && (
            <div>
              <h2 className="mb-6 text-2xl font-bold">Included Events</h2>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {eventData.child_events.map((childEvent) => (
                  <Card key={childEvent.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {childEvent.image_url && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={childEvent.image_url}
                          alt={childEvent.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="mb-2 text-lg font-semibold">{childEvent.title}</h3>
                      {childEvent.subtitle && (
                        <p className="mb-2 text-sm text-gray-600">{childEvent.subtitle}</p>
                      )}
                      <p className="mb-4 text-sm text-gray-700 line-clamp-2">
                        {childEvent.description}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">
                          {new Date(childEvent.event_start).toLocaleDateString('en-AU', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric'
                          })}
                        </span>
                        {childEvent.min_price > 0 && (
                          <span className="font-semibold">
                            From {formatCurrency(childEvent.min_price)}
                          </span>
                        )}
                      </div>
                      {childEvent.is_sold_out && (
                        <p className="mb-3 text-sm font-medium text-red-600">Sold Out</p>
                      )}
                      <Button asChild className="w-full" variant="outline" size="sm">
                        <Link href={`/events/${slug}/${childEvent.slug}`}>
                          View Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Tickets Section */}
          {eventData.tickets && eventData.tickets.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-6 text-2xl font-bold">Ticket Options</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventData.tickets.map((ticket) => (
                  <Card key={ticket.id} className="p-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{ticket.name}</h3>
                      {ticket.description && (
                        <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">
                            {ticket.price > 0 ? formatCurrency(ticket.price) : 'Free'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {ticket.quantity_available > 0 
                              ? `${ticket.quantity_available} available` 
                              : 'Sold out'}
                          </p>
                        </div>
                        {ticket.attendee_type && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {ticket.attendee_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Button asChild size="lg" disabled={eventData.is_sold_out}>
                  <Link href={`/events/${slug}/register`}>
                    {eventData.is_sold_out ? 'Event Sold Out' : 'Select Tickets'}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error loading event:', error);
    return notFound();
  }
}