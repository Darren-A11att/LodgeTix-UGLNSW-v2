-- Create registration_detail_view
-- Purpose: Complete registration information for management screens
CREATE OR REPLACE VIEW public.registration_detail_view AS
SELECT 
    r.registration_id,
    r.confirmation_number,
    r.registration_date,
    r.status,
    r.payment_status,
    r.total_amount_paid,
    r.total_price_paid,
    r.agree_to_terms,
    r.stripe_payment_intent_id,
    r.registration_type,
    r.created_at,
    r.updated_at,
    r.registration_data,
    
    -- Contact (customer) information
    r.contact_id,
    c.first_name AS customer_first_name,
    c.last_name AS customer_last_name,
    c.email AS customer_email,
    c.mobile_number AS customer_phone,
    COALESCE(c.first_name || ' ' || c.last_name, c.email) AS customer_name,
    
    -- Event details
    r.event_id,
    e.title AS event_title,
    e.slug AS event_slug,
    e.event_start,
    e.event_end,
    e.type AS event_type,
    
    -- Organisation details
    r.organisation_id,
    o.name AS organisation_name,
    o.abbreviation AS organisation_abbreviation,
    
    -- Count attendees
    (SELECT COUNT(*) 
     FROM attendees a 
     WHERE a.registration_id = r.registration_id) AS attendee_count,
    
    -- Count tickets
    (SELECT COUNT(*) 
     FROM tickets t 
     WHERE t.registration_id = r.registration_id) AS ticket_count,
    
    -- Sum ticket amounts
    (SELECT COALESCE(SUM(t.price_paid), 0) 
     FROM tickets t 
     WHERE t.registration_id = r.registration_id) AS total_ticket_amount,
    
    -- Get primary attendee info
    r.primary_attendee_id,
    pa.first_name AS primary_attendee_first_name,
    pa.last_name AS primary_attendee_last_name,
    pa.email AS primary_attendee_email,
    
    -- Count partners
    (SELECT COUNT(*) 
     FROM attendees a 
     WHERE a.registration_id = r.registration_id 
       AND a.is_partner IS NOT NULL) AS partner_count,
    
    -- List of ticket types purchased
    (SELECT ARRAY_AGG(DISTINCT et.name ORDER BY et.name) 
     FROM tickets t
     JOIN event_tickets et ON t.ticket_type_id = et.id
     WHERE t.registration_id = r.registration_id) AS ticket_types

FROM registrations r
LEFT JOIN contacts c ON r.contact_id = c.contact_id
LEFT JOIN events e ON r.event_id = e.event_id
LEFT JOIN organisations o ON r.organisation_id = o.organisation_id
LEFT JOIN attendees pa ON r.primary_attendee_id = pa.attendee_id;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_registration_price ON public.tickets USING btree (registration_id, price_paid);

-- Grant appropriate permissions
GRANT SELECT ON public.registration_detail_view TO authenticated;
GRANT SELECT ON public.registration_detail_view TO anon;