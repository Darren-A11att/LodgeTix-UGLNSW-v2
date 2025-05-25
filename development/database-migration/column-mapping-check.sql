-- Check column mappings between old tickets and Tickets tables
-- Run this before migration to ensure we map columns correctly

-- Show columns from the current tickets table (what the app expects)
SELECT 
    'Expected by app (tickets)' as table_version,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show columns from the Tickets table (what we're renaming)
SELECT 
    'Current Tickets table' as table_version,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Tickets' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Suggested mapping based on common patterns
SELECT 
    'Column Mapping' as mapping_type,
    'ticketid' as old_column,
    'id' as new_column
UNION ALL
SELECT 'Column Mapping', 'attendeeid', 'attendee_id'
UNION ALL
SELECT 'Column Mapping', 'eventid', 'event_id'
UNION ALL
SELECT 'Column Mapping', 'ticketdefinitionid', 'ticket_type_id'
UNION ALL
SELECT 'Column Mapping', 'pricepaid', 'ticket_price'
UNION ALL
SELECT 'Column Mapping', 'createdat', 'created_at'
UNION ALL
SELECT 'Column Mapping', 'updatedat', 'updated_at'
UNION ALL
SELECT 'Column Mapping', 'checkedinat', 'checked_in_at'
UNION ALL
SELECT 'Column Mapping', 'seatinfo', 'seat_info'
UNION ALL
SELECT 'Column Mapping', 'status', 'ticket_status';

-- Check if Tickets table is truly empty
SELECT 
    'Row count in Tickets' as check_type,
    COUNT(*) as count
FROM "Tickets";