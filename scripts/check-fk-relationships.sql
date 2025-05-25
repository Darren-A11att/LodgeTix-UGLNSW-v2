-- Check which tables reference the tickets/Tickets tables
SELECT 
    'Tables referencing tickets (lowercase)' as query_type,
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column,
    ccu.table_name as referenced_table,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'tickets'
UNION ALL
SELECT 
    'Tables referencing Tickets (PascalCase)' as query_type,
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column,
    ccu.table_name as referenced_table,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'Tickets'
ORDER BY query_type, referencing_table;

-- Check foreign keys FROM tickets tables
SELECT 
    'Foreign keys from tickets' as query_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name as references_table,
    ccu.column_name as references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'tickets'
UNION ALL
SELECT 
    'Foreign keys from Tickets' as query_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name as references_table,
    ccu.column_name as references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'Tickets'
ORDER BY query_type, table_name;