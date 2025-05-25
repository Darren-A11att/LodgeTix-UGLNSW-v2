import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Ticket, User, Calendar, MapPin, Download, QrCode } from 'lucide-react'
import { format } from 'date-fns'

async function getTicket(ticketId: string, registrationId: string) {
  const supabase = await createClient()
  
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      registration:Registrations!tickets_registration_id_fkey (
        registration_id,
        payment_status,
        event:events!Registrations_event_id_fkey (
          id,
          title,
          slug,
          event_start,
          location
        )
      ),
      attendee:attendees!tickets_attendee_id_fkey (
        attendeeid,
        title,
        firstName,
        lastName,
        email,
        attendeetype,
        lodgename,
        lodgenumber
      ),
      package:packages!tickets_package_id_fkey (
        id,
        name,
        description,
        event:events!packages_event_id_fkey (
          id,
          title,
          event_start,
          location,
          description
        )
      )
    `)
    .eq('id', ticketId)
    .eq('registration_id', registrationId)
    .single()

  if (error || !ticket) {
    return null
  }

  return ticket
}

export default async function TicketDetailPage({
  params,
}: {
  params: { registrationId: string; ticketId: string }
}) {
  const ticket = await getTicket(params.ticketId, params.registrationId)

  if (!ticket) {
    notFound()
  }

  const isPaid = ticket.registration?.payment_status === 'completed'
  const attendee = ticket.attendee
  const packageEvent = ticket.package?.event
  const parentEvent = ticket.registration?.event

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
        <h1 className="text-3xl font-bold mb-2">Event Ticket</h1>
        <div className="flex items-center gap-3">
          <Badge variant={isPaid ? 'default' : 'secondary'}>
            {isPaid ? 'Paid' : 'Pending Payment'}
          </Badge>
          <span className="text-gray-600">
            Ticket ID: <span className="font-mono">{ticket.id.slice(0, 8).toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* Ticket Actions */}
      {isPaid && (
        <Card className="mb-6 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Ticket Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" size="sm">
              <QrCode className="mr-2 h-4 w-4" />
              Show QR Code
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Event Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Package Event (what they're attending) */}
            <div className="pb-4 border-b">
              <h3 className="text-lg font-semibold mb-2">
                {ticket.package?.name || 'Event Ticket'}
              </h3>
              {ticket.package?.description && (
                <p className="text-gray-600 mb-3">{ticket.package.description}</p>
              )}
              {packageEvent && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {packageEvent.event_start 
                        ? format(new Date(packageEvent.event_start), 'PPP p')
                        : 'Date TBD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{packageEvent.location || 'Location TBD'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Parent Event (main registration) */}
            {parentEvent && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Part of:</p>
                <p className="font-medium">{parentEvent.title}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendee Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Attendee Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendee && (
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-lg">
                  {attendee.title} {attendee.firstName} {attendee.lastName}
                </h4>
                <Badge variant={attendee.attendeetype === 'mason' ? 'default' : 'secondary'} className="mt-1">
                  {attendee.attendeetype === 'mason' ? 'Mason' : 'Guest'}
                </Badge>
              </div>
              
              {attendee.email && (
                <div>
                  <span className="text-sm text-gray-500">Email:</span>{' '}
                  <span>{attendee.email}</span>
                </div>
              )}

              {attendee.attendeetype === 'mason' && attendee.lodgename && (
                <div>
                  <span className="text-sm text-gray-500">Lodge:</span>{' '}
                  <span>
                    {attendee.lodgename}
                    {attendee.lodgenumber && ` #${attendee.lodgenumber}`}
                  </span>
                </div>
              )}

              <Button variant="outline" size="sm" asChild className="mt-3">
                <Link href={`/registrations/${params.registrationId}/attendees/${attendee.attendeeid}`}>
                  View Full Profile
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Price:</span>
              <span className="font-semibold">${ticket.ticket_price?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge variant={isPaid ? 'default' : 'secondary'}>
                {isPaid ? 'Confirmed' : 'Awaiting Payment'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{format(new Date(ticket.created_at), 'PPP')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}