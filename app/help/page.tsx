import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, Mail } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-masonic-navy" />
              <CardTitle>Help Center</CardTitle>
            </div>
            <CardDescription>
              How can we assist you today?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">How do I register for an event?</h4>
                  <p className="text-sm text-gray-600">Browse our events page and click "Register" on any event you're interested in.</p>
                </div>
                <div>
                  <h4 className="font-medium">Can I register multiple attendees?</h4>
                  <p className="text-sm text-gray-600">Yes, you can register as an individual, delegation, or lodge with multiple attendees.</p>
                </div>
                <div>
                  <h4 className="font-medium">What payment methods are accepted?</h4>
                  <p className="text-sm text-gray-600">We accept all major credit cards through our secure payment processor.</p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">Need More Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                If you can't find what you're looking for, please contact our support team.
              </p>
              <Button asChild variant="outline">
                <Link href="/contact">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}