-- DB-004: Update All Event References
-- Priority: Critical
-- This updates all events to have function_id references

-- Update parent events with their function_id
UPDATE events e
SET function_id = f.function_id
FROM functions f
WHERE e.slug = f.slug
  AND e.parent_event_id IS NULL;

-- For standalone events that got '-function' suffix, match by original event_id
UPDATE events e
SET function_id = f.function_id
FROM functions f
WHERE f.metadata->>'migrated_from_event_id' = e.event_id::text
  AND e.function_id IS NULL;

-- Update child events with parent's function_id
UPDATE events child
SET function_id = parent.function_id
FROM events parent
WHERE child.parent_event_id = parent.event_id
  AND parent.function_id IS NOT NULL;

-- Handle any remaining child events by looking up their parent's function
UPDATE events child
SET function_id = (
    SELECT f.function_id
    FROM functions f
    JOIN events parent ON f.metadata->>'migrated_from_event_id' = parent.event_id::text
    WHERE child.parent_event_id = parent.event_id
    LIMIT 1
)
WHERE child.parent_event_id IS NOT NULL
  AND child.function_id IS NULL;

-- Validation: Verify no events without function_id
DO $$
DECLARE
    v_orphan_count INTEGER;
    v_total_events INTEGER;
    v_updated_events INTEGER;
BEGIN
    -- Count events without function_id
    SELECT COUNT(*) INTO v_orphan_count
    FROM events 
    WHERE function_id IS NULL;
    
    -- Count total events
    SELECT COUNT(*) INTO v_total_events
    FROM events;
    
    -- Count events with function_id
    SELECT COUNT(*) INTO v_updated_events
    FROM events 
    WHERE function_id IS NOT NULL;
    
    RAISE NOTICE 'Total events: %, Updated with function_id: %, Without function_id: %', 
                 v_total_events, v_updated_events, v_orphan_count;
    
    IF v_orphan_count > 0 THEN
        -- Log details of orphaned events for debugging
        RAISE NOTICE 'Orphaned events details:';
        FOR r IN 
            SELECT event_id, title, parent_event_id, slug
            FROM events 
            WHERE function_id IS NULL
            LIMIT 10
        LOOP
            RAISE NOTICE 'Event ID: %, Title: %, Parent: %, Slug: %', 
                         r.event_id, r.title, r.parent_event_id, r.slug;
        END LOOP;
        
        RAISE EXCEPTION 'Found % events without function_id', v_orphan_count;
    END IF;
    
    RAISE NOTICE 'DB-004 Complete: All events updated with function references';
END $$;