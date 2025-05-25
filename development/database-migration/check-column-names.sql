-- Check actual column names in both PascalCase and lowercase tables
-- This will help us understand the current state before migration

-- Check if tables exist
SELECT 
    'Tables Check' as check_type,
    schemaname,
    tablename,
    CASE 
        WHEN tablename = LOWER(tablename) THEN 'lowercase'
        ELSE 'PascalCase'
    END as naming_style
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY tablename;

-- Check Registrations table columns (if exists)
SELECT 
    'Registrations Columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'Registrations'
ORDER BY ordinal_position;

-- Check Tickets table columns (if exists)
SELECT 
    'Tickets Columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'Tickets'
ORDER BY ordinal_position;

-- Check registrations table columns (if exists)
SELECT 
    'registrations Columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'registrations'
ORDER BY ordinal_position;

-- Check tickets table columns (if exists)
SELECT 
    'tickets Columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'tickets'
ORDER BY ordinal_position;