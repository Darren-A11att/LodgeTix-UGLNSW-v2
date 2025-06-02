# Database Migration TODOs: Functions-Based Architecture Refactor

## Overview
This document contains detailed migration tasks for refactoring from parent-child events to functions-based architecture. Each task includes specific SQL operations, validation queries, and rollback procedures.

## Migration Phases

### Phase 1: Schema Addition (Non-Breaking Changes)
Add new structures without affecting existing functionality.

---

## DB-001: Create Functions Table

**Description:** Create the new functions table to replace parent events as containers.

**Dependencies:** None

**Risk Level:** Low

**Estimated Time:** 30 minutes

**SQL Operations:**
```sql
-- Create functions table
CREATE TABLE public.functions (
  function_id UUID NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  organiser_id UUID NOT NULL,
  location_id UUID,
  metadata JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT functions_pkey PRIMARY KEY (function_id),
  CONSTRAINT functions_organiser_id_fkey FOREIGN KEY (organiser_id) 
    REFERENCES public.organisations(organisation_id) ON DELETE RESTRICT,
  CONSTRAINT functions_location_id_fkey FOREIGN KEY (location_id) 
    REFERENCES public.locations(location_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_functions_slug ON public.functions(slug);
CREATE INDEX idx_functions_organiser_id ON public.functions(organiser_id);
CREATE INDEX idx_functions_is_published ON public.functions(is_published);
CREATE INDEX idx_functions_dates ON public.functions(start_date, end_date);

-- Add update trigger
CREATE TRIGGER update_functions_updated_at 
  BEFORE UPDATE ON public.functions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

**Validation Queries:**
```sql
-- Verify table creation
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'functions'
);

-- Verify constraints
SELECT 
  tc.constraint_name, 
  tc.constraint_type,
  tc.table_name
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'functions'
ORDER BY tc.constraint_type;

-- Verify indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'functions';
```

**Rollback Procedure:**
```sql
DROP TABLE IF EXISTS public.functions CASCADE;
```

---

## DB-002: Add function_id to Events Table

**Description:** Add function_id column to events table to establish new relationship.

**Dependencies:** DB-001

**Risk Level:** Low

**Estimated Time:** 15 minutes

**SQL Operations:**
```sql
-- Add function_id column (nullable initially)
ALTER TABLE public.events 
ADD COLUMN function_id UUID;

-- Add foreign key constraint
ALTER TABLE public.events
ADD CONSTRAINT events_function_id_fkey 
FOREIGN KEY (function_id) 
REFERENCES public.functions(function_id) ON DELETE RESTRICT;

-- Create index for performance
CREATE INDEX idx_events_function_id ON public.events(function_id);
```

**Validation Queries:**
```sql
-- Verify column addition
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events' AND column_name = 'function_id';

-- Verify foreign key
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'events' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'function_id';
```

**Rollback Procedure:**
```sql
ALTER TABLE public.events DROP COLUMN IF EXISTS function_id CASCADE;
```

---

## DB-003: Add function_id to Registrations Table

**Description:** Add function_id column to registrations table for new relationship model.

**Dependencies:** DB-001

**Risk Level:** Low

**Estimated Time:** 15 minutes

**SQL Operations:**
```sql
-- Add function_id column (nullable initially)
ALTER TABLE public.registrations 
ADD COLUMN function_id UUID;

-- Add foreign key constraint
ALTER TABLE public.registrations
ADD CONSTRAINT registrations_function_id_fkey 
FOREIGN KEY (function_id) 
REFERENCES public.functions(function_id) ON DELETE RESTRICT;

-- Create index for performance
CREATE INDEX idx_registrations_function_id ON public.registrations(function_id);
```

**Validation Queries:**
```sql
-- Verify column addition
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations' AND column_name = 'function_id';

-- Verify index creation
SELECT indexname FROM pg_indexes 
WHERE tablename = 'registrations' AND indexname = 'idx_registrations_function_id';
```

**Rollback Procedure:**
```sql
ALTER TABLE public.registrations DROP COLUMN IF EXISTS function_id CASCADE;
```

---

## DB-004: Add function_id to Packages Table

**Description:** Add function_id column to packages table to replace parent_event_id relationship.

**Dependencies:** DB-001

**Risk Level:** Low

**Estimated Time:** 15 minutes

**SQL Operations:**
```sql
-- Add function_id column (nullable initially)
ALTER TABLE public.packages 
ADD COLUMN function_id UUID;

-- Add foreign key constraint
ALTER TABLE public.packages
ADD CONSTRAINT packages_function_id_fkey 
FOREIGN KEY (function_id) 
REFERENCES public.functions(function_id) ON DELETE RESTRICT;

