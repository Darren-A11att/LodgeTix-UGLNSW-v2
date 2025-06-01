import Link from "next/link"
import Image from "next/image"
import { CalendarDays, MapPin, Share2, TicketIcon } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EventRPCService } from "@/lib/api/event-rpc-service"
import { formatCurrency } from "@/lib/formatters"

// Mark as dynamic since it uses server-side authentication
export const dynamic = 'force-dynamic'

export default async function OptimizedParentEventPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  
  // Initialize RPC service
  const eventService = new EventRPCService(true); // server-side
  
  // Fetch all event data in a single RPC call
  const eventData = await eventService.getEventDetailData(slug);
  
  // Handle not found
  if (!eventData) {
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
          <h1 className="mb-2 text-xl font-bold md:text-2xl">{eventData.title}</h1>
          {eventData.subtitle && (
            <p className="text-lg md:text-2xl opacity-90">{eventData.subtitle}</p>
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
                </div>
              </div>
            )}
          </div>
          
          {/* Event Status */}
          <div className="mt-6 flex items-center gap-4">
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
          </div>
        </div>


        {/* Tickets Section */}
        {eventData.tickets && eventData.tickets.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-6 text-2xl font-bold">Ticket Options</h2>
            <div className="space-y-4">
              {eventData.tickets.map((ticket) => (
                <Card key={ticket.ticket_id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{ticket.name}</h3>
                      {ticket.description && (
                        <p className="mt-1 text-sm text-gray-600">{ticket.description}</p>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        {ticket.quantity_available > 0 
                          ? `${ticket.quantity_available} available` 
                          : 'Sold out'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {ticket.price > 0 ? formatCurrency(ticket.price) : 'Free'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Button asChild className="w-full mt-6" size="lg" disabled={eventData.is_sold_out}>
              <Link href={`/events/${slug}/register`}>
                {eventData.is_sold_out ? 'Event Sold Out' : 'Select Tickets'}
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}