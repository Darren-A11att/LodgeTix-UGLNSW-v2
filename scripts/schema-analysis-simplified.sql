-- Simplified Schema Analysis for Supabase SQL Editor
-- Run each section separately for better readability

-- ========================================
-- SECTION 1: Basic Table Information
-- ========================================
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY tablename;

-- ========================================
-- SECTION 2: Row Counts
-- ========================================
SELECT 'registrations' as table_name, COUNT(*) as row_count FROM public.registrations
UNION ALL
SELECT 'Registrations', COUNT(*) FROM public."Registrations"
UNION ALL
SELECT 'tickets', COUNT(*) FROM public.tickets
UNION ALL
SELECT 'Tickets', COUNT(*) FROM public."Tickets";

-- ========================================
-- SECTION 3: Column Comparison - Registrations
-- ========================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'registrations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- vs

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Registrations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- SECTION 4: Column Comparison - Tickets
-- ========================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tickets' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- vs

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Tickets' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- SECTION 5: Foreign Keys TO these tables
-- ========================================
SELECT
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column,
    ccu.table_name as referenced_table,
    ccu.column_name as referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY ccu.table_name, tc.table_name;

-- ========================================
-- SECTION 6: Foreign Keys FROM these tables
-- ========================================
SELECT
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
    AND tc.table_name IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY tc.table_name;

-- ========================================
-- SECTION 7: Recent Data Check
-- ========================================
SELECT 
    'registrations' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
    MAX(created_at) as most_recent
FROM public.registrations
UNION ALL
SELECT 
    'Registrations',
    COUNT(*),
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END),
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END),
    MAX(created_at)
FROM public."Registrations"
UNION ALL
SELECT 
    'tickets',
    COUNT(*),
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END),
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END),
    MAX(created_at)
FROM public.tickets
UNION ALL
SELECT 
    'Tickets',
    COUNT(*),
    COUNT(CASE WHEN createdat > NOW() - INTERVAL '30 days' THEN 1 END),
    COUNT(CASE WHEN createdat > NOW() - INTERVAL '7 days' THEN 1 END),
    MAX(createdat)
FROM public."Tickets";