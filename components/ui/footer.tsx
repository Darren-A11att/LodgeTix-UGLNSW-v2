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
            <p>Event ticketing marketplace for Masonic Lodges & Orders</p>
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
            <h4 className="mb-4 font-semibold text-masonic-gold">For Attendees</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/functions/${slug}/register`} className="hover:text-masonic-gold">
                  Purchase Tickets
                </Link>
              </li>
              <li>
                <Link href="/customer/tickets" className="hover:text-masonic-gold">
                  My Tickets
                </Link>
              </li>
              <li>
                <Link href={`/functions/${slug}/faq`} className="hover:text-masonic-gold">
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
                <Link href="/unified-terms" className="hover:text-masonic-gold">
                  Unified Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-masonic-gold">
                  Simple Terms & Conditions
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
          <p>&copy; {new Date().getFullYear()} LodgeTix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}