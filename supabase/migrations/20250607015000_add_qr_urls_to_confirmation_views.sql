-- Add qr_code_url fields to confirmation views

-- Drop and recreate individuals_registration_confirmation_view with qr_code_url
DROP VIEW IF EXISTS public.individuals_registration_confirmation_view CASCADE;

CREATE OR REPLACE VIEW public.individuals_registration_confirmation_view AS
SELECT 
    -- Registration core data
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
    
    -- Customer details
    c.first_name AS customer_first_name,
    c.last_name AS customer_last_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    
    -- Billing details from registration_data
    r.registration_data->'billingDetails'->>'firstName' AS billing_first_name,
    r.registration_data->'billingDetails'->>'lastName' AS billing_last_name,
    r.registration_data->'billingDetails'->>'emailAddress' AS billing_email,
    r.registration_data->'billingDetails'->>'mobileNumber' AS billing_phone,
    r.registration_data->'billingDetails'->>'addressLine1' AS billing_street_address,
    r.registration_data->'billingDetails'->>'suburb' AS billing_city,
    r.registration_data->'billingDetails'->'stateTerritory'->>'name' AS billing_state,
    r.registration_data->'billingDetails'->>'postcode' AS billing_postal_code,
    r.registration_data->'billingDetails'->'country'->>'name' AS billing_country,
    
    -- Attendees array with qr_code_url
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'attendee_id', a.attendee_id,
                'is_primary', a.is_primary,
                'attendee_type', a.attendee_type,
                'first_name', a.first_name,
                'last_name', a.last_name,
                'title', a.title,
                'suffix', a.suffix,
                'dietary_requirements', a.dietary_requirements,
                'special_needs', a.special_needs,
                'contact_preference', a.contact_preference,
                'email', a.email,
                'phone', a.phone,
                'related_attendee_id', a.related_attendee_id,
                'qr_code_url', a.qr_code_url,  -- Added QR code URL
                'tickets', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'ticket_id', t.ticket_id,
                            'package_id', t.package_id,
                            'ticket_status', t.ticket_status,
                            'ticket_price', t.ticket_price,
                            'price_paid', t.price_paid,
                            'event_title', e.title,
                            'event_date', e.event_start
                        )
                    )
                    FROM tickets t
                    LEFT JOIN events e ON t.event_id = e.event_id
                    WHERE t.attendee_id = a.attendee_id
                )
            )
        ) FILTER (WHERE a.attendee_id IS NOT NULL),
        '[]'::jsonb
    ) AS attendees,
    
    -- Count of attendees
    COUNT(DISTINCT a.attendee_id) AS total_attendees,
    
    -- Tickets array with qr_code_url
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'ticket_id', t.ticket_id,
                'attendee_id', t.attendee_id,
                'package_id', t.package_id,
                'ticket_status', t.ticket_status,
                'ticket_price', t.ticket_price,
                'price_paid', t.price_paid,
                'qr_code_url', t.qr_code_url,  -- Added QR code URL
                'event_title', e.title,
                'event_date', e.event_start
            )
        ) FILTER (WHERE t.ticket_id IS NOT NULL),
        '[]'::jsonb
    ) AS tickets,
    
    -- Count of tickets
    COUNT(DISTINCT t.ticket_id) AS total_tickets

FROM registrations r
LEFT JOIN functions f ON r.function_id = f.function_id
LEFT JOIN customers c ON r.customer_id = c.customer_id
LEFT JOIN attendees a ON r.registration_id = a.registration_id
LEFT JOIN tickets t ON r.registration_id = t.registration_id
LEFT JOIN events e ON t.event_id = e.event_id

WHERE r.registration_type = 'individuals'
  AND r.confirmation_number IS NOT NULL

GROUP BY 
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
    r.created_at,
    r.updated_at,
    f.name,
    f.slug,
    f.description,
    f.image_url,
    f.start_date,
    f.end_date,
    f.location_id,
    f.organiser_id,
    f.metadata,
    f.is_published,
    f.created_at,
    f.updated_at,
    f.function_events,
    c.first_name,
    c.last_name,
    c.email,
    c.phone;

