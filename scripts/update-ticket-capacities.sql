-- Script to update ticket capacities for existing tickets

-- 1. First, let's see what tickets currently exist
SELECT 
    td.id,
    td.name,
    td.price,
    e.title as event_title,
    td.total_capacity,
    td.available_count,
    td.reserved_count,
    td.sold_count,
    td.status
FROM ticket_definitions td
LEFT JOIN events e ON e.id = td.event_id
ORDER BY e.title, td.name;

-- 2. Set all tickets to unlimited capacity by default
-- This is the safest starting point
UPDATE ticket_definitions 
SET 
    total_capacity = NULL,  -- NULL means unlimited
    available_count = NULL, -- NULL means unlimited
    reserved_count = 0,
    sold_count = 0,
    status = 'Active'
WHERE total_capacity IS NULL;

-- 3. Example: Set limited capacity for specific ticket types
-- Uncomment and modify these based on your needs

-- Example: Set capacity for ceremony tickets
-- UPDATE ticket_definitions 
-- SET 
--     total_capacity = 300,
--     available_count = 300,
--     reserved_count = 0,
--     sold_count = 0
-- WHERE name ILIKE '%ceremony%' OR name ILIKE '%installation%';

-- Example: Set capacity for banquet/dinner tickets
-- UPDATE ticket_definitions 
-- SET 
--     total_capacity = 200,
--     available_count = 200,
--     reserved_count = 0,
--     sold_count = 0
-- WHERE name ILIKE '%banquet%' OR name ILIKE '%dinner%';

-- Example: Set capacity for a specific event
-- UPDATE ticket_definitions 
-- SET 
--     total_capacity = 150,
--     available_count = 150
-- WHERE event_id = 'your-event-uuid-here';

-- 4. Verify the updates
SELECT 
    td.name,
    e.title as event_title,
    td.total_capacity,
    td.available_count,
    CASE 
        WHEN td.total_capacity IS NULL THEN 'Unlimited'
        ELSE td.total_capacity::text || ' seats'
    END as capacity_display,
    CASE 
        WHEN td.available_count IS NULL THEN 'Unlimited'
        WHEN td.available_count = 0 THEN 'Sold Out'
        ELSE td.available_count::text || ' available'
    END as availability_display,
    td.status
FROM ticket_definitions td
LEFT JOIN events e ON e.id = td.event_id
ORDER BY e.title, td.name;