-- Create index for performance
CREATE INDEX idx_packages_function_id ON public.packages(function_id);
```

**Validation Queries:**
```sql
-- Verify column addition and constraint
SELECT 
  c.column_name,
  c.data_type,
  c.is_nullable,
  tc.constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu 
  ON c.column_name = kcu.column_name AND c.table_name = kcu.table_name
LEFT JOIN information_schema.table_constraints tc 
  ON kcu.constraint_name = tc.constraint_name
WHERE c.table_name = 'packages' AND c.column_name = 'function_id';
```

**Rollback Procedure:**
```sql
ALTER TABLE public.packages DROP COLUMN IF EXISTS function_id CASCADE;
```

---

## DB-005: Update Attendees Table Structure

**Description:** Add new columns to attendees table for event relationships and partner tracking.

**Dependencies:** None

**Risk Level:** Low

**Estimated Time:** 20 minutes

**SQL Operations:**
```sql
-- Add attending_events array column
ALTER TABLE public.attendees 
ADD COLUMN attending_events UUID[] DEFAULT '{}';

-- Add partner relationship columns
ALTER TABLE public.attendees 
ADD COLUMN is_partner_of UUID,
ADD COLUMN has_partner_attendee_id UUID;

-- Add foreign key constraints for partner relationships
ALTER TABLE public.attendees
ADD CONSTRAINT attendees_is_partner_of_fkey 
FOREIGN KEY (is_partner_of) 
REFERENCES public.attendees(attendee_id) ON DELETE SET NULL;

