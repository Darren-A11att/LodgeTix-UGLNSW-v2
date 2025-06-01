-- Create ticket_availability_view
-- Purpose: Real-time ticket availability per event
CREATE OR REPLACE VIEW public.ticket_availability_view AS
SELECT 
    et.id AS ticket_type_id,
    et.event_id,
    et.name AS ticket_type_name,
    et.description,
    et.price,
    et.total_capacity,
    et.available_count,
    et.reserved_count,
    et.sold_count,
    et.status,
    et.is_active,
    et.eligibility_criteria,
    et.created_at,
    et.updated_at,
    
    -- Event information
    e.title AS event_title,
    e.slug AS event_slug,
    e.event_start,
    e.event_end,
    e.is_published AS event_is_published,
    
    -- Calculate percentage sold
    CASE 
        WHEN et.total_capacity IS NULL OR et.total_capacity = 0 THEN 0
        ELSE ROUND((et.sold_count::numeric / et.total_capacity::numeric) * 100, 2)
    END AS percentage_sold,
    
    -- Calculate if ticket type is sold out
    CASE 
        WHEN et.available_count IS NULL OR et.available_count = 0 THEN true
        ELSE false
    END AS is_sold_out,
    
    -- Count active reservations (tickets with unexpired reservations)
    (SELECT COUNT(*) 
     FROM tickets t 
     WHERE t.ticket_type_id = et.id 
       AND t.reservation_id IS NOT NULL 
       AND t.reservation_expires_at > NOW()
       AND t.status = 'reserved') AS active_reservations,
    
    -- Calculate actual available (considering active reservations)
    CASE 
        WHEN et.available_count IS NULL THEN 0
        ELSE GREATEST(
            0, 
            et.available_count - (
                SELECT COUNT(*) 
                FROM tickets t 
                WHERE t.ticket_type_id = et.id 
                  AND t.reservation_id IS NOT NULL 
                  AND t.reservation_expires_at > NOW()
                  AND t.status = 'reserved'
            )
        )
    END AS actual_available,
    
    -- Group by ticket category if specified in eligibility criteria
    et.eligibility_criteria->>'category' AS ticket_category,
    
    -- Extract eligibility rules
    et.eligibility_criteria->'rules' AS eligibility_rules,
    
    -- Check if ticket requires special eligibility
    CASE 
        WHEN jsonb_array_length(et.eligibility_criteria->'rules') > 0 THEN true
        ELSE false
    END AS has_eligibility_requirements

FROM event_tickets et
JOIN events e ON et.event_id = e.event_id
WHERE et.is_active = true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_reservation_status ON public.tickets 
    USING btree (ticket_type_id, reservation_id, reservation_expires_at, status) 
    WHERE reservation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_tickets_active ON public.event_tickets 
    USING btree (event_id, is_active) 
    WHERE is_active = true;

-- Grant appropriate permissions
GRANT SELECT ON public.ticket_availability_view TO authenticated;
GRANT SELECT ON public.ticket_availability_view TO anon;