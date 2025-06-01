-- ============================================================================
-- FIX DATABASE DATA TYPES TO MATCH CODEBASE EXPECTATIONS
-- Date: 2025-06-02
-- Description: This migration ensures database data types match what the codebase
--              expects while maintaining correct snake_case column naming.
--              The database column names are the source of truth!
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FIX ATTENDEES TABLE
-- ============================================================================

-- 1.1 Fix is_partner column - codebase expects UUID (FK to another attendee), not boolean
DO $$
BEGIN
    -- First check if is_partner exists as boolean
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'attendees' 
        AND column_name = 'is_partner' 
        AND data_type = 'boolean'
    ) THEN
        -- Drop the incorrect boolean column
        ALTER TABLE public.attendees DROP COLUMN is_partner;
    END IF;
    
    -- Add is_partner as UUID if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'attendees' 
        AND column_name = 'is_partner'
    ) THEN
        ALTER TABLE public.attendees ADD COLUMN is_partner UUID;
        
        -- Add foreign key constraint
        ALTER TABLE public.attendees 
        ADD CONSTRAINT attendees_is_partner_fkey 
        FOREIGN KEY (is_partner) REFERENCES attendees(attendee_id) ON DELETE SET NULL;
        
        -- Add index for performance
        CREATE INDEX idx_attendees_is_partner ON public.attendees(is_partner);
    END IF;
END $$;

-- 1.2 Add missing event_title column that codebase expects
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS event_title TEXT;

-- 1.3 Ensure all expected columns exist with correct data types
-- These columns exist in the codebase types but might be missing from some installations
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS suffix TEXT;
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS has_partner BOOLEAN DEFAULT false;
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS person_id UUID;

-- ============================================================================
-- 2. FIX REGISTRATION_TYPE ENUM
-- ============================================================================

-- Add missing enum values that the codebase uses
DO $$
BEGIN
    -- Check if 'individuals' exists (codebase uses this, not 'individual')
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'individuals' 
        AND enumtypid = 'registration_type'::regtype
    ) THEN
        ALTER TYPE registration_type ADD VALUE IF NOT EXISTS 'individuals';
    END IF;
    
    -- Add 'groups' if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'groups' 
        AND enumtypid = 'registration_type'::regtype
    ) THEN
        ALTER TYPE registration_type ADD VALUE IF NOT EXISTS 'groups';
    END IF;
    
    -- Add 'officials' if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'officials' 
        AND enumtypid = 'registration_type'::regtype
    ) THEN
        ALTER TYPE registration_type ADD VALUE IF NOT EXISTS 'officials';
    END IF;
END $$;

-- ============================================================================
-- 3. FIX ATTENDEE_TYPE ENUM
-- ============================================================================

-- Add missing enum values
DO $$
BEGIN
    -- Add 'ladypartner' if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'ladypartner' 
        AND enumtypid = 'attendee_type'::regtype
    ) THEN
        ALTER TYPE attendee_type ADD VALUE IF NOT EXISTS 'ladypartner';
    END IF;
    
    -- Add 'guestpartner' if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'guestpartner' 
        AND enumtypid = 'attendee_type'::regtype
    ) THEN
        ALTER TYPE attendee_type ADD VALUE IF NOT EXISTS 'guestpartner';
    END IF;
END $$;

-- ============================================================================
-- 4. FIX ATTENDEE_CONTACT_PREFERENCE ENUM
-- ============================================================================

-- Add missing enum values that codebase uses
DO $$
BEGIN
    -- Add lowercase versions that codebase uses
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'directly' 
        AND enumtypid = 'attendee_contact_preference'::regtype
    ) THEN
        ALTER TYPE attendee_contact_preference ADD VALUE IF NOT EXISTS 'directly';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'primaryattendee' 
        AND enumtypid = 'attendee_contact_preference'::regtype
    ) THEN
        ALTER TYPE attendee_contact_preference ADD VALUE IF NOT EXISTS 'primaryattendee';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'mason' 
        AND enumtypid = 'attendee_contact_preference'::regtype
    ) THEN
        ALTER TYPE attendee_contact_preference ADD VALUE IF NOT EXISTS 'mason';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'guest' 
        AND enumtypid = 'attendee_contact_preference'::regtype
    ) THEN
        ALTER TYPE attendee_contact_preference ADD VALUE IF NOT EXISTS 'guest';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'providelater' 
        AND enumtypid = 'attendee_contact_preference'::regtype
    ) THEN
        ALTER TYPE attendee_contact_preference ADD VALUE IF NOT EXISTS 'providelater';
    END IF;
END $$;

-- ============================================================================
-- 5. FIX TICKETS TABLE
-- ============================================================================

-- Ensure status column accepts values the codebase uses
-- The codebase uses: 'available', 'reserved', 'sold', 'used', 'cancelled'
-- This requires checking and potentially updating the constraint

DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
    
    -- Add new constraint with all expected values
    ALTER TABLE public.tickets ADD CONSTRAINT tickets_status_check 
    CHECK (status IN ('available', 'reserved', 'sold', 'used', 'cancelled'));
END $$;

-- ============================================================================
-- 6. FIX PAYMENT_STATUS ENUM
-- ============================================================================

-- Ensure it has all the values the codebase might use
DO $$
BEGIN
    -- The codebase uses 'Unpaid' with capital U in some places
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Unpaid' 
        AND enumtypid = 'payment_status'::regtype
    ) THEN
        ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'Unpaid';
    END IF;
    
    -- Also add 'unpaid' lowercase version
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'unpaid' 
        AND enumtypid = 'payment_status'::regtype
    ) THEN
        ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'unpaid';
    END IF;
END $$;

-- ============================================================================
-- 7. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add any missing indexes that the codebase queries expect
CREATE INDEX IF NOT EXISTS idx_attendees_event_title ON public.attendees(event_title);
CREATE INDEX IF NOT EXISTS idx_attendees_person_id ON public.attendees(person_id);

-- ============================================================================
-- 8. ADD COMMENTS FOR CLARITY
-- ============================================================================

COMMENT ON COLUMN public.attendees.is_partner IS 'UUID foreign key to another attendee who is the partner of this attendee';
COMMENT ON COLUMN public.attendees.event_title IS 'Event title stored for historical reference when attendee was registered';

COMMIT;

-- ============================================================================
-- IMPORTANT NOTES:
-- 1. The codebase needs to be updated to use snake_case column names
-- 2. This migration only fixes data types to match codebase expectations
-- 3. The database column naming (snake_case) is correct and should not be changed
-- ============================================================================