-- Quick setup for ticket capacities

-- Option 1: Make all tickets unlimited (recommended to start)
UPDATE ticket_definitions 
SET 
    total_capacity = NULL,
    available_count = NULL,
    status = 'Active'
WHERE 1=1;

-- Option 2: Set specific capacities based on ticket price
-- (Assuming higher priced tickets have fewer seats)
UPDATE ticket_definitions 
SET 
    total_capacity = CASE 
        WHEN price > 200 THEN 100  -- Premium tickets
        WHEN price > 100 THEN 200  -- Standard tickets
        ELSE 300                   -- Basic tickets
    END,
    available_count = CASE 
        WHEN price > 200 THEN 100
        WHEN price > 100 THEN 200
        ELSE 300
    END,
    status = 'Active'
WHERE 1=1;

-- Option 3: Set capacity for specific events only
-- First, find your event IDs
SELECT DISTINCT 
    e.id as event_id,
    e.title as event_name
FROM events e
INNER JOIN ticket_definitions td ON td.event_id = e.id
ORDER BY e.title;

-- Then update tickets for a specific event
-- UPDATE ticket_definitions 
-- SET 
--     total_capacity = 250,
--     available_count = 250
-- WHERE event_id = 'paste-event-id-here';