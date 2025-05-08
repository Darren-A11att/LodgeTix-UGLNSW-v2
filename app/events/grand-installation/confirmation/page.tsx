import Link from "next/link"
import { CalendarDays, Check, Download, MapPin, TicketIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function ConfirmationPage() {
  const event = {
    title: "Grand Installation",
    subtitle: "MW Bro Bernie Khristian Albano",
    date: "Saturday, 25 November 2023",
    time: "2:00 PM - 5:00 PM",
    location: "Sydney Masonic Centre, 279 Castlereagh St, Sydney NSW 2000",
    confirmationNumber: "UGLE-2023-12345",
    purchaseDate: "15 August 2023",
    tickets: [
      { id: "installation", name: "Installation Ceremony", price: 75, quantity: 1 },
      { id: "banquet", name: "Grand Banquet", price: 150, quantity: 1 },
    ],
  }

  const totalPrice = event.tickets.reduce((sum, ticket) => {
    return sum + ticket.price * ticket.quantity
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <TicketIcon className="mr-2 h-5 w-5 text-masonic-navy" />
          <span className="font-bold">LodgeTix</span>
        </Link>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-masonic-lightgold">
            <Check className="h-8 w-8 text-masonic-navy" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-masonic-navy">Tickets Confirmed!</h1>
          <div className="masonic-divider"></div>
          <p className="text-gray-500">Your tickets have been purchased successfully.</p>
        </div>

        <Card className="mb-8 border-masonic-navy">
          <CardHeader className="bg-masonic-navy text-white">
            <CardTitle>Order Confirmation</CardTitle>
            <CardDescription className="text-gray-200">Order #{event.confirmationNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <h3 className="mb-2 text-lg font-medium">{event.title}</h3>
              <p className="text-gray-700">{event.subtitle}</p>
              <div className="mt-2 space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  <span>
                    {event.date}, {event.time}
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
              {event.tickets.map((ticket) => (
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
              <p className="font-medium">Purchase Date: {event.purchaseDate}</p>
              <p className="text-gray-500">A receipt has been sent to your email.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
              <Download className="mr-2 h-4 w-4" /> Download Tickets
            </Button>
            <Button
              variant="outline"
              className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
              asChild
            >
              <Link href="/events/grand-installation">View Event Details</Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center">
          <h2 className="mb-4 text-xl font-bold text-masonic-navy">What's Next?</h2>
          <div className="masonic-divider"></div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-masonic-lightgold p-4">
              <h3 className="mb-2 font-medium text-masonic-navy">Add to Calendar</h3>
              <p className="mb-4 text-sm text-gray-500">Don't miss this historic event!</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
              >
                Add to Calendar
              </Button>
            </div>
            <div className="rounded-lg border border-masonic-lightgold p-4">
              <h3 className="mb-2 font-medium text-masonic-navy">Invite a Brother</h3>
              <p className="mb-4 text-sm text-gray-500">Share with your Lodge!</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
              >
                Share Event
              </Button>
            </div>
            <div className="rounded-lg border border-masonic-lightgold p-4">
              <h3 className="mb-2 font-medium text-masonic-navy">Book Accommodation</h3>
              <p className="mb-4 text-sm text-gray-500">Find nearby hotels!</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
              >
                View Hotels
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
