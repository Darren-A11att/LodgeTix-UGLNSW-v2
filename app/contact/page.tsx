import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>
              Get in touch with the LodgeTix team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-masonic-navy mt-0.5" />
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-sm text-gray-600">support@lodgetix.io</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-masonic-navy mt-0.5" />
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-sm text-gray-600">1300 LODGETIX</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-masonic-navy mt-0.5" />
                <div>
                  <h3 className="font-medium">Address</h3>
                  <p className="text-sm text-gray-600">
                    United Grand Lodge of NSW & ACT<br />
                    Sydney, NSW, Australia
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">Send us a message</h3>
              <p className="text-sm text-gray-600 mb-4">
                For general inquiries, please email us at support@lodgetix.io
              </p>
              <Button asChild>
                <a href="mailto:support@lodgetix.io">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Support
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}