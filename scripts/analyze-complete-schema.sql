-- Comprehensive schema analysis query
-- This will give us all tables, columns, data types, constraints, and relationships

-- 1. Get all tables and their columns with data types
WITH table_columns AS (
  SELECT 
    t.table_schema,
    t.table_name,
    c.column_name,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default,
    c.ordinal_position,
    CASE 
      WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name
      WHEN c.character_maximum_length IS NOT NULL THEN 
        c.data_type || '(' || c.character_maximum_length || ')'
      WHEN c.numeric_precision IS NOT NULL THEN 
        c.data_type || '(' || c.numeric_precision || ',' || c.numeric_scale || ')'
      ELSE c.data_type
    END AS full_data_type
  FROM information_schema.tables t
  JOIN information_schema.columns c ON c.table_schema = t.table_schema 
    AND c.table_name = t.table_name
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
),

-- 2. Get primary keys
primary_keys AS (
  SELECT 
    kcu.table_schema,
    kcu.table_name,
    kcu.column_name,
    kcu.ordinal_position
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
),

-- 3. Get foreign keys with their relationships
foreign_keys AS (
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
    AND tc.table_schema = 'public'
),

-- 4. Get unique constraints
unique_constraints AS (
  SELECT 
    kcu.table_schema,
    kcu.table_name,
    kcu.column_name,
    tc.constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
)

-- Main query combining all information
SELECT 
  tc.table_name,
  tc.column_name,
  tc.full_data_type,
  tc.is_nullable,
  tc.column_default,
  CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END AS is_primary_key,
  CASE WHEN fk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END AS is_foreign_key,
  fk.foreign_table_name,
  fk.foreign_column_name,
  CASE WHEN uc.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END AS is_unique,
  tc.ordinal_position
FROM table_columns tc
LEFT JOIN primary_keys pk 
  ON tc.table_schema = pk.table_schema 
  AND tc.table_name = pk.table_name 
  AND tc.column_name = pk.column_name
LEFT JOIN foreign_keys fk 
  ON tc.table_schema = fk.table_schema 
  AND tc.table_name = fk.table_name 
  AND tc.column_name = fk.column_name
LEFT JOIN unique_constraints uc 
  ON tc.table_schema = uc.table_schema 
  AND tc.table_name = uc.table_name 
  AND tc.column_name = uc.column_name
WHERE tc.table_name IN (
  'registrations', 
  'attendees', 
  'people', 
  'customers',
  'tickets',
  'events',
  'eventtickets',
  'eventpackages',
  'masonic_profiles',
  'organisations',
  'registrationavailability'
)
ORDER BY 
  tc.table_name,
  tc.ordinal_position;

-- Also get enum types separately
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value,
  e.enumsortorder AS sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;