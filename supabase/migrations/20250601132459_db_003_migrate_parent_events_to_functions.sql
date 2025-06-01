-- DB-003: Migrate Parent Events to Functions
-- Migrate all parent events to functions
INSERT INTO functions (
    name,
    slug,
    description,
    image_url,
    start_date,
    end_date,
    location_id,
    organiser_id,
    metadata,
    is_published
)
SELECT 
    title as name,
    slug,
    description,
    image_url,
    event_start as start_date,
    event_end as end_date,
    location_id,
    organiser_id,
    jsonb_build_object(
        'migrated_from_event_id', event_id,
        'event_type', type,
        'is_multi_day', is_multi_day,
        'max_attendees', max_attendees,
        'featured', featured,
        'regalia', regalia,
        'dress_code', dress_code,
        'degree_type', degree_type,
        'sections', sections,
        'attendance', attendance,
        'documents', documents
    ) as metadata,
    is_published
FROM events
WHERE parent_event_id IS NULL
  AND event_id IN (
    SELECT DISTINCT parent_event_id 
    FROM events 
    WHERE parent_event_id IS NOT NULL
  );