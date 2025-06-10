-- Add organiser information to confirmation views
-- This migration updates the base view to include organiser details

-- Drop existing views to recreate with organiser information
DROP VIEW IF EXISTS public.individuals_registration_confirmation_view CASCADE;
DROP VIEW IF EXISTS public.lodge_registration_confirmation_view CASCADE;
DROP VIEW IF EXISTS public.delegation_registration_confirmation_view CASCADE;
DROP VIEW IF EXISTS public.registration_confirmation_base_view CASCADE;

-- 1. Recreate base view with organiser details
CREATE VIEW public.registration_confirmation_base_view AS
SELECT 
    r.registration_id,
    r.confirmation_number,
    r.customer_id,
    r.auth_user_id,
    r.function_id,
    r.registration_type,
    r.payment_status,
    r.status,
    r.total_amount_paid,
    r.subtotal,
    r.stripe_fee,
    r.stripe_payment_intent_id,
    r.registration_data,
    r.created_at AS registration_created_at,
    r.updated_at AS registration_updated_at,
    
    -- Function details
    f.name AS function_name,
    f.slug AS function_slug,
    f.description AS function_description,
    f.image_url AS function_image_url,
    f.start_date AS function_start_date,
    f.end_date AS function_end_date,
    f.location_id AS function_location_id,
    f.organiser_id AS function_organiser_id,
    f.metadata AS function_metadata,
    f.is_published AS function_is_published,
    f.created_at AS function_created_at,
    f.updated_at AS function_updated_at,
    f.function_events,
    
    -- Organiser details
    fo.name AS organiser_name,
    fo.website AS organiser_website,
    fo.known_as AS organiser_known_as,
    fo.abbreviation AS organiser_abbreviation,
    
    -- Location details
    fl.place_name AS function_location_name,
    fl.street_address AS function_location_address,
    fl.suburb AS function_location_city,
    fl.state AS function_location_state,
    fl.country AS function_location_country,
    fl.postal_code AS function_location_postal_code,
    fl.latitude AS function_location_latitude,
    fl.longitude AS function_location_longitude,
    
    -- Customer details
    c.first_name AS customer_first_name,
    c.last_name AS customer_last_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    c.business_name AS customer_business_name,
    
    -- Booking contact from actual columns (if we have a booking_contacts table)
    -- For now, use customer data as fallback
    c.first_name AS billing_first_name,
    c.last_name AS billing_last_name,
    c.email AS billing_email,
    c.phone AS billing_phone,
    c.address_line1 AS billing_street_address,
    c.city AS billing_city,
    c.state AS billing_state,
    c.postal_code AS billing_postal_code,
    c.country AS billing_country

FROM registrations r
LEFT JOIN functions f ON r.function_id = f.function_id
LEFT JOIN organisations fo ON f.organiser_id = fo.organisation_id
LEFT JOIN locations fl ON f.location_id = fl.location_id
LEFT JOIN customers c ON r.customer_id = c.customer_id

WHERE r.confirmation_number IS NOT NULL
  AND (r.payment_status = 'completed' OR r.status = 'completed');

