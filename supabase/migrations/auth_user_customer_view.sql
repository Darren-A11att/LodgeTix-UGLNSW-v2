create view public.auth_user_customer_view as
select
  u.id as auth_user_id,
  u.email as auth_email,
  u.created_at as user_created,
  c.contact_id,
  c.first_name,
  c.last_name,
  c.email as contact_email,
  cust.customer_id,
  cust.customer_type,
  case
    when cust.customer_id is not null then 'Customer'::text
    when c.contact_id is not null then 'Contact Only'::text
    else 'Auth User Only'::text
  end as user_type
from
  auth.users u
  left join contacts c on u.id = c.auth_user_id
  left join customers cust on c.contact_id = cust.contact_id
order by
  u.created_at desc;