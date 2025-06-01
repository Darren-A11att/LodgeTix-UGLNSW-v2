-- Create RPC function: get_registration_summary
-- Purpose: Get complete registration data for review/confirmation

CREATE OR REPLACE FUNCTION public.get_registration_summary(
    p_registration_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Input validation
    IF p_registration_id IS NULL THEN
        RAISE EXCEPTION 'Registration ID is required';
    END IF;

    -- Build comprehensive registration summary
    SELECT json_build_object(
        'registration', json_build_object(
            'registration_id', r.registration_id,
            'confirmation_number', r.confirmation_number,
            'registration_date', r.registration_date,
            'status', r.status,
            'payment_status', r.payment_status,
            'registration_type', r.registration_type,
            'total_amount_paid', r.total_amount_paid,
            'agree_to_terms', r.agree_to_terms,
            'created_at', r.created_at
        ),
        'customer', json_build_object(
            'contact_id', r.contact_id,
            'name', r.customer_name,
            'email', r.customer_email,
            'phone', r.customer_phone,
            'first_name', r.customer_first_name,
            'last_name', r.customer_last_name
        ),
        'event', json_build_object(
            'event_id', e.event_id,
            'title', e.title,
            'subtitle', e.subtitle,
            'slug', e.slug,
            'event_start', e.event_start,
            'event_end', e.event_end,
            'type', e.type,
            'location', json_build_object(
                'place_name', l.place_name,
                'street_address', l.street_address,
                'suburb', l.suburb,
                'state', l.state,
                'postal_code', l.postal_code,
                'location_string', e.location_string
            ),
            'organiser', json_build_object(
                'name', e.organiser_name,
                'abbreviation', e.organiser_abbreviation
            ),
            'dress_code', e.dress_code,
            'regalia', e.regalia,
            'regalia_description', e.regalia_description
        ),
        'organisation', CASE 
            WHEN r.organisation_id IS NOT NULL THEN
                json_build_object(
                    'organisation_id', r.organisation_id,
                    'name', r.organisation_name,
                    'abbreviation', r.organisation_abbreviation
                )
            ELSE NULL
        END,
        'attendees', (
            SELECT json_agg(
                json_build_object(
                    'attendee_id', a.attendee_id,
                    'attendee_type', a.attendee_type,
                    'title', a.title,
                    'first_name', a.first_name,
                    'last_name', a.last_name,
                    'full_name', a.full_name,
                    'email', a.email,
                    'phone', a.phone,
                    'dietary_requirements', a.dietary_requirements,
                    'special_needs', a.special_needs,
                    'is_primary', a.is_primary,
                    'is_partner', a.is_partner,
                    'has_partner', a.has_partner,
                    'partner_details', CASE 
                        WHEN a.related_attendee_id IS NOT NULL THEN
                            json_build_object(
                                'attendee_id', a.related_attendee_id,
                                'full_name', a.partner_full_name,
                                'relationship', a.relationship
                            )
                        ELSE NULL
                    END,
                    'masonic_details', CASE 
                        WHEN a.masonic_profile_id IS NOT NULL THEN
                            json_build_object(
                                'masonic_title', a.masonic_title,
                                'rank', a.rank,
                                'grand_rank', a.grand_rank,
                                'grand_officer', a.grand_officer,
                                'grand_office', a.grand_office,
                                'lodge_name', a.lodge_name,
                                'lodge_number', a.lodge_number,
                                'grand_lodge_name', a.grand_lodge_name
                            )
                        ELSE NULL
                    END,
                    'tickets', a.tickets,
                    'ticket_count', a.ticket_count
                )
                ORDER BY a.is_primary DESC, a.created_at
            )
            FROM attendee_complete_view a
            WHERE a.registration_id = r.registration_id
        ),
        'tickets', (
            SELECT json_agg(
                json_build_object(
                    'ticket_id', t.ticket_id,
                    'event_id', t.event_id,
                    'event_title', COALESCE(te.title, e.title),
                    'ticket_type_name', et.name,
                    'ticket_type_description', et.description,
                    'attendee_id', t.attendee_id,
                    'attendee_name', att.full_name,
                    'price_paid', t.price_paid,
                    'status', t.status,
                    'is_partner_ticket', t.is_partner_ticket,
                    'ticket_number', t.ticket_number,
                    'qr_code', t.qr_code,
                    'checked_in_at', t.checked_in_at
                )
                ORDER BY att.is_primary DESC, att.full_name, et.name
            )
            FROM tickets t
            JOIN event_tickets et ON t.ticket_type_id = et.id
            LEFT JOIN events te ON t.event_id = te.event_id
            JOIN attendee_complete_view att ON t.attendee_id = att.attendee_id
            WHERE t.registration_id = r.registration_id
        ),
        'summary', json_build_object(
            'attendee_count', r.attendee_count,
            'ticket_count', r.ticket_count,
            'partner_count', (
                SELECT COUNT(*) 
                FROM attendees 
                WHERE registration_id = r.registration_id 
                  AND is_partner = true
            ),
            'total_amount', r.total_ticket_amount,
            'ticket_types', r.ticket_types,
            'has_dietary_requirements', EXISTS (
                SELECT 1 FROM attendees 
                WHERE registration_id = r.registration_id 
                  AND dietary_requirements IS NOT NULL 
                  AND dietary_requirements != ''
            ),
            'has_special_needs', EXISTS (
                SELECT 1 FROM attendees 
                WHERE registration_id = r.registration_id 
                  AND special_needs IS NOT NULL 
                  AND special_needs != ''
            )
        ),
        'payment', CASE 
            WHEN r.stripe_payment_intent_id IS NOT NULL THEN
                json_build_object(
                    'payment_intent_id', r.stripe_payment_intent_id,
                    'payment_status', r.payment_status,
                    'total_amount_paid', r.total_amount_paid,
                    'payment_date', (
                        SELECT created_at 
                        FROM registration_payments 
                        WHERE registration_id = r.registration_id 
                          AND payment_status = 'succeeded'
                        ORDER BY created_at DESC 
                        LIMIT 1
                    )
                )
            ELSE NULL
        END
    ) INTO v_result
    FROM registration_detail_view r
    JOIN event_display_view e ON r.event_id = e.event_id
    LEFT JOIN locations l ON e.location_id = l.location_id
    WHERE r.registration_id = p_registration_id;

    -- Check if registration was found
    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Registration not found: %', p_registration_id;
    END IF;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in get_registration_summary: % %', SQLERRM, SQLSTATE;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION public.get_registration_summary(UUID) IS 
'Returns complete registration data including all attendees, tickets, event details, and payment information. Used for confirmation pages and administrative views.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_registration_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_registration_summary(UUID) TO anon;