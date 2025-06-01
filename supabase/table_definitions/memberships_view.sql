create view public.memberships_view as
select
  m.membership_id,
  m.contact_id,
  c.first_name,
  c.last_name,
  c.email,
  m.profile_id,
  mp.masonic_title,
  m.role,
  m.permissions,
  m.membership_type,
  m.membership_entity_id,
  case
    when m.membership_type::text = 'lodge'::text then l.name
    when m.membership_type::text = 'grand_lodge'::text then gl.name
    when m.membership_type::text = 'organisation'::text then o.name::text
    else 'Unknown'::text
  end as entity_name,
  m.is_active,
  m.created_at
from
  memberships m
  join contacts c on m.contact_id = c.contact_id
  left join masonic_profiles mp on m.profile_id = mp.masonic_profile_id
  left join lodges l on m.membership_type::text = 'lodge'::text
  and m.membership_entity_id = l.lodge_id
  left join grand_lodges gl on m.membership_type::text = 'grand_lodge'::text
  and m.membership_entity_id = gl.grand_lodge_id
  left join organisations o on m.membership_type::text = 'organisation'::text
  and m.membership_entity_id = o.organisation_id;