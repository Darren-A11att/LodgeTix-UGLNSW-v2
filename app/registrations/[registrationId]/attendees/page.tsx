import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Mail, Phone, Shield } from 'lucide-react'

async function getAttendees(registrationId: string) {
  const supabase = await createClient()
  
  const { data: registration, error } = await supabase
    .from('registrations')
    .select(`
      registration_id,
      event:events!Registrations_event_id_fkey (
        id,
        title,
        slug
      ),
      attendees!attendees_registrationid_fkey (
        *,
        tickets!tickets_attendee_id_fkey (
          id
        )
      )
    `)
    .eq('registration_id', registrationId)
    .single()

  if (error || !registration) {
    return null
  }

  return registration
}

export default async function AttendeesListPage({
  params,
}: {
  params: { registrationId: string }
}) {
  const registration = await getAttendees(params.registrationId)

  if (!registration) {
    notFound()
  }

  const attendees = registration.attendees || []

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        asChild
        className="mb-6"
      >
        <Link href={`/registrations/${params.registrationId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Registration
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Attendees</h1>
        <p className="text-gray-600">
          {attendees.length} attendee{attendees.length !== 1 ? 's' : ''} registered for {registration.event?.title}
        </p>
      </div>

      <div className="space-y-4">
        {attendees.map((attendee: any) => {
          const ticketCount = attendee.tickets?.length || 0
          const isMason = attendee.attendeetype === 'mason'

          return (
            <Card key={attendee.attendeeid} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {attendee.title} {attendee.firstName} {attendee.lastName}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={isMason ? 'default' : 'secondary'}>
                        {isMason ? 'Mason' : 'Guest'}
                      </Badge>
                      {ticketCount > 0 && (
                        <Badge variant="outline">
                          {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/registrations/${params.registrationId}/attendees/${attendee.attendeeid}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attendee.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{attendee.email}</span>
                    </div>
                  )}
                  {attendee.mobilephone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{attendee.mobilephone}</span>
                    </div>
                  )}
                  {isMason && attendee.lodgename && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4" />
                      <span>
                        {attendee.lodgename}
                        {attendee.lodgenumber && ` #${attendee.lodgenumber}`}
                      </span>
                    </div>
                  )}
                  {attendee.dietaryrequirements && (
                    <p className="text-sm text-gray-600 italic">
                      Special dietary requirements
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}