-- Grant access to the view
GRANT SELECT ON public.individuals_registration_confirmation_view TO anon, authenticated;

-- Drop and recreate lodge_registration_confirmation_view with qr_code_url
DROP VIEW IF EXISTS public.lodge_registration_confirmation_view CASCADE;

CREATE OR REPLACE VIEW public.lodge_registration_confirmation_view AS
SELECT 
    -- Registration core data
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
    
    -- Customer details (lodge secretary)
    c.first_name AS customer_first_name,
    c.last_name AS customer_last_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    
    -- Lodge details from registration_data
    r.registration_data->'lodge_details'->>'lodgeName' AS lodge_name,
    r.registration_data->'lodge_details'->>'lodgeNumber' AS lodge_number,
    r.registration_data->'lodge_details'->>'lodgeId' AS lodge_id,
    r.registration_data->'lodge_details'->>'grandLodgeId' AS grand_lodge_id,
    
    -- Billing details
    r.registration_data->'billingDetails'->>'firstName' AS billing_first_name,
    r.registration_data->'billingDetails'->>'lastName' AS billing_last_name,
    r.registration_data->'billingDetails'->>'emailAddress' AS billing_email,
    r.registration_data->'billingDetails'->>'mobileNumber' AS billing_phone,
    r.registration_data->'billingDetails'->>'addressLine1' AS billing_street_address,
    r.registration_data->'billingDetails'->>'suburb' AS billing_city,
    r.registration_data->'billingDetails'->'stateTerritory'->>'name' AS billing_state,
    r.registration_data->'billingDetails'->>'postcode' AS billing_postal_code,
    r.registration_data->'billingDetails'->'country'->>'name' AS billing_country,
    
    -- Lodge members from registration_data
    r.registration_data->'lodge_members' AS lodge_members,
    r.registration_data->'table_count' AS table_count,
    
    -- Count total members
    COALESCE(
        (r.registration_data->>'totalMembers')::integer,
        COALESCE(jsonb_array_length(r.registration_data->'lodge_members'), 0)
    ) AS total_members,
    
    -- Tickets array with qr_code_url (for lodge bulk tickets)
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'ticket_id', t.ticket_id,
                'package_id', t.package_id,
                'ticket_status', t.ticket_status,
                'ticket_price', t.ticket_price,
                'price_paid', t.price_paid,
                'qr_code_url', t.qr_code_url,  -- Added QR code URL
                'event_title', e.title,
                'event_date', e.event_start
            )
        ) FILTER (WHERE t.ticket_id IS NOT NULL),
        '[]'::jsonb
    ) AS tickets,
    
    -- Member tickets array from registration_data
    r.registration_data->'memberTickets' AS member_tickets,
    
    -- Packages summary
    r.registration_data->'packages' AS packages_summary,
    
    -- Count of tickets
    COUNT(DISTINCT t.ticket_id) AS total_tickets

FROM registrations r
LEFT JOIN functions f ON r.function_id = f.function_id
LEFT JOIN customers c ON r.customer_id = c.customer_id
LEFT JOIN tickets t ON r.registration_id = t.registration_id
LEFT JOIN events e ON t.event_id = e.event_id

WHERE r.registration_type = 'lodge'
  AND r.confirmation_number IS NOT NULL

GROUP BY 
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
    r.created_at,
    r.updated_at,
    f.name,
    f.slug,
    f.description,
    f.image_url,
    f.start_date,
    f.end_date,
    f.location_id,
    f.organiser_id,
    f.metadata,
    f.is_published,
    f.created_at,
    f.updated_at,
    f.function_events,
    c.first_name,
    c.last_name,
    c.email,
    c.phone;

-- Grant access to the view
GRANT SELECT ON public.lodge_registration_confirmation_view TO anon, authenticated;

-- Add comments
COMMENT ON VIEW public.individuals_registration_confirmation_view IS 
'Comprehensive view for fetching individual registration details by confirmation number, including QR code URLs';

COMMENT ON VIEW public.lodge_registration_confirmation_view IS 
'Comprehensive view for fetching lodge registration details by confirmation number, including QR code URLs for tickets';