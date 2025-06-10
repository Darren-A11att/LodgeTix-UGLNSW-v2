import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <CardDescription className="text-base">
              United Grand Lodge of NSW & ACT - LodgeTix Platform<br />
              Last updated: {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. About This Privacy Policy</h2>
              <p className="mb-4">
                This Privacy Policy explains how the United Grand Lodge of New South Wales & Australian Capital Territory 
                ("UGLNSW&ACT", "we", "us", or "our") collects, uses, discloses, and manages your personal information 
                through the LodgeTix platform and related services ("Services").
              </p>
              <p className="mb-4">
                We are committed to protecting your privacy and complying with the Privacy Act 1988 (Cth) and the 
                Australian Privacy Principles (APPs). This policy applies to all personal information we collect 
                about you when you use our Services.
              </p>
              <p className="mb-4">
                <strong>Our Contact Details:</strong><br />
                United Grand Lodge of NSW & ACT<br />
                279 Castlereagh Street, Sydney NSW 2000<br />
                Phone: (02) 9284 2800<br />
                Email: privacy@lodgetix.io
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Personal Information We Collect</h2>
              
              <h3 className="text-lg font-medium mb-3">2.1 Information You Provide</h3>
              <p className="mb-4">We collect personal information that you voluntarily provide to us, including:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Registration Information:</strong> Full name, email address, phone number, postal address</li>
                <li><strong>Masonic Information:</strong> Lodge name, lodge number, grand lodge affiliation, masonic rank or office, years of membership</li>
                <li><strong>Event Information:</strong> Dietary requirements, accessibility needs, emergency contact details</li>
                <li><strong>Payment Information:</strong> Billing details, payment method information (processed securely by our payment providers)</li>
                <li><strong>Profile Information:</strong> Profile photos, biographical information, preferences</li>
                <li><strong>Communications:</strong> Support requests, feedback, survey responses, correspondence with us</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.2 Information We Collect Automatically</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Technical Information:</strong> IP address, browser type, device information, operating system</li>
                <li><strong>Usage Information:</strong> Pages visited, time spent on pages, click-through rates, user interactions</li>
                <li><strong>Location Information:</strong> General location based on IP address (not precise location)</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, analytics cookies, preference cookies</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.3 Information From Third Parties</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Payment Processors:</strong> Transaction confirmation, payment status (Stripe, PayPal)</li>
                <li><strong>Lodge Secretaries:</strong> Member verification, lodge affiliation confirmation</li>
                <li><strong>Event Organisers:</strong> Additional attendee information, special requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. How We Use Your Personal Information</h2>
              
              <h3 className="text-lg font-medium mb-3">3.1 Primary Purposes</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Event Registration:</strong> Process registrations, manage bookings, allocate tickets</li>
                <li><strong>Payment Processing:</strong> Process payments, issue receipts, manage refunds</li>
                <li><strong>Event Management:</strong> Coordinate catering, seating, special requirements</li>
                <li><strong>Communication:</strong> Send confirmation emails, event updates, important notifications</li>
                <li><strong>Customer Support:</strong> Respond to inquiries, resolve technical issues, provide assistance</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.2 Secondary Purposes</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Service Improvement:</strong> Analyse usage patterns, improve functionality, enhance user experience</li>
                <li><strong>Marketing (with consent):</strong> Notify about future events, send newsletters, promotional content</li>
                <li><strong>Legal Compliance:</strong> Meet legal obligations, respond to law enforcement requests</li>
                <li><strong>Security:</strong> Prevent fraud, protect against abuse, maintain platform security</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.3 Legal Basis for Processing</h3>
              <p className="mb-4">Under Australian privacy law, we process your personal information based on:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Consent:</strong> Where you have provided explicit consent for specific purposes</li>
                <li><strong>Contract Performance:</strong> To fulfil our obligations in providing services to you</li>
                <li><strong>Legitimate Interests:</strong> For improving services, security, and business operations</li>
                <li><strong>Legal Obligation:</strong> To comply with Australian laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Disclosure of Personal Information</h2>
              
              <h3 className="text-lg font-medium mb-3">4.1 When We Share Your Information</h3>
              <p className="mb-4">We may disclose your personal information to:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Event Organisers:</strong> Lodge officers and event coordinators for events you register for</li>
                <li><strong>Service Providers:</strong> Payment processors, email service providers, hosting providers, analytics services</li>
                <li><strong>Professional Advisers:</strong> Lawyers, accountants, auditors, and other professional consultants</li>
                <li><strong>Related Entities:</strong> Other Grand Lodges, Masonic organisations for verification purposes</li>
                <li><strong>Government Agencies:</strong> When required by law, court order, or regulatory request</li>
                <li><strong>Emergency Contacts:</strong> In case of medical emergency or safety concern during events</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.2 Third-Party Service Providers</h3>
              <p className="mb-4">We work with the following types of service providers who may have access to your personal information:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Stripe:</strong> Payment processing and financial transactions</li>
                <li><strong>Supabase:</strong> Database hosting and backend services</li>
                <li><strong>Resend:</strong> Email delivery and communication services</li>
                <li><strong>Vercel:</strong> Web hosting and content delivery</li>
                <li><strong>Google Analytics:</strong> Website analytics and performance monitoring</li>
              </ul>
              <p className="mb-4">
                All service providers are contractually bound to protect your information and use it only for the 
                specified purposes. We ensure they maintain appropriate security standards.
              </p>

              <h3 className="text-lg font-medium mb-3">4.3 International Transfers</h3>
              <p className="mb-4">
                Some of our service providers are located overseas, including in the United States and European Union. 
                When we transfer your personal information overseas, we ensure appropriate safeguards are in place, 
                including standard contractual clauses and adequacy decisions where applicable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Data Security and Storage</h2>
              
              <h3 className="text-lg font-medium mb-3">5.1 Security Measures</h3>
              <p className="mb-4">We implement robust security measures to protect your personal information:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Encryption:</strong> Data encrypted in transit (TLS/SSL) and at rest (AES-256)</li>
                <li><strong>Access Controls:</strong> Role-based access, multi-factor authentication, regular access reviews</li>
                <li><strong>Infrastructure Security:</strong> Secure hosting, firewalls, intrusion detection systems</li>
                <li><strong>Regular Monitoring:</strong> Continuous monitoring for security threats and vulnerabilities</li>
                <li><strong>Staff Training:</strong> Regular privacy and security training for all personnel</li>
                <li><strong>Incident Response:</strong> Established procedures for data breach notification and response</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.2 Data Retention</h3>
              <p className="mb-4">We retain your personal information for as long as necessary to:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Provide services to you and maintain your account</li>
                <li>Comply with legal obligations (typically 7 years for financial records)</li>
                <li>Resolve disputes and enforce our agreements</li>
                <li>Support legitimate business purposes</li>
              </ul>
              <p className="mb-4">
                Specific retention periods vary by data type. Event registration data is typically retained for 7 years, 
                marketing data until you unsubscribe, and technical logs for 2 years.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Your Privacy Rights</h2>
              
              <h3 className="text-lg font-medium mb-3">6.1 Under Australian Privacy Law</h3>
              <p className="mb-4">You have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Access:</strong> Request copies of personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Complaint:</strong> Lodge a complaint about our handling of your personal information</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for marketing communications</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.2 Additional Rights</h3>
              <p className="mb-4">Where possible, we also provide:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Data Portability:</strong> Export your data in a structured, commonly-used format</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.3 How to Exercise Your Rights</h3>
              <p className="mb-4">To exercise any of these rights:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Email us at privacy@lodgetix.io with your request</li>
                <li>Call us on (02) 9284 2800 during business hours</li>
                <li>Write to us at Privacy Officer, UGLNSW&ACT, 279 Castlereagh Street, Sydney NSW 2000</li>
              </ul>
              <p className="mb-4">
                We will respond to your request within 30 days. We may need to verify your identity before 
                processing your request. Some requests may be subject to legal exceptions or limitations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Cookies and Tracking Technologies</h2>
              
              <h3 className="text-lg font-medium mb-3">7.1 Types of Cookies We Use</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Essential Cookies:</strong> Required for website functionality, user authentication, security</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Marketing Cookies:</strong> Track visitors across websites for advertising purposes (with consent)</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">7.2 Managing Cookies</h3>
              <p className="mb-4">
                You can control cookies through your browser settings. However, disabling certain cookies may 
                affect website functionality. You can also opt out of analytics tracking through our cookie 
                preference centre.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Marketing and Communications</h2>
              
              <h3 className="text-lg font-medium mb-3">8.1 Marketing Consent</h3>
              <p className="mb-4">
                We will only send you marketing communications if you have provided consent or where permitted 
                by law. This includes newsletters, event announcements, and promotional offers.
              </p>

              <h3 className="text-lg font-medium mb-3">8.2 Unsubscribing</h3>
              <p className="mb-4">You can unsubscribe from marketing communications at any time by:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Clicking the unsubscribe link in any marketing email</li>
                <li>Updating your preferences in your account settings</li>
                <li>Contacting us at privacy@lodgetix.io</li>
              </ul>
              <p className="mb-4">
                Note that unsubscribing from marketing does not affect essential communications related to 
                your bookings or account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Children's Privacy</h2>
              <p className="mb-4">
                Our Services are not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If we become aware that we have collected personal 
                information from a child under 13, we will take steps to delete such information.
              </p>
              <p className="mb-4">
                For attendees between 13-18 years of age, we require parental or guardian consent before 
                collecting their personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Data Breach Notification</h2>
              <p className="mb-4">
                In the event of a data breach that is likely to result in serious harm to individuals, we will:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Notify the Office of the Australian Information Commissioner within 72 hours</li>
                <li>Notify affected individuals without unreasonable delay</li>
                <li>Provide details about the nature of the breach and steps being taken</li>
                <li>Offer advice on protective measures individuals can take</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, 
                technology, legal requirements, or other factors. We will:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Post the updated policy on our website with a new "last updated" date</li>
                <li>Notify you of significant changes via email or website notice</li>
                <li>Seek fresh consent where required by law</li>
              </ul>
              <p className="mb-4">
                We encourage you to review this Privacy Policy periodically to stay informed about how 
                we protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Complaints and Contact Information</h2>
              
              <h3 className="text-lg font-medium mb-3">12.1 Making a Complaint</h3>
              <p className="mb-4">
                If you have concerns about how we handle your personal information, please contact our 
                Privacy Officer first:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Privacy Officer</strong><br />
                United Grand Lodge of NSW & ACT<br />
                279 Castlereagh Street, Sydney NSW 2000<br />
                Email: privacy@lodgetix.io<br />
                Phone: (02) 9284 2800</p>
              </div>
              <p className="mb-4">
                We will investigate your complaint and respond within 30 days. If you are not satisfied 
                with our response, you may lodge a complaint with the Office of the Australian Information 
                Commissioner (OAIC).
              </p>

              <h3 className="text-lg font-medium mb-3">12.2 OAIC Contact Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Office of the Australian Information Commissioner</strong><br />
                Website: www.oaic.gov.au<br />
                Phone: 1300 363 992<br />
                Email: enquiries@oaic.gov.au</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">13. Definitions</h2>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Personal Information:</strong> Information or opinion about an identified individual or reasonably identifiable individual</li>
                <li><strong>Sensitive Information:</strong> Information about health, racial or ethnic origin, political opinions, religious beliefs, trade union membership, criminal record, biometric data</li>
                <li><strong>Processing:</strong> Any operation performed on personal information including collection, use, disclosure, storage, and destruction</li>
                <li><strong>Data Controller:</strong> UGLNSW&ACT as the entity that determines the purposes and means of processing personal information</li>
              </ul>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600">
                This Privacy Policy was last updated on {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })} 
                and is effective immediately. This policy is governed by Australian law.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}