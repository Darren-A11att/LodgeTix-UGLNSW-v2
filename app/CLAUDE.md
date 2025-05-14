# App Directory

## Role and Purpose
This directory contains the Next.js App Router pages and API routes for the LodgeTix application. The app directory follows Next.js 13+ App Router conventions, with each folder representing a route and containing page.tsx files for UI rendering.

## Key Files and Components

### Root Structure
- `layout.tsx` - Root layout wrapping all pages with AuthProvider and LocationInitializer
- `page.tsx` - Homepage with Grand Installation hero and event listings
- `loading.tsx` - Loading UI placeholder for Suspense boundaries
- `globals.css` - Global CSS styles using Tailwind
- `disableFastRefreshLogs.js` - Utility to suppress Fast Refresh console messages

### Major Sections
- `/about` - About page for the platform
- `/events` - Event listing and detail pages
  - `/[id]` - Dynamic event page based on event ID
  - `/[id]/tickets` - Ticket selection for specific event
  - `/[id]/confirmation` - Order confirmation page
  - `/grand-installation` - Dedicated section for the Grand Installation event
- `/organizer` - Admin portal for event organizers
  - `/dashboard` - Event management dashboard
  - `/create-event` - Event creation form
  - `/login` and `/signup` - Authentication pages
- `/test-location` - Development testing page for location services

### API Routes
- `/api/auth` - Authentication endpoints
- `/api/stripe/create-payment-intent` - Stripe payment processing endpoint

## Commands and Workflows
- Pages follow Next.js App Router structure with page.tsx defining UI
- API routes use route.ts for handler definitions
- Protected routes require authentication via middleware.ts
- Responsive design with mobile-first approach using Tailwind

## Conventions and Patterns
1. **Route Structure**:
   - Folder = route segment
   - page.tsx = UI for route
   - layout.tsx = shared UI wrapper
   - route.ts = API endpoint handler

2. **Dynamic Routes**:
   - `[id]` format for dynamic segments
   - Params passed to page components

3. **Server Components**:
   - Pages are React Server Components by default
   - Client components marked with "use client" directive

4. **Data Fetching**:
   - Server components fetch data directly from Supabase
   - Client components use API routes or client Supabase instance

## Dependencies and Relationships
- Relies on `/components` for UI elements
- Uses `/lib` for Supabase client and utility functions
- Wraps application with contexts from `/contexts`
- Shares types with `/shared/types`

## Special Notes and Gotchas
1. **Authentication**:
   - Protected routes require authentication via middleware.ts
   - Redirects to login page for unauthenticated access

2. **Route Handling**:
   - Grand Installation has special dedicated routes for its workflow
   - Dynamic [id] routes work with both legacy numeric IDs and new UUIDs

3. **API Endpoints**:
   - Stripe integration requires environment variables
   - Authentication handled by Supabase, not custom JWT

4. **Performance Considerations**:
   - Use `page.tsx` for initial load content only
   - Heavy components use dynamic imports with Suspense
   - Keep bundle size small by code splitting