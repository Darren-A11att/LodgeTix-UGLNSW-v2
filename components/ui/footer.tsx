import Link from "next/link"
import { ExternalLink } from "lucide-react"

interface FooterProps {
  eventSlug?: string;
}

export function Footer({ eventSlug }: FooterProps = {}) {
  // Use a default event slug if none provided
  const slug = eventSlug || 'grand-proclamation-2025';
  
  return (
    <footer className="bg-masonic-navy py-12 text-gray-300">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-xl font-bold text-masonic-gold">LodgeTix</h3>
            <p>Event management software for Masonic Lodges & Orders</p>
            <div className="mt-4">
              <Link
                href="/about"
                className="flex items-center text-masonic-gold hover:underline"
              >
                <span>About LodgeTix</span>
              </Link>
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-masonic-gold">Event Information</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/functions/${slug}`} className="hover:text-masonic-gold">
                  Grand Installation
                </Link>
              </li>
              <li>
                <Link href={`/functions/${slug}/schedule`} className="hover:text-masonic-gold">
                  Schedule
                </Link>
              </li>
              <li>
                <Link href={`/functions/${slug}/venue`} className="hover:text-masonic-gold">
                  Venue Information
                </Link>
              </li>
              <li>
                <Link href={`/functions/${slug}/accommodation`} className="hover:text-masonic-gold">
                  Accommodation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-masonic-gold">Our Software</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/software" className="hover:text-masonic-gold">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/software/product" className="hover:text-masonic-gold">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/software/solutions" className="hover:text-masonic-gold">
                  Solutions
                </Link>
              </li>
              <li>
                <Link href="/software/pricing" className="hover:text-masonic-gold">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-masonic-gold">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/software/terms/service-terms" className="hover:text-masonic-gold">
                  Service Terms
                </Link>
              </li>
              <li>
                <Link href="/software/terms/payment-terms" className="hover:text-masonic-gold">
                  Payment Terms
                </Link>
              </li>
              <li>
                <Link href="/software/terms/privacy-policy" className="hover:text-masonic-gold">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/software/terms/limited-agent" className="hover:text-masonic-gold">
                  Limited Agent Terms
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
  )
}