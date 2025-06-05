-- Fix column mismatches in attendees table to match what the RPC function expects

-- Add missing columns to attendees table
ALTER TABLE attendees 
ADD COLUMN IF NOT EXISTS suffix_1 text,
ADD COLUMN IF NOT EXISTS suffix_2 text,
ADD COLUMN IF NOT EXISTS suffix_3 text,
ADD COLUMN IF NOT EXISTS primary_email text,
ADD COLUMN IF NOT EXISTS primary_phone text,
ADD COLUMN IF NOT EXISTS attendee_data jsonb;

-- Add comments for documentation
COMMENT ON COLUMN attendees.suffix_1 IS 'First suffix/honorific (e.g., OAM, JP)';
COMMENT ON COLUMN attendees.suffix_2 IS 'Second suffix/honorific';
COMMENT ON COLUMN attendees.suffix_3 IS 'Third suffix/honorific';
COMMENT ON COLUMN attendees.primary_email IS 'Primary email address for the attendee';
COMMENT ON COLUMN attendees.primary_phone IS 'Primary phone number for the attendee';
COMMENT ON COLUMN attendees.attendee_data IS 'Complete attendee data in JSON format for historical reference';

-- Migrate existing data from old columns to new columns
UPDATE attendees 
SET primary_email = COALESCE(primary_email, email),
    primary_phone = COALESCE(primary_phone, phone)
WHERE primary_email IS NULL OR primary_phone IS NULL;

-- Create indexes for the new email and phone columns for performance
CREATE INDEX IF NOT EXISTS idx_attendees_primary_email ON attendees(primary_email);
CREATE INDEX IF NOT EXISTS idx_attendees_primary_phone ON attendees(primary_phone);

-- Also fix the tickets table to have event_ticket_id column
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS event_ticket_id uuid REFERENCES event_tickets(event_ticket_id);

-- Migrate existing data from ticket_type_id to event_ticket_id
UPDATE tickets 
SET event_ticket_id = COALESCE(event_ticket_id, ticket_type_id)
WHERE event_ticket_id IS NULL AND ticket_type_id IS NOT NULL;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_tickets_event_ticket_id ON tickets(event_ticket_id);

-- Also add missing columns to tickets table that RPC functions expect
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS ticket_status varchar(50),
ADD COLUMN IF NOT EXISTS ticket_price numeric(10,2);

-- Create sequence for confirmation numbers if it doesn't exist
-- This is needed by some RPC functions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'registration_confirmation_seq') THEN
        CREATE SEQUENCE public.registration_confirmation_seq START WITH 1000;
    END IF;
END $$;