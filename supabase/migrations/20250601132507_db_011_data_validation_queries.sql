-- DB-011: Data Validation Queries
-- Priority: Critical
-- Time: 1 hour

-- Comprehensive validation suite for functions migration
DO $$
DECLARE
    v_count INTEGER;
    v_orphan_count INTEGER;
    v_integrity_errors TEXT := '';
BEGIN
    -- 1. Check all events have functions
    SELECT COUNT(*) INTO v_count
    FROM events WHERE function_id IS NULL;
    IF v_count > 0 THEN
        v_integrity_errors := v_integrity_errors || format('Found %s events without function_id. ', v_count);
    END IF;
    
    -- 2. Check all registrations have functions
    SELECT COUNT(*) INTO v_count
    FROM registrations WHERE function_id IS NULL;
    IF v_count > 0 THEN
        v_integrity_errors := v_integrity_errors || format('Found %s registrations without function_id. ', v_count);
    END IF;
    
    -- 3. Check all packages have functions
    SELECT COUNT(*) INTO v_count
    FROM packages WHERE function_id IS NULL;
    IF v_count > 0 THEN
        v_integrity_errors := v_integrity_errors || format('Found %s packages without function_id. ', v_count);
    END IF;
    
    -- 4. Check no orphaned events (events pointing to non-existent functions)
    SELECT COUNT(*) INTO v_orphan_count
    FROM events e
    WHERE NOT EXISTS (
        SELECT 1 FROM functions f 
        WHERE f.function_id = e.function_id
    );
    IF v_orphan_count > 0 THEN
        v_integrity_errors := v_integrity_errors || format('Found %s orphaned events. ', v_orphan_count);
    END IF;
    
    -- 5. Check no orphaned registrations
    SELECT COUNT(*) INTO v_orphan_count
    FROM registrations r
    WHERE NOT EXISTS (
        SELECT 1 FROM functions f 
        WHERE f.function_id = r.function_id
    );
    IF v_orphan_count > 0 THEN
        v_integrity_errors := v_integrity_errors || format('Found %s orphaned registrations. ', v_orphan_count);
    END IF;
    
    -- 6. Check no orphaned packages
    SELECT COUNT(*) INTO v_orphan_count
    FROM packages p
    WHERE NOT EXISTS (
        SELECT 1 FROM functions f 
        WHERE f.function_id = p.function_id
    );
    IF v_orphan_count > 0 THEN
        v_integrity_errors := v_integrity_errors || format('Found %s orphaned packages. ', v_orphan_count);
    END IF;
    
    -- 7. Verify no parent_event_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'parent_event_id'
    ) THEN
        v_integrity_errors := v_integrity_errors || 'parent_event_id column still exists in events table. ';
    END IF;
    
    -- 8. Verify no event_id column in registrations
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'registrations' 
        AND column_name = 'event_id'
    ) THEN
        v_integrity_errors := v_integrity_errors || 'event_id column still exists in registrations table. ';
    END IF;
    
    -- 9. Verify no parent_event_id in packages
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'packages' 
        AND column_name = 'parent_event_id'
    ) THEN
        v_integrity_errors := v_integrity_errors || 'parent_event_id column still exists in packages table. ';
    END IF;
    
    -- 10. Check function data integrity
    SELECT COUNT(*) INTO v_count
    FROM functions
    WHERE name IS NULL OR slug IS NULL OR organiser_id IS NULL;
    IF v_count > 0 THEN
        v_integrity_errors := v_integrity_errors || format('Found %s functions with missing required data. ', v_count);
    END IF;
    
    -- 11. Check for duplicate function slugs
    SELECT COUNT(*) INTO v_count
    FROM (
        SELECT slug, COUNT(*) as cnt
        FROM functions
        GROUP BY slug
        HAVING COUNT(*) > 1
    ) duplicates;
    IF v_count > 0 THEN
        v_integrity_errors := v_integrity_errors || format('Found %s duplicate function slugs. ', v_count);
    END IF;
    
    -- 12. Verify all function foreign keys are valid
    SELECT COUNT(*) INTO v_count
    FROM functions f
    WHERE f.organiser_id IS NOT NULL 
    AND NOT EXISTS (
        SELECT 1 FROM organisations o 
        WHERE o.organisation_id = f.organiser_id
    );
    IF v_count > 0 THEN
        v_integrity_errors := v_integrity_errors || format('Found %s functions with invalid organiser_id. ', v_count);
    END IF;
    
    SELECT COUNT(*) INTO v_count
    FROM functions f
    WHERE f.location_id IS NOT NULL 
    AND NOT EXISTS (
        SELECT 1 FROM locations l 
        WHERE l.location_id = f.location_id
    );
    IF v_count > 0 THEN
        v_integrity_errors := v_integrity_errors || format('Found %s functions with invalid location_id. ', v_count);
    END IF;
    
    -- Report results
    IF v_integrity_errors != '' THEN
        RAISE EXCEPTION 'Data integrity errors found: %', v_integrity_errors;
    ELSE
        RAISE NOTICE 'All data validation checks passed successfully!';
        
        -- Log summary statistics
        SELECT COUNT(*) INTO v_count FROM functions;
        RAISE NOTICE 'Total functions: %', v_count;
        
        SELECT COUNT(*) INTO v_count FROM events;
        RAISE NOTICE 'Total events: %', v_count;
        
        SELECT COUNT(*) INTO v_count FROM registrations;
        RAISE NOTICE 'Total registrations: %', v_count;
        
        SELECT COUNT(*) INTO v_count FROM packages;
        RAISE NOTICE 'Total packages: %', v_count;
    END IF;
