import Link from "next/link"
import { Calendar, Clock, Gift, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/event-card"
import { GrandInstallationHero } from "@/components/grand-installation-hero"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <GrandInstallationHero />

      {/* About the Grand Installation */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-masonic-navy">Grand Installation 2023</h2>
            <div className="masonic-divider"></div>
            <p className="mb-8 text-lg text-gray-700">
              Join us for the Installation of MW Bro Bernie Khristian Albano as Grand Master of the United Grand Lodge
              of NSW & ACT. This historic ceremony will bring together Brethren from across Australia and beyond to
              witness this momentous occasion in Freemasonry.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild className="bg-masonic-navy hover:bg-masonic-blue">
                <Link href="/events/grand-installation">Event Details</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
              >
                <Link href="/events/grand-installation/register">Get Tickets</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Event Timeline */}
      <section className="bg-[#f0f4f8] py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold text-masonic-navy">Event Timeline</h2>

          <div className="relative mx-auto max-w-5xl">
            {/* Timeline events */}
            <div className="grid gap-8 md:grid-cols-3">
              {/* Installation Ceremony */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-masonic-navy">
                  <Calendar className="h-10 w-10 text-masonic-gold" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-masonic-navy">Installation Ceremony</h3>
                <div className="w-full border-t border-gray-300 py-2"></div>
                <div className="mb-2 flex items-center justify-center">
                  <Calendar className="mr-2 h-4 w-4 text-masonic-navy" />
                  <span className="text-gray-700">May 15, 2025</span>
                </div>
                <div className="mb-4 flex items-center justify-center">
                  <Clock className="mr-2 h-4 w-4 text-masonic-navy" />
                  <span className="text-gray-700">2:00 PM - 5:00 PM</span>
                </div>
                <p className="text-gray-600">
                  The formal installation of MW Bro Bernie Khristian Albano as Grand Master.
                </p>
              </div>

              {/* Grand Banquet */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-masonic-navy">
                  <Gift className="h-10 w-10 text-masonic-gold" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-masonic-navy">Grand Banquet</h3>
                <div className="w-full border-t border-gray-300 py-2"></div>
                <div className="mb-2 flex items-center justify-center">
                  <Calendar className="mr-2 h-4 w-4 text-masonic-navy" />
                  <span className="text-gray-700">May 16, 2025</span>
                </div>
                <div className="mb-4 flex items-center justify-center">
                  <Clock className="mr-2 h-4 w-4 text-masonic-navy" />
                  <span className="text-gray-700">7:00 PM - 11:00 PM</span>
                </div>
                <p className="text-gray-600">A formal dinner celebrating the installation with distinguished guests.</p>
              </div>

              {/* Farewell Brunch */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-masonic-navy">
                  <Wallet className="h-10 w-10 text-masonic-gold" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-masonic-navy">Farewell Brunch</h3>
                <div className="w-full border-t border-gray-300 py-2"></div>
                <div className="mb-2 flex items-center justify-center">
                  <Calendar className="mr-2 h-4 w-4 text-masonic-navy" />
                  <span className="text-gray-700">May 17, 2025</span>
                </div>
                <div className="mb-4 flex items-center justify-center">
                  <Clock className="mr-2 h-4 w-4 text-masonic-navy" />
                  <span className="text-gray-700">10:00 AM - 1:00 PM</span>
                </div>
                <p className="text-gray-600">A casual gathering to conclude the Grand Installation weekend.</p>
              </div>
            </div>

            {/* Horizontal connecting line for larger screens */}
            <div className="absolute left-0 right-0 top-10 hidden border-t border-gray-300 md:block"></div>
          </div>
        </div>
      </section>

      {/* Other Masonic Events */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Other Upcoming Events</h2>
            <Link href="/events" className="text-blue-800 hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <EventCard
              id="1"
              title="Third Degree Ceremony"
              description="A solemn ceremony raising a Brother to the sublime degree of a Master Mason."
              date="October 10, 2023"
              location="Lodge Commonwealth No. 400, Sydney"
              imageUrl="/placeholder.svg?height=200&width=400"
              price="$20"
            />
            <EventCard
              id="2"
              title="Masonic Education Night"
              description="Learn about the symbolism and history of Freemasonry from distinguished speakers."
              date="September 25, 2023"
              location="Lodge Antiquity No. 1, Sydney"
              imageUrl="/placeholder.svg?height=200&width=400"
              price="$15"
            />
            <EventCard
              id="3"
              title="Annual Charity Gala"
              description="A formal dinner raising funds for the Masonic charities of NSW & ACT."
              date="December 5, 2023"
              location="Grand Ballroom, Hilton Sydney"
              imageUrl="/placeholder.svg?height=200&width=400"
              price="$95"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-masonic-navy py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Join Us for this Historic Occasion</h2>
            <div className="masonic-divider"></div>
            <p className="mb-8 text-lg">
              Be part of this momentous event in the history of the United Grand Lodge of NSW & ACT. Tickets are
              limited, so secure yours today.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                asChild
                variant="outline"
                className="border-masonic-gold text-masonic-gold hover:bg-masonic-navy/50"
              >
                <Link href="/events/grand-installation">Learn More</Link>
              </Button>
              <Button asChild className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
                <Link href="/events/grand-installation/register">Get Tickets</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-masonic-navy py-12 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-xl font-bold text-masonic-gold">LodgeTix</h3>
              <p>Official ticketing platform for the Grand Installation.</p>
              <div className="mt-4">
                <Link
                  href="https://www.masons.au"
                  target="_blank"
                  className="flex items-center text-masonic-gold hover:underline"
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
              <h4 className="mb-4 font-semibold text-masonic-gold">Event Information</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/events/grand-installation" className="hover:text-masonic-gold">
                    Grand Installation
                  </Link>
                </li>
                <li>
                  <Link href="/events/grand-installation/schedule" className="hover:text-masonic-gold">
                    Schedule
                  </Link>
                </li>
                <li>
                  <Link href="/events/grand-installation/venue" className="hover:text-masonic-gold">
                    Venue Information
                  </Link>
                </li>
                <li>
                  <Link href="/events/grand-installation/accommodation" className="hover:text-masonic-gold">
                    Accommodation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-masonic-gold">For Attendees</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/events/grand-installation/register" className="hover:text-masonic-gold">
                    Purchase Tickets
                  </Link>
                </li>
                <li>
                  <Link href="/account/tickets" className="hover:text-masonic-gold">
                    My Tickets
                  </Link>
                </li>
                <li>
                  <Link href="/events/grand-installation/faq" className="hover:text-masonic-gold">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-masonic-gold">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-masonic-gold">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="hover:text-masonic-gold">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-masonic-gold">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="hover:text-masonic-gold">
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
