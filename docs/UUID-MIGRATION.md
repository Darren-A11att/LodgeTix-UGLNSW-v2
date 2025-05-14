# UUID and Slug Migration Guide

This document describes the migration from string IDs to UUID and slug-based identification for events and related entities in the LodgeTix system.

## Overview

The system is transitioning from using simple string IDs (like "grand-installation-2023") to a more robust approach:

- **UUID**: Each event now has a UUID as its primary key in the database
- **Slug**: Each event has a URL-friendly slug derived from its title for use in URLs

This change provides several benefits:
- Better database integrity with proper UUID primary keys
- Improved security by not exposing sequential or guessable IDs
- SEO-friendly URLs through human-readable slugs
- Clearer separation between internal IDs and public-facing identifiers

## Implementation Details

### Database Changes

1. The `Events` table now uses UUID primary keys
2. A unique `slug` column has been added
3. Foreign keys in related tables have been updated to reference the UUID
4. A mapping table (`LegacyEventIds`) maintains the relationship between legacy IDs and new UUIDs

### API Layer Changes

The API has been updated to:
- Accept both slugs and UUIDs when fetching events
- Return both the UUID and slug in responses
- Use the UUID for relationships internally
- Generate slugs automatically when creating new events

### Frontend Changes

Frontend routes have been updated to use slugs:
- Routes like `/events/grand-installation` now use the slug
- Components pass both ID and slug when needed
- Links are generated using slugs for SEO-friendly URLs

## Migration Process

The migration was performed in multiple steps:

1. Schema updates to add UUID and slug columns
2. Data migration to generate UUIDs and slugs for existing events
3. Update of foreign key relationships
4. Code refactoring for the new ID system
5. Transition period with backward compatibility

## Backward Compatibility

During the transition period:

- Both old string IDs and new slugs are supported in routes
- A mapping service converts between legacy IDs, UUIDs, and slugs
- Legacy integrations continue to work without modification
- Utilities are provided to help with the transition

## Utilities and Helpers

The following utilities have been created:

### `uuid-slug-utils.ts`
- Functions for generating UUIDs and slugs
- Utilities for checking if a string is a UUID

### `id-transition-utils.ts`
- Functions to convert between legacy IDs, UUIDs, and slugs
- Path helpers to ensure URLs use slugs

### Migration Scripts
- Database migration scripts in `supabase/migrations/`
- Node.js migration script in `scripts/migrate-events-to-uuid.js`

## Usage Examples

### Fetching an Event

```typescript
// Get event by either UUID or slug
const event = await getEventByIdOrSlug(idOrSlug);
```

### Generating Links

```tsx
// Use slug for link generation
<Link href={`/events/${event.slug}`}>View Event</Link>
```

### Creating a New Event

```typescript
// When creating an event, slug is generated automatically from title
const newEvent = await createEvent({
  title: "Annual Installation Ceremony 2025",
  // ...other event properties
});
// newEvent.id will be a UUID
// newEvent.slug will be "annual-installation-ceremony-2025"
```

## Best Practices

1. Always use UUIDs for internal references and database operations
2. Always use slugs for user-facing URLs and routes
3. If both ID and slug are available in your data, prefer the slug for route generation
4. Use the helper utilities to handle transitions from legacy code

## Troubleshooting

If you encounter issues with the UUID/slug system:

1. Check if you're using the correct identifier (UUID vs slug)
2. Ensure all related tables have been properly updated
3. Verify the mapping in `legacy-event-id-mapping.json` is up to date
4. Use the transition utilities to handle edge cases