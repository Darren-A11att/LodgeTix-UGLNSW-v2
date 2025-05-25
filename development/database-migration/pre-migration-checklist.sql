-- Pre-Migration Checklist
-- Run this before migration to ensure everything is ready

-- 1. Check current tables exist
SELECT 
    'Current tables' as check_type,
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) as column_count
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY tablename;

-- 2. Check row counts
SELECT 'registrations' as table_name, COUNT(*) as rows FROM registrations
UNION ALL
SELECT 'Registrations', COUNT(*) FROM "Registrations"
UNION ALL  
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'Tickets', COUNT(*) FROM "Tickets";

-- 3. Check foreign keys that will be affected
SELECT 
    'Foreign keys to be updated' as check_type,
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name as to_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (ccu.table_name IN ('Registrations', 'Tickets') 
         OR tc.table_name IN ('registrations', 'tickets'))
ORDER BY tc.table_name;

-- 4. Confirm tickets and registrations can be dropped safely
WITH ticket_analysis AS (
    SELECT 
        COUNT(*) as total_tickets,
        COUNT(DISTINCT registration_id) as linked_registrations
    FROM tickets
),
registration_analysis AS (
    SELECT 
        COUNT(*) as total_registrations,
        COUNT(DISTINCT registration_id) as unique_ids
    FROM registrations
)
SELECT 
    'Data in lowercase tables' as analysis,
    ta.total_tickets as tickets_count,
    ta.linked_registrations as tickets_linked_to_registrations,
    ra.total_registrations as registrations_count,
    CASE 
        WHEN ta.total_tickets > 0 OR ra.total_registrations > 0 
        THEN 'WARNING: Contains data - ensure this is only test data!'
        ELSE 'Safe to drop - no data'
    END as status
FROM ticket_analysis ta, registration_analysis ra;

-- 5. List all columns that will be renamed
SELECT 
    'Columns to be renamed in Tickets' as change_type,
    column_name as current_name,
    CASE 
        WHEN column_name = 'ticketid' THEN 'ticket_id'
        WHEN column_name = 'attendeeid' THEN 'attendee_id'
        WHEN column_name = 'eventid' THEN 'event_id'
        WHEN column_name = 'ticketdefinitionid' THEN 'ticket_definition_id'
        WHEN column_name = 'pricepaid' THEN 'price_paid'
        WHEN column_name = 'seatinfo' THEN 'seat_info'
        WHEN column_name = 'checkedinat' THEN 'checked_in_at'
        WHEN column_name = 'createdat' THEN 'created_at'
        WHEN column_name = 'updatedat' THEN 'updated_at'
        ELSE column_name
    END as new_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'Tickets' 
    AND table_schema = 'public'
    AND column_name != CASE 
        WHEN column_name = 'ticketid' THEN 'ticket_id'
        WHEN column_name = 'attendeeid' THEN 'attendee_id'
        WHEN column_name = 'eventid' THEN 'event_id'
        WHEN column_name = 'ticketdefinitionid' THEN 'ticket_definition_id'
        WHEN column_name = 'pricepaid' THEN 'price_paid'
        WHEN column_name = 'seatinfo' THEN 'seat_info'
        WHEN column_name = 'checkedinat' THEN 'checked_in_at'
        WHEN column_name = 'createdat' THEN 'created_at'
        WHEN column_name = 'updatedat' THEN 'updated_at'
        ELSE column_name
    END
ORDER BY ordinal_position;