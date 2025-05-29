-- Analyze the ticket system structure to understand relationships

-- 1. Check if eventtickets has any data
SELECT 
    'eventtickets' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT event_id) as unique_events,
    COUNT(DISTINCT ticket_definition_id) as linked_definitions
FROM eventtickets;

-- 2. Check if ticket_definitions are linked to eventtickets
SELECT 
    'ticket_definitions' as table_name,
    COUNT(*) as total_definitions,
    COUNT(DISTINCT event_id) as unique_events,
    SUM(CASE WHEN td.id IN (SELECT ticket_definition_id FROM eventtickets WHERE ticket_definition_id IS NOT NULL) THEN 1 ELSE 0 END) as linked_to_eventtickets
FROM ticket_definitions td;

-- 3. See the relationship between the tables
SELECT 
    td.id as ticket_definition_id,
    td.name as definition_name,
    td.price as definition_price,
    td.event_id as definition_event_id,
    et.event_ticket_id,
    et.event_id as eventticket_event_id,
    et.price as eventticket_price,
    et.total_capacity as et_total_capacity,
    et.available_count as et_available_count,
    td.total_capacity as td_total_capacity,
    td.available_count as td_available_count
FROM ticket_definitions td
LEFT JOIN eventtickets et ON et.ticket_definition_id = td.id
LIMIT 10;

-- 4. Check the tickets table (actual purchases)
SELECT 
    'tickets' as table_name,
    COUNT(*) as total_tickets,
    COUNT(DISTINCT event_id) as events,
    COUNT(DISTINCT attendee_id) as attendees,
    COUNT(DISTINCT ticket_definition_id) as definitions_used,
    COUNT(DISTINCT event_ticket_id) as eventtickets_used
FROM tickets;

-- 5. See which system is being used for actual tickets
SELECT 
    CASE 
        WHEN ticket_definition_id IS NOT NULL THEN 'Uses ticket_definitions'
        WHEN event_ticket_id IS NOT NULL THEN 'Uses eventtickets'
        ELSE 'Uses neither'
    END as ticket_system,
    COUNT(*) as count
FROM tickets
GROUP BY 1;

-- 6. Check recent ticket purchases to see the pattern
SELECT 
    t.ticket_id,
    t.created_at,
    t.event_id,
    t.ticket_definition_id,
    t.event_ticket_id,
    td.name as definition_name,
    et.event_id as eventticket_event
FROM tickets t
LEFT JOIN ticket_definitions td ON td.id = t.ticket_definition_id
LEFT JOIN eventtickets et ON et.event_ticket_id = t.event_ticket_id
ORDER BY t.created_at DESC
LIMIT 5;