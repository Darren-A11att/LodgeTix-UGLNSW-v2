import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ticket, Calendar, MapPin, User, QrCode } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'

export default async function AttendeeDashboard() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to be logged in to access your attendee dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get attendee records for this user
  const { data: attendees } = await supabase
    .from('attendees')
    .select(`
      *,
      registrations(
        *,
        functions(name, slug),
        tickets(
          *,
          event_tickets(
            *,
            events(title, event_start, event_end)
          )
        )
      )
    `)
    .eq('auth_user_id', user.id)

  // Get upcoming events for this attendee
  const upcomingEvents = attendees?.flatMap(attendee => 
    attendee.registrations?.flatMap(reg => 
      reg.tickets?.map(ticket => ({
        ...ticket.event_tickets?.events,
        ticketId: ticket.ticket_id,
        functionName: reg.functions?.name,
        functionSlug: reg.functions?.slug,
        eventTitle: ticket.event_tickets?.events?.title
      })) || []
    ) || []
  ).filter(event => 
    event.event_start && new Date(event.event_start) > new Date()
  ).sort((a, b) => 
    new Date(a.event_start).getTime() - new Date(b.event_start).getTime()
  ).slice(0, 5) || []

  // Get all tickets for this attendee
  const allTickets = attendees?.flatMap(attendee => 
    attendee.registrations?.flatMap(reg => 
      reg.tickets?.map(ticket => ({
        ...ticket,
        functionName: reg.functions?.name,
        functionSlug: reg.functions?.slug,
        eventTitle: ticket.event_tickets?.events?.title
      })) || []
    ) || []
  ) || []

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's your attendee dashboard with your events and tickets
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all functions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Events to attend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendees?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Functions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(attendees?.flatMap(a => a.registrations?.map(r => r.functions?.name) || [])).size || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique functions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Your next scheduled events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.length > 0 ? (
              <>
                {upcomingEvents.map((event: any) => (
                  <div key={event.ticketId} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{event.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.functionName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {new Date(event.event_start).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.event_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/attendee/events">View All Events</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No upcoming events found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tickets</CardTitle>
            <CardDescription>All your event tickets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {allTickets.length > 0 ? (
              <>
                {allTickets.slice(0, 5).map((ticket: any) => (
                  <div key={ticket.ticket_id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{ticket.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.functionName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {ticket.status}
                      </p>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/attendee/tickets/${ticket.ticket_id}`}>
                          <QrCode className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/attendee/tickets">View All Tickets</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No tickets found
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-24 flex-col gap-2" asChild>
              <Link href="/attendee/tickets">
                <Ticket className="h-6 w-6" />
                <span>My Tickets</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" asChild>
              <Link href="/attendee/events">
                <Calendar className="h-6 w-6" />
                <span>My Events</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" asChild>
              <Link href="/attendee/profile">
                <User className="h-6 w-6" />
                <span>My Profile</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" asChild>
              <Link href="/portal">
                <MapPin className="h-6 w-6" />
                <span>Portal Hub</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}