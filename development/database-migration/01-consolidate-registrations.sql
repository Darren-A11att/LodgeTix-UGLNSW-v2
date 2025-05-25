-- Migration Script: Consolidate Registrations tables
-- This script migrates from dual tables (registrations & Registrations) to single lowercase table

-- Step 1: Backup existing data
-- Run these commands to create backups before migration
/*
CREATE TABLE registrations_backup AS SELECT * FROM registrations;
CREATE TABLE "Registrations_backup" AS SELECT * FROM "Registrations";
*/

BEGIN;

-- Step 2: Analyze data overlap
-- Check for any registration_ids that exist in both tables
WITH overlap_check AS (
    SELECT 
        r1.registration_id,
        r1.created_at as lowercase_created,
        r2.created_at as uppercase_created,
        r1.customer_id as lowercase_customer,
        r2.customer_id as uppercase_customer
    FROM registrations r1
    FULL OUTER JOIN "Registrations" r2 ON r1.registration_id = r2.registration_id
)
SELECT 
    COUNT(CASE WHEN lowercase_created IS NOT NULL AND uppercase_created IS NOT NULL THEN 1 END) as in_both,
    COUNT(CASE WHEN lowercase_created IS NOT NULL AND uppercase_created IS NULL THEN 1 END) as only_lowercase,
    COUNT(CASE WHEN lowercase_created IS NULL AND uppercase_created IS NOT NULL THEN 1 END) as only_uppercase
FROM overlap_check;

-- Step 3: Migrate data from Registrations to registrations
-- Only insert records that don't already exist in lowercase table
INSERT INTO registrations (
    registration_id,
    customer_id,
    event_id,
    registration_date,
    status,
    total_amount_paid,
    total_price_paid,
    payment_status,
    agree_to_terms,
    stripe_payment_intent_id,
    primary_attendee_id,
    registration_type,
    created_at,
    updated_at,
    registration_data
)
SELECT 
    registration_id,
    customer_id,
    event_id,
    registration_date,
    status,
    total_amount_paid,
    total_price_paid,
    payment_status,
    agree_to_terms,
    stripe_payment_intent_id,
    primary_attendee_id,
    registration_type,
    created_at,
    updated_at,
    registration_data
FROM "Registrations" R
WHERE NOT EXISTS (
    SELECT 1 FROM registrations r 
    WHERE r.registration_id = R.registration_id
);

-- Step 4: Update foreign key constraints
-- First, drop existing constraints that reference Registrations
ALTER TABLE attendee_ticket_assignments 
    DROP CONSTRAINT IF EXISTS attendee_ticket_assignments_registration_id_fkey;

ALTER TABLE attendees 
    DROP CONSTRAINT IF EXISTS attendees_registrationid_fkey;

ALTER TABLE registration_vas 
    DROP CONSTRAINT IF EXISTS registration_vas_registration_id_fkey;

-- Step 5: Add new foreign key constraints to reference registrations (lowercase)
ALTER TABLE attendee_ticket_assignments 
    ADD CONSTRAINT attendee_ticket_assignments_registration_id_fkey 
    FOREIGN KEY (registration_id) 
    REFERENCES registrations(registration_id);

ALTER TABLE attendees 
    ADD CONSTRAINT attendees_registrationid_fkey 
    FOREIGN KEY (registrationid) 
    REFERENCES registrations(registration_id);

ALTER TABLE registration_vas 
    ADD CONSTRAINT registration_vas_registration_id_fkey 
    FOREIGN KEY (registration_id) 
    REFERENCES registrations(registration_id);

-- Step 6: Verify data integrity
-- Check that all foreign keys still resolve
SELECT 'attendee_ticket_assignments' as table_name, COUNT(*) as orphaned_records
FROM attendee_ticket_assignments ata
WHERE NOT EXISTS (
    SELECT 1 FROM registrations r WHERE r.registration_id = ata.registration_id
)
UNION ALL
SELECT 'attendees', COUNT(*)
FROM attendees a
WHERE a.registrationid IS NOT NULL 
    AND NOT EXISTS (
        SELECT 1 FROM registrations r WHERE r.registration_id = a.registrationid
    )
UNION ALL
SELECT 'registration_vas', COUNT(*)
FROM registration_vas rv
WHERE NOT EXISTS (
    SELECT 1 FROM registrations r WHERE r.registration_id = rv.registration_id
);

-- Step 7: Drop the Registrations table (only after verification)
-- IMPORTANT: Only run this after confirming all data is migrated and constraints are updated
-- DROP TABLE IF EXISTS "Registrations";

COMMIT;

-- Post-migration verification queries
-- Run these to ensure migration was successful:
/*
-- Check record counts
SELECT 'registrations' as table_name, COUNT(*) as record_count FROM registrations
UNION ALL
SELECT 'Registrations', COUNT(*) FROM "Registrations";

-- Verify foreign key integrity
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name IN ('registrations', 'Registrations');
*/