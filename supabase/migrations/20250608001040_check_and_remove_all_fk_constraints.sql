-- Check for and remove ALL foreign key constraints on attendees.related_attendee_id
-- There might be multiple constraints or constraints with different names

DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all foreign key constraints on the attendees table that reference related_attendee_id
    FOR constraint_record IN 
        SELECT 
            tc.constraint_name,
            tc.table_name,
            tc.table_schema,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name 
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'attendees'
        AND tc.table_schema = 'public'
        AND kcu.column_name = 'related_attendee_id'
    LOOP
        -- Drop each foreign key constraint found
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', 
                      constraint_record.table_schema, 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint: % on table %.%', 
                     constraint_record.constraint_name,
                     constraint_record.table_schema,
                     constraint_record.table_name;
    END LOOP;
    
    -- Also check for any constraints that might reference attendees(attendee_id)
    FOR constraint_record IN 
        SELECT DISTINCT
            tc.constraint_name,
            tc.table_name,
            tc.table_schema
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name 
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.referential_constraints rc
            ON tc.constraint_name = rc.constraint_name
            AND tc.table_schema = rc.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND rc.unique_constraint_schema = 'public'
        AND EXISTS (
            SELECT 1 FROM information_schema.key_column_usage kcu2
            WHERE kcu2.constraint_name = rc.unique_constraint_name
            AND kcu2.table_name = 'attendees'
            AND kcu2.column_name = 'attendee_id'
        )
        AND tc.table_name = 'attendees'
        AND kcu.column_name = 'related_attendee_id'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', 
                      constraint_record.table_schema, 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
        RAISE NOTICE 'Dropped self-referencing FK constraint: % on table %.%', 
                     constraint_record.constraint_name,
                     constraint_record.table_schema,
                     constraint_record.table_name;
    END LOOP;
END $$;