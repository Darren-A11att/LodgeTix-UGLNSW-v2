-- Test the ticket functions with your actual data

-- STEP 1: First, run this query to get a ticket ID
SELECT id, name, available_count 
FROM ticket_definitions 
WHERE name = 'Farewell Lunch'
LIMIT 1;

-- The result will look something like:
-- id: "123e4567-e89b-12d3-a456-426614174000"
-- name: "Farewell Lunch"  
-- available_count: 400

-- ====== STOP HERE AND COPY THE ID FROM ABOVE ======

-- STEP 2: Test all functions at once using the Farewell Lunch ticket
-- This query uses a subquery to get the ID automatically
WITH test_ticket AS (
    SELECT id 
    FROM ticket_definitions 
    WHERE name = 'Farewell Lunch'
    LIMIT 1
)
SELECT 
    'Check availability for 2 tickets' as test_name,
    check_ticket_availability((SELECT id FROM test_ticket), 2) as result;

-- STEP 3: Reserve 2 tickets
WITH test_ticket AS (
    SELECT id 
    FROM ticket_definitions 
    WHERE name = 'Farewell Lunch'
    LIMIT 1
)
SELECT 
    'Reserve 2 tickets' as test_name,
    reserve_tickets((SELECT id FROM test_ticket), 2) as result;

-- STEP 4: Check the counts after reservation
SELECT 
    name,
    total_capacity,
    available_count,
    reserved_count,
    sold_count,
    CASE 
        WHEN available_count = 398 AND reserved_count = 2 
        THEN '✓ Reservation worked correctly!'
        ELSE '✗ Something went wrong'
    END as status_check
FROM ticket_definitions
WHERE name = 'Farewell Lunch';

-- STEP 5: Confirm the purchase (move from reserved to sold)
WITH test_ticket AS (
    SELECT id 
    FROM ticket_definitions 
    WHERE name = 'Farewell Lunch'
    LIMIT 1
)
SELECT 
    'Confirm purchase of 2 tickets' as test_name,
    confirm_ticket_purchase((SELECT id FROM test_ticket), 2) as result;

-- STEP 6: Check final counts
SELECT 
    name,
    total_capacity,
    available_count,
    reserved_count,
    sold_count,
    CASE 
        WHEN available_count = 398 AND sold_count = 2 AND reserved_count = 0
        THEN '✓ Purchase confirmed correctly!'
        ELSE '✗ Something went wrong'
    END as status_check
FROM ticket_definitions
WHERE name = 'Farewell Lunch';

-- STEP 7: Reset the test data back to original
UPDATE ticket_definitions
SET 
    available_count = total_capacity,
    reserved_count = 0,
    sold_count = 0
WHERE name = 'Farewell Lunch';

-- Verify reset
SELECT 
    name,
    available_count,
    reserved_count,
    sold_count,
    '✓ Reset to original state' as status
FROM ticket_definitions
WHERE name = 'Farewell Lunch';