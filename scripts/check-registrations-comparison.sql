-- Compare registrations vs Registrations columns
WITH lowercase_reg AS (
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'registrations' AND table_schema = 'public'
),
uppercase_reg AS (
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'Registrations' AND table_schema = 'public'
)
SELECT 
    COALESCE(l.column_name, u.column_name) as column_name,
    l.data_type as registrations_type,
    u.data_type as Registrations_type,
    CASE 
        WHEN l.column_name IS NULL THEN 'Only in Registrations'
        WHEN u.column_name IS NULL THEN 'Only in registrations'
        WHEN l.data_type != u.data_type THEN 'Type mismatch'
        ELSE 'Match'
    END as status
FROM lowercase_reg l
FULL OUTER JOIN uppercase_reg u ON l.column_name = u.column_name
ORDER BY 
    CASE 
        WHEN l.column_name IS NOT NULL AND u.column_name IS NOT NULL THEN 1
        WHEN l.column_name IS NOT NULL THEN 2
        ELSE 3
    END,
    column_name;

-- Check which tables have FKs pointing to registrations/Registrations
SELECT 
    'Referencing registrations' as reference_type,
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'registrations'
UNION ALL
SELECT 
    'Referencing Registrations' as reference_type,
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'Registrations'
ORDER BY reference_type, referencing_table;