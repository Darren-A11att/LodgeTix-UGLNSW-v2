import Link from "next/link"
import { Ticket } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MasonicLogo } from "@/components/masonic-logo"
import { AboutContent } from "@/components/about"

// Mark as dynamic since AboutContent uses server-side data fetching
export const dynamic = 'force-dynamic'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-12 text-center">
          <MasonicLogo size="lg" className="mx-auto mb-6" />
          <h1 className="mb-4 text-4xl font-bold">About LodgeTix</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            The premier platform for Masonic event management and ticketing, created by Freemasons for Freemasons.
          </p>
        </div>

        {/* Dynamic About Content from Supabase */}
        <AboutContent />

        <div className="rounded-lg bg-blue-50 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Ready to Get Started?</h2>
          <p className="mb-6 text-gray-600">
            Join the growing number of Lodges using LodgeTix to manage their Masonic events.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/organiser/signup">Register Your Lodge</Link>
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
}