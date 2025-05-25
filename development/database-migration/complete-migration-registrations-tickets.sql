-- Complete Migration: Registrations and Tickets Tables
-- This script will drop test tables, rename PascalCase to lowercase, and convert columns to snake_case

BEGIN;

-- =====================================================
-- PHASE 1: Drop the test lowercase tables
-- =====================================================
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;

-- =====================================================
-- PHASE 2: Rename PascalCase tables to lowercase
-- =====================================================
ALTER TABLE "Registrations" RENAME TO registrations;
ALTER TABLE "Tickets" RENAME TO tickets;

-- =====================================================
-- PHASE 3: Registrations table columns are already snake_case
-- =====================================================
-- The Registrations table already has snake_case columns, no renaming needed.
-- Columns already present:
-- registration_id, customer_id, event_id, registration_date, status,
-- total_amount_paid, total_price_paid, payment_status, agree_to_terms,
-- stripe_payment_intent_id, primary_attendee_id, registration_type,
-- created_at, updated_at, registration_data

-- =====================================================
-- PHASE 4: Rename columns in tickets table to snake_case
-- =====================================================
-- Based on the screenshot, these columns need renaming:
ALTER TABLE tickets RENAME COLUMN "ticketid" TO ticket_id;
ALTER TABLE tickets RENAME COLUMN "attendeeid" TO attendee_id;
ALTER TABLE tickets RENAME COLUMN "eventid" TO event_id;
ALTER TABLE tickets RENAME COLUMN "ticketdefinitionid" TO ticket_definition_id;
ALTER TABLE tickets RENAME COLUMN "pricepaid" TO price_paid;
ALTER TABLE tickets RENAME COLUMN "seatinfo" TO seat_info;
ALTER TABLE tickets RENAME COLUMN "checkedinat" TO checked_in_at;
ALTER TABLE tickets RENAME COLUMN "createdat" TO created_at;
ALTER TABLE tickets RENAME COLUMN "updatedat" TO updated_at;
ALTER TABLE tickets RENAME COLUMN "reservationId" TO reservation_id;
ALTER TABLE tickets RENAME COLUMN "reservationExpiresAt" TO reservation_expires_at;
ALTER TABLE tickets RENAME COLUMN "originalPrice" TO original_price;
ALTER TABLE tickets RENAME COLUMN "paymentStatus" TO payment_status;
ALTER TABLE tickets RENAME COLUMN "purchasedAt" TO purchased_at;
ALTER TABLE tickets RENAME COLUMN "eventTicketId" TO event_ticket_id;
ALTER TABLE tickets RENAME COLUMN "packageId" TO package_id;

-- =====================================================
-- PHASE 5: Add columns expected by the application
-- =====================================================
-- For tickets table, add columns that map to existing ones for backward compatibility
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS id UUID;
UPDATE tickets SET id = ticket_id WHERE id IS NULL;

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS registration_id UUID;

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_type_id UUID;
UPDATE tickets SET ticket_type_id = ticket_definition_id WHERE ticket_type_id IS NULL;

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_price NUMERIC;
UPDATE tickets SET ticket_price = price_paid WHERE ticket_price IS NULL;

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_status VARCHAR(50);
UPDATE tickets SET ticket_status = status WHERE ticket_status IS NULL;

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_partner_ticket BOOLEAN DEFAULT false;

-- =====================================================
-- PHASE 6: Re-create constraints and indexes
-- =====================================================
-- Primary key constraints (check if they exist first)
DO $$ 
BEGIN
    -- Add primary key for registrations if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_pkey') THEN
        ALTER TABLE registrations ADD CONSTRAINT registrations_pkey PRIMARY KEY (registration_id);
    END IF;
    
    -- Add primary key for tickets if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_pkey') THEN
        ALTER TABLE tickets ADD CONSTRAINT tickets_pkey PRIMARY KEY (ticket_id);
    END IF;
END $$;

-- Foreign key constraints (check if exists before adding)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tickets_registration_id_fkey'
    ) THEN
        ALTER TABLE tickets 
          ADD CONSTRAINT tickets_registration_id_fkey 
          FOREIGN KEY (registration_id) 
          REFERENCES registrations(registration_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registrations_customer_id ON registrations(customer_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);

CREATE INDEX IF NOT EXISTS idx_tickets_registration_id ON tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_tickets_attendee_id ON tickets(attendee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_definition_id ON tickets(ticket_definition_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- =====================================================
-- PHASE 7: Verification
-- =====================================================
-- Check final table structures
SELECT 
    'registrations table columns' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'tickets table columns' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key relationships
SELECT 
    'Foreign keys check' as check_type,
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
-- After running this migration:
-- 1. All table names are lowercase
-- 2. All column names are snake_case
-- 3. Backward compatibility columns exist (id, ticket_price, ticket_status)
-- 4. All foreign key relationships are preserved
-- 5. Indexes are created for performance
--
-- Next steps:
-- 1. Update the application code to use snake_case field names
-- 2. Remove PascalCase references from the codebase
-- 3. Regenerate TypeScript types: npx supabase gen types typescript