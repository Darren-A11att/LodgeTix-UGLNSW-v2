-- Safe Phased Migration Plan
-- Run each phase separately and verify before proceeding

-- =====================================================
-- PHASE 1: Backup and Analysis
-- =====================================================

-- Create backup tables (just in case)
CREATE TABLE IF NOT EXISTS registrations_backup AS SELECT * FROM registrations;
CREATE TABLE IF NOT EXISTS "Registrations_backup" AS SELECT * FROM "Registrations";
CREATE TABLE IF NOT EXISTS tickets_backup AS SELECT * FROM tickets;
CREATE TABLE IF NOT EXISTS "Tickets_backup" AS SELECT * FROM "Tickets";

-- Verify the tables we're working with
SELECT 
    tablename,
    (SELECT COUNT(*) FROM pg_tables t WHERE t.tablename = pt.tablename) as row_count_query
FROM pg_tables pt
WHERE schemaname = 'public' 
    AND tablename IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY tablename;

-- =====================================================
-- PHASE 2: Drop the test tables
-- =====================================================

-- Drop tickets first (it has FK to registrations)
DROP TABLE IF EXISTS tickets CASCADE;

-- Then drop registrations
DROP TABLE IF EXISTS registrations CASCADE;

-- Verify they're gone
SELECT 
    'After dropping test tables' as phase,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY tablename;

-- =====================================================
-- PHASE 3: Rename PascalCase tables to lowercase
-- =====================================================

-- Rename Registrations to registrations
ALTER TABLE "Registrations" RENAME TO registrations;

-- Rename Tickets to tickets  
ALTER TABLE "Tickets" RENAME TO tickets;

-- Verify the renames
SELECT 
    'After renaming tables' as phase,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY tablename;

-- =====================================================
-- PHASE 4: Rename columns in tickets table
-- =====================================================

-- Core column renames to match app expectations
ALTER TABLE tickets RENAME COLUMN ticketid TO id;
ALTER TABLE tickets RENAME COLUMN attendeeid TO attendee_id;
ALTER TABLE tickets RENAME COLUMN eventid TO event_id;
ALTER TABLE tickets RENAME COLUMN createdat TO created_at;

-- Additional renames based on mapping
ALTER TABLE tickets RENAME COLUMN ticketdefinitionid TO ticket_type_id;
ALTER TABLE tickets RENAME COLUMN pricepaid TO ticket_price;
ALTER TABLE tickets RENAME COLUMN updatedat TO updated_at;

-- Optional columns (check if they exist first)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'checkedinat') THEN
        ALTER TABLE tickets RENAME COLUMN checkedinat TO checked_in_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'seatinfo') THEN
        ALTER TABLE tickets RENAME COLUMN seatinfo TO seat_info;
    END IF;
END $$;

-- =====================================================
-- PHASE 5: Add missing columns that app expects
-- =====================================================

-- Add columns that the app expects but might not exist
ALTER TABLE tickets 
    ADD COLUMN IF NOT EXISTS registration_id UUID,
    ADD COLUMN IF NOT EXISTS ticket_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_partner_ticket BOOLEAN DEFAULT false;

-- Add foreign key to registrations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tickets_registration_id_fkey'
    ) THEN
        ALTER TABLE tickets
            ADD CONSTRAINT tickets_registration_id_fkey 
            FOREIGN KEY (registration_id) 
            REFERENCES registrations(registration_id);
    END IF;
END $$;

-- =====================================================
-- PHASE 6: Verification
-- =====================================================

-- Check final table structure
SELECT 
    'Final tickets columns' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check all foreign keys are intact
SELECT 
    'Foreign keys after migration' as check_type,
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column,
    ccu.table_name as referenced_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (ccu.table_name = 'registrations' OR tc.table_name = 'tickets')
ORDER BY tc.table_name;

-- =====================================================
-- PHASE 7: Cleanup (only after verification)
-- =====================================================

-- Once everything is verified working:
-- DROP TABLE IF EXISTS registrations_backup;
-- DROP TABLE IF EXISTS "Registrations_backup";
-- DROP TABLE IF EXISTS tickets_backup;
-- DROP TABLE IF EXISTS "Tickets_backup";