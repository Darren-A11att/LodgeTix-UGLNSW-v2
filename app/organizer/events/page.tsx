import React from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin, Users, Clock, Eye, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface OrganizerEvent {
  event_id: string
  title: string
  description: string | null
  event_start: string | null
  event_end: string | null
  location: string | null
  slug: string | null
  featured: boolean | null
  max_attendees: number | null
  parent_event_id: string | null
  is_multi_day: boolean | null
  registration_count: number
  event_status: string
}

// Get the current organizer ID from the auth layout context
async function getCurrentOrganizerId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: organizerData } = await supabase
    .rpc('get_organizer_by_user_id', { user_uuid: user.id })
    .single()
  
  return organizerData?.organizer_id || null
}

async function getOrganizerEvents(organizerId: string): Promise<OrganizerEvent[]> {
  const supabase = await createClient()
  
  const { data: events, error } = await supabase
    .rpc('get_organizer_events_with_counts', { org_id: organizerId })
  
  if (error) {
    console.error('Error fetching events:', error)
    return []
  }
  
  return events || []
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'TBA'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusBadge(status: string) {
  const variants = {
    draft: { variant: 'secondary' as const, label: 'Draft' },
    upcoming: { variant: 'default' as const, label: 'Upcoming' },
    active: { variant: 'default' as const, label: 'Active' },
    past: { variant: 'outline' as const, label: 'Past' }
  }
  
  const config = variants[status as keyof typeof variants] || variants.draft
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}

function EventCard({ event }: { event: OrganizerEvent }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{event.title}</CardTitle>
            {event.description && (
              <CardDescription className="line-clamp-2">
                {event.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(event.event_status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/organizer/events/${event.event_id}/registrations`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Registrations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  Edit Event
                  <Badge variant="outline" className="ml-2 text-xs">v4</Badge>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDate(event.event_start)}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-gray-600">
            <Users className="h-4 w-4" />
            <span>
              {event.registration_count} registration{event.registration_count !== 1 ? 's' : ''}
              {event.max_attendees && ` / ${event.max_attendees} max`}
            </span>
          </div>
          
          {event.is_multi_day && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Multi-day event</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/organizer/events/${event.event_id}/registrations`}>
              View Registrations
            </Link>
          </Button>
          
          {event.slug && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/events/${event.slug}`} target="_blank">
                View Public Page
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function EventsPage() {
  const organizerId = await getCurrentOrganizerId()
  
  if (!organizerId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load organizer data.</p>
      </div>
    )
  }
  
  const events = await getOrganizerEvents(organizerId)
  
  // Group events by status
  const upcomingEvents = events.filter(e => e.event_status === 'upcoming')
  const activeEvents = events.filter(e => e.event_status === 'active')
  const pastEvents = events.filter(e => e.event_status === 'past')
  const draftEvents = events.filter(e => e.event_status === 'draft')
  
  const totalRegistrations = events.reduce((sum, event) => sum + Number(event.registration_count), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Events</h1>
          <p className="text-gray-600">
            Manage your events and view registration details
          </p>
        </div>
        <Button disabled>
          Create Event
          <Badge variant="outline" className="ml-2">v4</Badge>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingEvents.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalRegistrations}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Past Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{pastEvents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first event to start managing registrations
            </p>
            <Button disabled>
              Create Your First Event
              <Badge variant="outline" className="ml-2">v4</Badge>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.event_id} event={event} />
                ))}
              </div>
            </div>
          )}
          
          {/* Active Events */}
          {activeEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Events</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeEvents.map((event) => (
                  <EventCard key={event.event_id} event={event} />
                ))}
              </div>
            </div>
          )}
          
          {/* Draft Events */}
          {draftEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Draft Events</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {draftEvents.map((event) => (
                  <EventCard key={event.event_id} event={event} />
                ))}
              </div>
            </div>
          )}
          
          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Events</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pastEvents.map((event) => (
                  <EventCard key={event.event_id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}