-- 2. Recreate individuals view with enhanced ticket data
CREATE VIEW public.individuals_registration_confirmation_view AS
SELECT 
    b.*,
    
    -- Attendees with all their actual data
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'attendeeId', a.attendee_id,
                'isPrimary', a.is_primary,
                'attendeeType', a.attendee_type,
                'firstName', a.first_name,
                'lastName', a.last_name,
                'title', a.title,
                'suffix', a.suffix,
                'dietaryRequirements', a.dietary_requirements,
                'specialNeeds', a.special_needs,
                'contactPreference', a.contact_preference,
                'primaryEmail', a.email,
                'primaryPhone', a.phone,
                'relatedAttendeeId', a.related_attendee_id,
                -- Add masonic profile data if attendee is a mason
                'grandLodgeId', mp.grand_lodge_id,
                'lodgeId', mp.lodge_id,
                'rank', mp.rank,
                'grandRank', mp.grand_rank,
                'masonicTitle', mp.masonic_title
            )
        ) FILTER (WHERE a.attendee_id IS NOT NULL),
        '[]'::jsonb
    ) AS attendees,
    
    -- Count of attendees
    COUNT(DISTINCT a.attendee_id) AS total_attendees,
    
    -- Tickets with names from event_tickets table
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'ticketId', t.ticket_id,
                'attendeeId', t.attendee_id,
                'ticketName', COALESCE(et.name, p.name, 'Event Ticket'),
                'ticketDescription', COALESCE(et.description, p.description),
                'ticketPrice', t.ticket_price,
                'ticketStatus', t.ticket_status,
                'eventId', t.event_id,
                'packageId', t.package_id,
                'isFromPackage', CASE WHEN t.package_id IS NOT NULL THEN true ELSE false END
            )
        ) FILTER (WHERE t.ticket_id IS NOT NULL),
        '[]'::jsonb
    ) AS tickets,
    
    -- Count of tickets
    COUNT(DISTINCT t.ticket_id) AS total_tickets

FROM registration_confirmation_base_view b
LEFT JOIN attendees a ON b.registration_id = a.registration_id
LEFT JOIN contacts co ON a.contact_id = co.contact_id
LEFT JOIN masonic_profiles mp ON co.contact_id = mp.contact_id
LEFT JOIN tickets t ON b.registration_id = t.registration_id
LEFT JOIN event_tickets et ON t.ticket_type_id = et.event_ticket_id
LEFT JOIN packages p ON t.package_id = p.package_id

WHERE b.registration_type = 'individuals'

GROUP BY 
    b.registration_id,
    b.confirmation_number,
    b.customer_id,
    b.auth_user_id,
    b.function_id,
    b.registration_type,
    b.payment_status,
    b.status,
    b.total_amount_paid,
    b.subtotal,
    b.stripe_fee,
    b.stripe_payment_intent_id,
    b.registration_data,
    b.registration_created_at,
    b.registration_updated_at,
    b.function_name,
    b.function_slug,
    b.function_description,
    b.function_image_url,
    b.function_start_date,
    b.function_end_date,
    b.function_location_id,
    b.function_organiser_id,
    b.function_metadata,
    b.function_is_published,
    b.function_created_at,
    b.function_updated_at,
    b.function_events,
    b.organiser_name,
    b.organiser_website,
    b.organiser_known_as,
    b.organiser_abbreviation,
    b.function_location_name,
    b.function_location_address,
    b.function_location_city,
    b.function_location_state,
    b.function_location_country,
    b.function_location_postal_code,
    b.function_location_latitude,
    b.function_location_longitude,
    b.customer_first_name,
    b.customer_last_name,
    b.customer_email,
    b.customer_phone,
    b.customer_business_name,
    b.billing_first_name,
    b.billing_last_name,
    b.billing_email,
    b.billing_phone,
    b.billing_street_address,
    b.billing_city,
    b.billing_state,
    b.billing_postal_code,
    b.billing_country;

