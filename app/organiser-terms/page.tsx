import EventOrganiserTerms from '@/components/legal-pages/event-organiser-terms'
import { LayoutWithFooter } from '@/components/ui/layout-with-footer'

export const metadata = {
  title: 'Event Organiser Terms of Service | LodgeTix',
  description: 'Comprehensive Terms of Service for Event Organisers using the LodgeTix platform, including KYC/KYB requirements, payment processing terms, and legal compliance obligations.',
  keywords: 'event organiser terms, LodgeTix organiser agreement, Stripe Connect terms, KYC requirements, event management terms',
}

/**
 * Event Organiser Terms of Service Page
 * 
 * This page provides comprehensive Terms of Service specifically for Event Organisers
 * using the LodgeTix platform. It includes:
 * 
 * - Complete Stripe Connect compliance requirements
 * - KYC/KYB verification obligations
 * - Event organiser responsibilities and obligations
 * - Financial terms, payment processing, and refund policies
 * - Australian regulatory compliance requirements
 * - Masonic-specific terms and protocols
 * - Dispute resolution and governing law provisions
 * 
 * These terms are legally binding and supplement the general Terms of Service.
 */

export default function OrganiserTermsPage() {
  return (
    <LayoutWithFooter>
      <EventOrganiserTerms />
    </LayoutWithFooter>
  )
}