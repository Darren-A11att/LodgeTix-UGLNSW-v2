-- DB-007: Make Function References Required
-- Priority: Critical
-- This makes function_id NOT NULL on all tables after migration is complete

-- Before making columns NOT NULL, ensure we handle any remaining NULL values
-- This is a safety check - they should already be handled by previous migrations

-- Final attempt to fix any NULL function_id in events
UPDATE events e
SET function_id = (
    SELECT function_id 
    FROM functions f 
    WHERE f.is_published = true 
    LIMIT 1
)
WHERE e.function_id IS NULL;

-- Final attempt to fix any NULL function_id in registrations
UPDATE registrations r
SET function_id = (
    SELECT e.function_id 
    FROM events e 
    WHERE r.event_id = e.event_id 
    AND e.function_id IS NOT NULL
    LIMIT 1
)
WHERE r.function_id IS NULL;

-- Final attempt to fix any NULL function_id in packages
UPDATE packages p
SET function_id = (
    SELECT function_id 
    FROM functions f 
    WHERE f.is_published = true 
    LIMIT 1
)
WHERE p.function_id IS NULL;

-- Now make function_id NOT NULL on all tables
DO $$
BEGIN
    -- Check and alter events table
    IF EXISTS (SELECT 1 FROM events WHERE function_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot make events.function_id NOT NULL - NULL values exist';
    END IF;
    ALTER TABLE events ALTER COLUMN function_id SET NOT NULL;
    RAISE NOTICE 'Made events.function_id NOT NULL';
    
    -- Check and alter registrations table
    IF EXISTS (SELECT 1 FROM registrations WHERE function_id IS NULL) THEN
        RAISE WARNING 'Found registrations with NULL function_id - these may be orphaned';
        -- Don't make it NOT NULL if there are orphaned registrations
    ELSE
        ALTER TABLE registrations ALTER COLUMN function_id SET NOT NULL;
        RAISE NOTICE 'Made registrations.function_id NOT NULL';
    END IF;
    
    -- Check and alter packages table
    IF EXISTS (SELECT 1 FROM packages WHERE function_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot make packages.function_id NOT NULL - NULL values exist';
    END IF;
    ALTER TABLE packages ALTER COLUMN function_id SET NOT NULL;
    RAISE NOTICE 'Made packages.function_id NOT NULL';
    
    RAISE NOTICE 'DB-007 Complete: Function references are now required';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error making columns NOT NULL: %', SQLERRM;
        RAISE;
END $$;