-- 3. Recreate lodge view with organiser data
CREATE VIEW public.lodge_registration_confirmation_view AS
SELECT 
    b.*,
    
    -- Lodge details from lodges table
    l.name AS lodge_name,
    l.number AS lodge_number,
    l.lodge_id,
    gl.organisation_id AS grand_lodge_id,
    gl.name AS grand_lodge_name,
    
    -- Lodge members (attendees)
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'attendeeId', a.attendee_id,
                'isPrimary', a.is_primary,
                'attendeeType', a.attendee_type,
                'firstName', a.first_name,
                'lastName', a.last_name,
                'title', a.title,
                'suffix', a.suffix,
                'dietaryRequirements', a.dietary_requirements,
                'specialNeeds', a.special_needs,
                'contactPreference', a.contact_preference,
                'primaryEmail', a.email,
                'primaryPhone', a.phone
            )
        ) FILTER (WHERE a.attendee_id IS NOT NULL),
        '[]'::jsonb
    ) AS lodge_members,
    
    -- Count of lodge members
    COUNT(DISTINCT a.attendee_id) AS total_members,
    
    -- Tickets with proper data
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'ticketId', t.ticket_id,
                'attendeeId', t.attendee_id,
                'packageId', t.package_id,
                'ticketStatus', t.ticket_status,
                'ticketPrice', t.ticket_price,
                'packageName', p.name,
                'packageDescription', p.description
            )
        ) FILTER (WHERE t.ticket_id IS NOT NULL),
        '[]'::jsonb
    ) AS tickets,
    
    -- Count of tickets
    COUNT(DISTINCT t.ticket_id) AS total_tickets,
    
    -- Packages summary
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'packageId', p.package_id,
                'packageName', p.name,
                'packagePrice', p.package_price,
                'packageDescription', p.description,
                'ticketCount', (
                    SELECT COUNT(*) 
                    FROM tickets t2 
                    WHERE t2.package_id = p.package_id 
                    AND t2.registration_id = b.registration_id
                )
            )
        ) FILTER (WHERE p.package_id IS NOT NULL),
        '[]'::jsonb
    ) AS packages

FROM registration_confirmation_base_view b
LEFT JOIN customers lc ON b.customer_id = lc.customer_id AND lc.customer_type::text = 'lodge'
LEFT JOIN lodges l ON lc.organisation_id = l.lodge_id
LEFT JOIN organisations gl ON l.grand_lodge_id = gl.organisation_id
LEFT JOIN attendees a ON b.registration_id = a.registration_id
LEFT JOIN tickets t ON b.registration_id = t.registration_id
LEFT JOIN packages p ON t.package_id = p.package_id

WHERE b.registration_type = 'lodge'

GROUP BY 
    b.registration_id,
    b.confirmation_number,
    b.customer_id,
    b.auth_user_id,
    b.function_id,
    b.registration_type,
    b.payment_status,
    b.status,
    b.total_amount_paid,
    b.subtotal,
    b.stripe_fee,
    b.stripe_payment_intent_id,
    b.registration_data,
    b.registration_created_at,
    b.registration_updated_at,
    b.function_name,
    b.function_slug,
    b.function_description,
    b.function_image_url,
    b.function_start_date,
    b.function_end_date,
    b.function_location_id,
    b.function_organiser_id,
    b.function_metadata,
    b.function_is_published,
    b.function_created_at,
    b.function_updated_at,
    b.function_events,
    b.organiser_name,
    b.organiser_website,
    b.organiser_known_as,
    b.organiser_abbreviation,
    b.function_location_name,
    b.function_location_address,
    b.function_location_city,
    b.function_location_state,
    b.function_location_country,
    b.function_location_postal_code,
    b.function_location_latitude,
    b.function_location_longitude,
    b.customer_first_name,
    b.customer_last_name,
    b.customer_email,
    b.customer_phone,
    b.customer_business_name,
    b.billing_first_name,
    b.billing_last_name,
    b.billing_email,
    b.billing_phone,
    b.billing_street_address,
    b.billing_city,
    b.billing_state,
    b.billing_postal_code,
    b.billing_country,
    l.lodge_id,
    l.name,
    l.number,
    gl.organisation_id,
    gl.name;

