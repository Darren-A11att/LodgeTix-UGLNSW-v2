import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function EventRegistrationsPage({ 
  params 
}: { 
  params: { eventId: string } 
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/organizer/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Event Registrations</h1>
          <p className="text-gray-600">
            Event ID: {params.eventId}
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Registrations Coming Soon
          </CardTitle>
          <CardDescription>
            This feature will be implemented in TODO-004: View Event Registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Registration Management</h3>
            <p className="text-gray-600 mb-4">
              View attendee details, manage registrations, and export attendee lists
            </p>
            <div className="space-x-2">
              <Badge variant="outline">TODO-004: View Event Registrations</Badge>
              <Badge variant="outline">TODO-005: Attendee Detail Modal</Badge>
              <Badge variant="outline">TODO-006: Export Attendee List</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Back */}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/organizer/events">
            ← Back to Events
          </Link>
        </Button>
      </div>
    </div>
  )
}