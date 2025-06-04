-- Create a comprehensive view for lodge registrations
CREATE OR REPLACE VIEW public.lodge_registration_complete_view AS
SELECT 
    -- Registration details
    r.registration_id,
    r.confirmation_number,
    r.function_id,
    r.customer_id,
    r.auth_user_id,
    r.organisation_id,
    r.registration_type,
    r.status,
    r.payment_status,
    r.stripe_payment_intent_id,
    r.registration_date,
    r.payment_completed_at,
    r.agree_to_terms,
    r.total_amount_paid,
    r.total_price_paid,
    r.subtotal,
    r.stripe_fee,
    r.includes_processing_fee,
    r.registration_data,
    r.metadata,
    r.created_at,
    r.updated_at,
    
    -- Lodge details from columns (with fallback to registration_data)
    COALESCE(
        r.organisation_name,
        (r.registration_data->0->>'lodge_name')::TEXT
    ) AS organisation_name,
    COALESCE(
        r.organisation_number,
        (r.registration_data->0->>'lodge_number')::TEXT
    ) AS organisation_number,
    COALESCE(
        r.primary_attendee,
        (r.registration_data->0->>'primary_attendee_name')::TEXT
    ) AS primary_attendee,
    COALESCE(
        r.attendee_count,
        (r.registration_data->0->>'total_attendees')::INTEGER
    ) AS attendee_count,
    
    -- Customer (booking contact) details
    c.email AS customer_email,
    c.first_name AS customer_first_name,
    c.last_name AS customer_last_name,
    c.phone AS customer_phone,
    c.business_name AS customer_business_name,
    c.address_line1 AS customer_address_line1,
    c.address_line2 AS customer_address_line2,
    c.city AS customer_city,
    c.state AS customer_state,
    c.postal_code AS customer_postal_code,
    c.country AS customer_country,
    c.billing_organisation_name,
    c.billing_email,
    c.billing_phone,
    c.billing_street_address,
    c.billing_city,
    c.billing_state,
    c.billing_postal_code,
    c.billing_country,
    c.customer_type,
    
    -- Function details
    f.name AS function_name,
    f.slug AS function_slug,
    f.start_date AS function_start_date,
    f.end_date AS function_end_date,
    
    -- Package details (extracted from registration_data)
    (r.registration_data->0->>'package_id')::UUID AS package_id,
    (r.registration_data->0->>'package_name')::TEXT AS package_name,
    (r.registration_data->0->>'package_price')::NUMERIC AS package_price,
    (r.registration_data->0->>'table_count')::INTEGER AS table_count,
    
    -- Lodge details (extracted from registration_data)
    r.registration_data->0->'lodge_details' AS lodge_details,
    (r.registration_data->0->'lodge_details'->>'lodgeName')::TEXT AS lodge_name,
    (r.registration_data->0->'lodge_details'->>'lodgeNumber')::TEXT AS lodge_number,
    (r.registration_data->0->'lodge_details'->>'lodge_id')::UUID AS lodge_id,
    (r.registration_data->0->'lodge_details'->>'grand_lodge_id')::UUID AS grand_lodge_id,
    
    -- Calculated fields
    CASE 
        WHEN r.payment_status = 'completed' OR r.payment_status = 'paid' THEN true
        ELSE false
    END AS is_paid,
    
    -- Additional metadata
    r.metadata->>'createdVia' AS created_via,
    r.metadata->>'agreeToTerms' AS agree_to_terms_metadata

FROM registrations r
LEFT JOIN customers c ON c.customer_id = r.customer_id
LEFT JOIN functions f ON f.function_id = r.function_id
WHERE r.registration_type = 'lodge';

-- Grant access to the view
GRANT SELECT ON public.lodge_registration_complete_view TO authenticated;
GRANT SELECT ON public.lodge_registration_complete_view TO service_role;

-- Add helpful comment
COMMENT ON VIEW public.lodge_registration_complete_view IS 'Comprehensive view of lodge registrations with customer, function, and lodge details';