-- 4. Recreate delegation view with organiser data
CREATE VIEW public.delegation_registration_confirmation_view AS
SELECT 
    b.*,
    
    -- Delegation details
    'Grand Lodge Delegation' AS delegation_name,
    b.registration_type AS delegation_type,
    (
        SELECT a.attendee_id 
        FROM attendees a 
        WHERE a.registration_id = b.registration_id 
        AND a.is_primary = true 
        LIMIT 1
    ) AS lead_delegate_id,
    
    -- Delegation members (attendees)
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'attendeeId', a.attendee_id,
                'isPrimary', a.is_primary,
                'attendeeType', a.attendee_type,
                'firstName', a.first_name,
                'lastName', a.last_name,
                'title', a.title,
                'suffix', a.suffix,
                'dietaryRequirements', a.dietary_requirements,
                'specialNeeds', a.special_needs,
                'contactPreference', a.contact_preference,
                'primaryEmail', a.email,
                'primaryPhone', a.phone,
                'delegateRole', 
                CASE 
                    WHEN a.is_primary = true
                    THEN 'Lead Delegate'
                    ELSE 'Delegate'
                END
            )
        ) FILTER (WHERE a.attendee_id IS NOT NULL),
        '[]'::jsonb
    ) AS delegation_members,
    
    -- Count of delegation members
    COUNT(DISTINCT a.attendee_id) AS total_delegates,
    
    -- Tickets with proper data
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'ticketId', t.ticket_id,
                'attendeeId', t.attendee_id,
                'ticketName', COALESCE(et.name, 'Event Ticket'),
                'ticketDescription', et.description,
                'ticketPrice', t.ticket_price,
                'ticketStatus', t.ticket_status,
                'eventId', t.event_id
            )
        ) FILTER (WHERE t.ticket_id IS NOT NULL),
        '[]'::jsonb
    ) AS tickets,
    
    -- Count of tickets
    COUNT(DISTINCT t.ticket_id) AS total_tickets

FROM registration_confirmation_base_view b
LEFT JOIN attendees a ON b.registration_id = a.registration_id
LEFT JOIN tickets t ON b.registration_id = t.registration_id
LEFT JOIN event_tickets et ON t.ticket_type_id = et.event_ticket_id

WHERE b.registration_type = 'delegation'

GROUP BY 
    b.registration_id,
    b.confirmation_number,
    b.customer_id,
    b.auth_user_id,
    b.function_id,
    b.registration_type,
    b.payment_status,
    b.status,
    b.total_amount_paid,
    b.subtotal,
    b.stripe_fee,
    b.stripe_payment_intent_id,
    b.registration_data,
    b.registration_created_at,
    b.registration_updated_at,
    b.function_name,
    b.function_slug,
    b.function_description,
    b.function_image_url,
    b.function_start_date,
    b.function_end_date,
    b.function_location_id,
    b.function_organiser_id,
    b.function_metadata,
    b.function_is_published,
    b.function_created_at,
    b.function_updated_at,
    b.function_events,
    b.organiser_name,
    b.organiser_website,
    b.organiser_known_as,
    b.organiser_abbreviation,
    b.function_location_name,
    b.function_location_address,
    b.function_location_city,
    b.function_location_state,
    b.function_location_country,
    b.function_location_postal_code,
    b.function_location_latitude,
    b.function_location_longitude,
    b.customer_first_name,
    b.customer_last_name,
    b.customer_email,
    b.customer_phone,
    b.customer_business_name,
    b.billing_first_name,
    b.billing_last_name,
    b.billing_email,
    b.billing_phone,
    b.billing_street_address,
    b.billing_city,
    b.billing_state,
    b.billing_postal_code,
    b.billing_country;

-- Grant permissions
GRANT SELECT ON registration_confirmation_base_view TO authenticated, anon, service_role;
GRANT SELECT ON individuals_registration_confirmation_view TO authenticated, anon, service_role;
GRANT SELECT ON lodge_registration_confirmation_view TO authenticated, anon, service_role;
GRANT SELECT ON delegation_registration_confirmation_view TO authenticated, anon, service_role;

-- Add comments
COMMENT ON VIEW individuals_registration_confirmation_view IS 'Confirmation view for individual registrations with complete attendee and ticket data including organiser information';
COMMENT ON VIEW lodge_registration_confirmation_view IS 'Confirmation view for lodge registrations with complete member and package data including organiser information';
COMMENT ON VIEW delegation_registration_confirmation_view IS 'Confirmation view for delegation registrations with complete delegate and ticket data including organiser information';