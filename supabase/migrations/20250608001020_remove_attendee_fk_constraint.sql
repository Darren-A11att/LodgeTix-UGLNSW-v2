-- Remove the foreign key constraint that's causing issues with attendee relationship creation
-- This allows us to set related_attendee_id without worrying about creation order
-- We can add validation logic later if needed

-- Drop the foreign key constraint
ALTER TABLE "public"."attendees" 
DROP CONSTRAINT IF EXISTS "attendees_related_attendee_id_fkey";

-- Keep the index for performance but remove the foreign key validation
-- The index on related_attendee_id will still exist for performance