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
            <p>Official ticketing platform for the Grand Installation.</p>
            <div className="mt-4">
              <Link
                href="https://www.masons.au"
                target="_blank"
                className="flex items-center text-masonic-gold hover:underline"
              >
                <span>Visit masons.au</span>
                <ExternalLink className="ml-1 h-4 w-4" />
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
  )
}