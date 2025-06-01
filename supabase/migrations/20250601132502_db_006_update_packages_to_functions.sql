-- DB-006: Update Packages to Functions
-- Priority: Critical
-- This migrates packages from parent_event_id to function_id

-- First, update packages that have parent_event_id
UPDATE packages p
SET function_id = e.function_id
FROM events e
WHERE p.parent_event_id = e.event_id
  AND e.function_id IS NOT NULL;

-- Handle packages that might reference events through metadata
UPDATE packages p
SET function_id = f.function_id
FROM functions f
JOIN events e ON f.metadata->>'migrated_from_event_id' = e.event_id::text
WHERE p.parent_event_id = e.event_id
  AND p.function_id IS NULL;

-- For packages without parent_event_id, try to match through associated events
-- This handles edge cases where packages might be linked differently
UPDATE packages p
SET function_id = (
    SELECT DISTINCT e.function_id
    FROM events e
    JOIN event_tickets et ON e.event_id = et.event_id
    WHERE et.package_id = p.package_id
      AND e.function_id IS NOT NULL
    LIMIT 1
)
WHERE p.function_id IS NULL
  AND p.parent_event_id IS NULL;

-- Validation: Verify all packages have function_id
DO $$
DECLARE
    v_total_packages INTEGER;
    v_updated_packages INTEGER;
    v_orphan_packages INTEGER;
BEGIN
    -- Count total packages
    SELECT COUNT(*) INTO v_total_packages
    FROM packages;
    
    -- Count packages with function_id
    SELECT COUNT(*) INTO v_updated_packages
    FROM packages
    WHERE function_id IS NOT NULL;
    
    -- Count packages without function_id
    SELECT COUNT(*) INTO v_orphan_packages
    FROM packages
    WHERE function_id IS NULL;
    
    RAISE NOTICE 'Package update summary:';
    RAISE NOTICE '  Total packages: %', v_total_packages;
    RAISE NOTICE '  Updated with function_id: %', v_updated_packages;
    RAISE NOTICE '  Without function_id: %', v_orphan_packages;
    
    IF v_orphan_packages > 0 THEN
        -- Log details of orphaned packages
        FOR r IN 
            SELECT p.package_id, p.name, p.parent_event_id
            FROM packages p
            WHERE p.function_id IS NULL
            LIMIT 5
        LOOP
            RAISE NOTICE 'Orphaned package: ID=%, Name=%, Parent Event=%', 
                         r.package_id, r.name, r.parent_event_id;
        END LOOP;
        
        -- For this migration, we'll raise an exception if packages are orphaned
        -- as they are critical for the ticketing system
        RAISE EXCEPTION 'Found % packages without function_id', v_orphan_packages;
    END IF;
    
    RAISE NOTICE 'DB-006 Complete: All packages updated with function references';
END $$;