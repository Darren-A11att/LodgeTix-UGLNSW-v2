import { getEvents, isUsingEventsSchema } from "@/lib/event-facade"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function TestEventsPage() {
  const events = await getEvents()
  const usingEventsSchema = isUsingEventsSchema()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Events Test Page</h1>
      
      <div className="mb-6">
        <Badge variant={usingEventsSchema ? "success" : "secondary"} className="text-lg p-2">
          Source: {usingEventsSchema ? 'events.events schema' : 'Hard-coded'}
        </Badge>
      </div>

      <div className="mb-4">
        <p>Total events: <strong>{events.length}</strong></p>
        <p>Environment variable NEXT_PUBLIC_USE_EVENTS_SCHEMA: <strong>{process.env.NEXT_PUBLIC_USE_EVENTS_SCHEMA || 'not set'}</strong></p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              <CardDescription>{event.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>ID:</strong> {event.id}</p>
                <p><strong>Slug:</strong> {event.slug}</p>
                <p><strong>Category:</strong> {event.category || 'N/A'}</p>
                <p><strong>Date:</strong> {event.date || event.eventStart}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Published:</strong> {event.isPublished ? 'Yes' : 'No'}</p>
                <p><strong>Featured:</strong> {event.featured ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}