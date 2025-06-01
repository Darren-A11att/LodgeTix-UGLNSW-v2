-- DB-008: Drop Legacy Columns and Constraints
-- Priority: Critical
-- This removes all parent-child event architecture columns and constraints

-- First, ensure we have backed up the relationships in metadata
DO $$
BEGIN
    -- Store parent-child relationships in event metadata before dropping
    UPDATE events e
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{legacy_parent_event_id}',
        to_jsonb(parent_event_id)
    )
    WHERE parent_event_id IS NOT NULL;
    
    -- Store event_id in registration metadata before dropping
    UPDATE registrations r
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{legacy_event_id}',
        to_jsonb(event_id)
    )
    WHERE event_id IS NOT NULL;
    
    -- Store parent_event_id in package metadata before dropping
    UPDATE packages p
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{legacy_parent_event_id}',
        to_jsonb(parent_event_id)
    )
    WHERE parent_event_id IS NOT NULL;
    
    RAISE NOTICE 'Legacy relationships backed up to metadata';
END $$;

-- Drop foreign key constraints first
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_parent_event_id_fkey CASCADE;

ALTER TABLE registrations 
DROP CONSTRAINT IF EXISTS registrations_event_id_fkey CASCADE;

ALTER TABLE packages 
DROP CONSTRAINT IF EXISTS packages_parent_event_id_fkey CASCADE;

-- Drop the columns
ALTER TABLE events 
DROP COLUMN IF EXISTS parent_event_id CASCADE;

ALTER TABLE registrations 
DROP COLUMN IF EXISTS event_id CASCADE;

ALTER TABLE packages 
DROP COLUMN IF EXISTS parent_event_id CASCADE;

-- Clean up any orphaned indexes
DROP INDEX IF EXISTS idx_events_parent;
DROP INDEX IF EXISTS idx_registrations_event;
DROP INDEX IF EXISTS idx_packages_parent_event;

-- Validation: Verify columns are dropped
DO $$
DECLARE
    v_column_exists BOOLEAN;
BEGIN
    -- Check events.parent_event_id
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'parent_event_id'
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
        RAISE EXCEPTION 'events.parent_event_id column still exists';
    END IF;
    
    -- Check registrations.event_id
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'registrations' 
        AND column_name = 'event_id'
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
        RAISE EXCEPTION 'registrations.event_id column still exists';
    END IF;
    
    -- Check packages.parent_event_id
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'packages' 
        AND column_name = 'parent_event_id'
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
        RAISE EXCEPTION 'packages.parent_event_id column still exists';
    END IF;
    
    RAISE NOTICE 'DB-008 Complete: All legacy columns and constraints dropped';
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'The database has been successfully migrated to the functions architecture.';
    RAISE NOTICE 'All parent-child event relationships have been replaced with function-based organization.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update application code to use function_id instead of parent_event_id';
    RAISE NOTICE '2. Update RPC functions to work with the new architecture (DB-009)';
    RAISE NOTICE '3. Create new views for functions (DB-010)';
    RAISE NOTICE '4. Run validation queries (DB-011)';
    RAISE NOTICE '5. Update permissions and RLS policies (DB-012)';
END $$;