-- Create attendee_complete_view
-- Purpose: Full attendee information including masonic details
CREATE OR REPLACE VIEW public.attendee_complete_view AS
SELECT 
    a.attendee_id,
    a.registration_id,
    a.attendee_type,
    a.dietary_requirements,
    a.special_needs,
    a.contact_preference,
    a.created_at,
    a.updated_at,
    a.is_primary,
    a.has_partner,
    
    -- Basic attendee info
    a.title,
    a.first_name,
    a.last_name,
    a.suffix,
    a.email,
    a.phone,
    COALESCE(a.first_name || ' ' || a.last_name, a.email) AS full_name,
    
    -- Contact details
    a.contact_id,
    c.address_line_1 AS contact_address_line_1,
    c.address_line_2 AS contact_address_line_2,
    c.suburb_city AS contact_city,
    c.state AS contact_state,
    c.postcode AS contact_postcode,
    c.country AS contact_country,
    
    -- Partner relationship
    a.related_attendee_id,
    a.relationship,
    a.is_partner,
    ra.first_name AS partner_first_name,
    ra.last_name AS partner_last_name,
    COALESCE(ra.first_name || ' ' || ra.last_name, ra.email) AS partner_full_name,
    
    -- Masonic profile information
    mp.masonic_profile_id,
    mp.masonic_title,
    mp.rank,
    mp.grand_rank,
    mp.grand_officer,
    mp.grand_office,
    
    -- Lodge information
    mp.lodge_id,
    lo.name AS lodge_name,
    lo.abbreviation AS lodge_abbreviation,
    l.number AS lodge_number,
    lo.type AS lodge_type,
    
    -- Grand Lodge information
    mp.grand_lodge_id,
    glo.name AS grand_lodge_name,
    glo.abbreviation AS grand_lodge_abbreviation,
    
    -- Registration information
    r.event_id,
    r.registration_type,
    r.confirmation_number,
    r.payment_status,
    
    -- Event information
    e.title AS event_title,
    e.slug AS event_slug,
    e.event_start,
    e.event_end,
    
    -- Tickets for this attendee
    (SELECT COUNT(*) 
     FROM tickets t 
     WHERE t.attendee_id = a.attendee_id) AS ticket_count,
    
    -- Ticket details
    (SELECT ARRAY_AGG(
        jsonb_build_object(
            'ticket_id', t.ticket_id,
            'event_id', t.event_id,
            'ticket_type_name', et.name,
            'price_paid', t.price_paid,
            'status', t.status,
            'is_partner_ticket', t.is_partner_ticket
        ) ORDER BY et.name
    )
     FROM tickets t
     LEFT JOIN event_tickets et ON t.ticket_type_id = et.id
     WHERE t.attendee_id = a.attendee_id) AS tickets,
    
    -- Check if attendee has checked in
    EXISTS (
        SELECT 1 
        FROM tickets t 
        WHERE t.attendee_id = a.attendee_id 
          AND t.checked_in_at IS NOT NULL
    ) AS has_checked_in

FROM attendees a
LEFT JOIN contacts c ON a.contact_id = c.contact_id
LEFT JOIN attendees ra ON a.related_attendee_id = ra.attendee_id
LEFT JOIN masonic_profiles mp ON c.contact_id = mp.contact_id
LEFT JOIN organisations lo ON mp.lodge_id = lo.organisation_id
LEFT JOIN lodges l ON lo.organisation_id = l.organisation_id
LEFT JOIN organisations glo ON mp.grand_lodge_id = glo.organisation_id
LEFT JOIN registrations r ON a.registration_id = r.registration_id
LEFT JOIN events e ON r.event_id = e.event_id;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendees_is_primary ON public.attendees USING btree (is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_masonic_profiles_contact_id ON public.masonic_profiles USING btree (contact_id);

-- Grant appropriate permissions
GRANT SELECT ON public.attendee_complete_view TO authenticated;
GRANT SELECT ON public.attendee_complete_view TO anon;