-- Create event_hierarchy_view
-- Purpose: Parent-child event relationships
CREATE OR REPLACE VIEW public.event_hierarchy_view AS
WITH RECURSIVE event_tree AS (
    -- Base case: top-level events (no parent)
    SELECT 
        e.event_id,
        e.slug,
        e.title,
        e.subtitle,
        e.type,
        e.event_start,
        e.event_end,
        e.parent_event_id,
        e.is_published,
        e.is_purchasable_individually,
        e.max_attendees,
        e.reserved_count,
        e.sold_count,
        e.featured,
        e.image_url,
        e.location_id,
        e.organiser_id,
        0 AS level,
        ARRAY[e.event_id] AS path,
        e.event_id AS root_event_id
    FROM events e
    WHERE e.parent_event_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child events
    SELECT 
        e.event_id,
        e.slug,
        e.title,
        e.subtitle,
        e.type,
        e.event_start,
        e.event_end,
        e.parent_event_id,
        e.is_published,
        e.is_purchasable_individually,
        e.max_attendees,
        e.reserved_count,
        e.sold_count,
        e.featured,
        e.image_url,
        e.location_id,
        e.organiser_id,
        et.level + 1,
        et.path || e.event_id,
        et.root_event_id
    FROM events e
    INNER JOIN event_tree et ON e.parent_event_id = et.event_id
)
SELECT 
    et.*,
    
    -- Parent event information
    pe.title AS parent_title,
    pe.slug AS parent_slug,
    pe.type AS parent_type,
    
    -- Count direct children
    (SELECT COUNT(*) 
     FROM events ce 
     WHERE ce.parent_event_id = et.event_id) AS direct_child_count,
    
    -- Count all descendants
    (SELECT COUNT(*) 
     FROM event_tree et2 
     WHERE et.event_id = ANY(et2.path) 
       AND et2.event_id != et.event_id) AS total_descendant_count,
    
    -- Aggregate capacity across direct children
    (SELECT COALESCE(SUM(ce.max_attendees), 0) 
     FROM events ce 
     WHERE ce.parent_event_id = et.event_id) AS children_total_capacity,
    
    -- Aggregate sold count across direct children
    (SELECT COALESCE(SUM(ce.sold_count), 0) 
     FROM events ce 
     WHERE ce.parent_event_id = et.event_id) AS children_sold_count,
    
    -- Check if this event is part of a package
    EXISTS (
        SELECT 1 
        FROM packages p 
        WHERE p.event_id = et.event_id OR p.parent_event_id = et.event_id
    ) AS is_in_package,
    
    -- Get package details if event is part of packages
    (SELECT ARRAY_AGG(
        jsonb_build_object(
            'package_id', p.package_id,
            'package_name', p.name,
            'package_price', p.package_price,
            'is_active', p.is_active
        )
    )
     FROM packages p 
     WHERE (p.event_id = et.event_id OR p.parent_event_id = et.event_id)
       AND p.is_active = true) AS packages,
    
    -- Calculate total available tickets (including children for parent events)
    CASE 
        WHEN EXISTS (SELECT 1 FROM events ce WHERE ce.parent_event_id = et.event_id) THEN
            -- For parent events, sum children's availability
            (SELECT COALESCE(SUM(tav.actual_available), 0)
             FROM events ce
             JOIN ticket_availability_view tav ON ce.event_id = tav.event_id
             WHERE ce.parent_event_id = et.event_id)
        ELSE
            -- For leaf events, get direct availability
            (SELECT COALESCE(SUM(tav.actual_available), 0)
             FROM ticket_availability_view tav
             WHERE tav.event_id = et.event_id)
    END AS total_available_tickets,
    
    -- Path as readable string (for debugging/display)
    (SELECT STRING_AGG(e2.title, ' > ' ORDER BY array_position(et.path, e2.event_id))
     FROM events e2
     WHERE e2.event_id = ANY(et.path)) AS path_display

FROM event_tree et
LEFT JOIN events pe ON et.parent_event_id = pe.event_id
ORDER BY et.path;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_packages_event_id ON public.packages USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_packages_parent_event_id ON public.packages USING btree (parent_event_id);

-- Grant appropriate permissions
GRANT SELECT ON public.event_hierarchy_view TO authenticated;
GRANT SELECT ON public.event_hierarchy_view TO anon;