'use client'

import HeaderSection from '@/docs/legal-pages/header-section'
import Link from 'next/link'

export default function ServiceTermsPage() {
  return (
    <div className="bg-white">
      <HeaderSection />
      
      <div className="px-6 py-12 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Service Terms
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Masonic Event Management Software
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-lg prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                1.1 By accessing or using the Masonic Event Management Software (the "Service", "Platform", or "Software") provided by United Grand Lodge of NSW & ACT ABN 44 923 065 515 ("we", "us", "our", or "Company"), you agree to be bound by these Service Terms ("Terms"). If you are using the Service on behalf of a Masonic lodge, organisation, or other entity, you represent and warrant that you have the authority to bind that entity to these Terms.
              </p>
              <p className="text-gray-700 mb-4">
                1.2 These Terms constitute a legally binding agreement between you and the Company. If you do not agree to these Terms, you must not access or use the Service. Your continued use of the Service following any modifications to these Terms constitutes your acceptance of such modifications.
              </p>
              <p className="text-gray-700 mb-4">
                1.3 We reserve the right to modify these Terms at any time. We will provide notice of material changes through the Service interface, via email to registered users, or through other reasonable means. Your continued use of the Service after such notice constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                2.1 The Service is a software-as-a-service (SaaS) platform designed specifically for Masonic lodges and organisations to manage events, sell tickets, process registrations, and facilitate event-related communications. The Service is not a marketplace, exchange, or intermediary for ticket sales between third parties.
              </p>
              <p className="text-gray-700 mb-4">
                2.2 The Service provides tools and features including but not limited to: event creation and management, ticketing and registration systems, payment processing integration, attendee management, communication tools, reporting and analytics, and other event management functionalities as we may introduce from time to time.
              </p>
              <p className="text-gray-700 mb-4">
                2.3 We act solely as a software provider and technology facilitator. We are not a party to any transactions between event organisers and attendees. Event organisers are solely responsible for their events, including compliance with all applicable laws, regulations, and Masonic protocols.
              </p>
              <p className="text-gray-700 mb-4">
                2.4 The Service may integrate with third-party payment processors, communication services, and other tools. Your use of such third-party services is governed by their respective terms and conditions, and we are not responsible for their availability, functionality, or performance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Responsibilities</h2>
              <p className="text-gray-700 mb-4">
                3.1 To use certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
              </p>
              <p className="text-gray-700 mb-4">
                3.2 You must notify us immediately of any unauthorised use of your account or any other breach of security. We will not be liable for any loss or damage arising from your failure to comply with this section.
              </p>
              <p className="text-gray-700 mb-4">
                3.3 Account types may include individual accounts for attendees, administrative accounts for lodge officers, and master accounts for Grand Lodge administrators. Each account type may have different permissions and capabilities within the Service.
              </p>
              <p className="text-gray-700 mb-4">
                3.4 You agree not to: (a) use the Service for any unlawful purpose or in violation of any Masonic regulations; (b) impersonate any person or entity; (c) interfere with or disrupt the Service or servers connected to the Service; (d) use any automated means to access the Service without our permission; (e) introduce any viruses, malware, or other harmful code; or (f) attempt to gain unauthorised access to any portion of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Software License and Usage</h2>
              <p className="text-gray-700 mb-4">
                4.1 Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your internal business purposes related to Masonic event management.
              </p>
              <p className="text-gray-700 mb-4">
                4.2 This license does not include the right to: (a) sublicense, resell, or redistribute the Service; (b) modify, adapt, or create derivative works based on the Service; (c) reverse engineer, decompile, or disassemble the Service; (d) use the Service to develop a competing product or service; or (e) use the Service for any purpose other than Masonic event management.
              </p>
              <p className="text-gray-700 mb-4">
                4.3 We retain all right, title, and interest in and to the Service, including all intellectual property rights. No rights are granted to you other than the limited license expressly set forth in these Terms.
              </p>
              <p className="text-gray-700 mb-4">
                4.4 We may monitor your use of the Service for compliance with these Terms and to improve the Service. We reserve the right to suspend or terminate your access if we reasonably believe you have violated these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Ownership and Rights</h2>
              <p className="text-gray-700 mb-4">
                5.1 You retain all rights to the data you submit, upload, or transmit through the Service ("Your Data"). By using the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display Your Data solely to provide and improve the Service.
              </p>
              <p className="text-gray-700 mb-4">
                5.2 We will not sell, rent, or share Your Data with third parties except: (a) as necessary to provide the Service (such as to payment processors); (b) as required by law; (c) to protect our rights or the rights of others; or (d) with your explicit consent.
              </p>
              <p className="text-gray-700 mb-4">
                5.3 You are responsible for the accuracy, quality, and legality of Your Data and the means by which you acquired it. You must ensure that your use of the Service and Your Data complies with all applicable laws and regulations, including data protection and privacy laws.
              </p>
              <p className="text-gray-700 mb-4">
                5.4 We implement reasonable technical and organisational measures to protect Your Data. However, no method of transmission or storage is 100% secure. You acknowledge and accept the inherent risks of providing data over the internet.
              </p>
              <p className="text-gray-700 mb-4">
                5.5 Upon termination of your account, we will retain Your Data for a reasonable period to comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of Your Data in accordance with our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Service Availability and Uptime</h2>
              <p className="text-gray-700 mb-4">
                6.1 We strive to provide reliable and continuous access to the Service. However, we do not guarantee uninterrupted availability. The Service may be subject to limitations, delays, and other problems inherent in the use of the internet and electronic communications.
              </p>
              <p className="text-gray-700 mb-4">
                6.2 We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time with reasonable notice. We will not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
              </p>
              <p className="text-gray-700 mb-4">
                6.3 We may perform scheduled maintenance that could result in Service interruptions. We will endeavour to provide advance notice of scheduled maintenance and perform such maintenance during off-peak hours when possible.
              </p>
              <p className="text-gray-700 mb-4">
                6.4 In the event of unplanned outages, we will use commercially reasonable efforts to restore Service as quickly as possible. However, we are not liable for any losses or damages resulting from Service unavailability.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Modifications to Service</h2>
              <p className="text-gray-700 mb-4">
                7.1 We continuously strive to improve the Service and may add, modify, or remove features and functionality. Such changes may affect your use of the Service or require you to modify your practices.
              </p>
              <p className="text-gray-700 mb-4">
                7.2 For material changes that adversely affect your use of core features, we will provide reasonable advance notice through the Service interface, email, or other appropriate means.
              </p>
              <p className="text-gray-700 mb-4">
                7.3 Your continued use of the Service after such changes constitutes acceptance of the modified Service. If you do not agree with the changes, your sole remedy is to discontinue use of the Service.
              </p>
              <p className="text-gray-700 mb-4">
                7.4 We may release beta features or experimental functionality. Such features are provided "as is" without warranties and may be discontinued at any time without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Payment Terms</h2>
              <p className="text-gray-700 mb-4">
                8.1 Certain features of the Service may require payment of fees. You agree to pay all applicable fees as described in our pricing plans. All fees are exclusive of taxes, which you are responsible for paying.
              </p>
              <p className="text-gray-700 mb-4">
                8.2 We may process payments through third-party payment processors. You agree to provide accurate payment information and authorise us to charge the payment method on file for all fees incurred.
              </p>
              <p className="text-gray-700 mb-4">
                8.3 Transaction fees may apply to ticket sales and registrations processed through the Service. These fees will be clearly disclosed before you complete any transaction.
              </p>
              <p className="text-gray-700 mb-4">
                8.4 All fees are non-refundable except as expressly provided in these Terms or required by law. We reserve the right to modify our fees with reasonable notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-700 mb-4">
                9.1 You may terminate your account at any time by following the account closure process in the Service or by contacting our support team. Termination does not relieve you of any obligations incurred prior to termination.
              </p>
              <p className="text-gray-700 mb-4">
                9.2 We may suspend or terminate your account immediately if: (a) you breach these Terms; (b) we are required to do so by law; (c) we discontinue the Service; or (d) your use of the Service creates risk or liability for us or other users.
              </p>
              <p className="text-gray-700 mb-4">
                9.3 Upon termination: (a) your license to use the Service immediately ceases; (b) you must cease all use of the Service; (c) we may delete Your Data after a reasonable retention period; and (d) any fees owed remain due and payable.
              </p>
              <p className="text-gray-700 mb-4">
                9.4 Sections of these Terms that by their nature should survive termination will survive, including but not limited to provisions regarding intellectual property, indemnification, disclaimers, limitations of liability, and governing law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Disclaimers and Limitations of Liability</h2>
              <p className="text-gray-700 mb-4">
                10.1 THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-gray-700 mb-4">
                10.2 WE DO NOT WARRANT THAT: (A) THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED; (B) DEFECTS WILL BE CORRECTED; (C) THE SERVICE IS FREE OF VIRUSES OR HARMFUL COMPONENTS; OR (D) THE RESULTS OF USING THE SERVICE WILL MEET YOUR REQUIREMENTS.
              </p>
              <p className="text-gray-700 mb-4">
                10.3 IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
              </p>
              <p className="text-gray-700 mb-4">
                10.4 OUR TOTAL LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE FEES YOU PAID TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM OR (B) ONE HUNDRED AUSTRALIAN DOLLARS ($100 AUD).
              </p>
              <p className="text-gray-700 mb-4">
                10.5 SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES OR LIMITATION OF LIABILITY FOR INCIDENTAL OR CONSEQUENTIAL DAMAGES. IN SUCH JURISDICTIONS, OUR LIABILITY SHALL BE LIMITED TO THE GREATEST EXTENT PERMITTED BY LAW.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                11.1 You agree to indemnify, defend, and hold harmless the Company, its affiliates, officers, directors, employees, agents, and representatives from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising from:
              </p>
              <p className="text-gray-700 mb-4 ml-8">
                (a) Your use of the Service;<br />
                (b) Your violation of these Terms;<br />
                (c) Your violation of any rights of another party;<br />
                (d) Your Data or content submitted through the Service;<br />
                (e) Any events you organise using the Service;<br />
                (f) Any disputes between you and attendees of your events; or<br />
                (g) Your negligent or wrongful conduct.
              </p>
              <p className="text-gray-700 mb-4">
                11.2 We reserve the right to assume the exclusive defence and control of any matter subject to indemnification by you, in which case you agree to cooperate with our defence of such claim.
              </p>
              <p className="text-gray-700 mb-4">
                11.3 This indemnification obligation will survive the termination of these Terms and your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">
                12.1 These Terms shall be governed by and construed in accordance with the laws of New South Wales, Australia, without regard to its conflict of law provisions.
              </p>
              <p className="text-gray-700 mb-4">
                12.2 Any dispute arising from or relating to these Terms or the Service shall first be attempted to be resolved through good faith negotiations between the parties.
              </p>
              <p className="text-gray-700 mb-4">
                12.3 If negotiations fail to resolve the dispute within thirty (30) days, the dispute shall be submitted to mediation in Sydney, New South Wales, under the Australian Centre for International Commercial Arbitration (ACICA) Mediation Rules.
              </p>
              <p className="text-gray-700 mb-4">
                12.4 If mediation fails to resolve the dispute, either party may pursue their remedies in the courts of New South Wales, Australia. You consent to the exclusive jurisdiction of such courts.
              </p>
              <p className="text-gray-700 mb-4">
                12.5 Notwithstanding the above, we may seek injunctive or other equitable relief in any court of competent jurisdiction to protect our intellectual property rights or confidential information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Masonic-Specific Provisions</h2>
              <p className="text-gray-700 mb-4">
                13.1 The Service is designed specifically for use by Masonic lodges, Grand Lodges, and related Masonic bodies. Users acknowledge and agree that the Service may contain Masonic symbols, terminology, and references.
              </p>
              <p className="text-gray-700 mb-4">
                13.2 Event organisers using the Service must ensure their events comply with all applicable Masonic constitutions, regulations, and protocols. We are not responsible for ensuring such compliance and do not review events for Masonic regulatory compliance.
              </p>
              <p className="text-gray-700 mb-4">
                13.3 Access to certain features or events within the Service may be restricted based on Masonic membership status or degree. Users are responsible for accurately representing their Masonic affiliations and qualifications.
              </p>
              <p className="text-gray-700 mb-4">
                13.4 The Service may facilitate the collection of information related to Masonic membership. Such information must be handled in accordance with Masonic obligations of confidentiality and our Privacy Policy.
              </p>
              <p className="text-gray-700 mb-4">
                13.5 Nothing in these Terms shall be construed to supersede or conflict with the constitutions, laws, or edicts of any recognised Grand Lodge. In the event of any conflict, the Masonic regulations shall prevail for matters within their jurisdiction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. General Provisions</h2>
              <p className="text-gray-700 mb-4">
                14.1 <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy and any other agreements referenced herein, constitute the entire agreement between you and us regarding the Service.
              </p>
              <p className="text-gray-700 mb-4">
                14.2 <strong>Severability:</strong> If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
              <p className="text-gray-700 mb-4">
                14.3 <strong>No Waiver:</strong> Our failure to enforce any right or provision of these Terms shall not be considered a waiver of such right or provision.
              </p>
              <p className="text-gray-700 mb-4">
                14.4 <strong>Assignment:</strong> You may not assign or transfer these Terms or your rights under them without our prior written consent. We may assign our rights under these Terms without restriction.
              </p>
              <p className="text-gray-700 mb-4">
                14.5 <strong>Force Majeure:</strong> Neither party shall be liable for any delay or failure to perform due to causes beyond their reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemic, strikes, or shortages of transportation, facilities, fuel, energy, labour, or materials.
              </p>
              <p className="text-gray-700 mb-4">
                14.6 <strong>Notices:</strong> All notices under these Terms shall be in writing and deemed given when delivered personally, sent by confirmed email, or sent by certified or registered mail, return receipt requested, to the addresses provided during registration or subsequently updated.
              </p>
              <p className="text-gray-700 mb-4">
                14.7 <strong>Export Compliance:</strong> You agree to comply with all applicable export and re-export control laws and regulations, including the Export Administration Regulations maintained by the U.S. Department of Commerce.
              </p>
              <p className="text-gray-700 mb-4">
                14.8 <strong>Third-Party Rights:</strong> These Terms do not create any third-party beneficiary rights except as expressly provided herein.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms or the Service, please contact us at:
              </p>
              <div className="ml-8 text-gray-700 mb-4">
                <p><strong>United Grand Lodge of NSW & ACT</strong></p>
                <p>The Masonic Centre</p>
                <p>279 Castlereagh Street</p>
                <p>Sydney NSW 2000</p>
                <p>Australia</p>
                <p className="mt-2">
                  <strong>Email:</strong> <a href="mailto:support@masonicevents.org.au" className="text-blue-600 hover:text-blue-800">support@masonicevents.org.au</a>
                </p>
                <p><strong>Phone:</strong> +61 2 9284 2800</p>
                <p><strong>ABN:</strong> 44 923 065 515</p>
              </div>
            </section>

            <section className="mb-8 border-t pt-8">
              <p className="text-sm text-gray-600 text-center italic">
                By using the Masonic Event Management Software, you acknowledge that you have read, understood, and agree to be bound by these Service Terms. These Terms are designed to ensure the proper use of our platform while respecting the unique requirements and traditions of Masonic organisations.
              </p>
            </section>
          </div>

          <div className="mt-12 text-center">
            <Link href="/software" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Back to Software Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}