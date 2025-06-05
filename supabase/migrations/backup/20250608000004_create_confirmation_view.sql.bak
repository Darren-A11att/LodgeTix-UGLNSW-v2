-- Create a comprehensive view for fetching registration details by confirmation number
-- This view will be used by the confirmation page to display all registration data

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
    r.registration_data->'billingDetails'->'country'->>'name' AS billing_country,
    
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
    
    -- Tickets array (simplified without event details for now)
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'ticketId', t.ticket_id,
                'attendeeId', t.attendee_id,
                'ticketStatus', t.ticket_status,
                'ticketPrice', t.ticket_price,
                'packageId', t.package_id
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
LEFT JOIN public.tickets t ON r.registration_id = t.registration_id

WHERE r.registration_type = 'individuals'
  AND r.confirmation_number IS NOT NULL  -- Only show registrations with confirmation numbers

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
    c.phone,
    r.registration_data->'billingDetails'->>'firstName',
    r.registration_data->'billingDetails'->>'lastName',
    r.registration_data->'billingDetails'->>'emailAddress',
    r.registration_data->'billingDetails'->>'mobileNumber',
    r.registration_data->'billingDetails'->>'addressLine1',
    r.registration_data->'billingDetails'->>'suburb',
    r.registration_data->'billingDetails'->'stateTerritory'->>'name',
    r.registration_data->'billingDetails'->>'postcode',
    r.registration_data->'billingDetails'->'country'->>'name';

-- Create index on confirmation_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_registrations_confirmation_number 
ON registrations(confirmation_number) 
WHERE confirmation_number IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.individuals_registration_confirmation_view TO anon, authenticated;

-- Add comment
COMMENT ON VIEW public.individuals_registration_confirmation_view IS 
'Comprehensive view for fetching individual registration details by confirmation number, including all related data';