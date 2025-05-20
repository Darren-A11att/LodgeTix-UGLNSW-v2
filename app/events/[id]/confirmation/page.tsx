import Link from "next/link"
import { CalendarDays, Check, Download, MapPin, TicketIcon } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getEventById } from "@/lib/event-facade"

// Generate mock order data (would normally come from a database)
const getOrderDetails = (eventId: string) => {
  return {
    tickets: [{ id: "2", name: "Standard Access", price: 75, quantity: 1 }],
    confirmationNumber: `EVENT-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}`,
    purchaseDate: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
  }
}

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Fetch event from facade
  const event = await getEventById(id)
  
  if (!event) {
    notFound()
  }
  
  // Get order details (mock data for now)
  const orderDetails = getOrderDetails(id)

  const totalPrice = orderDetails.tickets.reduce((sum, ticket) => {
    return sum + ticket.price * ticket.quantity
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <TicketIcon className="mr-2 h-5 w-5 text-blue-600" />
          <span className="font-bold">LodgeTix</span>
        </Link>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Tickets Confirmed!</h1>
          <p className="text-gray-500">Your tickets have been purchased successfully.</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Confirmation</CardTitle>
            <CardDescription>Order #{orderDetails.confirmationNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium">{event.title}</h3>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  <span>
                    {event.date}, {event.time || 'Time TBD'}
                  </span>
                </div>
                <div className="flex items-start">
                  <MapPin className="mr-2 mt-1 h-4 w-4 flex-shrink-0" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 font-medium">Ticket Details</h4>
              {orderDetails.tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between">
                  <div>
                    <p>{ticket.name}</p>
                    <p className="text-sm text-gray-500">x{ticket.quantity}</p>
                  </div>
                  <p className="font-medium">${(ticket.price * ticket.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between font-bold">
              <p>Total</p>
              <p>${totalPrice.toFixed(2)}</p>
            </div>

            <div className="rounded-lg bg-gray-100 p-4 text-sm">
              <p className="font-medium">Purchase Date: {orderDetails.purchaseDate}</p>
              <p className="text-gray-500">A receipt has been sent to your email.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" /> Download Tickets
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/events/${event.slug || event.id}`}>View Event Details</Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold">What's Next?</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Add to Calendar</h3>
              <p className="mb-4 text-sm text-gray-500">Don't miss the ceremony!</p>
              <Button variant="outline" size="sm" className="w-full">
                Add to Calendar
              </Button>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Invite a Brother</h3>
              <p className="mb-4 text-sm text-gray-500">Share with your Lodge!</p>
              <Button variant="outline" size="sm" className="w-full">
                Share Event
              </Button>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Find Accommodation</h3>
              <p className="mb-4 text-sm text-gray-500">Book nearby lodging!</p>
              <Button variant="outline" size="sm" className="w-full">
                Find Hotels
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
