# Grand Installation Page (`/app/events/grand-installation/page.tsx`)

## Page Type: Server Component with Redirect

This page is a simple server component that redirects to the dynamic event page for the Grand Installation. It does not render any UI of its own - it only serves as a redirect endpoint.

## Implementation Details

The page uses a very simple pattern:

```typescript
export default async function GrandInstallationPage() {
  // Fetch the grand installation event by slug
  const event = await getEventByIdOrSlug("grand-installation-2025")
  
  if (event) {
    // Redirect to the dynamic event page
    redirect(`/events/${event.slug || event.id}`)
  }
  
  // If event not found, redirect to home
  redirect('/')
}
```

## Data Source

The page only fetches one piece of data via `getEventByIdOrSlug("grand-installation-2025")` which can retrieve from:

1. **Dynamic from Supabase**: When `USE_EVENTS_SCHEMA=true`, finds the event with slug "grand-installation-2025" in Supabase
2. **Hard-coded Mock Data**: When `USE_EVENTS_SCHEMA=false`, finds the event with slug "grand-installation-2025" in mock data

## Hard-coded Constants

There is exactly one hard-coded value:

- `"grand-installation-2025"` - The specific slug used to look up the Grand Installation event

## Variables

Only one variable is used from the fetched event data:
- `event.slug || event.id` - Uses slug as a fallback to the event ID for the redirect URL

## Rendering Pattern

The page follows this simple pattern:
1. Fetches the Grand Installation event data at request time
2. If found, redirects to the dynamic event page using the event's slug or ID
3. If not found, redirects to the home page

This is an example of a "convenience URL" that provides a standardized entry point to a dynamically-generated page.