-- DB-005: Update Registrations to Functions
-- Priority: Critical
-- This updates all registrations to reference functions instead of events

-- Update registrations with function_id from their events
UPDATE registrations r
SET function_id = e.function_id
FROM events e
WHERE r.event_id = e.event_id
  AND e.function_id IS NOT NULL;

-- For registrations to parent events, use the function directly
UPDATE registrations r
SET function_id = f.function_id
FROM functions f
WHERE r.event_id IN (
    SELECT event_id 
    FROM events 
    WHERE slug = f.slug 
    AND parent_event_id IS NULL
)
AND r.function_id IS NULL;

-- Handle any remaining registrations by matching through metadata
UPDATE registrations r
SET function_id = f.function_id
FROM functions f
JOIN events e ON f.metadata->>'migrated_from_event_id' = e.event_id::text
WHERE r.event_id = e.event_id
  AND r.function_id IS NULL;

-- Validation: Check registration updates
DO $$
DECLARE
    v_total_registrations INTEGER;
    v_updated_registrations INTEGER;
    v_orphan_registrations INTEGER;
BEGIN
    -- Count total registrations
    SELECT COUNT(*) INTO v_total_registrations
    FROM registrations;
    
    -- Count registrations with function_id
    SELECT COUNT(*) INTO v_updated_registrations
    FROM registrations
    WHERE function_id IS NOT NULL;
    
    -- Count registrations without function_id
    SELECT COUNT(*) INTO v_orphan_registrations
    FROM registrations
    WHERE function_id IS NULL;
    
    RAISE NOTICE 'Registration update summary:';
    RAISE NOTICE '  Total registrations: %', v_total_registrations;
    RAISE NOTICE '  Updated with function_id: %', v_updated_registrations;
    RAISE NOTICE '  Without function_id: %', v_orphan_registrations;
    
    -- If we have orphaned registrations, log details but don't fail
    -- (there might be test registrations or registrations to deleted events)
    IF v_orphan_registrations > 0 THEN
        RAISE WARNING 'Found % registrations without function_id - these may be orphaned', v_orphan_registrations;
        
        -- Log first few for investigation
        FOR r IN 
            SELECT r.registration_id, r.event_id, e.title, e.parent_event_id
            FROM registrations r
            LEFT JOIN events e ON r.event_id = e.event_id
            WHERE r.function_id IS NULL
            LIMIT 5
        LOOP
            RAISE NOTICE 'Orphaned registration: ID=%, Event ID=%, Event Title=%', 
                         r.registration_id, r.event_id, r.title;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'DB-005 Complete: Registrations updated to use functions';
END $$;