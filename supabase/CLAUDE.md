# Supabase Database Documentation

## Overview
Database schema and migrations for LodgeTix platform. All function references use UUIDs as primary identifiers.

## Key Migrations

### Function UUID Migration
- **File**: `20250103000000_update_get_function_details_to_use_uuid.sql`
- **Purpose**: Update RPC function to accept UUID instead of slug
- **Function**: `get_function_details(p_function_id UUID)`

### Functions Table Structure
```sql
CREATE TABLE functions (
  function_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location_id UUID REFERENCES locations(location_id),
  organiser_id UUID REFERENCES organisations(organisation_id),
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## RPC Functions

### get_function_details
```sql
CREATE OR REPLACE FUNCTION get_function_details(p_function_id UUID)
RETURNS TABLE (
  function_id UUID,
  name TEXT,
  slug TEXT,
  -- ... other fields
)
```
- Accepts UUID parameter
- Returns complete function data with events and packages
- Used by API routes

### create_function_registration
- Accepts `p_function_id UUID` parameter
- Creates registration linked to function
- Handles attendee and ticket creation

## Relationships
- `events.function_id` → `functions.function_id`
- `packages.function_id` → `functions.function_id`
- `registrations.function_id` → `functions.function_id`

## Views
- `function_event_tickets_view` - Tickets grouped by function
- `function_packages_view` - Packages with function details
- `event_display_view` - Events with function information

## RLS Policies
All tables have RLS enabled with policies for:
- Public read access for published functions
- Authenticated write access for organizers
- Service role bypass for API operations

## Important Notes
1. **Always use UUIDs** in foreign key references
2. **Slugs are unique** but not used for relationships
3. **RLS is enforced** - use proper authentication
4. **Migrations are sequential** - order matters

## Common Queries

### Get Function by UUID
```sql
SELECT * FROM functions WHERE function_id = $1;
```

### Get Function by Slug (for URL resolution only)
```sql
SELECT function_id FROM functions WHERE slug = $1;
```

### Get All Events for Function
```sql
SELECT * FROM events 
WHERE function_id = $1 
  AND is_published = true
ORDER BY event_start;
```