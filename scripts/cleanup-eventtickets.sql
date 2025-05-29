-- Cleanup script to remove the old eventtickets table

-- 1. First, check if eventtickets has any data
SELECT COUNT(*) as record_count FROM eventtickets;

-- 2. Check if any tickets in eventtickets don't have a match in ticket_definitions
SELECT 
    et.*,
    td.id as matching_ticket_definition
FROM eventtickets et
LEFT JOIN ticket_definitions td 
    ON td.event_id = et.event_uuid::uuid 
    AND td.price = et.price
WHERE td.id IS NULL;

-- 3. If you're satisfied that all data is migrated or not needed:
-- DROP TABLE IF EXISTS public.eventtickets CASCADE;

-- 4. Also drop the event_ticket_id column from eventpackagetickets if it exists
-- ALTER TABLE eventpackagetickets DROP COLUMN IF EXISTS event_ticket_id CASCADE;