-- Simple schema query to get all columns for our key tables
-- Run each section separately if needed

-- 1. Get all columns for our main tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN (
    'registrations', 
    'attendees', 
    'people', 
    'customers',
    'tickets',
    'events',
    'eventtickets',
    'eventpackages',
    'masonic_profiles',
    'organisations'
  )
ORDER BY table_name, ordinal_position;

-- 2. Get foreign key relationships
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'registrations', 
    'attendees', 
    'people', 
    'customers',
    'tickets',
    'masonic_profiles'
  )
ORDER BY tc.table_name, kcu.column_name;

-- 3. Get all enum types
SELECT 
  t.typname AS enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;