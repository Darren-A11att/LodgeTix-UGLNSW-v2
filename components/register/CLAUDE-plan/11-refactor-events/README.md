# Event Pages Refactoring

This directory contains documentation for the event pages implementation, analyzing which pages are static versus dynamic, and what constants and variables are used in each page.

## Pages Overview

1. [01-events-id-page.md](./01-events-id-page.md) - Main event detail page (`/app/events/[id]/page.tsx`)
2. [02-events-id-tickets-page.md](./02-events-id-tickets-page.md) - Event tickets page (`/app/events/[id]/tickets/page.tsx`)
3. [03-events-id-confirmation-page.md](./03-events-id-confirmation-page.md) - Order confirmation page (`/app/events/[id]/confirmation/page.tsx`)
4. [04-grand-installation-page.md](./04-grand-installation-page.md) - Grand Installation redirect page (`/app/events/grand-installation/page.tsx`)
5. [05-grand-installation-register-page.md](./05-grand-installation-register-page.md) - Grand Installation registration page (`/app/events/grand-installation/register/page.tsx`)
6. [06-grand-installation-tickets-page.md](./06-grand-installation-tickets-page.md) - Grand Installation tickets page (`/app/events/grand-installation/tickets/page.tsx`)

## Data Management

All event pages utilize the event-facade pattern implemented in `/lib/event-facade.ts`, which provides a consistent interface for event data retrieval while supporting both hard-coded mock data and Supabase database integration.

## Feature Flag

The application uses a feature flag to toggle between mock data and Supabase:

```typescript
// From /lib/event-facade.ts
const USE_EVENTS_SCHEMA = process.env.NEXT_PUBLIC_USE_EVENTS_SCHEMA === 'true'
```

When set to `true`, the application will fetch events from Supabase. Otherwise, it will use hard-coded mock data from `/lib/event-utils.ts`.