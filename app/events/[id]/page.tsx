import Link from "next/link"
import Image from "next/image"
import { CalendarDays, Clock, MapPin, Share2, TicketIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Events data - usually from an API or database
const events = {
  "grand-installation": {
    id: "grand-installation",
    title: "Grand Installation 2025",
    description:
      "Join us for the Installation of MW Bro Bernie Khristian Albano as Grand Master of the United Grand Lodge of NSW & ACT. This historic ceremony will bring together Brethren from across Australia and beyond.",
    longDescription:
      "## Event Details\n\n- **Date**: May, 2025\n- **Dress Code**: Full Regalia\n- **Banquet**: Formal dinner celebrating the installation with distinguished guests\n\n## About the Installation\n\nThis historic ceremony will bring together Brethren from across Australia and beyond to witness this momentous occasion in Freemasonry.\n\n## Schedule\n\n**Installation Ceremony**: May 15, 2025 - 2:00 PM - 5:00 PM\n**Grand Banquet**: May 16, 2025 - 7:00 PM - 11:00 PM\n**Farewell Brunch**: May 17, 2025 - 10:00 AM - 1:00 PM",
    date: "May 15-17, 2025",
    time: "Various times",
    location: "Sydney Masonic Centre, Sydney",
  },
  "1": {
    id: "1",
    title: "Installation Ceremony",
    description:
      "Join us for the Installation of W.Bro. James Wilson as Worshipful Master of Harmony Lodge No. 123. The ceremony will be followed by a festive board with a four-course meal and wine.\n\nThis is an important event in our Lodge calendar and we welcome visitors from other Lodges to attend and support our new Master.",
    longDescription:
      "## Event Details\n\n- **Tyle Time**: 5:00 PM sharp\n- **Dress Code**: Dark Suit, Craft Regalia\n- **Festive Board**: Commences after the ceremony (approximately 7:30 PM)\n- **Menu**: Four-course meal with wine (dietary requirements can be accommodated)\n\n## About the Installation\n\nThe Installation ceremony is one of the most important and impressive in Freemasonry. W.Bro. James Wilson will be installed as the Worshipful Master of Harmony Lodge No. 123 for the ensuing year.\n\n## Visiting Brethren\n\nVisiting Brethren are most welcome. Please bring your Grand Lodge certificate and current Lodge dues card. If you wish to attend, please purchase a ticket through this platform.\n\n## Schedule\n\n**4:30 PM**: Lodge opens for Brethren to sign in\n**5:00 PM**: Lodge tyled and ceremony begins\n**7:30 PM (approx)**: Festive Board commences\n**10:30 PM (approx)**: Proceedings conclude",
    date: "November 15, 2023",
    time: "5:00 PM - 10:30 PM",
    location: "Masonic Hall, 123 Temple Street, Manchester",
  }
};

// This would fetch from a database
const getEventDetails = (id: string) => {
  return events[id as keyof typeof events] || {
    id,
    title: "Event Not Found",
    description: "This event could not be found.",
    longDescription: "This event could not be found.",
    date: "-",
    time: "-",
    location: "-",
  };
}

// Static generation for known events
export function generateStaticParams() {
  return Object.keys(events).map(id => ({
    id
  }));
}
    imageUrl: "/placeholder.svg?height=400&width=800",
    organizer: "Harmony Lodge No. 123",
    tickets: [
      { id: "1", name: "Lodge Member", price: "£25", available: true },
      { id: "2", name: "Visiting Brother", price: "£30", available: true },
      { id: "3", name: "Provincial Officer", price: "£30", available: true },
    ],
    dressCode: "Dark Suit",
    regalia: "Craft Regalia",
  }
}

export default function EventPage({ params }: { params: { id: string } }) {
  const event = getEventDetails(params.id)

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
          <Button size="sm" asChild>
            <Link href={`/events/${params.id}/tickets`}>Get Tickets</Link>
          </Button>
        </div>
      </header>

      {/* Event Banner */}
      <div className="relative h-64 w-full md:h-96">
        <Image src={event.imageUrl || "/placeholder.svg"} alt={event.title} fill className="object-cover" priority />
      </div>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Event Details */}
          <div className="md:col-span-2">
            <h1 className="mb-4 text-3xl font-bold md:text-4xl">{event.title}</h1>

            <div className="mb-6 space-y-3">
              <div className="flex items-center text-gray-600">
                <CalendarDays className="mr-2 h-5 w-5" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="mr-2 h-5 w-5" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-start text-gray-600">
                <MapPin className="mr-2 mt-1 h-5 w-5 flex-shrink-0" />
                <span>{event.location}</span>
              </div>
              {event.dressCode && (
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
                  <span>Dress Code: {event.dressCode}</span>
                </div>
              )}
              {event.regalia && (
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
                  <span>Regalia: {event.regalia}</span>
                </div>
              )}
            </div>

            <Tabs defaultValue="about" className="mb-8">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <TabsContent value="about" className="mt-4">
                <p className="whitespace-pre-line text-gray-700">{event.description}</p>
              </TabsContent>
              <TabsContent value="details" className="mt-4">
                <div className="prose max-w-none text-gray-700">
                  {event.longDescription.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Organizer</h2>
              <div className="flex items-center">
                <div className="mr-4 h-12 w-12 rounded-full bg-gray-200"></div>
                <div>
                  <p className="font-medium">{event.organizer}</p>
                  <p className="text-sm text-gray-500">Event Organizer</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-2xl font-bold">Location</h2>
              <div className="overflow-hidden rounded-lg bg-gray-200">
                <div className="h-64 w-full bg-gray-300">
                  {/* Map would go here */}
                  <div className="flex h-full items-center justify-center">
                    <p className="text-gray-500">Map View</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-medium">San Francisco Convention Center</p>
                  <p className="text-gray-600">123 Tech Blvd, San Francisco, CA</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Sidebar */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Tickets</CardTitle>
                <CardDescription>Secure your spot at this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium">{ticket.name}</h3>
                      <span className="font-bold">{ticket.price}</span>
                    </div>
                    {ticket.available ? (
                      <p className="text-sm text-gray-500">Available</p>
                    ) : (
                      <p className="text-sm text-red-500">Sold Out</p>
                    )}
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href={`/events/${params.id}/tickets`}>
                    <TicketIcon className="mr-2 h-4 w-4" /> Get Tickets
                  </Link>
                </Button>
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
