"use client";

import React from 'react';
import Link from 'next/link';
import { MasonicLogo } from '@/components/masonic-logo';

export default function LimitedAgentTermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <MasonicLogo size="sm" />
              <span className="text-lg font-semibold text-masonic-navy">LodgeTix</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/software" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
                Software
              </Link>
              <Link href="/software/pricing" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
                Pricing
              </Link>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-masonic-navy">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-masonic-navy mb-8">Limited Agent Terms</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-sm text-gray-600 mb-8">
            Effective Date: 1 January 2025 | Last Updated: 21 June 2025
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <p className="text-sm">
              <strong>Important Notice:</strong> These Limited Agent Terms form part of and must be read in conjunction with the LodgeTix Terms of Service. By using LodgeTix as a limited agent for payment collection, Event Organisers agree to be bound by these terms.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">1. LIMITED AGENT APPOINTMENT</h2>
            
            <h3 className="text-xl font-semibold mb-3">1.1 Appointment and Scope</h3>
            <p className="mb-4">
              By electing to use LodgeTix's payment collection services, the Event Organiser ("Principal") hereby appoints LodgeTix Pty Ltd ACN 670 891 593 ("Agent", "we", "us", "our") as its limited agent solely and exclusively for the purpose of:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Collecting payments from Attendees on behalf of the Principal;</li>
              <li>Processing such payments through the Agent's designated payment processing facilities;</li>
              <li>Holding collected funds in accordance with these terms; and</li>
              <li>Remitting collected funds to the Principal in accordance with the settlement procedures set forth herein.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">1.2 Limited Nature of Appointment</h3>
            <p className="mb-4">
              The Principal expressly acknowledges and agrees that:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>This appointment is strictly limited to payment collection and related administrative functions;</li>
              <li>The Agent has no authority to bind the Principal in any other manner;</li>
              <li>The Agent is not authorised to make any representations or warranties on behalf of the Principal;</li>
              <li>The Agent has no authority to modify, alter, or waive any terms of the contract between the Principal and Attendees;</li>
              <li>The relationship created hereby is that of principal and limited agent only, and does not constitute a partnership, joint venture, employment relationship, or any other form of association.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">1.3 Non-Exclusive Appointment</h3>
            <p className="mb-4">
              This appointment is non-exclusive. The Principal retains the absolute right to:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Collect payments directly from Attendees;</li>
              <li>Appoint other agents or service providers for payment collection;</li>
              <li>Use alternative payment methods or platforms; and</li>
              <li>Conduct its business in any manner it deems appropriate.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">2. SCOPE OF AGENCY</h2>
            
            <h3 className="text-xl font-semibold mb-3">2.1 Authorised Activities</h3>
            <p className="mb-4">
              The Agent is authorised solely to:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Display payment collection interfaces on the Platform;</li>
              <li>Accept credit card, debit card, and other approved payment methods from Attendees;</li>
              <li>Process payment transactions through Square, Inc. or other designated payment processors;</li>
              <li>Issue payment receipts to Attendees on behalf of the Principal;</li>
              <li>Maintain records of payment transactions;</li>
              <li>Provide transaction reporting to the Principal;</li>
              <li>Deduct agreed fees and charges before remittance;</li>
              <li>Handle payment-related customer service inquiries; and</li>
              <li>Process refunds in accordance with the Principal's instructions and policies.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">2.2 Unauthorised Activities</h3>
            <p className="mb-4">
              The Agent is expressly NOT authorised to:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Modify event details, pricing, or terms without Principal's express written consent;</li>
              <li>Make any representations about the event beyond those provided by the Principal;</li>
              <li>Guarantee event quality, outcomes, or Attendee satisfaction;</li>
              <li>Accept liability for event cancellation, postponement, or changes;</li>
              <li>Negotiate or modify contracts with Attendees;</li>
              <li>Provide advice on event content, safety, or compliance matters;</li>
              <li>Make decisions regarding event operations or management;</li>
              <li>Bind the Principal to any obligations beyond payment collection; or</li>
              <li>Use collected funds for any purpose other than remittance to the Principal.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">3. PRINCIPAL'S RESPONSIBILITIES</h2>
            
            <h3 className="text-xl font-semibold mb-3">3.1 Event Management</h3>
            <p className="mb-4">
              The Principal retains full and exclusive responsibility for:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Creating, organising, and managing all aspects of the event;</li>
              <li>Determining event pricing, terms, and conditions;</li>
              <li>Ensuring event compliance with all applicable laws and regulations;</li>
              <li>Obtaining all necessary permits, licenses, and insurance;</li>
              <li>Providing accurate event information and descriptions;</li>
              <li>Delivering the event as advertised to Attendees;</li>
              <li>Handling all non-payment related customer service;</li>
              <li>Managing event safety and security;</li>
              <li>Resolving disputes with Attendees regarding event content or delivery; and</li>
              <li>Maintaining appropriate public liability and other insurance coverage.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">3.2 Financial Responsibilities</h3>
            <p className="mb-4">
              The Principal acknowledges and agrees to:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Set and communicate clear refund and cancellation policies;</li>
              <li>Honour all refund obligations to Attendees;</li>
              <li>Maintain sufficient funds to cover potential refunds;</li>
              <li>Indemnify the Agent for any refunds processed on Principal's behalf;</li>
              <li>Pay all applicable taxes on event revenue;</li>
              <li>Maintain accurate financial records;</li>
              <li>Provide tax invoices to Attendees where required; and</li>
              <li>Comply with all financial reporting obligations.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">3.3 Legal and Compliance</h3>
            <p className="mb-4">
              The Principal warrants and represents that:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>It has full legal authority to conduct the event;</li>
              <li>The event complies with all applicable laws and regulations;</li>
              <li>It holds all necessary permits and licenses;</li>
              <li>Event content does not infringe any third-party rights;</li>
              <li>It will maintain appropriate insurance coverage;</li>
              <li>It will comply with consumer protection laws;</li>
              <li>It will handle personal information in accordance with privacy laws; and</li>
              <li>It will not use the Platform for any unlawful purpose.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">4. PAYMENT COLLECTION AND SETTLEMENT</h2>
            
            <h3 className="text-xl font-semibold mb-3">4.1 Payment Collection</h3>
            <p className="mb-4">
              The Agent will:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Collect payments from Attendees using secure payment processing systems;</li>
              <li>Process payments in accordance with Payment Card Industry Data Security Standards (PCI DSS);</li>
              <li>Provide real-time payment confirmation to Attendees and Principal;</li>
              <li>Maintain detailed records of all transactions;</li>
              <li>Handle payment failures and retry logic where appropriate; and</li>
              <li>Protect payment information in accordance with applicable security standards.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">4.2 Settlement Procedures</h3>
            <p className="mb-4">
              Settlement of collected funds will occur as follows:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Funds will be settled weekly on Wednesdays for transactions processed in the previous week;</li>
              <li>Settlement will be made via electronic funds transfer to the Principal's nominated bank account;</li>
              <li>The Agent will deduct applicable fees before settlement;</li>
              <li>Settlement reports will be provided with each payment;</li>
              <li>Funds may be held beyond normal settlement periods in cases of:
                <ul className="list-disc ml-8 mt-2">
                  <li>Suspected fraudulent activity;</li>
                  <li>Excessive chargebacks or disputes;</li>
                  <li>Non-compliance with these terms;</li>
                  <li>Legal or regulatory requirements; or</li>
                  <li>Pending resolution of Attendee complaints.</li>
                </ul>
              </li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">4.3 Reserve Rights</h3>
            <p className="mb-4">
              The Agent reserves the right to:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Establish and maintain a reserve from collected funds to cover potential refunds, chargebacks, or disputes;</li>
              <li>Adjust reserve amounts based on risk assessment;</li>
              <li>Hold reserves for up to 180 days after event completion;</li>
              <li>Use reserves to satisfy Principal's obligations to Attendees; and</li>
              <li>Return unused reserves according to standard settlement procedures.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">5. FEES AND CHARGES</h2>
            
            <h3 className="text-xl font-semibold mb-3">5.1 Service Fees</h3>
            <p className="mb-4">
              The Principal agrees to pay the following fees for limited agent services:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Platform subscription fee as per selected pricing plan;</li>
              <li>Payment processing fee of 2.9% + $0.30 per transaction;</li>
              <li>International payment processing fee of 3.9% + $0.30 per transaction;</li>
              <li>Chargeback fee of $25 per disputed transaction;</li>
              <li>Refund processing fee equivalent to original transaction fees (non-refundable); and</li>
              <li>Any additional fees as notified with 30 days advance notice.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">5.2 Fee Deduction</h3>
            <p className="mb-4">
              The Agent is authorised to deduct all applicable fees from collected funds before settlement. The Principal acknowledges that:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Fees are deducted automatically and cannot be waived without written agreement;</li>
              <li>Fee rates may change with appropriate notice;</li>
              <li>Additional fees may apply for special services or high-risk events; and</li>
              <li>All fees are exclusive of GST unless otherwise stated.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">6. ATTENDEE ACKNOWLEDGMENTS</h2>
            
            <h3 className="text-xl font-semibold mb-3">6.1 Required Disclosures</h3>
            <p className="mb-4">
              The Principal must ensure that all Attendees are clearly informed that:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>LodgeTix acts solely as a limited agent for payment collection;</li>
              <li>The contract for event attendance is directly between the Attendee and Principal;</li>
              <li>The Principal is solely responsible for event delivery and quality;</li>
              <li>LodgeTix is not liable for event cancellation, changes, or issues;</li>
              <li>Refund policies are determined and honoured by the Principal; and</li>
              <li>Payment information is processed securely by LodgeTix on Principal's behalf.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">6.2 Transaction Communications</h3>
            <p className="mb-4">
              All payment receipts and confirmations will clearly state:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>"Payment collected by LodgeTix as agent for [Principal Name]";</li>
              <li>The Principal's contact information for non-payment inquiries;</li>
              <li>Reference to the Principal's refund and cancellation policies; and</li>
              <li>Clear identification of the contracting parties.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">7. RISK ALLOCATION AND LIABILITY</h2>
            
            <h3 className="text-xl font-semibold mb-3">7.1 Principal's Risks</h3>
            <p className="mb-4">
              The Principal assumes all risks associated with:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Event planning, execution, and outcomes;</li>
              <li>Attendee satisfaction and experience;</li>
              <li>Event cancellation, postponement, or changes;</li>
              <li>Compliance with event-specific regulations;</li>
              <li>Health and safety at the event;</li>
              <li>Disputes with Attendees regarding event matters;</li>
              <li>Intellectual property claims related to event content;</li>
              <li>Failure to deliver advertised event features; and</li>
              <li>Any claims arising from the event itself.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">7.2 Agent's Limited Liability</h3>
            <p className="mb-4">
              The Agent's liability is strictly limited to:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Failure to collect payments due to system errors;</li>
              <li>Failure to remit collected funds according to settlement terms;</li>
              <li>Breach of payment data security resulting in loss;</li>
              <li>Gross negligence or wilful misconduct in payment processing; and</li>
              <li>Direct damages arising from Agent's breach of these terms.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">7.3 Indemnification</h3>
            <p className="mb-4">
              The Principal agrees to indemnify, defend, and hold harmless the Agent, its officers, directors, employees, and affiliates from and against any and all claims, losses, liabilities, damages, costs, and expenses (including reasonable legal fees) arising from or related to:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>The Principal's breach of these terms;</li>
              <li>The Principal's event or business operations;</li>
              <li>Claims by Attendees regarding the event;</li>
              <li>The Principal's failure to comply with applicable laws;</li>
              <li>Infringement of third-party rights by the Principal;</li>
              <li>Tax obligations related to event revenue;</li>
              <li>Refund obligations to Attendees; and</li>
              <li>Any misrepresentation by the Principal.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">8. INSURANCE REQUIREMENTS</h2>
            
            <h3 className="text-xl font-semibold mb-3">8.1 Principal's Insurance</h3>
            <p className="mb-4">
              The Principal must maintain, at its own expense:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Public liability insurance of at least $20 million per occurrence;</li>
              <li>Professional indemnity insurance where applicable;</li>
              <li>Workers compensation insurance as required by law;</li>
              <li>Event cancellation insurance for high-value events; and</li>
              <li>Any other insurance required by law or venue requirements.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">8.2 Insurance Provisions</h3>
            <p className="mb-4">
              All insurance policies must:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Be maintained with reputable insurers;</li>
              <li>Name LodgeTix as an additional insured for vicarious liability;</li>
              <li>Include a waiver of subrogation in favour of LodgeTix;</li>
              <li>Provide for 30 days notice of cancellation or material change; and</li>
              <li>Be primary and non-contributory to any insurance held by LodgeTix.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">9. DATA PROTECTION AND PRIVACY</h2>
            
            <h3 className="text-xl font-semibold mb-3">9.1 Data Handling</h3>
            <p className="mb-4">
              In performing limited agent services, the Agent will:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Collect only payment-necessary information from Attendees;</li>
              <li>Process payment data in accordance with PCI DSS requirements;</li>
              <li>Maintain appropriate technical and organisational security measures;</li>
              <li>Limit data access to authorised personnel only;</li>
              <li>Not sell or misuse Attendee payment information; and</li>
              <li>Comply with applicable privacy laws regarding payment data.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">9.2 Principal's Data Obligations</h3>
            <p className="mb-4">
              The Principal remains responsible for:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Obtaining necessary consents for data collection;</li>
              <li>Providing privacy notices to Attendees;</li>
              <li>Handling Attendee personal information lawfully;</li>
              <li>Responding to data subject requests;</li>
              <li>Reporting data breaches as required by law; and</li>
              <li>Maintaining appropriate data protection measures.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">10. TERM AND TERMINATION</h2>
            
            <h3 className="text-xl font-semibold mb-3">10.1 Term</h3>
            <p className="mb-4">
              The limited agent appointment:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Commences when the Principal enables payment collection through the Platform;</li>
              <li>Continues for the duration of the Platform subscription;</li>
              <li>Automatically renews with subscription renewal; and</li>
              <li>May be terminated as provided herein.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">10.2 Termination by Principal</h3>
            <p className="mb-4">
              The Principal may terminate the agent appointment by:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Disabling payment collection features in Platform settings;</li>
              <li>Cancelling Platform subscription;</li>
              <li>Providing written notice of termination; or</li>
              <li>Ceasing to use the Platform for payment collection.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">10.3 Termination by Agent</h3>
            <p className="mb-4">
              The Agent may terminate or suspend services immediately if:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>The Principal breaches these terms;</li>
              <li>Fraudulent activity is suspected;</li>
              <li>Excessive chargebacks or disputes occur;</li>
              <li>Legal or regulatory compliance requires termination;</li>
              <li>The Principal becomes insolvent or bankrupt;</li>
              <li>The Principal's activities pose reputational risk; or</li>
              <li>The Principal fails to pay applicable fees.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">10.4 Effects of Termination</h3>
            <p className="mb-4">
              Upon termination:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>The Agent will cease accepting new payments;</li>
              <li>Pending transactions will be completed;</li>
              <li>Final settlement will occur per standard procedures;</li>
              <li>Reserves may be held for up to 180 days;</li>
              <li>Records will be retained per legal requirements;</li>
              <li>Principal must make alternative payment arrangements; and</li>
              <li>Accrued rights and obligations survive termination.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">11. DISPUTE RESOLUTION</h2>
            
            <h3 className="text-xl font-semibold mb-3">11.1 Payment Disputes</h3>
            <p className="mb-4">
              For disputes regarding payment collection or settlement:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>The Principal must notify the Agent within 30 days;</li>
              <li>The Agent will investigate and respond within 10 business days;</li>
              <li>Documentation supporting claims must be provided;</li>
              <li>Good faith efforts to resolve must be undertaken; and</li>
              <li>Unresolved disputes proceed to formal dispute resolution.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">11.2 Attendee Disputes</h3>
            <p className="mb-4">
              For disputes between Principal and Attendees:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>The Principal handles all non-payment disputes directly;</li>
              <li>The Agent may assist with payment-related issues only;</li>
              <li>Refund decisions remain with the Principal;</li>
              <li>The Agent may process refunds on Principal's instruction; and</li>
              <li>The Principal indemnifies Agent for dispute outcomes.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">12. GENERAL PROVISIONS</h2>
            
            <h3 className="text-xl font-semibold mb-3">12.1 Relationship of Parties</h3>
            <p className="mb-4">
              Nothing in these terms shall be construed to:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Create a partnership or joint venture;</li>
              <li>Make either party an employee of the other;</li>
              <li>Authorise either party to bind the other except as expressly provided;</li>
              <li>Create any fiduciary relationship beyond payment handling; or</li>
              <li>Grant any rights beyond those expressly stated.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">12.2 Compliance with Laws</h3>
            <p className="mb-4">
              Each party shall comply with all applicable laws including:
            </p>
            <ol className="list-decimal ml-8 mb-4">
              <li>Australian Consumer Law;</li>
              <li>Privacy Act 1988 (Cth);</li>
              <li>Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth);</li>
              <li>Payment Card Industry Data Security Standards;</li>
              <li>State and territory event regulations; and</li>
              <li>Tax and financial reporting obligations.</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">12.3 Amendments</h3>
            <p className="mb-4">
              These Limited Agent Terms may be amended by the Agent with 30 days notice. Continued use of payment collection services after amendment effective date constitutes acceptance of amended terms.
            </p>

            <h3 className="text-xl font-semibold mb-3">12.4 Governing Law</h3>
            <p className="mb-4">
              These terms are governed by the laws of New South Wales, Australia. The parties submit to the exclusive jurisdiction of the courts of New South Wales.
            </p>

            <h3 className="text-xl font-semibold mb-3">12.5 Severability</h3>
            <p className="mb-4">
              If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect, and the invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.
            </p>

            <h3 className="text-xl font-semibold mb-3">12.6 Entire Agreement</h3>
            <p className="mb-4">
              These Limited Agent Terms, together with the LodgeTix Terms of Service and Privacy Policy, constitute the entire agreement between the parties regarding limited agent services and supersede all prior agreements and understandings.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">13. DEFINITIONS</h2>
            <p className="mb-4">
              In these Limited Agent Terms:
            </p>
            <ul className="list-disc ml-8 mb-4">
              <li><strong>"Agent"</strong> means LodgeTix Pty Ltd acting in its capacity as limited agent for payment collection.</li>
              <li><strong>"Attendee"</strong> means any person who registers for or purchases tickets to a Principal's event.</li>
              <li><strong>"Event"</strong> means any function, gathering, meeting, or activity organised by a Principal using the Platform.</li>
              <li><strong>"Platform"</strong> means the LodgeTix software platform and related services.</li>
              <li><strong>"Principal"</strong> means the Event Organiser who appoints LodgeTix as limited agent.</li>
              <li><strong>"Settlement"</strong> means the transfer of collected funds (less fees) to the Principal.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-masonic-navy mb-4">14. CONTACT INFORMATION</h2>
            <p className="mb-4">
              For questions regarding these Limited Agent Terms:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="mb-2"><strong>LodgeTix Pty Ltd</strong></p>
              <p className="mb-2">ACN: 670 891 593</p>
              <p className="mb-2">Email: legal@lodgetix.com</p>
              <p className="mb-2">Address: Level 1, 10 Darling Street, Balmain East NSW 2041</p>
              <p>Phone: 1300 LODGETIX (1300 563 438)</p>
            </div>
          </section>

          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <p className="text-sm text-center">
              By using LodgeTix's payment collection services, you acknowledge that you have read, understood, and agree to be bound by these Limited Agent Terms. If you do not agree to these terms, you must not use LodgeTix as a payment collection agent and should instead use direct payment methods or your own payment processing arrangements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}