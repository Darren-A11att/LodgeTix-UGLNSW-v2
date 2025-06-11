-- Force remove the foreign key constraint that's preventing registration
-- This migration runs after the remote schema sync to ensure the constraint is removed

-- First check if the constraint exists and drop it
DO $$
BEGIN
    -- Check if constraint exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendees_related_attendee_id_fkey' 
        AND table_name = 'attendees' 
        AND table_schema = 'public'
    ) THEN
        -- Drop the constraint
        EXECUTE 'ALTER TABLE public.attendees DROP CONSTRAINT attendees_related_attendee_id_fkey';
        RAISE NOTICE 'Dropped foreign key constraint attendees_related_attendee_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint attendees_related_attendee_id_fkey does not exist';
    END IF;
END $$;