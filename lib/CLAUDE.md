# Lib Directory

## Role and Purpose
The `lib` directory contains utility functions, API services, and helper modules that power the LodgeTix application. It includes Supabase client initialization, Stripe integration, data transformation utilities, and registration state management.

## Key Files and Components

### Supabase Integration
- `supabase.ts` - Core Supabase client with table name normalization
- `supabase-browser.ts` - Client-side Supabase instance
- `DB_TABLE_NAMES` mapping to handle casing differences in table names

### API Services
- `/api/` - API service modules organized by domain
  - `/admin/` - Admin-specific API services
    - `adminApiService.ts` - Base admin API functionality
    - `eventAdminService.ts` - Event management functions
    - `ticketAdminService.ts` - Ticket management functions
    - `registrationAdminService.ts` - Registration management
  - `server-actions.ts` - Next.js server actions

### Registration System
- `registration-types.ts` - TypeScript interfaces for registration flow
- `registrationStore.ts` - Zustand store for registration state
- `registrationProgressTracker.ts` - Tracks progress in registration wizard

### Payment Processing
- `stripe.ts` - Stripe integration utilities
- `billing-details-schema.ts` - Zod schema for billing information

### Utilities
- `formatters.ts` - Data formatting utilities (dates, currency, etc.)
- `event-utils.ts` - Event-specific helper functions
- `confirmation-utils.ts` - Order confirmation utilities
- `calendarUtils.ts` - Date and calendar helper functions

### ID Handling
- `id-transition-utils.ts` - Utilities for handling the transition from numeric to UUID IDs
- `uuid-slug-utils.ts` - Functions for working with UUID slugs
- `legacy-event-id-mapping.json` - Mapping between legacy IDs and new UUIDs

### Logging
- `api-logger.ts` - Logging utilities for API calls
- `api-utils.ts` - Common API helper functions

## Commands and Workflows
- Use the Supabase client via `import { supabase, table } from '@/lib/supabase'`
- Access API services via their respective modules
- Manipulate registration state via Zustand hooks

## Conventions and Patterns
1. **Supabase Access**:
   - Use the `table()` function for normalized table names
   - Server-side should use `supabase.ts` 
   - Client-side should use `supabase-browser.ts`

2. **API Service Structure**:
   - Services are organized by domain
   - Functions return consistent response format with data/error

3. **Error Handling**:
   - Services catch errors and return standardized error objects
   - Use try/catch blocks with consistent error formatting

4. **State Management**:
   - Registration state uses Zustand for persistence
   - State slices are defined with selectors

## Dependencies and Relationships
- `supabase.ts` depends on Supabase environment variables
- `stripe.ts` requires Stripe environment variables
- API services rely on Supabase client
- Registration store provides state for registration components
- ID transition utilities are used throughout the app for backward compatibility

## Special Notes and Gotchas
1. **Supabase Table Names**:
   - The application is transitioning to PascalCase table names
   - Use the `table()` function or `DB_TABLE_NAMES` mapping for consistent access

2. **ID Transition**:
   - System is migrating from numeric IDs to UUIDs
   - Use functions in `id-transition-utils.ts` to handle both formats
   - `isUuid()` and `getResourceByAnyId()` functions handle both ID types

3. **Registration State**:
   - Registration state is persisted in localStorage via Zustand
   - Complex state structure with attendees, tickets, and order information
   - Draft recovery is implemented for interrupted sessions

4. **Environment Variables**:
   - Required variables documented in root CLAUDE.md
   - Missing variables will trigger console warnings