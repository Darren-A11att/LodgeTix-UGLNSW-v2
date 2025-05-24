import Link from "next/link"

import { Button } from "@/components/ui/button"
import { GrandInstallationHero } from "@/components/grand-installation-hero"
import { EventTimelineWithData } from "@/components/event-timeline"
import { FeaturedEventsSection } from "@/components/featured-events-section"
import { getGrandInstallationEvent } from "@/lib/services/homepage-service"

export default async function HomePage() {
  const grandInstallation = await getGrandInstallationEvent();
  const slug = grandInstallation?.slug;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <GrandInstallationHero />

      {/* About the Grand Installation */}
      {grandInstallation && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-masonic-navy">{grandInstallation.title}</h2>
              <div className="masonic-divider"></div>
              <p className="mb-8 text-lg text-gray-700">
                {grandInstallation.description}
              </p>
              {slug && (
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Button asChild className="bg-masonic-navy hover:bg-masonic-blue">
                    <Link href={`/events/${slug}`}>Event Details</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
                  >
                    <Link href={`/events/${slug}/tickets`}>Get Tickets</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Event Timeline - Using server component with Supabase data */}
      <EventTimelineWithData />

      {/* Featured Events - Using server component with Supabase data */}
      <FeaturedEventsSection />

      {/* CTA Section */}
      {grandInstallation && slug && (
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
                  <Link href={`/events/${slug}`}>Learn More</Link>
                </Button>
                <Button asChild className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
                  <Link href={`/events/${slug}/tickets`}>Get Tickets</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

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
                  <Link href={`/events/${slug}`} className="hover:text-masonic-gold">
                    Grand Installation
                  </Link>
                </li>
                <li>
                  <Link href={`/events/${slug}/schedule`} className="hover:text-masonic-gold">
                    Schedule
                  </Link>
                </li>
                <li>
                  <Link href={`/events/${slug}/venue`} className="hover:text-masonic-gold">
                    Venue Information
                  </Link>
                </li>
                <li>
                  <Link href={`/events/${slug}/accommodation`} className="hover:text-masonic-gold">
                    Accommodation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-masonic-gold">For Attendees</h4>
              <ul className="space-y-2">
                <li>
                  <Link href={`/events/${slug}/register`} className="hover:text-masonic-gold">
                    Purchase Tickets
                  </Link>
                </li>
                <li>
                  <Link href="/account/tickets" className="hover:text-masonic-gold">
                    My Tickets
                  </Link>
                </li>
                <li>
                  <Link href={`/events/${slug}/faq`} className="hover:text-masonic-gold">
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