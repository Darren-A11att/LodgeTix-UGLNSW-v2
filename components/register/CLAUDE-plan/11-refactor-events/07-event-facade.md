# Event Facade Implementation (`/lib/event-facade.ts`)

## Overview: Data Abstraction Layer

The event facade serves as an abstraction layer that provides consistent access to event data while supporting multiple data sources. It allows for a gradual migration from hard-coded mock data to a database-driven approach.

## Implementation Strategy

The facade uses a feature flag to determine which data source to use:

```typescript
// Feature flag - set this in .env.local
const USE_EVENTS_SCHEMA = process.env.NEXT_PUBLIC_USE_EVENTS_SCHEMA === 'true'
```

For each function, the facade:
1. Checks if `USE_EVENTS_SCHEMA` is true
2. If true, attempts to fetch from Supabase
3. Falls back to hard-coded data on errors
4. If feature flag is false, returns hard-coded data directly

## Data Sources

### Supabase Database
When enabled, data comes from the Events table via the events-schema-service:

```typescript
if (USE_EVENTS_SCHEMA) {
  try {
    const eventService = getNewEventService()
    return await eventService.getPublishedEvents()
  } catch (error) {
    console.error('Error fetching events from events schema, falling back to hard-coded:', error)
    return getHardCodedEvents()
  }
}
```

### Hard-coded Mock Data
The fallback data source is the mock data in `event-utils.ts`:

```typescript
return getHardCodedEvents()
```

## API Functions

The facade provides these main functions:

1. `getEvents()` - Get all events
2. `getEventByIdOrSlug(idOrSlug)` - Get a single event by ID or slug
3. `getEventById(id)` - Alias for getEventByIdOrSlug
4. `getFeaturedEvents()` - Get featured or installation events
5. `getUpcomingEvents(limit)` - Get upcoming events with optional limit
6. `getEventsByCategory(category)` - Get events by category
7. `searchEvents(query)` - Search events by keyword

## Helper Functions

The facade also includes several helper functions:

1. `isUsingEventsSchema()` - Check if Supabase is enabled
2. `getEventUrl(event)` - Generate URL for an event
3. `formatEventDate(event)` - Format event date for display
4. `formatEventTime(event)` - Format event time for display

Internal helper functions for the hard-coded implementation:
- `filterUpcomingEvents(events, limit)`
- `filterEventsByCategory(events, category)`
- `searchHardCodedEvents(events, query)`

## Error Handling

The facade implements robust error handling throughout:
1. Try/catch blocks around all Supabase calls
2. Logging errors to console
3. Automatic fallback to hard-coded data on failure

## Type Safety

The facade works with a consistent `Event` type interface, ensuring consistent data structure regardless of the source.

## Migration Strategy

This facade pattern enables:
1. Running with mock data during development
2. Gradual testing of database integration
3. Easy fallback if database issues occur
4. Simple toggling between data sources