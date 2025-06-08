-- FINAL REMOVAL: Remove the foreign key constraint that was added by remote schema sync
-- This must run after the remote schema sync which adds the constraint

-- Remove the specific constraint that's causing the registration issues
ALTER TABLE "public"."attendees" DROP CONSTRAINT IF EXISTS "attendees_related_attendee_id_fkey";

-- Verify the constraint is gone by listing remaining FK constraints
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendees_related_attendee_id_fkey' 
    AND table_name = 'attendees' 
    AND table_schema = 'public'
    AND constraint_type = 'FOREIGN KEY';
    
    IF constraint_count = 0 THEN
        RAISE NOTICE 'SUCCESS: attendees_related_attendee_id_fkey constraint has been removed';
    ELSE
        RAISE NOTICE 'WARNING: attendees_related_attendee_id_fkey constraint still exists';
    END IF;
END $$;