import Link from "next/link"
import Image from "next/image"
import { CalendarDays, Clock, Download, MapPin, Share2, TicketIcon, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default function GrandInstallationPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <TicketIcon className="mr-2 h-5 w-5 text-masonic-navy" />
          <span className="font-bold">LodgeTix</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button size="sm" asChild className="bg-masonic-navy hover:bg-masonic-blue">
            <Link href="/events/grand-installation/register">Get Tickets</Link>
          </Button>
        </div>
      </header>

      {/* Event Banner */}
      <div className="relative h-64 w-full md:h-96">
        <Image
          src="/placeholder.svg?height=400&width=1200"
          alt="Grand Installation"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="container mx-auto">
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">Grand Installation</h1>
            <p className="text-xl">MW Bro Bernie Khristian Albano</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Event Details */}
          <div className="md:col-span-2">
            <div className="mb-6 space-y-3">
              <div className="flex items-center text-gray-600">
                <CalendarDays className="mr-2 h-5 w-5" />
                <span>Saturday, 25 November 2023</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="mr-2 h-5 w-5" />
                <span>2:00 PM - 5:00 PM</span>
              </div>
              <div className="flex items-start text-gray-600">
                <MapPin className="mr-2 mt-1 h-5 w-5 flex-shrink-0" />
                <span>Sydney Masonic Centre, 279 Castlereagh St, Sydney NSW 2000</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="mr-2 h-5 w-5" />
                <span>Expected attendance: 500+ Brethren</span>
              </div>
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
                <span>Dress Code: Morning Suit or Dark Lounge Suit</span>
              </div>
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
                <span>Regalia: Full Regalia according to rank</span>
              </div>
            </div>

            <Tabs defaultValue="about" className="mb-8">
              <TabsList className="bg-masonic-lightblue">
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-masonic-navy data-[state=active]:text-white"
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="schedule"
                  className="data-[state=active]:bg-masonic-navy data-[state=active]:text-white"
                >
                  Schedule
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-masonic-navy data-[state=active]:text-white"
                >
                  Details
                </TabsTrigger>
              </TabsList>
              <TabsContent value="about" className="mt-4">
                <div className="prose max-w-none text-gray-700">
                  <p>
                    The United Grand Lodge of NSW & ACT cordially invites you to attend the Installation of MW Bro
                    Bernie Khristian Albano as Grand Master. This historic ceremony will bring together Brethren from
                    across Australia and beyond to witness this momentous occasion in Freemasonry.
                  </p>
                  <p>
                    The Installation will be conducted with all the pomp and ceremony befitting such an important event
                    in our Masonic calendar. Following the Installation, a Grand Banquet will be held at the Hilton
                    Sydney to celebrate this special occasion.
                  </p>
                  <p>
                    MW Bro Bernie Khristian Albano brings a wealth of Masonic experience and leadership to the role of
                    Grand Master. His vision for the future of Freemasonry in NSW & ACT will be outlined during his
                    inaugural address.
                  </p>
                  <p>
                    This event is open to all Master Masons in good standing. Visitors from other Grand Lodges are most
                    welcome to attend and should bring their Grand Lodge certificate.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="schedule" className="mt-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-xl font-bold">Saturday, 25 November 2023</h3>
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start">
                          <div className="mr-4 text-right">
                            <span className="font-medium">12:30 PM</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Registration Opens</h4>
                            <p className="text-sm text-gray-600">Sydney Masonic Centre, Ground Floor</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start">
                          <div className="mr-4 text-right">
                            <span className="font-medium">1:30 PM</span>
                          </div>
                          <div>
                            <h4 className="font-medium">All Brethren to be Seated</h4>
                            <p className="text-sm text-gray-600">Main Auditorium</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start">
                          <div className="mr-4 text-right">
                            <span className="font-medium">2:00 PM</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Grand Installation Ceremony Commences</h4>
                            <p className="text-sm text-gray-600">
                              Procession of Grand Officers and Distinguished Guests
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start">
                          <div className="mr-4 text-right">
                            <span className="font-medium">5:00 PM</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Ceremony Concludes</h4>
                            <p className="text-sm text-gray-600">Followed by refreshments</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start">
                          <div className="mr-4 text-right">
                            <span className="font-medium">7:00 PM</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Grand Banquet</h4>
                            <p className="text-sm text-gray-600">Grand Ballroom, Hilton Sydney</p>
                            <p className="text-sm text-gray-600">Dress: Black Tie</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xl font-bold">Sunday, 26 November 2023</h3>
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start">
                          <div className="mr-4 text-right">
                            <span className="font-medium">10:00 AM</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Farewell Brunch</h4>
                            <p className="text-sm text-gray-600">Sydney Masonic Centre</p>
                            <p className="text-sm text-gray-600">Dress: Smart Casual</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="details" className="mt-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-xl font-bold">Dress Code</h3>
                    <p className="text-gray-700">
                      <strong>Installation Ceremony:</strong> Morning Suit or Dark Lounge Suit with Full Regalia
                      according to rank.
                    </p>
                    <p className="text-gray-700">
                      <strong>Grand Banquet:</strong> Black Tie with Miniature Jewels only.
                    </p>
                    <p className="text-gray-700">
                      <strong>Farewell Brunch:</strong> Smart Casual, no regalia.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xl font-bold">Regalia Requirements</h3>
                    <p className="text-gray-700">
                      <strong>Grand Officers:</strong> Full dress regalia with chain collars (if applicable).
                    </p>
                    <p className="text-gray-700">
                      <strong>Past Grand Officers:</strong> Full dress regalia with appropriate past rank jewels.
                    </p>
                    <p className="text-gray-700">
                      <strong>Worshipful Masters:</strong> Full dress regalia with collar and jewel of office.
                    </p>
                    <p className="text-gray-700">
                      <strong>Master Masons:</strong> Craft regalia (apron, collar, and jewel).
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xl font-bold">Visitors from Other Jurisdictions</h3>
                    <p className="text-gray-700">
                      Visitors from other Grand Lodges are most welcome and should wear the regalia of their own
                      jurisdiction. Please bring your Grand Lodge certificate for registration.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xl font-bold">Photography</h3>
                    <p className="text-gray-700">
                      Official photographers will be present throughout the event. Personal photography is permitted
                      before and after the ceremony but not during the official proceedings.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Organizer</h2>
              <div className="flex items-center">
                <div className="mr-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?height=48&width=48"
                    alt="United Grand Lodge of NSW & ACT"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <p className="font-medium">United Grand Lodge of NSW & ACT</p>
                  <p className="text-sm text-gray-500">Official Grand Lodge Event</p>
                  <Link
                    href="https://www.masons.au"
                    target="_blank"
                    className="text-sm text-blue-800 hover:underline flex items-center"
                  >
                    www.masons.au
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-1"
                    >
                      <path d="M7 7h10v10"></path>
                      <path d="M7 17 17 7"></path>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-2xl font-bold">Venue</h2>
              <div className="overflow-hidden rounded-lg bg-gray-200">
                <div className="h-64 w-full bg-gray-300">
                  {/* Map would go here */}
                  <div className="flex h-full items-center justify-center">
                    <p className="text-gray-500">Sydney Masonic Centre Map</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-medium">Sydney Masonic Centre</p>
                  <p className="text-gray-600">279 Castlereagh St, Sydney NSW 2000</p>
                  <Link
                    href="https://maps.google.com"
                    target="_blank"
                    className="mt-2 inline-block text-sm text-blue-800 hover:underline"
                  >
                    Get Directions
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Sidebar */}
          <div>
            <Card className="sticky top-20 border-masonic-navy">
              <CardHeader className="bg-masonic-navy text-white">
                <CardTitle>Tickets</CardTitle>
                <CardDescription className="text-gray-200">Secure your place at this historic event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="rounded-lg border border-masonic-lightgold p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">Installation Ceremony</h3>
                    <span className="font-bold text-masonic-navy">$75</span>
                  </div>
                  <p className="text-sm text-gray-500">Admission to the Grand Installation Ceremony</p>
                </div>
                <div className="rounded-lg border border-masonic-lightgold p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">Grand Banquet</h3>
                    <span className="font-bold text-masonic-navy">$150</span>
                  </div>
                  <p className="text-sm text-gray-500">Formal dinner with wine at Hilton Sydney</p>
                </div>
                <div className="rounded-lg border border-masonic-lightgold p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">Farewell Brunch</h3>
                    <span className="font-bold text-masonic-navy">$45</span>
                  </div>
                  <p className="text-sm text-gray-500">Sunday morning brunch at Sydney Masonic Centre</p>
                </div>
                <div className="rounded-lg border border-masonic-lightgold p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">Complete Package</h3>
                    <span className="font-bold text-masonic-navy">$250</span>
                  </div>
                  <p className="text-sm text-gray-500">Includes all events (save $20)</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold" asChild>
                  <Link href="/events/grand-installation/register">
                    <TicketIcon className="mr-2 h-4 w-4" /> Get Tickets
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Event Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="#">
                    <Download className="mr-2 h-4 w-4" /> Installation Program
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="#">
                    <Download className="mr-2 h-4 w-4" /> Accommodation Guide
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="#">
                    <Download className="mr-2 h-4 w-4" /> Sydney Visitor Guide
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-12" />

        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-center text-masonic-navy">Related Events</h2>
          <div className="masonic-divider"></div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-masonic-lightgold">
              <CardHeader className="border-b border-masonic-lightgold">
                <CardTitle className="text-masonic-navy">Grand Banquet</CardTitle>
                <CardDescription>Saturday, 25 November 2023</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600">
                  Join us for a formal dinner celebrating the Installation of the new Grand Master. The evening will
                  include speeches, entertainment, and fine dining.
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-masonic-navy" />
                    <span>7:00 PM - 11:00 PM</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-masonic-navy" />
                    <span>Grand Ballroom, Hilton Sydney</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-masonic-lightgold">
                <Button className="w-full bg-masonic-navy hover:bg-masonic-blue" asChild>
                  <Link href="/events/grand-installation/banquet">View Details</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-masonic-lightgold">
              <CardHeader className="border-b border-masonic-lightgold">
                <CardTitle className="text-masonic-navy">Farewell Brunch</CardTitle>
                <CardDescription>Sunday, 26 November 2023</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600">
                  A casual brunch to conclude the Installation weekend. Meet with the new Grand Master and fellow
                  Brethren in a relaxed setting.
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-masonic-navy" />
                    <span>10:00 AM - 12:00 PM</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-masonic-navy" />
                    <span>Sydney Masonic Centre</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-masonic-lightgold">
                <Button className="w-full bg-masonic-navy hover:bg-masonic-blue" asChild>
                  <Link href="/events/grand-installation/brunch">View Details</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-masonic-lightgold">
              <CardHeader className="border-b border-masonic-lightgold">
                <CardTitle className="text-masonic-navy">Sydney Harbour Cruise</CardTitle>
                <CardDescription>Friday, 24 November 2023</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600">
                  A pre-Installation cruise on Sydney Harbour for interstate and international visitors. Enjoy
                  spectacular views of Sydney's landmarks.
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-masonic-navy" />
                    <span>2:00 PM - 5:00 PM</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-masonic-navy" />
                    <span>Departs from Circular Quay</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-masonic-lightgold">
                <Button className="w-full bg-masonic-navy hover:bg-masonic-blue" asChild>
                  <Link href="/events/grand-installation/cruise">View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-masonic-navy py-12 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-xl font-bold text-white">LodgeTix</h3>
              <p>Official ticketing platform for the Grand Installation.</p>
              <div className="mt-4">
                <Link
                  href="https://www.masons.au"
                  target="_blank"
                  className="flex items-center text-white hover:underline"
                >
                  <span>Visit masons.au</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-1"
                  >
                    <path d="M7 7h10v10"></path>
                    <path d="M7 17 17 7"></path>
                  </svg>
                </Link>
              </div>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Event Information</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/events/grand-installation" className="hover:text-white">
                    Grand Installation
                  </Link>
                </li>
                <li>
                  <Link href="/events/grand-installation/schedule" className="hover:text-white">
                    Schedule
                  </Link>
                </li>
                <li>
                  <Link href="/events/grand-installation/venue" className="hover:text-white">
                    Venue Information
                  </Link>
                </li>
                <li>
                  <Link href="/events/grand-installation/accommodation" className="hover:text-white">
                    Accommodation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">For Attendees</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/events/grand-installation/register" className="hover:text-white">
                    Purchase Tickets
                  </Link>
                </li>
                <li>
                  <Link href="/account/tickets" className="hover:text-white">
                    My Tickets
                  </Link>
                </li>
                <li>
                  <Link href="/events/grand-installation/faq" className="hover:text-white">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-white">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="hover:text-white">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} United Grand Lodge of NSW & ACT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
