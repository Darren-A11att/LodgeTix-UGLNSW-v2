import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  UserIcon, 
  CreditCardIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PhoneIcon,
  CalendarIcon,
  HeartIcon
} from '@heroicons/react/20/solid'
import { COMPANY_INFO, DateFormatters, CompanyFormatters } from '@/lib/constants/company-details'

const supportCards = [
  {
    name: 'Your Rights',
    description: 'Clear information about your consumer rights under Australian law and platform policies.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Simple Refunds',
    description: 'Easy-to-understand refund policies with clear timeframes and fair treatment.',
    icon: CreditCardIcon,
  },
  {
    name: 'Event Support',
    description: 'Dedicated support for event questions, registration help, and Masonic protocols.',
    icon: UserIcon,
  },
]

export default function EventAttendeeTermsPage() {
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
            <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">Event Attendee Terms</h2>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
              Clear, consumer-friendly terms specifically for event attendees. Your rights, our responsibilities, 
              and everything you need to know about registering for and attending Masonic events.
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
              <CardTitle className="text-3xl">Terms of Service for Event Attendees</CardTitle>
              <CardDescription className="text-base">
                {COMPANY_INFO.legalName} - {COMPANY_INFO.tradingName} Platform<br />
                ABN: {COMPANY_INFO.abn}<br />
                Last updated: {DateFormatters.getLastUpdatedDate()}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              
              <Alert className="mb-8">
                <InformationCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Consumer-Focused Terms:</strong> These terms are written specifically for individual event attendees 
                  and focus on your rights as a consumer under Australian law. For complete legal terms, see our 
                  <a href="/terms-of-service" className="text-blue-600 hover:underline ml-1">full Terms of Service</a>.
                </AlertDescription>
              </Alert>

              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Welcome to LodgeTix</h2>
                <p className="mb-4">
                  These terms explain your rights and responsibilities when you register for and attend events through 
                  the LodgeTix platform. We've written them in plain English to help you understand exactly what 
                  you're agreeing to when you book a ticket.
                </p>
                <p className="mb-4">
                  As an Australian company, we're committed to treating you fairly and upholding your rights as a consumer. 
                  These terms complement (and never reduce) your rights under Australian Consumer Law.
                </p>
              </section>

              {/* Registration and Ticketing */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  1. Registration and Ticketing
                </h2>
                
                <h3 className="text-lg font-medium mb-3">1.1 Account Creation and Management</h3>
                <p className="mb-4">To register for events, you need to create an account. Here's what we require:</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Age and Eligibility</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>You must be at least 18 years old to create an account and make purchases</li>
                    <li>If you're under 18, a parent or guardian must register on your behalf</li>
                    <li>You must have the legal right to enter into agreements under Australian law</li>
                    <li>For Masonic events, you may need to provide proof of membership or eligibility</li>
                  </ul>
                </div>

                <h4 className="font-semibold mb-2">Account Information</h4>
                <p className="mb-4">You agree to:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Provide accurate and complete information when creating your account</li>
                  <li>Keep your account information up to date, especially contact details and Masonic affiliations</li>
                  <li>Keep your login details secure and not share them with others</li>
                  <li>Tell us immediately if someone else uses your account without permission</li>
                </ul>

                <h4 className="font-semibold mb-2">Masonic Profile Details</h4>
                <p className="mb-4">For Masonic events, we may collect:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Your Lodge name and membership number</li>
                  <li>Grand Lodge affiliation and current membership status</li>
                  <li>Masonic rank and offices held (if relevant to the event)</li>
                  <li>Dietary requirements and accessibility needs</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">1.2 Event Registration Process</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2">How Registration Works</h4>
                  <ol className="list-decimal list-inside space-y-2 text-green-700">
                    <li><strong>Browse Events:</strong> Find events that interest you on our platform</li>
                    <li><strong>Check Eligibility:</strong> Make sure you meet any specific requirements</li>
                    <li><strong>Select Options:</strong> Choose your ticket type, meals, or other preferences</li>
                    <li><strong>Provide Details:</strong> Complete the registration form with accurate information</li>
                    <li><strong>Review and Pay:</strong> Check everything is correct and complete payment</li>
                    <li><strong>Confirmation:</strong> You'll receive an email confirmation with your ticket details</li>
                  </ol>
                </div>

                <h4 className="font-semibold mb-2">Booking Confirmations</h4>
                <p className="mb-4">Your registration is only confirmed when:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Your payment is successfully processed</li>
                  <li>You receive an email confirmation from us</li>
                  <li>Any required approvals (for Masonic events) are obtained</li>
                  <li>Your ticket appears in your account dashboard</li>
                </ul>

                <h4 className="font-semibold mb-2">Ticket Delivery and Management</h4>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Digital tickets are delivered via email and stored in your account</li>
                  <li>You can download or print your tickets from your account</li>
                  <li>Lost tickets can be resent through your account or by contacting support</li>
                  <li>Some events may provide physical tickets at the venue</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">1.3 Transfer and Modification Policies</h3>
                <p className="mb-4">Sometimes plans change. Here are your options:</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-amber-800 mb-2">Transferring Your Registration</h4>
                  <ul className="list-disc list-inside space-y-2 text-amber-700">
                    <li>You can transfer your registration to another eligible person up to 48 hours before the event</li>
                    <li>The new attendee must meet all eligibility requirements (especially for Masonic events)</li>
                    <li>A $10 transfer fee applies to cover administrative costs</li>
                    <li>Contact our support team to arrange transfers</li>
                  </ul>
                </div>

                <h4 className="font-semibold mb-2">Modifying Your Registration</h4>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>You can usually modify meal preferences, accessibility needs, or contact details</li>
                  <li>Significant changes (like ticket type) may require cancellation and re-booking</li>
                  <li>Changes are subject to availability and may incur additional fees</li>
                  <li>Some changes aren't possible within 48 hours of the event due to catering commitments</li>
                </ul>
              </section>

              {/* Refund and Cancellation Rights */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  2. Refund and Cancellation Rights
                </h2>
                
                <Alert className="mb-6">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Our refund policy includes a special 3-day period where LodgeTix takes 
                    responsibility for providing refunds. After this period, refunds are managed by the event organiser.
                  </AlertDescription>
                </Alert>

                <h3 className="text-lg font-medium mb-3">2.1 The 3-Day LodgeTix Responsibility Period</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">What This Means for You</h4>
                  <p className="text-blue-700 mb-3">
                    For the first 3 days after you register (72 hours from payment confirmation), LodgeTix directly 
                    handles all refund requests. This gives you extra protection and faster processing.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li><strong>Within 72 hours:</strong> Contact LodgeTix directly for any refund requests</li>
                    <li><strong>Fast processing:</strong> Refunds processed within 1-2 business days</li>
                    <li><strong>Full refund available:</strong> 100% refund minus any payment processing fees</li>
                    <li><strong>No questions asked:</strong> Standard refund policy doesn't apply during this period</li>
                  </ul>
                </div>

                <h3 className="text-lg font-medium mb-3">2.2 After the 3-Day Period</h3>
                <p className="mb-4">
                  After 72 hours, refund requests are handled by the event organiser according to their refund policy 
                  and the standard timeframes below. LodgeTix will assist in processing these refunds.
                </p>

                <h4 className="font-semibold mb-2">Standard Refund Timeframes</h4>
                <div className="space-y-3 mb-4">
                  <div className="border-l-4 border-green-500 pl-4 bg-green-50 py-3 rounded-r">
                    <h5 className="font-semibold text-green-800">More than 30 days before event</h5>
                    <p className="text-green-700">Full refund minus $15 processing fee</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 py-3 rounded-r">
                    <h5 className="font-semibold text-blue-800">14-30 days before event</h5>
                    <p className="text-blue-700">80% refund of registration price</p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 py-3 rounded-r">
                    <h5 className="font-semibold text-yellow-800">7-14 days before event</h5>
                    <p className="text-yellow-700">60% refund of registration price</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4 bg-red-50 py-3 rounded-r">
                    <h5 className="font-semibold text-red-800">Less than 7 days before event</h5>
                    <p className="text-red-700">25% refund of registration price</p>
                  </div>
                </div>

                <h3 className="text-lg font-medium mb-3">2.3 How to Request Refunds</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">During the 3-Day Period</h4>
                  <p className="text-gray-700 mb-2">Contact LodgeTix directly:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Email: <a href="mailto:support@lodgetix.io" className="text-blue-600 hover:underline">support@lodgetix.io</a></li>
                    <li>Phone: <a href="tel:0408925926" className="text-blue-600 hover:underline">0408 925 926</a></li>
                    <li>Include your booking reference number</li>
                    <li>We'll respond within 24 hours</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">After the 3-Day Period</h4>
                  <p className="text-gray-700 mb-2">You can contact either:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>LodgeTix support (we'll coordinate with the event organiser)</li>
                    <li>The event organiser directly (contact details in your confirmation email)</li>
                    <li>We'll work together to process your refund according to the applicable policy</li>
                  </ul>
                </div>

                <h3 className="text-lg font-medium mb-3">2.4 Special Circumstances</h3>
                <p className="mb-4">We understand that sometimes exceptional circumstances arise:</p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-purple-800 mb-2">Compassionate Refunds</h4>
                  <p className="text-purple-700 mb-2">We may provide refunds outside standard policy for:</p>
                  <ul className="list-disc list-inside space-y-1 text-purple-700">
                    <li>Serious illness or injury (medical certificate may be required)</li>
                    <li>Death in the family or Masonic family</li>
                    <li>Military deployment or emergency service duties</li>
                    <li>Other exceptional circumstances affecting Masonic members</li>
                  </ul>
                </div>
              </section>

              {/* Event Attendance */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  3. Event Attendance
                </h2>
                
                <h3 className="text-lg font-medium mb-3">3.1 Ticket Presentation Requirements</h3>
                <p className="mb-4">When you arrive at an event, you'll need to present:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Your ticket (digital on your phone or printed copy)</li>
                  <li>Photo identification (driver's license, passport, or similar)</li>
                  <li>For Masonic events: proof of membership and current dues receipt</li>
                  <li>Any specific documentation mentioned in your booking confirmation</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">3.2 Masonic Event Attendance Protocols</h3>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-indigo-800 mb-2">What You Need to Know</h4>
                  <ul className="list-disc list-inside space-y-2 text-indigo-700">
                    <li>Arrive at least 15 minutes before the event start time</li>
                    <li>Be prepared to present your Grand Lodge membership card</li>
                    <li>Visitors may need to be vouched for by a member of the hosting Lodge</li>
                    <li>Follow all protocols and directions from Lodge officers</li>
                    <li>Respect the solemnity of ceremonial events</li>
                  </ul>
                </div>

                <h3 className="text-lg font-medium mb-3">3.3 Guest and Visitor Policies</h3>
                <p className="mb-4">Different events have different rules for guests:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Ceremonial events:</strong> Usually restricted to Masons in good standing</li>
                  <li><strong>Social functions:</strong> Often welcome partners and family members</li>
                  <li><strong>Educational events:</strong> May be open to the public or Masonic family</li>
                  <li><strong>Installation dinners:</strong> Check your invitation for guest policies</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">3.4 Dress Code and Conduct Expectations</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-amber-800 mb-2">General Guidelines</h4>
                  <ul className="list-disc list-inside space-y-2 text-amber-700">
                    <li>Dress appropriately for the occasion (formal, semi-formal, or business attire as specified)</li>
                    <li>For ceremonial events, dark suits and appropriate regalia are usually required</li>
                    <li>Maintain respectful and dignified behavior throughout the event</li>
                    <li>Follow any specific instructions provided by the hosting Lodge</li>
                    <li>Be considerate of other attendees and respect Masonic traditions</li>
                  </ul>
                </div>
              </section>

              {/* Consumer Rights and Protections */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5" />
                  4. Your Consumer Rights and Protections
                </h2>
                
                <Alert className="mb-6">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Australian Consumer Law Protection:</strong> As an Australian consumer, you have rights 
                    that cannot be excluded or limited. These terms enhance (never reduce) your legal rights.
                  </AlertDescription>
                </Alert>

                <h3 className="text-lg font-medium mb-3">4.1 Australian Consumer Law Rights</h3>
                <p className="mb-4">Under Australian Consumer Law, you have guaranteed rights including:</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Consumer Guarantees</h4>
                  <ul className="list-disc list-inside space-y-2 text-blue-700">
                    <li>Services must be provided with due care and skill</li>
                    <li>Services must be fit for the purpose you told us about</li>
                    <li>Services must be provided within a reasonable time</li>
                    <li>You have the right to refunds or compensation for major failures</li>
                    <li>You're protected against misleading or deceptive conduct</li>
                  </ul>
                </div>

                <h4 className="font-semibold mb-2">What This Means for Event Registration</h4>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>We must accurately describe events, venues, and what's included</li>
                  <li>Events must be delivered as promised</li>
                  <li>If there's a major problem with an event, you may be entitled to a full refund</li>
                  <li>Our payment processing must be secure and reliable</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">4.2 Unfair Contract Protections</h3>
                <p className="mb-4">Australian law protects you from unfair contract terms. We've designed our terms to be fair, but if any term is found to be unfair:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>The unfair term won't apply to you</li>
                  <li>The rest of these terms will still be valid</li>
                  <li>We'll work with you to resolve any issues fairly</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">4.3 Privacy and Data Protection</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2">How We Use Your Information</h4>
                  <ul className="list-disc list-inside space-y-2 text-green-700">
                    <li>We only collect information necessary for event registration and management</li>
                    <li>Your Masonic details are shared only with relevant event organisers</li>
                    <li>We comply with Australian Privacy Principles</li>
                    <li>You can access and correct your personal information at any time</li>
                    <li>We never sell your personal information to third parties</li>
                  </ul>
                </div>

                <h4 className="font-semibold mb-2">Your Privacy Rights</h4>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Right to know what information we hold about you</li>
                  <li>Right to correct inaccurate information</li>
                  <li>Right to withdraw consent for marketing communications</li>
                  <li>Right to complain to the Privacy Commissioner if you're not satisfied</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">4.4 Data Sharing with Event Organisers</h3>
                <p className="mb-4">When you register for an event, we share necessary information with the organiser including:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Your name and contact details</li>
                  <li>Dietary requirements and accessibility needs</li>
                  <li>Masonic membership details (for verification purposes only)</li>
                  <li>Payment confirmation (but not payment details)</li>
                </ul>
              </section>

              {/* Dispute Resolution */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5" />
                  5. Dispute Resolution
                </h2>
                
                <p className="mb-4">
                  We're committed to resolving any issues quickly and fairly. If you have a concern, 
                  here's how we'll work together to fix it:
                </p>

                <h3 className="text-lg font-medium mb-3">5.1 Internal Complaint Process</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Step 1: Contact Us First</h4>
                  <p className="text-blue-700 mb-2">
                    Before taking any other action, please give us a chance to resolve your concern:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Email: <a href="mailto:support@lodgetix.io" className="text-blue-600 hover:underline">support@lodgetix.io</a></li>
                    <li>Phone: <a href="tel:0408925926" className="text-blue-600 hover:underline">0408 925 926</a></li>
                    <li>We'll acknowledge your complaint within 24 hours</li>
                    <li>We'll investigate and respond within 5 business days</li>
                  </ul>
                </div>

                <h4 className="font-semibold mb-2">What Information to Include</h4>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Your booking reference number</li>
                  <li>Description of the issue and how it affected you</li>
                  <li>What you'd like us to do to resolve it</li>
                  <li>Any relevant documentation or screenshots</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">5.2 External Dispute Resolution</h3>
                <p className="mb-4">If we can't resolve your complaint to your satisfaction, you have several options:</p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Consumer Protection Agencies</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>NSW Fair Trading:</strong> 13 32 20 or fairtrading.nsw.gov.au</li>
                    <li><strong>Australian Competition & Consumer Commission (ACCC):</strong> 1300 302 502</li>
                    <li><strong>Australian Financial Complaints Authority (AFCA):</strong> For payment-related issues</li>
                    <li><strong>Privacy Commissioner:</strong> For privacy-related complaints</li>
                  </ul>
                </div>

                <h3 className="text-lg font-medium mb-3">5.3 Masonic Dispute Resolution</h3>
                <p className="mb-4">
                  For issues related to Masonic protocols or Lodge events, we encourage fraternal resolution 
                  through appropriate channels:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Contact the hosting Lodge Secretary or Worshipful Master</li>
                  <li>Refer to your Grand Lodge's grievance procedures if appropriate</li>
                  <li>We'll cooperate with any official Masonic investigation or mediation</li>
                </ul>
              </section>

              {/* Attendee Responsibilities */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <HeartIcon className="h-5 w-5" />
                  6. Your Responsibilities as an Attendee
                </h2>
                
                <p className="mb-4">
                  While we work hard to provide great service, we also need your help to ensure 
                  events run smoothly for everyone.
                </p>

                <h3 className="text-lg font-medium mb-3">6.1 Providing Accurate Information</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-amber-800 mb-2">What We Need From You</h4>
                  <ul className="list-disc list-inside space-y-2 text-amber-700">
                    <li>Accurate personal details (name, address, phone, email)</li>
                    <li>Current Masonic membership information and dues status</li>
                    <li>Honest disclosure of dietary requirements and accessibility needs</li>
                    <li>Prompt updates if any information changes</li>
                    <li>Cooperation with verification processes</li>
                  </ul>
                </div>

                <h3 className="text-lg font-medium mb-3">6.2 Payment Obligations</h3>
                <p className="mb-4">When you register for an event, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Pay the full registration amount at the time of booking</li>
                  <li>Use only payment methods you're authorized to use</li>
                  <li>Not initiate chargebacks or disputes without contacting us first</li>
                  <li>Pay any additional fees (transfers, modifications) as they apply</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">6.3 Code of Conduct</h3>
                <p className="mb-4">We expect all attendees to:</p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-purple-800 mb-2">Masonic Values and Behaviour</h4>
                  <ul className="list-disc list-inside space-y-2 text-purple-700">
                    <li>Conduct yourself according to Masonic principles of Brotherly Love, Relief, and Truth</li>
                    <li>Treat all attendees, staff, and volunteers with respect and courtesy</li>
                    <li>Follow Lodge protocols and respect ceremonial proceedings</li>
                    <li>Dress appropriately according to the specified dress code</li>
                    <li>Respect the confidentiality of Masonic matters</li>
                    <li>Assist fellow Masons and attendees when appropriate</li>
                  </ul>
                </div>

                <h4 className="font-semibold mb-2">General Conduct Expectations</h4>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Arrive on time and be prepared for the event</li>
                  <li>Follow venue rules and local laws</li>
                  <li>Don't engage in harassment, discrimination, or inappropriate behavior</li>
                  <li>Respect other attendees' right to enjoy the event</li>
                  <li>Don't record or photograph ceremonial activities without permission</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">6.4 Consequences for Violations</h3>
                <p className="mb-4">If you don't meet these responsibilities:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>You may be refused entry or asked to leave the event</li>
                  <li>No refund will be provided for violations of conduct standards</li>
                  <li>Serious violations may result in permanent exclusion from future events</li>
                  <li>Masonic misconduct may be reported to appropriate Grand Lodge authorities</li>
                  <li>Criminal conduct will be reported to law enforcement</li>
                </ul>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
                <p className="mb-4">
                  We're here to help with any questions about these terms or your event registration.
                </p>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Contact LodgeTix</h3>
                      <div className="space-y-2 text-gray-600">
                        <p><strong>Support Email:</strong> <a href="mailto:support@lodgetix.io" className="text-blue-600 hover:underline">support@lodgetix.io</a></p>
                        <p><strong>Phone:</strong> <a href="tel:0408925926" className="text-blue-600 hover:underline">0408 925 926</a></p>
                        <p><strong>General Email:</strong> <a href="mailto:info@lodgetix.io" className="text-blue-600 hover:underline">info@lodgetix.io</a></p>
                        <p><strong>Hours:</strong> Monday to Friday, 9:00 AM - 5:00 PM AEST</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Business Details</h3>
                      <div className="space-y-2 text-gray-600">
                        <p><strong>Company:</strong> {COMPANY_INFO.legalName}</p>
                        <p><strong>Trading As:</strong> {COMPANY_INFO.tradingName}</p>
                        <p><strong>ABN:</strong> {COMPANY_INFO.abn}</p>
                        <p><strong>Address:</strong><br />
                        {COMPANY_INFO.address.street}<br />
                        {COMPANY_INFO.address.suburb} {COMPANY_INFO.address.state} {COMPANY_INFO.address.postcode}<br />
                        {COMPANY_INFO.address.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t pt-6 mt-8">
                <p className="text-sm text-gray-600">
                  These Event Attendee Terms were last updated on {DateFormatters.getLastUpdatedDate()} 
                  and are effective immediately. This document is designed to be read alongside our complete 
                  <a href="/terms-of-service" className="text-blue-600 hover:underline ml-1 mr-1">Terms of Service</a>
                  and <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  We're committed to treating you fairly and upholding your rights as an Australian consumer. 
                  These terms enhance (never reduce) your rights under Australian Consumer Law.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}