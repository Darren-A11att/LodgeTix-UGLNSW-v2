# Event Detail Page (`/app/events/[id]/page.tsx`)

## Page Type: Static Generation with Dynamic Routes

This page uses Next.js static site generation (SSG) with dynamic routes. It pre-renders all event detail pages at build time through the `generateStaticParams()` function.

## Implementation Details

The page fetches event data using the `getEventByIdOrSlug()` function from the event-facade:

```typescript
export async function generateStaticParams() {
  const events = await getEvents();
  return events.map(event => ({
    id: event.slug // Using slug for route parameter
  }));
}
```

## Data Source

Data is fetched via `getEventByIdOrSlug(id)` which can retrieve from:

1. **Dynamic from Supabase**: When `USE_EVENTS_SCHEMA=true`, data comes from the Events table
2. **Hard-coded Mock Data**: When `USE_EVENTS_SCHEMA=false`, data comes from the mock events in `event-utils.ts`

## Variables and Constants

### Dynamic from Supabase (when enabled)

These fields come directly from the Supabase Events table:

- `event.id` - UUID from database
- `event.slug` - URL-friendly identifier
- `event.title` - Event title
- `event.description` - Event description
- `event.date` - Formatted date string
- `event.time` - Formatted time string
- `event.location` - Event location
- `event.imageUrl` - URL to event image
- `event.dressCode` - Event dress code 
- `event.regalia` - Required regalia information
- `event.organizer` - Event organizer name
- `event.price` - Formatted price string
- `event.longDescription` - Extended description text

### Hard-coded Mock Data

When using mock data, all of the same fields are supplied from the hard-coded array in `event-utils.ts`. Example mock event:

```typescript
{
  id: "d290f1ee-6c54-4b01-90e6-d701748f0855",
  slug: "grand-installation",
  title: "Grand Installation 2025",
  description: "Join us for the Installation of MW Bro Bernie Khristian Albano as Grand Master of the United Grand Lodge of NSW & ACT.",
  date: "May 15-17, 2025",
  location: "Sydney Masonic Centre, Sydney",
  imageUrl: "/placeholder.svg?height=400&width=800",
  price: "£75",
  // Other fields...
}
```

## UI Constants

The page contains some hard-coded UI elements that are not dynamic:

1. Header with LodgeTix logo and share button
2. Footer with navigation links and copyright notice
3. Tabs UI with "About" and "Details" sections
4. "Map View" placeholder (non-functional)

## Rendering Pattern

The page follows this pattern:
1. Fetches event data statically at build time
2. Renders all event details in a standard layout
3. Uses conditional rendering for optional fields like `dressCode` and `regalia`
4. Includes a sidebar with ticket information and call-to-action button