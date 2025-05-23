# LodgeTix - United Grand Lodge NSW & ACT Ticketing Platform

This is a Next.js application for ticket sales and event registration for Masonic events.

## Database Naming Convention Migration

As part of our codebase standardization, we're migrating the database naming conventions from PascalCase/camelCase to snake_case. This README section provides guidance on implementing this change.

### Migration Overview

The migration converts:
- Table names from PascalCase to snake_case (e.g., "EventTickets" → "event_tickets")
- Column names from camelCase to snake_case (e.g., "eventId" → "event_id")
- Constraint names to match the new naming pattern

### Executing the Migration

To run the database migration:

```bash
# Run the migration using Supabase CLI
npm run db:rename-convention
```

### Adapter for Application Code

We've provided a compatibility layer that allows the application to work with both naming conventions during the transition. This adapter:

1. Automatically converts between naming conventions
2. Provides utility functions for manual conversion when needed
3. Wraps Supabase client to handle the naming differences

#### Usage Example

```typescript
// Import the adapter
import { createAdaptedClient } from '../lib/supabase-adapter';

// Create an adapted Supabase client
const supabase = createAdaptedClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Use it like the regular Supabase client
// The adapter handles the naming conversion automatically
const { data, error } = await supabase
  .from('Events')  // Still use PascalCase in code
  .select('*');    // Results will be returned with camelCase keys
```

### Migration Files

The key files for this migration are:

- `/supabase/migrations/20250522-naming-convention-standardization.sql`: SQL migration script
- `/scripts/apply-database-naming-standards.js`: Migration execution script
- `/lib/supabase-adapter.ts`: Compatibility adapter for application code

### Next Steps After Migration

After applying the migration, you should:

1. Update direct database queries in your codebase
2. Transition to using the adapter for Supabase operations
3. Consider updating application code to use the new naming convention

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Important Notes for Development

### Handling Page Refresh Errors

If you encounter 404 errors when refreshing pages during development, try these solutions:

1. **Clear Next.js cache and rebuild**:
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```

2. **Use a production build for testing**:
   ```bash
   npm run build
   npm run start
   ```

3. **Change the development port** if port conflicts occur:
   ```bash
   npm run dev -- -p 3003
   ```

4. **Force a hard refresh** in your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

5. **Check network tab** in browser dev tools to identify specific missing files

### Directory Structure

- `/app`: Next.js App Router pages and API routes
- `/components`: React components (UI elements, forms, registration flow)
- `/lib`: Utility functions, API services, and Supabase client
- `/shared`: Shared types, components, and utilities

## Features

- Event registration system with multi-step wizard
- Masonic-specific form fields
- Ticket management
- Payment processing with Stripe
- Responsive design for mobile and desktop