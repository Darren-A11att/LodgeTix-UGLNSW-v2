import Link from "next/link"
import { Ticket } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MasonicLogo } from "@/components/masonic-logo"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <Ticket className="mr-2 h-5 w-5 text-blue-600" />
          <span className="font-bold">LodgeTix</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/contact">Contact Us</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-12 text-center">
          <MasonicLogo size="lg" className="mx-auto mb-6" />
          <h1 className="mb-4 text-4xl font-bold">About LodgeTix</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            The premier platform for Masonic event management and ticketing, created by Freemasons for Freemasons.
          </p>
        </div>

        <div className="mb-12 space-y-8">
          <div>
            <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
            <p className="text-gray-600">
              LodgeTix was founded with a simple mission: to make Masonic event management easier and more accessible
              for Lodges of all sizes. We understand the unique needs of Masonic organizations and have built our
              platform specifically to address those needs.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold">Created By Freemasons</h2>
            <p className="text-gray-600">
              As active Freemasons ourselves, we've experienced firsthand the challenges of organizing Lodge meetings,
              degree ceremonies, installations, and social events. We've built LodgeTix to solve the problems we
              encountered, creating a platform that respects Masonic traditions while embracing modern technology.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold">Our Values</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border p-6">
                <h3 className="mb-2 text-xl font-semibold">Brotherly Love</h3>
                <p className="text-gray-600">
                  We believe in fostering connections between Brethren across different Lodges and jurisdictions.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="mb-2 text-xl font-semibold">Relief</h3>
                <p className="text-gray-600">
                  We aim to relieve the administrative burden on Lodge Secretaries and event organizers.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="mb-2 text-xl font-semibold">Truth</h3>
                <p className="text-gray-600">
                  We operate with transparency and integrity in all our business practices.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Features Built for Masonic Events</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mr-4 rounded-full bg-blue-100 p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-700"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Masonic-Specific Event Types</h3>
                <p className="text-gray-600">
                  Create events specifically for Lodge meetings, degree ceremonies, installations, and festive boards
                  with fields tailored to Masonic needs.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mr-4 rounded-full bg-blue-100 p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-700"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                  <path d="M9 3v18"></path>
                  <path d="M15 3v18"></path>
                  <path d="M3 9h18"></path>
                  <path d="M3 15h18"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Privacy Controls</h3>
                <p className="text-gray-600">
                  Control who can see your events with options for public events, members-only events, and private
                  events.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mr-4 rounded-full bg-blue-100 p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-700"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Visitor Management</h3>
                <p className="text-gray-600">
                  Easily manage visiting Brethren with special ticket types and the ability to collect Lodge
                  information.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Ready to Get Started?</h2>
          <p className="mb-6 text-gray-600">
            Join the growing number of Lodges using LodgeTix to manage their Masonic events.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/organizer/signup">Register Your Lodge</Link>
            </Button>
            <Button asChild className="bg-blue-700 hover:bg-blue-800">
              <Link href="/events">Browse Events</Link>
            </Button>
          </div>
        </div>
      </main>

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
