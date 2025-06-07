# Revised Database Migration Tasks - Direct Cutover

## Overview
Complete one-way migration to functions architecture. No backward compatibility, no technical debt.

---

## DB-001: Create Functions Table (REVISED)

**Priority:** Critical  
**Time:** 1 hour

```sql
-- Create the new functions table
CREATE TABLE public.functions (
    function_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    location_id UUID REFERENCES locations(location_id),
    organiser_id UUID REFERENCES organisations(organisation_id) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_functions_slug ON functions(slug);
CREATE INDEX idx_functions_organiser ON functions(organiser_id);
CREATE INDEX idx_functions_published ON functions(is_published);
```

---

## DB-002: Add Function References (REVISED)

**Priority:** Critical  
**Time:** 30 minutes

```sql
-- Add function_id to events (NOT NULL after migration)
ALTER TABLE events 
ADD COLUMN function_id UUID REFERENCES functions(function_id);

-- Add function_id to registrations
ALTER TABLE registrations 
ADD COLUMN function_id UUID REFERENCES functions(function_id);

-- Add function_id to packages
ALTER TABLE packages 
ADD COLUMN function_id UUID REFERENCES functions(function_id);

-- Create indexes
CREATE INDEX idx_events_function ON events(function_id);
CREATE INDEX idx_registrations_function ON registrations(function_id);
CREATE INDEX idx_packages_function ON packages(function_id);
```

---

## DB-003: Migrate Parent Events to Functions

**Priority:** Critical  
**Time:** 2 hours

```sql
-- Migrate all parent events to functions
INSERT INTO functions (
    name,
    slug,
    description,
    image_url,
    start_date,
    end_date,
    location_id,
    organiser_id,
    metadata,
    is_published
)
SELECT 
    title as name,
    slug,
    description,
    image_url,
    event_start as start_date,
    event_end as end_date,
    location_id,
    organiser_id,
    jsonb_build_object(
        'migrated_from_event_id', event_id,
        'original_metadata', metadata
    ) as metadata,
    is_published
FROM events
WHERE parent_event_id IS NULL
  AND event_id IN (
    SELECT DISTINCT parent_event_id 
    FROM events 
    WHERE parent_event_id IS NOT NULL
  );
```

---

## DB-004: Update All Event References

**Priority:** Critical  
**Time:** 1 hour

```sql
-- Update parent events with their function_id
UPDATE events e
SET function_id = f.function_id
FROM functions f
WHERE e.slug = f.slug
  AND e.parent_event_id IS NULL;

-- Update child events with parent's function_id
UPDATE events child
SET function_id = parent.function_id
FROM events parent
WHERE child.parent_event_id = parent.event_id;

-- Verify no events without function_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM events WHERE function_id IS NULL) THEN
        RAISE EXCEPTION 'Found events without function_id';
    END IF;
END $$;
```

---

## DB-005: Update Registrations to Functions

**Priority:** Critical  
**Time:** 1 hour

```sql
-- Update registrations with function_id from their events
UPDATE registrations r
SET function_id = e.function_id
FROM events e
WHERE r.event_id = e.event_id;

-- For registrations to parent events, use the function directly
UPDATE registrations r
SET function_id = f.function_id
FROM functions f
WHERE r.event_id IN (
    SELECT event_id 
    FROM events 
    WHERE slug = f.slug 
    AND parent_event_id IS NULL
);
```

---

## DB-006: Update Packages to Functions

**Priority:** Critical  
**Time:** 30 minutes

```sql
-- Migrate packages from parent_event_id to function_id
UPDATE packages p
SET function_id = e.function_id
FROM events e
WHERE p.parent_event_id = e.event_id;

-- Verify all packages have function_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM packages WHERE function_id IS NULL) THEN
        RAISE EXCEPTION 'Found packages without function_id';
    END IF;
END $$;
```

---

## DB-007: Make Function References Required

**Priority:** Critical  
**Time:** 30 minutes

```sql
-- Make function_id NOT NULL on all tables
ALTER TABLE events 
ALTER COLUMN function_id SET NOT NULL;

ALTER TABLE registrations 
ALTER COLUMN function_id SET NOT NULL;

ALTER TABLE packages 
ALTER COLUMN function_id SET NOT NULL;
```

---

## DB-008: Drop Legacy Columns and Constraints

**Priority:** Critical  
**Time:** 1 hour

