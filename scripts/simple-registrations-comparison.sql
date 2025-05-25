-- Simple comparison of registrations vs Registrations columns
-- Run this in Supabase SQL editor

-- First, show all columns from registrations (lowercase)
SELECT 
    'registrations (lowercase)' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'registrations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Then show all columns from Registrations (PascalCase)
SELECT 
    'Registrations (PascalCase)' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Registrations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Quick check if they have the same number of columns
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name IN ('registrations', 'Registrations')
    AND table_schema = 'public'
GROUP BY table_name;

-- Check for any data in each table
SELECT 
    'registrations' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM registrations
UNION ALL
SELECT 
    'Registrations' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM "Registrations";