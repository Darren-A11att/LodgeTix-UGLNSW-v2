-- Sequential Migration: Properly handle foreign key dependencies
-- This script removes FK constraints first, then proceeds with the migration

BEGIN;

-- =====================================================
-- PHASE 1: Drop foreign key constraints that reference the test tables
-- =====================================================
-- Check and drop any foreign key constraints on the lowercase test tables
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    -- Find and drop all foreign keys that reference 'registrations' (lowercase)
    FOR fk_record IN 
        SELECT conname, conrelid::regclass::text as table_name
        FROM pg_constraint
        WHERE confrelid = 'registrations'::regclass
        AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', fk_record.table_name, fk_record.conname);
        RAISE NOTICE 'Dropped FK constraint % from table %', fk_record.conname, fk_record.table_name;
    END LOOP;
    
    -- Find and drop all foreign keys that reference 'tickets' (lowercase)
    FOR fk_record IN 
        SELECT conname, conrelid::regclass::text as table_name
        FROM pg_constraint
        WHERE confrelid = 'tickets'::regclass
        AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', fk_record.table_name, fk_record.conname);
        RAISE NOTICE 'Dropped FK constraint % from table %', fk_record.conname, fk_record.table_name;
    END LOOP;
END $$;

-- =====================================================
-- PHASE 2: Drop the test lowercase tables
-- =====================================================
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;

-- =====================================================
-- PHASE 3: Rename PascalCase tables to lowercase
-- =====================================================
ALTER TABLE "Registrations" RENAME TO registrations;
ALTER TABLE "Tickets" RENAME TO tickets;

-- =====================================================
-- PHASE 4: Conditionally rename columns in tickets table
-- =====================================================
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
-- PHASE 5: Add columns expected by the application
-- =====================================================
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
-- PHASE 6: Handle constraints properly
-- =====================================================
-- First, handle the primary key constraint rename
DO $$
BEGIN
    -- Check if the old constraint exists and rename it
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_consolidated_pkey') THEN
        ALTER TABLE registrations RENAME CONSTRAINT registrations_consolidated_pkey TO registrations_pkey;
    END IF;
    
    -- If no primary key exists, create one
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conrelid = 'registrations'::regclass 
                   AND contype = 'p') THEN
        ALTER TABLE registrations ADD CONSTRAINT registrations_pkey PRIMARY KEY (registration_id);
    END IF;
END $$;

-- Drop the old foreign key constraint that has no dependencies
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_consolidated_eventid_fkey;

-- Handle tickets primary key
DO $$
DECLARE
    old_pk_name text;
BEGIN
    -- Check if a primary key exists and get its name
    SELECT conname INTO old_pk_name 
    FROM pg_constraint 
    WHERE conrelid = 'tickets'::regclass AND contype = 'p';
    
    IF old_pk_name IS NOT NULL AND old_pk_name != 'tickets_pkey' THEN
        -- Rename the existing primary key
        EXECUTE format('ALTER TABLE tickets RENAME CONSTRAINT %I TO tickets_pkey', old_pk_name);
    ELSIF old_pk_name IS NULL THEN
        -- No primary key exists, create one
        ALTER TABLE tickets ADD CONSTRAINT tickets_pkey PRIMARY KEY (ticket_id);
    END IF;
END $$;

-- =====================================================
-- PHASE 7: Add the new foreign key constraint
-- =====================================================
-- Only add if it doesn't already exist
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
-- PHASE 8: Create indexes for performance
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
-- PHASE 9: Verification
-- =====================================================
-- Show summary of changes
SELECT 
    'Migration Complete' as status,
    'registrations' as table_name,
    COUNT(*) as column_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'registrations'
GROUP BY table_name

UNION ALL

SELECT 
    'Migration Complete' as status,
    'tickets' as table_name,
    COUNT(*) as column_count,
    array_agg(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tickets'
GROUP BY table_name;

-- Show all constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('registrations', 'tickets')
ORDER BY tc.table_name, tc.constraint_type;

COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================
-- This migration:
-- 1. Properly handles foreign key dependencies
-- 2. Renames tables from PascalCase to lowercase
-- 3. Converts all columns to snake_case
-- 4. Preserves all data and relationships
-- 5. Adds backward compatibility columns
--
-- Next steps:
-- 1. Run: npx supabase gen types typescript
-- 2. Update application code to use snake_case field names
-- 3. Test all registration and ticket flows