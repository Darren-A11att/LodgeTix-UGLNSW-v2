-- Recreate confirmation views after column type change

-- 1. Create base view
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
    
    -- Function details (all columns)
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
    
    -- Location details from function's location
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
    
    -- Booking contact details from registration_data
    r.registration_data->'billingDetails'->>'firstName' AS billing_first_name,
    r.registration_data->'billingDetails'->>'lastName' AS billing_last_name,
    r.registration_data->'billingDetails'->>'emailAddress' AS billing_email,
    r.registration_data->'billingDetails'->>'mobileNumber' AS billing_phone,
    r.registration_data->'billingDetails'->>'addressLine1' AS billing_street_address,
    r.registration_data->'billingDetails'->>'suburb' AS billing_city,
    r.registration_data->'billingDetails'->'stateTerritory'->>'name' AS billing_state,
    r.registration_data->'billingDetails'->>'postcode' AS billing_postal_code,
    r.registration_data->'billingDetails'->'country'->>'name' AS billing_country

FROM registrations r
LEFT JOIN functions f ON r.function_id = f.function_id
LEFT JOIN locations fl ON f.location_id = fl.location_id
LEFT JOIN customers c ON r.customer_id = c.customer_id

WHERE r.confirmation_number IS NOT NULL  -- Only show registrations with confirmation numbers
  AND (r.payment_status = 'completed' OR r.status = 'completed');

-- 2. Create individuals view
CREATE VIEW public.individuals_registration_confirmation_view AS
SELECT 
    b.*,
    
    -- Attendees array
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
                'relatedAttendeeId', a.related_attendee_id
            )
        ) FILTER (WHERE a.attendee_id IS NOT NULL),
        '[]'::jsonb
    ) AS attendees,
    
    -- Count of attendees
    COUNT(DISTINCT a.attendee_id) AS total_attendees,
    
    -- Tickets array (simplified without event_tickets join)
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'ticketId', t.ticket_id,
                'attendeeId', t.attendee_id,
                'ticketStatus', t.ticket_status,
                'ticketPrice', t.ticket_price
            )
        ) FILTER (WHERE t.ticket_id IS NOT NULL),
        '[]'::jsonb
    ) AS tickets,
    
    -- Count of tickets
    COUNT(DISTINCT t.ticket_id) AS total_tickets

FROM registration_confirmation_base_view b
LEFT JOIN attendees a ON b.registration_id = a.registration_id
LEFT JOIN tickets t ON b.registration_id = t.registration_id

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
    b.billing_first_name,
    b.billing_last_name,
    b.billing_email,
    b.billing_phone,
    b.billing_street_address,
    b.billing_city,
    b.billing_state,
    b.billing_postal_code,
    b.billing_country;

-- 3. Create lodge view
CREATE VIEW public.lodge_registration_confirmation_view AS
SELECT 
    b.*,
    
    -- Lodge details from registration_data
    b.registration_data->>'lodgeName' AS lodge_name,
    b.registration_data->>'lodgeNumber' AS lodge_number,
    b.registration_data->>'lodgeId' AS lodge_id,
    b.registration_data->>'grandLodgeId' AS grand_lodge_id,
    
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
            -- ORDER BY removed (not allowed with DISTINCT in aggregates)
        ) FILTER (WHERE a.attendee_id IS NOT NULL),
        '[]'::jsonb
    ) AS lodge_members,
    
    -- Count of lodge members
    COUNT(DISTINCT a.attendee_id) AS total_members,
    
    -- Tickets grouped by member (simplified)
    '[]'::jsonb AS member_tickets,
    
    -- All tickets array
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
    b.billing_first_name,
    b.billing_last_name,
    b.billing_email,
    b.billing_phone,
    b.billing_street_address,
    b.billing_city,
    b.billing_state,
    b.billing_postal_code,
    b.billing_country;

-- 4. Create delegation view
CREATE VIEW public.delegation_registration_confirmation_view AS
SELECT 
    b.*,
    
    -- Delegation details from registration_data
    b.registration_data->>'delegationName' AS delegation_name,
    b.registration_data->>'delegationType' AS delegation_type,
    b.registration_data->>'leadDelegateId' AS lead_delegate_id,
    
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
                    WHEN a.attendee_id::text = b.registration_data->>'leadDelegateId' 
                    THEN 'Lead Delegate'
                    ELSE 'Delegate'
                END
            )
            -- ORDER BY removed (not allowed with DISTINCT in aggregates)
        ) FILTER (WHERE a.attendee_id IS NOT NULL),
        '[]'::jsonb
    ) AS delegation_members,
    
    -- Count of delegation members
    COUNT(DISTINCT a.attendee_id) AS total_delegates,
    
    -- Tickets array (simplified without event_tickets join)
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'ticketId', t.ticket_id,
                'attendeeId', t.attendee_id,
                'ticketStatus', t.ticket_status,
                'ticketPrice', t.ticket_price
            )
        ) FILTER (WHERE t.ticket_id IS NOT NULL),
        '[]'::jsonb
    ) AS tickets,
    
    -- Count of tickets
    COUNT(DISTINCT t.ticket_id) AS total_tickets

FROM registration_confirmation_base_view b
LEFT JOIN attendees a ON b.registration_id = a.registration_id
LEFT JOIN tickets t ON b.registration_id = t.registration_id
-- Event tickets join removed (event_ticket_id column does not exist)

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