import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { COMPANY_INFO, DateFormatters } from '@/lib/constants/company-details'

/**
 * Comprehensive Payment Terms and Processing Agreement
 * 
 * This component contains the complete Payment Terms specifically covering all payment
 * processing options, fees, responsibilities, and legal frameworks for the LodgeTix platform.
 * 
 * Key sections covered:
 * - Payment Processing Options (Direct, Limited Agent, BYO Integration)
 * - Limited Agent Structure and Limitations
 * - Transaction Fees and Pricing
 * - Refund Policies and Procedures
 * - Chargebacks and Disputes
 * - Settlement and Payouts
 * - Tax Responsibilities
 * - Security and PCI Compliance
 * - Currency and Geographic Restrictions
 */

export default function PaymentTermsPage() {
  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Payment Processing Terms and Agreement</CardTitle>
            <CardDescription className="text-base">
              {COMPANY_INFO.legalName} - {COMPANY_INFO.tradingName} Platform<br />
              ABN: {COMPANY_INFO.abn}<br />
              Last updated: {DateFormatters.getLastUpdatedDate()}<br />
              <span className="text-red-600 font-medium">These payment terms govern all financial transactions on the LodgeTix platform</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none">
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <h3 className="text-lg font-medium mb-2 text-amber-800">Important Notice</h3>
              <p className="text-amber-700 mb-2">
                <strong>These Payment Processing Terms ("Payment Terms") form a legally binding agreement
                between you and {COMPANY_INFO.legalName} ("LodgeTix", "we", "us", or "our") regarding
                all payment processing activities on our platform.</strong>
              </p>
              <p className="text-amber-700">
                By using any payment processing method on our platform, you agree to be bound by these
                Payment Terms, our general Terms of Service, Privacy Policy, and all applicable payment
                processor agreements including Square's Terms of Service where applicable. If you do not
                agree to these terms, you must not process payments through our platform.
              </p>
            </div>

            {/* Section 1: Payment Processing Options */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Payment Processing Options Overview</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3 text-blue-800">Three Distinct Payment Methods Available</h3>
                <p className="mb-4 text-blue-800 font-bold">
                  LODGETIX OFFERS THREE SEPARATE AND DISTINCT PAYMENT PROCESSING OPTIONS. EACH OPTION HAS
                  DIFFERENT LEGAL STRUCTURES, RESPONSIBILITIES, AND IMPLICATIONS FOR BOTH EVENT ORGANISERS
                  AND ATTENDEES.
                </p>
                <ol className="list-decimal list-inside space-y-2 mb-4 text-blue-800">
                  <li><strong>Direct Payment to Organisers:</strong> Attendees pay event organisers directly via bank transfer using provided bank details</li>
                  <li><strong>LodgeTix as Limited Payment Agent:</strong> We act as a limited collection agent similar to EventBrite's model</li>
                  <li><strong>BYO Integration:</strong> Event organisers integrate their own Square or Stripe payment processing accounts</li>
                </ol>
              </div>

              <h3 className="text-lg font-medium mb-3">1.1 Option 1: Direct Payment to Event Organisers</h3>
              <p className="mb-4">
                Under this payment method, LodgeTix operates purely as a technology platform providing event
                listing and registration management services. We do not handle, process, or have any involvement
                with the actual transfer of funds between attendees and event organisers.
              </p>
              
              <h4 className="font-medium mb-2">How Direct Payment Works:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Bank Details Display:</strong> Event organisers provide their Australian bank account details (BSB and Account Number) which are displayed to attendees during the registration process</li>
                <li><strong>Payment Instructions:</strong> Attendees receive clear instructions to transfer payment directly to the event organiser's bank account</li>
                <li><strong>Reference Requirements:</strong> A unique reference number is generated for each registration to facilitate payment matching</li>
                <li><strong>Manual Reconciliation:</strong> Event organisers are responsible for manually reconciling payments received in their bank account</li>
                <li><strong>Confirmation Process:</strong> Organisers manually confirm payment receipt through the LodgeTix dashboard</li>
                <li><strong>No Payment Processing:</strong> LodgeTix does not process, handle, or transmit any payment card data or banking information</li>
              </ul>

              <h4 className="font-medium mb-2">Responsibilities Under Direct Payment:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Event Organisers:</strong> Solely responsible for all aspects of payment collection, reconciliation, and financial management</li>
                <li><strong>Tax Obligations:</strong> Organisers must manage all GST, income tax, and other tax obligations independently</li>
                <li><strong>Refund Processing:</strong> All refunds must be processed directly by the event organiser through their banking channels</li>
                <li><strong>Payment Disputes:</strong> Any payment disputes are resolved directly between attendees and organisers</li>
                <li><strong>Banking Relationships:</strong> Organisers maintain their own banking relationships and merchant facilities</li>
                <li><strong>LodgeTix Role:</strong> We provide only the technology platform and have no involvement in financial transactions</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">1.2 Option 2: LodgeTix as Limited Payment Agent</h3>
              <p className="mb-4">
                Under this model, LodgeTix acts as a limited payment collection agent on behalf of event organisers,
                similar to how EventBrite and other ticketing platforms operate. This structure provides convenience
                while maintaining clear boundaries of responsibility and liability.
              </p>

              <h4 className="font-medium mb-2">Limited Agency Structure:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Collection Agent Only:</strong> We act solely as a payment collection agent, not as a merchant of record</li>
                <li><strong>Square Integration:</strong> All payments are processed through Square's secure payment infrastructure</li>
                <li><strong>Funds Holding:</strong> We temporarily hold collected funds in designated trust or client accounts</li>
                <li><strong>Settlement Schedule:</strong> Funds are settled to event organisers according to agreed settlement terms</li>
                <li><strong>Limited Authority:</strong> Our authority is strictly limited to collecting payments on behalf of organisers</li>
                <li><strong>No Merchant Services:</strong> We do not provide merchant services or act as a payment facilitator</li>
              </ul>

              <h4 className="font-medium mb-2">Agency Limitations and Disclaimers:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>No Guarantee of Services:</strong> LodgeTix does not guarantee event delivery or quality of services provided by organisers</li>
                <li><strong>Limited Liability:</strong> Our liability is strictly limited to our role as payment collection agent</li>
                <li><strong>Event Responsibility:</strong> Event organisers remain fully responsible for event delivery and attendee satisfaction</li>
                <li><strong>No Endorsement:</strong> Payment processing does not constitute endorsement of events or organisers</li>
                <li><strong>Dispute Limitations:</strong> We facilitate but do not arbitrate disputes between attendees and organisers</li>
                <li><strong>Regulatory Compliance:</strong> Organisers must ensure their events comply with all applicable laws and regulations</li>
              </ul>

              <h4 className="font-medium mb-2">Payment Flow Under Limited Agency:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Payment Collection:</strong> Attendees pay LodgeTix as agent for the event organiser</li>
                <li><strong>Processing:</strong> Payments are processed through Square's payment gateway</li>
                <li><strong>Trust Account:</strong> Funds are held in designated accounts pending settlement</li>
                <li><strong>Fee Deduction:</strong> Platform and processing fees are deducted before settlement</li>
                <li><strong>Settlement:</strong> Net proceeds are settled to organisers per agreed schedule</li>
                <li><strong>Reporting:</strong> Detailed transaction reports are provided to organisers</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">1.3 Option 3: BYO Payment Integration</h3>
              <p className="mb-4">
                The Bring Your Own (BYO) integration option allows event organisers to connect their own
                Square or Stripe payment processing accounts directly to the LodgeTix platform. This provides
                maximum control and flexibility for organisers who prefer to manage their own payment processing
                relationships.
              </p>

              <h4 className="font-medium mb-2">How BYO Integration Works:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Direct Integration:</strong> Organisers connect their existing Square or Stripe accounts via OAuth authentication</li>
                <li><strong>API Connection:</strong> LodgeTix facilitates the technical connection between our platform and payment processors</li>
                <li><strong>Direct Processing:</strong> All payments are processed directly through the organiser's merchant account</li>
                <li><strong>Immediate Settlement:</strong> Funds settle directly to the organiser's linked bank account</li>
                <li><strong>Full Control:</strong> Organisers maintain complete control over their payment processing settings</li>
                <li><strong>Direct Relationship:</strong> Organisers maintain direct relationships with Square or Stripe</li>
              </ul>

              <h4 className="font-medium mb-2">Requirements for BYO Integration:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Active Merchant Account:</strong> Must have an active, verified Square or Stripe account in good standing</li>
                <li><strong>API Credentials:</strong> Ability to generate and manage API credentials for integration</li>
                <li><strong>Compliance Requirements:</strong> Must meet all KYC/KYB requirements of the payment processor</li>
                <li><strong>Technical Setup:</strong> Complete OAuth authentication and integration setup process</li>
                <li><strong>Account Maintenance:</strong> Maintain payment processor account in compliance with their terms</li>
                <li><strong>Risk Management:</strong> Assume all risk management responsibilities with payment processor</li>
              </ul>

              <h4 className="font-medium mb-2">Responsibilities Under BYO Integration:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Direct Processor Relationship:</strong> All payment processing terms governed by Square or Stripe directly</li>
                <li><strong>Compliance Management:</strong> Organisers responsible for all payment processor compliance requirements</li>
                <li><strong>Fee Negotiations:</strong> Processing rates and fees determined by organiser's agreement with processor</li>
                <li><strong>Dispute Handling:</strong> Chargebacks and disputes handled directly with payment processor</li>
                <li><strong>Technical Maintenance:</strong> Responsible for maintaining valid API connections and credentials</li>
                <li><strong>LodgeTix Platform Fee:</strong> Separate platform usage fee still applies for technology services</li>
              </ul>
            </section>

            {/* Section 2: Limited Agent Structure and Limitations */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Limited Agent Structure and Limitations</h2>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3 text-red-800">2.1 CRITICAL LIMITATIONS OF AGENCY RELATIONSHIP</h3>
                <p className="mb-4 text-red-800 font-bold">
                  WHEN LODGETIX ACTS AS A LIMITED PAYMENT AGENT, OUR ROLE IS STRICTLY LIMITED TO PAYMENT
                  COLLECTION. WE DO NOT GUARANTEE, WARRANT, OR TAKE RESPONSIBILITY FOR ANY ASPECT OF
                  EVENT DELIVERY, QUALITY, OR ORGANISER PERFORMANCE.
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-red-800">
                  <li>We are NOT a party to the transaction between attendees and organisers</li>
                  <li>We do NOT guarantee events will occur as advertised</li>
                  <li>We do NOT warrant the quality or delivery of any services</li>
                  <li>We do NOT act as merchant of record for transactions</li>
                  <li>We do NOT provide merchant services or payment facilitation</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium mb-3">2.2 Scope of Limited Agency Authority</h3>
              <p className="mb-4">
                Our authority as a limited payment agent is expressly restricted to the following activities
                and nothing more. Any actions outside this scope are beyond our authority and responsibility.
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Payment Collection:</strong> Collecting payments from attendees on behalf of event organisers</li>
                <li><strong>Payment Processing:</strong> Facilitating payment processing through integrated Square payment gateway</li>
                <li><strong>Funds Custody:</strong> Temporarily holding collected funds in designated accounts pending settlement</li>
                <li><strong>Fee Collection:</strong> Deducting agreed platform and processing fees before settlement</li>
                <li><strong>Settlement Processing:</strong> Transferring net proceeds to organisers per agreed schedule</li>
                <li><strong>Transaction Reporting:</strong> Providing transaction records and settlement reports to organisers</li>
                <li><strong>Refund Facilitation:</strong> Processing refunds only as instructed by authorised organisers</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.3 Express Disclaimers and Limitations</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>No Event Guarantee:</strong> We make no representations about event occurrence, quality, or delivery</li>
                <li><strong>No Organiser Endorsement:</strong> Processing payments does not constitute endorsement of organisers</li>
                <li><strong>No Attendance Warranty:</strong> We do not warrant attendance numbers or event viability</li>
                <li><strong>No Venue Responsibility:</strong> We have no responsibility for venue conditions or availability</li>
                <li><strong>No Service Quality:</strong> We do not control or guarantee quality of services provided at events</li>
                <li><strong>No Compliance Warranty:</strong> We do not warrant organiser compliance with laws or regulations</li>
                <li><strong>Limited Dispute Role:</strong> Our role in disputes is limited to providing transaction information</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.4 Agency Relationship Clarifications</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Principal-Agent Relationship:</strong> Event organisers are principals; we act as their limited agent</li>
                <li><strong>Disclosed Agency:</strong> Our agency relationship is fully disclosed to all attendees</li>
                <li><strong>Limited Authority:</strong> Our authority extends only to payment collection and processing</li>
                <li><strong>No Apparent Authority:</strong> We have no authority to bind organisers beyond payment collection</li>
                <li><strong>Termination Rights:</strong> Either party may terminate agency relationship per agreement terms</li>
                <li><strong>Fiduciary Duties:</strong> Limited fiduciary duties apply only to payment handling and settlement</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.5 Attendee Acknowledgments</h3>
              <p className="mb-4">
                By making payments through LodgeTix as limited agent, attendees acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Their contract for event attendance is with the event organiser, not LodgeTix</li>
                <li>LodgeTix's role is limited to payment collection and processing only</li>
                <li>Event delivery and quality are the sole responsibility of event organisers</li>
                <li>Refund rights and policies are determined by event organisers, not LodgeTix</li>
                <li>LodgeTix's liability is limited to its role as payment collection agent</li>
                <li>Disputes regarding events must be resolved with organisers directly</li>
              </ul>
            </section>

            {/* Section 3: Transaction Fees and Pricing */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Transaction Fees and Pricing Structure</h2>

              <h3 className="text-lg font-medium mb-3">3.1 Fee Structure Overview</h3>
              <p className="mb-4">
                Our fee structure varies based on the payment processing option selected by event organisers.
                All fees are transparent and disclosed before activation of payment processing services.
              </p>

              <h4 className="font-medium mb-2">Direct Payment Option Fees:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Platform Usage Fee:</strong> Fixed monthly or per-event fee for platform access</li>
                <li><strong>No Transaction Fees:</strong> Since we don't process payments, no transaction fees apply</li>
                <li><strong>Optional Services:</strong> Additional fees may apply for premium features or support</li>
                <li><strong>Volume Discounts:</strong> Reduced platform fees available for high-volume organisers</li>
              </ul>

              <h4 className="font-medium mb-2">Limited Agent Option Fees:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Platform Fee:</strong> Percentage-based fee on total transaction value (typically 2-3%)</li>
                <li><strong>Payment Processing Fee:</strong> Square's standard processing fees (passed through at cost)</li>
                <li><strong>Combined Total:</strong> Total fees typically range from 4.5% to 5.5% of transaction value</li>
                <li><strong>Minimum Transaction Fee:</strong> Minimum fee may apply for very small transactions</li>
                <li><strong>International Card Fees:</strong> Additional fees for international card transactions</li>
                <li><strong>Currency Conversion:</strong> Currency conversion fees where applicable</li>
              </ul>

              <h4 className="font-medium mb-2">BYO Integration Fees:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Platform Access Fee:</strong> Reduced platform fee since organisers handle own processing</li>
                <li><strong>No Processing Fees:</strong> Organisers pay processing fees directly to Square/Stripe</li>
                <li><strong>Integration Fee:</strong> One-time setup fee may apply for integration configuration</li>
                <li><strong>Maintenance Fee:</strong> Optional ongoing technical support fee available</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.2 Fee Calculation and Transparency</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Pre-Transaction Disclosure:</strong> All fees clearly displayed before payment completion</li>
                <li><strong>Itemised Billing:</strong> Separate line items for platform and processing fees</li>
                <li><strong>No Hidden Fees:</strong> All fees disclosed upfront with no hidden charges</li>
                <li><strong>Fee Calculator:</strong> Online calculator available to estimate total fees</li>
                <li><strong>Invoice Generation:</strong> Detailed invoices provided for all transactions</li>
                <li><strong>GST Inclusive:</strong> All fees include GST where applicable</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.3 Fee Payment and Collection</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Automatic Deduction:</strong> Fees automatically deducted from gross transaction amounts</li>
                <li><strong>Net Settlement:</strong> Organisers receive net amounts after fee deduction</li>
                <li><strong>Fee Reporting:</strong> Detailed fee reports available in organiser dashboard</li>
                <li><strong>Tax Invoices:</strong> Valid tax invoices issued for all fees charged</li>
                <li><strong>Fee Disputes:</strong> Clear process for questioning or disputing fees</li>
                <li><strong>Refund Impact:</strong> How fees are handled in refund scenarios</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.4 Special Fee Considerations</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Charity Events:</strong> Reduced fees may be available for registered charities</li>
                <li><strong>High Volume:</strong> Negotiated rates available for high-volume organisers</li>
                <li><strong>Lodges and Chapters:</strong> Special pricing for Masonic lodges and chapters</li>
                <li><strong>Bundle Pricing:</strong> Discounts for multiple events or annual commitments</li>
                <li><strong>Promotional Periods:</strong> Temporary fee reductions during promotional periods</li>
                <li><strong>Fee Caps:</strong> Maximum fee caps may apply for very large transactions</li>
              </ul>
            </section>

            {/* Section 4: Refund Policies and Procedures */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Refund Policies and Procedures</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3 text-blue-800">4.1 Three-Day Transition Period Policy</h3>
                <p className="mb-4 text-blue-800 font-bold">
                  LODGETIX OPERATES A UNIQUE THREE-DAY TRANSITION PERIOD FOR REFUND RESPONSIBILITY.
                  THIS POLICY BALANCES CONSUMER PROTECTION WITH EVENT ORGANISER ACCOUNTABILITY.
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-blue-800">
                  <li><strong>Days 1-3:</strong> LodgeTix processes refunds directly (platform responsibility)</li>
                  <li><strong>Day 4 onwards:</strong> All refunds become event organiser's responsibility</li>
                  <li><strong>Clear Transition:</strong> Automatic transition occurs at midnight on day 3</li>
                  <li><strong>No Exceptions:</strong> This timeline applies to all events and payment methods</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium mb-3">4.2 Refund Procedures by Payment Method</h3>
              
              <h4 className="font-medium mb-2">Direct Payment Refunds:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Organiser Responsibility:</strong> All refunds processed directly by event organisers</li>
                <li><strong>Bank Transfer:</strong> Refunds typically processed via bank transfer to attendee</li>
                <li><strong>Processing Time:</strong> Subject to organiser's policies and banking timeframes</li>
                <li><strong>Documentation:</strong> Organisers must maintain refund records independently</li>
                <li><strong>Platform Role:</strong> LodgeTix provides refund request tracking only</li>
              </ul>

              <h4 className="font-medium mb-2">Limited Agent Refunds:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Days 1-3:</strong> LodgeTix processes refunds automatically upon valid request</li>
                <li><strong>Day 4+:</strong> Refund requests forwarded to organisers for approval</li>
                <li><strong>Processing Method:</strong> Refunds processed to original payment method via Square</li>
                <li><strong>Processing Time:</strong> 5-10 business days for funds to appear in account</li>
                <li><strong>Partial Refunds:</strong> Available subject to organiser approval</li>
                <li><strong>Fee Handling:</strong> Platform fees may be non-refundable per terms</li>
              </ul>

              <h4 className="font-medium mb-2">BYO Integration Refunds:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Direct Processing:</strong> All refunds processed through organiser's payment account</li>
                <li><strong>Processor Rules:</strong> Subject to Square/Stripe refund policies and timelines</li>
                <li><strong>Organiser Control:</strong> Full control over refund approval and processing</li>
                <li><strong>Platform Tracking:</strong> Refund status tracked but not processed by LodgeTix</li>
                <li><strong>Fee Recovery:</strong> Processing fees subject to payment processor policies</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.3 Refund Eligibility and Restrictions</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Valid Reasons:</strong> Event cancellation, significant changes, or non-delivery of services</li>
                <li><strong>Time Limits:</strong> Refund requests must be submitted within reasonable timeframes</li>
                <li><strong>Documentation:</strong> May require supporting documentation for refund claims</li>
                <li><strong>Organiser Policies:</strong> Subject to individual event refund policies after day 3</li>
                <li><strong>Force Majeure:</strong> Special considerations for extraordinary circumstances</li>
                <li><strong>Partial Attendance:</strong> Policies for partial event attendance or early departure</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.4 Refund Dispute Resolution</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Initial Review:</strong> LodgeTix reviews refund disputes during days 1-3 only</li>
                <li><strong>Organiser Discretion:</strong> After day 3, organisers have final say on refunds</li>
                <li><strong>Mediation Services:</strong> Optional mediation available for unresolved disputes</li>
                <li><strong>Documentation Requirements:</strong> Clear evidence required for dispute claims</li>
                <li><strong>Appeal Process:</strong> Limited appeal rights for clearly unreasonable decisions</li>
                <li><strong>Consumer Protection:</strong> Rights under Australian Consumer Law preserved</li>
              </ul>
            </section>

            {/* Section 5: Chargebacks and Disputes */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Chargebacks and Payment Disputes</h2>

              <h3 className="text-lg font-medium mb-3">5.1 Chargeback Responsibility</h3>
              <p className="mb-4">
                Chargeback liability varies significantly based on the payment processing method selected.
                Understanding these differences is crucial for event organisers.
              </p>

              <h4 className="font-medium mb-2">Direct Payment Method:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>No Chargeback Risk:</strong> Bank transfers cannot be charged back like card payments</li>
                <li><strong>Fraud Protection:</strong> Limited to unauthorised bank account access claims</li>
                <li><strong>Dispute Resolution:</strong> Handled through banking dispute procedures</li>
                <li><strong>Documentation:</strong> Importance of maintaining payment records</li>
              </ul>

              <h4 className="font-medium mb-2">Limited Agent Method:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Organiser Liability:</strong> Event organisers bear full chargeback liability</li>
                <li><strong>Automatic Debit:</strong> Chargeback amounts automatically debited from future settlements</li>
                <li><strong>Negative Balances:</strong> Organisers must fund negative balances immediately</li>
                <li><strong>Dispute Support:</strong> LodgeTix provides transaction evidence for disputes</li>
                <li><strong>Prevention Tools:</strong> Access to fraud prevention and verification tools</li>
                <li><strong>Fee Application:</strong> Chargeback fees passed through to organisers</li>
              </ul>

              <h4 className="font-medium mb-2">BYO Integration Method:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Direct Processor Relationship:</strong> Chargebacks handled directly with Square/Stripe</li>
                <li><strong>Processor Rules:</strong> Subject to payment processor chargeback policies</li>
                <li><strong>Independent Management:</strong> Organisers manage disputes independently</li>
                <li><strong>Platform Support:</strong> Limited to providing registration data if requested</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.2 Chargeback Prevention Strategies</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Clear Descriptions:</strong> Accurate event descriptions reduce misunderstanding disputes</li>
                <li><strong>Timely Communication:</strong> Prompt attendee communication prevents disputes</li>
                <li><strong>Refund Policies:</strong> Clear, fair refund policies reduce chargeback frequency</li>
                <li><strong>Documentation:</strong> Comprehensive records support dispute responses</li>
                <li><strong>Fraud Screening:</strong> Use available fraud prevention tools and filters</li>
                <li><strong>Terms Acceptance:</strong> Clear evidence of terms and conditions acceptance</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.3 Dispute Response Procedures</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Notification Timeline:</strong> Immediate notification of chargeback claims</li>
                <li><strong>Response Deadline:</strong> Typically 7-10 days to respond with evidence</li>
                <li><strong>Evidence Requirements:</strong> Registration details, communications, and delivery proof</li>
                <li><strong>Platform Assistance:</strong> LodgeTix provides transaction and registration data</li>
                <li><strong>Success Strategies:</strong> Best practices for winning chargeback disputes</li>
                <li><strong>Outcome Notification:</strong> Prompt notification of dispute outcomes</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.4 Financial Impact Management</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Reserve Requirements:</strong> May require reserves for high-risk events</li>
                <li><strong>Rolling Reserves:</strong> Percentage of settlements held for dispute coverage</li>
                <li><strong>Risk Assessment:</strong> Factors affecting risk levels and reserve requirements</li>
                <li><strong>Account Suspension:</strong> Excessive chargebacks may result in suspension</li>
                <li><strong>Recovery Actions:</strong> Collection procedures for unrecovered amounts</li>
                <li><strong>Insurance Options:</strong> Availability of chargeback insurance products</li>
              </ul>
            </section>

            {/* Section 6: Settlement and Payouts */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Settlement and Payout Procedures</h2>

              <h3 className="text-lg font-medium mb-3">6.1 Settlement Schedules by Method</h3>
              
              <h4 className="font-medium mb-2">Direct Payment Settlements:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Immediate Access:</strong> Funds available immediately in organiser's bank account</li>
                <li><strong>No Settlement Delay:</strong> No platform-imposed settlement waiting periods</li>
                <li><strong>Bank Processing:</strong> Subject only to standard bank processing times</li>
                <li><strong>Full Control:</strong> Complete control over fund management and usage</li>
              </ul>

              <h4 className="font-medium mb-2">Limited Agent Settlements:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Standard Schedule:</strong> Settlements processed 2-7 business days after event completion</li>
                <li><strong>Risk-Based Holds:</strong> High-risk events may have extended settlement periods</li>
                <li><strong>Minimum Thresholds:</strong> Minimum settlement amounts may apply</li>
                <li><strong>Batch Processing:</strong> Settlements processed in daily batches</li>
                <li><strong>Holiday Delays:</strong> Bank holidays may extend settlement timelines</li>
                <li><strong>Verification Requirements:</strong> KYC verification must be complete for settlements</li>
              </ul>

              <h4 className="font-medium mb-2">BYO Integration Settlements:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Processor Schedule:</strong> Follow Square/Stripe standard settlement schedules</li>
                <li><strong>Direct Deposit:</strong> Funds deposited directly to linked bank accounts</li>
                <li><strong>Processor Control:</strong> Settlement timing controlled by payment processor</li>
                <li><strong>Independent Management:</strong> Organisers manage settlement preferences directly</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.2 Settlement Requirements and Verification</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Bank Account Verification:</strong> Valid Australian bank account required</li>
                <li><strong>Account Ownership:</strong> Bank account must match registered entity name</li>
                <li><strong>KYC Completion:</strong> All identity verification must be complete</li>
                <li><strong>Tax Documentation:</strong> ABN and tax status verification required</li>
                <li><strong>Anti-Money Laundering:</strong> Compliance with AML/CTF requirements</li>
                <li><strong>Beneficial Ownership:</strong> Disclosure of ultimate beneficial owners</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.3 Settlement Reporting and Reconciliation</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Settlement Statements:</strong> Detailed statements for each settlement batch</li>
                <li><strong>Transaction Details:</strong> Line-by-line transaction breakdown provided</li>
                <li><strong>Fee Transparency:</strong> Clear separation of gross amounts and fees</li>
                <li><strong>Export Options:</strong> CSV and PDF export for accounting purposes</li>
                <li><strong>API Access:</strong> Programmatic access to settlement data available</li>
                <li><strong>Audit Trail:</strong> Complete audit trail for all financial movements</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.4 Settlement Delays and Holds</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Risk-Based Delays:</strong> High-risk events subject to extended holds</li>
                <li><strong>Dispute Holds:</strong> Funds held pending dispute resolution</li>
                <li><strong>Verification Delays:</strong> Incomplete KYC may delay settlements</li>
                <li><strong>Suspicious Activity:</strong> Unusual patterns may trigger review holds</li>
                <li><strong>Event Completion:</strong> Settlements may await event completion confirmation</li>
                <li><strong>Communication:</strong> Clear communication of any settlement delays</li>
              </ul>
            </section>

            {/* Section 7: Tax Responsibilities */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Tax Responsibilities and Obligations</h2>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3 text-amber-800">7.1 Important Tax Disclaimer</h3>
                <p className="text-amber-700 font-bold">
                  LODGETIX DOES NOT PROVIDE TAX ADVICE. ALL PARTIES MUST SEEK INDEPENDENT TAX ADVICE
                  REGARDING THEIR SPECIFIC OBLIGATIONS. THE INFORMATION PROVIDED HERE IS GENERAL IN
                  NATURE AND SHOULD NOT BE RELIED UPON AS TAX ADVICE.
                </p>
              </div>

              <h3 className="text-lg font-medium mb-3">7.2 GST Obligations and Handling</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>GST Registration:</strong> Event organisers must determine their GST registration requirements</li>
                <li><strong>GST Collection:</strong> Organisers responsible for collecting GST where applicable</li>
                <li><strong>Tax Invoices:</strong> Platform supports tax invoice generation where required</li>
                <li><strong>GST Reporting:</strong> Organisers must report and remit GST independently</li>
                <li><strong>Platform GST:</strong> LodgeTix charges GST on platform fees to Australian customers</li>
                <li><strong>Input Tax Credits:</strong> Organisers may claim input tax credits on platform fees</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">7.3 Income Tax Considerations</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Income Recognition:</strong> Event revenue constitutes assessable income for organisers</li>
                <li><strong>Expense Deductions:</strong> Platform and processing fees may be tax deductible</li>
                <li><strong>Record Keeping:</strong> Maintain comprehensive records for tax purposes</li>
                <li><strong>Payment Summaries:</strong> Annual payment summaries available on request</li>
                <li><strong>International Tax:</strong> Consider tax implications for international attendees</li>
                <li><strong>Withholding Tax:</strong> Organisers responsible for any withholding obligations</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">7.4 Tax Documentation and Reporting</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Transaction Reports:</strong> Detailed transaction reports for tax preparation</li>
                <li><strong>Annual Summaries:</strong> Year-end summaries of all transactions and fees</li>
                <li><strong>Export Features:</strong> Export data in formats suitable for accounting software</li>
                <li><strong>Audit Support:</strong> Historical data retention for audit requirements</li>
                <li><strong>ABN Verification:</strong> Platform verifies and stores ABN information</li>
                <li><strong>RCTI Arrangements:</strong> Recipient Created Tax Invoice arrangements where applicable</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">7.5 International Tax Considerations</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Cross-Border Transactions:</strong> Tax implications for international events</li>
                <li><strong>Currency Conversions:</strong> Tax treatment of foreign currency gains/losses</li>
                <li><strong>Double Tax Treaties:</strong> Consideration of relevant tax treaties</li>
                <li><strong>Non-Resident Tax:</strong> Obligations for non-resident organisers</li>
                <li><strong>Digital Services Tax:</strong> Potential application to platform services</li>
                <li><strong>VAT/GST Credits:</strong> International GST/VAT credit arrangements</li>
              </ul>
            </section>

            {/* Section 8: Security and PCI Compliance */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Security and PCI Compliance</h2>

              <h3 className="text-lg font-medium mb-3">8.1 Payment Security Standards</h3>
              <p className="mb-4">
                LodgeTix maintains the highest standards of payment security across all payment processing
                methods, with specific measures varying based on the level of payment data handling involved.
              </p>

              <h4 className="font-medium mb-2">Platform Security Measures:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>SSL/TLS Encryption:</strong> All data transmitted using industry-standard encryption</li>
                <li><strong>Tokenization:</strong> Sensitive payment data replaced with secure tokens</li>
                <li><strong>Network Security:</strong> Firewalls and intrusion detection systems in place</li>
                <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
                <li><strong>Regular Audits:</strong> Security audits and penetration testing performed regularly</li>
                <li><strong>Incident Response:</strong> Comprehensive incident response procedures in place</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">8.2 PCI DSS Compliance</h3>
              
              <h4 className="font-medium mb-2">Direct Payment Method:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>No PCI Scope:</strong> No payment card data handled, so PCI DSS not applicable</li>
                <li><strong>Bank Details:</strong> Bank account numbers handled with appropriate security</li>
                <li><strong>Data Protection:</strong> General data protection standards still apply</li>
              </ul>

              <h4 className="font-medium mb-2">Limited Agent Method:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>PCI Compliance:</strong> LodgeTix maintains PCI DSS compliance for card data handling</li>
                <li><strong>Square Integration:</strong> Leverages Square's PCI-compliant infrastructure</li>
                <li><strong>Scope Reduction:</strong> Card data never touches LodgeTix servers directly</li>
                <li><strong>Compliance Validation:</strong> Annual compliance validation performed</li>
                <li><strong>Security Policies:</strong> Comprehensive security policies and procedures</li>
              </ul>

              <h4 className="font-medium mb-2">BYO Integration Method:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Processor Compliance:</strong> PCI compliance managed by Square/Stripe directly</li>
                <li><strong>Reduced Scope:</strong> LodgeTix has minimal PCI scope in this model</li>
                <li><strong>Organiser Responsibility:</strong> Organisers must maintain their own compliance</li>
                <li><strong>Integration Security:</strong> Secure OAuth connections for account linking</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">8.3 Data Protection and Privacy</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Privacy Policy:</strong> Comprehensive privacy policy governs data handling</li>
                <li><strong>Data Minimization:</strong> Only necessary payment data collected and stored</li>
                <li><strong>Retention Policies:</strong> Clear data retention and deletion policies</li>
                <li><strong>Access Rights:</strong> Users can access and correct their payment data</li>
                <li><strong>Third-Party Sharing:</strong> Limited sharing only for payment processing</li>
                <li><strong>International Transfers:</strong> Appropriate safeguards for data transfers</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">8.4 Fraud Prevention and Monitoring</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Real-Time Monitoring:</strong> Transactions monitored for suspicious patterns</li>
                <li><strong>Velocity Checks:</strong> Limits on transaction frequency and amounts</li>
                <li><strong>Geographic Filters:</strong> Option to restrict transactions by geography</li>
                <li><strong>Card Verification:</strong> CVV and address verification for card payments</li>
                <li><strong>Machine Learning:</strong> Advanced fraud detection algorithms employed</li>
                <li><strong>Manual Review:</strong> High-risk transactions subject to manual review</li>
              </ul>
            </section>

            {/* Section 9: Currency and Geographic Restrictions */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Currency and Geographic Restrictions</h2>

              <h3 className="text-lg font-medium mb-3">9.1 Supported Currencies</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Primary Currency:</strong> Australian Dollars (AUD) is the primary supported currency</li>
                <li><strong>Foreign Currency:</strong> Limited support for major currencies through Square</li>
                <li><strong>Currency Conversion:</strong> Automatic conversion at current exchange rates</li>
                <li><strong>Conversion Fees:</strong> Currency conversion fees apply to foreign transactions</li>
                <li><strong>Settlement Currency:</strong> All settlements to organisers in AUD only</li>
                <li><strong>Display Options:</strong> Prices can be displayed in multiple currencies</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">9.2 Geographic Service Areas</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Primary Service Area:</strong> Australia and New Zealand</li>
                <li><strong>Event Locations:</strong> Events must be held within Australia or New Zealand</li>
                <li><strong>Organiser Location:</strong> Event organisers must be Australian entities</li>
                <li><strong>Attendee Location:</strong> Attendees can purchase from any country</li>
                <li><strong>Payment Methods:</strong> International cards accepted with additional fees</li>
                <li><strong>Compliance Requirements:</strong> Subject to Australian regulatory requirements</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">9.3 International Transaction Considerations</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Exchange Rate Risk:</strong> Organisers bear exchange rate fluctuation risk</li>
                <li><strong>International Fees:</strong> Higher processing fees for international cards</li>
                <li><strong>Fraud Risk:</strong> Enhanced fraud screening for international transactions</li>
                <li><strong>Regulatory Compliance:</strong> Must comply with international payment regulations</li>
                <li><strong>Tax Implications:</strong> Consider international tax obligations</li>
                <li><strong>Support Hours:</strong> Support provided in Australian business hours</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">9.4 Restricted Countries and Sanctions</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Sanctions Compliance:</strong> Compliance with Australian sanctions regimes</li>
                <li><strong>Restricted Countries:</strong> Cannot process payments from sanctioned countries</li>
                <li><strong>Screening Requirements:</strong> Automatic screening against sanctions lists</li>
                <li><strong>Reporting Obligations:</strong> Suspicious transactions reported as required</li>
                <li><strong>Account Restrictions:</strong> Accounts linked to restricted countries prohibited</li>
                <li><strong>Ongoing Monitoring:</strong> Continuous monitoring for sanctions compliance</li>
              </ul>
            </section>

            {/* Section 10: Platform-Specific Terms */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Platform-Specific Terms and Conditions</h2>

              <h3 className="text-lg font-medium mb-3">10.1 Square Integration Terms</h3>
              <p className="mb-4">
                When using Square payment processing (either through LodgeTix as agent or BYO integration),
                additional terms and conditions apply as set forth by Square Inc.
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Square Terms:</strong> Subject to Square's Terms of Service and Privacy Policy</li>
                <li><strong>Merchant Agreement:</strong> Bound by Square's Merchant Terms of Service</li>
                <li><strong>Data Sharing:</strong> Payment data shared with Square per their privacy policy</li>
                <li><strong>Compliance Requirements:</strong> Must meet Square's merchant requirements</li>
                <li><strong>Service Availability:</strong> Subject to Square's service availability</li>
                <li><strong>Fee Changes:</strong> Square may modify processing fees with notice</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">10.2 Alternative Payment Methods</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Future Methods:</strong> Additional payment methods may be added</li>
                <li><strong>Method-Specific Terms:</strong> Each method subject to specific terms</li>
                <li><strong>Pilot Programs:</strong> Beta payment methods may have additional restrictions</li>
                <li><strong>Cryptocurrency:</strong> Digital currencies not currently supported</li>
                <li><strong>Buy Now Pay Later:</strong> BNPL options may be introduced with separate terms</li>
                <li><strong>Direct Debit:</strong> Bank debit options under consideration</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">10.3 Platform Evolution and Changes</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Service Updates:</strong> Payment services may be modified with notice</li>
                <li><strong>Feature Additions:</strong> New payment features added regularly</li>
                <li><strong>Deprecation Notice:</strong> Minimum 90 days notice for feature removal</li>
                <li><strong>Migration Support:</strong> Assistance provided for required changes</li>
                <li><strong>Grandfathering:</strong> Existing terms may be grandfathered where feasible</li>
                <li><strong>Communication:</strong> Changes communicated via email and dashboard</li>
              </ul>
            </section>

            {/* Section 11: Liability and Indemnification */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Liability and Indemnification</h2>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3 text-red-800">11.1 Limitation of Liability</h3>
                <p className="mb-4 text-red-800 font-bold">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, LODGETIX'S TOTAL LIABILITY FOR ALL CLAIMS
                  RELATED TO PAYMENT PROCESSING SHALL NOT EXCEED THE PLATFORM FEES PAID BY THE
                  RELEVANT PARTY IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-red-800">
                  <li>No liability for indirect, consequential, or punitive damages</li>
                  <li>No liability for lost profits or business opportunities</li>
                  <li>No liability for payment processor actions or failures</li>
                  <li>No liability for organiser fraud or non-performance</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium mb-3">11.2 Indemnification Obligations</h3>
              
              <h4 className="font-medium mb-2">Event Organiser Indemnification:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>General Indemnity:</strong> Indemnify LodgeTix against all claims arising from your events</li>
                <li><strong>Payment Claims:</strong> Indemnify against payment-related disputes and chargebacks</li>
                <li><strong>Compliance Failures:</strong> Indemnify for your failure to comply with laws</li>
                <li><strong>Third-Party Claims:</strong> Cover claims from attendees or other third parties</li>
                <li><strong>Legal Costs:</strong> Include reasonable legal fees and court costs</li>
                <li><strong>Settlement Authority:</strong> LodgeTix may settle claims at its discretion</li>
              </ul>

              <h4 className="font-medium mb-2">Mutual Indemnification:</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Gross Negligence:</strong> Each party indemnifies for gross negligence</li>
                <li><strong>Willful Misconduct:</strong> Indemnification for intentional wrongdoing</li>
                <li><strong>Breach of Terms:</strong> Indemnify for material breach of these terms</li>
                <li><strong>Confidentiality Breach:</strong> Cover losses from confidentiality violations</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">11.3 Insurance Requirements</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Public Liability:</strong> Organisers should maintain adequate public liability insurance</li>
                <li><strong>Professional Indemnity:</strong> Consider professional indemnity coverage</li>
                <li><strong>Cyber Insurance:</strong> Recommended for data breach protection</li>
                <li><strong>Event Cancellation:</strong> Consider event cancellation insurance</li>
                <li><strong>Evidence of Coverage:</strong> May be required to provide insurance certificates</li>
                <li><strong>Additional Insured:</strong> May need to name LodgeTix as additional insured</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">11.4 Risk Allocation</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Payment Risk:</strong> Organisers bear risk of payment fraud and chargebacks</li>
                <li><strong>Event Risk:</strong> Organisers bear all risk related to event delivery</li>
                <li><strong>Platform Risk:</strong> LodgeTix bears risk only for platform availability</li>
                <li><strong>Processor Risk:</strong> Payment processor risks per their agreements</li>
                <li><strong>Force Majeure:</strong> Neither party liable for force majeure events</li>
                <li><strong>Statutory Rights:</strong> Consumer statutory rights not affected</li>
              </ul>
            </section>

            {/* Section 12: Termination and Survival */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Termination and Survival</h2>

              <h3 className="text-lg font-medium mb-3">12.1 Termination Rights</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Voluntary Termination:</strong> Either party may terminate with 30 days notice</li>
                <li><strong>Immediate Termination:</strong> For material breach or illegal activity</li>
                <li><strong>Processor Termination:</strong> If payment processor terminates relationship</li>
                <li><strong>Regulatory Termination:</strong> For regulatory compliance requirements</li>
                <li><strong>Risk-Based Termination:</strong> For unacceptable risk profiles</li>
                <li><strong>Convenience Termination:</strong> Platform may terminate at its discretion</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">12.2 Effects of Termination</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Payment Processing:</strong> Existing transactions completed</li>
                <li><strong>Settlement Obligations:</strong> Final settlement of all amounts due</li>
                <li><strong>Refund Responsibilities:</strong> Ongoing refund obligations continue</li>
                <li><strong>Data Export:</strong> Right to export transaction data</li>
                <li><strong>Account Closure:</strong> Payment accounts closed after final settlement</li>
                <li><strong>Transition Support:</strong> Reasonable transition assistance provided</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">12.3 Surviving Provisions</h3>
              <p className="mb-4">
                The following provisions survive termination of payment processing services:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Financial Obligations:</strong> All payment and refund obligations</li>
                <li><strong>Indemnification:</strong> Indemnification obligations remain in effect</li>
                <li><strong>Confidentiality:</strong> Confidentiality obligations continue</li>
                <li><strong>Dispute Resolution:</strong> Dispute procedures for existing issues</li>
                <li><strong>Liability Limitations:</strong> Limitation of liability provisions</li>
                <li><strong>Intellectual Property:</strong> IP rights and restrictions</li>
              </ul>
            </section>

            {/* Final Section: Acceptance and Modifications */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">13. Acceptance and Modifications</h2>

              <h3 className="text-lg font-medium mb-3">13.1 Acceptance of Terms</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Express Acceptance:</strong> By using any payment method, you accept these terms</li>
                <li><strong>Authority to Accept:</strong> You warrant you have authority to accept</li>
                <li><strong>Understanding:</strong> You confirm you understand all terms and implications</li>
                <li><strong>Legal Advice:</strong> You've had opportunity to seek legal advice</li>
                <li><strong>No Reliance:</strong> Not relying on any representations outside these terms</li>
                <li><strong>Entire Agreement:</strong> These terms constitute entire payment agreement</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">13.2 Modifications and Updates</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Right to Modify:</strong> LodgeTix may modify terms with notice</li>
                <li><strong>Notice Period:</strong> 30 days notice for material changes</li>
                <li><strong>Continued Use:</strong> Continued use constitutes acceptance</li>
                <li><strong>Rejection Option:</strong> May reject by discontinuing use</li>
                <li><strong>Version Control:</strong> Previous versions available on request</li>
                <li><strong>Change Log:</strong> Summary of changes provided with updates</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">14. Contact Information</h2>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Payment Support</h3>
                <p><strong>{COMPANY_INFO.legalName}</strong><br />
                Trading as: {COMPANY_INFO.tradingName}<br />
                ABN: {COMPANY_INFO.abn}<br />
                {COMPANY_INFO.address.street}<br />
                {COMPANY_INFO.address.suburb} {COMPANY_INFO.address.state} {COMPANY_INFO.address.postcode}<br />
                {COMPANY_INFO.address.country}<br />
                Phone: {COMPANY_INFO.contact.phone}<br />
                Email: {COMPANY_INFO.contact.email}<br />
                Payment Support: payments@lodgetix.io<br />
                Legal Issues: legal@lodgetix.io</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-medium mb-3 text-blue-800">Square Support</h3>
                <p className="text-blue-800">
                  For Square-specific payment issues, you may also contact Square support directly
                  through their merchant dashboard or support channels. Note that Square support
                  can only assist with technical payment processing issues, not platform-specific
                  matters.
                </p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600">
                These Payment Processing Terms were last updated on {DateFormatters.getLastUpdatedDate()} 
                and are effective immediately. By using any payment processing method on our platform, 
                you acknowledge that you have read, understood, and agreed to be bound by these Terms.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This document covers all payment processing methods available on the LodgeTix platform,
                including direct bank transfers, limited agency payment collection, and BYO payment
                processor integrations with Square and Stripe.
              </p>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                These Payment Terms supplement and do not replace our general Terms of Service, 
                Privacy Policy, and any specific event terms and conditions. In case of conflict,
                these Payment Terms prevail for payment-related matters.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}