ALTER TABLE public.attendees
ADD CONSTRAINT attendees_has_partner_attendee_id_fkey 
FOREIGN KEY (has_partner_attendee_id) 
REFERENCES public.attendees(attendee_id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_attendees_attending_events ON public.attendees USING GIN(attending_events);
CREATE INDEX idx_attendees_is_partner_of ON public.attendees(is_partner_of);
CREATE INDEX idx_attendees_has_partner_attendee_id ON public.attendees(has_partner_attendee_id);
```

**Validation Queries:**
```sql
-- Verify columns addition
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'attendees' 
AND column_name IN ('attending_events', 'is_partner_of', 'has_partner_attendee_id');

-- Count should be 3
SELECT COUNT(*) as new_columns_count
FROM information_schema.columns
WHERE table_name = 'attendees' 
AND column_name IN ('attending_events', 'is_partner_of', 'has_partner_attendee_id');
```

**Rollback Procedure:**
```sql
ALTER TABLE public.attendees 
DROP COLUMN IF EXISTS attending_events,
DROP COLUMN IF EXISTS is_partner_of,
DROP COLUMN IF EXISTS has_partner_attendee_id CASCADE;
```

---

### Phase 2: Data Migration
Migrate existing data to new structure.

---

## DB-011: Create Parent Event to Function Migration

**Description:** Migrate all parent events to the functions table with data transformation.

**Dependencies:** DB-001, DB-002, DB-003, DB-004

**Risk Level:** High

**Estimated Time:** 2 hours

**SQL Operations:**
```sql
-- Begin transaction for safety
BEGIN;

-- Insert parent events into functions table
INSERT INTO public.functions (
  function_id,
  name,
  slug,
  description,
  image_url,
  start_date,
  end_date,
  organiser_id,
  location_id,
  metadata,
  is_published,
  created_at,
  updated_at
)
SELECT 
  event_id as function_id,
  title as name,
  slug,
  description,
  image_url,
  event_start as start_date,
  event_end as end_date,
  organiser_id,
  location_id,
  jsonb_build_object(
    'sections', COALESCE(sections, '{}'),
    'attendance', COALESCE(attendance, '{}'),
    'documents', COALESCE(documents, '{}'),
    'regalia', regalia,
    'regalia_description', regalia_description,
    'dress_code', dress_code,
    'degree_type', degree_type,
    'important_information', important_information,
    'event_includes', event_includes,
    'registration_availability_id', registration_availability_id,
    'display_scope_id', display_scope_id,
    'stripe_product_id', stripe_product_id,
    'max_attendees', max_attendees
  ) as metadata,
  is_published,
  created_at,
  updated_at
FROM public.events
WHERE parent_event_id IS NULL;

-- Log migration details
CREATE TEMP TABLE migration_log_parent_to_function AS
SELECT 
  e.event_id as original_event_id,
  e.title as original_title,
  f.function_id,
  f.name as function_name,
  'parent_to_function' as migration_type,
  now() as migrated_at
FROM public.events e
JOIN public.functions f ON e.event_id = f.function_id
WHERE e.parent_event_id IS NULL;

-- Verify migration count
SELECT 
  COUNT(*) as parent_events_count,
  (SELECT COUNT(*) FROM public.functions) as functions_count
FROM public.events 
WHERE parent_event_id IS NULL;

COMMIT;
```

**Validation Queries:**
```sql
-- Verify all parent events were migrated
SELECT 
  e.event_id,
  e.title,
  f.function_id,
  f.name
FROM public.events e
LEFT JOIN public.functions f ON e.event_id = f.function_id
WHERE e.parent_event_id IS NULL AND f.function_id IS NULL;

-- Should return 0 rows if successful

-- Verify data integrity
SELECT 
  e.event_id,
  e.title,
  f.name,
  e.organiser_id = f.organiser_id as organiser_match,
  e.location_id = f.location_id as location_match,
  e.slug = f.slug as slug_match
FROM public.events e
JOIN public.functions f ON e.event_id = f.function_id
WHERE e.parent_event_id IS NULL
AND (
  e.organiser_id != f.organiser_id OR
  e.location_id IS DISTINCT FROM f.location_id OR
  e.slug != f.slug
);
-- Should return 0 rows if data migrated correctly
```

**Rollback Procedure:**
```sql
-- Delete migrated functions (only those that came from parent events)
DELETE FROM public.functions 
WHERE function_id IN (
  SELECT event_id FROM public.events WHERE parent_event_id IS NULL
);
```

---

## DB-012: Update Child Events with Function References

**Description:** Update all child events to reference their parent's new function_id.

**Dependencies:** DB-011

**Risk Level:** High

**Estimated Time:** 1 hour

**SQL Operations:**
```sql
BEGIN;

-- Update child events with function_id from their parent
UPDATE public.events e_child
SET function_id = e_parent.event_id
FROM public.events e_parent
WHERE e_child.parent_event_id = e_parent.event_id
  AND e_parent.parent_event_id IS NULL;

-- Verify update count
SELECT 
  COUNT(*) as updated_child_events
FROM public.events 
WHERE parent_event_id IS NOT NULL AND function_id IS NOT NULL;

-- Log the updates
CREATE TEMP TABLE migration_log_child_events AS
SELECT 
  e.event_id,
  e.title,
  e.parent_event_id,
  e.function_id,
  'child_event_function_link' as migration_type,
  now() as migrated_at
FROM public.events e
WHERE e.parent_event_id IS NOT NULL;

COMMIT;
```

**Validation Queries:**
```sql
-- Verify all child events have function_id
SELECT COUNT(*) as orphaned_child_events
FROM public.events
WHERE parent_event_id IS NOT NULL AND function_id IS NULL;
-- Should return 0

-- Verify function_id matches parent's event_id
SELECT 
  e.event_id,
  e.title,
  e.parent_event_id,
  e.function_id,
  p.event_id as parent_event_id_check
FROM public.events e
JOIN public.events p ON e.parent_event_id = p.event_id
WHERE e.function_id != p.event_id;
-- Should return 0 rows
```

**Rollback Procedure:**
```sql
-- Remove function_id from child events
UPDATE public.events
SET function_id = NULL
WHERE parent_event_id IS NOT NULL;
```

---

## DB-013: Migrate Registrations to Functions

**Description:** Update registrations to link to functions instead of parent events.

**Dependencies:** DB-011, DB-012

**Risk Level:** High

**Estimated Time:** 1 hour

**SQL Operations:**
```sql
BEGIN;

-- Update registrations that were for parent events
UPDATE public.registrations r
SET function_id = r.event_id
FROM public.events e
WHERE r.event_id = e.event_id
  AND e.parent_event_id IS NULL;

-- Update registrations that were for child events
UPDATE public.registrations r
SET function_id = e.parent_event_id
FROM public.events e
WHERE r.event_id = e.event_id
  AND e.parent_event_id IS NOT NULL;

-- Create audit log
CREATE TABLE IF NOT EXISTS public.migration_audit_registrations (
  registration_id UUID,
  original_event_id UUID,
  new_function_id UUID,
  migration_type VARCHAR(50),
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.migration_audit_registrations (
  registration_id,
  original_event_id,
  new_function_id,
  migration_type
)
SELECT 
  r.registration_id,
  r.event_id,
  r.function_id,
  CASE 
    WHEN e.parent_event_id IS NULL THEN 'parent_event_registration'
    ELSE 'child_event_registration'
  END
FROM public.registrations r
JOIN public.events e ON r.event_id = e.event_id
WHERE r.function_id IS NOT NULL;

COMMIT;
```

**Validation Queries:**
```sql
-- Check for registrations without function_id
SELECT COUNT(*) as registrations_without_function
FROM public.registrations
WHERE function_id IS NULL;

-- Verify function_id validity
SELECT COUNT(*) as invalid_function_refs
FROM public.registrations r
LEFT JOIN public.functions f ON r.function_id = f.function_id
WHERE r.function_id IS NOT NULL AND f.function_id IS NULL;
-- Should return 0
```

**Rollback Procedure:**
```sql
-- Restore registrations to original state using audit log
UPDATE public.registrations r
SET function_id = NULL
FROM public.migration_audit_registrations mar
WHERE r.registration_id = mar.registration_id;

-- Drop audit table
DROP TABLE IF EXISTS public.migration_audit_registrations;
```

---

## DB-014: Migrate Packages to Functions

**Description:** Update packages to reference functions instead of parent_event_id.

**Dependencies:** DB-011

**Risk Level:** Medium

**Estimated Time:** 45 minutes

**SQL Operations:**
```sql
BEGIN;

-- Update packages with function_id from parent_event_id
UPDATE public.packages p
SET function_id = p.parent_event_id
WHERE p.parent_event_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.functions f 
    WHERE f.function_id = p.parent_event_id
  );

-- Create audit log for packages
CREATE TABLE IF NOT EXISTS public.migration_audit_packages (
  package_id UUID,
  original_parent_event_id UUID,
  new_function_id UUID,
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.migration_audit_packages (
  package_id,
  original_parent_event_id,
  new_function_id
)
SELECT 
  package_id,
  parent_event_id,
  function_id
FROM public.packages
WHERE function_id IS NOT NULL;

COMMIT;
```

**Validation Queries:**
```sql
-- Check packages migration completeness
SELECT 
  COUNT(*) as total_packages,
  COUNT(parent_event_id) as with_parent_event,
  COUNT(function_id) as with_function,
  COUNT(*) FILTER (WHERE parent_event_id IS NOT NULL AND function_id IS NULL) as unmigrated
FROM public.packages;

-- Verify function references are valid
SELECT COUNT(*) as invalid_package_functions
FROM public.packages p
LEFT JOIN public.functions f ON p.function_id = f.function_id
WHERE p.function_id IS NOT NULL AND f.function_id IS NULL;
```

**Rollback Procedure:**
```sql
-- Restore packages using audit log
UPDATE public.packages p
SET function_id = NULL
FROM public.migration_audit_packages map
WHERE p.package_id = map.package_id;

DROP TABLE IF EXISTS public.migration_audit_packages;
```

---

## DB-015: Populate Attendees attending_events Array

**Description:** Migrate attendee_events junction table data to attending_events array column.

**Dependencies:** DB-005

**Risk Level:** Medium

**Estimated Time:** 1 hour

**SQL Operations:**
```sql
BEGIN;

-- Update attending_events array from attendee_events table
UPDATE public.attendees a
SET attending_events = ae.event_ids
FROM (
  SELECT 
    attendee_id,
    array_agg(DISTINCT event_id ORDER BY event_id) as event_ids
  FROM public.attendee_events
  WHERE status = 'confirmed'
  GROUP BY attendee_id
) ae
WHERE a.attendee_id = ae.attendee_id;

-- Create audit log
CREATE TABLE IF NOT EXISTS public.migration_audit_attendee_events (
  attendee_id UUID,
  old_event_count INTEGER,
  new_event_count INTEGER,
  event_ids UUID[],
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.migration_audit_attendee_events (
  attendee_id,
  old_event_count,
  new_event_count,
  event_ids
)
SELECT 
  a.attendee_id,
  (SELECT COUNT(*) FROM public.attendee_events ae WHERE ae.attendee_id = a.attendee_id),
  array_length(a.attending_events, 1),
  a.attending_events
FROM public.attendees a
WHERE a.attending_events IS NOT NULL AND array_length(a.attending_events, 1) > 0;

COMMIT;
```

**Validation Queries:**
```sql
-- Compare counts between old and new structure
SELECT 
  'attendee_events table' as source,
  COUNT(DISTINCT attendee_id) as unique_attendees,
  COUNT(*) as total_relationships
FROM public.attendee_events
WHERE status = 'confirmed'
UNION ALL
SELECT 
  'attending_events array' as source,
  COUNT(*) as unique_attendees,
  SUM(array_length(attending_events, 1)) as total_relationships
FROM public.attendees
WHERE attending_events IS NOT NULL AND array_length(attending_events, 1) > 0;

-- Check for data discrepancies
SELECT 
  a.attendee_id,
  array_length(a.attending_events, 1) as array_count,
  ae_count.event_count as junction_count
FROM public.attendees a
JOIN (
  SELECT attendee_id, COUNT(*) as event_count
  FROM public.attendee_events
  WHERE status = 'confirmed'
  GROUP BY attendee_id
) ae_count ON a.attendee_id = ae_count.attendee_id
WHERE array_length(a.attending_events, 1) != ae_count.event_count;
```

**Rollback Procedure:**
```sql
-- Clear attending_events arrays
UPDATE public.attendees
SET attending_events = '{}';

DROP TABLE IF EXISTS public.migration_audit_attendee_events;
```

---

### Phase 3: Schema Update
Update constraints and relationships.

---

## DB-021: Add NOT NULL Constraints

**Description:** Add NOT NULL constraints to migrated columns after data population.

**Dependencies:** DB-011 through DB-015

**Risk Level:** Medium

**Estimated Time:** 30 minutes

**SQL Operations:**
```sql
BEGIN;

-- Make function_id NOT NULL on events (except parent events which will be removed)
ALTER TABLE public.events
ALTER COLUMN function_id SET NOT NULL
WHERE parent_event_id IS NOT NULL;

-- Make function_id NOT NULL on registrations
ALTER TABLE public.registrations
ALTER COLUMN function_id SET NOT NULL;

-- Make function_id NOT NULL on packages
ALTER TABLE public.packages
ALTER COLUMN function_id SET NOT NULL;

COMMIT;
```

**Validation Queries:**
```sql
-- Verify constraints
SELECT 
  table_name,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('events', 'registrations', 'packages')
  AND column_name = 'function_id'
ORDER BY table_name;
```

**Rollback Procedure:**
```sql
-- Remove NOT NULL constraints
ALTER TABLE public.events ALTER COLUMN function_id DROP NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN function_id DROP NOT NULL;
ALTER TABLE public.packages ALTER COLUMN function_id DROP NOT NULL;
```

---

## DB-022: Create New Indexes and Update Statistics

**Description:** Create optimized indexes for new relationships and update table statistics.

**Dependencies:** DB-021

**Risk Level:** Low

**Estimated Time:** 45 minutes

**SQL Operations:**
```sql
-- Create composite indexes for common queries
CREATE INDEX idx_events_function_published 
ON public.events(function_id, is_published) 
WHERE function_id IS NOT NULL;

CREATE INDEX idx_registrations_function_status 
ON public.registrations(function_id, status);

CREATE INDEX idx_packages_function_active 
ON public.packages(function_id, is_active);

-- Create indexes for filtering
CREATE INDEX idx_functions_organiser_published 
ON public.functions(organiser_id, is_published);

-- Update table statistics
ANALYZE public.functions;
ANALYZE public.events;
ANALYZE public.registrations;
ANALYZE public.packages;
ANALYZE public.attendees;
```

**Validation Queries:**
```sql
-- Verify indexes creation
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('functions', 'events', 'registrations', 'packages')
  AND indexname LIKE '%function%'
ORDER BY tablename, indexname;

-- Check table statistics freshness
SELECT 
  schemaname,
  tablename,
  n_tup_ins + n_tup_upd + n_tup_del as total_changes,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN ('functions', 'events', 'registrations', 'packages', 'attendees');
```

**Rollback Procedure:**
```sql
DROP INDEX IF EXISTS idx_events_function_published;
DROP INDEX IF EXISTS idx_registrations_function_status;
DROP INDEX IF EXISTS idx_packages_function_active;
DROP INDEX IF EXISTS idx_functions_organiser_published;
```

---

## DB-023: Update RPC Functions

**Description:** Create new RPC functions to work with functions-based architecture.

**Dependencies:** DB-021

**Risk Level:** High

**Estimated Time:** 2 hours

**SQL Operations:**
```sql
-- Create function to get function with all details
CREATE OR REPLACE FUNCTION get_function_with_details(p_function_id UUID)
RETURNS TABLE (
  function_id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  image_url VARCHAR,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  organiser_id UUID,
  location_id UUID,
  metadata JSONB,
  is_published BOOLEAN,
  events JSONB,
  packages JSONB,
  location JSONB,
  organiser JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.function_id,
    f.name,
    f.slug,
    f.description,
    f.image_url,
    f.start_date,
    f.end_date,
    f.organiser_id,
    f.location_id,
    f.metadata,
    f.is_published,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'event_id', e.event_id,
          'title', e.title,
          'description', e.description,
          'event_start', e.event_start,
          'event_end', e.event_end,
          'type', e.type,
          'max_attendees', e.max_attendees
        )
      ) FILTER (WHERE e.event_id IS NOT NULL),
      '[]'::jsonb
    ) as events,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'package_id', p.package_id,
          'name', p.name,
          'description', p.description,
          'package_price', p.package_price,
          'is_active', p.is_active
        )
      ) FILTER (WHERE p.package_id IS NOT NULL),
      '[]'::jsonb
    ) as packages,
    CASE WHEN l.location_id IS NOT NULL THEN
      jsonb_build_object(
        'location_id', l.location_id,
        'place_name', l.place_name,
        'street_address', l.street_address,
        'suburb', l.suburb,
        'state', l.state,
        'postal_code', l.postal_code
      )
    ELSE NULL END as location,
    jsonb_build_object(
      'organisation_id', o.organisation_id,
      'name', o.name,
      'type', o.type
    ) as organiser
  FROM public.functions f
  LEFT JOIN public.events e ON f.function_id = e.function_id
  LEFT JOIN public.packages p ON f.function_id = p.function_id
  LEFT JOIN public.locations l ON f.location_id = l.location_id
  LEFT JOIN public.organisations o ON f.organiser_id = o.organisation_id
  WHERE f.function_id = p_function_id
  GROUP BY f.function_id, l.location_id, o.organisation_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get functions by filter
