import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheckIcon, UserIcon, PhoneIcon } from '@heroicons/react/20/solid'
import { COMPANY_INFO, DateFormatters } from '@/lib/constants/company-details'

const supportCards = [
  {
    name: 'Data Protection',
    description: 'Your personal information is protected with industry-standard security measures.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'User Rights',
    description: 'Access, correct, or delete your personal information at any time.',
    icon: UserIcon,
  },
  {
    name: 'Contact Us',
    description: 'Questions about privacy? We\'re here to help.',
    icon: PhoneIcon,
  },
]

export default function PrivacyPolicyPage() {
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
            <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">Privacy Policy</h2>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
              Comprehensive privacy practices for the LodgeTix platform, ensuring transparency and protection 
              of your personal information in accordance with Australian privacy laws.
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
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <CardDescription className="text-base">
                {COMPANY_INFO.legalName} - LodgeTix Platform<br />
                ABN: {COMPANY_INFO.abn}<br />
                Last updated: {DateFormatters.getLastUpdatedDate()}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <h3 className="text-lg font-medium mb-2 text-blue-800">Privacy Commitment</h3>
                <p className="text-blue-700">
                  {COMPANY_INFO.legalName} (trading as LodgeTix) ("we", "us", or "our") is committed to protecting 
                  your privacy and ensuring the security of your personal information. This Privacy Policy explains 
                  how we collect, use, disclose, and protect your information in accordance with the Australian 
                  Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
                </p>
              </div>

              {/* Section 1: Information We Collect */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
                
                <p className="mb-4">
                  We collect personal information that is necessary to provide our event registration and ticketing 
                  services for Masonic events. The types of information we collect include:
                </p>

                <h3 className="text-lg font-medium mb-2">1.1 Personal Information</h3>
                <p className="mb-4">
                  When you register for events or create an account, we collect:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Identity Information:</strong> Full name, date of birth, and identification details</li>
                  <li><strong>Contact Information:</strong> Email address, telephone numbers, and postal address</li>
                  <li><strong>Masonic Information:</strong> Lodge membership, rank, office held, and affiliated bodies</li>
                  <li><strong>Event Information:</strong> Dietary requirements, accessibility needs, and companion details</li>
                  <li><strong>Emergency Contact:</strong> Name and contact details of your emergency contact person</li>
                  <li><strong>Payment Information:</strong> Billing address and payment card details (processed securely by Square)</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">1.2 Technical Information</h3>
                <p className="mb-4">
                  When you use our platform, we automatically collect:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
                  <li><strong>Usage Information:</strong> Pages visited, features used, and interaction patterns</li>
                  <li><strong>Location Information:</strong> Approximate location based on IP address</li>
                  <li><strong>Cookie Data:</strong> Session cookies and preference settings</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">1.3 Information from Third Parties</h3>
                <p className="mb-4">
                  We may receive information about you from:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Event Organisers:</strong> Additional attendee information relevant to events</li>
                  <li><strong>Payment Processors:</strong> Transaction confirmations and payment status from Square</li>
                  <li><strong>Lodge Officers:</strong> Membership verification and status updates</li>
                </ul>
              </section>

              {/* Section 2: How We Use Information */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. How We Use Information</h2>
                
                <p className="mb-4">
                  We use your personal information for the following purposes:
                </p>

                <h3 className="text-lg font-medium mb-2">2.1 Service Provision</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Process event registrations and ticket purchases</li>
                  <li>Manage attendee lists and seating arrangements</li>
                  <li>Facilitate check-in at events</li>
                  <li>Coordinate catering and special requirements</li>
                  <li>Generate name badges and event materials</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">2.2 Communication</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Send booking confirmations and receipts</li>
                  <li>Provide event updates and important notifications</li>
                  <li>Respond to enquiries and support requests</li>
                  <li>Send reminders about upcoming events</li>
                  <li>With your consent, inform you about future Masonic events</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">2.3 Administration and Improvement</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Maintain and improve our platform functionality</li>
                  <li>Analyse usage patterns to enhance user experience</li>
                  <li>Ensure platform security and prevent fraud</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Process refunds and handle disputes</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">2.4 Legal Bases for Processing</h3>
                <p className="mb-4">
                  We process your information based on:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Contract Performance:</strong> To provide the services you've requested</li>
                  <li><strong>Legal Obligations:</strong> To comply with applicable laws and regulations</li>
                  <li><strong>Legitimate Interests:</strong> To operate and improve our platform</li>
                  <li><strong>Consent:</strong> For marketing communications and optional features</li>
                </ul>
              </section>

              {/* Section 3: Information Sharing */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. Information Sharing</h2>
                
                <p className="mb-4">
                  We share your information only as necessary to provide our services and comply with legal obligations:
                </p>

                <h3 className="text-lg font-medium mb-2">3.1 Event Organisers</h3>
                <p className="mb-4">
                  We share relevant attendee information with the Masonic lodge or body organising the event you're 
                  attending. This includes:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Your name and contact details</li>
                  <li>Masonic affiliation and office</li>
                  <li>Dietary and accessibility requirements</li>
                  <li>Emergency contact information</li>
                  <li>Payment status (but not payment card details)</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">3.2 Service Providers</h3>
                <p className="mb-4">
                  We engage trusted third-party service providers who assist in operating our platform:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Square:</strong> Payment processing and transaction management</li>
                  <li><strong>Supabase:</strong> Database hosting and infrastructure</li>
                  <li><strong>Vercel:</strong> Platform hosting and content delivery</li>
                  <li><strong>SendGrid:</strong> Email delivery services</li>
                  <li><strong>Google Analytics:</strong> Usage analytics (anonymised data only)</li>
                </ul>
                <p className="mb-4 text-sm text-gray-600">
                  All service providers are contractually bound to protect your information and use it only for 
                  the purposes we specify.
                </p>

                <h3 className="text-lg font-medium mb-2">3.3 Legal Requirements</h3>
                <p className="mb-4">
                  We may disclose your information when required by law, including:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>In response to court orders or legal proceedings</li>
                  <li>To comply with regulatory requirements</li>
                  <li>To protect our legal rights or prevent fraud</li>
                  <li>In emergency situations to protect safety</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">3.4 Business Transfers</h3>
                <p className="mb-4">
                  If our business is sold or merged, your information may be transferred to the new owners, subject 
                  to the same privacy protections outlined in this policy.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-amber-700">
                    <strong>Important:</strong> We never sell, rent, or trade your personal information to third 
                    parties for their marketing purposes.
                  </p>
                </div>
              </section>

              {/* Section 4: Data Security Measures */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Data Security Measures</h2>
                
                <p className="mb-4">
                  We implement comprehensive security measures to protect your personal information from unauthorised 
                  access, use, or disclosure:
                </p>

                <h3 className="text-lg font-medium mb-2">4.1 Technical Security</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Encryption:</strong> All data is encrypted in transit using TLS/SSL and at rest using AES-256</li>
                  <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication for staff</li>
                  <li><strong>Infrastructure:</strong> Secure cloud hosting with regular security updates</li>
                  <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
                  <li><strong>Backups:</strong> Regular encrypted backups with secure storage</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">4.2 Organisational Security</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Staff Training:</strong> Regular privacy and security training for all personnel</li>
                  <li><strong>Access Limitation:</strong> Information access on a need-to-know basis only</li>
                  <li><strong>Confidentiality:</strong> All staff bound by confidentiality agreements</li>
                  <li><strong>Incident Response:</strong> Established procedures for security incidents</li>
                  <li><strong>Regular Audits:</strong> Periodic security assessments and improvements</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">4.3 Payment Security</h3>
                <p className="mb-4">
                  Payment card information is processed directly by Square, a PCI-DSS compliant payment processor. 
                  We never store or have access to your complete payment card details.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-700">
                    While we implement robust security measures, no method of electronic transmission or storage 
                    is 100% secure. We continuously review and enhance our security practices to protect your information.
                  </p>
                </div>
              </section>

              {/* Section 5: Data Retention */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Data Retention</h2>
                
                <p className="mb-4">
                  We retain your personal information only for as long as necessary to fulfil the purposes for which 
                  it was collected and to comply with legal requirements:
                </p>

                <h3 className="text-lg font-medium mb-2">5.1 Retention Periods</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Account Information:</strong> Retained while your account is active plus 12 months</li>
                  <li><strong>Event Registration:</strong> 12 months after the event date for operational purposes</li>
                  <li><strong>Financial Records:</strong> 7 years as required by Australian tax law</li>
                  <li><strong>Marketing Preferences:</strong> Until you unsubscribe or withdraw consent</li>
                  <li><strong>Technical Logs:</strong> 90 days for security and performance monitoring</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">5.2 Deletion Process</h3>
                <p className="mb-4">
                  When retention periods expire or you request deletion:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Personal information is securely deleted from active systems</li>
                  <li>Backups are purged according to backup rotation schedules</li>
                  <li>Anonymised data may be retained for statistical purposes</li>
                  <li>Some information may be retained if required by law</li>
                </ul>
              </section>

              {/* Section 6: User Rights */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">6. User Rights</h2>
                
                <p className="mb-4">
                  Under the Australian Privacy Act 1988 and the Australian Privacy Principles, you have the following 
                  rights regarding your personal information:
                </p>

                <h3 className="text-lg font-medium mb-2">6.1 Access Rights</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Access Request:</strong> You can request a copy of the personal information we hold about you</li>
                  <li><strong>Information Provided:</strong> We'll provide your information in a structured, commonly used format</li>
                  <li><strong>Verification:</strong> We may request proof of identity before providing access</li>
                  <li><strong>Timeframe:</strong> We'll respond to access requests within 30 days</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">6.2 Correction Rights</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Update Information:</strong> You can correct inaccurate or incomplete information</li>
                  <li><strong>Account Settings:</strong> Many details can be updated directly in your account</li>
                  <li><strong>Verification:</strong> We may verify the accuracy of new information provided</li>
                  <li><strong>Notification:</strong> We'll notify relevant third parties of corrections where appropriate</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">6.3 Deletion Rights</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Deletion Request:</strong> You can request deletion of your personal information</li>
                  <li><strong>Exceptions:</strong> Some information must be retained for legal or legitimate business purposes</li>
                  <li><strong>Account Closure:</strong> Deleting your account will remove most personal information</li>
                  <li><strong>Confirmation:</strong> We'll confirm when deletion is complete</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">6.4 Additional Rights</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                  <li><strong>Data Portability:</strong> Export your information in a machine-readable format</li>
                  <li><strong>Restrict Processing:</strong> Request limitations on how we use your information</li>
                  <li><strong>Object:</strong> Object to specific uses of your information</li>
                  <li><strong>Complaints:</strong> Lodge a complaint about our privacy practices</li>
                </ul>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium mb-2 text-green-800">How to Exercise Your Rights</h4>
                  <p className="text-green-700">
                    To exercise any of these rights, contact us using the details in Section 11. We'll respond 
                    promptly and work with you to address your request.
                  </p>
                </div>
              </section>

              {/* Section 7: Cookies and Tracking */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">7. Cookies and Tracking</h2>
                
                <p className="mb-4">
                  We use cookies and similar tracking technologies to enhance your experience on our platform:
                </p>

                <h3 className="text-lg font-medium mb-2">7.1 Types of Cookies</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Essential Cookies:</strong> Required for platform functionality and security</li>
                  <li><strong>Performance Cookies:</strong> Help us understand how you use our platform</li>
                  <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
                  <li><strong>Analytics Cookies:</strong> Provide anonymised usage statistics</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">7.2 Cookie Management</h3>
                <p className="mb-4">
                  You can control cookies through your browser settings:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Most browsers allow you to refuse or delete cookies</li>
                  <li>Disabling essential cookies may impact platform functionality</li>
                  <li>We respect "Do Not Track" browser signals</li>
                  <li>Third-party cookies are subject to their respective privacy policies</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">7.3 Other Tracking Technologies</h3>
                <p className="mb-4">
                  We may also use:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Local Storage:</strong> To save preferences and session information</li>
                  <li><strong>Server Logs:</strong> To monitor platform performance and security</li>
                  <li><strong>Pixel Tags:</strong> In emails to confirm delivery and opening</li>
                </ul>
              </section>

              {/* Section 8: Children's Privacy */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">8. Children's Privacy</h2>
                
                <p className="mb-4">
                  Our platform is designed for adult members of Masonic organisations and their guests:
                </p>

                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>We do not knowingly collect information from children under 16 years of age</li>
                  <li>Users must be at least 18 years old to create an account</li>
                  <li>Information about minors attending events as guests must be provided by their parent or guardian</li>
                  <li>If we discover we've collected information from a child under 16 without parental consent, we'll promptly delete it</li>
                </ul>

                <p className="mb-4 text-sm text-gray-600">
                  If you believe we have inadvertently collected information from a child, please contact us immediately.
                </p>
              </section>

              {/* Section 9: International Transfers */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">9. International Transfers</h2>
                
                <p className="mb-4">
                  While we primarily operate in Australia, some of your information may be transferred internationally:
                </p>

                <h3 className="text-lg font-medium mb-2">9.1 Transfer Locations</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>United States:</strong> Some service providers (Square, Supabase) process data in the US</li>
                  <li><strong>European Union:</strong> Certain infrastructure services may use EU data centres</li>
                  <li><strong>Asia-Pacific:</strong> Content delivery networks may cache data regionally</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">9.2 Transfer Safeguards</h3>
                <p className="mb-4">
                  We ensure international transfers are protected by:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Using service providers with appropriate privacy certifications</li>
                  <li>Implementing contractual clauses for data protection</li>
                  <li>Ensuring compliance with Australian Privacy Principle 8</li>
                  <li>Monitoring international data protection developments</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">9.3 GDPR Considerations</h3>
                <p className="mb-4">
                  For users in the European Economic Area:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>We comply with applicable GDPR requirements</li>
                  <li>You have additional rights under GDPR including data portability</li>
                  <li>We've appointed {COMPANY_INFO.contact.email} as our GDPR contact</li>
                  <li>You may lodge complaints with your local data protection authority</li>
                </ul>
              </section>

              {/* Section 10: Changes to Policy */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">10. Changes to This Policy</h2>
                
                <p className="mb-4">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or legal 
                  requirements:
                </p>

                <h3 className="text-lg font-medium mb-2">10.1 Notification of Changes</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Material Changes:</strong> We'll notify you by email or platform announcement</li>
                  <li><strong>Minor Updates:</strong> Will be reflected in the "Last updated" date</li>
                  <li><strong>Review Recommendation:</strong> We encourage periodic review of this policy</li>
                  <li><strong>Continued Use:</strong> Using our platform after changes indicates acceptance</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">10.2 Version History</h3>
                <p className="mb-4">
                  Previous versions of this Privacy Policy are available upon request. Contact us if you need to 
                  review earlier versions.
                </p>
              </section>

              {/* Section 11: Contact Information */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">11. Contact Information</h2>
                
                <p className="mb-4">
                  For any questions, concerns, or requests regarding this Privacy Policy or our privacy practices:
                </p>

                <div className="bg-gray-50 p-6 rounded-lg mb-4">
                  <h3 className="font-medium mb-3">Privacy Officer</h3>
                  <p className="mb-2"><strong>{COMPANY_INFO.legalName}</strong></p>
                  <p className="mb-1">{COMPANY_INFO.address.street}</p>
                  <p className="mb-3">{COMPANY_INFO.address.suburb} {COMPANY_INFO.address.state} {COMPANY_INFO.address.postcode}</p>
                  <p className="mb-1"><strong>Email:</strong> {COMPANY_INFO.contact.email}</p>
                  <p className="mb-1"><strong>Phone:</strong> {COMPANY_INFO.contact.phone}</p>
                  <p><strong>ABN:</strong> {COMPANY_INFO.abn}</p>
                </div>

                <h3 className="text-lg font-medium mb-2">Response Times</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>General enquiries: Within 2 business days</li>
                  <li>Access requests: Within 30 days</li>
                  <li>Complaints: Initial response within 5 business days</li>
                  <li>Complex matters: We'll provide a timeline after initial assessment</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">External Complaints</h3>
                <p className="mb-4">
                  If you're not satisfied with our response to your privacy concern, you may lodge a complaint with:
                </p>
                
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="mb-2"><strong>Office of the Australian Information Commissioner (OAIC)</strong></p>
                  <p className="mb-1">Website: www.oaic.gov.au</p>
                  <p className="mb-1">Phone: 1300 363 992</p>
                  <p>Email: enquiries@oaic.gov.au</p>
                </div>
              </section>

              {/* Masonic-Specific Section */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">12. Masonic Data Handling</h2>
                
                <p className="mb-4">
                  We understand the unique privacy considerations within the Masonic community:
                </p>

                <h3 className="text-lg font-medium mb-2">12.1 Membership Information</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Lodge affiliations and offices are shared only with relevant event organisers</li>
                  <li>We respect the confidential nature of Masonic membership</li>
                  <li>Information about Masonic activities is not shared publicly</li>
                  <li>Guest information is handled with the same level of care</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">12.2 Event Privacy</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Attendee lists are provided only to authorised lodge officers</li>
                  <li>Event photographs require separate consent</li>
                  <li>Private lodge events are not publicly advertised</li>
                  <li>Tiled meetings maintain appropriate confidentiality</li>
                </ul>

                <h3 className="text-lg font-medium mb-2">12.3 Communication Protocols</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>We use formal titles and ranks appropriately in communications</li>
                  <li>Mass communications respect lodge hierarchies</li>
                  <li>Sensitive lodge matters are communicated only to appropriate officers</li>
                  <li>We maintain discretion in all Masonic-related communications</li>
                </ul>
              </section>

              {/* Legal Compliance Notice */}
              <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-8">
                <h3 className="font-medium mb-2">Legal Compliance</h3>
                <p className="text-sm text-gray-700 mb-2">
                  This Privacy Policy complies with:
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Privacy Act 1988 (Cth) and Australian Privacy Principles</li>
                  <li>• General Data Protection Regulation (GDPR) for EU users</li>
                  <li>• Payment Card Industry Data Security Standards (PCI-DSS)</li>
                  <li>• State and territory privacy legislation where applicable</li>
                  <li>• Industry best practices for data protection</li>
                </ul>
              </div>

              {/* Acknowledgment */}
              <div className="border-t pt-6 mt-8">
                <p className="text-sm text-gray-600">
                  By using the LodgeTix platform, you acknowledge that you have read and understood this Privacy 
                  Policy and agree to the collection, use, and disclosure of your information as described herein. 
                  This policy forms part of our Terms of Service and should be read in conjunction with those terms.
                </p>
                <p className="text-sm text-gray-600 mt-4">
                  This Privacy Policy was last updated on {DateFormatters.getLastUpdatedDate()}.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}