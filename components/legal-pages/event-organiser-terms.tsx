import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { COMPANY_INFO, DateFormatters } from '@/lib/constants/company-details'

/**
 * Comprehensive Terms of Service for Event Organisers
 * 
 * This component contains the complete Terms of Service specifically for Event Organisers
 * using the LodgeTix platform. It includes all required Stripe Connect compliance clauses,
 * KYC/KYB requirements, Australian regulatory requirements, and Masonic-specific terms.
 * 
 * Key sections covered:
 * - KYC/KYB Requirements (Stripe Australia compliance)
 * - Event Organiser Responsibilities
 * - Financial Terms and Payment Processing
 * - Legal and Compliance Requirements
 * - Dispute Resolution and Governing Law
 */

export default function EventOrganiserTerms() {
  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service for Event Organisers</CardTitle>
            <CardDescription className="text-base">
              {COMPANY_INFO.legalName} - {COMPANY_INFO.tradingName} Platform<br />
              ABN: {COMPANY_INFO.abn}<br />
              Last updated: {DateFormatters.getLastUpdatedDate()}<br />
              <span className="text-red-600 font-medium">These terms are specifically for Event Organisers and supplement our general Terms of Service</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none">
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <h3 className="text-lg font-medium mb-2 text-amber-800">Important Notice</h3>
              <p className="text-amber-700 mb-2">
                <strong>These Terms of Service for Event Organisers ("Organiser Terms") are legally binding agreements
                between you and {COMPANY_INFO.legalName} ("LodgeTix", "we", "us", or "our").</strong>
              </p>
              <p className="text-amber-700">
                By using our platform to create, manage, or process payments for events, you agree to be bound by 
                these Organiser Terms, our general Terms of Service, Privacy Policy, and all applicable Stripe 
                Connect agreements. If you do not agree to these terms, you must not use our organiser services.
              </p>
            </div>

            {/* Section 1: KYC/KYB Requirements */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Know Your Customer (KYC) and Know Your Business (KYB) Requirements</h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3 text-red-800">1.1 MANDATORY STRIPE AUSTRALIA KYC/KYB COMPLIANCE</h3>
                <p className="mb-4 text-red-800 font-bold">
                  ALL EVENT ORGANISERS MUST COMPLETE STRIPE'S KNOW YOUR CUSTOMER (KYC) AND KNOW YOUR BUSINESS (KYB) 
                  VERIFICATION PROCESSES BEFORE RECEIVING PAYMENTS. THIS IS A LEGAL REQUIREMENT UNDER AUSTRALIAN 
                  ANTI-MONEY LAUNDERING AND COUNTER-TERRORISM FINANCING LAWS.
                </p>
                <p className="mb-4 text-red-800">
                  <strong>Failure to complete verification will result in:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-red-800">
                  <li>Inability to receive payment transfers</li>
                  <li>Suspension of your Connected Account</li>
                  <li>Potential termination of organiser privileges</li>
                  <li>Withholding of funds until verification is complete</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium mb-3">1.2 Business Verification Requirements</h3>
              <p className="mb-4">You must provide the following information for business verification:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Australian Business Number (ABN):</strong> Valid and current ABN registered with the Australian Business Register</li>
                <li><strong>Australian Company Number (ACN):</strong> If operating as a company</li>
                <li><strong>Business Name Registration:</strong> Documentation of registered business name where applicable</li>
                <li><strong>Beneficial Ownership Information:</strong> Details of individuals who own 25% or more of the business</li>
                <li><strong>Business Address:</strong> Current and verifiable Australian business address</li>
                <li><strong>Business Activities:</strong> Description of your lodge/organisation activities and event types</li>
                <li><strong>Bank Account Details:</strong> Australian bank account for payment settlements</li>
                <li><strong>Tax File Number (TFN) or Australian Taxation Office (ATO) Information:</strong> As required for tax compliance</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">1.3 Individual Verification for Authorised Representatives</h3>
              <p className="mb-4">Authorised representatives (typically Lodge Treasurers or Secretaries) must provide:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Photo Identification:</strong> Current Australian driver's licence, passport, or other government-issued photo ID</li>
                <li><strong>Proof of Address:</strong> Recent utility bill, bank statement, or official document showing current residential address</li>
                <li><strong>Date of Birth:</strong> For identity verification purposes</li>
                <li><strong>Contact Information:</strong> Current phone number and email address</li>
                <li><strong>Role Authorization:</strong> Documentation confirming authority to act on behalf of the Lodge/organisation</li>
                <li><strong>Previous Address History:</strong> If current address is less than 12 months old</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">1.4 Ongoing Compliance Obligations</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Maintain current and accurate verification information at all times</li>
                <li>Notify us within 14 days of any changes to business structure, ownership, or authorised representatives</li>
                <li>Respond promptly to requests for additional verification documentation</li>
                <li>Update bank account details and contact information as required</li>
                <li>Undergo periodic re-verification as mandated by Stripe or regulatory requirements</li>
                <li>Comply with all requests for information from regulatory authorities</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">1.5 AUSTRAC and ASIC Compliance</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Comply with Australian Transaction Reports and Analysis Centre (AUSTRAC) reporting requirements</li>
                <li>Adhere to Australian Securities and Investments Commission (ASIC) regulations where applicable</li>
                <li>Maintain records in accordance with Anti-Money Laundering and Counter-Terrorism Financing Act 2006</li>
                <li>Report suspicious transactions or activities as required by law</li>
                <li>Cooperate with government agencies and law enforcement as legally required</li>
              </ul>
            </section>

            {/* Section 2: Event Organiser Responsibilities */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Event Organiser Responsibilities</h2>

              <h3 className="text-lg font-medium mb-3">2.1 Account Management</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Accurate Information:</strong> Maintain current, complete, and accurate account information at all times</li>
                <li><strong>Authorised Representatives:</strong> Designate only properly authorised individuals to manage the account</li>
                <li><strong>Security:</strong> Protect account credentials and immediately report any unauthorized access</li>
                <li><strong>Verification Compliance:</strong> Complete and maintain all required KYC/KYB verification processes</li>
                <li><strong>Contact Details:</strong> Keep primary contact information current for important notifications</li>
                <li><strong>Lodge Authority:</strong> Ensure you have proper authority from your Lodge to create and manage events</li>
                <li><strong>Succession Planning:</strong> Maintain procedures for account access during office changes</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.2 Event Management</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Event Listing Accuracy:</strong> Provide complete, accurate, and up-to-date event information</li>
                <li><strong>Pricing Transparency:</strong> Clearly display all costs, fees, and charges to attendees</li>
                <li><strong>Availability Management:</strong> Accurately manage ticket quotas and availability in real-time</li>
                <li><strong>Event Updates:</strong> Promptly communicate any changes to event details, timing, or location</li>
                <li><strong>Capacity Management:</strong> Ensure events do not exceed venue capacity or safety limits</li>
                <li><strong>Accessibility Compliance:</strong> Provide accessibility information and reasonable accommodations</li>
                <li><strong>Age Restrictions:</strong> Clearly communicate any age restrictions or requirements</li>
                <li><strong>Dress Codes:</strong> Specify appropriate attire requirements, especially for formal or ceremonial events</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.3 Customer Service Obligations</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Responsive Communication:</strong> Respond to attendee inquiries within 48 hours</li>
                <li><strong>Pre-Event Information:</strong> Provide clear joining instructions, venue details, and requirements</li>
                <li><strong>Support Availability:</strong> Maintain appropriate support coverage during event registration periods</li>
                <li><strong>Issue Resolution:</strong> Address attendee concerns professionally and promptly</li>
                <li><strong>Accessibility Support:</strong> Assist attendees with special requirements or accessibility needs</li>
                <li><strong>Emergency Procedures:</strong> Maintain emergency contact procedures and protocols</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.4 Event Delivery Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Service Delivery:</strong> Deliver all promised services, facilities, and experiences as advertised</li>
                <li><strong>Venue Preparation:</strong> Ensure venues are properly prepared and meet all advertised specifications</li>
                <li><strong>Safety Standards:</strong> Maintain appropriate safety standards and comply with all applicable regulations</li>
                <li><strong>Catering Standards:</strong> Ensure food and beverage services meet health and safety requirements</li>
                <li><strong>Equipment and Facilities:</strong> Provide all promised equipment, technology, and facilities</li>
                <li><strong>Staffing:</strong> Maintain appropriate staffing levels for safe and professional event delivery</li>
                <li><strong>Emergency Response:</strong> Have appropriate emergency response procedures and first aid available</li>
              </ul>
            </section>

            {/* Section 3: Financial Responsibilities */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Financial Responsibilities</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3 text-blue-800">3.1 REFUND PROCESSING OBLIGATIONS (CRITICAL)</h3>
                <p className="mb-4 text-blue-800 font-bold">
                  EVENT ORGANISERS ARE RESPONSIBLE FOR ALL REFUNDS AFTER THE 3-DAY LODGETIX PROCESSING PERIOD.
                  THIS IS A BINDING FINANCIAL OBLIGATION.
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-blue-800">
                  <li><strong>Days 1-3:</strong> LodgeTix processes refunds for cancellations (platform responsibility)</li>
                  <li><strong>Day 4 onwards:</strong> ALL refunds become the Event Organiser's responsibility</li>
                  <li><strong>Account Funding:</strong> You must maintain sufficient account balance for potential refunds</li>
                  <li><strong>Processing Timeline:</strong> Process approved refunds within 5 business days</li>
                  <li><strong>Dispute Liability:</strong> You are liable for refund-related disputes after the 3-day period</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium mb-3">3.2 Account Balance Management</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Minimum Balance:</strong> Maintain sufficient balance to cover potential refunds and chargebacks</li>
                <li><strong>Reserve Requirements:</strong> Comply with any reserve requirements imposed by Stripe or LodgeTix</li>
                <li><strong>Settlement Monitoring:</strong> Monitor payment settlements and account balance regularly</li>
                <li><strong>Overdraft Prevention:</strong> Ensure account has sufficient funds before processing refunds</li>
                <li><strong>Financial Reporting:</strong> Maintain accurate financial records for all transactions</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.3 Payment Settlement Procedures</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Settlement Schedule:</strong> Payments are typically settled within 2-7 business days after successful events</li>
                <li><strong>Processing Fees:</strong> Stripe processing fees are automatically deducted before settlement</li>
                <li><strong>Platform Fees:</strong> LodgeTix platform fees are deducted as disclosed during event setup</li>
                <li><strong>Currency:</strong> All settlements are processed in Australian Dollars (AUD)</li>
                <li><strong>Bank Account Verification:</strong> Funds can only be settled to verified Australian bank accounts</li>
                <li><strong>Tax Obligations:</strong> You are responsible for all tax obligations related to received payments</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.4 Insufficient Funds Procedures</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Refund Failures:</strong> If insufficient funds prevent refund processing, you must immediately fund the account</li>
                <li><strong>Account Suspension:</strong> Repeated insufficient fund incidents may result in account suspension</li>
                <li><strong>Collection Rights:</strong> We reserve the right to pursue collection of outstanding amounts</li>
                <li><strong>Legal Action:</strong> Persistent non-payment may result in legal action for debt recovery</li>
                <li><strong>Credit Reporting:</strong> Outstanding debts may be reported to credit agencies</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.5 Dispute and Chargeback Liability</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Chargeback Responsibility:</strong> You are liable for all chargebacks related to your events</li>
                <li><strong>Dispute Resolution:</strong> Participate actively in resolving payment disputes with attendees</li>
                <li><strong>Documentation Requirements:</strong> Provide necessary documentation to support dispute responses</li>
                <li><strong>Chargeback Fees:</strong> Bear all costs associated with chargeback processing and resolution</li>
                <li><strong>Prevention Measures:</strong> Implement reasonable measures to prevent fraudulent transactions</li>
              </ul>
            </section>

            {/* Section 4: Legal and Compliance */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Legal and Compliance Requirements</h2>

              <h3 className="text-lg font-medium mb-3">4.1 Compliance with Laws and Regulations</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Australian Consumer Law:</strong> Comply with all provisions of the Australian Consumer Law</li>
                <li><strong>Privacy Act 1988:</strong> Adhere to privacy obligations when handling attendee personal information</li>
                <li><strong>Corporations Act 2001:</strong> Comply with corporate obligations if operating as a company</li>
                <li><strong>Local Government Regulations:</strong> Obtain necessary permits and comply with local regulations</li>
                <li><strong>Work Health and Safety:</strong> Maintain workplace health and safety standards</li>
                <li><strong>Liquor Licensing:</strong> Obtain appropriate licenses for events serving alcohol</li>
                <li><strong>Food Safety Standards:</strong> Comply with food safety regulations for catered events</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.2 Masonic Protocol Compliance (Where Applicable)</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Grand Lodge Regulations:</strong> Ensure all events comply with applicable Grand Lodge regulations</li>
                <li><strong>Ceremonial Protocol:</strong> Follow proper protocols for ceremonial and official Masonic events</li>
                <li><strong>Visitor Admission:</strong> Implement appropriate visitor verification procedures</li>
                <li><strong>Confidentiality:</strong> Maintain confidentiality of Masonic matters and ceremony details</li>
                <li><strong>Regalia Requirements:</strong> Communicate proper regalia and dress requirements</li>
                <li><strong>Lodge Authority:</strong> Ensure events are properly authorized by appropriate Lodge authorities</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.3 Consumer Protection Obligations</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Fair Trading:</strong> Engage only in fair and honest trading practices</li>
                <li><strong>Misleading Conduct:</strong> Avoid misleading or deceptive conduct in event promotion</li>
                <li><strong>Terms Disclosure:</strong> Clearly disclose all terms, conditions, and restrictions</li>
                <li><strong>Cooling-off Rights:</strong> Respect consumer cooling-off rights where applicable</li>
                <li><strong>Warranty Obligations:</strong> Honor all promises and warranties made to consumers</li>
                <li><strong>Complaint Handling:</strong> Maintain effective internal complaint handling procedures</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.4 Data Protection Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Privacy Collection:</strong> Only collect personal information necessary for event management</li>
                <li><strong>Data Security:</strong> Implement appropriate security measures to protect attendee data</li>
                <li><strong>Use Limitations:</strong> Use personal information only for stated purposes</li>
                <li><strong>Retention Limits:</strong> Retain personal information only for as long as necessary</li>
                <li><strong>Access Rights:</strong> Facilitate attendee access to their personal information</li>
                <li><strong>Breach Notification:</strong> Report data breaches as required by law</li>
              </ul>
            </section>

            {/* Section 5: Platform Usage */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Platform Usage Requirements</h2>

              <h3 className="text-lg font-medium mb-3">5.1 Acceptable Use Policies</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Lawful Purposes:</strong> Use the platform only for lawful and legitimate event organizing purposes</li>
                <li><strong>Professional Conduct:</strong> Maintain professional standards in all platform interactions</li>
                <li><strong>Truthful Information:</strong> Provide only accurate and truthful information about events</li>
                <li><strong>Intellectual Property:</strong> Respect the intellectual property rights of others</li>
                <li><strong>Platform Integrity:</strong> Do not attempt to circumvent platform features or security measures</li>
                <li><strong>Resource Usage:</strong> Use platform resources reasonably and efficiently</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.2 Prohibited Activities</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Illegal Activities:</strong> Organizing or promoting illegal events or activities</li>
                <li><strong>Discrimination:</strong> Discriminatory practices based on protected characteristics</li>
                <li><strong>Fraud:</strong> Fraudulent, deceptive, or misleading practices</li>
                <li><strong>Harassment:</strong> Harassment, bullying, or inappropriate conduct toward attendees</li>
                <li><strong>Platform Abuse:</strong> Attempting to exploit or abuse platform features</li>
                <li><strong>Spam:</strong> Unsolicited communications or promotional activities</li>
                <li><strong>Malicious Software:</strong> Uploading or distributing malicious software or code</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.3 Account Suspension/Termination Scenarios</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Terms Violations:</strong> Violation of these Terms or platform policies</li>
                <li><strong>Legal Non-compliance:</strong> Failure to comply with applicable laws or regulations</li>
                <li><strong>KYC Failures:</strong> Failure to complete or maintain required verification</li>
                <li><strong>Financial Issues:</strong> Persistent payment or refund processing problems</li>
                <li><strong>Fraudulent Activity:</strong> Engagement in fraudulent or suspicious activities</li>
                <li><strong>Risk Management:</strong> High-risk activities that threaten platform integrity</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.4 Appeal and Resolution Procedures</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Appeal Rights:</strong> Right to appeal account suspension or termination decisions</li>
                <li><strong>Appeal Process:</strong> Submit appeals through designated support channels within 30 days</li>
                <li><strong>Documentation:</strong> Provide supporting documentation for appeal consideration</li>
                <li><strong>Response Timeline:</strong> We will respond to appeals within 14 business days</li>
                <li><strong>Final Decisions:</strong> Platform decisions on appeals are final and binding</li>
                <li><strong>Alternative Dispute Resolution:</strong> Access to mediation for unresolved disputes</li>
              </ul>
            </section>

            {/* Section 6: Payment and Settlement Terms */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Payment and Settlement Terms</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3 text-blue-800">6.1 STRIPE CONNECT INTEGRATION</h3>
                <p className="mb-4 text-blue-800 font-medium">
                  <strong>Connected Account Agreement:</strong> By using our platform to receive payments, you agree 
                  to be bound by the Stripe Connected Account Agreement and acknowledge that Stripe may receive 
                  transaction data and other information related to your use of the payment processing services.
                </p>
                <p className="text-blue-800">
                  You also agree to Stripe's Privacy Policy and understand that Stripe is providing payment 
                  processing services directly to you as a merchant of record.
                </p>
              </div>

              <h3 className="text-lg font-medium mb-3">6.2 Payment Processing</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Processing Method:</strong> All payments are processed through Stripe Connect platform</li>
                <li><strong>Supported Payment Methods:</strong> Credit cards, debit cards, and other Stripe-supported methods</li>
                <li><strong>Currency:</strong> Primary processing in Australian Dollars (AUD)</li>
                <li><strong>International Payments:</strong> International cards accepted subject to additional fees</li>
                <li><strong>Payment Security:</strong> PCI DSS compliant payment processing and data handling</li>
                <li><strong>Transaction Limits:</strong> Subject to Stripe's transaction limits and risk management</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.3 Settlement Procedures</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Settlement Schedule:</strong> Funds typically settle within 2-7 business days</li>
                <li><strong>Verification Requirements:</strong> Settlement contingent on completed KYC/KYB verification</li>
                <li><strong>Bank Account Requirements:</strong> Must have verified Australian bank account</li>
                <li><strong>Minimum Settlement:</strong> Settlements subject to minimum thresholds as set by Stripe</li>
                <li><strong>Settlement Notifications:</strong> Email notifications for all settlement transactions</li>
                <li><strong>Settlement Records:</strong> Detailed transaction records available through dashboard</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.4 Fee Structure</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Processing Fees:</strong> Standard payment processing fees apply as disclosed by Stripe</li>
                <li><strong>Platform Fees:</strong> LodgeTix platform fees as disclosed during event creation</li>
                <li><strong>International Fees:</strong> Additional fees for international card transactions</li>
                <li><strong>Chargeback Fees:</strong> Standard chargeback fees apply for disputed transactions</li>
                <li><strong>Currency Conversion:</strong> Currency conversion fees for non-AUD transactions</li>
                <li><strong>Fee Transparency:</strong> All fees clearly disclosed before event activation</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.5 Refund Processing Requirements</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Refund Authority:</strong> You have sole authority to approve or deny refund requests after 3-day period</li>
                <li><strong>Processing Timeline:</strong> Process approved refunds within 5 business days</li>
                <li><strong>Partial Refunds:</strong> Ability to process partial refunds for services delivered</li>
                <li><strong>Refund Fees:</strong> Processing fees are non-refundable unless full service failure</li>
                <li><strong>Documentation:</strong> Maintain records of all refund decisions and rationale</li>
                <li><strong>Dispute Resolution:</strong> Participate in refund-related dispute resolution</li>
              </ul>
            </section>

            {/* Section 7: Dispute Resolution and Governing Law */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Dispute Resolution and Governing Law</h2>

              <h3 className="text-lg font-medium mb-3">7.1 Initial Complaint Process</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Internal Resolution:</strong> First attempt resolution through direct communication with LodgeTix support</li>
                <li><strong>Response Timeline:</strong> We will respond to organiser complaints within 48 hours</li>
                <li><strong>Documentation:</strong> Provide detailed information and supporting documentation</li>
                <li><strong>Good Faith Efforts:</strong> Participate in good faith efforts to resolve disputes informally</li>
                <li><strong>Contact Information:</strong> Use designated organiser support channels for dispute resolution</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">7.2 Masonic Dispute Resolution Protocols</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Fraternal Resolution:</strong> Lodge-related disputes should first be addressed through appropriate Masonic channels</li>
                <li><strong>Grand Lodge Consultation:</strong> Consider Grand Lodge advice for complex ceremonial or protocol disputes</li>
                <li><strong>Masonic Principles:</strong> Apply principles of Brotherly Love, Relief, and Truth in dispute resolution</li>
                <li><strong>Lodge Authority:</strong> Respect Lodge authority in matters of Masonic protocol and conduct</li>
                <li><strong>Confidentiality:</strong> Maintain appropriate confidentiality during Masonic dispute resolution</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">7.3 Formal Dispute Resolution</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Mediation:</strong> Disputes may be referred to mediation through recognized Australian mediation services</li>
                <li><strong>Arbitration:</strong> Complex disputes may require binding arbitration</li>
                <li><strong>Location:</strong> All formal proceedings to be conducted in Sydney, New South Wales</li>
                <li><strong>Governing Law:</strong> Disputes governed by laws of New South Wales, Australia</li>
                <li><strong>Legal Representation:</strong> Parties may engage legal representation for formal proceedings</li>
                <li><strong>Cost Allocation:</strong> Costs allocated according to standard legal principles</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">7.4 Limitation of Liability</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Platform Liability:</strong> LodgeTix liability limited to platform fees paid by organiser</li>
                <li><strong>Consequential Damages:</strong> No liability for indirect, consequential, or punitive damages</li>
                <li><strong>Service Availability:</strong> No guarantee of uninterrupted platform availability</li>
                <li><strong>Third-Party Actions:</strong> Not liable for actions of attendees or third parties</li>
                <li><strong>Force Majeure:</strong> Not liable for circumstances beyond reasonable control</li>
                <li><strong>Statutory Rights:</strong> Nothing limits statutory consumer protection rights</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">7.5 Indemnification</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Organiser Indemnity:</strong> Indemnify LodgeTix against claims arising from your events or conduct</li>
                <li><strong>Third-Party Claims:</strong> Cover claims from attendees or third parties related to your events</li>
                <li><strong>Legal Costs:</strong> Bear reasonable legal costs for defending covered claims</li>
                <li><strong>Compliance Failures:</strong> Indemnify against claims arising from non-compliance with laws</li>
                <li><strong>Breach of Terms:</strong> Cover claims arising from breach of these Terms</li>
                <li><strong>Notification:</strong> Prompt notification required for all potential claims</li>
              </ul>
            </section>

            {/* Section 8: Termination and Survival */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Termination and Survival</h2>

              <h3 className="text-lg font-medium mb-3">8.1 Termination by Organiser</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Voluntary Termination:</strong> Terminate organiser account with 30 days written notice</li>
                <li><strong>Outstanding Obligations:</strong> Complete all outstanding events and financial obligations</li>
                <li><strong>Data Export:</strong> Export necessary event and attendee data before termination</li>
                <li><strong>Refund Responsibilities:</strong> Continue refund obligations for existing registrations</li>
                <li><strong>Final Settlement:</strong> Complete final settlement of all outstanding payments</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">8.2 Termination by LodgeTix</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Cause-Based Termination:</strong> Immediate termination for material breach or illegal activity</li>
                <li><strong>Notice Period:</strong> 30 days notice for non-material breaches with opportunity to cure</li>
                <li><strong>Risk-Based Termination:</strong> Immediate termination for high-risk activities</li>
                <li><strong>Regulatory Compliance:</strong> Termination for failure to meet regulatory requirements</li>
                <li><strong>Payment Issues:</strong> Termination for persistent payment or settlement problems</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">8.3 Effect of Termination</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Account Access:</strong> Immediate revocation of platform access</li>
                <li><strong>Event Continuation:</strong> Existing events may continue subject to attendee protection</li>
                <li><strong>Financial Settlement:</strong> Final settlement subject to outstanding obligations</li>
                <li><strong>Data Retention:</strong> Data retained according to legal and regulatory requirements</li>
                <li><strong>Surviving Obligations:</strong> Indemnification and confidentiality obligations survive termination</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">8.4 Survival Provisions</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Financial Obligations:</strong> All payment and refund obligations survive</li>
                <li><strong>Liability Limitations:</strong> Limitation of liability provisions survive</li>
                <li><strong>Dispute Resolution:</strong> Dispute resolution procedures survive</li>
                <li><strong>Confidentiality:</strong> Confidentiality obligations survive indefinitely</li>
                <li><strong>Intellectual Property:</strong> Intellectual property provisions survive</li>
              </ul>
            </section>

            {/* Section 9: Contact Information and Support */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Contact Information and Support</h2>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Event Organiser Support</h3>
                <p><strong>{COMPANY_INFO.legalName}</strong><br />
                Trading as: {COMPANY_INFO.tradingName}<br />
                ABN: {COMPANY_INFO.abn}<br />
                {COMPANY_INFO.address.street}<br />
                {COMPANY_INFO.address.suburb} {COMPANY_INFO.address.state} {COMPANY_INFO.address.postcode}<br />
                {COMPANY_INFO.address.country}<br />
                Phone: {COMPANY_INFO.contact.phone}<br />
                Email: {COMPANY_INFO.contact.email}<br />
                Organiser Support: {COMPANY_INFO.contact.supportEmail}<br />
                Legal Issues: legal@lodgetix.io</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-medium mb-3 text-blue-800">Stripe Connect Support</h3>
                <p className="text-blue-800">
                  For payment processing issues, KYC/verification problems, or settlement queries, 
                  contact our organiser support team immediately. We provide escalation pathways 
                  to Stripe support for complex payment processing issues.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-medium mb-3 text-green-800">Emergency Support</h3>
                <p className="text-green-800">
                  For urgent issues affecting live events or payment processing, use our 
                  emergency support channel: emergency@lodgetix.io or call {COMPANY_INFO.contact.phone} 
                  during business hours.
                </p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600">
                These Event Organiser Terms of Service were last updated on {DateFormatters.getLastUpdatedDate()} 
                and are effective immediately. By using our organiser services, you acknowledge that you have read, 
                understood, and agreed to be bound by these Terms.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This document includes all required Stripe Connect clauses, Australian KYC/KYB compliance requirements, 
                AUSTRAC and ASIC compliance obligations, and Masonic-specific terms applicable to event organisers 
                using the {COMPANY_INFO.tradingName} platform operated by {COMPANY_INFO.legalName}.
              </p>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                These Terms supplement and do not replace our general Terms of Service, Privacy Policy, 
                or any specific event terms and conditions.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}