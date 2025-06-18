import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScaleIcon, ShieldCheckIcon, CurrencyDollarIcon, UsersIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/20/solid'
import { COMPANY_INFO, DateFormatters } from '@/lib/constants/company-details'

const supportCards = [
  {
    name: 'General Provisions',
    description: 'Core terms applying to all users - both event attendees and organisers.',
    icon: ScaleIcon,
  },
  {
    name: 'User-Specific Terms',
    description: 'Dedicated sections for attendees and organisers with clear role definitions.',
    icon: UsersIcon,
  },
  {
    name: 'Payment Framework',
    description: 'Unified Stripe Connect payment processing and 3-day refund responsibility transition.',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Platform Operations',
    description: 'LodgeTix role, limitations, and cross-user interaction mediation.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Dispute Resolution',
    description: 'Masonic protocols integrated with Australian legal framework.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Compliance',
    description: 'Industry standards alignment with Masonic focus and Australian requirements.',
    icon: ClockIcon,
  },
]

export default function UnifiedTermsOfServicePage() {
  return (
    <div>
      {/* Header Section */}
      <div className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
        <img
          alt=""
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&crop=focalpoint&fp-y=.8&w=2830&h=1500&q=80&blend=111827&sat=-100&exp=15&blend-mode=multiply"
          className="absolute inset-0 -z-10 size-full object-cover object-right md:object-center"
        />
        <div className="hidden sm:absolute sm:-top-10 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu sm:blur-3xl">
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="aspect-1097/845 w-274.25 bg-linear-to-tr from-[#ff4694] to-[#776fff] opacity-20"
          />
        </div>
        <div className="absolute -top-52 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu">
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="aspect-1097/845 w-274.25 bg-linear-to-tr from-[#ff4694] to-[#776fff] opacity-20"
          />
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">Unified Terms of Service</h2>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
              Comprehensive integrated terms governing all LodgeTix users - event attendees and organisers. 
              A cohesive legal framework with clear role definitions and interaction protocols.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
            {supportCards.map((card) => (
              <div key={card.name} className="flex gap-x-4 rounded-xl bg-white/5 p-6 ring-1 ring-white/10 ring-inset">
                <card.icon aria-hidden="true" className="h-7 w-5 flex-none text-indigo-400" />
                <div className="text-base/7">
                  <h3 className="font-semibold text-white">{card.name}</h3>
                  <p className="mt-2 text-gray-300">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white px-6 py-32 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">LodgeTix Unified Terms of Service</CardTitle>
              <CardDescription className="text-base">
                {COMPANY_INFO.legalName} - {COMPANY_INFO.tradingName} Platform<br />
                ABN: {COMPANY_INFO.abn}<br />
                Last updated: {DateFormatters.getLastUpdatedDate()}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              
              {/* Quick Navigation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium mb-4 text-blue-800">Document Navigation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-blue-800 mb-2">Universal Terms:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li><a href="#general-provisions" className="hover:underline">→ General Provisions (Sections 1-3)</a></li>
                      <li><a href="#shared-responsibilities" className="hover:underline">→ Shared Responsibilities (Section 4)</a></li>
                      <li><a href="#platform-operations" className="hover:underline">→ Platform Operations (Section 5)</a></li>
                      <li><a href="#legal-framework" className="hover:underline">→ Legal Framework (Sections 6-9)</a></li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800 mb-2">User-Specific Terms:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li><a href="#attendee-terms" className="hover:underline">→ Event Attendee Terms</a></li>
                      <li><a href="#organiser-terms" className="hover:underline">→ Event Organiser Terms</a></li>
                      <li><a href="#cross-references" className="hover:underline">→ Cross-References & Conflicts</a></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* PART I: GENERAL PROVISIONS */}
              <section id="general-provisions" className="mb-12">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-2">
                  PART I: GENERAL PROVISIONS
                </h1>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">1. Agreement Scope and Definitions</h2>
                  
                  <h3 className="text-lg font-medium mb-3">1.1 Binding Agreement</h3>
                  <p className="mb-4">
                    These Unified Terms of Service ("Terms") constitute a legally binding agreement between all users and 
                    {COMPANY_INFO.legalName} (ABN: {COMPANY_INFO.abn}) ("Company", "LodgeTix", "we", "us", or "our") 
                    regarding use of the {COMPANY_INFO.tradingName} platform and related services ("Platform").
                  </p>

                  <h3 className="text-lg font-medium mb-3">1.2 User Type Definitions</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong>"Event Attendees"</strong> - Individuals who register for, purchase tickets to, or attend events through the Platform</li>
                      <li><strong>"Event Organisers"</strong> - Lodges, organisations, or authorised individuals who create, manage, and host events through the Platform</li>
                      <li><strong>"Users"</strong> - All platform users, including both Event Attendees and Event Organisers</li>
                      <li><strong>"Connected Accounts"</strong> - Stripe Connect accounts used by Event Organisers to receive payments</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-medium mb-3">1.3 Term Hierarchy and Application</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>General Provisions (Part I) apply to all users universally</li>
                    <li>User-specific terms (Parts II-III) apply to relevant user types</li>
                    <li>Shared Responsibilities (Part IV) apply to interactions between user types</li>
                    <li>Platform Operations (Part V) define LodgeTix's role and limitations</li>
                    <li>Legal Framework (Part VI) governs all disputes and enforcement</li>
                    <li>In case of conflicts, more specific terms take precedence over general terms</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">2. Universal Eligibility and Account Requirements</h2>
                  
                  <h3 className="text-lg font-medium mb-3">2.1 Basic Eligibility (All Users)</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must be at least 18 years of age and have legal capacity to enter contracts</li>
                    <li>Must provide accurate, current, and complete information during registration</li>
                    <li>Must maintain confidentiality of account credentials</li>
                    <li>Must comply with all applicable laws and regulations</li>
                    <li>Must uphold Masonic principles and values where applicable</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">2.2 Masonic Verification Framework</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="mb-4 text-amber-800 font-medium">Universal Masonic Standards:</p>
                    <ul className="list-disc list-inside space-y-2 text-amber-800">
                      <li>All users must respect Masonic traditions, protocols, and confidentiality requirements</li>
                      <li>Verification requirements vary by event type and user role</li>
                      <li>False representation of Masonic status is grounds for immediate account termination</li>
                      <li>Grand Lodge recognition status affects access to certain events and features</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-medium mb-3">2.3 Account Responsibilities (All Users)</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Responsible for all activities conducted under your account</li>
                    <li>Must promptly update information when circumstances change</li>
                    <li>Must immediately report unauthorised access or suspicious activity</li>
                    <li>Must maintain appropriate professional conduct in all platform interactions</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">3. Universal Code of Conduct and Masonic Values</h2>
                  
                  <h3 className="text-lg font-medium mb-3">3.1 Masonic Principles (Applicable to All Users)</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="mb-4 text-blue-800 font-medium">Fundamental Principles:</p>
                    <ul className="list-disc list-inside space-y-2 text-blue-800">
                      <li><strong>Brotherly Love:</strong> Treat all users with respect, dignity, and fraternal care</li>
                      <li><strong>Relief:</strong> Assist fellow users when appropriate and reasonable</li>
                      <li><strong>Truth:</strong> Conduct all interactions with honesty and integrity</li>
                      <li><strong>Temperance:</strong> Exercise moderation in conduct and communication</li>
                      <li><strong>Fortitude:</strong> Uphold Masonic values with courage and determination</li>
                      <li><strong>Prudence:</strong> Exercise sound judgment in all platform activities</li>
                      <li><strong>Justice:</strong> Treat all persons fairly regardless of background</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-medium mb-3">3.2 Prohibited Conduct (All Users)</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Harassment, discrimination, or bullying of any form</li>
                    <li>Fraudulent activity, false representations, or deceptive practices</li>
                    <li>Unauthorised commercial solicitation or spam</li>
                    <li>Violation of intellectual property rights</li>
                    <li>Breach of Masonic confidentiality or disclosure of ceremonial information</li>
                    <li>Any conduct that brings disrepute to Freemasonry or the Platform</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">3.3 Enforcement and Sanctions</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Violations may result in warnings, account suspension, or permanent termination</li>
                    <li>Serious violations may be reported to relevant Grand Lodge authorities</li>
                    <li>Criminal conduct will be reported to appropriate law enforcement</li>
                    <li>Sanctions apply to all platform activities and may affect both user types</li>
                  </ul>
                </section>
              </section>

              {/* PART II: EVENT ATTENDEE TERMS */}
              <section id="attendee-terms" className="mb-12">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-2">
                  PART II: EVENT ATTENDEE TERMS
                </h1>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium mb-3 text-green-800">Attendee-Specific Application</h3>
                  <p className="text-green-800">
                    This section applies specifically to users in their capacity as Event Attendees. 
                    If you also act as an Event Organiser, you must comply with both this section and Part III.
                  </p>
                </div>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">A1. Registration and Ticketing</h2>
                  
                  <h3 className="text-lg font-medium mb-3">A1.1 Registration Process</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Registrations are subject to availability and Event Organiser approval</li>
                    <li>Registration is confirmed only upon successful payment processing</li>
                    <li>You must provide accurate attendee information for all registrants</li>
                    <li>Special requirements (dietary, accessibility, regalia) must be specified during registration</li>
                    <li>Registration modifications may incur additional fees as determined by Event Organisers</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">A1.2 Masonic Event Eligibility</h3>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                    <p className="font-medium text-indigo-800 mb-2">Event Categories and Requirements:</p>
                    <ul className="list-disc list-inside space-y-2 text-indigo-800">
                      <li><strong>Regular Lodge Meetings:</strong> Master Masons in good standing only</li>
                      <li><strong>Ceremonial Events:</strong> Invitation required, dress code mandatory</li>
                      <li><strong>Social Functions:</strong> May include partners and approved guests</li>
                      <li><strong>Educational Programs:</strong> Open to applicable Masonic degrees</li>
                      <li><strong>Charitable Events:</strong> Generally open with appropriate oversight</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-medium mb-3">A1.3 Ticket Terms and Conditions</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Tickets are personal to the named attendee and generally non-transferable</li>
                    <li>Valid identification and proof of Masonic membership required for ceremonial events</li>
                    <li>Lost tickets may be replaced upon identity and membership verification</li>
                    <li>Tickets remain property of the issuing organisation</li>
                    <li>Unauthorised resale is prohibited and may violate Grand Lodge regulations</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">A2. Payment and Financial Obligations</h2>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-medium mb-3 text-red-800">A2.1 PAYMENT AUTHORIZATION - CRITICAL NOTICE</h3>
                    <p className="mb-4 text-red-800 font-bold">
                      BY COMPLETING REGISTRATION AND PROVIDING PAYMENT DETAILS, YOU AUTHORIZE:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-4 text-red-800">
                      <li>Immediate charging of total registration amount to your payment method</li>
                      <li>Additional charges for processing fees, taxes, and service charges as displayed</li>
                      <li>Future charges for modifications, upgrades, or additional services</li>
                      <li>Charges related to your account for other events you register for</li>
                    </ul>
                    <p className="text-red-800 font-bold">
                      If using a payment method belonging to another person, you represent that you have explicit 
                      authorization and accept full liability for any unauthorised use.
                    </p>
                  </div>

                  <h3 className="text-lg font-medium mb-3">A2.2 Payment Processing Framework</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>All payments processed through Stripe Connect to Event Organiser accounts</li>
                    <li>LodgeTix facilitates payment processing but is not the merchant of record</li>
                    <li>Processing fees clearly displayed before payment completion</li>
                    <li>International payments may incur additional currency conversion fees</li>
                    <li>Failed payments result in automatic registration cancellation within 48 hours</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">A2.3 Pricing and Fee Transparency</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>All prices displayed in Australian Dollars (AUD) including GST where applicable</li>
                    <li>Early bird, group rates, and member discounts applied automatically where eligible</li>
                    <li>Processing fees and platform charges clearly itemised during checkout</li>
                    <li>Confirmed registrations honor original pricing regardless of subsequent changes</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">A3. Cancellation and Refund Rights</h2>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-medium mb-3 text-orange-800">A3.1 3-Day Refund Responsibility Transition</h3>
                    <p className="text-orange-800 font-medium mb-2">Critical Timeline:</p>
                    <ul className="list-disc list-inside space-y-2 text-orange-800">
                      <li><strong>Days 1-3 after registration:</strong> LodgeTix processes refund requests directly</li>
                      <li><strong>Day 4 onwards:</strong> Event Organiser assumes refund responsibility</li>
                      <li><strong>Refund source clearly indicated</strong> in all communications</li>
                      <li><strong>Processing times vary</strong> depending on responsible party</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-medium mb-3">A3.2 Event Organiser Refund Policies</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li><strong>Organiser Discretion:</strong> Event organisers set their own refund policies and timeframes</li>
                    <li><strong>Policy Disclosure:</strong> Refund terms are clearly displayed during registration</li>
                    <li><strong>Individual Policies:</strong> Each event may have different refund requirements</li>
                    <li><strong>No-shows:</strong> Generally not eligible for refunds unless organiser policy specifies otherwise</li>
                    <li><strong>Processing Fees:</strong> Fees may apply as determined by the event organiser</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">A3.3 Exceptional Circumstances</h3>
                  <p className="mb-4">Event organisers may consider special circumstances for refunds, such as:</p>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Serious illness or injury (medical documentation may be required)</li>
                    <li>Bereavement (documentation may be required)</li>
                    <li>Military deployment or emergency service duty</li>
                    <li>Grand Lodge disciplinary action affecting attendance eligibility</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">A3.4 Event Changes and Cancellations</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Full refund if event cancelled by organisers</li>
                    <li>Tickets remain valid for rescheduled events</li>
                    <li>Significant changes may entitle you to full refund at your discretion</li>
                    <li>We are not liable for travel or accommodation costs</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">A4. Attendee Rights and Protections</h2>
                  
                  <h3 className="text-lg font-medium mb-3">A4.1 Consumer Protection Rights</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Australian Consumer Law protections apply where applicable</li>
                    <li>Right to receive services that match the description</li>
                    <li>Right to refund for services not provided as promised</li>
                    <li>Right to fair treatment and non-discriminatory access</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">A4.2 Data Protection and Privacy</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Personal information shared with Event Organisers only as necessary</li>
                    <li>Right to access, correct, and delete personal information</li>
                    <li>Masonic information protected under additional confidentiality measures</li>
                    <li>Marketing communications require explicit consent</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">A4.3 Access and Accommodation</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Reasonable accommodations for disabilities where possible</li>
                    <li>Dietary requirements accommodation based on venue capabilities</li>
                    <li>Clear communication of venue accessibility features</li>
                    <li>Religious and cultural considerations respected</li>
                  </ul>
                </section>
              </section>

              {/* PART III: EVENT ORGANISER TERMS */}
              <section id="organiser-terms" className="mb-12">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-2">
                  PART III: EVENT ORGANISER TERMS
                </h1>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium mb-3 text-purple-800">Organiser-Specific Application</h3>
                  <p className="text-purple-800">
                    This section applies specifically to users in their capacity as Event Organisers. 
                    Lodge representatives and authorised individuals who create and manage events must comply with these additional terms.
                  </p>
                </div>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">O1. Event Creation and Management</h2>
                  
                  <h3 className="text-lg font-medium mb-3">O1.1 Organisational Authority and Verification</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must be authorised representative of a recognised Lodge or Masonic organisation</li>
                    <li>Must provide valid business registration and tax identification numbers</li>
                    <li>Must complete Stripe Connect KYC verification process</li>
                    <li>Must maintain current Grand Lodge registration and good standing</li>
                    <li>Authority to bind organisation to financial and legal obligations</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">O1.2 Event Setup and Configuration</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must provide accurate event information, dates, venues, and requirements</li>
                    <li>Must set appropriate eligibility criteria and verification requirements</li>
                    <li>Must specify dress codes, accessibility features, and special requirements</li>
                    <li>Must comply with all applicable Grand Lodge regulations and local laws</li>
                    <li>Must implement appropriate security and safety measures</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">O1.3 Pricing and Financial Management</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must set fair and reasonable pricing for events</li>
                    <li>Must clearly disclose all fees, charges, and inclusions</li>
                    <li>Must honour advertised pricing for confirmed registrations</li>
                    <li>Must maintain transparent financial records for event proceeds</li>
                    <li>Must comply with applicable tax obligations and reporting requirements</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">O2. Stripe Connect and Payment Processing</h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-medium mb-3 text-blue-800">O2.1 Connected Account Agreement</h3>
                    <p className="mb-4 text-blue-800 font-medium">
                      By using LodgeTix payment processing, you agree to be bound by:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-blue-800">
                      <li>Stripe's Connected Account Agreement and Terms of Service</li>
                      <li>Stripe's compliance and verification requirements</li>
                      <li>Data sharing with Stripe for payment processing purposes</li>
                      <li>Stripe's dispute resolution and chargeback procedures</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-medium mb-3">O2.2 KYC and Compliance Obligations</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must complete full KYC verification including business and personal details</li>
                    <li>Must provide valid bank account information for fund transfers</li>
                    <li>Must maintain current information and promptly update changes</li>
                    <li>Must comply with anti-money laundering and counter-terrorism financing laws</li>
                    <li>Must respond promptly to verification requests or compliance inquiries</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">O2.3 Payment Processing and Fees</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Stripe processing fees deducted automatically from each transaction</li>
                    <li>Platform fees clearly disclosed and charged separately</li>
                    <li>Funds transferred to Connected Account within standard processing times</li>
                    <li>Responsible for any chargebacks, disputes, or failed payments</li>
                    <li>Must maintain adequate funds for potential reversals or adjustments</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">O2.4 Financial Reporting and Record Keeping</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must maintain detailed records of all transactions and attendees</li>
                    <li>Must provide transaction reports to LodgeTix upon request</li>
                    <li>Must comply with tax reporting and remittance obligations</li>
                    <li>Must preserve financial records as required by law and regulations</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">O3. Refund Management and 3-Day Transition</h2>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-medium mb-3 text-yellow-800">O3.1 Refund Responsibility Framework</h3>
                    <p className="mb-4 text-yellow-800 font-medium">Critical Understanding:</p>
                    <ul className="list-disc list-inside space-y-2 text-yellow-800">
                      <li><strong>Days 1-3:</strong> LodgeTix handles refund requests as platform service</li>
                      <li><strong>Day 4+:</strong> Event Organiser assumes full refund responsibility</li>
                      <li><strong>Processing authority</strong> clearly communicated to attendees</li>
                      <li><strong>Refund standards</strong> must be maintained regardless of responsible party</li>
                      <li><strong>Platform facilitation</strong> continues even during organiser responsibility period</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-medium mb-3">O3.2 Refund Policy Requirements</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must implement fair and reasonable refund policies</li>
                    <li>Must honour platform minimum refund standards</li>
                    <li>Must process legitimate refund requests promptly</li>
                    <li>Must maintain adequate funds for potential refunds</li>
                    <li>Must communicate refund decisions clearly to attendees</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">O3.3 Exceptional Circumstances Handling</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must consider compassionate refund requests fairly</li>
                    <li>Must verify documentation for exceptional circumstances claims</li>
                    <li>Must maintain consistency in decision-making processes</li>
                    <li>Must document decisions and rationale for record-keeping</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">O4. Event Delivery and Attendee Management</h2>
                  
                  <h3 className="text-lg font-medium mb-3">O4.1 Service Delivery Obligations</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must deliver events as advertised and described</li>
                    <li>Must provide advertised amenities, services, and inclusions</li>
                    <li>Must maintain professional standards throughout event execution</li>
                    <li>Must implement appropriate health and safety measures</li>
                    <li>Must provide clear event instructions and logistics information</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">O4.2 Attendee Verification and Management</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must implement appropriate Masonic verification procedures</li>
                    <li>Must maintain attendance records and registration lists</li>
                    <li>Must handle attendee inquiries and issues professionally</li>
                    <li>Must respect attendee privacy and confidentiality</li>
                    <li>Must provide clear communication regarding event changes</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">O4.3 Grand Lodge Compliance</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must comply with all applicable Grand Lodge regulations</li>
                    <li>Must implement proper ceremonial protocols where applicable</li>
                    <li>Must maintain appropriate records for Grand Lodge reporting</li>
                    <li>Must coordinate with Grand Lodge officials as required</li>
                    <li>Must report significant incidents or compliance issues</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">O5. Organiser Liability and Insurance</h2>
                  
                  <h3 className="text-lg font-medium mb-3">O5.1 Primary Responsibility</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Event Organisers are primarily responsible for event delivery and attendee safety</li>
                    <li>Must maintain appropriate insurance coverage for events and activities</li>
                    <li>Must comply with venue requirements and local regulations</li>
                    <li>Must indemnify LodgeTix against claims arising from event organisation</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">O5.2 Risk Management</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Must conduct appropriate risk assessments for events</li>
                    <li>Must implement suitable control measures and safety protocols</li>
                    <li>Must have emergency response procedures in place</li>
                    <li>Must maintain current contact information for emergency situations</li>
                  </ul>
                </section>
              </section>

              {/* PART IV: SHARED RESPONSIBILITIES */}
              <section id="shared-responsibilities" className="mb-12">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-2">
                  PART IV: SHARED RESPONSIBILITIES & CROSS-USER INTERACTIONS
                </h1>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">4. Cross-References and Interaction Protocols</h2>
                  
                  <h3 className="text-lg font-medium mb-3">4.1 Attendee-Organiser Relationship Framework</h3>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                    <p className="mb-4 text-teal-800 font-medium">Primary Relationship Structure:</p>
                    <ul className="list-disc list-inside space-y-2 text-teal-800">
                      <li><strong>Direct Contract:</strong> Attendees contract directly with Event Organisers for event services</li>
                      <li><strong>Platform Facilitation:</strong> LodgeTix facilitates the transaction but is not a party to the underlying contract</li>
                      <li><strong>Shared Standards:</strong> Both parties must comply with platform community standards</li>
                      <li><strong>Dispute Resolution:</strong> LodgeTix provides mediation but parties are responsible for resolution</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-medium mb-3">4.2 Information Sharing and Privacy</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Attendee information shared with Event Organisers only as necessary for event management</li>
                    <li>Masonic credentials verified through platform but details remain confidential</li>
                    <li>Marketing communications require explicit consent from attendees</li>
                    <li>Event Organisers may not use attendee data for unauthorised purposes</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">4.3 Communication Standards</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>All communication must maintain professional and fraternal standards</li>
                    <li>Platform messaging system must be used for official event-related communications</li>
                    <li>External contact information may be shared only with explicit consent</li>
                    <li>Disputes should be addressed through platform channels first</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">4B. Conflict Resolution Hierarchy</h2>
                  
                  <h3 className="text-lg font-medium mb-3">4B.1 Term Precedence Framework</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="mb-4 font-medium">When conflicts arise between different sections:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li><strong>Specific User Terms</strong> (Parts II-III) take precedence over General Provisions (Part I)</li>
                      <li><strong>Masonic Protocol Requirements</strong> take precedence over general platform policies</li>
                      <li><strong>Legal Compliance Requirements</strong> take precedence over operational preferences</li>
                      <li><strong>Safety and Security</strong> take precedence over convenience features</li>
                      <li><strong>Grand Lodge Regulations</strong> take precedence over platform policies where applicable</li>
                    </ol>
                  </div>

                  <h3 className="text-lg font-medium mb-3">4B.2 Dispute Escalation Process</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li><strong>Level 1:</strong> Direct communication between parties</li>
                    <li><strong>Level 2:</strong> Platform customer support mediation</li>
                    <li><strong>Level 3:</strong> Masonic fraternal resolution (where applicable)</li>
                    <li><strong>Level 4:</strong> Formal dispute resolution procedures</li>
                    <li><strong>Level 5:</strong> Legal proceedings as last resort</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">4C. Shared Data Policies</h2>
                  
                  <h3 className="text-lg font-medium mb-3">4C.1 Data Flow and Sharing Framework</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Attendee registration data shared with Event Organisers for legitimate event management purposes</li>
                    <li>Payment information processed through secure Stripe Connect infrastructure</li>
                    <li>Masonic verification data maintained with enhanced security and confidentiality</li>
                    <li>Communication records maintained for dispute resolution and compliance purposes</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">4C.2 Data Protection Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li><strong>LodgeTix:</strong> Secure platform infrastructure and access controls</li>
                    <li><strong>Event Organisers:</strong> Responsible use and protection of attendee information</li>
                    <li><strong>Attendees:</strong> Accuracy of provided information and account security</li>
                    <li><strong>All Parties:</strong> Compliance with Privacy Act 1988 and relevant regulations</li>
                  </ul>
                </section>
              </section>

              {/* PART V: PLATFORM OPERATIONS */}
              <section id="platform-operations" className="mb-12">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-2">
                  PART V: PLATFORM OPERATIONS & LODGETIX ROLE
                </h1>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">5. LodgeTix Platform Role and Limitations</h2>
                  
                  <h3 className="text-lg font-medium mb-3">5.1 Platform Service Definition</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="mb-4 font-medium">LodgeTix Role Clarification:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong>Technology Platform:</strong> We provide software infrastructure and tools</li>
                      <li><strong>Payment Facilitator:</strong> We facilitate payments through Stripe Connect</li>
                      <li><strong>Community Standards:</strong> We enforce platform community guidelines</li>
                      <li><strong>Not Event Provider:</strong> We do not organize, host, or deliver events</li>
                      <li><strong>Not Financial Institution:</strong> We are not a bank or payment processor</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-medium mb-3">5.2 Service Availability and Performance</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Platform provided "as is" with reasonable efforts to maintain availability</li>
                    <li>Scheduled maintenance performed with advance notice where possible</li>
                    <li>Emergency maintenance may be performed without notice</li>
                    <li>No guarantee of uninterrupted service or error-free operation</li>
                    <li>Performance may vary based on internet connectivity and device capabilities</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">5.3 Content and Information Accuracy</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Event information provided by Event Organisers, not verified by LodgeTix</li>
                    <li>Users responsible for accuracy of information they provide</li>
                    <li>We may remove content that violates community standards</li>
                    <li>No warranty regarding accuracy or completeness of user-generated content</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">5B. Platform Mediation and Support</h2>
                  
                  <h3 className="text-lg font-medium mb-3">5B.1 Customer Support Framework</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>General platform support provided through multiple channels</li>
                    <li>Technical issue resolution within reasonable timeframes</li>
                    <li>Dispute mediation services available but not mandatory</li>
                    <li>Escalation procedures for complex issues</li>
                    <li>Specialised support for Masonic protocol questions</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">5B.2 Inter-User Dispute Mediation</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Optional mediation services for attendee-organiser disputes</li>
                    <li>Platform policies provide framework for resolution</li>
                    <li>Final decisions remain with the disputing parties</li>
                    <li>Serious violations may result in platform sanctions</li>
                    <li>Fraternal resolution encouraged where appropriate</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">5B.3 Compliance and Safety Enforcement</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Monitoring of platform activity for policy compliance</li>
                    <li>Investigation of reported violations</li>
                    <li>Progressive enforcement actions based on severity</li>
                    <li>Cooperation with law enforcement where required</li>
                    <li>Coordination with Grand Lodge authorities for Masonic matters</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">5C. Technical Infrastructure and Security</h2>
                  
                  <h3 className="text-lg font-medium mb-3">5C.1 Data Security and Protection</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Industry-standard encryption for data transmission and storage</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Secure payment processing through Stripe's infrastructure</li>
                    <li>Access controls and authentication mechanisms</li>
                    <li>Enhanced protection for Masonic membership information</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">5C.2 Backup and Recovery</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Regular automated backups of platform data</li>
                    <li>Disaster recovery procedures to minimise service disruption</li>
                    <li>Data retention policies compliant with legal requirements</li>
                    <li>User notification procedures for significant incidents</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">5C.3 Integration and Third-Party Services</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Stripe Connect integration for payment processing</li>
                    <li>Email service providers for communications</li>
                    <li>Analytics services for platform improvement</li>
                    <li>Third-party services subject to their own terms and policies</li>
                  </ul>
                </section>
              </section>

              {/* PART VI: LEGAL FRAMEWORK */}
              <section id="legal-framework" className="mb-12">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-2">
                  PART VI: LEGAL FRAMEWORK & DISPUTE RESOLUTION
                </h1>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">6. Masonic Dispute Resolution Protocols</h2>
                  
                  <h3 className="text-lg font-medium mb-3">6.1 Fraternal Resolution Framework</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="mb-4 text-blue-800 font-medium">Masonic Resolution Principles:</p>
                    <ul className="list-disc list-inside space-y-2 text-blue-800">
                      <li><strong>Brotherly Reconciliation:</strong> Disputes between Masons should first be addressed fraternally</li>
                      <li><strong>Lodge Mediation:</strong> Lodge officers may assist in resolving member disputes</li>
                      <li><strong>Grand Lodge Coordination:</strong> Serious matters may require Grand Lodge involvement</li>
                      <li><strong>Masonic Discipline:</strong> Violations of Masonic conduct subject to traditional discipline</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-medium mb-3">6.2 Initial Complaint Process</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Contact platform support at {COMPANY_INFO.contact.supportEmail} with complaint details</li>
                    <li>Allow 30 days for investigation and response</li>
                    <li>Participate in good faith resolution efforts</li>
                    <li>Consider fraternal resolution through appropriate Lodge channels</li>
                    <li>Document all communications and resolution attempts</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">6.3 Escalation Procedures</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Mediation through Australian Disputes Centre if informal resolution fails</li>
                    <li>Binding arbitration for commercial disputes exceeding $10,000</li>
                    <li>Grand Lodge coordination for Masonic protocol disputes</li>
                    <li>Court proceedings only as last resort</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">7. Governing Law and Jurisdiction</h2>
                  
                  <h3 className="text-lg font-medium mb-3">7.1 Legal Jurisdiction</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>These Terms governed by laws of {COMPANY_INFO.jurisdiction.state}, {COMPANY_INFO.jurisdiction.country}</li>
                    <li>Exclusive jurisdiction of {COMPANY_INFO.jurisdiction.state} courts for legal proceedings</li>
                    <li>Australian Consumer Law protections apply where applicable</li>
                    <li>International users subject to Australian law for platform use</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">7.2 Compliance Requirements</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Privacy Act 1988 (Commonwealth) compliance for data protection</li>
                    <li>Competition and Consumer Act 2010 compliance for consumer protection</li>
                    <li>Anti-Money Laundering and Counter-Terrorism Financing Act compliance</li>
                    <li>Grand Lodge regulations and Masonic law where applicable</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">7.3 International Considerations</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>International users bound by Australian law for platform use</li>
                    <li>Currency conversion and international fees clearly disclosed</li>
                    <li>Cross-border Grand Lodge recognition protocols respected</li>
                    <li>International payment processing subject to additional verification</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">8. Liability Framework and Limitations</h2>
                  
                  <h3 className="text-lg font-medium mb-3">8.1 Platform Liability Limitations</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="mb-4 text-red-800 font-medium">Important Liability Limitations:</p>
                    <ul className="list-disc list-inside space-y-2 text-red-800">
                      <li><strong>Total Liability Cap:</strong> Limited to platform fees paid by user for specific transaction</li>
                      <li><strong>No Consequential Damages:</strong> Not liable for indirect losses, lost profits, or business interruption</li>
                      <li><strong>Third-Party Actions:</strong> Not responsible for Event Organiser or venue performance</li>
                      <li><strong>Force Majeure:</strong> Not liable for circumstances beyond reasonable control</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-medium mb-3">8.2 User Responsibility Allocation</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li><strong>Event Organisers:</strong> Primary responsibility for event delivery and attendee safety</li>
                    <li><strong>Attendees:</strong> Responsible for following event requirements and venue rules</li>
                    <li><strong>All Users:</strong> Liable for violations of Terms and platform policies</li>
                    <li><strong>Shared Responsibility:</strong> Maintaining respectful community environment</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">8.3 Insurance and Indemnification</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Event Organisers must maintain appropriate insurance coverage</li>
                    <li>Users agree to indemnify LodgeTix against claims arising from their actions</li>
                    <li>Platform maintains professional indemnity and cyber liability insurance</li>
                    <li>Insurance requirements may vary based on event type and size</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">9. Termination and Enforcement</h2>
                  
                  <h3 className="text-lg font-medium mb-3">9.1 Account Termination Rights</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Users may terminate accounts at any time with notice</li>
                    <li>LodgeTix may suspend or terminate accounts for Terms violations</li>
                    <li>Immediate termination for serious violations or illegal activity</li>
                    <li>Graduated enforcement for minor or first-time violations</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">9.2 Effect of Termination</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Existing registrations and obligations survive termination</li>
                    <li>Access to platform services immediately revoked</li>
                    <li>Data retention according to legal requirements and privacy policy</li>
                    <li>Outstanding financial obligations remain due</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-3">9.3 Masonic Disciplinary Coordination</h3>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Serious Masonic conduct violations reported to relevant Grand Lodge</li>
                    <li>Platform sanctions may be coordinated with Masonic discipline</li>
                    <li>Grand Lodge suspension or expulsion may affect platform access</li>
                    <li>Reinstatement procedures aligned with Masonic restoration processes</li>
                  </ul>
                </section>
              </section>

              {/* Final Provisions */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">10. Final Provisions and Contact Information</h2>
                
                <h3 className="text-lg font-medium mb-3">10.1 Entire Agreement and Modifications</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>These Unified Terms constitute the complete agreement for platform use</li>
                  <li>Supersedes all previous agreements and understandings</li>
                  <li>Modifications require written notice and user acceptance</li>
                  <li>Significant changes communicated via email and platform notifications</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">10.2 Severability and Interpretation</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Invalid provisions do not affect validity of remaining terms</li>
                  <li>Terms interpreted to give maximum legal effect while maintaining fairness</li>
                  <li>Ambiguities resolved in favour of platform community standards</li>
                  <li>Headings provided for convenience and do not affect interpretation</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">10.3 Language and Communication</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>These Terms available in English; translations for reference only</li>
                  <li>Official notices provided in English through registered communication methods</li>
                  <li>Platform support available in English with reasonable accommodation</li>
                </ul>

                <div className="bg-gray-50 p-6 rounded-lg mt-6">
                  <h3 className="font-medium mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="font-medium mb-2">Legal Entity:</p>
                      <p><strong>{COMPANY_INFO.legalName}</strong><br />
                      Trading as: {COMPANY_INFO.tradingName}<br />
                      ABN: {COMPANY_INFO.abn}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Contact Details:</p>
                      <p>{COMPANY_INFO.address.street}<br />
                      {COMPANY_INFO.address.suburb} {COMPANY_INFO.address.state} {COMPANY_INFO.address.postcode}<br />
                      Phone: {COMPANY_INFO.contact.phone}<br />
                      Email: {COMPANY_INFO.contact.email}<br />
                      Support: {COMPANY_INFO.contact.supportEmail}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h3 className="text-lg font-medium mb-3 text-blue-800">Industry Standards Alignment</h3>
                  <p className="text-blue-800 mb-2">
                    These Unified Terms align with industry standards from leading platforms while maintaining 
                    our Masonic focus and Australian compliance requirements:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                    <li>Payment processing standards compatible with Humanitix, TryBooking, and Eventbrite</li>
                    <li>Consumer protection aligned with Australian marketplace platforms</li>
                    <li>Masonic protocol integration unique to specialized community needs</li>
                    <li>Stripe Connect implementation following industry best practices</li>
                  </ul>
                </div>

                <div className="border-t pt-6 mt-8">
                  <p className="text-sm text-gray-600">
                    These Unified Terms of Service were last updated on {DateFormatters.getLastUpdatedDate()} 
                    and are effective immediately for all platform users. By using LodgeTix services in any capacity, 
                    you acknowledge reading, understanding, and agreeing to be bound by these Terms.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    This unified document includes all required Stripe Connect clauses, Australian compliance requirements, 
                    Masonic-specific protocols, and industry-standard terms as applicable to both Event Attendees and 
                    Event Organisers using the {COMPANY_INFO.tradingName} platform.
                  </p>
                </div>
              </section>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}