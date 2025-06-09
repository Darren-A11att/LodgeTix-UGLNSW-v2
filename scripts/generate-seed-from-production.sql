-- Script to generate seed data from production database
-- This script outputs INSERT statements in dependency order

-- Set output format
\t on
\pset format unaligned
\pset fieldsep ' '
\pset footer off

-- Start transaction
BEGIN;

-- Create a temporary function to generate INSERT statements
CREATE OR REPLACE FUNCTION generate_insert_statement(
    p_table_name text,
    p_schema_name text DEFAULT 'public'
) RETURNS SETOF text AS $$
DECLARE
    v_columns text;
    v_sql text;
    v_record record;
    v_values text;
    v_column_list text[];
    v_column text;
    v_value text;
    v_result text;
BEGIN
    -- Get column names
    SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO v_columns
    FROM information_schema.columns
    WHERE table_schema = p_schema_name
    AND table_name = p_table_name
    AND column_name NOT IN ('created_at', 'updated_at') -- Skip auto-generated timestamps
    AND column_default IS NULL OR column_default NOT LIKE 'gen_random_uuid()%';

    -- Get column list as array
    SELECT array_agg(column_name ORDER BY ordinal_position)
    INTO v_column_list
    FROM information_schema.columns
    WHERE table_schema = p_schema_name
    AND table_name = p_table_name
    AND column_name NOT IN ('created_at', 'updated_at')
    AND column_default IS NULL OR column_default NOT LIKE 'gen_random_uuid()%';

    -- Build and execute dynamic SQL
    v_sql := format('SELECT * FROM %I.%I', p_schema_name, p_table_name);
    
    FOR v_record IN EXECUTE v_sql
    LOOP
        v_values := '';
        FOREACH v_column IN ARRAY v_column_list
        LOOP
            EXECUTE format('SELECT $1.%I::text', v_column) INTO v_value USING v_record;
            
            IF v_value IS NULL THEN
                v_values := v_values || 'NULL';
            ELSIF v_value ~ '^\d+(\.\d+)?$' THEN
                -- Numeric value
                v_values := v_values || v_value;
            ELSIF v_value ~ '^(true|false)$' THEN
                -- Boolean value
                v_values := v_values || v_value;
            ELSE
                -- Text/other value - properly escape quotes
                v_values := v_values || quote_literal(v_value);
            END IF;
            
            v_values := v_values || ', ';
        END LOOP;
        
        -- Remove trailing comma and space
        v_values := rtrim(v_values, ', ');
        
        -- Generate INSERT statement
        v_result := format('INSERT INTO %I.%I (%s) VALUES (%s);',
            p_schema_name, p_table_name, v_columns, v_values);
            
        RETURN NEXT v_result;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Output seed file header
SELECT '-- Production Database Seed File' AS output
UNION ALL
SELECT '-- Generated on: ' || CURRENT_TIMESTAMP::text
UNION ALL
SELECT '-- This file contains data in dependency order'
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Disable triggers during import'
UNION ALL
SELECT 'SET session_replication_role = replica;'
UNION ALL
SELECT ''

-- 1. Locations (no dependencies)
UNION ALL
SELECT '-- Locations'
UNION ALL
SELECT generate_insert_statement('locations')

-- 2. Organisations (no dependencies)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Organisations'
UNION ALL
SELECT generate_insert_statement('organisations')

-- 3. Contacts (depends on organisations)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Contacts'
UNION ALL
SELECT generate_insert_statement('contacts')

-- 4. Functions (depends on locations and organisations)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Functions'
UNION ALL
SELECT generate_insert_statement('functions')

-- 5. Events (depends on functions and locations)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Events'
UNION ALL
SELECT generate_insert_statement('events')

-- 6. Event Tickets (depends on events)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Event Tickets'
UNION ALL
SELECT generate_insert_statement('event_tickets')

-- 7. Packages (depends on functions)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Packages'
UNION ALL
SELECT generate_insert_statement('packages')

-- 8. Package Event Tickets (depends on packages and event_tickets)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Package Event Tickets'
UNION ALL
SELECT generate_insert_statement('package_event_tickets')

-- 9. Customers (no dependencies)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Customers'
UNION ALL
SELECT generate_insert_statement('customers')

-- 10. Registrations (depends on functions, customers, contacts)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Registrations'
UNION ALL
SELECT generate_insert_statement('registrations')
WHERE status IN ('completed', 'confirmed') -- Only include confirmed registrations

-- 11. Attendees (depends on registrations, customers)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Attendees'
UNION ALL
SELECT generate_insert_statement('attendees')
WHERE registration_id IN (
    SELECT registration_id FROM registrations 
    WHERE status IN ('completed', 'confirmed')
)

-- 12. Tickets (depends on attendees, event_tickets, registrations)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Tickets'
UNION ALL
SELECT generate_insert_statement('tickets')
WHERE registration_id IN (
    SELECT registration_id FROM registrations 
    WHERE status IN ('completed', 'confirmed')
)

-- 13. Website schema data (if exists)
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Website Content (if schema exists)'
UNION ALL
SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'website') 
    THEN generate_insert_statement('meta_tags', 'website')
    ELSE '-- Website schema not found'
END

-- Re-enable triggers
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Re-enable triggers'
UNION ALL
SELECT 'SET session_replication_role = DEFAULT;'
UNION ALL
SELECT ''
UNION ALL
SELECT '-- Update sequences'
UNION ALL
SELECT 'SELECT setval(''' || sequence_name || ''', (SELECT COALESCE(MAX(' || 
       CASE 
           WHEN column_name LIKE '%_id' THEN column_name
           ELSE 'id'
       END || '), 1) FROM ' || table_schema || '.' || table_name || '));'
FROM (
    SELECT 
        s.sequence_name,
        s.sequence_schema,
        t.table_schema,
        t.table_name,
        c.column_name
    FROM information_schema.sequences s
    JOIN pg_depend d ON d.objid = (s.sequence_schema||'.'||s.sequence_name)::regclass
    JOIN pg_class t ON t.oid = d.refobjid
    JOIN information_schema.tables it ON it.table_name = t.relname
    JOIN information_schema.columns c ON c.table_schema = it.table_schema 
        AND c.table_name = it.table_name
        AND c.column_default LIKE '%' || s.sequence_name || '%'
    WHERE s.sequence_schema NOT IN ('pg_catalog', 'information_schema')
) seq_info;

-- Clean up
DROP FUNCTION IF EXISTS generate_insert_statement(text, text);

COMMIT;

-- Reset output format
\t off
\pset format aligned
\pset footer on