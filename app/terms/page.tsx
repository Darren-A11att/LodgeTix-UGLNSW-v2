import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScaleIcon, CreditCardIcon, PhoneIcon } from '@heroicons/react/20/solid'
import { COMPANY_INFO, FORMATTED_STRINGS } from '@/lib/constants/company-details'

const supportCards = [
  {
    name: 'Clear Terms',
    description: 'Straightforward terms that are easy to understand for our Masonic community.',
    icon: ScaleIcon,
  },
  {
    name: 'Secure Payments',
    description: 'Safe and secure payment processing with transparent terms.',
    icon: CreditCardIcon,
  },
  {
    name: 'Need Help?',
    description: 'Contact us with any questions about our terms or services.',
    icon: PhoneIcon,
  },
]

export default function SimplifiedTermsPage() {
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
            <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">Simple Terms &amp; Conditions</h2>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
              Easy-to-understand terms for using LodgeTix and registering for Masonic events. 
              Clear rules that protect both you and us.
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
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Simple Terms &amp; Conditions</CardTitle>
              <CardDescription className="text-base">
                LodgeTix Platform - Operated by {COMPANY_INFO.legalName}<br />
                Last updated: {FORMATTED_STRINGS.LAST_UPDATED}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <h3 className="text-lg font-medium mb-2 text-blue-800">Quick Summary</h3>
                <p className="text-blue-700">
                  By using LodgeTix, you agree to provide accurate information, pay for registrations, 
                  follow our cancellation policy, and behave appropriately at events. We'll provide 
                  the ticketing services and handle your payments securely through Stripe.
                </p>
              </div>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="mb-4">
                  By using LodgeTix or registering for events, you agree to follow these terms. 
                  If you don't agree, please don't use our platform.
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>You must be 18 or older to make purchases</li>
                  <li>You're responsible for providing accurate information</li>
                  <li>You must have permission to use any payment method you provide</li>
                  <li>These terms are governed by New South Wales law</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. Registration and Ticketing</h2>
                <p className="mb-4">When you register for events:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Accurate Information:</strong> Provide correct details including your lodge information</li>
                  <li><strong>Confirmation:</strong> Your registration is only confirmed when payment is successful</li>
                  <li><strong>Event Requirements:</strong> Follow dress codes and venue rules</li>
                  <li><strong>Tickets:</strong> Bring valid ID and proof of Masonic membership to events</li>
                  <li><strong>Non-transferable:</strong> Tickets are generally for the named attendee only</li>
                </ul>
                <p className="mb-4 text-sm text-gray-600">
                  We may require proof of Masonic membership and reserve the right to decline registrations.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. Payment Terms</h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium mb-3 text-yellow-800">Payment Authorization - Important</h3>
                  <p className="mb-4 text-yellow-800 font-medium">
                    By submitting payment details, you authorize us to charge:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mb-4 text-yellow-800">
                    <li>The full registration amount immediately</li>
                    <li>Any processing fees or taxes shown</li>
                    <li>Future charges for additional services you purchase</li>
                  </ul>
                  <p className="text-yellow-800 font-medium">
                    If using someone else's payment method (company card, family member's card), 
                    you must have their explicit permission and accept full responsibility.
                  </p>
                </div>

                <p className="mb-4">Payment details:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Currency:</strong> All prices in Australian Dollars (AUD)</li>
                  <li><strong>Processing:</strong> Secure payment through Stripe</li>
                  <li><strong>Fees:</strong> Processing fees clearly displayed before payment</li>
                  <li><strong>GST:</strong> Included in all prices where applicable</li>
                  <li><strong>Failed Payments:</strong> Registration cancelled if not resolved within 48 hours</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Cancellation and Refunds</h2>
                <p className="mb-4">Our refund policy is:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>30+ days before event:</strong> Full refund minus processing fees</li>
                  <li><strong>15-30 days before:</strong> 75% refund minus processing fees</li>
                  <li><strong>7-14 days before:</strong> 50% refund minus processing fees</li>
                  <li><strong>Less than 7 days:</strong> No refund (except exceptional circumstances)</li>
                  <li><strong>No-shows:</strong> Not eligible for refund</li>
                </ul>
                
                <h3 className="text-lg font-medium mb-3">Exceptional Circumstances</h3>
                <p className="mb-4">We may consider refunds outside this policy for:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Serious illness or injury (medical certificate required)</li>
                  <li>Bereavement (death certificate required)</li>
                  <li>Military deployment or emergency service duty</li>
                </ul>
                <p className="mb-4 text-sm text-gray-600">
                  Refunds take 3-10 business days to appear in your account.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Code of Conduct</h2>
                <p className="mb-4">At all events, you must:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Respect:</strong> Treat everyone with dignity and courtesy</li>
                  <li><strong>Masonic Values:</strong> Uphold the traditions and values of Freemasonry</li>
                  <li><strong>Venue Rules:</strong> Follow all venue policies and local laws</li>
                  <li><strong>Dress Code:</strong> Adhere to specified dress requirements</li>
                  <li><strong>Privacy:</strong> Respect other attendees' confidentiality</li>
                </ul>
                
                <h3 className="text-lg font-medium mb-3">Prohibited Behaviour</h3>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Harassment, discrimination, or inappropriate conduct</li>
                  <li>Disruption of events or ceremonies</li>
                  <li>Unauthorized recording or photography</li>
                  <li>Commercial solicitation without permission</li>
                </ul>
                <p className="mb-4 text-sm text-gray-600">
                  Removal from events for misconduct does not entitle you to a refund.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">6. Privacy and Data Protection</h2>
                <p className="mb-4">We protect your privacy by:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Following Australian privacy laws (Privacy Act 1988)</li>
                  <li>Only collecting information necessary for our services</li>
                  <li>Using secure systems to protect your data</li>
                  <li>Sharing information only when necessary (with event organisers, payment processors)</li>
                  <li>Giving you control over your information</li>
                </ul>
                <p className="mb-4 text-sm text-gray-600">
                  See our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> for full details.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">7. Intellectual Property</h2>
                <p className="mb-4">Please respect intellectual property:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Our Content:</strong> LodgeTix platform and content are owned by {COMPANY_INFO.legalName}</li>
                  <li><strong>Masonic Symbols:</strong> Used with appropriate authorization</li>
                  <li><strong>Your Content:</strong> You keep ownership but give us permission to use for our services</li>
                  <li><strong>Restrictions:</strong> Don't copy, distribute, or misuse our content</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">8. Limitation of Liability</h2>
                <p className="mb-4">To protect our operations:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Service Limits:</strong> We provide services "as is" without guarantees</li>
                  <li><strong>Liability Cap:</strong> Our responsibility is limited to what you paid for the service</li>
                  <li><strong>Event Changes:</strong> We're not liable for costs if events change or are cancelled</li>
                  <li><strong>Third Parties:</strong> We're not responsible for venue or organiser actions</li>
                  <li><strong>Force Majeure:</strong> Not liable for circumstances beyond our control</li>
                </ul>
                <p className="mb-4 text-sm text-gray-600">
                  This doesn't affect your rights under Australian Consumer Law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">9. Modifications to Terms</h2>
                <p className="mb-4">We may update these terms by:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Posting new versions on our website with updated dates</li>
                  <li>Notifying you of significant changes via email</li>
                  <li>Your continued use means you accept the changes</li>
                  <li>Seeking additional consent where required by law</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">10. Governing Law</h2>
                <p className="mb-4">These terms are governed by:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Jurisdiction:</strong> Laws of New South Wales, Australia</li>
                  <li><strong>Disputes:</strong> Must be resolved in NSW courts</li>
                  <li><strong>Complaints:</strong> Contact us first to resolve issues</li>
                  <li><strong>Mediation:</strong> We prefer to resolve disputes through discussion</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">11. Contact Information</h2>
                <p className="mb-4">Questions about these terms? Contact us:</p>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p><strong>{COMPANY_INFO.legalName}</strong><br />
                  {COMPANY_INFO.address.street}<br />
                  {COMPANY_INFO.address.suburb} {COMPANY_INFO.address.state} {COMPANY_INFO.address.postcode}<br />
                  Email: {COMPANY_INFO.contact.email}<br />
                  Support: {COMPANY_INFO.contact.supportEmail}<br />
                  Phone: {COMPANY_INFO.contact.phone}</p>
                </div>
              </section>

              <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-8">
                <h3 className="font-medium mb-2">Important Notes</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• This is a simplified version of our terms and conditions</li>
                  <li>• The full detailed terms are available at <a href="/terms-of-service" className="text-blue-600 hover:underline">/terms-of-service</a></li>
                  <li>• We may update these terms - we'll notify you of changes</li>
                  <li>• These terms apply to all use of LodgeTix services</li>
                  <li>• By using our platform, you agree to these terms</li>
                </ul>
              </div>

              <div className="border-t pt-6 mt-8">
                <p className="text-sm text-gray-600">
                  These simplified terms and conditions were last updated on {FORMATTED_STRINGS.LAST_UPDATED}. 
                  They provide a user-friendly overview while maintaining full legal protection for both parties.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}