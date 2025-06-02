-- Create Function-based Views for API Queries
-- This migration creates two views for querying packages and event tickets by function ID

-- View 1: Function Packages View
-- Purpose: Get all packages for a specific function
CREATE OR REPLACE VIEW public.function_packages_view AS
SELECT 
    f.function_id,
    f.name as function_name,
    f.slug as function_slug,
    f.description as function_description,
    f.start_date as function_start_date,
    f.end_date as function_end_date,
    p.package_id,
    p.name as package_name,
    p.description as package_description,
    p.original_price,
    p.discount,
    p.package_price,
    p.is_active,
    p.includes_description,
    p.qty,
    p.included_items,
    p.eligibility_criteria,
    p.created_at as package_created_at,
    p.updated_at as package_updated_at,
    p.event_id
FROM 
    public.functions f
    INNER JOIN public.packages p ON f.function_id = p.function_id
WHERE 
    p.is_active = true;

-- View 2: Function Event Tickets View  
-- Purpose: Get all event tickets for events within a specific function
CREATE OR REPLACE VIEW public.function_event_tickets_view AS
SELECT 
    f.function_id,
    f.name as function_name,
    f.slug as function_slug,
    f.description as function_description,
    f.start_date as function_start_date,
    f.end_date as function_end_date,
    e.event_id,
    e.title as event_title,
    e.slug as event_slug,
    e.event_start,
    e.event_end,
    e.type as event_type,
    e.is_published as event_is_published,
    et.event_ticket_id,
    et.name as ticket_name,
    et.description as ticket_description,
    et.price as ticket_price,
    et.total_capacity,
    et.available_count,
    et.reserved_count,
    et.sold_count,
    et.status as ticket_status,
    et.is_active as ticket_is_active,
    et.eligibility_criteria as ticket_eligibility_criteria,
    et.stripe_price_id,
    et.created_at as ticket_created_at,
    et.updated_at as ticket_updated_at
FROM 
    public.functions f
    INNER JOIN public.events e ON f.function_id = e.function_id
    INNER JOIN public.event_tickets et ON e.event_id = et.event_id
WHERE 
    e.is_published = true 
    AND et.is_active = true;

-- Add comments for documentation
COMMENT ON VIEW public.function_packages_view IS 
'View to get all active packages for a specific function. Query by function_id to get all packages associated with that function.';

COMMENT ON VIEW public.function_event_tickets_view IS 
'View to get all active event tickets for events within a specific function. Query by function_id to get all event tickets for events in that function.';