CREATE OR REPLACE FUNCTION get_functions_by_filter(
  p_filter_type VARCHAR DEFAULT NULL,
  p_filter_id UUID DEFAULT NULL
)
RETURNS TABLE (
  function_id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  image_url VARCHAR,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.function_id,
    f.name,
    f.slug,
    f.description,
    f.image_url,
    f.start_date,
    f.end_date,
    f.is_published
  FROM public.functions f
  WHERE 
    CASE 
      WHEN p_filter_type = 'function' AND p_filter_id IS NOT NULL 
        THEN f.function_id = p_filter_id
      WHEN p_filter_type = 'organisation' AND p_filter_id IS NOT NULL 
        THEN f.organiser_id = p_filter_id
      ELSE TRUE
    END
    AND f.is_published = TRUE
  ORDER BY f.start_date;
END;
$$ LANGUAGE plpgsql;
```

**Validation Queries:**
```sql
-- Test RPC functions
SELECT * FROM get_function_with_details(
  (SELECT function_id FROM functions LIMIT 1)
);

SELECT * FROM get_functions_by_filter('organisation', 
  (SELECT organisation_id FROM organisations LIMIT 1)
);
```

**Rollback Procedure:**
```sql
DROP FUNCTION IF EXISTS get_function_with_details(UUID);
DROP FUNCTION IF EXISTS get_functions_by_filter(VARCHAR, UUID);
```

---

### Phase 4: Schema Cleanup
Remove deprecated columns and tables.

---

## DB-031: Archive Parent Event Data

**Description:** Create archive table for parent events before removal.

**Dependencies:** All previous migration tasks

**Risk Level:** Low

**Estimated Time:** 30 minutes

**SQL Operations:**
```sql
-- Create archive table
CREATE TABLE public.archive_parent_events AS
SELECT 
  e.*,
  now() as archived_at,
  'parent_event_to_function_migration' as archive_reason
FROM public.events e
WHERE e.parent_event_id IS NULL;

-- Add indexes on archive table
CREATE INDEX idx_archive_parent_events_event_id 
ON public.archive_parent_events(event_id);

CREATE INDEX idx_archive_parent_events_archived_at 
ON public.archive_parent_events(archived_at);
```

**Validation Queries:**
```sql
-- Verify archive completeness
SELECT 
  (SELECT COUNT(*) FROM events WHERE parent_event_id IS NULL) as parent_events,
  (SELECT COUNT(*) FROM archive_parent_events) as archived_events;
```

**Rollback Procedure:**
```sql
-- Archive table can be kept for safety
-- No rollback needed
```

---

## DB-032: Remove Parent Events from Events Table

**Description:** Delete parent event records from events table after successful migration.

**Dependencies:** DB-031

**Risk Level:** High

**Estimated Time:** 1 hour

**SQL Operations:**
```sql
BEGIN;

-- Verify no dependencies exist
SELECT COUNT(*) as dependent_records
FROM (
  SELECT registration_id FROM registrations WHERE event_id IN (
    SELECT event_id FROM events WHERE parent_event_id IS NULL
  )
  UNION ALL
  SELECT ticket_id FROM tickets WHERE event_id IN (
    SELECT event_id FROM events WHERE parent_event_id IS NULL
  )
) deps;

-- If count is 0, proceed with deletion
DELETE FROM public.events
WHERE parent_event_id IS NULL;

-- Update event_id sequence if needed
SELECT setval('events_event_id_seq', 
  (SELECT MAX(event_id) FROM events)
);

COMMIT;
```

**Validation Queries:**
```sql
-- Verify no parent events remain
SELECT COUNT(*) as remaining_parent_events
FROM public.events
WHERE parent_event_id IS NULL;
-- Should return 0

-- Verify all remaining events have function_id
SELECT COUNT(*) as events_without_function
FROM public.events
WHERE function_id IS NULL;
-- Should return 0
```

**Rollback Procedure:**
```sql
-- Restore from archive
INSERT INTO public.events
SELECT 
  title, description, type, is_purchasable_individually,
  max_attendees, featured, image_url, event_includes,
  important_information, created_at, is_multi_day, event_id,
  parent_event_id, registration_availability_id, display_scope_id,
  slug, event_start, event_end, location_id, subtitle,
  is_published, regalia, regalia_description, dress_code,
  degree_type, sections, attendance, documents, related_events,
  organiser_id, reserved_count, sold_count, stripe_product_id,
  function_id
FROM public.archive_parent_events;
```

---

## DB-033: Drop Deprecated Columns

**Description:** Remove columns that are no longer needed in the new architecture.

**Dependencies:** DB-032

**Risk Level:** Medium

**Estimated Time:** 30 minutes

**SQL Operations:**
```sql
BEGIN;

-- Drop parent_event_id from events
ALTER TABLE public.events 
DROP COLUMN parent_event_id CASCADE;

-- Drop parent_event_id from packages
ALTER TABLE public.packages 
DROP COLUMN parent_event_id CASCADE;

-- Drop event_id from registrations (now uses function_id)
ALTER TABLE public.registrations 
DROP COLUMN event_id CASCADE;

-- Drop attendee_events table (replaced by attending_events array)
DROP TABLE IF EXISTS public.attendee_events CASCADE;

COMMIT;
```

**Validation Queries:**
```sql
-- Verify columns are removed
SELECT 
  table_name,
  column_name
FROM information_schema.columns
WHERE schema_name = 'public'
  AND (
    (table_name = 'events' AND column_name = 'parent_event_id') OR
    (table_name = 'packages' AND column_name = 'parent_event_id') OR
    (table_name = 'registrations' AND column_name = 'event_id')
  );
-- Should return 0 rows

-- Verify table is dropped
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'attendee_events'
);
-- Should return false
```

**Rollback Procedure:**
```sql
-- Re-add columns (data cannot be restored without backup)
ALTER TABLE public.events ADD COLUMN parent_event_id UUID;
ALTER TABLE public.packages ADD COLUMN parent_event_id UUID;
ALTER TABLE public.registrations ADD COLUMN event_id UUID;

