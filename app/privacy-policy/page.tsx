import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LifebuoyIcon, NewspaperIcon, PhoneIcon } from '@heroicons/react/20/solid'
import { COMPANY_INFO, CompanyFormatters, DateFormatters } from '@/lib/constants/company-details'

const supportCards = [
  {
    name: 'Data Protection',
    description: 'How we collect, use, and protect your personal information in compliance with Australian law.',
    icon: LifebuoyIcon,
  },
  {
    name: 'Your Rights',
    description: 'Understanding your privacy rights and how to exercise them under Australian privacy legislation.',
    icon: PhoneIcon,
  },
  {
    name: 'Contact Privacy Officer',
    description: 'Questions about privacy? Contact our dedicated Privacy Officer for assistance.',
    icon: NewspaperIcon,
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
              Your privacy is important to us. Learn how we collect, use, and protect your personal information 
              in compliance with Australian privacy laws and Masonic values.
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
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <CardDescription className="text-base">
                {COMPANY_INFO.legalName} - LodgeTix Platform<br />
                Last updated: {DateFormatters.getLastUpdatedDate()}
              </CardDescription>
            </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="text-lg font-medium mb-2 text-blue-800">Looking for a Simpler Version?</h3>
              <p className="text-blue-700">
                This is our comprehensive privacy policy. For a user-friendly summary, see our 
                <a href="/privacy" className="text-blue-600 hover:underline ml-1 mr-1">Simple Privacy Policy</a>
                which covers the same information in plain English.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. About This Privacy Policy</h2>
              <p className="mb-4">
                This Privacy Policy explains how {COMPANY_INFO.legalName} (ABN: {COMPANY_INFO.abn}) 
                ("Winding Stair", "we", "us", or "our"), operating the LodgeTix platform, collects, uses, 
                discloses, and manages your personal information through our event ticketing services ("Services").
              </p>
              <p className="mb-4">
                We are committed to protecting your privacy and complying with the Privacy Act 1988 (Cth) and the 
                Australian Privacy Principles (APPs). For international users, we also comply with applicable provisions 
                of the General Data Protection Regulation (GDPR) where relevant. This policy applies to all personal 
                information we collect about you when you use our Services.
              </p>
              <p className="mb-4">
                <strong>Our Contact Details:</strong><br />
                {COMPANY_INFO.legalName}<br />
                {CompanyFormatters.getAddressLines().join(', ')}<br />
                Phone: <a href={CompanyFormatters.getPhoneLink()}>{COMPANY_INFO.contact.phone}</a><br />
                Email: <a href={CompanyFormatters.getEmailLink()}>{COMPANY_INFO.contact.email}</a><br />
                Privacy Officer: <a href="mailto:privacy@lodgetix.io">privacy@lodgetix.io</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Personal Information We Collect (Including Masonic-Specific Data)</h2>
              
              <h3 className="text-lg font-medium mb-3">2.1 Information You Provide</h3>
              <p className="mb-4">We collect personal information that you voluntarily provide to us, including:</p>
              
              <h4 className="text-base font-medium mb-2">2.1.1 Basic Registration Information</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Identity Information:</strong> Full name, title, email address, phone number, postal address</li>
                <li><strong>Account Information:</strong> Username, password (encrypted), profile preferences</li>
                <li><strong>Demographic Information:</strong> Age, gender (where provided voluntarily)</li>
              </ul>

              <h4 className="text-base font-medium mb-2">2.1.2 Masonic-Specific Information</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Lodge Membership:</strong> Lodge name, lodge number, current membership status</li>
                <li><strong>Grand Lodge Affiliation:</strong> Grand Lodge jurisdiction, recognition status</li>
                <li><strong>Masonic Rank and Office:</strong> Current and past offices held, degrees attained</li>
                <li><strong>Membership History:</strong> Years of membership, previous lodge affiliations</li>
                <li><strong>Masonic Titles:</strong> Honorary titles, appointments, decorations</li>
                <li><strong>Event Eligibility Data:</strong> Qualification for specific degrees or ceremonies</li>
                <li><strong>Visitor Verification:</strong> Documentation for visiting other lodges or jurisdictions</li>
                <li><strong>Lodge Contact Details:</strong> Secretary contact information for verification purposes</li>
              </ul>

              <h4 className="text-base font-medium mb-2">2.1.3 Event and Registration Information</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Event Preferences:</strong> Dietary requirements, accessibility needs, special arrangements</li>
                <li><strong>Emergency Contacts:</strong> Contact details for emergency situations during events</li>
                <li><strong>Companion Information:</strong> Details of guests or partners attending events</li>
                <li><strong>Accommodation Preferences:</strong> Seating preferences, table assignments</li>
              </ul>

              <h4 className="text-base font-medium mb-2">2.1.4 Financial and Payment Information</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Billing Information:</strong> Billing name, address, tax identification (if applicable)</li>
                <li><strong>Payment Method:</strong> Credit card details (securely processed by Stripe), bank account information</li>
                <li><strong>Transaction History:</strong> Purchase records, refund requests, payment disputes</li>
                <li><strong>Stripe Connect Data:</strong> Information processed through our payment partner for marketplace transactions</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.2 Information We Collect Automatically</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Technical Information:</strong> IP address, browser type and version, device information, operating system</li>
                <li><strong>Usage Information:</strong> Pages visited, time spent on pages, click-through rates, user interactions, search queries</li>
                <li><strong>Location Information:</strong> General location based on IP address (we do not collect precise location)</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, analytics cookies, preference cookies, security tokens</li>
                <li><strong>Performance Data:</strong> Load times, error logs, system performance metrics</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">2.3 Information From Third Parties</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Payment Processors (Stripe):</strong> Transaction confirmations, payment status, fraud prevention data</li>
                <li><strong>Lodge Secretaries:</strong> Member verification, lodge affiliation confirmation, membership status updates</li>
                <li><strong>Grand Lodge Officials:</strong> Recognition status, membership verification, disciplinary status (where relevant)</li>
                <li><strong>Event Organisers:</strong> Additional attendee information, special requirements, seating arrangements</li>
                <li><strong>Other Masonic Bodies:</strong> Cross-jurisdictional membership verification, visitor credentials</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. How We Use Your Personal Information</h2>
              
              <h3 className="text-lg font-medium mb-3">3.1 Primary Purposes</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Event Registration and Management:</strong> Process registrations, manage bookings, allocate tickets and seating</li>
                <li><strong>Payment Processing:</strong> Process payments through Stripe Connect, issue receipts, manage refunds and disputes</li>
                <li><strong>Masonic Verification:</strong> Verify membership eligibility, confirm lodge affiliation, validate event access rights</li>
                <li><strong>Event Coordination:</strong> Coordinate catering requirements, accessibility needs, special arrangements</li>
                <li><strong>Communication:</strong> Send confirmation emails, event updates, important notifications, and booking confirmations</li>
                <li><strong>Customer Support:</strong> Respond to inquiries, resolve technical issues, provide assistance with registrations</li>
                <li><strong>Security and Fraud Prevention:</strong> Protect against fraudulent transactions, unauthorised access, and misuse</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.2 Secondary Purposes</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Service Improvement:</strong> Analyse usage patterns, improve functionality, enhance user experience</li>
                <li><strong>Marketing (with consent):</strong> Notify about future events, send newsletters, promotional content</li>
                <li><strong>Analytics and Research:</strong> Understand user behaviour, event preferences, system performance</li>
                <li><strong>Legal Compliance:</strong> Meet Australian and international legal obligations, respond to law enforcement</li>
                <li><strong>Business Operations:</strong> Financial reporting, auditing, risk management</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">3.3 Stripe Connect Marketplace Processing</h3>
              <p className="mb-4">
                As a Stripe Connect marketplace, we facilitate payments between event organisers and attendees. 
                Your payment information is processed by Stripe Inc. in accordance with their privacy policy and 
                PCI DSS compliance standards. We receive limited payment information necessary for transaction 
                processing and record-keeping.
              </p>

              <h3 className="text-lg font-medium mb-3">3.4 Legal Basis for Processing</h3>
              <p className="mb-4">Under Australian privacy law and GDPR (where applicable), we process your personal information based on:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Consent:</strong> Where you have provided explicit consent for specific purposes (marketing, analytics)</li>
                <li><strong>Contract Performance:</strong> To fulfil our obligations in providing ticketing services to you</li>
                <li><strong>Legitimate Interests:</strong> For improving services, security, fraud prevention, and business operations</li>
                <li><strong>Legal Obligation:</strong> To comply with Australian laws, tax obligations, and regulatory requirements</li>
                <li><strong>Vital Interests:</strong> For emergency situations during events where your safety is at risk</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Disclosure of Personal Information (Including Stripe Requirements)</h2>
              
              <h3 className="text-lg font-medium mb-3">4.1 When We Share Your Information</h3>
              <p className="mb-4">We may disclose your personal information to the following parties:</p>
              
              <h4 className="text-base font-medium mb-2">4.1.1 Event and Masonic-Related Disclosures</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Event Organisers:</strong> Lodge officers, event coordinators, and organisers for events you register for</li>
                <li><strong>Lodge Officials:</strong> Secretaries and officers for membership verification and event eligibility</li>
                <li><strong>Grand Lodge Officials:</strong> For membership verification, recognition status, and administrative purposes</li>
                <li><strong>Other Masonic Bodies:</strong> Related lodges, appendant bodies, for cross-jurisdictional verification</li>
                <li><strong>Catering and Venue Providers:</strong> Dietary requirements, accessibility needs, guest counts</li>
              </ul>

              <h4 className="text-base font-medium mb-2">4.1.2 Service Providers and Business Partners</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Payment Processors:</strong> Stripe Inc. for payment processing, fraud prevention, and financial services</li>
                <li><strong>Technology Providers:</strong> Hosting, database, email delivery, analytics, and security services</li>
                <li><strong>Professional Advisers:</strong> Lawyers, accountants, auditors, consultants, and other professional service providers</li>
                <li><strong>Emergency Services:</strong> Medical or safety personnel in case of emergency during events</li>
              </ul>

              <h4 className="text-base font-medium mb-2">4.1.3 Legal and Regulatory Disclosures</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Government Agencies:</strong> When required by law, court order, subpoena, or regulatory request</li>
                <li><strong>Law Enforcement:</strong> For investigation of crimes, fraud prevention, or public safety</li>
                <li><strong>Tax Authorities:</strong> For compliance with tax reporting obligations</li>
                <li><strong>Regulatory Bodies:</strong> Australian Transaction Reports and Analysis Centre (AUSTRAC), ASIC, OAIC</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.2 Stripe Connect Marketplace Disclosures</h3>
              <p className="mb-4">
                As required by Stripe Connect marketplace terms, we disclose that:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Payment processing is handled by Stripe, Inc. (US) and Stripe Payments Australia Pty Ltd (Australia)</li>
                <li>Your payment information is subject to Stripe's Privacy Policy available at stripe.com/privacy</li>
                <li>Transaction data may be shared with event organisers for reconciliation and reporting purposes</li>
                <li>We may share aggregated, de-identified transaction data for business analytics</li>
                <li>Stripe may share information with us for fraud prevention, compliance, and risk management</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">4.3 Third-Party Service Providers</h3>
              <p className="mb-4">We work with the following categories of service providers who may access your personal information:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Stripe:</strong> Payment processing, marketplace facilitation, fraud prevention, financial reporting</li>
                <li><strong>Supabase:</strong> Database hosting, user authentication, real-time data synchronisation</li>
                <li><strong>Resend:</strong> Transactional email delivery, marketing communications, notification services</li>
                <li><strong>Vercel:</strong> Web hosting, content delivery network, performance optimisation</li>
                <li><strong>Google Analytics:</strong> Website analytics, user behaviour analysis, performance monitoring</li>
                <li><strong>Sentry:</strong> Error monitoring, performance tracking, security incident detection</li>
              </ul>
              <p className="mb-4">
                All service providers are contractually bound to protect your information, use it only for specified 
                purposes, and maintain appropriate security standards. We conduct due diligence on all providers 
                to ensure they meet our privacy and security requirements.
              </p>

              <h3 className="text-lg font-medium mb-3">4.4 International Transfers</h3>
              <p className="mb-4">
                Some of our service providers are located overseas, primarily in the United States and European Union. 
                When we transfer your personal information internationally, we ensure appropriate safeguards are in place:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Adequacy decisions where the destination country has adequate privacy protections</li>
                <li>Binding Corporate Rules for multinational service providers</li>
                <li>Certification schemes such as Privacy Shield (where still applicable)</li>
                <li>Explicit consent for transfers where other safeguards are not available</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Data Security and Storage</h2>
              
              <h3 className="text-lg font-medium mb-3">5.1 Security Measures</h3>
              <p className="mb-4">We implement comprehensive security measures to protect your personal information:</p>
              
              <h4 className="text-base font-medium mb-2">5.1.1 Technical Security</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Encryption:</strong> Data encrypted in transit using TLS 1.3 and at rest using AES-256 encryption</li>
                <li><strong>Access Controls:</strong> Role-based access control, principle of least privilege, multi-factor authentication</li>
                <li><strong>Infrastructure Security:</strong> Secure cloud hosting, firewalls, intrusion detection and prevention systems</li>
                <li><strong>Database Security:</strong> Row-level security (RLS), encrypted database connections, regular security updates</li>
                <li><strong>Application Security:</strong> Secure coding practices, regular security testing, vulnerability assessments</li>
              </ul>

              <h4 className="text-base font-medium mb-2">5.1.2 Operational Security</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Monitoring:</strong> 24/7 security monitoring, automated threat detection, incident response procedures</li>
                <li><strong>Staff Training:</strong> Regular privacy and security training for all personnel with data access</li>
                <li><strong>Access Management:</strong> Regular access reviews, immediate termination of access for former employees</li>
                <li><strong>Vendor Management:</strong> Security assessments of all third-party providers, contractual security requirements</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.2 Data Retention Periods</h3>
              <p className="mb-4">We retain your personal information according to the following schedule:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Financial Records:</strong> 7 years (Australian legal requirement for tax and business records)</li>
                <li><strong>Event Registration Data:</strong> 7 years for liability and insurance purposes</li>
                <li><strong>Masonic Verification Data:</strong> Until membership status changes or as required for ongoing verification</li>
                <li><strong>Marketing Data:</strong> Until you unsubscribe or withdraw consent</li>
                <li><strong>Technical Logs:</strong> 2 years for security and troubleshooting purposes</li>
                <li><strong>Account Data:</strong> Until account deletion is requested (subject to legal retention requirements)</li>
                <li><strong>Payment Data:</strong> As required by Stripe and financial regulations (typically 7 years)</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">5.3 Data Location and Processing</h3>
              <p className="mb-4">
                Your data is primarily stored and processed in Australia through our service providers. 
                Some processing may occur in the United States (Stripe, Vercel) and other jurisdictions 
                where our service providers operate, always with appropriate safeguards in place.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Your Privacy Rights (Australian & International)</h2>
              
              <h3 className="text-lg font-medium mb-3">6.1 Under Australian Privacy Law</h3>
              <p className="mb-4">Under the Privacy Act 1988 and Australian Privacy Principles, you have the right to:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Access:</strong> Request copies of personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate, incomplete, or out-of-date information</li>
                <li><strong>Complaint:</strong> Lodge a complaint about our handling of your personal information</li>
                <li><strong>Anonymity:</strong> Deal with us anonymously or using a pseudonym where practicable</li>
                <li><strong>Notification:</strong> Be notified of data breaches likely to cause serious harm</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.2 Additional Rights (GDPR and Best Practice)</h3>
              <p className="mb-4">Where applicable, we also provide the following rights:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Data Portability:</strong> Export your data in a structured, machine-readable format</li>
                <li><strong>Erasure ("Right to be Forgotten"):</strong> Request deletion of your personal information</li>
                <li><strong>Restriction of Processing:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests or direct marketing</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for marketing, analytics, or other consent-based processing</li>
                <li><strong>Automated Decision-Making:</strong> Request human intervention in automated processing decisions</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.3 Limitations on Rights</h3>
              <p className="mb-4">Your privacy rights may be limited in certain circumstances:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Legal or regulatory requirements to retain certain information</li>
                <li>Ongoing legal proceedings or investigations</li>
                <li>Legitimate business interests (fraud prevention, security)</li>
                <li>Rights of other individuals whose information might be affected</li>
                <li>Technical limitations in data extraction or deletion</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">6.4 How to Exercise Your Rights</h3>
              <p className="mb-4">To exercise any of these rights, please contact us:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Email: <a href="mailto:privacy@lodgetix.io">privacy@lodgetix.io</a> (preferred method)</li>
                <li>Phone: <a href={CompanyFormatters.getPhoneLink()}>{COMPANY_INFO.contact.phone}</a> during business hours (9 AM - 5 PM AEST)</li>
                <li>Post: Privacy Officer, {COMPANY_INFO.legalName}, {CompanyFormatters.getFullAddress()}</li>
              </ul>
              <p className="mb-4">
                <strong>Response Timeframes:</strong> We will acknowledge your request within 5 business days and 
                provide a full response within 30 days (Australian law) or 1 month (GDPR). Complex requests may 
                require additional time, and we will notify you of any delays.
              </p>
              <p className="mb-4">
                <strong>Identity Verification:</strong> We may need to verify your identity before processing your 
                request to prevent unauthorised access to your personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Cookies and Tracking Technologies</h2>
              
              <h3 className="text-lg font-medium mb-3">7.1 Types of Cookies We Use</h3>
              
              <h4 className="text-base font-medium mb-2">7.1.1 Essential Cookies (Always Active)</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Authentication:</strong> Keep you logged in securely during your session</li>
                <li><strong>Security:</strong> Protect against cross-site request forgery and other security threats</li>
                <li><strong>Functionality:</strong> Remember your preferences, settings, and form data</li>
                <li><strong>Load Balancing:</strong> Ensure optimal performance and availability</li>
              </ul>

              <h4 className="text-base font-medium mb-2">7.1.2 Analytics Cookies (With Consent)</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Google Analytics:</strong> Understand how visitors use our website, popular content, user journeys</li>
                <li><strong>Performance Monitoring:</strong> Track page load times, error rates, system performance</li>
                <li><strong>A/B Testing:</strong> Test different versions of pages to improve user experience</li>
              </ul>

              <h4 className="text-base font-medium mb-2">7.1.3 Marketing Cookies (With Consent)</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Conversion Tracking:</strong> Measure effectiveness of marketing campaigns</li>
                <li><strong>Retargeting:</strong> Show relevant advertisements on other websites</li>
                <li><strong>Social Media:</strong> Enable sharing functionality and track social media referrals</li>
              </ul>

              <h3 className="text-lg font-Medium mb-3">7.2 Managing Your Cookie Preferences</h3>
              <p className="mb-4">You can control cookies through several methods:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Cookie Banner:</strong> Manage preferences through our cookie consent banner on first visit</li>
                <li><strong>Account Settings:</strong> Update cookie preferences in your account dashboard</li>
                <li><strong>Browser Settings:</strong> Configure cookie settings directly in your web browser</li>
                <li><strong>Opt-Out Tools:</strong> Use industry opt-out tools for advertising cookies</li>
              </ul>
              <p className="mb-4">
                <strong>Note:</strong> Disabling essential cookies may affect website functionality, including the 
                ability to log in, make purchases, or access certain features.
              </p>

              <h3 className="text-lg font-medium mb-3">7.3 Other Tracking Technologies</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Web Beacons:</strong> Small images that help us understand email engagement and website usage</li>
                <li><strong>Local Storage:</strong> Browser storage for temporary data and user preferences</li>
                <li><strong>Session Storage:</strong> Temporary storage that expires when you close your browser</li>
                <li><strong>Fingerprinting:</strong> We do not use device fingerprinting for tracking purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Marketing and Communications</h2>
              
              <h3 className="text-lg font-medium mb-3">8.1 Types of Communications</h3>
              
              <h4 className="text-base font-medium mb-2">8.1.1 Transactional Communications (No Opt-Out)</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Booking confirmations and receipts</li>
                <li>Event updates and changes</li>
                <li>Payment notifications and refund confirmations</li>
                <li>Account security alerts</li>
                <li>Important service announcements</li>
                <li>Legal notices and policy updates</li>
              </ul>

              <h4 className="text-base font-medium mb-2">8.1.2 Marketing Communications (Opt-In Required)</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Event announcements and invitations</li>
                <li>Newsletter and updates about new features</li>
                <li>Promotional offers and discounts</li>
                <li>Surveys and feedback requests</li>
                <li>Educational content about Masonic events</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">8.2 Marketing Consent</h3>
              <p className="mb-4">
                We will only send you marketing communications where you have:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Explicitly consented to receive marketing communications</li>
                <li>An existing customer relationship and the communication relates to similar services</li>
                <li>Been given a clear opportunity to opt-out in every communication</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">8.3 Unsubscribing and Preferences</h3>
              <p className="mb-4">You can manage your communication preferences by:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Clicking the unsubscribe link in any marketing email</li>
                <li>Updating preferences in your account settings</li>
                <li>Contacting us at <a href="mailto:privacy@lodgetix.io">privacy@lodgetix.io</a></li>
                <li>Calling us at <a href={CompanyFormatters.getPhoneLink()}>{COMPANY_INFO.contact.phone}</a></li>
              </ul>
              <p className="mb-4">
                <strong>Important:</strong> Unsubscribing from marketing communications does not affect essential 
                transactional communications related to your bookings, account, or legal obligations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Children's Privacy</h2>
              
              <h3 className="text-lg font-medium mb-3">9.1 Age Restrictions</h3>
              <p className="mb-4">
                Our Services are not intended for children under 13 years of age. We do not knowingly collect, 
                use, or disclose personal information from children under 13. If we become aware that we have 
                collected personal information from a child under 13, we will take immediate steps to delete 
                such information from our systems.
              </p>

              <h3 className="text-lg font-medium mb-3">9.2 Minors Aged 13-18</h3>
              <p className="mb-4">
                For attendees between 13-18 years of age, we require:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Parental or guardian consent before collecting their personal information</li>
                <li>Verification of parental authority before processing registrations</li>
                <li>Parental access to their child's personal information upon request</li>
                <li>Parental ability to request deletion of their child's information</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">9.3 Masonic Context</h3>
              <p className="mb-4">
                Given the adult nature of Masonic activities, most events are restricted to adults aged 18 and over. 
                However, some family events may include minors, and in such cases, the above protections apply.
              </p>

              <h3 className="text-lg font-medium mb-3">9.4 Reporting Concerns</h3>
              <p className="mb-4">
                If you believe we have collected information from a child under 13, or if you are a parent or 
                guardian with concerns about your child's information, please contact us immediately at 
                <a href="mailto:privacy@lodgetix.io">privacy@lodgetix.io</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Data Breach Notification</h2>
              
              <h3 className="text-lg font-medium mb-3">10.1 Our Breach Response Procedure</h3>
              <p className="mb-4">
                In the event of a data breach that is likely to result in serious harm to individuals, we will:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Immediate Response (within 1 hour):</strong> Contain the breach and assess the scope</li>
                <li><strong>Investigation (within 24 hours):</strong> Determine the cause, extent, and type of data affected</li>
                <li><strong>OAIC Notification (within 72 hours):</strong> Notify the Office of the Australian Information Commissioner</li>
                <li><strong>Individual Notification (without unreasonable delay):</strong> Notify affected individuals if high risk</li>
                <li><strong>Remediation:</strong> Take steps to prevent similar breaches and offer support to affected individuals</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">10.2 What We Will Tell You</h3>
              <p className="mb-4">Our breach notification will include:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Description of the nature of the data breach</li>
                <li>Types of personal information that were or may have been involved</li>
                <li>Steps we have taken to address the breach</li>
                <li>Recommendations for steps you can take to protect yourself</li>
                <li>Contact information for further inquiries</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">10.3 Your Response Options</h3>
              <p className="mb-4">If you are affected by a data breach, you may:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Contact us for more information about the breach</li>
                <li>Request details about what specific information was affected</li>
                <li>Ask what steps we are taking to prevent future breaches</li>
                <li>Lodge a complaint with us or the OAIC</li>
                <li>Seek compensation if you have suffered harm</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
              
              <h3 className="text-lg font-medium mb-3">11.1 When We Update This Policy</h3>
              <p className="mb-4">We may update this Privacy Policy to reflect:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Changes in our data processing practices</li>
                <li>New features or services we offer</li>
                <li>Changes in applicable laws or regulations</li>
                <li>Changes in technology or security practices</li>
                <li>Feedback from users or regulatory authorities</li>
                <li>Business changes such as mergers or acquisitions</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">11.2 How We Notify You of Changes</h3>
              <p className="mb-4">When we make changes, we will:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Post the updated policy on our website with a new "last updated" date</li>
                <li>Highlight significant changes in a summary at the top of the policy</li>
                <li>Send email notification for material changes that affect your rights</li>
                <li>Provide prominent website notices for significant changes</li>
                <li>Seek fresh consent where required by law for new purposes</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">11.3 Your Options</h3>
              <p className="mb-4">After we update our Privacy Policy, you may:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Continue using our services under the new policy</li>
                <li>Contact us with questions about the changes</li>
                <li>Exercise your rights to object or withdraw consent</li>
                <li>Close your account if you disagree with material changes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Complaints and Contact Information</h2>
              
              <h3 className="text-lg font-medium mb-3">12.1 Contacting Our Privacy Officer</h3>
              <p className="mb-4">
                If you have any questions, concerns, or complaints about how we handle your personal information, 
                please contact our Privacy Officer:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Privacy Officer</strong><br />
                {COMPANY_INFO.legalName}<br />
                {CompanyFormatters.getAddressLines()[0]}<br />
                {CompanyFormatters.getAddressLines()[1]}<br />
                {CompanyFormatters.getAddressLines()[2]}<br />
                Email: <a href="mailto:privacy@lodgetix.io">privacy@lodgetix.io</a><br />
                Phone: <a href={CompanyFormatters.getPhoneLink()}>{COMPANY_INFO.contact.phone}</a><br />
                Business Hours: Monday to Friday, 9:00 AM - 5:00 PM (AEST)</p>
              </div>

              <h3 className="text-lg font-medium mb-3">12.2 Our Complaint Process</h3>
              <p className="mb-4">When you contact us with a complaint, we will:</p>
              <ol className="list-decimal list-inside space-y-2 mb-4">
                <li><strong>Acknowledge (within 5 business days):</strong> Confirm receipt and provide a reference number</li>
                <li><strong>Investigate (within 30 days):</strong> Thoroughly review your complaint and gather relevant information</li>
                <li><strong>Respond (within 30 days):</strong> Provide a detailed written response with our findings and any remedial action</li>
                <li><strong>Follow-up:</strong> Ensure any agreed actions are completed and you are satisfied with the resolution</li>
              </ol>

              <h3 className="text-lg font-medium mb-3">12.3 External Complaint Options</h3>
              <p className="mb-4">
                If you are not satisfied with our response to your complaint, you may lodge a complaint with 
                the Office of the Australian Information Commissioner (OAIC):
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Office of the Australian Information Commissioner (OAIC)</strong><br />
                Website: <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">www.oaic.gov.au</a><br />
                Phone: <a href="tel:1300363992">1300 363 992</a><br />
                Email: <a href="mailto:enquiries@oaic.gov.au">enquiries@oaic.gov.au</a><br />
                Online Complaint Form: <a href="https://www.oaic.gov.au/privacy/privacy-complaints" target="_blank" rel="noopener noreferrer">oaic.gov.au/privacy/privacy-complaints</a></p>
              </div>

              <h3 className="text-lg font-medium mb-3">12.4 International Users</h3>
              <p className="mb-4">If you are located outside Australia, you may also have the right to lodge a complaint with:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>European Users:</strong> Your local Data Protection Authority under GDPR</li>
                <li><strong>UK Users:</strong> Information Commissioner's Office (ICO)</li>
                <li><strong>New Zealand Users:</strong> Privacy Commissioner of New Zealand</li>
                <li><strong>Canadian Users:</strong> Privacy Commissioner of Canada or provincial privacy commissioner</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">13. Definitions</h2>
              <p className="mb-4">For the purposes of this Privacy Policy, the following definitions apply:</p>
              
              <h3 className="text-lg font-medium mb-3">13.1 Privacy and Data Terms</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Personal Information:</strong> Information or opinion about an identified individual or reasonably identifiable individual, recorded in any form</li>
                <li><strong>Sensitive Information:</strong> Information about health, racial or ethnic origin, political opinions, religious beliefs, trade union membership, criminal record, biometric data, or sexual orientation</li>
                <li><strong>Processing:</strong> Any operation performed on personal information including collection, recording, use, disclosure, storage, combination, erasure, or destruction</li>
                <li><strong>Data Controller:</strong> {COMPANY_INFO.legalName} as the entity that determines the purposes and means of processing personal information</li>
                <li><strong>Data Processor:</strong> Third-party service providers who process personal information on our behalf under contract</li>
                <li><strong>Pseudonymisation:</strong> Processing personal information so it can no longer be attributed to a specific individual without additional information</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">13.2 Technical Terms</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Cookies:</strong> Small text files stored on your device by websites to remember information about your visit</li>
                <li><strong>IP Address:</strong> A unique numerical identifier assigned to your device when connected to the internet</li>
                <li><strong>Encryption:</strong> Process of converting information into a coded format to prevent unauthorised access</li>
                <li><strong>TLS/SSL:</strong> Security protocols that encrypt data transmitted between your browser and our servers</li>
                <li><strong>Two-Factor Authentication (2FA):</strong> Security method requiring two different forms of identification</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">13.3 Masonic Terms</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Lodge:</strong> A local organisation of Freemasons that meets regularly</li>
                <li><strong>Grand Lodge:</strong> The governing body of Freemasonry in a particular jurisdiction</li>
                <li><strong>Recognition:</strong> Formal acknowledgment between Grand Lodges allowing visitation and interaction</li>
                <li><strong>Visitor:</strong> A Mason from another lodge or jurisdiction attending a meeting or event</li>
                <li><strong>Masonic Rank:</strong> Degrees or offices held within the Masonic organisation</li>
                <li><strong>Jurisdiction:</strong> Geographic area under the authority of a particular Grand Lodge</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">13.4 Legal Terms</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Privacy Act 1988:</strong> Australian federal legislation governing the handling of personal information</li>
                <li><strong>Australian Privacy Principles (APPs):</strong> Thirteen principles in the Privacy Act that regulate personal information handling</li>
                <li><strong>GDPR:</strong> General Data Protection Regulation - European Union privacy regulation</li>
                <li><strong>Data Breach:</strong> Unauthorised access, disclosure, or loss of personal information</li>
                <li><strong>Consent:</strong> Voluntary agreement to the collection, use, or disclosure of personal information</li>
                <li><strong>Legitimate Interest:</strong> Legal basis for processing personal information for reasonable business purposes</li>
              </ul>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600">
                <strong>Document Information:</strong><br />
                This Privacy Policy was last updated on {DateFormatters.getLastUpdatedDate()} and is effective immediately.<br />
                This policy is governed by the {COMPANY_INFO.jurisdiction.governingLaw} and Australian Privacy Act 1988.<br />
                Document Version: 2.0 | Policy Owner: Privacy Officer | Review Date: {DateFormatters.formatDateAU(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))}
              </p>
            </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}