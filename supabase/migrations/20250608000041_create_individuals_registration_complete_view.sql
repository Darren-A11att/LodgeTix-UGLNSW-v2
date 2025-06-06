-- Create the missing individuals_registration_complete_view
-- This view provides comprehensive information about individual registrations including attendees, contacts, and tickets

CREATE OR REPLACE VIEW public.individuals_registration_complete_view AS
SELECT 
    -- Registration details
    r.registration_id,
    r.confirmation_number,
    r.customer_id,
    r.auth_user_id,
    r.function_id,
    r.registration_type,
    r.payment_status,
    r.status AS registration_status,
    r.total_amount_paid,
    r.subtotal,
    r.stripe_fee,
    r.stripe_payment_intent_id,
    r.created_at AS registration_created_at,
    r.updated_at AS registration_updated_at,
    r.created_at AS registration_date,
    
    -- Function details
    f.name AS function_name,
    f.slug AS function_slug,
    f.start_date AS function_start_date,
    f.end_date AS function_end_date,
    
    -- Customer details
    c.first_name AS customer_first_name,
    c.last_name AS customer_last_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    c.business_name AS customer_business_name,
    c.customer_type,
    
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
    r.registration_data->'billingDetails'->>'organisationName' AS billing_organisation_name,
    
    -- Booking contact placeholders (not implemented in current schema)
    NULL::uuid AS booking_contact_id,
    NULL::text AS booking_first_name,
    NULL::text AS booking_last_name,
    NULL::text AS booking_email,
    NULL::text AS booking_phone,
    NULL::uuid AS booking_auth_user_id,
    
    -- Registration flags
    (r.registration_data->>'agreeToTerms')::boolean AS agree_to_terms,
    COALESCE((r.registration_data->>'includesProcessingFee')::boolean, false) AS includes_processing_fee,
    
    -- Primary attendee ID (first attendee marked as primary)
    (
        SELECT a.attendee_id 
        FROM attendees a 
        WHERE a.registration_id = r.registration_id 
        AND a.is_primary = true 
        LIMIT 1
    ) AS primary_attendee_id,
    
    -- Attendees array
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
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
                    'email', a.email,
                    'phone', a.phone,
                    'relatedAttendeeId', a.related_attendee_id
                )
            )
            FROM attendees a
            WHERE a.registration_id = r.registration_id
        ),
        '[]'::jsonb
    ) AS attendees,
    
    -- Attendee counts
    (
        SELECT COUNT(*)
        FROM attendees a
        WHERE a.registration_id = r.registration_id
    ) AS total_attendees,
    
    (
        SELECT COUNT(*)
        FROM attendees a
        WHERE a.registration_id = r.registration_id
        AND a.attendee_type = 'mason'
    ) AS total_masons,
    
    (
        SELECT COUNT(*)
        FROM attendees a
        WHERE a.registration_id = r.registration_id
        AND a.attendee_type = 'guest'
    ) AS total_guests,
    
    -- Contact counts (attendees create contacts)
    (
        SELECT COUNT(DISTINCT co.contact_id)
        FROM attendees a
        LEFT JOIN contacts co ON a.contact_id = co.contact_id
        WHERE a.registration_id = r.registration_id
        AND co.contact_id IS NOT NULL
    ) AS total_contacts_created,
    
    -- Masonic profile counts
    (
        SELECT COUNT(DISTINCT mp.masonic_profile_id)
        FROM attendees a
        LEFT JOIN contacts co ON a.contact_id = co.contact_id
        LEFT JOIN masonic_profiles mp ON co.contact_id = mp.contact_id
        WHERE a.registration_id = r.registration_id
        AND mp.masonic_profile_id IS NOT NULL
    ) AS total_masonic_profiles,
    
    -- Ticket counts and totals
    (
        SELECT COUNT(*)
        FROM tickets t
        WHERE t.registration_id = r.registration_id
    ) AS total_tickets,
    
    (
        SELECT COUNT(*)
        FROM tickets t
        WHERE t.registration_id = r.registration_id
        AND t.ticket_status = 'sold'
    ) AS total_sold_tickets,
    
    (
        SELECT COUNT(*)
        FROM tickets t
        WHERE t.registration_id = r.registration_id
        AND t.ticket_status = 'reserved'
    ) AS total_reserved_tickets,
    
    (
        SELECT COALESCE(SUM(t.ticket_price), 0)
        FROM tickets t
        WHERE t.registration_id = r.registration_id
    ) AS total_price_paid

FROM registrations r
LEFT JOIN functions f ON r.function_id = f.function_id
LEFT JOIN customers c ON r.customer_id = c.customer_id

WHERE r.registration_type = 'individuals';

-- Grant access to the view
GRANT SELECT ON public.individuals_registration_complete_view TO anon, authenticated, service_role;

-- Add comment
COMMENT ON VIEW public.individuals_registration_complete_view IS 
'Comprehensive view of individual registrations with all attendee, contact, and ticket details';