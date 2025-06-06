import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Ticket, Calendar, MapPin, CreditCard } from 'lucide-react'
import { format } from 'date-fns'

async function getRegistration(registrationId: string) {
  const supabase = await createClient()
  
  const { data: registration, error } = await supabase
    .from('registrations')
    .select(`
      *,
      event:events!Registrations_event_id_fkey (
        id,
        title,
        slug,
        event_start,
        location
      ),
      attendees!attendees_registrationid_fkey (
        *
      ),
      tickets!tickets_registration_id_fkey (
        *,
        attendee:attendees!tickets_attendee_id_fkey (
          attendeeid,
          title,
          firstName,
          lastName
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

export default async function RegistrationOverviewPage({
  params,
}: {
  params: Promise<{ registrationId: string }>
}) {
  const { registrationId } = await params
  const registration = await getRegistration(registrationId)

  if (!registration) {
    notFound()
  }

  const totalAmount = registration.total_price_paid || 0
  const paymentStatus = registration.payment_status || 'pending'
  const attendeeCount = registration.attendees?.length || 0
  const ticketCount = registration.tickets?.length || 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button
        variant="ghost"
        asChild
        className="mb-6"
      >
        <Link href="/customer/tickets">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Tickets
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Registration Details</h1>
        <p className="text-gray-600">
          Confirmation: <span className="font-mono">{registration.registration_id.slice(0, 8).toUpperCase()}</span>
        </p>
      </div>

      {/* Event Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-2">{registration.event?.title}</h3>
          <div className="space-y-2 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{registration.event?.event_start ? format(new Date(registration.event.event_start), 'PPP') : 'Date TBD'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{registration.event?.location || 'Location TBD'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Summary */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4" />
              Attendees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{attendeeCount}</p>
            <Link 
              href={`/registrations/${registrationId}/attendees`}
              className="text-sm text-blue-600 hover:underline"
            >
              View all attendees
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{ticketCount}</p>
            <Link 
              href={`/registrations/${registrationId}/tickets`}
              className="text-sm text-blue-600 hover:underline"
            >
              View all tickets
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalAmount.toFixed(2)}</p>
            <Badge 
              variant={paymentStatus === 'completed' ? 'default' : 'secondary'}
              className="mt-1"
            >
              {paymentStatus}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Attendees List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Attendees</CardTitle>
          <CardDescription>
            All attendees registered for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {registration.attendees?.map((attendee: any) => (
              <div
                key={attendee.attendeeid}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h4 className="font-semibold">
                    {attendee.title} {attendee.firstName} {attendee.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {attendee.attendeetype === 'mason' ? 'mason' : 'guest'}
                    {attendee.dietaryrequirements && ' • Special dietary requirements'}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/registrations/${registrationId}/attendees/${attendee.attendeeid}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            All tickets purchased in this registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {registration.tickets?.map((ticket: any) => (
              <div
                key={ticket_id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h4 className="font-semibold">
                    Ticket for {ticket.attendee?.firstName} {ticket.attendee?.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">
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