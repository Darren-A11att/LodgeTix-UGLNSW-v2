-- Migration: Add Events-Organizer Relationship
-- Description: Links Events table to the new organizers system
-- Date: 2025-05-26

BEGIN;

-- Add organizer_id column to Events table to link with new organizers system
ALTER TABLE "Events" 
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES organizers(organizer_id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON "Events"(organizer_id);

-- For now, we'll leave both organiserorganisationid and organizer_id
-- This allows gradual migration from old system to new system
-- TODO: In v4, we'll migrate data from organiserorganisationid to organizer_id

-- RPC Function: Get organizer events with registration counts
CREATE OR REPLACE FUNCTION get_organizer_events_with_counts(org_id UUID)
RETURNS TABLE (
    event_id UUID,
    title TEXT,
    description TEXT,
    event_start TIMESTAMP WITH TIME ZONE,
    event_end TIMESTAMP WITH TIME ZONE,
    location TEXT,
    slug TEXT,
    featured BOOLEAN,
    max_attendees INTEGER,
    parent_event_id UUID,
    is_multi_day BOOLEAN,
    registration_count BIGINT,
    event_status TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as event_id,
        e.title,
        e.description,
        e."eventStart" as event_start,
        e."eventEnd" as event_end,
        e.location,
        e.slug,
        e.featured,
        e."maxAttendees" as max_attendees,
        e."parentEventId" as parent_event_id,
        e."isMultiDay" as is_multi_day,
        COUNT(DISTINCT r."registrationId") as registration_count,
        CASE 
            WHEN e."eventStart" IS NULL THEN 'draft'
            WHEN e."eventStart" > NOW() THEN 'upcoming'
            WHEN e."eventEnd" IS NOT NULL AND e."eventEnd" < NOW() THEN 'past'
            ELSE 'active'
        END as event_status
    FROM "Events" e
    LEFT JOIN "Registrations" r ON r."eventId" = e.id::text 
        AND r.status NOT IN ('cancelled', 'failed')
    WHERE e.organizer_id = org_id
        OR (e.organizer_id IS NULL AND e.organiserorganisationid IS NOT NULL) -- Fallback for unmigrated events
    GROUP BY e.id, e.title, e.description, e."eventStart", e."eventEnd", 
             e.location, e.slug, e.featured, e."maxAttendees", 
             e."parentEventId", e."isMultiDay"
    ORDER BY 
        CASE 
            WHEN e."eventStart" IS NULL THEN 3 -- drafts last
            WHEN e."eventStart" > NOW() THEN 1 -- upcoming first
            ELSE 2 -- past events second
        END,
        e."eventStart" ASC NULLS LAST;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_organizer_events_with_counts(UUID) TO authenticated;

-- Sample data for testing (if no events exist)
-- This will help demonstrate the functionality
DO $$
DECLARE
    sample_organizer_id UUID;
BEGIN
    -- Get the first organizer for sample data
    SELECT organizer_id INTO sample_organizer_id FROM organizers LIMIT 1;
    
    IF sample_organizer_id IS NOT NULL THEN
        -- Insert sample events if none exist
        INSERT INTO "Events" (
            id,
            title,
            description,
            "eventStart",
            "eventEnd",
            location,
            slug,
            organizer_id,
            featured,
            "maxAttendees",
            "isMultiDay"
        ) 
        SELECT 
            gen_random_uuid(),
            'Sample Masonic Event',
            'A sample event for testing the organizer portal',
            NOW() + INTERVAL '30 days',
            NOW() + INTERVAL '30 days' + INTERVAL '4 hours',
            'Grand Lodge Hall',
            'sample-masonic-event',
            sample_organizer_id,
            false,
            200,
            false
        WHERE NOT EXISTS (
            SELECT 1 FROM "Events" WHERE organizer_id = sample_organizer_id
        );
        
        -- Insert a past event
        INSERT INTO "Events" (
            id,
            title,
            description,
            "eventStart",
            "eventEnd",
            location,
            slug,
            organizer_id,
            featured,
            "maxAttendees",
            "isMultiDay"
        ) 
        SELECT 
            gen_random_uuid(),
            'Annual Lodge Meeting 2024',
            'Our annual lodge meeting and dinner',
            NOW() - INTERVAL '60 days',
            NOW() - INTERVAL '60 days' + INTERVAL '6 hours',
            'Lodge Meeting Room',
            'annual-lodge-meeting-2024',
            sample_organizer_id,
            false,
            100,
            false
        WHERE NOT EXISTS (
            SELECT 1 FROM "Events" 
            WHERE organizer_id = sample_organizer_id 
            AND title = 'Annual Lodge Meeting 2024'
        );
    END IF;
END $$;

COMMIT;