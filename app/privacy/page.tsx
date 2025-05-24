import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
            <CardDescription>
              Last updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when registering for events,
              including your name, email address, phone number, and Masonic affiliation details.
            </p>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Process your event registrations</li>
              <li>Send you event-related communications</li>
              <li>Improve our services</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties.
              We may share your information with event organizers for the specific events you register for.
            </p>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2>5. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
            </ul>

            <h2>6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at
              privacy@lodgetix.io
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}