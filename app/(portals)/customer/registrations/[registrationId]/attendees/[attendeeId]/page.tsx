import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Mail, Phone, Building, Shield, Utensils } from 'lucide-react'

async function getAttendee(attendeeId: string, registrationId: string) {
  const supabase = await createClient()
  
  const { data: attendee, error } = await supabase
    .from('attendees')
    .select(`
      *,
      registration:Registrations!attendees_registrationid_fkey (
        registration_id,
        event:events!Registrations_event_id_fkey (
          id,
          title,
          slug
        )
      ),
      tickets!tickets_attendee_id_fkey (
        id,
        ticket_price,
        package:packages!tickets_package_id_fkey (
          id,
          name,
          description
        )
      )
    `)
    .eq('attendeeid', attendeeId)
    .eq('registrationid', registrationId)
    .single()

  if (error || !attendee) {
    return null
  }

  return attendee
}

export default async function AttendeeDetailPage({
  params,
}: {
  params: Promise<{ registrationId: string; attendeeId: string }>
}) {
  const { registrationId, attendeeId } = await params
  const attendee = await getAttendee(attendeeId, registrationId)

  if (!attendee) {
    notFound()
  }

  const isMason = attendee.attendeetype === 'mason'
  const ticketCount = attendee.tickets?.length || 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        asChild
        className="mb-6"
      >
        <Link href={`/registrations/${registrationId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Registration
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {attendee.title} {attendee.firstName} {attendee.lastName}
        </h1>
        <Badge variant={isMason ? 'default' : 'secondary'}>
          {isMason ? 'Mason' : 'Guest'}
        </Badge>
      </div>

      {/* Contact Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>{attendee.email || 'No email provided'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-gray-500" />
            <span>{attendee.mobilephone || 'No phone provided'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Mason Details */}
      {isMason && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Masonic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attendee.lodgenumber && (
              <div>
                <span className="font-semibold">Lodge Number:</span>{' '}
                <span>{attendee.lodgenumber}</span>
              </div>
            )}
            {attendee.lodgename && (
              <div>
                <span className="font-semibold">Lodge Name:</span>{' '}
                <span>{attendee.lodgename}</span>
              </div>
            )}
            {attendee.grandlodge && (
              <div>
                <span className="font-semibold">Grand Lodge:</span>{' '}
                <span>{attendee.grandlodge}</span>
              </div>
            )}
            {attendee.GrandOfficerRank && (
              <div>
                <span className="font-semibold">Grand Officer Rank:</span>{' '}
                <span>{attendee.GrandOfficerRank}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Guest Details */}
      {!isMason && attendee.bringingpartner && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Guest Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attendee.partnerrelationship && (
              <div>
                <span className="font-semibold">Relationship:</span>{' '}
                <span>{attendee.partnerrelationship}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dietary Requirements */}
      {attendee.dietaryrequirements && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Dietary Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{attendee.dietaryrequirements}</p>
          </CardContent>
        </Card>
      )}

      {/* Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({ticketCount})</CardTitle>
          <CardDescription>
            Events this attendee is registered for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendee.tickets?.map((ticket: any) => (
              <div
                key={ticket_id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h4 className="font-semibold">
                    {ticket.package?.name || 'Ticket'}
                  </h4>
                  {ticket.package?.description && (
                    <p className="text-sm text-gray-600">
                      {ticket.package.description}
                    </p>
                  )}
                  <p className="text-sm font-medium mt-1">
                    ${ticket.ticket_price?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/registrations/${registrationId}/tickets/${ticket_id}`}>
                    View Ticket
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}