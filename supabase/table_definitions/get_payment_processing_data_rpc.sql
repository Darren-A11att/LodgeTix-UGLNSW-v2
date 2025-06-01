-- Create RPC function for efficient payment processing data fetching
CREATE OR REPLACE FUNCTION get_payment_processing_data(p_registration_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'registration', json_build_object(
      'registration_id', r.registration_id,
      'registration_type', r.registration_type,
      'attendee_count', r.attendee_count,
      'subtotal', r.subtotal,
      'total_amount', r.total_amount,
      'status', r.status,
      'payment_status', r.payment_status,
      'created_at', r.created_at,
      'confirmation_number', r.confirmation_number,
      'stripe_payment_intent_id', r.stripe_payment_intent_id,
      'total_amount_paid', r.total_amount_paid,
      'stripe_fee', r.stripe_fee,
      'includes_processing_fee', r.includes_processing_fee
    ),
    'event', json_build_object(
      'event_id', e.event_id,
      'title', e.title,
      'subtitle', e.subtitle,
      'slug', e.slug,
      'parent_event_id', e.parent_event_id,
      'event_start', e.event_start,
      'event_end', e.event_end,
      'type', e.type,
      'location_id', e.location_id,
      'max_attendees', e.max_attendees,
      'is_multi_day', e.is_multi_day,
      'is_published', e.is_published,
      'featured', e.featured,
      'degree_type', e.degree_type,
      'dress_code', e.dress_code,
      'regalia', e.regalia,
      'regalia_description', e.regalia_description,
      'important_information', e.important_information
    ),
    'organization', json_build_object(
      'organisation_id', o.organisation_id,
      'name', o.name,
      'type', o.type,
      'abbreviation', o.abbreviation,
      'stripe_onbehalfof', o.stripe_onbehalfof,
      'website', o.website,
      'city', o.city,
      'state', o.state,
      'country', o.country
    ),
    'parent_event', CASE 
      WHEN e.parent_event_id IS NOT NULL THEN (
        SELECT json_build_object(
          'event_id', pe.event_id,
          'title', pe.title,
          'subtitle', pe.subtitle,
          'slug', pe.slug,
          'event_start', pe.event_start,
          'event_end', pe.event_end,
          'type', pe.type,
          'image_url', pe.image_url,
          'max_attendees', pe.max_attendees
        )
        FROM events pe
        WHERE pe.event_id = e.parent_event_id
      )
      ELSE NULL
    END,
    'child_events', COALESCE((
      SELECT json_agg(
        json_build_object(
          'event_id', ce.event_id,
          'title', ce.title,
          'subtitle', ce.subtitle,
          'slug', ce.slug,
          'event_start', ce.event_start,
          'event_end', ce.event_end,
          'type', ce.type,
          'is_purchasable_individually', ce.is_purchasable_individually
        )
        ORDER BY ce.event_start
      )
      FROM events ce
      WHERE ce.parent_event_id = COALESCE(e.parent_event_id, e.event_id)
    ), '[]'::json),
    'attendees', COALESCE((
      SELECT json_agg(
        json_build_object(
          'attendee_id', a.attendee_id,
          'first_name', a.first_name,
          'last_name', a.last_name,
          'attendee_type', a.attendee_type,
          'email', a.email,
          'phone_number', a.phone_number,
          'dietary_requirements', a.dietary_requirements,
          'accessibility_requirements', a.accessibility_requirements,
          'is_primary_contact', a.is_primary_contact,
          'mason_type', a.mason_type,
          'lodge_name', a.lodge_name,
          'lodge_number', a.lodge_number,
          'grand_lodge', a.grand_lodge,
          'masonic_rank', a.masonic_rank,
          'masonic_profiles', CASE
            WHEN mp.profile_id IS NOT NULL THEN json_build_object(
              'profile_id', mp.profile_id,
              'contact_id', mp.contact_id,
              'masonic_title', mp.masonic_title,
              'rank', mp.rank,
              'grand_rank', mp.grand_rank,
              'grand_officer', mp.grand_officer,
              'grand_office', mp.grand_office,
              'lodges', CASE
                WHEN l.lodge_id IS NOT NULL THEN json_build_object(
                  'lodge_id', l.lodge_id,
                  'name', l.name,
                  'number', l.number
                )
                ELSE NULL
              END,
              'grand_lodges', CASE
                WHEN gl.grand_lodge_id IS NOT NULL THEN json_build_object(
                  'grand_lodge_id', gl.grand_lodge_id,
                  'name', gl.name,
                  'abbreviation', gl.abbreviation
                )
                ELSE NULL
              END
            )
            ELSE NULL
          END
        )
        ORDER BY a.is_primary_contact DESC NULLS LAST, a.created_at
      )
      FROM attendees a
      LEFT JOIN masonic_profiles mp ON a.attendee_id = mp.attendee_id
      LEFT JOIN lodges l ON mp.lodge_id = l.lodge_id
      LEFT JOIN grand_lodges gl ON mp.grand_lodge_id = gl.grand_lodge_id
      WHERE a.registration_id = r.registration_id
    ), '[]'::json),
    'tickets', COALESCE((
      SELECT json_agg(
        json_build_object(
          'ticket_id', t.ticket_id,
          'event_ticket_id', t.event_ticket_id,
          'price_paid', t.price_paid,
          'ticket_status', t.ticket_status,
          'event_tickets', json_build_object(
            'id', et.id,
            'title', et.title,
            'description', et.description,
            'price', et.price,
            'ticket_type', et.ticket_type,
            'event_id', et.event_id,
            'events', json_build_object(
              'event_id', te.event_id,
              'title', te.title,
              'slug', te.slug
            )
          )
        )
      )
      FROM tickets t
      INNER JOIN event_tickets et ON t.event_ticket_id = et.id
      INNER JOIN events te ON et.event_id = te.event_id
      WHERE t.registration_id = r.registration_id
    ), '[]'::json),
    'lodge_registration', CASE
      WHEN r.registration_type = 'lodge' THEN (
        SELECT json_build_object(
          'lodge_registration_id', lr.lodge_registration_id,
          'table_count', lr.table_count,
          'lodges', CASE
            WHEN llr.lodge_id IS NOT NULL THEN json_build_object(
              'lodge_id', llr.lodge_id,
              'name', llr.name,
              'number', llr.number,
              'meeting_location', llr.meeting_location,
              'grand_lodges', CASE
                WHEN gllr.grand_lodge_id IS NOT NULL THEN json_build_object(
                  'grand_lodge_id', gllr.grand_lodge_id,
                  'name', gllr.name,
                  'abbreviation', gllr.abbreviation
                )
                ELSE NULL
              END
            )
            ELSE NULL
          END
        )
        FROM lodge_registrations lr
        LEFT JOIN lodges llr ON lr.lodge_id = llr.lodge_id
        LEFT JOIN grand_lodges gllr ON llr.grand_lodge_id = gllr.grand_lodge_id
        WHERE lr.registration_id = r.registration_id
        LIMIT 1
      )
      ELSE NULL
    END,
    'summary', json_build_object(
      'total_attendees', r.attendee_count,
      'total_amount', r.total_amount,
      'attendee_breakdown', (
        SELECT json_object_agg(attendee_type, count)
        FROM (
          SELECT attendee_type, COUNT(*) as count
          FROM attendees
          WHERE registration_id = r.registration_id
          GROUP BY attendee_type
        ) att_stats
      ),
      'ticket_breakdown', (
        SELECT json_object_agg(COALESCE(et2.ticket_type, 'standard'), count)
        FROM (
          SELECT et2.ticket_type, COUNT(*) as count
          FROM tickets t2
          INNER JOIN event_tickets et2 ON t2.event_ticket_id = et2.id
          WHERE t2.registration_id = r.registration_id
          GROUP BY et2.ticket_type
        ) ticket_stats
      )
    )
  ) INTO result
  FROM registrations r
  INNER JOIN events e ON r.event_id = e.event_id
  INNER JOIN organisations o ON e.organiser_id = o.organisation_id
  WHERE r.registration_id = p_registration_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function comment
COMMENT ON FUNCTION get_payment_processing_data(UUID) IS 'Fetches comprehensive registration data for Stripe payment processing including event hierarchy, organization, attendees, tickets, and summary statistics';

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_attendees_registration_id ON attendees(registration_id);
CREATE INDEX IF NOT EXISTS idx_tickets_registration_id ON tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_events_organiser_id ON events(organiser_id);
CREATE INDEX IF NOT EXISTS idx_masonic_profiles_attendee_id ON masonic_profiles(attendee_id);
CREATE INDEX IF NOT EXISTS idx_lodge_registrations_registration_id ON lodge_registrations(registration_id);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_payment_processing_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_processing_data(UUID) TO anon;