END $$;

-- Create validation functions for ongoing use

-- Function to check data integrity
CREATE OR REPLACE FUNCTION validate_functions_migration()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check 1: Events without functions
    RETURN QUERY
    SELECT 
        'Events without function_id'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        format('Count: %s', COUNT(*))::TEXT
    FROM events WHERE function_id IS NULL;
    
    -- Check 2: Registrations without functions
    RETURN QUERY
    SELECT 
        'Registrations without function_id'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        format('Count: %s', COUNT(*))::TEXT
    FROM registrations WHERE function_id IS NULL;
    
    -- Check 3: Packages without functions
    RETURN QUERY
    SELECT 
        'Packages without function_id'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        format('Count: %s', COUNT(*))::TEXT
    FROM packages WHERE function_id IS NULL;
    
    -- Check 4: Orphaned events
    RETURN QUERY
    SELECT 
        'Orphaned events'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        format('Count: %s', COUNT(*))::TEXT
    FROM events e
    WHERE NOT EXISTS (
        SELECT 1 FROM functions f WHERE f.function_id = e.function_id
    );
    
    -- Check 5: Duplicate function slugs
    RETURN QUERY
    SELECT 
        'Duplicate function slugs'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        format('Count: %s', COUNT(*))::TEXT
    FROM (
        SELECT slug, COUNT(*) as cnt
        FROM functions
        GROUP BY slug
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- Check 6: Functions with missing required fields
    RETURN QUERY
    SELECT 
        'Functions with missing required fields'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        format('Count: %s', COUNT(*))::TEXT
    FROM functions
    WHERE name IS NULL OR slug IS NULL OR organiser_id IS NULL;
    
    -- Check 7: Legacy columns removed
    RETURN QUERY
    SELECT 
        'Legacy parent_event_id column removed'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        'Column exists in: ' || string_agg(table_name, ', ')
    FROM information_schema.columns
    WHERE column_name = 'parent_event_id'
    AND table_schema = 'public';
    
    -- Check 8: Foreign key integrity
    RETURN QUERY
    SELECT 
        'Invalid foreign keys'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        format('Invalid organiser_id: %s, Invalid location_id: %s',
            (SELECT COUNT(*) FROM functions f WHERE f.organiser_id IS NOT NULL 
             AND NOT EXISTS (SELECT 1 FROM organisations o WHERE o.organisation_id = f.organiser_id)),
            (SELECT COUNT(*) FROM functions f WHERE f.location_id IS NOT NULL 
             AND NOT EXISTS (SELECT 1 FROM locations l WHERE l.location_id = f.location_id))
        )::TEXT
    FROM (SELECT 1) x;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_functions_migration TO authenticated;

-- Add comment
COMMENT ON FUNCTION validate_functions_migration IS 'Validates the functions migration data integrity';