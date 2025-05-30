create view public.registration_payments as
select
  r.registration_id,
  r.status as registration_status,
  r.payment_status,
  r.total_price_paid as total_price,
  r.total_amount_paid as total_paid,
  r.stripe_payment_intent_id as payment_intent_id,
  spi.status as stripe_payment_status,
  spi.amount::numeric / 100::numeric as stripe_amount
from
  registrations r
  left join stripe.payment_intents spi on r.stripe_payment_intent_id = spi.id;