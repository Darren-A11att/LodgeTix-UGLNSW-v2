import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <CardDescription className="text-base">
              United Grand Lodge of NSW & ACT - LodgeTix Platform<br />
              Last updated: {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you and the 
                United Grand Lodge of New South Wales & Australian Capital Territory ("UGLNSW&ACT", "we", "us", or "our") 
                regarding your use of the LodgeTix platform and related services ("Services").
              </p>
              <p className="mb-4">
                By accessing, using, or registering for our Services, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree 
                with these Terms, you must not use our Services.
              </p>
              <p className="mb-4">
                These Terms are governed by the laws of New South Wales, Australia, and you submit to the 
                exclusive jurisdiction of the courts of New South Wales for any disputes arising from these Terms.
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

              <h3 className="text-lg font-medium mb-3">2.2 Account Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>You must provide accurate, current, and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must promptly update your information if it changes</li>
                <li>You are liable for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Event Registration and Ticketing</h2>
              
              <h3 className="text-lg font-medium mb-3">3.1 Registration Process</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>All event registrations are subject to availability and event organiser approval</li>
                <li>Registrations are not confirmed until payment is successfully processed</li>
                <li>We reserve the right to decline registrations at our discretion</li>
                <li>You may be required to provide proof of Masonic membership or affiliation</li>
                <li>Special dietary or accessibility requirements must be specified during registration</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.2 Ticket Terms</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Tickets are personal to the named attendee and generally non-transferable</li>
                <li>You must present valid identification and/or proof of Masonic membership at events</li>
                <li>Lost or stolen tickets may be replaced at our discretion upon verification</li>
                <li>Tickets remain the property of UGLNSW&ACT and may be revoked for breach of these Terms</li>
                <li>Unauthorized resale or commercial use of tickets is strictly prohibited</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.3 Event Changes and Cancellations</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Event details may change due to circumstances beyond our control</li>
                <li>We will notify you of significant changes as soon as reasonably possible</li>
                <li>If an event is cancelled by us, you will receive a full refund</li>
                <li>If an event is postponed, your ticket remains valid for the rescheduled date</li>
                <li>We are not liable for any costs incurred as a result of event changes or cancellations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Payment Terms and Authorization</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3 text-yellow-800">4.1 Payment Authorization - IMPORTANT</h3>
                <p className="mb-4 text-yellow-800 font-medium">
                  BY COMPLETING A REGISTRATION AND SUBMITTING CREDIT CARD OR OTHER PAYMENT DETAILS, YOU 
                  EXPRESSLY AUTHORIZE AND CONSENT TO:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-yellow-800">
                  <li>The immediate charging of the total registration amount to your nominated payment method</li>
                  <li>Any additional charges for processing fees, service charges, or taxes as displayed</li>
                  <li>Future charges for any additional services you may purchase through your account</li>
                  <li>Charges related to modifications or amendments to your registration (where applicable)</li>
                </ul>
                <p className="mb-4 text-yellow-800 font-medium">
                  IF YOU ARE USING A PAYMENT METHOD THAT BELONGS TO ANOTHER PERSON (such as a company credit card 
                  or family member's card), YOU REPRESENT AND WARRANT THAT:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-yellow-800">
                  <li>You are explicitly authorized by the cardholder to use the payment method</li>
                  <li>The cardholder has consented to the charges described above</li>
                  <li>You have authority to bind the cardholder to these payment terms</li>
                  <li>You accept full liability for any unauthorized use of the payment method</li>
                </ul>
                <p className="text-yellow-800 font-medium">
                  UNAUTHORIZED USE OF PAYMENT METHODS IS STRICTLY PROHIBITED AND MAY RESULT IN LEGAL ACTION.
                </p>
              </div>

              <h3 className="text-lg font-medium mb-3">4.2 Payment Processing</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>All payments are processed in Australian Dollars (AUD) unless otherwise specified</li>
                <li>We use secure third-party payment processors including Stripe and PayPal</li>
                <li>Payment processing fees may apply and will be clearly displayed before payment</li>
                <li>You are responsible for any bank fees, currency conversion fees, or international transaction fees</li>
                <li>We do not store complete credit card details on our systems</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.3 Pricing and Fees</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>All prices include GST (Goods and Services Tax) where applicable</li>
                <li>Prices may vary based on registration type, early bird discounts, or group rates</li>
                <li>Processing fees are calculated as a percentage of the total amount plus fixed fees</li>
                <li>Prices are subject to change without notice, but confirmed registrations honor the original price</li>
                <li>Multi-currency pricing may be offered with rates updated daily</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.4 Failed Payments and Disputes</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Failed payments will result in registration cancellation unless resolved within 48 hours</li>
                <li>You are responsible for ensuring your payment method has sufficient funds</li>
                <li>Chargebacks or payment disputes must be resolved directly with us before contacting your bank</li>
                <li>Fraudulent chargebacks may result in account suspension and legal action</li>
                <li>We reserve the right to pursue collection of outstanding amounts</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Cancellation and Refund Policy</h2>
              
              <h3 className="text-lg font-medium mb-3">5.1 Cancellation by You</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>More than 30 days before event:</strong> Full refund minus processing fees</li>
                <li><strong>15-30 days before event:</strong> 75% refund minus processing fees</li>
                <li><strong>7-14 days before event:</strong> 50% refund minus processing fees</li>
                <li><strong>Less than 7 days before event:</strong> No refund unless exceptional circumstances</li>
                <li><strong>No-shows:</strong> Not eligible for any refund</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.2 Exceptional Circumstances</h3>
              <p className="mb-4">Refunds outside the standard policy may be considered for:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Serious illness or injury (medical certificate required)</li>
                <li>Bereavement (death certificate required)</li>
                <li>Military deployment or emergency service duty</li>
                <li>Other circumstances deemed exceptional by UGLNSW&ACT management</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.3 Processing Refunds</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Refunds will be processed to the original payment method within 10 business days</li>
                <li>Processing fees are non-refundable unless the event is cancelled by us</li>
                <li>Refunds may take 3-5 business days to appear in your account after processing</li>
                <li>International refunds may take longer due to banking procedures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Code of Conduct and Behavior Standards</h2>
              
              <h3 className="text-lg font-medium mb-3">6.1 Expected Behavior</h3>
              <p className="mb-4">All users and attendees must:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Treat all participants, staff, and volunteers with respect and dignity</li>
                <li>Uphold the values and traditions of Freemasonry</li>
                <li>Follow all venue rules, local laws, and event guidelines</li>
                <li>Dress appropriately according to specified dress codes</li>
                <li>Refrain from disruptive, offensive, or inappropriate behavior</li>
                <li>Respect the privacy and confidentiality of other attendees</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.2 Prohibited Conduct</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Harassment, discrimination, or bullying based on any characteristic</li>
                <li>Inappropriate physical contact or unwelcome advances</li>
                <li>Use of offensive language, hate speech, or discriminatory remarks</li>
                <li>Disruption of events, ceremonies, or activities</li>
                <li>Unauthorized recording, photography, or live streaming</li>
                <li>Commercial solicitation or unauthorized sales activities</li>
                <li>Consumption of alcohol or substances in violation of venue policies</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.3 Enforcement</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>We reserve the right to remove attendees who violate these standards</li>
                <li>Removal from events does not entitle you to a refund</li>
                <li>Serious violations may result in permanent exclusion from future events</li>
                <li>We may report criminal conduct to appropriate authorities</li>
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
              <h2 className="text-xl font-semibold mb-4">12. Dispute Resolution</h2>
              
              <h3 className="text-lg font-medium mb-3">12.1 Complaint Process</h3>
              <p className="mb-4">Before commencing formal proceedings, you must:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Contact our support team at support@lodgetix.io with details of your complaint</li>
                <li>Allow us 30 days to investigate and respond to your complaint</li>
                <li>Participate in good faith efforts to resolve the dispute informally</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">12.2 Mediation and Arbitration</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Disputes may be referred to mediation through the Australian Disputes Centre</li>
                <li>If mediation fails, disputes may be resolved through binding arbitration</li>
                <li>Arbitration will be conducted in Sydney, NSW under Australian law</li>
                <li>You waive any right to participate in class action lawsuits</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">12.3 Governing Law and Jurisdiction</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>These Terms are governed by the laws of New South Wales, Australia</li>
                <li>Any legal proceedings must be commenced in the courts of New South Wales</li>
                <li>You submit to the exclusive jurisdiction of these courts</li>
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
                <p><strong>United Grand Lodge of NSW & ACT</strong><br />
                279 Castlereagh Street<br />
                Sydney NSW 2000<br />
                Phone: (02) 9284 2800<br />
                Email: legal@lodgetix.io<br />
                Support: support@lodgetix.io</p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600">
                These Terms of Service were last updated on {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })} 
                and are effective immediately. By using our Services, you acknowledge that you have read and understood these Terms.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}