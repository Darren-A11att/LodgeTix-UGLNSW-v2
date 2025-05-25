'use client'

import Link from 'next/link'
import { AlertCircle, Building2, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function NoOrganizationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Building2 className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          No Organization Found
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          You need to be associated with an organization to access the organizer portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">What's Next?</CardTitle>
            <CardDescription className="text-center">
              Choose one of the options below to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Account Not Linked</AlertTitle>
              <AlertDescription>
                Your account isn't currently linked to any organization in our system.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/organizer/register">
                  Register Your Organization
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/organizer/join">
                  Join Existing Organization
                </Link>
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need help? Contact us:
              </p>
              <div className="mt-2 flex justify-center space-x-4 text-sm">
                <a 
                  href="mailto:support@lodgetix.com" 
                  className="flex items-center text-blue-600 hover:text-blue-500"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  support@lodgetix.com
                </a>
                <a 
                  href="tel:+61-2-9999-9999" 
                  className="flex items-center text-blue-600 hover:text-blue-500"
                >
                  <Phone className="h-4 w-4 mr-1" />
                  (02) 9999 9999
                </a>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button variant="ghost" asChild>
                <Link href="/">
                  ← Back to Main Site
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}