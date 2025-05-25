-- Clean Migration Strategy: Drop test tables and rename PascalCase to lowercase
-- This is a much simpler approach that maintains all existing relationships

BEGIN;

-- Step 1: Drop the test tables (registrations and tickets)
-- These only reference each other and contain test data
DROP TABLE IF EXISTS tickets CASCADE;  -- CASCADE will drop the FK from tickets to registrations
DROP TABLE IF EXISTS registrations CASCADE;

-- Step 2: Rename Registrations to registrations
ALTER TABLE "Registrations" RENAME TO registrations;

-- Step 3: Rename Tickets to tickets
ALTER TABLE "Tickets" RENAME TO tickets;

-- Step 4: Rename columns in tickets from camelCase to snake_case
-- This ensures compatibility with the existing application code
ALTER TABLE tickets 
    RENAME COLUMN ticketid TO id;

ALTER TABLE tickets 
    RENAME COLUMN attendeeid TO attendee_id;

ALTER TABLE tickets 
    RENAME COLUMN eventid TO event_id;

ALTER TABLE tickets 
    RENAME COLUMN ticketdefinitionid TO ticket_type_id;

ALTER TABLE tickets 
    RENAME COLUMN pricepaid TO ticket_price;

ALTER TABLE tickets 
    RENAME COLUMN createdat TO created_at;

ALTER TABLE tickets 
    RENAME COLUMN updatedat TO updated_at;

ALTER TABLE tickets 
    RENAME COLUMN checkedinat TO checked_in_at;

ALTER TABLE tickets 
    RENAME COLUMN seatinfo TO seat_info;

-- Step 5: Add columns that exist in the old tickets table but not in Tickets
-- Based on your app's expectations
ALTER TABLE tickets 
    ADD COLUMN IF NOT EXISTS registration_id UUID;

ALTER TABLE tickets 
    ADD COLUMN IF NOT EXISTS ticket_status VARCHAR(50);

ALTER TABLE tickets 
    ADD COLUMN IF NOT EXISTS is_partner_ticket BOOLEAN DEFAULT false;

-- Step 6: Add foreign key from tickets to registrations
ALTER TABLE tickets
    ADD CONSTRAINT tickets_registration_id_fkey 
    FOREIGN KEY (registration_id) 
    REFERENCES registrations(registration_id);

-- Step 7: Update any RLS policies that reference the old table names
-- This depends on your specific policies

-- Step 8: Verify the migration
SELECT 
    'Tables after migration' as check_type,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('registrations', 'Registrations', 'tickets', 'Tickets')
ORDER BY tablename;

-- Check foreign keys are still intact
SELECT 
    'Foreign keys to registrations' as check_type,
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'registrations';

COMMIT;

-- Post-migration cleanup for the TypeScript types
-- After running this migration, you'll need to:
-- 1. Update supabase/types.ts to remove the PascalCase interfaces
-- 2. Remove the mapping logic in supabase-singleton.ts
-- 3. Remove the workaround in app/api/registrations/route.ts