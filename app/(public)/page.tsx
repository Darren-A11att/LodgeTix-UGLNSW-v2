import { HeroAngledDesign } from "@/components/hero-angled-design"
import { SponsorsSection } from "@/components/sponsors-section"
import { FeaturedEventsRedesigned } from "@/components/featured-events-redesigned"
import { LocationInfoSection } from "@/components/location-info-section"
import { CTASection } from "@/components/cta-section"

// Mark as dynamic since it uses server-side data fetching
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroAngledDesign />

      {/* Sponsors Section */}
      <SponsorsSection />

      {/* Featured Events Section */}
      <FeaturedEventsRedesigned />

      {/* Location Info Section */}
      <LocationInfoSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  )
}