-- Recreate attendee_events table
CREATE TABLE public.attendee_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  attendee_id uuid NOT NULL,
  event_id uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'confirmed'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

---

### Phase 5: Validation & Testing

---

## DB-041: Data Integrity Validation

**Description:** Comprehensive validation of migrated data integrity.

**Dependencies:** All previous tasks

**Risk Level:** Low

**Estimated Time:** 1 hour

**SQL Operations:**
```sql
-- Create validation report
CREATE TABLE public.migration_validation_report (
  check_name VARCHAR(100),
  check_description TEXT,
  status VARCHAR(20),
  details JSONB,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Check 1: All events have functions
INSERT INTO public.migration_validation_report (check_name, check_description, status, details)
SELECT 
  'events_have_functions',
  'All events must have a function_id',
  CASE WHEN COUNT(*) = 0 THEN 'PASSED' ELSE 'FAILED' END,
  jsonb_build_object('orphaned_events', COUNT(*))
FROM public.events
WHERE function_id IS NULL;

-- Check 2: All registrations have functions
INSERT INTO public.migration_validation_report (check_name, check_description, status, details)
SELECT 
  'registrations_have_functions',
  'All registrations must have a function_id',
  CASE WHEN COUNT(*) = 0 THEN 'PASSED' ELSE 'FAILED' END,
  jsonb_build_object('orphaned_registrations', COUNT(*))
FROM public.registrations
WHERE function_id IS NULL;

-- Check 3: Function references are valid
INSERT INTO public.migration_validation_report (check_name, check_description, status, details)
SELECT 
  'valid_function_references',
  'All function_id references must be valid',
  CASE WHEN COUNT(*) = 0 THEN 'PASSED' ELSE 'FAILED' END,
  jsonb_build_object(
    'invalid_event_refs', (
      SELECT COUNT(*) FROM events e 
      LEFT JOIN functions f ON e.function_id = f.function_id 
      WHERE e.function_id IS NOT NULL AND f.function_id IS NULL
    ),
    'invalid_registration_refs', (
      SELECT COUNT(*) FROM registrations r 
      LEFT JOIN functions f ON r.function_id = f.function_id 
      WHERE r.function_id IS NOT NULL AND f.function_id IS NULL
    )
  )
FROM (SELECT 1) x
WHERE EXISTS (
  SELECT 1 FROM events e 
  LEFT JOIN functions f ON e.function_id = f.function_id 
  WHERE e.function_id IS NOT NULL AND f.function_id IS NULL
) OR EXISTS (
  SELECT 1 FROM registrations r 
  LEFT JOIN functions f ON r.function_id = f.function_id 
  WHERE r.function_id IS NOT NULL AND f.function_id IS NULL
);

-- Generate final report
SELECT * FROM public.migration_validation_report ORDER BY checked_at;
```

