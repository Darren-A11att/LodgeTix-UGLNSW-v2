# Event Tickets Page (`/app/events/[id]/tickets/page.tsx`)

## Page Type: Server Component (Dynamic Rendering)

This page is implemented as a Next.js server component that dynamically fetches data at request time. It does not implement `generateStaticParams()`, so pages are generated on-demand instead of at build time.

## Implementation Details

The page uses the server-side data fetching pattern:

```typescript
export default async function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Server-side data fetching from facade
  const event = await getEventById(id)
  
  if (!event) {
    notFound()
  }
  
  // Rest of the component...
}
```

## Data Source

Data is fetched via `getEventById(id)` which can retrieve from:

1. **Dynamic from Supabase**: When `USE_EVENTS_SCHEMA=true`, data comes from the Events table
2. **Hard-coded Mock Data**: When `USE_EVENTS_SCHEMA=false`, data comes from the mock events in `event-utils.ts`

## Variables and Constants

### Dynamic from Supabase (when enabled)

These fields come from the Supabase database:

- `event.id` - UUID from database
- `event.slug` - URL-friendly identifier
- `event.title` - Event title
- `event.date` - Formatted date string
- `event.location` - Event location
- `event.tickets` - Array of ticket objects with:
  - `id` - Ticket identifier
  - `name` - Ticket name
  - `price` - Ticket price
  - `available` - Availability status

### Hard-coded Mock Data

When using mock data, the same fields are supplied from the hard-coded array in `event-utils.ts`. Example ticket data:

```typescript
tickets: [
  { id: "1", name: "Standard Access", price: 75, available: true },
  { id: "2", name: "VIP Access", price: 120, available: true },
  { id: "3", name: "Full Weekend Pass", price: 200, available: true },
],
```

## Component Props

The `TicketSelectionWithOrder` component receives the following props:

- `tickets` - Array of ticket options from the event
- `eventId` - UUID of the event
- `eventSlug` - URL-friendly slug for the event

## Rendering Pattern

The page follows this pattern:
1. Dynamically fetches event data at request time
2. Renders a header with navigation back to the event
3. Shows event title, date, and location
4. Passes ticket data to the `TicketSelectionWithOrder` component for interactive ticket selection

## Child Components

The page uses the `TicketSelectionWithOrder` component from `./components/ticket-selection-with-order`, which likely handles:
- Ticket selection UI
- Order summary
- Add to cart functionality