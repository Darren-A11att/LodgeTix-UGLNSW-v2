'use client'

import { useState } from 'react'
import { OrganiserOnboardingTerms, type TermsAcceptanceData } from '@/components/legal-pages'
import { LayoutWithFooter } from '@/components/ui/layout-with-footer'

export default function OrganiserOnboardingExamplePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [acceptanceComplete, setAcceptanceComplete] = useState(false)
  const [acceptanceData, setAcceptanceData] = useState<TermsAcceptanceData | null>(null)

  const handleAccept = async (data: TermsAcceptanceData) => {
    setIsLoading(true)
    
    try {
      // Simulate API call to record acceptance
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Terms acceptance recorded:', data)
      setAcceptanceData(data)
      setAcceptanceComplete(true)
      
      // In real implementation:
      // - Save acceptance data to database
      // - Create Stripe Connected Account
      // - Begin KYC/KYB verification process
      // - Redirect to next onboarding step
      
    } catch (error) {
      console.error('Failed to record terms acceptance:', error)
      // Handle error appropriately
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = () => {
    // Handle decline - typically redirect away or show decline message
    console.log('Terms declined - redirect user away')
    alert('Terms declined. You will be redirected away from the organiser signup process.')
  }

  if (acceptanceComplete) {
    return (
      <LayoutWithFooter>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-green-700 mb-4">
              Terms Accepted Successfully!
            </h1>
            <p className="text-gray-600 mb-8">
              Thank you for accepting the Event Organiser Terms. Your acceptance has been recorded 
              and you can now proceed with the next steps of organiser verification.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-green-800 mb-3">Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-green-700">
                <li>Complete KYC/KYB verification with Stripe</li>
                <li>Verify your Australian bank account</li>
                <li>Upload required business documentation</li>
                <li>Create your first event</li>
              </ol>
            </div>

            {acceptanceData && (
              <div className="mt-8 text-xs text-gray-500">
                <p>Acceptance recorded at: {acceptanceData.timestamp.toISOString()}</p>
                <p>Reference ID: {acceptanceData.timestamp.getTime()}</p>
              </div>
            )}
          </div>
        </div>
      </LayoutWithFooter>
    )
  }

  return (
    <LayoutWithFooter>
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">
            Event Organiser Registration
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This is an example of how the Event Organiser Terms would be integrated into 
            the actual onboarding flow. The terms must be accepted before proceeding with 
            organiser verification and account setup.
          </p>
        </div>

        <OrganiserOnboardingTerms
          onAccept={handleAccept}
          onDecline={handleDecline}
          isLoading={isLoading}
          organizationName="Example Lodge #123"
        />
      </div>
    </LayoutWithFooter>
  )
}