```sql
-- Drop parent_event_id and related constraints
ALTER TABLE events 
DROP COLUMN parent_event_id CASCADE;

-- Drop event_id from registrations (registrations are now to functions)
ALTER TABLE registrations 
DROP COLUMN event_id CASCADE;

-- Drop parent_event_id from packages
ALTER TABLE packages 
DROP COLUMN parent_event_id CASCADE;

-- Clean up any orphaned indexes
DROP INDEX IF EXISTS idx_events_parent;
DROP INDEX IF EXISTS idx_registrations_event;
DROP INDEX IF EXISTS idx_packages_parent_event;
```

---

## DB-009: Update RPC Functions for Functions Architecture

**Priority:** High  
**Time:** 2 hours

```sql
-- New RPC: Get function with all events
CREATE OR REPLACE FUNCTION get_function_details(p_function_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'function', row_to_json(f.*),
        'events', COALESCE(
            (SELECT json_agg(
                row_to_json(e.*)
                ORDER BY e.event_start
            )
            FROM events e
            WHERE e.function_id = f.function_id
              AND e.is_published = true
            ), '[]'::json
        ),
        'packages', COALESCE(
            (SELECT json_agg(
                row_to_json(p.*)
                ORDER BY p.package_price
            )
            FROM packages p
            WHERE p.function_id = f.function_id
              AND p.is_active = true
            ), '[]'::json
        )
    ) INTO v_result
    FROM functions f
    WHERE f.slug = p_function_slug
      AND f.is_published = true;
    
    RETURN v_result;
END;
$$;

-- Drop old RPC functions that use parent_event_id
DROP FUNCTION IF EXISTS get_event_with_children;
DROP FUNCTION IF EXISTS get_parent_event_details;
```

---

## DB-010: Create New Views for Functions

**Priority:** High  
**Time:** 1 hour

```sql
-- Function summary view
CREATE OR REPLACE VIEW function_summary_view AS
SELECT 
    f.*,
    COUNT(DISTINCT e.event_id) as event_count,
    COUNT(DISTINCT r.registration_id) as registration_count,
    MIN(e.event_start) as first_event_start,
    MAX(e.event_end) as last_event_end,
    SUM(r.total_amount_paid) as total_revenue
FROM functions f
LEFT JOIN events e ON e.function_id = f.function_id
LEFT JOIN registrations r ON r.function_id = f.function_id
GROUP BY f.function_id;

-- Drop old parent-child views
DROP VIEW IF EXISTS parent_event_summary;
DROP VIEW IF EXISTS event_hierarchy_view;
```

---

## DB-011: Data Validation Queries

**Priority:** Critical  
**Time:** 1 hour

```sql
-- Validation suite
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Check all events have functions
    SELECT COUNT(*) INTO v_count
    FROM events WHERE function_id IS NULL;
    IF v_count > 0 THEN
        RAISE EXCEPTION 'Found % events without function_id', v_count;
    END IF;
    
    -- Check all registrations have functions
    SELECT COUNT(*) INTO v_count
    FROM registrations WHERE function_id IS NULL;
    IF v_count > 0 THEN
        RAISE EXCEPTION 'Found % registrations without function_id', v_count;
    END IF;
    
    -- Check no orphaned events
    SELECT COUNT(*) INTO v_count
    FROM events e
    WHERE NOT EXISTS (
        SELECT 1 FROM functions f 
        WHERE f.function_id = e.function_id
    );
    IF v_count > 0 THEN
        RAISE EXCEPTION 'Found % orphaned events', v_count;
    END IF;
    
    -- Verify no parent_event_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'parent_event_id'
    ) THEN
        RAISE EXCEPTION 'parent_event_id column still exists';
    END IF;
    
    RAISE NOTICE 'All validations passed!';
END $$;
```

---

## DB-012: Update Permissions and RLS

**Priority:** High  
**Time:** 30 minutes

```sql
-- Grant permissions on functions table
GRANT SELECT ON functions TO authenticated, anon;
GRANT ALL ON functions TO service_role;

-- RLS policies for functions
ALTER TABLE functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Functions are viewable by everyone"
    ON functions FOR SELECT
    TO authenticated, anon
    USING (is_published = true);

CREATE POLICY "Functions are editable by org admins"
    ON functions FOR ALL
    TO authenticated
    USING (
        organiser_id IN (
            SELECT organisation_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );
```

---

## Execution Order

1. **Backup Production Database**
2. Run DB-001 through DB-012 in sequence
3. **Validate all data**
4. **No rollback needed** - we're committed to the new architecture

## Success Criteria

- [ ] Zero events without function_id
- [ ] Zero registrations without function_id  
- [ ] Zero packages without function_id
- [ ] No parent_event_id column exists
- [ ] All RPC functions use functions architecture
- [ ] All views updated for functions
- [ ] All permissions properly set