**Validation Queries:**
```sql
-- Summary of validation results
SELECT 
  status,
  COUNT(*) as check_count
FROM public.migration_validation_report
GROUP BY status;

-- Failed checks detail
SELECT * 
FROM public.migration_validation_report
WHERE status = 'FAILED';
```

**Rollback Procedure:**
```sql
DROP TABLE IF EXISTS public.migration_validation_report;
```

---

## DB-042: Performance Testing

**Description:** Test query performance with new structure.

**Dependencies:** DB-041

**Risk Level:** Low

**Estimated Time:** 45 minutes

**SQL Operations:**
```sql
-- Create performance baseline table
CREATE TABLE public.migration_performance_tests (
  test_name VARCHAR(100),
  query_description TEXT,
  execution_time_ms NUMERIC,
  rows_returned INTEGER,
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Test 1: Function listing performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM get_functions_by_filter('organisation', 
  (SELECT organisation_id FROM organisations LIMIT 1)
);

-- Test 2: Function detail retrieval
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM get_function_with_details(
  (SELECT function_id FROM functions LIMIT 1)
);

-- Test 3: Registration queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  r.*,
  f.name as function_name,
  COUNT(a.attendee_id) as attendee_count
FROM registrations r
JOIN functions f ON r.function_id = f.function_id
LEFT JOIN attendees a ON r.registration_id = a.registration_id
WHERE f.organiser_id = (SELECT organisation_id FROM organisations LIMIT 1)
GROUP BY r.registration_id, f.name;
```

