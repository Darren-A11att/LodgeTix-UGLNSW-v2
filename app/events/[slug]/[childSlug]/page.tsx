import Link from "next/link"
import Image from "next/image"
import { CalendarDays, Clock, MapPin, Share2, TicketIcon, ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventRPCService } from "@/lib/api/event-rpc-service"
import { formatCurrency } from "@/lib/formatters"

// Mark as dynamic since it uses server-side authentication
export const dynamic = 'force-dynamic'

export default async function ChildEventPage({ 
  params 
}: { 
  params: Promise<{ slug: string; childSlug: string }> 
}) {
  const { slug: parentSlug, childSlug } = await params
  
  // Initialize RPC service
  const eventService = new EventRPCService(true); // server-side
  
  try {
    // Fetch complete event data in a single RPC call
    const eventData = await eventService.getEventDetailData(childSlug);
    
    // Also fetch parent event data for navigation
    const parentData = await eventService.getEventDetailData(parentSlug);
    
    if (!eventData || !eventData.parent_event_id) {
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
      <div className="min-h-screen bg-white">
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
            <Button size="sm" asChild disabled={eventData.is_sold_out}>
              <Link href={`/events/${parentSlug}/register`}>
                {eventData.is_sold_out ? 'Sold Out' : 'Get Tickets'}
              </Link>
            </Button>
          </div>
        </header>

        {/* Breadcrumb */}
        {parentData && (
          <div className="container mx-auto max-w-6xl px-4 py-4">
            <Link 
              href={`/events/${parentSlug}`} 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {parentData.title}
            </Link>
          </div>
        )}

        {/* Event Banner */}
        <div className="relative h-64 w-full md:h-96">
          <Image 
            src={eventData.image_url || "/placeholder.svg"} 
            alt={eventData.title} 
            fill 
            className="object-cover" 
            priority 
          />
        </div>

        <main className="container mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Event Details */}
            <div className="md:col-span-2">
              {/* Event Type Badge */}
              {eventData.event_type && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-full">
                    {eventData.event_type}
                  </span>
                </div>
              )}
              
              <h1 className="mb-4 text-3xl font-bold md:text-4xl">{eventData.title}</h1>

              <div className="mb-6 space-y-3">
                <div className="flex items-center text-gray-600">
                  <CalendarDays className="mr-2 h-5 w-5" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="mr-2 h-5 w-5" />
                  <span>{formattedTime}</span>
                </div>
                <div className="flex items-start text-gray-600">
                  <MapPin className="mr-2 mt-1 h-5 w-5 flex-shrink-0" />
                  <div>
                    <span>{eventData.location}</span>
                    {eventData.venue_name && (
                      <>
                        <br />
                        <span className="text-sm">
                          {eventData.venue_name}
                          {eventData.venue_address && (
                            <>
                              <br />
                              {eventData.venue_address}, {eventData.venue_city} {eventData.venue_state} {eventData.venue_postcode}
                            </>
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {eventData.dress_code && (
                  <div className="flex items-center text-gray-600">
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
                      className="mr-2 h-5 w-5"
                    >
                      <path d="M6 2v6a6 6 0 0 0 12 0V2"></path>
                      <path d="M12 2v20"></path>
                    </svg>
                    <span>Dress Code: {eventData.dress_code}</span>
                  </div>
                )}
                {eventData.regalia && (
                  <div className="flex items-center text-gray-600">
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
                      className="mr-2 h-5 w-5"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                    </svg>
                    <span>Regalia: {eventData.regalia}</span>
                  </div>
                )}
              </div>

              <Tabs defaultValue="about" className="mb-8">
                <TabsList>
                  <TabsTrigger value="about">About</TabsTrigger>
                  {eventData.long_description && (
                    <TabsTrigger value="details">Details</TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="about" className="mt-4">
                  <p className="whitespace-pre-line text-gray-700">{eventData.description}</p>
                </TabsContent>
                {eventData.long_description && (
                  <TabsContent value="details" className="mt-4">
                    <div className="prose max-w-none text-gray-700">
                      <p className="whitespace-pre-line">{eventData.long_description}</p>
                    </div>
                  </TabsContent>
                )}
              </Tabs>

              {eventData.organiser_name && (
                <div className="mb-8">
                  <h2 className="mb-4 text-2xl font-bold">Organiser</h2>
                  <div className="flex items-center">
                    <div className="mr-4 h-12 w-12 rounded-full bg-gray-200"></div>
                    <div>
                      <p className="font-medium">{eventData.organiser_name}</p>
                      {eventData.organiser_contact && (
                        <p className="text-sm text-gray-500">{eventData.organiser_contact}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Location Map */}
              {eventData.venue_map_url ? (
                <div>
                  <h2 className="mb-4 text-2xl font-bold">Location</h2>
                  <div className="overflow-hidden rounded-lg">
                    <iframe
                      src={eventData.venue_map_url}
                      width="100%"
                      height="400"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="mb-4 text-2xl font-bold">Location</h2>
                  <div className="overflow-hidden rounded-lg bg-gray-200">
                    <div className="h-64 w-full bg-gray-300">
                      <div className="flex h-full items-center justify-center">
                        <p className="text-gray-500">Map View</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-medium">{eventData.location}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ticket Sidebar */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Tickets</CardTitle>
                  <CardDescription>Secure your spot at this event</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eventData.tickets && eventData.tickets.length > 0 ? (
                    eventData.tickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="font-medium">{ticket.name}</h3>
                          <span className="font-bold">
                            {ticket.price > 0 ? formatCurrency(ticket.price) : 'Free'}
                          </span>
                        </div>
                        {ticket.description && (
                          <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {ticket.quantity_available > 0 
                            ? `${ticket.quantity_available} available` 
                            : 'Sold Out'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border p-4 text-center text-gray-500">
                      <p>No tickets available for this event</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {eventData.is_package && (
                    <p className="text-sm text-gray-600 text-center">
                      This event is part of a package
                    </p>
                  )}
                  <Button 
                    className="w-full" 
                    asChild 
                    disabled={eventData.is_sold_out || !eventData.tickets || eventData.tickets.length === 0}
                  >
                    <Link href={`/events/${parentSlug}/register`}>
                      <TicketIcon className="mr-2 h-4 w-4" /> 
                      {eventData.is_sold_out ? 'Sold Out' : 'Get Tickets'}
                    </Link>
                  </Button>
                  {eventData.min_price > 0 && !eventData.is_sold_out && (
                    <p className="text-sm text-center text-gray-600">
                      From {formatCurrency(eventData.min_price)}
                    </p>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 py-12 text-gray-300">
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
                    <Link href="/organiser/dashboard" className="hover:text-white">
                      Lodge Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/organiser/create-event" className="hover:text-white">
                      Create Event
                    </Link>
                  </li>
                  <li>
                    <Link href="/organiser/resources" className="hover:text-white">
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
  } catch (error) {
    console.error('Error loading event:', error);
    return notFound();
  }
}