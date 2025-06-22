import Link from 'next/link'
import { FileText, Shield, CreditCard, UserCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const aboutMenuItems = [
  { name: 'About Us', href: '/business/about', current: false },
  { name: 'Contact', href: '/business/about/contact', current: false },
  { name: 'Legal & Terms', href: '/business/about/terms', current: true },
]

const legalDocuments = [
  {
    title: 'Terms of Service',
    description: 'Master agreement covering all LodgeTix services with role-specific terms for browsers, attendees, organisers, and developers.',
    href: '/business/about/terms/service-terms',
    icon: FileText,
    updated: 'Last updated: June 2025'
  },
  {
    title: 'Privacy Policy',
    description: 'Comprehensive privacy practices with Australian Privacy Principles and GDPR compliance for all user data.',
    href: '/business/about/terms/privacy-policy',
    icon: Shield,
    updated: 'Last updated: June 2025'
  },
  {
    title: 'Payment Processing Terms',
    description: 'Detailed terms for all payment methods including bank transfer, agent services, and integrated payment processing.',
    href: '/business/about/terms/payment-terms',
    icon: CreditCard,
    updated: 'Last updated: June 2025'
  },
  {
    title: 'Event Organiser Agreement',
    description: 'Comprehensive agreement for event organisers covering all service tiers and payment processing options.',
    href: '/business/about/terms/organiser-agreement',
    icon: UserCheck,
    updated: 'Last updated: June 2025'
  },
  {
    title: 'Attendee Terms',
    description: 'Terms and conditions for event attendees covering registration, payment, and event participation.',
    href: '/business/about/terms/attendee-terms',
    icon: UserCheck,
    updated: 'Last updated: June 2025'
  },
  {
    title: 'Acceptable Use Policy',
    description: 'Guidelines for appropriate platform use including prohibited activities and content standards.',
    href: '/business/about/terms/acceptable-use',
    icon: Shield,
    updated: 'Last updated: June 2025'
  },
  {
    title: 'Cookie Policy',
    description: 'Information about cookies and tracking technologies used on our platform.',
    href: '/business/about/terms/cookie-policy',
    icon: FileText,
    updated: 'Last updated: June 2025'
  },
  {
    title: 'Agent Services Addendum',
    description: 'Detailed supplement for organisers using LodgeTix payment agent services including KYC and recovery procedures.',
    href: '/business/about/terms/agent-services',
    icon: CreditCard,
    updated: 'Last updated: June 2025'
  },
]

export default function LegalTermsPage() {
  return (
    <div>
      {/* Submenu Navigation */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            {aboutMenuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium ${
                  item.current
                    ? 'text-masonic-navy border-b-2 border-masonic-gold pb-1'
                    : 'text-gray-600 hover:text-masonic-navy'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              Legal & Terms
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Important legal documents and terms governing your use of LodgeTix services. 
              Please review these documents to understand your rights and responsibilities.
            </p>
          </div>
        </div>
      </div>

      {/* Legal Documents Grid */}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {legalDocuments.map((doc) => (
              <Card key={doc.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-masonic-lightblue rounded-lg text-masonic-navy">
                      <doc.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl text-masonic-navy">{doc.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{doc.description}</p>
                  <p className="text-sm text-gray-500 mb-4">{doc.updated}</p>
                  <Link
                    href={doc.href}
                    className="inline-flex items-center text-sm font-medium text-masonic-navy hover:text-masonic-blue"
                  >
                    Read Document →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-gray-600">
              If you have questions about any of these documents or need clarification on our terms, 
              please don't hesitate to <Link href="/business/about/contact" className="text-masonic-navy hover:text-masonic-blue font-medium">contact us</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}