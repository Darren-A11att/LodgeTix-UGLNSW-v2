import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Calendar, CreditCard, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
      
      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please read this refund policy carefully before purchasing tickets. By completing your purchase, 
          you acknowledge and agree to these terms.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cancellation Timeframes
            </CardTitle>
            <CardDescription>
              Refund amounts depend on when you cancel your registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold">More than 30 days before the event</h4>
                <p className="text-gray-600">100% refund minus a $10 processing fee per ticket</p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold">14-30 days before the event</h4>
                <p className="text-gray-600">75% refund of the ticket price</p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold">7-14 days before the event</h4>
                <p className="text-gray-600">50% refund of the ticket price</p>
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold">Less than 7 days before the event</h4>
                <p className="text-gray-600">No refund available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>How to Request a Refund</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              To request a refund, please follow these steps:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Email events@uglnsw.org.au with your booking reference number</li>
              <li>Include the reason for cancellation in your email</li>
              <li>Provide the name of the primary registrant</li>
              <li>Allow up to 5 business days for processing</li>
            </ol>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Refund requests must be made by the person who made the original booking.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Refund Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Once your refund is approved:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Refunds will be credited to the original payment method</li>
              <li>Processing typically takes 5-10 business days</li>
              <li>You will receive an email confirmation when the refund is processed</li>
              <li>Bank processing times may add additional days before funds appear</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Special Circumstances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Event Cancellation by Organisers</h4>
                <p className="text-gray-600">
                  If we cancel an event, all attendees will receive a 100% refund including all fees. 
                  Refunds will be processed automatically within 5 business days.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Event Postponement</h4>
                <p className="text-gray-600">
                  If an event is postponed, tickets will be valid for the new date. If you cannot 
                  attend the new date, standard refund policy timeframes apply from the original event date.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Medical Emergencies</h4>
                <p className="text-gray-600">
                  Refund requests due to medical emergencies may be considered outside standard timeframes. 
                  Medical documentation may be required.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Transfer Instead of Refund</h4>
                <p className="text-gray-600">
                  As an alternative to a refund, you may transfer your ticket to another person up to 
                  48 hours before the event. Contact us to arrange a transfer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Exclusions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              The following are not eligible for refunds:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>No-shows (failure to attend without cancelling)</li>
              <li>Arrival after event has commenced</li>
              <li>Denial of entry due to failure to meet entry requirements</li>
              <li>Denial of entry due to inappropriate behavior</li>
              <li>Changes in personal circumstances (except medical emergencies)</li>
              <li>Weather conditions (unless event is cancelled)</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              If you have questions about our refund policy or need assistance:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-gray-600">
              <p><strong>Email:</strong> events@uglnsw.org.au</p>
              <p><strong>Phone:</strong> (02) 9284 2800</p>
              <p><strong>Office Hours:</strong> Monday to Friday, 9:00 AM - 5:00 PM AEST</p>
            </div>
          </CardContent>
        </Card>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This refund policy is subject to change. The policy in effect at the time of your purchase 
            will apply to your transaction.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}