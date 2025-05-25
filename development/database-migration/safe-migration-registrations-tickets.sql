-- Safe Migration: Registrations and Tickets Tables
-- This script safely handles the migration with proper column existence checks

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
-- PHASE 3: Conditionally rename columns in tickets table
-- =====================================================
-- Use DO blocks to check if columns exist before renaming
DO $$ 
BEGIN
    -- Check and rename ticketid to ticket_id
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'ticketid') THEN
        ALTER TABLE tickets RENAME COLUMN ticketid TO ticket_id;
    END IF;
    
    -- Check and rename attendeeid to attendee_id
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'attendeeid') THEN
        ALTER TABLE tickets RENAME COLUMN attendeeid TO attendee_id;
    END IF;
    
    -- Check and rename eventid to event_id
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'eventid') THEN
        ALTER TABLE tickets RENAME COLUMN eventid TO event_id;
    END IF;
    
    -- Check and rename ticketdefinitionid to ticket_definition_id
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'ticketdefinitionid') THEN
        ALTER TABLE tickets RENAME COLUMN ticketdefinitionid TO ticket_definition_id;
    END IF;
    
    -- Check and rename pricepaid to price_paid
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'pricepaid') THEN
        ALTER TABLE tickets RENAME COLUMN pricepaid TO price_paid;
    END IF;
    
    -- Check and rename seatinfo to seat_info
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'seatinfo') THEN
        ALTER TABLE tickets RENAME COLUMN seatinfo TO seat_info;
    END IF;
    
    -- Check and rename checkedinat to checked_in_at
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'checkedinat') THEN
        ALTER TABLE tickets RENAME COLUMN checkedinat TO checked_in_at;
    END IF;
    
    -- Check and rename createdat to created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'createdat') THEN
        ALTER TABLE tickets RENAME COLUMN createdat TO created_at;
    END IF;
    
    -- Check and rename updatedat to updated_at
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'updatedat') THEN
        ALTER TABLE tickets RENAME COLUMN updatedat TO updated_at;
    END IF;
    
    -- Handle mixed case columns
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'reservationId') THEN
        ALTER TABLE tickets RENAME COLUMN "reservationId" TO reservation_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'reservationExpiresAt') THEN
        ALTER TABLE tickets RENAME COLUMN "reservationExpiresAt" TO reservation_expires_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'originalPrice') THEN
        ALTER TABLE tickets RENAME COLUMN "originalPrice" TO original_price;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'paymentStatus') THEN
        ALTER TABLE tickets RENAME COLUMN "paymentStatus" TO payment_status;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'purchasedAt') THEN
        ALTER TABLE tickets RENAME COLUMN "purchasedAt" TO purchased_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'eventTicketId') THEN
        ALTER TABLE tickets RENAME COLUMN "eventTicketId" TO event_ticket_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tickets' AND column_name = 'packageId') THEN
        ALTER TABLE tickets RENAME COLUMN "packageId" TO package_id;
    END IF;
END $$;

-- =====================================================
-- PHASE 4: Add columns expected by the application
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
-- PHASE 5: Handle constraints safely
-- =====================================================
-- Rename old constraints instead of dropping them (to preserve foreign key dependencies)
DO $$
BEGIN
    -- Rename registrations primary key if it exists with old name
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_consolidated_pkey') THEN
        ALTER TABLE registrations RENAME CONSTRAINT registrations_consolidated_pkey TO registrations_pkey;
    END IF;
    
    -- Drop the old foreign key constraint (no dependencies on this one)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_consolidated_eventid_fkey') THEN
        ALTER TABLE registrations DROP CONSTRAINT registrations_consolidated_eventid_fkey;
    END IF;
    
    -- Handle tickets primary key
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_pkey') THEN
        -- Primary key already exists with correct name
        NULL;
    ELSIF EXISTS (SELECT 1 FROM pg_constraint 
                  WHERE conrelid = 'tickets'::regclass 
                  AND contype = 'p') THEN
        -- A primary key exists but with different name, get its name and rename it
        DECLARE
            old_pk_name text;
        BEGIN
            SELECT conname INTO old_pk_name 
            FROM pg_constraint 
            WHERE conrelid = 'tickets'::regclass AND contype = 'p';
            
            EXECUTE format('ALTER TABLE tickets RENAME CONSTRAINT %I TO tickets_pkey', old_pk_name);
        END;
    ELSE
        -- No primary key exists, create it
        ALTER TABLE tickets ADD CONSTRAINT tickets_pkey PRIMARY KEY (ticket_id);
    END IF;
END $$;

-- Foreign key constraints
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

-- =====================================================
-- PHASE 6: Create indexes for performance
-- =====================================================
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
    'Final table structures' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN ('registrations', 'tickets')
ORDER BY table_name, ordinal_position;

-- Check constraints
SELECT 
    'Constraints check' as check_type,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('registrations', 'tickets')
ORDER BY tc.table_name, tc.constraint_type;

-- Check foreign keys
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
-- 1. Tables are renamed from PascalCase to lowercase
-- 2. All columns are in snake_case format
-- 3. Backward compatibility columns exist where needed
-- 4. All constraints and indexes are properly created
--
-- Next steps:
-- 1. Regenerate TypeScript types: npx supabase gen types typescript
-- 2. Update application code to use snake_case field names
-- 3. Remove PascalCase table references from the codebase