-- Migration: Add Event Registrations RPC Function
-- Description: RPC function to get detailed registration information for an event
-- Date: 2025-05-26

BEGIN;

-- RPC Function: Get event registrations with attendee details
CREATE OR REPLACE FUNCTION get_event_registrations(
    event_uuid UUID,
    search_term TEXT DEFAULT NULL,
    payment_status_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    registration_id TEXT,
    customer_id TEXT,
    customer_first_name TEXT,
    customer_last_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    payment_status TEXT,
    registration_status TEXT,
    registration_type TEXT,
    registration_date TIMESTAMP WITH TIME ZONE,
    total_amount_paid NUMERIC,
    total_price_paid NUMERIC,
    stripe_payment_intent_id TEXT,
    attendee_count BIGINT,
    attendees JSONB
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r."registrationId" as registration_id,
        r."customerId" as customer_id,
        COALESCE(c."firstName", c."billingFirstName", '') as customer_first_name,
        COALESCE(c."lastName", c."billingLastName", '') as customer_last_name,
        COALESCE(c.email, c."billingEmail", '') as customer_email,
        COALESCE(c.phone, c."billingPhone", '') as customer_phone,
        COALESCE(r."paymentStatus", 'pending') as payment_status,
        COALESCE(r.status, 'active') as registration_status,
        COALESCE(r."registrationType", 'individual') as registration_type,
        r."registrationDate"::TIMESTAMP WITH TIME ZONE as registration_date,
        r."totalAmountPaid" as total_amount_paid,
        r."totalPricePaid" as total_price_paid,
        r."stripePaymentIntentId" as stripe_payment_intent_id,
        COUNT(DISTINCT a.attendeeid) as attendee_count,
        COALESCE(
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'attendee_id', a.attendeeid,
                    'attendee_type', a.attendeetype,
                    'first_name', COALESCE(p.first_name, ''),
                    'last_name', COALESCE(p.last_name, ''),
                    'dietary_requirements', a.dietaryrequirements,
                    'special_needs', a.specialneeds,
                    'relationship', a.relationship,
                    'contact_preference', a.contactpreference
                ) 
                ORDER BY jsonb_build_object(
                    'attendee_id', a.attendeeid,
                    'attendee_type', a.attendeetype,
                    'first_name', COALESCE(p.first_name, ''),
                    'last_name', COALESCE(p.last_name, ''),
                    'dietary_requirements', a.dietaryrequirements,
                    'special_needs', a.specialneeds,
                    'relationship', a.relationship,
                    'contact_preference', a.contactpreference
                )
            ) FILTER (WHERE a.attendeeid IS NOT NULL),
            '[]'::jsonb
        ) as attendees
    FROM "Registrations" r
    LEFT JOIN "Customers" c ON r."customerId" = c.id
    LEFT JOIN "Attendees" a ON a.registrationid = r."registrationId"
    LEFT JOIN people p ON a.person_id = p.person_id
    WHERE r."eventId" = event_uuid::text
        AND (
            search_term IS NULL 
            OR search_term = ''
            OR LOWER(CONCAT(
                COALESCE(c."firstName", ''), ' ',
                COALESCE(c."lastName", ''), ' ',
                COALESCE(c.email, ''), ' ',
                COALESCE(p.first_name, ''), ' ',
                COALESCE(p.last_name, '')
            )) LIKE '%' || LOWER(search_term) || '%'
        )
        AND (
            payment_status_filter IS NULL 
            OR payment_status_filter = ''
            OR LOWER(COALESCE(r."paymentStatus", 'pending')) = LOWER(payment_status_filter)
        )
        AND r.status NOT IN ('cancelled', 'deleted')
    GROUP BY 
        r."registrationId", r."customerId", r."paymentStatus", r.status, 
        r."registrationType", r."registrationDate", r."totalAmountPaid", 
        r."totalPricePaid", r."stripePaymentIntentId",
        c."firstName", c."lastName", c.email, c.phone,
        c."billingFirstName", c."billingLastName", c."billingEmail", c."billingPhone"
    ORDER BY 
        CASE 
            WHEN r."registrationDate" IS NOT NULL THEN r."registrationDate"
            ELSE r."createdAt"
        END DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- RPC Function: Get event registration statistics
CREATE OR REPLACE FUNCTION get_event_registration_stats(event_uuid UUID)
RETURNS TABLE (
    total_registrations BIGINT,
    total_attendees BIGINT,
    paid_registrations BIGINT,
    pending_registrations BIGINT,
    total_revenue NUMERIC,
    average_order_value NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT r."registrationId") as total_registrations,
        COUNT(DISTINCT a.attendeeid) as total_attendees,
        COUNT(DISTINCT CASE WHEN LOWER(r."paymentStatus") = 'paid' THEN r."registrationId" END) as paid_registrations,
        COUNT(DISTINCT CASE WHEN LOWER(COALESCE(r."paymentStatus", 'pending')) != 'paid' THEN r."registrationId" END) as pending_registrations,
        COALESCE(SUM(r."totalAmountPaid"), 0) as total_revenue,
        CASE 
            WHEN COUNT(DISTINCT r."registrationId") > 0 
            THEN COALESCE(SUM(r."totalAmountPaid"), 0) / COUNT(DISTINCT r."registrationId")
            ELSE 0
        END as average_order_value
    FROM "Registrations" r
    LEFT JOIN "Attendees" a ON a.registrationid = r."registrationId"
    WHERE r."eventId" = event_uuid::text
        AND r.status NOT IN ('cancelled', 'deleted');
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_event_registrations(UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_registration_stats(UUID) TO authenticated;

COMMIT;