import Link from "next/link"

import { Button } from "@/components/ui/button"
import { GrandInstallationHero } from "@/components/grand-installation-hero"
import { EventTimelineWithData } from "@/components/event-timeline"
import { FeaturedEventsSection } from "@/components/featured-events-section"
import { getGrandInstallationEvent } from "@/lib/services/homepage-service"

// Mark as dynamic since it uses server-side data fetching
export const dynamic = 'force-dynamic'

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
                    <Link href={`/functions/${slug}`}>Function Details</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
                  >
                    <Link href={`/functions/${slug}/register`}>Get Tickets</Link>
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
                  <Link href={`/functions/${slug}`}>Learn More</Link>
                </Button>
                <Button asChild className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
                  <Link href={`/functions/${slug}/register`}>Get Tickets</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}