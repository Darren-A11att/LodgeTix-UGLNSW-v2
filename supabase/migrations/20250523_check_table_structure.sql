-- Check which registration tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename ILIKE '%registration%' 
AND schemaname = 'public'
ORDER BY tablename;

-- Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND (tc.table_name IN ('attendees', 'tickets', 'registrations', 'Registrations') 
     OR ccu.table_name IN ('registrations', 'Registrations'))
ORDER BY tc.table_name, tc.constraint_name;