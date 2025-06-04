import { notFound } from "next/navigation"
import { CalendarDays, Clock, MapPin } from "lucide-react"
import { resolveFunctionSlug } from "@/lib/utils/function-slug-resolver"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function SchedulePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  // Resolve slug to function ID
  const functionId = await resolveFunctionSlug(slug, true)
  
  // Get function details with events
  const supabase = await createClient()
  
  const { data: functionData, error: functionError } = await supabase
    .from('functions')
    .select(`
      id,
      name,
      events (
        id,
        title,
        description,
        event_start,
        event_end,
        location,
        event_type,
        status
      )
    `)
    .eq('id', functionId)
    .single()
  
  if (functionError || !functionData) {
    return notFound()
  }
  
  // Sort events by start date
  const events = (functionData.events || []).sort((a, b) => 
    new Date(a.event_start).getTime() - new Date(b.event_start).getTime()
  )
  
  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = new Date(event.event_start).toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(event)
    return acc
  }, {} as Record<string, typeof events>)
  
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Event Schedule</h1>
      
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-600">
              Event schedule will be announced soon.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(eventsByDate).map(([dateKey, dayEvents]) => {
            const date = new Date(dateKey)
            const formattedDate = date.toLocaleDateString('en-AU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-4">
                  <CalendarDays className="h-5 w-5 text-gray-500" />
                  <h2 className="text-2xl font-semibold">{formattedDate}</h2>
                </div>
                
                <div className="grid gap-4">
                  {dayEvents.map((event) => {
                    const startTime = new Date(event.event_start).toLocaleTimeString('en-AU', {
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    })
                    const endTime = event.event_end ? new Date(event.event_end).toLocaleTimeString('en-AU', {
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    }) : null
                    
                    return (
                      <Card key={event.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle>{event.title}</CardTitle>
                              <CardDescription className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {startTime}
                                  {endTime && ` - ${endTime}`}
                                </span>
                                {event.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {event.location}
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              {event.event_type && (
                                <Badge variant="secondary">
                                  {event.event_type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                              )}
                              {event.status === 'sold_out' && (
                                <Badge variant="destructive">Sold Out</Badge>
                              )}
                              {event.status === 'cancelled' && (
                                <Badge variant="destructive">Cancelled</Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {event.description && (
                          <CardContent>
                            <p className="text-gray-600">{event.description}</p>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}