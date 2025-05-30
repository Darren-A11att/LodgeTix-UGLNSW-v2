create view public.registration_summary as
select
  r.registration_id,
  r.contact_id as customer_id,
  COALESCE(
    (c.first_name || ' '::text) || c.last_name,
    c.business_name
  ) as customer_name,
  r.event_id,
  e.title as event_title,
  r.registration_date,
  r.status,
  r.payment_status,
  r.total_amount_paid,
  r.total_price_paid,
  r.registration_type,
  r.primary_attendee_id,
  r.created_at,
  r.updated_at
from
  registrations r
  left join customers c on r.contact_id = c.customer_id
  left join events e on r.event_id = e.event_id;