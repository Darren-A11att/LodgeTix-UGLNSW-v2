# Events Supabase Migration

This directory contains documentation and scripts for migrating LodgeTix events from hard-coded data to the new `events.events` schema in Supabase.

## Current State

After analysis, we found that:
- ✅ Supabase is already configured and connected
- ✅ A legacy `public."Events"` table exists
- ✅ A new `events.events` schema is being created
- ❌ Most pages still use hard-coded events from `/lib/event-utils.ts`

## The New Approach: events.events Schema

Instead of using the legacy `public."Events"` table, we're creating a clean `events.events` table in a dedicated schema for better organization and modern structure.

## Implementation Files

1. **[01-events-schema-definition.sql](./01-events-schema-definition.sql)**
   - Complete schema definition for `events.events`
   - Includes indexes, RLS policies, and views
   - Creates the `events` schema namespace

2. **[02-seed-events-schema.ts](./02-seed-events-schema.ts)**
   - Seeds data into the new `events.events` table
   - Supports both hard-coded and full seed data migration
   - Uses proper schema namespace

3. **[03-events-schema-service.ts](./03-events-schema-service.ts)**
   - New event service for `events.events` table
   - Handles all CRUD operations
   - Configured for events schema

4. **[08-event-facade.ts](./08-event-facade.ts)**
   - Facade pattern for gradual migration
   - Switch between hard-coded and database events
   - Uses feature flag

5. **[00-README-events-schema.md](./00-README-events-schema.md)**
   - Detailed documentation for the new schema approach

## Quick Start Guide

### 1. Create the Schema
```sql
-- Run on Supabase SQL editor
-- Copy contents of 01-events-schema-definition.sql
```

### 2. Seed the Data
```bash
# Install dependencies
npm install

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=your_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Basic migration
npx ts-node .development/events-supabase/02-seed-events-schema.ts

# Full migration with seed data
npx ts-node .development/events-supabase/02-seed-events-schema.ts --full
```

### 3. Update Your Code
```bash
# Copy the new service
cp .development/events-supabase/03-events-schema-service.ts lib/services/

# Copy the facade (for gradual migration)
cp .development/events-supabase/08-event-facade.ts lib/
```

### 4. Update Imports
```typescript
// Option 1: Use facade for gradual migration
import { getEvents } from '@/lib/event-facade'

// Option 2: Use new service directly
import { getEventService } from '@/lib/services/events-schema-service'
```

### 5. Enable the New Schema
```bash
# In .env.local
NEXT_PUBLIC_USE_EVENTS_SCHEMA=true
```

## Why events.events?

1. **Clean Namespace**: Separate schema for events-related tables
2. **Modern Structure**: UUIDs, JSONB, computed columns
3. **No Legacy Baggage**: Fresh start with proper design
4. **Better Organization**: Clear separation of concerns
5. **Flexibility**: JSONB fields for complex data structures

## Migration Strategy

### Option 1: Direct Replacement (Recommended for new projects)
1. Create schema and seed data
2. Update all imports to use new service
3. Remove hard-coded events

### Option 2: Gradual Migration (Recommended for existing projects)
1. Create schema and seed data
2. Use facade pattern with feature flag
3. Migrate pages incrementally
4. Remove old code when complete

## Benefits

- **Clean Architecture**: Dedicated events schema
- **Flexible Data**: JSONB for complex structures
- **Better Performance**: Proper indexes
- **Easy Rollback**: Feature flags enable instant rollback
- **Future-Proof**: Ready for additional event-related tables

## Next Steps

After successful migration:
1. Remove hard-coded events from `/lib/event-utils.ts`
2. Build admin UI for event management
3. Add event search and filtering
4. Implement event analytics