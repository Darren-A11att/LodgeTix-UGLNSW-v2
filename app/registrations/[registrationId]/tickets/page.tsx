import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Ticket, Calendar, MapPin, User, Download } from 'lucide-react'
import { format } from 'date-fns'

async function getTickets(registrationId: string) {
  const supabase = await createClient()
  
  const { data: registration, error } = await supabase
    .from('registrations')
    .select(`
      registration_id,
      payment_status,
      event:events!Registrations_event_id_fkey (
        id,
        title,
        slug
      ),
      tickets!tickets_registration_id_fkey (
        *,
        attendee:attendees!tickets_attendee_id_fkey (
          attendeeid,
          title,
          firstName,
          lastName,
          attendeetype
        ),
        package:packages!tickets_package_id_fkey (
          id,
          name,
          description,
          event:events!packages_event_id_fkey (
            id,
            title,
            event_start,
            location
          )
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

export default async function TicketsListPage({
  params,
}: {
  params: { registrationId: string }
}) {
  const { registrationId } = await params
  const registration = await getTickets(registrationId)

  if (!registration) {
    notFound()
  }

  const tickets = registration.tickets || []
  const isPaid = registration.payment_status === 'completed'

  // Group tickets by event
  const ticketsByEvent = tickets.reduce((acc: any, ticket: any) => {
    const eventId = ticket.package?.event?.id || 'other'
    if (!acc[eventId]) {
      acc[eventId] = {
        event: ticket.package?.event,
        packageName: ticket.package?.name,
        tickets: []
      }
    }
    acc[eventId].tickets.push(ticket)
    return acc
  }, {})

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
        <h1 className="text-3xl font-bold mb-2">All Tickets</h1>
        <p className="text-gray-600">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} for {registration.event?.title}
        </p>
      </div>

      {isPaid && tickets.length > 0 && (
        <Card className="mb-6 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Batch Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download All Tickets (PDF)
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {Object.entries(ticketsByEvent).map(([eventId, group]: [string, any]) => (
          <div key={eventId}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">
                {group.packageName || 'Event Tickets'}
              </h2>
              {group.event && (
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {group.event.event_start 
                        ? format(new Date(group.event.event_start), 'PPP')
                        : 'Date TBD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{group.event.location || 'Location TBD'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {group.tickets.map((ticket: any) => {
                const attendee = ticket.attendee

                return (
                  <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Ticket className="h-5 w-5" />
                            Ticket #{ticket.id.slice(0, 8).toUpperCase()}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={isPaid ? 'default' : 'secondary'}>
                              {isPaid ? 'Confirmed' : 'Pending Payment'}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              ${ticket.ticket_price?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/registrations/${registrationId}/tickets/${ticket.id}`}>
                            View Ticket
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {attendee && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>
                            {attendee.title} {attendee.firstName} {attendee.lastName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {attendee.attendeetype === 'mason' ? 'Mason' : 'Guest'}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}