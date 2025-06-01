-- Fix all location data with missing address information
-- This ensures location_string is populated correctly in event_display_view

-- Update Sydney Masonic Centre locations
UPDATE locations 
SET 
  street_address = COALESCE(street_address, '66 Goulburn Street'),
  suburb = COALESCE(suburb, 'Sydney'),
  state = COALESCE(state, 'NSW'),
  postal_code = COALESCE(postal_code, '2000'),
  country = COALESCE(country, 'Australia')
WHERE place_name LIKE '%Sydney Masonic Centre%'
  AND (suburb IS NULL OR state IS NULL OR postal_code IS NULL);

-- Also fix the event_display_view to handle nulls better
DROP VIEW IF EXISTS public.event_display_view CASCADE;

CREATE OR REPLACE VIEW public.event_display_view AS
SELECT 
    e.event_id,
    e.slug,
    e.title,
    e.subtitle,
    e.description,
    e.type,
    e.event_start,
    e.event_end,
    e.is_multi_day,
    e.featured,
    e.image_url,
    e.event_includes,
    e.important_information,
    e.is_published,
    e.is_purchasable_individually,
    e.max_attendees,
    e.regalia,
    e.regalia_description,
    e.dress_code,
    e.degree_type,
    e.sections,
    e.attendance,
    e.documents,
    e.related_events,
    e.created_at,
    e.parent_event_id,
    e.reserved_count,
    e.sold_count,
    
    -- Location details
    e.location_id,
    -- Better handling of null values in location string
    COALESCE(
        NULLIF(
            CONCAT_WS(', ', 
                l.room_or_area,
                l.place_name,
                l.suburb,
                CONCAT_WS(' ', l.state, l.postal_code)
            ),
            ''
        ),
        l.place_name,
        'TBD'
    ) AS location_string,
    l.place_name,
    l.street_address,
    l.suburb,
    l.state,
    l.postal_code,
    l.latitude,
    l.longitude,
    l.capacity AS location_capacity,
    
    -- Organisation details
    e.organiser_id,
    o.name AS organiser_name,
    o.abbreviation AS organiser_abbreviation,
    o.type AS organiser_type,
    
    -- Parent event details
    pe.title AS parent_event_title,
    pe.slug AS parent_event_slug,
    
    -- Calculate minimum price from event_tickets
    COALESCE(
        (SELECT MIN(et.price) 
         FROM event_tickets et 
         WHERE et.event_id = e.event_id 
           AND et.is_active = true 
           AND et.status = 'Active'),
        0
    ) AS min_price,
    
    -- Calculate total capacity from event_tickets
    COALESCE(
        (SELECT SUM(et.total_capacity) 
         FROM event_tickets et 
         WHERE et.event_id = e.event_id 
           AND et.is_active = true),
        0
    ) AS total_capacity,
    
    -- Calculate sold count from event_tickets
    COALESCE(
        (SELECT SUM(et.sold_count) 
         FROM event_tickets et 
         WHERE et.event_id = e.event_id),
        0
    ) AS tickets_sold,
    
    -- Calculate available count from event_tickets
    COALESCE(
        (SELECT SUM(et.available_count) 
         FROM event_tickets et 
         WHERE et.event_id = e.event_id 
           AND et.is_active = true),
        0
    ) AS tickets_available,
    
    -- Calculate if event is sold out
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM event_tickets et 
            WHERE et.event_id = e.event_id 
              AND et.is_active = true 
              AND et.available_count > 0
        ) THEN false
        ELSE true
    END AS is_sold_out,
    
    -- Count child events if this is a parent event
    (SELECT COUNT(*) 
     FROM events ce 
     WHERE ce.parent_event_id = e.event_id) AS child_event_count

FROM events e
LEFT JOIN locations l ON e.location_id = l.location_id
LEFT JOIN organisations o ON e.organiser_id = o.organisation_id
LEFT JOIN events pe ON e.parent_event_id = pe.event_id;

-- Grant appropriate permissions
GRANT SELECT ON public.event_display_view TO authenticated;
GRANT SELECT ON public.event_display_view TO anon;