**Validation Queries:**
```sql
-- Check for slow queries
SELECT *
FROM public.migration_performance_tests
WHERE execution_time_ms > 1000
ORDER BY execution_time_ms DESC;
```

**Rollback Procedure:**
```sql
DROP TABLE IF EXISTS public.migration_performance_tests;
```

---

## DB-043: Create Migration Rollback Package

**Description:** Create complete rollback script for emergency use.

**Dependencies:** All previous tasks

**Risk Level:** Low

**Estimated Time:** 2 hours

**SQL Operations:**
```sql
-- Create rollback script storage
CREATE TABLE public.migration_rollback_scripts (
  script_id SERIAL PRIMARY KEY,
  phase VARCHAR(50),
  task_id VARCHAR(10),
  rollback_sql TEXT,
  execution_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Store all rollback procedures in order
INSERT INTO public.migration_rollback_scripts (phase, task_id, rollback_sql, execution_order)
VALUES
  ('cleanup', 'DB-033', 'ALTER TABLE public.events ADD COLUMN parent_event_id UUID;', 1),
  ('cleanup', 'DB-033', 'ALTER TABLE public.packages ADD COLUMN parent_event_id UUID;', 2),
  ('cleanup', 'DB-033', 'ALTER TABLE public.registrations ADD COLUMN event_id UUID;', 3),
  -- ... (all other rollback scripts in reverse order)
  ('schema', 'DB-001', 'DROP TABLE IF EXISTS public.functions CASCADE;', 999);

-- Generate complete rollback script
SELECT string_agg(
  '-- ' || task_id || ': ' || phase || E'\n' || rollback_sql || ';',
  E'\n\n' ORDER BY execution_order DESC
) as complete_rollback_script
FROM public.migration_rollback_scripts;
```

