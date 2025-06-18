import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LifebuoyIcon, NewspaperIcon, PhoneIcon, ShieldCheckIcon, CurrencyDollarIcon, ScaleIcon } from '@heroicons/react/20/solid'
import { COMPANY_INFO, DateFormatters, CompanyFormatters } from '@/lib/constants/company-details'

const supportCards = [
  {
    name: 'Legal Terms',
    description: 'Comprehensive terms governing your use of LodgeTix and event registration services.',
    icon: LifebuoyIcon,
  },
  {
    name: 'Payment Authorization',
    description: 'Important Stripe Connect payment processing, refunds, and financial obligations.',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Masonic Compliance',
    description: 'Special terms for Masonic event organization and member verification protocols.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'NSW Jurisdiction',
    description: 'These terms are governed by New South Wales law and Australian regulations.',
    icon: ScaleIcon,
  },
]

export default function TermsOfServicePage() {
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
            <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">Terms of Service</h2>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
              Comprehensive terms and conditions governing your use of LodgeTix. Please read these terms 
              carefully before using our platform or registering for events.
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
        <div className="mx-auto max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Terms of Service</CardTitle>
              <CardDescription className="text-base">
                {COMPANY_INFO.legalName} - {COMPANY_INFO.tradingName} Platform<br />
                ABN: {COMPANY_INFO.abn}<br />
                Last updated: {DateFormatters.getLastUpdatedDate()}
              </CardDescription>
            </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="text-lg font-medium mb-2 text-blue-800">Looking for a Simpler Version?</h3>
              <p className="text-blue-700">
                This is our comprehensive terms of service. For a user-friendly summary, see our 
                <a href="/terms" className="text-blue-600 hover:underline ml-1 mr-1">Simple Terms & Conditions</a>
                which covers the same information in plain English.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you and 
                {COMPANY_INFO.legalName} (ABN: {COMPANY_INFO.abn}) ("Company", "we", "us", or "our") 
                regarding your use of the {COMPANY_INFO.tradingName} platform and related services ("Services").
              </p>
              <p className="mb-4">
                By accessing, using, or registering for our Services, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms, our Privacy Policy, and any additional terms 
                applicable to specific services. If you do not agree with these Terms, you must not use our Services.
              </p>
              <p className="mb-4">
                These Terms are governed by the laws of {COMPANY_INFO.jurisdiction.state}, {COMPANY_INFO.jurisdiction.country}, 
                and you submit to the exclusive jurisdiction of the courts of {COMPANY_INFO.jurisdiction.state} 
                for any disputes arising from these Terms.
              </p>
              <p className="mb-4">
                By using our payment processing services, you also agree to be bound by the terms of service 
                of our payment processors, including Stripe's Connected Account Agreement and Services Agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Eligibility and Account Registration</h2>
              
              <h3 className="text-lg font-medium mb-3">2.1 Age and Capacity Requirements</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>You must be at least 18 years of age to register for events and make purchases</li>
                <li>You must have the legal capacity to enter into binding contracts under Australian law</li>
                <li>If registering on behalf of others, you must have their express authorization to do so</li>
                <li>For attendees under 18, a parent or legal guardian must complete the registration and accept these Terms</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.2 Masonic Verification Requirements</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Certain events may require proof of Masonic membership or affiliation with a recognised Grand Lodge</li>
                <li>We may require verification of your Lodge membership number, current dues status, and good standing</li>
                <li>Visitors from non-recognised Grand Lodges may be subject to additional verification processes</li>
                <li>Event organisers reserve the right to refuse admission based on Masonic eligibility criteria</li>
                <li>False representation of Masonic status may result in immediate account suspension and legal action</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.3 Account Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>You must provide accurate, current, and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must promptly update your information if it changes, particularly Lodge affiliation details</li>
                <li>You are liable for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>Lodge organisers must maintain current connected account information with Stripe</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Event Registration and Ticketing (Masonic-Specific Protocols)</h2>
              
              <h3 className="text-lg font-medium mb-3">3.1 Registration Process</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>All event registrations are subject to availability and event organiser approval</li>
                <li>Registrations are not confirmed until payment is successfully processed and verification is complete</li>
                <li>Lodge organisers reserve the right to decline registrations based on Masonic eligibility criteria</li>
                <li>Grand Lodge compliance requirements must be met for all ceremonial and official events</li>
                <li>Special dietary, accessibility, or regalia requirements must be specified during registration</li>
                <li>Interstate and international visitors may require additional verification and approval processes</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.2 Masonic Event Eligibility Rules</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Regular Lodge Meetings:</strong> Open only to Master Masons in good standing with recognised Grand Lodges</li>
                <li><strong>Social Functions:</strong> May include partners, family, and approved guests as per Lodge bylaws</li>
                <li><strong>Installation Ceremonies:</strong> Subject to specific invitation and Grand Lodge protocol requirements</li>
                <li><strong>Educational Events:</strong> May be open to Entered Apprentices and Fellow Crafts as specified</li>
                <li><strong>Charitable Functions:</strong> Generally open to the public with appropriate oversight</li>
                <li><strong>Inter-Lodge Events:</strong> Require verification of membership and good standing across participating Lodges</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.3 Visitor Admission Policies</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Visitors must provide current membership credentials and proof of good standing</li>
                <li>Grand Lodge recognition status will be verified through official channels</li>
                <li>Visitors from Prince Hall and other recognised jurisdictions are welcomed under reciprocal agreements</li>
                <li>Final admission decisions rest with the Tyler and Worshipful Master of the hosting Lodge</li>
                <li>Invalid or fraudulent credentials will result in refused entry and possible legal action</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.4 Ticket Terms</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Tickets are personal to the named attendee and non-transferable except with organiser approval</li>
                <li>You must present valid identification and proof of Masonic membership at ceremonial events</li>
                <li>Lost or stolen tickets may be replaced upon verification of identity and membership status</li>
                <li>Tickets remain the property of the issuing Lodge and may be revoked for breach of Masonic conduct</li>
                <li>Unauthorized resale or commercial use of tickets is strictly prohibited and may violate Grand Lodge regulations</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.5 Event Changes and Cancellations</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Event details may change due to circumstances beyond our control or Grand Lodge directives</li>
                <li>We will notify you of significant changes as soon as reasonably possible through registered contact methods</li>
                <li>If an event is cancelled by organisers, you will receive a full refund processed through Stripe</li>
                <li>If an event is postponed, your ticket remains valid for the rescheduled date</li>
                <li>We are not liable for any costs incurred as a result of event changes, cancellations, or travel arrangements</li>
                <li>Force majeure events including pandemic restrictions may require event modifications or cancellations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Payment Terms and Authorization (All Required Stripe Connect Language)</h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3 text-red-800">4.1 PAYMENT AUTHORIZATION - CRITICAL LEGAL NOTICE</h3>
                <p className="mb-4 text-red-800 font-bold">
                  BY COMPLETING A REGISTRATION AND SUBMITTING CREDIT CARD OR OTHER PAYMENT DETAILS, YOU 
                  EXPRESSLY AUTHORIZE AND CONSENT TO:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-red-800">
                  <li>The immediate charging of the total registration amount to your nominated payment method</li>
                  <li>Any additional charges for processing fees, service charges, or taxes as displayed</li>
                  <li>Future charges for any additional services you may purchase through your account</li>
                  <li>Charges related to modifications or amendments to your registration (where applicable)</li>
                  <li>Platform fees and payment processing charges as disclosed during checkout</li>
                </ul>
                <p className="mb-4 text-red-800 font-bold">
                  IF YOU ARE USING A PAYMENT METHOD THAT BELONGS TO ANOTHER PERSON (such as a company credit card 
                  or family member's card), YOU REPRESENT AND WARRANT THAT:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-red-800">
                  <li>You are explicitly authorized by the cardholder to use the payment method</li>
                  <li>The cardholder has consented to the charges described above</li>
                  <li>You have authority to bind the cardholder to these payment terms</li>
                  <li>You accept full liability for any unauthorized use of the payment method</li>
                </ul>
                <p className="text-red-800 font-bold">
                  UNAUTHORIZED USE OF PAYMENT METHODS IS STRICTLY PROHIBITED AND MAY RESULT IN LEGAL ACTION.
                </p>
              </div>

              <h3 className="text-lg font-medium mb-3">4.2 Stripe Connect Payment Processing</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="mb-4 text-blue-800 font-medium">
                  <strong>Connected Account Agreement:</strong> By using our platform to receive payments, Lodge organisers 
                  agree to be bound by the Stripe Connected Account Agreement and acknowledge that Stripe may receive 
                  transaction data and other information related to your use of the payment processing services.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>All payments are processed through Stripe Connect, a third-party payment processor</li>
                <li>Payments are processed in Australian Dollars (AUD) unless otherwise specified</li>
                <li>Lodge organisers must maintain a valid Stripe Connected Account to receive payments</li>
                <li>Payment processing fees are deducted automatically before funds are transferred to Lodge accounts</li>
                <li>We do not store complete credit card details on our systems - this is handled securely by Stripe</li>
                <li>International transactions may be subject to additional fees and currency conversion charges</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.3 KYC/Verification Requirements</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Lodge organisers must complete Stripe's Know Your Customer (KYC) verification process</li>
                <li>This includes providing business registration details, tax identification numbers, and bank account information</li>
                <li>Personal identification verification may be required for Lodge Treasurers and authorized representatives</li>
                <li>Additional documentation may be required for compliance with Australian anti-money laundering regulations</li>
                <li>Failure to complete verification may result in delayed or suspended payment processing</li>
                <li>We reserve the right to request additional verification information at any time</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.4 Pricing and Fees</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>All prices include GST (Goods and Services Tax) where applicable</li>
                <li>Prices may vary based on registration type, early bird discounts, or group rates</li>
                <li>Payment processing fees are disclosed during checkout and handled by our payment processor</li>
                <li>Platform fees may be charged in addition to standard payment processing fees</li>
                <li>Prices are subject to change without notice, but confirmed registrations honor the original price</li>
                <li>Multi-currency pricing may be offered with rates updated daily</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.5 Payment Disputes and Chargebacks</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Failed payments will result in registration cancellation unless resolved within 48 hours</li>
                <li>You are responsible for ensuring your payment method has sufficient funds</li>
                <li>Chargebacks or payment disputes must be resolved directly with us before contacting your bank</li>
                <li>Fraudulent chargebacks may result in account suspension and legal action</li>
                <li>Chargeback fees may be passed on to the relevant Lodge account</li>
                <li>We reserve the right to pursue collection of outstanding amounts</li>
                <li>Dispute resolution will be handled in accordance with Stripe's dispute resolution process</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.6 Platform Liability Limitations</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="mb-4 text-gray-700">
                  <strong>Important:</strong> {COMPANY_INFO.legalName} acts as a platform facilitating transactions between 
                  event attendees and Lodge organisers. We are not a party to the underlying transaction and disclaim 
                  responsibility for the performance of either party.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>We are not responsible for the failure of Lodge organisers to provide promised services</li>
                <li>We are not liable for disputes between attendees and Lodge organisers</li>
                <li>Refund policies are set by individual Lodge organisers, subject to our minimum standards</li>
                <li>We reserve the right to withhold payments in case of disputes until resolution</li>
                <li>Our liability is limited to the amount of platform fees received for the specific transaction</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Cancellation and Refund Policy</h2>
              
              <h3 className="text-lg font-medium mb-3">5.1 Cancellation by You</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>First 3 business days:</strong> Contact LodgeTix directly for refund processing</li>
                <li><strong>After 3 business days:</strong> Contact event organiser directly - refund policies vary by event</li>
                <li><strong>Organiser Policies:</strong> Each event organiser sets their own refund terms and timeframes</li>
                <li><strong>Policy Disclosure:</strong> Refund terms are clearly displayed during registration</li>
                <li><strong>No-shows:</strong> Generally not eligible for refunds unless specified by organiser policy</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.2 Exceptional Circumstances</h3>
              <p className="mb-4">Event organisers may consider special circumstances for refunds, such as:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Serious illness or injury (medical documentation may be required)</li>
                <li>Bereavement (documentation may be required)</li>
                <li>Military deployment or emergency service duty</li>
                <li>Other circumstances deemed exceptional by the event organiser</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.3 Processing Refunds</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>LodgeTix period (first 3 days):</strong> Refunds processed within 5 business days</li>
                <li><strong>Organiser period (after 3 days):</strong> Processing timeframes set by event organiser</li>
                <li>Refunds are processed to the original payment method</li>
                <li>Processing fees may apply as determined by refund policy and responsible party</li>
                <li>Refunds may take 3-5 business days to appear in your account after processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Code of Conduct and Behavior Standards (Masonic Values)</h2>
              
              <h3 className="text-lg font-medium mb-3">6.1 Masonic Principles and Expected Behavior</h3>
              <p className="mb-4">All users and attendees must uphold the fundamental principles of Freemasonry:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Brotherly Love:</strong> Treat all participants, staff, and volunteers with respect, dignity, and fraternal care</li>
                <li><strong>Relief:</strong> Assist fellow Masons and attendees when appropriate and within reasonable bounds</li>
                <li><strong>Truth:</strong> Conduct yourself with honesty, integrity, and sincerity in all interactions</li>
                <li><strong>Temperance:</strong> Exercise self-control and moderation in speech, conduct, and consumption</li>
                <li><strong>Fortitude:</strong> Demonstrate courage in upholding Masonic values and supporting worthy causes</li>
                <li><strong>Prudence:</strong> Exercise good judgment and discretion in all matters</li>
                <li><strong>Justice:</strong> Act fairly and equitably toward all persons regardless of their background</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.2 Lodge-Specific Conduct Requirements</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Follow all venue rules, local laws, and Grand Lodge regulations</li>
                <li>Dress appropriately according to specified dress codes and Masonic protocol</li>
                <li>Maintain proper decorum during ceremonial proceedings and formal events</li>
                <li>Respect the sanctity of Lodge rooms and ceremonial spaces</li>
                <li>Observe confidentiality requirements regarding Masonic matters and ceremonies</li>
                <li>Address officers and dignitaries with appropriate titles and respect</li>
                <li>Refrain from discussing politics, sectarian religion, or divisive topics in Lodge settings</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.3 Prohibited Conduct</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Harassment, discrimination, or bullying based on any characteristic</li>
                <li>Inappropriate physical contact or unwelcome advances</li>
                <li>Use of offensive language, hate speech, or discriminatory remarks</li>
                <li>Disruption of events, ceremonies, or Lodge proceedings</li>
                <li>Unauthorized recording, photography, or live streaming of ceremonial activities</li>
                <li>Commercial solicitation or unauthorized sales activities within Lodge premises</li>
                <li>Consumption of alcohol or substances in violation of venue policies or Grand Lodge regulations</li>
                <li>Violation of Masonic obligations or bringing disrepute to the Craft</li>
                <li>Disclosure of confidential Masonic information or ceremony details</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.4 Lodge Organizer Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Ensure all events comply with Grand Lodge regulations and local laws</li>
                <li>Implement appropriate visitor verification and admission procedures</li>
                <li>Maintain accurate records of attendees and their Masonic credentials</li>
                <li>Provide clear event guidelines and dress code requirements</li>
                <li>Ensure appropriate oversight and security for ceremonial events</li>
                <li>Report serious incidents to relevant Grand Lodge authorities</li>
                <li>Maintain proper financial records and transparent accounting of event funds</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.5 Enforcement and Masonic Discipline</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>We reserve the right to remove attendees who violate these standards or Masonic principles</li>
                <li>Removal from events does not entitle you to a refund</li>
                <li>Serious violations may result in permanent exclusion from future events</li>
                <li>Masonic misconduct may be reported to appropriate Grand Lodge authorities for disciplinary action</li>
                <li>We may report criminal conduct to appropriate law enforcement authorities</li>
                <li>Grand Lodge compliance requirements take precedence over platform policies where applicable</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Privacy and Data Protection</h2>
              <p className="mb-4">
                Your privacy is important to us. Our collection, use, and disclosure of personal information 
                is governed by our Privacy Policy, which forms part of these Terms. By using our Services, 
                you consent to:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Collection of personal information necessary for event registration and management</li>
                <li>Sharing of attendee information with event organisers and venue providers</li>
                <li>Use of anonymized data for service improvement and analytics</li>
                <li>Communication regarding your registrations and related services</li>
                <li>Compliance with Australian privacy laws including the Privacy Act 1988</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Intellectual Property Rights</h2>
              
              <h3 className="text-lg font-medium mb-3">8.1 Our Intellectual Property</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>The LodgeTix platform, including all content, features, and functionality, is owned by UGLNSW&ACT</li>
                <li>All text, graphics, logos, software, and design elements are protected by intellectual property laws</li>
                <li>Masonic symbols and regalia are used under appropriate authorization</li>
                <li>You may not reproduce, distribute, or create derivative works without written permission</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">8.2 User Content</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>You retain ownership of content you submit (photos, comments, reviews)</li>
                <li>You grant us a license to use your content for promotional and operational purposes</li>
                <li>You represent that your content does not infringe third-party rights</li>
                <li>We may remove content that violates these Terms or is inappropriate</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Disclaimers and Limitation of Liability</h2>
              
              <h3 className="text-lg font-medium mb-3">9.1 Service Disclaimers</h3>
              <p className="mb-4">To the maximum extent permitted by Australian law:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Our Services are provided "as is" without warranties of any kind</li>
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>We are not responsible for the actions of event organisers or third-party venues</li>
                <li>Information on our platform is subject to change without notice</li>
                <li>We do not guarantee the accuracy of user-generated content</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">9.2 Limitation of Liability</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Our total liability to you is limited to the amount you paid for the specific service</li>
                <li>We are not liable for indirect, incidental, consequential, or punitive damages</li>
                <li>We are not responsible for loss of profits, data, or business opportunities</li>
                <li>These limitations apply even if we have been advised of the possibility of such damages</li>
                <li>Some jurisdictions do not allow limitation of liability, so these limits may not apply to you</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">9.3 Force Majeure</h3>
              <p className="mb-4">
                We are not liable for any failure to perform our obligations due to circumstances beyond our 
                reasonable control, including but not limited to natural disasters, government actions, pandemic 
                restrictions, terrorism, war, or technical failures.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Indemnification</h2>
              <p className="mb-4">
                You agree to indemnify, defend, and hold harmless UGLNSW&ACT, its officers, directors, employees, 
                and agents from and against any claims, damages, losses, costs, or expenses (including reasonable 
                legal fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Your use of our Services or violation of these Terms</li>
                <li>Your attendance at events or interaction with other attendees</li>
                <li>Any content you submit or actions you take on our platform</li>
                <li>Your violation of any third-party rights or applicable laws</li>
                <li>Unauthorized use of payment methods or fraudulent activity</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Termination and Suspension</h2>
              
              <h3 className="text-lg font-medium mb-3">11.1 Termination by You</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>You may terminate your account at any time by contacting us</li>
                <li>Termination does not affect existing registrations or payment obligations</li>
                <li>You remain liable for any outstanding amounts</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">11.2 Termination by Us</h3>
              <p className="mb-4">We may suspend or terminate your account if you:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Violate these Terms or our policies</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Fail to pay outstanding amounts</li>
                <li>Behave inappropriately at events</li>
                <li>Provide false or misleading information</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">11.3 Effect of Termination</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Your access to our Services will be immediately revoked</li>
                <li>Existing registrations may be cancelled without refund</li>
                <li>Sections of these Terms that should survive termination will remain in effect</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Dispute Resolution (Including Masonic Protocols)</h2>
              
              <h3 className="text-lg font-medium mb-3">12.1 Initial Complaint Process</h3>
              <p className="mb-4">Before commencing formal proceedings, you must:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Contact our support team at {COMPANY_INFO.contact.supportEmail} with details of your complaint</li>
                <li>Allow us 30 days to investigate and respond to your complaint</li>
                <li>Participate in good faith efforts to resolve the dispute informally</li>
                <li>For Masonic-related disputes, consider fraternal resolution through appropriate Lodge channels</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">12.2 Masonic Dispute Resolution Protocols</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Disputes between Masons should first be addressed through fraternal means where appropriate</li>
                <li>Lodge-level conflicts may be referred to appropriate Grand Lodge committees</li>
                <li>Inter-jurisdictional disputes may require Grand Lodge coordination and liaison</li>
                <li>Masonic conduct issues may be subject to Masonic discipline procedures in addition to these Terms</li>
                <li>The principles of Brotherly Love, Relief, and Truth should guide all dispute resolution efforts</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">12.3 Mediation and Arbitration</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Disputes may be referred to mediation through the Australian Disputes Centre</li>
                <li>If mediation fails, disputes may be resolved through binding arbitration</li>
                <li>Arbitration will be conducted in Sydney, NSW under Australian law</li>
                <li>For disputes involving significant Masonic protocol issues, appropriately qualified arbitrators will be sought</li>
                <li>You waive any right to participate in class action lawsuits</li>
                <li>Payment processing disputes will be subject to Stripe's dispute resolution procedures</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">12.4 Grand Lodge Compliance Requirements</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>All events and activities must comply with applicable Grand Lodge regulations</li>
                <li>Grand Lodge rulings on Masonic matters take precedence over platform policies where applicable</li>
                <li>We will cooperate with Grand Lodge investigations and disciplinary proceedings</li>
                <li>Suspension or expulsion from Masonic membership may affect platform access</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">12.5 Governing Law and Jurisdiction</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>These Terms are governed by the laws of {COMPANY_INFO.jurisdiction.state}, {COMPANY_INFO.jurisdiction.country}</li>
                <li>Any legal proceedings must be commenced in the courts of {COMPANY_INFO.jurisdiction.state}</li>
                <li>You submit to the exclusive jurisdiction of these courts</li>
                <li>Australian Consumer Law protections apply where applicable and cannot be excluded</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">13. General Provisions</h2>
              
              <h3 className="text-lg font-medium mb-3">13.1 Entire Agreement</h3>
              <p className="mb-4">
                These Terms, together with our Privacy Policy and any specific event terms, constitute the 
                entire agreement between you and UGLNSW&ACT regarding your use of our Services.
              </p>

              <h3 className="text-lg font-medium mb-3">13.2 Amendments</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>We may update these Terms at any time by posting the revised version on our website</li>
                <li>Significant changes will be communicated via email or website notice</li>
                <li>Continued use of our Services after changes constitutes acceptance</li>
                <li>We will seek additional consent where required by law</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">13.3 Severability</h3>
              <p className="mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining 
                provisions will continue in full force and effect.
              </p>

              <h3 className="text-lg font-medium mb-3">13.4 Assignment</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>You may not assign your rights or obligations under these Terms without our written consent</li>
                <li>We may assign our rights and obligations to any affiliate or successor entity</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">13.5 Waiver</h3>
              <p className="mb-4">
                Our failure to enforce any provision of these Terms does not constitute a waiver of that 
                provision or any other provision.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">14. Contact Information</h2>
              <p className="mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>{COMPANY_INFO.legalName}</strong><br />
                Trading as: {COMPANY_INFO.tradingName}<br />
                ABN: {COMPANY_INFO.abn}<br />
                {COMPANY_INFO.address.street}<br />
                {COMPANY_INFO.address.suburb} {COMPANY_INFO.address.state} {COMPANY_INFO.address.postcode}<br />
                {COMPANY_INFO.address.country}<br />
                Phone: {COMPANY_INFO.contact.phone}<br />
                Email: {COMPANY_INFO.contact.email}<br />
                Support: {COMPANY_INFO.contact.supportEmail}<br />
                Legal: legal@lodgetix.io</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-medium mb-3 text-blue-800">For Masonic-Specific Inquiries:</h3>
                <p className="text-blue-800">
                  Questions regarding Masonic protocols, Grand Lodge compliance, or ceremonial requirements 
                  should be directed to the relevant Lodge Secretary or Grand Lodge office in addition to 
                  contacting our support team.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-medium mb-3 text-red-800">Payment and Stripe Connect Issues:</h3>
                <p className="text-red-800">
                  For payment processing issues, disputes, or Stripe Connect account problems, contact our 
                  support team immediately. Urgent payment issues may also be escalated through the contact 
                  information above.
                </p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600">
                These Terms of Service were last updated on {DateFormatters.getLastUpdatedDate()} 
                and are effective immediately. By using our Services, you acknowledge that you have read and understood these Terms.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This document includes all required Stripe Connect clauses, Australian compliance requirements, 
                and Masonic-specific terms as applicable to the {COMPANY_INFO.tradingName} platform operated by {COMPANY_INFO.legalName}.
              </p>
            </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}