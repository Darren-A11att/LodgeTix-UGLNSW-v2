-- Complete Migration: Drop test tables, rename to lowercase, and convert ALL columns to snake_case
-- Following PostgreSQL naming standards properly

BEGIN;

-- =====================================================
-- PHASE 1: Drop the test tables (they only have test data)
-- =====================================================
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;

-- =====================================================
-- PHASE 2: Rename PascalCase tables to lowercase
-- =====================================================
ALTER TABLE "Registrations" RENAME TO registrations;
ALTER TABLE "Tickets" RENAME TO tickets;

-- =====================================================
-- PHASE 3: Rename ALL columns in tickets to snake_case
-- =====================================================

-- Core identifiers
ALTER TABLE tickets RENAME COLUMN ticketid TO ticket_id;
ALTER TABLE tickets RENAME COLUMN attendeeid TO attendee_id;
ALTER TABLE tickets RENAME COLUMN eventid TO event_id;
ALTER TABLE tickets RENAME COLUMN ticketdefinitionid TO ticket_definition_id;

-- Price and payment fields
ALTER TABLE tickets RENAME COLUMN pricepaid TO price_paid;
ALTER TABLE tickets RENAME COLUMN seatinfo TO seat_info;

-- Timestamps
ALTER TABLE tickets RENAME COLUMN checkedinat TO checked_in_at;
ALTER TABLE tickets RENAME COLUMN createdat TO created_at;
ALTER TABLE tickets RENAME COLUMN updatedat TO updated_at;
ALTER TABLE tickets RENAME COLUMN purchased_at TO purchased_at; -- Already snake_case

-- Status remains as is (already snake_case)
-- currency remains as is (already snake_case)
-- payment_status remains as is (already snake_case)
-- original_price remains as is (already snake_case)

-- Other fields
ALTER TABLE tickets RENAME COLUMN event_ticket_id TO event_ticket_id; -- Already snake_case
ALTER TABLE tickets RENAME COLUMN package_id TO package_id; -- Already snake_case
ALTER TABLE tickets RENAME COLUMN reservation_id TO reservation_id; -- Already snake_case
ALTER TABLE tickets RENAME COLUMN reservation_expires_at TO reservation_expires_at; -- Already snake_case

-- =====================================================
-- PHASE 4: Add columns to match current app expectations
-- =====================================================

-- Map the app's expected column names to existing columns where appropriate
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS id UUID;
UPDATE tickets SET id = ticket_id WHERE id IS NULL;

-- Add registration_id for the foreign key relationship
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS registration_id UUID;

-- Map ticket_price to price_paid for backward compatibility
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_price NUMERIC;
UPDATE tickets SET ticket_price = price_paid WHERE ticket_price IS NULL;

-- Map ticket_status to status for backward compatibility  
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_status VARCHAR;
UPDATE tickets SET ticket_status = status WHERE ticket_status IS NULL;

-- Add the partner ticket flag
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_partner_ticket BOOLEAN DEFAULT false;

-- =====================================================
-- PHASE 5: Add foreign key constraints
-- =====================================================

-- Add foreign key from tickets to registrations
ALTER TABLE tickets
    ADD CONSTRAINT tickets_registration_id_fkey 
    FOREIGN KEY (registration_id) 
    REFERENCES registrations(registration_id);

-- =====================================================
-- PHASE 6: Create indexes for better performance
-- =====================================================

-- Create indexes on foreign key columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_tickets_registration_id ON tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_tickets_attendee_id ON tickets(attendee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_definition_id ON tickets(ticket_definition_id);

-- =====================================================
-- PHASE 7: Verification
-- =====================================================

-- Check final table structure
SELECT 
    'Final column check' as verification,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('registrations', 'tickets')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Verify all foreign keys
SELECT 
    'Foreign key check' as verification,
    tc.table_name,
    kcu.column_name,
    ccu.table_name as references_table,
    ccu.column_name as references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('registrations', 'tickets')
ORDER BY tc.table_name;

COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================
-- After this migration:
-- 1. All table names are lowercase
-- 2. All column names are snake_case
-- 3. The app's expected columns exist (id, ticket_price, ticket_status, etc.)
-- 4. All original Tickets columns are preserved for future features
-- 5. Foreign key relationships are properly established
--
-- The codebase changes needed are minimal:
-- 1. Remove the dual-insert workaround in registrations API
-- 2. Remove PascalCase mappings from supabase-singleton.ts
-- 3. Regenerate TypeScript types