-- Extract complete DDL for analysis
-- Run this in Supabase SQL Editor to get the CREATE TABLE statements

-- Get registrations table DDL
SELECT 
    'registrations' as table_name,
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || string_agg(
        column_name || ' ' || 
        data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE 
            WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END, ', '
        ORDER BY ordinal_position
    ) || ');' as ddl
FROM information_schema.columns
WHERE table_name = 'registrations' 
    AND table_schema = 'public'
GROUP BY schemaname, tablename;

-- Get Registrations table DDL
SELECT 
    'Registrations' as table_name,
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || string_agg(
        column_name || ' ' || 
        data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE 
            WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END, ', '
        ORDER BY ordinal_position
    ) || ');' as ddl
FROM information_schema.columns
WHERE table_name = 'Registrations' 
    AND table_schema = 'public'
GROUP BY schemaname, tablename;

-- Simpler column list comparison
SELECT 
    r1.column_name,
    r1.data_type as reg_lowercase_type,
    r2.data_type as reg_uppercase_type,
    r1.column_default as reg_lowercase_default,
    r2.column_default as reg_uppercase_default
FROM 
    (SELECT * FROM information_schema.columns WHERE table_name = 'registrations' AND table_schema = 'public') r1
FULL OUTER JOIN 
    (SELECT * FROM information_schema.columns WHERE table_name = 'Registrations' AND table_schema = 'public') r2
    ON r1.column_name = r2.column_name
ORDER BY COALESCE(r1.ordinal_position, r2.ordinal_position);