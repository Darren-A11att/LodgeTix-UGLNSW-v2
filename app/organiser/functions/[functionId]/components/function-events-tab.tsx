'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Calendar,
  MapPin,
  Ticket,
  MoreVertical,
  Plus,
  Edit,
  Trash,
  Eye,
  Copy,
  Clock
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EventCreateDrawer } from './event-create-drawer'
import { format } from 'date-fns'
import type { Database } from '@/shared/types/database'

type Event = Database['public']['Tables']['events']['Row'] & {
  event_tickets?: Database['public']['Tables']['event_tickets']['Row'][]
}

interface FunctionEventsTabProps {
  functionId: string
  events: Event[]
}

export function FunctionEventsTab({ functionId, events }: FunctionEventsTabProps) {
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const getEventStatus = (event: Event) => {
    const now = new Date()
    const start = new Date(event.event_start)
    const end = new Date(event.event_end)

    if (!event.is_published) {
      return <Badge variant="secondary">Draft</Badge>
    }
    if (now < start) {
      return <Badge variant="default">Upcoming</Badge>
    }
    if (now >= start && now <= end) {
      return <Badge variant="default" className="bg-green-600">Live</Badge>
    }
    return <Badge variant="secondary">Past</Badge>
  }

  const getTicketsSold = (event: Event) => {
    return event.event_tickets?.reduce((sum, ticket) => sum + (ticket.quantity_sold || 0), 0) || 0
  }

  const getTotalCapacity = (event: Event) => {
    return event.event_tickets?.reduce((sum, ticket) => sum + (ticket.quantity_total || 0), 0) || 0
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Events</h3>
          <p className="text-sm text-muted-foreground">
            Manage events within this function
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md shadow-sm">
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setView('grid')}
            >
              Grid
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setView('table')}
            >
              Table
            </Button>
          </div>
          <EventCreateDrawer functionId={functionId} />
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first event to start selling tickets
            </p>
            <EventCreateDrawer functionId={functionId} />
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.event_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {event.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Ticket className="mr-2 h-4 w-4" />
                        Manage Tickets
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        disabled={getTicketsSold(event) > 0}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getEventStatus(event)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{format(new Date(event.event_start), 'PPp')}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tickets Sold</span>
                    <span className="font-medium">
                      {getTicketsSold(event)} / {getTotalCapacity(event)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Tickets
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.event_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {event.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{format(new Date(event.event_start), 'PP')}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(event.event_start), 'p')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{event.location || '-'}</TableCell>
                  <TableCell>{getEventStatus(event)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{getTicketsSold(event)} sold</p>
                      <p className="text-muted-foreground">
                        of {getTotalCapacity(event)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Ticket className="mr-2 h-4 w-4" />
                          Tickets
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}