# Events Schema Migration Plan

This directory contains the implementation for migrating to the new `events.events` table structure.

## Overview

The new approach uses a dedicated `events` schema with a clean `events.events` table, separate from the existing `public."Events"` table.

## Schema Structure

```sql
events.events (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  event_start TIMESTAMP WITH TIME ZONE,
  event_end TIMESTAMP WITH TIME ZONE,
  location JSONB,
  -- ... other fields stored as appropriate types
  sections JSONB,      -- Contains about, schedule, details
  documents JSONB,     -- Array of document objects
  related_events UUID[], -- Array of related event IDs
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

## Migration Steps

### 1. Create Schema
Run the schema creation script on Supabase:
```sql
-- Execute 01-events-schema-definition.sql
```

### 2. Seed Data
```bash
# For basic migration from hard-coded events
npx ts-node .development/events-supabase/02-seed-events-schema.ts

# For full migration including seed data
npx ts-node .development/events-supabase/02-seed-events-schema.ts --full
```

### 3. Update Service Layer
Replace the existing event service with the new schema service:
```bash
cp .development/events-supabase/03-events-schema-service.ts lib/services/
```

### 4. Update Imports
In your pages and components:
```typescript
// Old: import { getEventService } from '@/lib/services/event-service'
// New: import { getEventService } from '@/lib/services/events-schema-service'
```

### 5. Feature Flag (Optional)
Use environment variable to switch between services:
```bash
# .env.local
NEXT_PUBLIC_USE_EVENTS_SCHEMA=true
```

## Benefits

1. **Clean Schema**: Dedicated namespace for events
2. **Flexible Structure**: JSONB fields for complex data
3. **No Legacy Baggage**: Fresh start with proper design
4. **Better Performance**: Optimized indexes and structure
5. **Easier Maintenance**: Clear separation of concerns

## File Structure

- `01-events-schema-definition.sql` - Complete schema definition
- `02-seed-events-schema.ts` - Data migration script
- `03-events-schema-service.ts` - Service layer for new schema
- `00-README-events-schema.md` - This file

## Quick Implementation

### Option 1: Direct Replacement
1. Run schema creation SQL
2. Run seed script
3. Replace service imports
4. Test thoroughly

### Option 2: Gradual Migration
1. Run schema creation SQL
2. Run seed script
3. Use both services side-by-side
4. Migrate pages incrementally
5. Remove old service when done

## Data Structure Benefits

The new schema uses:
- **JSONB for location**: Structured address data
- **JSONB for sections**: Flexible content sections
- **JSONB for documents**: Array of document objects
- **UUID[] for related events**: Direct array storage
- **Generated columns**: Automatic is_multi_day calculation

This approach provides maximum flexibility while maintaining performance.