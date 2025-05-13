# API Changes for UUID/Slug Implementation

This document outlines the changes to the LodgeTix API as part of the transition from string IDs to UUID/slug-based identification.

## Summary of Changes

The LodgeTix API now fully supports both UUIDs and slugs for identifying events and related resources. This transition enhances security, improves database integrity, and provides better SEO through user-friendly URLs.

## API Endpoints Updates

### Event Endpoints

#### GET /api/events

**Changes:**
- Response now includes both `id` (UUID) and `slug` for each event
- Query parameters updated to support both slug and UUID-based filtering

**Example Response:**
```json
{
  "data": [
    {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0855",
      "slug": "grand-installation-2023",
      "title": "Grand Installation",
      "description": "...",
      ...
    },
    ...
  ],
  "meta": { ... }
}
```

#### GET /api/events/:idOrSlug

**Changes:**
- Path parameter can now be either a UUID or a slug
- Internal resolution determines the correct resource

**Examples:**
- `/api/events/grand-installation-2023` (using slug)
- `/api/events/d290f1ee-6c54-4b01-90e6-d701748f0855` (using UUID)

**Response:**
```json
{
  "data": {
    "id": "d290f1ee-6c54-4b01-90e6-d701748f0855",
    "slug": "grand-installation-2023",
    "title": "Grand Installation",
    ...
  }
}
```

#### POST /api/events

**Changes:**
- Automatically generates a UUID for the `id` field
- Automatically generates a slug from the title if not provided
- Returns both UUID and slug in the response

**Example Request:**
```json
{
  "title": "New Masonic Lecture Series",
  "description": "Learn about the symbolism of Freemasonry",
  ...
}
```

**Example Response:**
```json
{
  "data": {
    "id": "7f9c02d3-8f9e-4b1a-b97a-f4c0ec92c7f8",
    "slug": "new-masonic-lecture-series",
    "title": "New Masonic Lecture Series",
    ...
  }
}
```

#### PUT/PATCH /api/events/:idOrSlug

**Changes:**
- Path parameter can be either UUID or slug
- If title is updated, slug is regenerated (unless explicitly provided)
- Returns updated resource with both UUID and slug

### Tickets and Registrations

- All endpoints that previously referenced events by string ID now support both UUID and slug
- Internal foreign key relationships use UUIDs exclusively
- API responses include both IDs where applicable

## Transition Handling

The API includes mechanisms to support backward compatibility:

1. **Legacy ID Resolution**: The API can resolve legacy string IDs to corresponding UUIDs using the `legacy_id_mapping` table
2. **URL Redirects**: Requests using old URL patterns are redirected to slug-based URLs
3. **Response Consistency**: All responses consistently include both UUID and slug, allowing client applications to transition gradually

## Client-Side Changes Required

The following changes may be required for client applications:

1. Update model/type definitions to include `slug` properties
2. Update URL generation logic to use slugs instead of IDs where possible
3. Update data processing to handle both ID formats

## Implementation Timeline

Phase 1 (Current): API supports both ID formats, but prefers slugs for URLs
Phase 2 (Future): Deprecation warnings when using non-slug patterns for URLs
Phase 3 (Future): Migration complete, legacy ID support becomes optional

## Example Code

### TypeScript Interface Updates

```typescript
// Before
interface Event {
  id: string;
  title: string;
  // ...
}

// After
interface Event {
  id: string; // UUID
  slug: string; // URL-friendly identifier
  title: string;
  // ...
  legacyId?: string; // Optional, for transition period
}
```

### URL Generation (React Example)

```typescript
// Before
<Link href={`/events/${event.id}`}>View Event</Link>

// After
<Link href={`/events/${event.slug}`}>View Event</Link>
```

### API Request (Fetch Example)

```typescript
// Before
const response = await fetch(`/api/events/${eventId}`);

// After (supports both formats)
const response = await fetch(`/api/events/${eventIdOrSlug}`);
```

## Testing

All API endpoints have been tested with:
1. UUID identifiers
2. Slug identifiers
3. Legacy string IDs (transition period)

Comprehensive tests ensure proper handling of all identification methods.

## References

- [UUID-MIGRATION.md](/docs/UUID-MIGRATION.md) - Detailed migration guide
- [events-data-updated.md](/docs/Application-Data/events-data-updated.md) - Updated event data schemas
- [tables-updated.md](/docs/Supabase-DATA/tables-updated.md) - Updated database schema documentation