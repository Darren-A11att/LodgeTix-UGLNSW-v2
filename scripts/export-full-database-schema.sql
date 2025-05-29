-- Generate full database schema including all tables, columns, types, constraints, indexes, and functions
-- This query provides a comprehensive view of the entire database structure

-- Tables and Columns with all details
SELECT 
    'TABLE' as object_type,
    t.table_schema,
    t.table_name,
    'COLUMNS' as detail_type,
    jsonb_agg(
        jsonb_build_object(
            'column_name', c.column_name,
            'ordinal_position', c.ordinal_position,
            'data_type', c.data_type,
            'udt_name', c.udt_name,
            'character_maximum_length', c.character_maximum_length,
            'numeric_precision', c.numeric_precision,
            'numeric_scale', c.numeric_scale,
            'is_nullable', c.is_nullable,
            'column_default', c.column_default,
            'is_identity', c.is_identity,
            'identity_generation', c.identity_generation
        ) ORDER BY c.ordinal_position
    ) as details
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_schema = c.table_schema AND t.table_name = c.table_name
WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_schema, t.table_name

UNION ALL

-- Primary Keys
SELECT 
    'CONSTRAINT' as object_type,
    tc.table_schema,
    tc.table_name,
    'PRIMARY_KEY' as detail_type,
    jsonb_build_object(
        'constraint_name', tc.constraint_name,
        'columns', array_agg(kcu.column_name ORDER BY kcu.ordinal_position)
    ) as details
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
GROUP BY tc.table_schema, tc.table_name, tc.constraint_name

UNION ALL

-- Foreign Keys
SELECT 
    'CONSTRAINT' as object_type,
    tc.table_schema,
    tc.table_name,
    'FOREIGN_KEY' as detail_type,
    jsonb_build_object(
        'constraint_name', tc.constraint_name,
        'columns', array_agg(kcu.column_name ORDER BY kcu.ordinal_position),
        'foreign_table_schema', ccu.table_schema,
        'foreign_table_name', ccu.table_name,
        'foreign_columns', array_agg(ccu.column_name ORDER BY kcu.ordinal_position),
        'update_rule', rc.update_rule,
        'delete_rule', rc.delete_rule
    ) as details
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name 
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
GROUP BY tc.table_schema, tc.table_name, tc.constraint_name, 
         ccu.table_schema, ccu.table_name, rc.update_rule, rc.delete_rule

UNION ALL

-- Check Constraints
SELECT 
    'CONSTRAINT' as object_type,
    tc.table_schema,
    tc.table_name,
    'CHECK' as detail_type,
    jsonb_build_object(
        'constraint_name', tc.constraint_name,
        'check_clause', cc.check_clause
    ) as details
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name 
    AND tc.table_schema = cc.constraint_schema
WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')

UNION ALL

-- Unique Constraints
SELECT 
    'CONSTRAINT' as object_type,
    tc.table_schema,
    tc.table_name,
    'UNIQUE' as detail_type,
    jsonb_build_object(
        'constraint_name', tc.constraint_name,
        'columns', array_agg(kcu.column_name ORDER BY kcu.ordinal_position)
    ) as details
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
GROUP BY tc.table_schema, tc.table_name, tc.constraint_name

UNION ALL

-- Indexes
SELECT 
    'INDEX' as object_type,
    schemaname as table_schema,
    tablename as table_name,
    'INDEX' as detail_type,
    jsonb_build_object(
        'index_name', indexname,
        'index_definition', indexdef,
        'is_unique', CASE WHEN indexdef LIKE '%UNIQUE%' THEN true ELSE false END,
        'is_primary', CASE WHEN indexdef LIKE '%PRIMARY%' THEN true ELSE false END
    ) as details
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')

UNION ALL

-- Views
SELECT 
    'VIEW' as object_type,
    table_schema,
    table_name,
    'VIEW_DEFINITION' as detail_type,
    jsonb_build_object(
        'view_definition', view_definition,
        'is_updatable', is_updatable,
        'is_insertable_into', is_insertable_into
    ) as details
FROM information_schema.views
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')

UNION ALL

-- Functions and Stored Procedures
SELECT 
    'FUNCTION' as object_type,
    routine_schema as table_schema,
    routine_name as table_name,
    'FUNCTION_DEFINITION' as detail_type,
    jsonb_build_object(
        'routine_type', routine_type,
        'data_type', data_type,
        'routine_definition', routine_definition,
        'external_language', external_language,
        'is_deterministic', is_deterministic,
        'security_type', security_type
    ) as details
FROM information_schema.routines
WHERE routine_schema NOT IN ('pg_catalog', 'information_schema')

UNION ALL

-- Triggers
SELECT 
    'TRIGGER' as object_type,
    trigger_schema as table_schema,
    event_object_table as table_name,
    'TRIGGER' as detail_type,
    jsonb_build_object(
        'trigger_name', trigger_name,
        'event_manipulation', event_manipulation,
        'event_object_table', event_object_table,
        'action_statement', action_statement,
        'action_orientation', action_orientation,
        'action_timing', action_timing
    ) as details
FROM information_schema.triggers
WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema')

UNION ALL

-- Sequences
SELECT 
    'SEQUENCE' as object_type,
    sequence_schema as table_schema,
    sequence_name as table_name,
    'SEQUENCE' as detail_type,
    jsonb_build_object(
        'data_type', data_type,
        'numeric_precision', numeric_precision,
        'numeric_scale', numeric_scale,
        'start_value', start_value,
        'minimum_value', minimum_value,
        'maximum_value', maximum_value,
        'increment', increment,
        'cycle_option', cycle_option
    ) as details
FROM information_schema.sequences
WHERE sequence_schema NOT IN ('pg_catalog', 'information_schema')

UNION ALL

-- Custom Types (Enums, Composites)
SELECT 
    'TYPE' as object_type,
    n.nspname as table_schema,
    t.typname as table_name,
    CASE 
        WHEN t.typtype = 'e' THEN 'ENUM'
        WHEN t.typtype = 'c' THEN 'COMPOSITE'
        ELSE 'OTHER'
    END as detail_type,
    CASE 
        WHEN t.typtype = 'e' THEN 
            jsonb_build_object(
                'values', array_agg(e.enumlabel ORDER BY e.enumsortorder)
            )
        WHEN t.typtype = 'c' THEN
            jsonb_build_object(
                'attributes', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'name', a.attname,
                            'type', format_type(a.atttypid, a.atttypmod),
                            'position', a.attnum
                        ) ORDER BY a.attnum
                    )
                    FROM pg_attribute a
                    WHERE a.attrelid = t.typrelid AND a.attnum > 0 AND NOT a.attisdropped
                )
            )
        ELSE jsonb_build_object()
    END as details
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
LEFT JOIN pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND t.typtype IN ('e', 'c')
GROUP BY n.nspname, t.typname, t.typtype, t.typrelid

ORDER BY object_type, table_schema, table_name, detail_type;

-- Alternative: Generate CREATE statements for all objects
-- Uncomment the section below to generate DDL statements

/*
-- Generate CREATE TABLE statements
SELECT 
    'CREATE TABLE ' || table_schema || '.' || table_name || ' (' || chr(10) ||
    string_agg(
        '    ' || column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'varchar(' || character_maximum_length || ')'
            WHEN data_type = 'numeric' THEN 'numeric(' || numeric_precision || ',' || numeric_scale || ')'
            ELSE data_type
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ',' || chr(10) ORDER BY ordinal_position
    ) || chr(10) || ');' as create_statement
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
GROUP BY table_schema, table_name
ORDER BY table_schema, table_name;
*/