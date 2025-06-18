import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import OrganiserTermsSummary from './organiser-terms-summary'
import { ExternalLink, FileText, AlertCircle } from 'lucide-react'

/**
 * Organiser Onboarding Terms Component
 * 
 * This component provides a complete terms acceptance flow for new Event Organisers
 * during the onboarding process. It includes:
 * 
 * - Terms summary display
 * - Required acknowledgment checkboxes
 * - Links to complete terms documents
 * - Stripe Connect agreement acknowledgment
 * - Legal compliance confirmations
 * 
 * Usage in onboarding flows where legal acceptance is mandatory.
 */

interface OrganiserOnboardingTermsProps {
  onAccept: (acceptanceData: TermsAcceptanceData) => void
  onDecline: () => void
  isLoading?: boolean
  organizationName?: string
}

interface TermsAcceptanceData {
  generalTermsAccepted: boolean
  organiserTermsAccepted: boolean
  stripeTermsAccepted: boolean
  kycComplianceAcknowledged: boolean
  refundResponsibilityAcknowledged: boolean
  masonicProtocolsAccepted: boolean // Only for Masonic organisations
  timestamp: Date
  userAgent: string
  ipAddress?: string // Should be captured server-side
}

export default function OrganiserOnboardingTerms({
  onAccept,
  onDecline,
  isLoading = false,
  organizationName
}: OrganiserOnboardingTermsProps) {
  const [acceptances, setAcceptances] = useState({
    generalTerms: false,
    organiserTerms: false,
    stripeTerms: false,
    kycCompliance: false,
    refundResponsibility: false,
    masonicProtocols: false
  })

  const [hasReadSummary, setHasReadSummary] = useState(false)

  // Check if all required terms are accepted
  const allRequiredAccepted = Object.values(acceptances).every(Boolean)

  const handleAcceptanceChange = (key: keyof typeof acceptances, checked: boolean) => {
    setAcceptances(prev => ({
      ...prev,
      [key]: checked
    }))
  }

  const handleAccept = () => {
    if (!allRequiredAccepted) return

    const acceptanceData: TermsAcceptanceData = {
      generalTermsAccepted: acceptances.generalTerms,
      organiserTermsAccepted: acceptances.organiserTerms,
      stripeTermsAccepted: acceptances.stripeTerms,
      kycComplianceAcknowledged: acceptances.kycCompliance,
      refundResponsibilityAcknowledged: acceptances.refundResponsibility,
      masonicProtocolsAccepted: acceptances.masonicProtocols,
      timestamp: new Date(),
      userAgent: navigator.userAgent
    }

    onAccept(acceptanceData)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Event Organiser Terms & Agreements</CardTitle>
          <CardDescription>
            {organizationName && (
              <span className="block mb-2 font-medium">Organisation: {organizationName}</span>
            )}
            Before you can start organizing events on LodgeTix, you must review and accept our 
            Terms of Service and related agreements. This ensures compliance with Australian 
            regulations and Stripe payment processing requirements.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Terms Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Key Terms Summary</span>
          </CardTitle>
          <CardDescription>
            Review these key terms and obligations. Links to complete documents are provided below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganiserTermsSummary 
            showFullTermsLink={false}
            showActions={false}
          />
          
          <div className="mt-6 pt-4 border-t">
            <label className="flex items-start space-x-3 cursor-pointer">
              <Checkbox 
                checked={hasReadSummary}
                onCheckedChange={(checked) => setHasReadSummary(checked as boolean)}
                className="mt-1"
              />
              <span className="text-sm">
                I have read and understood the key terms summary above
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Legal Agreements Acceptance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span>Required Legal Agreements</span>
          </CardTitle>
          <CardDescription>
            You must accept all of the following agreements to proceed with organiser registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* General Terms */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg">
            <Checkbox 
              checked={acceptances.generalTerms}
              onCheckedChange={(checked) => handleAcceptanceChange('generalTerms', checked as boolean)}
              className="mt-1"
              disabled={!hasReadSummary}
            />
            <div className="flex-1">
              <label className="font-medium cursor-pointer">
                LodgeTix General Terms of Service
              </label>
              <p className="text-sm text-gray-600 mt-1">
                General platform terms covering account usage, privacy, and basic obligations.
              </p>
              <a 
                href="/terms-of-service" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Read Complete Terms</span>
              </a>
            </div>
          </div>

          {/* Event Organiser Terms */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg bg-red-50 border-red-200">
            <Checkbox 
              checked={acceptances.organiserTerms}
              onCheckedChange={(checked) => handleAcceptanceChange('organiserTerms', checked as boolean)}
              className="mt-1"
              disabled={!hasReadSummary}
            />
            <div className="flex-1">
              <label className="font-medium cursor-pointer text-red-800">
                Event Organiser Terms of Service (Required)
              </label>
              <p className="text-sm text-red-700 mt-1">
                Comprehensive terms specific to event organisers including financial responsibilities, 
                KYC requirements, and refund obligations.
              </p>
              <a 
                href="/organiser-terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Read Complete Organiser Terms</span>
              </a>
            </div>
          </div>

          {/* Stripe Connect Terms */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg bg-blue-50 border-blue-200">
            <Checkbox 
              checked={acceptances.stripeTerms}
              onCheckedChange={(checked) => handleAcceptanceChange('stripeTerms', checked as boolean)}
              className="mt-1"
              disabled={!hasReadSummary}
            />
            <div className="flex-1">
              <label className="font-medium cursor-pointer text-blue-800">
                Stripe Connected Account Agreement (Required)
              </label>
              <p className="text-sm text-blue-700 mt-1">
                Payment processing terms and conditions, including data sharing with Stripe for compliance.
              </p>
              <a 
                href="https://stripe.com/au/legal/connect-account" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Read Stripe Terms</span>
              </a>
            </div>
          </div>

          {/* KYC Compliance */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg bg-amber-50 border-amber-200">
            <Checkbox 
              checked={acceptances.kycCompliance}
              onCheckedChange={(checked) => handleAcceptanceChange('kycCompliance', checked as boolean)}
              className="mt-1"
              disabled={!hasReadSummary}
            />
            <div className="flex-1">
              <label className="font-medium cursor-pointer text-amber-800">
                KYC/KYB Verification Compliance
              </label>
              <p className="text-sm text-amber-700 mt-1">
                I understand and agree to complete all required identity and business verification 
                processes as mandated by Australian financial regulations.
              </p>
            </div>
          </div>

          {/* Refund Responsibility */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg bg-red-50 border-red-200">
            <Checkbox 
              checked={acceptances.refundResponsibility}
              onCheckedChange={(checked) => handleAcceptanceChange('refundResponsibility', checked as boolean)}
              className="mt-1"
              disabled={!hasReadSummary}
            />
            <div className="flex-1">
              <label className="font-medium cursor-pointer text-red-800">
                Refund Processing Responsibility
              </label>
              <p className="text-sm text-red-700 mt-1">
                I understand that I am responsible for processing ALL refunds after the 3-day 
                LodgeTix processing period and will maintain sufficient account balance for this purpose.
              </p>
            </div>
          </div>

          {/* Masonic Protocols (conditional) */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg bg-blue-50 border-blue-200">
            <Checkbox 
              checked={acceptances.masonicProtocols}
              onCheckedChange={(checked) => handleAcceptanceChange('masonicProtocols', checked as boolean)}
              className="mt-1"
              disabled={!hasReadSummary}
            />
            <div className="flex-1">
              <label className="font-medium cursor-pointer text-blue-800">
                Masonic Protocol Compliance
              </label>
              <p className="text-sm text-blue-700 mt-1">
                I agree to comply with applicable Grand Lodge regulations, maintain proper ceremonial 
                protocols, and uphold Masonic principles in all event organization activities.
              </p>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <Button
              onClick={onDecline}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Decline & Exit
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1"
              disabled={!allRequiredAccepted || !hasReadSummary || isLoading}
            >
              {isLoading ? 'Processing...' : 'Accept All Terms & Continue'}
            </Button>
          </div>
          
          {!allRequiredAccepted && hasReadSummary && (
            <p className="text-sm text-red-600 mt-3 text-center">
              Please accept all required agreements to continue
            </p>
          )}
          
          {!hasReadSummary && (
            <p className="text-sm text-amber-600 mt-3 text-center">
              Please confirm you have read the terms summary above
            </p>
          )}
        </CardContent>
      </Card>

      {/* Legal Notice */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>
          By accepting these terms, you enter into legally binding agreements with LodgeTix and Stripe.
        </p>
        <p>
          These agreements are governed by the laws of New South Wales, Australia.
        </p>
        <p>
          Your acceptance will be recorded with timestamp and browser information for legal compliance.
        </p>
      </div>
    </div>
  )
}

// Export the types for use in other components
export type { TermsAcceptanceData }