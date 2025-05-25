-- Export Full Database Schema Analysis
-- This script exports comprehensive schema information to analyze duplicate tables issue

-- 1. List all tables with their schemas
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized view'
        WHEN 'f' THEN 'foreign table'
    END as table_type,
    pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
    obj_description(c.oid, 'pg_class') as comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND c.relkind IN ('r', 'v', 'm', 'f')
    AND c.relname IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY n.nspname, c.relname;

-- 2. Get detailed column information for these tables
SELECT 
    t.table_schema,
    t.table_name,
    c.column_name,
    c.ordinal_position,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        ELSE ''
    END as key_type
FROM information_schema.tables t
JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
LEFT JOIN (
    SELECT 
        kcu.table_schema,
        kcu.table_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_schema = pk.table_schema 
    AND c.table_name = pk.table_name 
    AND c.column_name = pk.column_name
WHERE t.table_name IN ('registrations', 'Registrations', 'tickets', 'Tickets')
    AND t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 3. List all foreign key constraints
SELECT
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name IN ('registrations', 'Registrations', 'tickets', 'Tickets')
         OR ccu.table_name IN ('registrations', 'Registrations', 'tickets', 'Tickets'))
ORDER BY tc.table_name, kcu.column_name;

-- 4. Check for indexes on these tables
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('registrations', 'Registrations', 'tickets', 'Tickets')
    AND schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Count rows in each table to understand data distribution
SELECT 
    'registrations' as table_name, 
    COUNT(*) as row_count,
    COUNT(DISTINCT registration_id) as unique_registrations,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.registrations
UNION ALL
SELECT 
    'Registrations' as table_name, 
    COUNT(*) as row_count,
    COUNT(DISTINCT registration_id) as unique_registrations,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public."Registrations"
UNION ALL
SELECT 
    'tickets' as table_name, 
    COUNT(*) as row_count,
    COUNT(DISTINCT id) as unique_tickets,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.tickets
UNION ALL
SELECT 
    'Tickets' as table_name, 
    COUNT(*) as row_count,
    COUNT(DISTINCT ticketid) as unique_tickets,
    MIN(createdat) as oldest_record,
    MAX(createdat) as newest_record
FROM public."Tickets";

-- 6. Check for any views that depend on these tables
SELECT 
    v.schemaname,
    v.viewname,
    v.definition
FROM pg_views v
WHERE v.definition ILIKE '%registrations%' 
   OR v.definition ILIKE '%tickets%'
ORDER BY v.schemaname, v.viewname;

-- 7. Check RLS policies on these tables
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY tablename, policyname;

-- 8. Check for any triggers on these tables
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname IN ('registrations', 'Registrations', 'tickets', 'Tickets')
    AND n.nspname = 'public'
    AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- 9. List all tables that have foreign keys pointing to these tables
SELECT DISTINCT
    tc.table_schema,
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column,
    ccu.table_name as referenced_table,
    ccu.column_name as referenced_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY referenced_table, referencing_table;

-- 10. Check column differences between duplicate tables
WITH reg_cols AS (
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'registrations' AND table_schema = 'public'
),
Reg_cols AS (
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'Registrations' AND table_schema = 'public'
)
SELECT 
    COALESCE(r1.column_name, r2.column_name) as column_name,
    r1.data_type as registrations_type,
    r2.data_type as Registrations_type,
    CASE 
        WHEN r1.column_name IS NULL THEN 'Missing in registrations'
        WHEN r2.column_name IS NULL THEN 'Missing in Registrations'
        WHEN r1.data_type != r2.data_type THEN 'Type mismatch'
        ELSE 'Match'
    END as status
FROM reg_cols r1
FULL OUTER JOIN Reg_cols r2 ON r1.column_name = r2.column_name
ORDER BY column_name;

-- 11. Check column differences between tickets tables
WITH tick_cols AS (
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'tickets' AND table_schema = 'public'
),
Tick_cols AS (
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'Tickets' AND table_schema = 'public'
)
SELECT 
    COALESCE(t1.column_name, t2.column_name) as column_name,
    t1.data_type as tickets_type,
    t2.data_type as Tickets_type,
    CASE 
        WHEN t1.column_name IS NULL THEN 'Missing in tickets'
        WHEN t2.column_name IS NULL THEN 'Missing in Tickets'
        WHEN t1.data_type != t2.data_type THEN 'Type mismatch'
        ELSE 'Match'
    END as status
FROM tick_cols t1
FULL OUTER JOIN Tick_cols t2 ON t1.column_name = t2.column_name
ORDER BY column_name;