**Validation Queries:**
```sql
-- Verify rollback script completeness
SELECT 
  phase,
  COUNT(*) as script_count
FROM public.migration_rollback_scripts
GROUP BY phase
ORDER BY MIN(execution_order);
```

**Rollback Procedure:**
```sql
-- This is the final safety net
-- Execute the complete_rollback_script if needed
```

---

## Summary

This migration plan consists of 43 detailed tasks across 5 phases:

1. **Phase 1 (DB-001 to DB-005)**: Schema additions without breaking changes
2. **Phase 2 (DB-011 to DB-015)**: Data migration from old to new structure  
3. **Phase 3 (DB-021 to DB-023)**: Schema updates and constraints
4. **Phase 4 (DB-031 to DB-033)**: Cleanup of deprecated structures
5. **Phase 5 (DB-041 to DB-043)**: Validation and rollback preparation

**Total Estimated Time**: 14-16 hours of execution time

**Key Risk Mitigation Strategies**:
- Complete backup before starting
- Transaction blocks for all data modifications
- Audit tables for tracking changes
- Validation queries at each step
- Comprehensive rollback procedures
- Performance testing before completion

**Recommended Execution**:
1. Execute in a test environment first
2. Run during low-traffic period
3. Have DBA support available
4. Monitor application logs during migration
5. Keep rollback scripts readily available