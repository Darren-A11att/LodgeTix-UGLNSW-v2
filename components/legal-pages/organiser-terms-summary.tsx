import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { COMPANY_INFO } from '@/lib/constants/company-details'
import { AlertTriangle, CreditCard, Shield, Users, FileText, Scale } from 'lucide-react'

/**
 * Event Organiser Terms Summary Component
 * 
 * This component provides a concise, user-friendly summary of the key terms
 * and obligations for Event Organisers. It's designed for use during account
 * signup or onboarding flows where space is limited but key information must
 * be communicated clearly.
 * 
 * Key areas covered:
 * - KYC/KYB verification requirements
 * - Financial responsibilities
 * - Refund obligations
 * - Platform compliance
 * - Legal obligations
 */

const keyTermsCards = [
  {
    title: 'Identity Verification Required',
    description: 'Complete Stripe Australia KYC/KYB verification with business documents, ID, and bank details before receiving payments.',
    icon: Shield,
    priority: 'critical',
    items: [
      'Valid ABN and business registration',
      'Government-issued photo ID',
      'Proof of address and bank account',
      'Beneficial ownership information'
    ]
  },
  {
    title: 'Refund Responsibilities',
    description: 'You handle ALL refunds after 3 days. LodgeTix only processes cancellations in the first 3 days.',
    icon: CreditCard,
    priority: 'critical',
    items: [
      'Days 1-3: LodgeTix handles refunds',
      'Day 4+: Your responsibility entirely',
      'Must maintain sufficient account balance',
      'Process approved refunds within 5 business days'
    ]
  },
  {
    title: 'Event Management Duties',
    description: 'Deliver all promised services, manage customer inquiries, and maintain accurate event information.',
    icon: Users,
    priority: 'important',
    items: [
      'Accurate event listings and pricing',
      'Customer service within 48 hours',
      'Safe and compliant event delivery',
      'Proper Masonic protocol (where applicable)'
    ]
  },
  {
    title: 'Financial Compliance',
    description: 'Maintain account balance, process payments correctly, and comply with Australian financial regulations.',
    icon: FileText,
    priority: 'important',
    items: [
      'AUSTRAC and ASIC compliance',
      'Chargeback and dispute liability',
      'Tax obligations and reporting',
      'Reserve requirements maintenance'
    ]
  },
  {
    title: 'Platform Rules',
    description: 'Follow acceptable use policies, maintain professional conduct, and respect platform integrity.',
    icon: Scale,
    priority: 'standard',
    items: [
      'Lawful and legitimate use only',
      'Professional customer interactions',
      'Accurate information provision',
      'No fraudulent or misleading activities'
    ]
  },
  {
    title: 'Legal Obligations',
    description: 'Comply with Australian Consumer Law, privacy requirements, and lodge/organisation protocols.',
    icon: AlertTriangle,
    priority: 'standard',
    items: [
      'Australian Consumer Law compliance',
      'Privacy Act 1988 adherence',
      'Local permits and regulations',
      'Grand Lodge protocols (Masonic events)'
    ]
  }
]

interface OrganiserTermsSummaryProps {
  showFullTermsLink?: boolean
  onAccept?: () => void
  onDecline?: () => void
  showActions?: boolean
}

export default function OrganiserTermsSummary({ 
  showFullTermsLink = true, 
  onAccept, 
  onDecline, 
  showActions = false 
}: OrganiserTermsSummaryProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'important':
        return 'border-amber-200 bg-amber-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-800'
      case 'important':
        return 'text-amber-800'
      default:
        return 'text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Important: Event Organiser Legal Agreement
            </h3>
            <p className="text-red-700">
              By becoming an Event Organiser on LodgeTix, you agree to legally binding terms that include 
              financial responsibilities, verification requirements, and compliance obligations. 
              <strong className="block mt-2">
                Please read these key terms carefully before proceeding.
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Key Terms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {keyTermsCards.map((card, index) => (
          <Card key={index} className={`${getPriorityColor(card.priority)} border-2`}>
            <CardHeader className="pb-3">
              <div className="flex items-start space-x-3">
                <card.icon className={`h-6 w-6 ${getPriorityTextColor(card.priority)} flex-shrink-0 mt-1`} />
                <div className="flex-1">
                  <CardTitle className={`text-lg ${getPriorityTextColor(card.priority)}`}>
                    {card.title}
                    {card.priority === 'critical' && (
                      <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                        REQUIRED
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className={`mt-1 ${getPriorityTextColor(card.priority)}`}>
                    {card.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className={`space-y-1 text-sm ${getPriorityTextColor(card.priority)}`}>
                {card.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stripe Connect Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Stripe Connect Payment Processing
        </h3>
        <p className="text-blue-700 mb-3">
          Payment processing is handled through Stripe Connect. By accepting these terms, you also agree to:
        </p>
        <ul className="text-blue-700 space-y-1 text-sm">
          <li className="flex items-start space-x-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
            <span>Stripe's Connected Account Agreement and Services Agreement</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
            <span>Stripe's Privacy Policy and data sharing practices</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
            <span>Australian financial services regulations and compliance requirements</span>
          </li>
        </ul>
      </div>

      {/* Company Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Legal Entity Information
        </h3>
        <div className="text-gray-700 space-y-1 text-sm">
          <p><strong>Company:</strong> {COMPANY_INFO.legalName}</p>
          <p><strong>Trading As:</strong> {COMPANY_INFO.tradingName}</p>
          <p><strong>ABN:</strong> {COMPANY_INFO.abn}</p>
          <p><strong>Governing Law:</strong> Laws of {COMPANY_INFO.jurisdiction.state}, {COMPANY_INFO.jurisdiction.country}</p>
          <p><strong>Support:</strong> {COMPANY_INFO.contact.supportEmail}</p>
        </div>
      </div>

      {/* Full Terms Link */}
      {showFullTermsLink && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Complete Terms Available
          </h3>
          <p className="text-yellow-700 mb-3">
            This is a summary of key terms. The complete Event Organiser Terms of Service contain 
            detailed information about all obligations, procedures, and legal requirements.
          </p>
          <a 
            href="/organiser-terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-yellow-800 font-medium hover:text-yellow-900 underline"
          >
            Read Complete Event Organiser Terms of Service →
          </a>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (onAccept || onDecline) && (
        <div className="flex space-x-4 pt-4">
          {onDecline && (
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Decline Terms
            </button>
          )}
          {onAccept && (
            <button
              onClick={onAccept}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Accept Terms & Continue
            </button>
          )}
        </div>
      )}

      {/* Legal Notice */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t">
        <p>
          By proceeding, you acknowledge that you have read, understood, and agree to be bound by 
          the Event Organiser Terms of Service, General Terms of Service, Privacy Policy, and all 
          applicable Stripe agreements.
        </p>
        <p className="mt-1">
          These terms are governed by the laws of {COMPANY_INFO.jurisdiction.state}, {COMPANY_INFO.jurisdiction.country}.
        </p>
      </div>
    </div>
  )
}