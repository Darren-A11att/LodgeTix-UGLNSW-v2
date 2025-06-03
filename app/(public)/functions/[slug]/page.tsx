import Link from "next/link"
import Image from "next/image"
import { CalendarDays, MapPin, Share2, TicketIcon } from "lucide-react"
import { notFound } from "next/navigation"
import { resolveFunctionSlug } from "@/lib/utils/function-slug-resolver"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/formatters"

// Mark as dynamic since it uses server-side authentication
export const dynamic = 'force-dynamic'

export default async function FunctionPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  
  // Resolve slug to function ID
  const functionId = await resolveFunctionSlug(slug, true);
  
  // Fetch function data using the UUID
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_function_details`, {
    method: 'POST',
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_function_id: functionId })
  });
  
  if (!response.ok) {
    return notFound();
  }
  
  const functionData = await response.json();
  
  if (!functionData || !functionData.function) {
    return notFound();
  }
  
  // Extract the function details
  const fn = functionData.function;
  const events = functionData.events || [];
  
  // For now, show the first event's details (or adapt to show function overview)
  const eventData = events[0] || fn;
  
  // Extract tickets from the event data
  const tickets = eventData.tickets || [];
  
  // Use location from the event data
  const locationString = eventData.location || 'TBD';
  
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
        
        {/* Action buttons in top-right corner */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" className="bg-white/90 text-gray-900 hover:bg-white">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button size="sm" asChild className="bg-masonic-navy hover:bg-masonic-blue">
            <Link href={`/functions/${slug}/register`}>
              <TicketIcon className="mr-2 h-4 w-4" /> 
              Purchase Tickets
            </Link>
          </Button>
        </div>
        
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
            {tickets && tickets.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Starting from</p>
                <p className="text-2xl font-bold text-masonic-gold">
                  {formatCurrency(Math.min(...tickets.map(t => t.price)))}
                </p>
              </div>
            )}
          </div>
          
          <p className="mb-6 text-gray-700 whitespace-pre-line">
            {eventData.description}
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
                <p className="text-gray-600">{locationString}</p>
                {eventData.street_address && (
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(eventData.street_address + ', ' + eventData.suburb + ', ' + eventData.state)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View map
                  </a>
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
        </div>


        {/* Tickets Section */}
        {tickets && tickets.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-6 text-2xl font-bold">Ticket Options</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tickets.map((ticket) => (
                <Card key={ticket.ticket_id} className="p-4">
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
                          {ticket.available_count > 0 
                            ? `${ticket.available_count} available` 
                            : 'Sold out'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button asChild size="lg">
                <Link href={`/functions/${slug}/register`}>
                  Select Tickets
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}