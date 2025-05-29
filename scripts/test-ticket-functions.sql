-- Test script for the new ticket functions

-- 1. Test checking availability
-- Replace 'ticket-id-here' with an actual ticket ID from your database
SELECT check_ticket_availability('ticket-id-here'::uuid, 2);

-- 2. Test reserving tickets
-- This simulates adding tickets to a cart
SELECT reserve_tickets('ticket-id-here'::uuid, 2);

-- 3. Check the ticket status after reservation
SELECT 
    name,
    total_capacity,
    available_count,
    reserved_count,
    sold_count
FROM ticket_definitions
WHERE id = 'ticket-id-here';

-- 4. Test confirming a purchase
-- This simulates completing a payment
SELECT confirm_ticket_purchase('ticket-id-here'::uuid, 2);

-- 5. Check the ticket status after purchase
SELECT 
    name,
    total_capacity,
    available_count,
    reserved_count,
    sold_count
FROM ticket_definitions
WHERE id = 'ticket-id-here';

-- 6. Test releasing reserved tickets
-- This simulates a cart timeout or cancellation
SELECT reserve_tickets('ticket-id-here'::uuid, 1); -- First reserve
SELECT release_reserved_tickets('ticket-id-here'::uuid, 1); -- Then release

-- 7. View the ticket availability summary
SELECT * FROM ticket_availability 
WHERE event_id = 'your-event-id-here'
ORDER BY name;