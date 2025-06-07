-- Comprehensive view showing all column values from registrations, customers, contacts, masonic_profiles, attendees, and tickets tables
-- This view provides a complete picture of registration data with all related information

CREATE OR REPLACE VIEW comprehensive_registration_view AS
SELECT 
  -- Registration Information
  r.registration_id,
  r.customer_id,
  r.auth_user_id AS registration_auth_user_id,
  r.function_id,
  r.organisation_id AS registration_organisation_id,
  r.registration_type,
  r.registration_date,
  r.status AS registration_status,
  r.confirmation_number,
  r.confirmation_generated_at,
  r.primary_attendee_id,
  r.attendee_count,
  r.organisation_name AS registration_organisation_name,
  r.organisation_number,
  r.primary_attendee AS registration_primary_attendee,
  r.payment_status,
  r.total_amount_paid,
  r.total_price_paid,
  r.subtotal,
  r.stripe_fee,
  r.includes_processing_fee,
  r.stripe_payment_intent_id,
  r.connected_account_id,
  r.platform_fee_amount,
  r.platform_fee_id,
  r.registration_data,
  r.confirmation_pdf_url,
  r.agree_to_terms,
  r.created_at AS registration_created_at,
  r.updated_at AS registration_updated_at,

  -- Customer Information (Booking Contact)
  cust.customer_id AS customer_id_ref,
  cust.contact_id AS customer_contact_id,
  cust.organisation_id AS customer_organisation_id,
  cust.customer_type,
  cust.first_name AS customer_first_name,
  cust.last_name AS customer_last_name,
  cust.business_name AS customer_business_name,
  cust.email AS customer_email,
  cust.phone AS customer_phone,
  cust.address_line1 AS customer_address_line1,
  cust.address_line2 AS customer_address_line2,
  cust.city AS customer_city,
  cust.state AS customer_state,
  cust.postal_code AS customer_postal_code,
  cust.country AS customer_country,
  cust.billing_organisation_name AS customer_billing_organisation_name,
  cust.billing_email AS customer_billing_email,
  cust.billing_phone AS customer_billing_phone,
  cust.billing_street_address AS customer_billing_street_address,
  cust.billing_city AS customer_billing_city,
  cust.billing_state AS customer_billing_state,
  cust.billing_postal_code AS customer_billing_postal_code,
  cust.billing_country AS customer_billing_country,
  cust.stripe_customer_id AS customer_stripe_customer_id,
  cust.created_at AS customer_created_at,
  cust.updated_at AS customer_updated_at,

  -- Contact Information (from customer)
  cont.contact_id,
  cont.auth_user_id AS contact_auth_user_id,
  cont.organisation_id AS contact_organisation_id,
  cont.type AS contact_type,
  cont.first_name AS contact_first_name,
  cont.last_name AS contact_last_name,
  cont.title AS contact_title,
  cont.suffix_1 AS contact_suffix_1,
  cont.suffix_2 AS contact_suffix_2,
  cont.suffix_3 AS contact_suffix_3,
  cont.business_name AS contact_business_name,
  cont.email AS contact_email,
  cont.mobile_number AS contact_mobile_number,
  cont.contact_preference AS contact_preference,
  cont.address_line_1 AS contact_address_line_1,
  cont.address_line_2 AS contact_address_line_2,
  cont.suburb_city AS contact_suburb_city,
  cont.state AS contact_state,
  cont.country AS contact_country,
  cont.postcode AS contact_postcode,
  cont.dietary_requirements AS contact_dietary_requirements,
  cont.special_needs AS contact_special_needs,
  cont.has_partner AS contact_has_partner,
  cont.is_partner AS contact_is_partner,
  cont.billing_organisation_name AS contact_billing_organisation_name,
  cont.billing_email AS contact_billing_email,
  cont.billing_phone AS contact_billing_phone,
  cont.billing_street_address AS contact_billing_street_address,
  cont.billing_city AS contact_billing_city,
  cont.billing_state AS contact_billing_state,
  cont.billing_postal_code AS contact_billing_postal_code,
  cont.billing_country AS contact_billing_country,
  cont.stripe_customer_id AS contact_stripe_customer_id,
  cont.source_type AS contact_source_type,
  cont.source_id AS contact_source_id,
  cont.created_at AS contact_created_at,
  cont.updated_at AS contact_updated_at,

  -- Masonic Profile Information (from customer contact)
  mp.masonic_profile_id,
  mp.contact_id AS masonic_contact_id,
  mp.masonic_title,
  mp.rank AS masonic_rank,
  mp.grand_rank,
  mp.grand_officer,
  mp.grand_office,
  mp.lodge_id AS masonic_lodge_id,
  mp.grand_lodge_id AS masonic_grand_lodge_id,
  mp.created_at AS masonic_profile_created_at,
  mp.updated_at AS masonic_profile_updated_at,

  -- Attendee Information
  att.attendee_id,
  att.registration_id AS attendee_registration_id,
  att.contact_id AS attendee_contact_id,
  att.auth_user_id AS attendee_auth_user_id,
  att.attendee_type,
  att.is_primary AS attendee_is_primary,
  att.related_attendee_id,
  att.relationship AS attendee_relationship,
  att.title AS attendee_title,
  att.first_name AS attendee_first_name,
  att.last_name AS attendee_last_name,
  att.suffix AS attendee_suffix,
  att.suffix_1 AS attendee_suffix_1,
  att.suffix_2 AS attendee_suffix_2,
  att.suffix_3 AS attendee_suffix_3,
  att.email AS attendee_email,
  att.phone AS attendee_phone,
  att.primary_email AS attendee_primary_email,
  att.primary_phone AS attendee_primary_phone,
  att.contact_preference AS attendee_contact_preference,
  att.dietary_requirements AS attendee_dietary_requirements,
  att.special_needs AS attendee_special_needs,
  att.is_partner AS attendee_is_partner,
  att.has_partner AS attendee_has_partner,
  att.event_title AS attendee_event_title,
  att.person_id AS attendee_person_id,
  att.masonic_status AS attendee_masonic_status,
  att.qr_code_url AS attendee_qr_code_url,
  att.attendee_data,
  att.created_at AS attendee_created_at,
  att.updated_at AS attendee_updated_at,

  -- Attendee Contact Information
  att_cont.contact_id AS attendee_contact_record_id,
  att_cont.auth_user_id AS attendee_contact_auth_user_id,
  att_cont.organisation_id AS attendee_contact_organisation_id,
  att_cont.type AS attendee_contact_type,
  att_cont.first_name AS attendee_contact_first_name,
  att_cont.last_name AS attendee_contact_last_name,
  att_cont.title AS attendee_contact_title,
  att_cont.suffix_1 AS attendee_contact_suffix_1,
  att_cont.suffix_2 AS attendee_contact_suffix_2,
  att_cont.suffix_3 AS attendee_contact_suffix_3,
  att_cont.business_name AS attendee_contact_business_name,
  att_cont.email AS attendee_contact_email,
  att_cont.mobile_number AS attendee_contact_mobile_number,
  att_cont.contact_preference AS attendee_contact_preference,
  att_cont.address_line_1 AS attendee_contact_address_line_1,
  att_cont.address_line_2 AS attendee_contact_address_line_2,
  att_cont.suburb_city AS attendee_contact_suburb_city,
  att_cont.state AS attendee_contact_state,
  att_cont.country AS attendee_contact_country,
  att_cont.postcode AS attendee_contact_postcode,
  att_cont.dietary_requirements AS attendee_contact_dietary_requirements,
  att_cont.special_needs AS attendee_contact_special_needs,
  att_cont.has_partner AS attendee_contact_has_partner,
  att_cont.is_partner AS attendee_contact_is_partner,
  att_cont.created_at AS attendee_contact_created_at,
  att_cont.updated_at AS attendee_contact_updated_at,

  -- Attendee Masonic Profile Information
  att_mp.masonic_profile_id AS attendee_masonic_profile_id,
  att_mp.contact_id AS attendee_masonic_contact_id,
  att_mp.masonic_title AS attendee_masonic_title,
  att_mp.rank AS attendee_masonic_rank,
  att_mp.grand_rank AS attendee_grand_rank,
  att_mp.grand_officer AS attendee_grand_officer,
  att_mp.grand_office AS attendee_grand_office,
  att_mp.lodge_id AS attendee_masonic_lodge_id,
  att_mp.grand_lodge_id AS attendee_masonic_grand_lodge_id,
  att_mp.created_at AS attendee_masonic_profile_created_at,
  att_mp.updated_at AS attendee_masonic_profile_updated_at,

  -- Ticket Information
  t.ticket_id,
  t.attendee_id AS ticket_attendee_id,
  t.registration_id AS ticket_registration_id,
  t.event_id AS ticket_event_id,
  t.ticket_type_id,
  t.event_ticket_id,
  t.package_id AS ticket_package_id,
  t.price_paid AS ticket_price_paid,
  t.original_price AS ticket_original_price,
  t.ticket_price,
  t.currency AS ticket_currency,
  t.status AS ticket_status,
  t.ticket_status AS ticket_status_alt,
  t.payment_status AS ticket_payment_status,
  t.reservation_id AS ticket_reservation_id,
  t.reservation_expires_at AS ticket_reservation_expires_at,
  t.seat_info AS ticket_seat_info,
  t.checked_in_at AS ticket_checked_in_at,
  t.purchased_at AS ticket_purchased_at,
  t.is_partner_ticket,
  t.qr_code_url AS ticket_qr_code_url,
  t.created_at AS ticket_created_at,
  t.updated_at AS ticket_updated_at

