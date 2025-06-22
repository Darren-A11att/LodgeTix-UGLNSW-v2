import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheckIcon, UserIcon, PhoneIcon } from '@heroicons/react/20/solid'
import { COMPANY_INFO, FORMATTED_STRINGS } from '@/lib/constants/company-details'

const supportCards = [
  {
    name: 'Simple & Clear',
    description: 'Easy to understand privacy practices for our Masonic community.',
    icon: UserIcon,
  },
  {
    name: 'Your Privacy',
    description: 'We protect your personal information and respect your privacy rights.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Questions?',
    description: 'Contact us anytime about privacy concerns or questions.',
    icon: PhoneIcon,
  },
]

export default function SimplifiedPrivacyPage() {
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
            <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">Simple Privacy Policy</h2>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
              A straightforward explanation of how we collect, use, and protect your personal information 
              when you use LodgeTix for Masonic events.
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
              <CardTitle className="text-3xl">Simple Privacy Policy</CardTitle>
              <CardDescription className="text-base">
                LodgeTix Platform - Operated by {COMPANY_INFO.legalName}<br />
                Last updated: {FORMATTED_STRINGS.LAST_UPDATED}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <h3 className="text-lg font-medium mb-2 text-blue-800">Quick Summary</h3>
                <p className="text-blue-700">
                  We collect your information when you register for Masonic events, use it to provide our services, 
                  share it only when necessary (like with event organisers), and protect it with strong security measures. 
                  You can access, correct, or delete your information anytime.
                </p>
              </div>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
                <p className="mb-4">
                  We collect information you give us when you register for events or use our platform:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Basic Details:</strong> Your name, email, phone number, and address</li>
                  <li><strong>Masonic Information:</strong> Your lodge, membership details, and any offices you hold</li>
                  <li><strong>Event Needs:</strong> Dietary requirements, accessibility needs, emergency contacts</li>
                  <li><strong>Payment Information:</strong> Billing details (securely processed by Stripe)</li>
                  <li><strong>Technical Data:</strong> Your device and browser information when you visit our website</li>
                </ul>
                <p className="mb-4 text-sm text-gray-600">
                  We only collect information that's necessary to provide our services or required by law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
                <p className="mb-4">We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Process Registrations:</strong> Handle your event bookings and ticket purchases</li>
                  <li><strong>Manage Events:</strong> Coordinate catering, seating, and special requirements</li>
                  <li><strong>Communicate:</strong> Send confirmation emails, event updates, and support responses</li>
                  <li><strong>Improve Services:</strong> Make our platform better based on how it's used</li>
                  <li><strong>Legal Compliance:</strong> Meet our legal obligations and prevent fraud</li>
                  <li><strong>Marketing (with your permission):</strong> Let you know about future events you might enjoy</li>
                </ul>
                <p className="mb-4 text-sm text-gray-600">
                  We'll always ask for your permission before sending marketing emails, and you can unsubscribe anytime.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. Information Sharing</h2>
                <p className="mb-4">We share your information with:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Event Organisers:</strong> Lodge officers who need your details to run the events you register for</li>
                  <li><strong>Service Providers:</strong> Companies that help us run our platform (like Stripe for payments, Supabase for data storage)</li>
                  <li><strong>Legal Requirements:</strong> Government agencies if required by law</li>
                  <li><strong>Emergency Situations:</strong> Your emergency contacts if needed during events</li>
                </ul>
                <p className="mb-4 text-sm text-gray-600">
                  We never sell your information to anyone. All our service providers are contractually required to protect your data.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
                <p className="mb-4">We protect your information with:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Encryption:</strong> All data is encrypted when stored and transmitted</li>
                  <li><strong>Access Controls:</strong> Only authorized staff can access your information</li>
                  <li><strong>Secure Infrastructure:</strong> We use professional hosting services with security monitoring</li>
                  <li><strong>Regular Updates:</strong> We keep our security measures current</li>
                  <li><strong>Incident Response:</strong> We have plans to handle any security issues quickly</li>
                </ul>
                <p className="mb-4 text-sm text-gray-600">
                  We keep your information for as long as needed to provide services and comply with legal requirements 
                  (typically 7 years for financial records).
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Your Rights</h2>
                <p className="mb-4">Under Australian privacy law, you can:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Access:</strong> See what information we have about you</li>
                  <li><strong>Correct:</strong> Fix any incorrect information</li>
                  <li><strong>Delete:</strong> Ask us to remove your information (where legally possible)</li>
                  <li><strong>Export:</strong> Get a copy of your information in a standard format</li>
                  <li><strong>Unsubscribe:</strong> Stop receiving marketing emails anytime</li>
                  <li><strong>Complain:</strong> Raise concerns about how we handle your information</li>
                </ul>
                <p className="mb-4">
                  To exercise these rights, simply contact us using the details below. We'll respond within 30 days.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">6. Contact Us</h2>
                <p className="mb-4">If you have questions about privacy or want to exercise your rights:</p>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p><strong>{COMPANY_INFO.legalName}</strong><br />
                  {COMPANY_INFO.address.street}<br />
                  {COMPANY_INFO.address.suburb} {COMPANY_INFO.address.state} {COMPANY_INFO.address.postcode}<br />
                  Email: {COMPANY_INFO.contact.email}<br />
                  Phone: {COMPANY_INFO.contact.phone}</p>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  If you're not satisfied with our response, you can also contact the Office of the Australian 
                  Information Commissioner at www.oaic.gov.au or phone 1300 363 992.
                </p>
              </section>

              <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-8">
                <h3 className="font-medium mb-2">Important Notes</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• This is a simplified version of our privacy policy</li>
                  <li>• The full detailed privacy policy is available at <a href="/privacy-policy" className="text-blue-600 hover:underline">/privacy-policy</a></li>
                  <li>• We may update this policy - we'll notify you of significant changes</li>
                  <li>• This policy applies to all personal information we collect through LodgeTix</li>
                  <li>• We comply with Australian privacy laws and the Privacy Act 1988</li>
                </ul>
              </div>

              <div className="border-t pt-6 mt-8">
                <p className="text-sm text-gray-600">
                  This simplified privacy policy was last updated on {FORMATTED_STRINGS.LAST_UPDATED}. 
                  It provides a user-friendly overview of our privacy practices while maintaining full legal compliance.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}