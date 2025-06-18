import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Calendar, CreditCard, Mail, Clock, Heart, Users, Shield, Phone, MapPin } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LifebuoyIcon, NewspaperIcon, PhoneIcon, ClockIcon, UserGroupIcon, HeartIcon, ShieldCheckIcon } from '@heroicons/react/20/solid'

const supportCards = [
  {
    name: 'Platform vs Organiser Responsibility',
    description: 'Clear 3-business-day boundary determining who processes your refund request.',
    icon: UserGroupIcon,
  },
  {
    name: 'Masonic Considerations',
    description: 'Special provisions for Masonic family emergencies and lodge protocol requirements.',
    icon: HeartIcon,
  },
  {
    name: 'Processing & Support',
    description: 'Clear timeframes and dedicated support for all refund requests and enquiries.',
    icon: ShieldCheckIcon,
  },
]

export default function RefundPolicyPage() {
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
            <h2 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">Refund Policy</h2>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
              Clear and transparent refund policies with defined responsibility periods. LodgeTix handles refunds within 
              3 business days of purchase, after which event organisers take responsibility through our platform tools.
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
          <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
          
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> LodgeTix is only responsible for processing refunds within 3 business days of purchase. 
              After this period, all refund requests must be directed to the event organiser. Please read this policy carefully 
              before purchasing tickets.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-8">
            {/* Responsibility Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Platform vs Event Organiser Responsibility
                </CardTitle>
                <CardDescription>
                  Who processes your refund depends on when you make your request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 py-3 rounded-r">
                    <h4 className="font-semibold text-blue-800">Within 3 Business Days of Purchase</h4>
                    <p className="text-blue-700 mb-2"><strong>LodgeTix Responsibility Period</strong></p>
                    <ul className="text-blue-700 space-y-1 ml-4">
                      <li>• LodgeTix processes all refund requests directly</li>
                      <li>• Full refunds available (subject to payment processing fees)</li>
                      <li>• Customer service handled by LodgeTix support team</li>
                      <li>• Standard processing: 3-5 business days</li>
                    </ul>
                  </div>
                  
                  <div className="border-l-4 border-amber-500 pl-4 bg-amber-50 py-3 rounded-r">
                    <h4 className="font-semibold text-amber-800">After 3 Business Days of Purchase</h4>
                    <p className="text-amber-700 mb-2"><strong>Event Organiser Responsibility Period</strong></p>
                    <ul className="text-amber-700 space-y-1 ml-4">
                      <li>• Contact the event organiser directly for refund requests</li>
                      <li>• Organisers process refunds through the LodgeTix portal</li>
                      <li>• Refund policies determined by the event organiser</li>
                      <li>• Processing timeframes set by event organiser</li>
                      <li>• LodgeTix provides dispute resolution if needed</li>
                    </ul>
                  </div>
                  
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Business days</strong> are Monday to Friday, excluding public holidays. The 3-day period begins 
                      from the date your payment is confirmed, not the booking date.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* How to Request Refunds */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  How to Request Refunds
                </CardTitle>
                <CardDescription>
                  Different processes depending on your purchase date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Within 3 Business Days - Contact LodgeTix</h4>
                    <p className="text-blue-700 mb-3">For purchases made within the last 3 business days:</p>
                    <div className="bg-white p-4 rounded border">
                      <ol className="list-decimal list-inside space-y-2 text-blue-700">
                        <li><strong>Email:</strong> Send request to <a href="mailto:support@lodgetix.io" className="text-blue-600 hover:underline">support@lodgetix.io</a></li>
                        <li><strong>Include:</strong> Booking reference, event name, registration date, and reason</li>
                        <li><strong>Phone:</strong> For urgent requests call <a href="tel:+61292842800" className="text-blue-600 hover:underline">(02) 9284 2800</a></li>
                        <li><strong>Response:</strong> Confirmation within 1 business day</li>
                        <li><strong>Processing:</strong> Refund processed within 3-5 business days</li>
                      </ol>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-2">After 3 Business Days - Contact Event Organiser</h4>
                    <p className="text-amber-700 mb-3">For purchases made more than 3 business days ago:</p>
                    <div className="bg-white p-4 rounded border">
                      <ol className="list-decimal list-inside space-y-2 text-amber-700">
                        <li><strong>Contact:</strong> Reach out to the event organiser directly (details in your booking confirmation)</li>
                        <li><strong>Request:</strong> Submit refund request according to their specific policy</li>
                        <li><strong>Processing:</strong> Organiser processes through LodgeTix refund portal</li>
                        <li><strong>Timeline:</strong> Processing time determined by event organiser</li>
                        <li><strong>Support:</strong> LodgeTix provides dispute resolution if needed</li>
                      </ol>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> Event organisers set their own refund policies and timeframes after the 3-day period. 
                      These may vary based on event type, catering commitments, and venue requirements.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Event Organiser Refund Processing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Event Organiser Refund Processing
                </CardTitle>
                <CardDescription>
                  How event organisers handle refunds through LodgeTix
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">Organiser Portal Capabilities</h4>
                    <ul className="list-disc list-inside space-y-2 text-green-700">
                      <li>Process full or partial refunds for their events</li>
                      <li>Set event-specific refund policies and deadlines</li>
                      <li>Access attendee payment information securely</li>
                      <li>Track refund history and financial reporting</li>
                      <li>Communicate directly with attendees about refund status</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-3">Insufficient Funds Procedure</h4>
                    <p className="text-yellow-700 mb-2">If an event organiser lacks sufficient funds in their account:</p>
                    <ul className="list-disc list-inside space-y-2 text-yellow-700">
                      <li>LodgeTix notifies the organiser of insufficient balance</li>
                      <li>Organiser must deposit funds before refund processing</li>
                      <li>Attendees are notified of processing delays</li>
                      <li>LodgeTix may advance funds in exceptional circumstances</li>
                      <li>Dispute resolution process activated if funds not provided within 10 business days</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">Processing Standards</h4>
                    <ul className="list-disc list-inside space-y-2 text-blue-700">
                      <li><strong>Response Time:</strong> Organisers should respond to refund requests within 5 business days</li>
                      <li><strong>Processing Time:</strong> Approved refunds processed within 7 business days</li>
                      <li><strong>Communication:</strong> Attendees notified at each stage of the process</li>
                      <li><strong>Documentation:</strong> All refund decisions must include clear reasoning</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Dispute Resolution Process */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Dispute Resolution Process
                </CardTitle>
                <CardDescription>
                  What happens when refund requests are disputed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">When Disputes Arise</h4>
                  <p className="text-blue-700 mb-2">
                    LodgeTix provides dispute resolution when:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-blue-700">
                    <li>Event organisers don't respond to refund requests within 10 business days</li>
                    <li>Organisers deny refunds unreasonably</li>
                    <li>Insufficient funds prevent refund processing</li>
                    <li>Event cancellations or major changes by organisers</li>
                    <li>Disagreements about refund amounts or eligibility</li>
                  </ul>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-3">Resolution Process</h4>
                  <ol className="list-decimal list-inside space-y-2 text-amber-700">
                    <li><strong>Escalation:</strong> Contact LodgeTix support with dispute details</li>
                    <li><strong>Review:</strong> LodgeTix reviews the case and contacts both parties</li>
                    <li><strong>Mediation:</strong> Attempt to mediate a fair resolution</li>
                    <li><strong>Decision:</strong> LodgeTix makes final decision if mediation fails</li>
                    <li><strong>Enforcement:</strong> LodgeTix may process refunds directly if justified</li>
                  </ol>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    LodgeTix reserves the right to suspend or terminate event organisers who consistently 
                    fail to honor reasonable refund requests or maintain sufficient funds for refund processing.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            {/* Refund Processing Methods and Timeframes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Processing Methods and Timeframes
                </CardTitle>
                <CardDescription>
                  How refunds are processed and when you can expect them
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">LodgeTix Processing (Within 3 Days)</h4>
                  <ul className="list-disc list-inside space-y-2 text-blue-700">
                    <li><strong>Approval:</strong> Within 1 business day of request</li>
                    <li><strong>Processing:</strong> 3-5 business days after approval</li>
                    <li><strong>Bank processing:</strong> Additional 3-7 business days for funds to appear</li>
                    <li><strong>Notifications:</strong> Email confirmation at each stage</li>
                  </ul>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-3">Event Organiser Processing (After 3 Days)</h4>
                  <ul className="list-disc list-inside space-y-2 text-amber-700">
                    <li><strong>Response:</strong> Organisers should respond within 5 business days</li>
                    <li><strong>Processing:</strong> 7-10 business days after approval</li>
                    <li><strong>Bank processing:</strong> Additional 3-7 business days for funds to appear</li>
                    <li><strong>Delays:</strong> May occur if organiser has insufficient funds</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">Refund Methods</h4>
                  <ul className="list-disc list-inside space-y-2 text-green-700">
                    <li><strong>Credit/debit cards:</strong> Refunded to original payment method</li>
                    <li><strong>Bank transfers:</strong> Processed to original account</li>
                    <li><strong>Digital wallets:</strong> PayPal, Apple Pay returned to source</li>
                    <li><strong>Cash payments:</strong> Bank transfer or cheque (if applicable)</li>
                  </ul>
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Payment processing fees may be deducted from refunds to cover payment processing costs, 
                    except where prohibited by law or in cases of event cancellation.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            {/* Special Circumstances and Event-Specific Policies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Special Circumstances & Event-Specific Policies
                </CardTitle>
                <CardDescription>
                  Compassionate considerations and event-type specific policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">Masonic Family Emergencies</h4>
                    <p className="text-red-700 mb-2">
                      Special consideration may be given for genuine emergencies, regardless of the 3-day boundary:
                    </p>
                    <ul className="text-red-700 space-y-1 ml-4">
                      <li>• Serious illness or hospitalisation of immediate family members</li>
                      <li>• Bereavement in the Masonic family</li>
                      <li>• Emergency lodge duties or Masonic obligations</li>
                      <li>• Military deployment or emergency service duties</li>
                    </ul>
                    <p className="text-red-700 mt-2 text-sm">
                      <strong>Note:</strong> Documentation may be required. Both LodgeTix and event organisers are encouraged to show compassion in these circumstances.
                    </p>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-2">Medical Emergencies</h4>
                    <p className="text-amber-700 mb-2">
                      Medical emergencies may warrant consideration outside standard policies:
                    </p>
                    <ul className="text-amber-700 space-y-1 ml-4">
                      <li>• Sudden illness preventing attendance</li>
                      <li>• Emergency medical procedures</li>
                      <li>• Doctor-recommended quarantine or isolation</li>
                      <li>• Travel restrictions due to medical conditions</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Event Changes by Organisers</h4>
                    <ul className="text-blue-700 space-y-2">
                      <li><strong>Event Cancellation:</strong> 100% refund including all fees, processed by LodgeTix within 5 business days</li>
                      <li><strong>Event Postponement:</strong> Full refund available, or tickets valid for new date</li>
                      <li><strong>Venue Changes:</strong> Refund available if new venue is significantly less accessible</li>
                      <li><strong>Major Program Changes:</strong> Partial refunds may be considered for substantial alterations</li>
                      <li><strong>Date Changes:</strong> Full refund available if new date creates conflict</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Event-Specific Considerations</h4>
                    <p className="text-green-700 mb-2">
                      Event organisers typically consider these factors when setting their refund policies:
                    </p>
                    <ul className="text-green-700 space-y-1 ml-4">
                      <li>• <strong>Catered Events:</strong> Higher restrictions due to catering commitments</li>
                      <li>• <strong>Ceremonial Events:</strong> May have stricter policies due to preparation requirements</li>
                      <li>• <strong>Educational Events:</strong> Often more flexible refund policies</li>
                      <li>• <strong>Accommodation Packages:</strong> Subject to hotel cancellation policies</li>
                      <li>• <strong>Limited Capacity Events:</strong> May have waiting lists for transfers</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">Transfer Options</h4>
                    <p className="text-purple-700 mb-2">
                      Alternative to refunds - transfer your registration:
                    </p>
                    <ul className="text-purple-700 space-y-1 ml-4">
                      <li>• <strong>Within 3 days:</strong> Contact LodgeTix for transfers ($5 processing fee)</li>
                      <li>• <strong>After 3 days:</strong> Contact event organiser for transfer options</li>
                      <li>• <strong>Name changes:</strong> Usually permitted up to 48 hours before event</li>
                      <li>• <strong>Future events:</strong> Subject to availability and organiser approval</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Refund Exclusions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Refund Exclusions
                </CardTitle>
                <CardDescription>
                  Circumstances where refunds are generally not available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  The following circumstances are typically not eligible for refunds, regardless of timing:
                </p>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <ul className="list-disc list-inside space-y-2 text-red-700">
                    <li><strong>No-shows:</strong> Failure to attend without prior cancellation request</li>
                    <li><strong>Entry requirements:</strong> Failure to meet dress code, membership requirements, or entry conditions</li>
                    <li><strong>Inappropriate behaviour:</strong> Denial of entry or removal due to conduct issues</li>
                    <li><strong>Personal preference changes:</strong> Change of mind, work commitments, or travel issues (except emergencies)</li>
                    <li><strong>Technical issues:</strong> Personal device or internet problems preventing online access</li>
                    <li><strong>Duplicate bookings:</strong> Multiple registrations for the same person/event</li>
                    <li><strong>Misreading event details:</strong> Date, time, venue, or program misunderstandings</li>
                  </ul>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
                  <h4 className="font-semibold text-amber-800 mb-2">Event Organiser Discretion</h4>
                  <p className="text-amber-700">
                    After the 3-day LodgeTix responsibility period, event organisers have discretion to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700 mt-2">
                    <li>Set their own exclusion criteria</li>
                    <li>Make exceptions for special circumstances</li>
                    <li>Determine what constitutes reasonable cause for refunds</li>
                  </ul>
                </div>

                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    LodgeTix reserves the right to make exceptions to these exclusions in cases of genuine emergency, 
                    event organiser misconduct, or when required by law.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  How to get support for refund requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">LodgeTix Support (Within 3 Days)</h4>
                      <div className="space-y-2 text-blue-700">
                        <p><strong>Email:</strong> <a href="mailto:support@lodgetix.io" className="text-blue-600 hover:underline">support@lodgetix.io</a></p>
                        <p><strong>Phone:</strong> <a href="tel:+61292842800" className="text-blue-600 hover:underline">(02) 9284 2800</a></p>
                        <p><strong>Hours:</strong> Monday to Friday, 9:00 AM - 5:00 PM AEST</p>
                        <p><strong>Response:</strong> Within 1 business day</p>
                      </div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded border border-amber-200">
                      <h4 className="font-semibold text-amber-800 mb-2">Event Organiser (After 3 Days)</h4>
                      <div className="space-y-2 text-amber-700">
                        <p><strong>Contact:</strong> Details in your booking confirmation email</p>
                        <p><strong>Support:</strong> LodgeTix dispute resolution available</p>
                        <p><strong>Email:</strong> <a href="mailto:support@lodgetix.io" className="text-blue-600 hover:underline">support@lodgetix.io</a> for disputes</p>
                        <p><strong>Response:</strong> Varies by event organiser</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Business Details</h4>
                    <div className="grid md:grid-cols-3 gap-4 text-gray-600">
                      <div>
                        <p><strong>Entity:</strong> Winding Stair Pty. Limited</p>
                        <p><strong>Location:</strong> Sydney, NSW, Australia</p>
                      </div>
                      <div>
                        <p><strong>Platform:</strong> LodgeTix.io</p>
                        <p><strong>Service:</strong> Event ticketing and registration</p>
                      </div>
                      <div>
                        <p><strong>Specialisation:</strong> Masonic events and functions</p>
                        <p><strong>Market:</strong> United Grand Lodge of NSW & ACT</p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Urgent requests:</strong> For refund requests needed within 24 hours, please call during 
                      business hours. Email processing may not be fast enough for same-day requirements.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
            
            {/* Final Notes */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Policy Administration:</strong> This refund policy is administered by Winding Stair Pty. Limited 
                and may be updated from time to time. The policy in effect at the time of your purchase will apply to 
                your transaction. LodgeTix reserves the right to make exceptions at our discretion, particularly for 
                exceptional circumstances affecting the Masonic community or where required by Australian Consumer Law.
              </AlertDescription>
            </Alert>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Key Takeaways</h3>
              <ul className="space-y-1 text-blue-800">
                <li>• <strong>3-day boundary:</strong> LodgeTix handles refunds within 3 business days of purchase</li>
                <li>• <strong>After 3 days:</strong> Contact event organisers directly for refund requests</li>
                <li>• <strong>Special circumstances:</strong> Medical/Masonic emergencies may receive special consideration</li>
                <li>• <strong>Event cancellations:</strong> 100% refunds processed by LodgeTix regardless of timing</li>
                <li>• <strong>Dispute resolution:</strong> LodgeTix provides mediation when needed</li>
                <li>• <strong>Processing fees:</strong> May apply to cover payment processing costs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}