FROM registrations r
  -- Join to customer (booking contact)
  LEFT JOIN customers cust ON r.customer_id = cust.customer_id
  
  -- Join to customer's contact record
  LEFT JOIN contacts cont ON cust.contact_id = cont.contact_id
  
  -- Join to customer contact's masonic profile
  LEFT JOIN masonic_profiles mp ON cont.contact_id = mp.contact_id
  
  -- Join to attendees
  LEFT JOIN attendees att ON r.registration_id = att.registration_id
  
  -- Join to attendee's contact record
  LEFT JOIN contacts att_cont ON att.contact_id = att_cont.contact_id
  
  -- Join to attendee contact's masonic profile
  LEFT JOIN masonic_profiles att_mp ON att_cont.contact_id = att_mp.contact_id
  
  -- Join to tickets
  LEFT JOIN tickets t ON att.attendee_id = t.attendee_id

ORDER BY 
  r.registration_date DESC,
  r.registration_id,
  att.is_primary DESC,
  att.attendee_id,
  t.ticket_id;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_comprehensive_registration_view_lookup 
ON registrations (registration_date DESC, registration_id);

-- Add comment explaining the view
COMMENT ON VIEW comprehensive_registration_view IS 
'Comprehensive view showing all column values from registrations, customers, contacts, masonic_profiles, attendees, and tickets tables. 
This view provides complete registration information including:
- Registration details and payment status
- Booking contact (customer) information with billing details
- Customer contact record and masonic profile
- All attendees with their contact records and masonic profiles
- All tickets assigned to attendees
- Proper handling of partner relationships and masonic hierarchy';