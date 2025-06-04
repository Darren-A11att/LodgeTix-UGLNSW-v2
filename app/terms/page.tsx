import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>LodgeTix Terms of Service</CardTitle>
          <CardDescription>
            Last updated: {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600 mb-4">
            By accessing and using the LodgeTix platform ("Service") operated by the United Grand Lodge of NSW & ACT 
            ("we," "our," or "us"), you agree to be bound by these Terms and Conditions ("Terms"). If you disagree 
            with any part of these terms, you may not access the Service.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Registration and Ticketing</h2>
          <p className="text-gray-600 mb-4">
            When you register for events through our Service:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>You must provide accurate and complete information</li>
            <li>You are responsible for maintaining the confidentiality of your account</li>
            <li>You must be at least 18 years old to make a purchase</li>
            <li>All ticket sales are final unless otherwise stated</li>
            <li>Tickets are non-transferable unless explicitly permitted</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Payment Terms</h2>
          <p className="text-gray-600 mb-4">
            All payments are processed securely through our payment provider. By making a purchase:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>You authorize us to charge your payment method for the total amount</li>
            <li>All prices are in Australian Dollars (AUD) unless otherwise stated</li>
            <li>Processing fees may apply and will be clearly displayed</li>
            <li>You are responsible for any additional bank or card fees</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Cancellation and Refunds</h2>
          <p className="text-gray-600 mb-4">
            Our cancellation policy varies by event. Generally:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>Cancellations made 14+ days before the event may receive a full refund</li>
            <li>Cancellations within 14 days may receive a partial refund or credit</li>
            <li>No-shows are not eligible for refunds</li>
            <li>Event postponements do not automatically qualify for refunds</li>
            <li>If we cancel an event, you will receive a full refund</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Code of Conduct</h2>
          <p className="text-gray-600 mb-4">
            All attendees must adhere to our code of conduct:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>Treat all participants with respect and dignity</li>
            <li>Follow venue rules and event guidelines</li>
            <li>No harassment, discrimination, or inappropriate behavior</li>
            <li>Comply with dress codes where specified</li>
            <li>We reserve the right to refuse entry or remove attendees who violate these standards</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Privacy and Data Protection</h2>
          <p className="text-gray-600 mb-4">
            Your privacy is important to us. We collect and use your information as described in our Privacy Policy. 
            By using our Service, you consent to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>Collection of necessary personal information for event registration</li>
            <li>Sharing attendee lists with event organisers</li>
            <li>Receiving event-related communications</li>
            <li>Use of anonymized data for improving our services</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
          <p className="text-gray-600 mb-4">
            All content on the LodgeTix platform, including text, graphics, logos, and software, is the property 
            of the United Grand Lodge of NSW & ACT or its licensors and is protected by intellectual property laws.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
          <p className="text-gray-600 mb-4">
            To the maximum extent permitted by law:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>We are not liable for any indirect, incidental, or consequential damages</li>
            <li>Our total liability is limited to the amount you paid for the tickets</li>
            <li>We are not responsible for third-party actions or venue conditions</li>
            <li>Force majeure events release us from our obligations</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Modifications to Terms</h2>
          <p className="text-gray-600 mb-4">
            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon 
            posting to the website. Your continued use of the Service constitutes acceptance of the modified Terms.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
          <p className="text-gray-600 mb-4">
            These Terms are governed by the laws of New South Wales, Australia. Any disputes will be resolved 
            in the courts of New South Wales.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
          <p className="text-gray-600 mb-4">
            If you have questions about these Terms, please contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-gray-600">
            <p>United Grand Lodge of NSW & ACT</p>
            <p>279 Castlereagh Street</p>
            <p>Sydney NSW 2000</p>
            <p>Email: admin@uglnsw.org.au</p>
            <p>Phone: (02) 9284 2800</p>
          </div>
        </section>
      </div>
    </div>
  )
}