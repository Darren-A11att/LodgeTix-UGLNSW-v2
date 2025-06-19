INSERT INTO "public"."packages" ("package_id", "event_id", "name", "description", "original_price", "discount", "package_price", "is_active", "includes_description", "qty", "included_items", "created_at", "updated_at", "eligibility_criteria", "function_id", "registration_types") 
VALUES 
  ('08c77893-85a3-46a5-a04a-99e5fa896662', null, 'Communication, Ceremony & Banquet', 'Quarterly Communication, Grand Proclamation Ceremony and Banquet', '135.00', '0.00', '135.00', 'false', null, '1', '{"(be94ef03-6647-48d5-97ea-f98c862e30e6,1)","(7196514b-d4b8-4fe0-93ac-deb4c205dd09,1)","(fd12d7f0-f346-49bf-b1eb-0682ad226216,1)"}', '2025-06-02 02:01:17.392325+00', '2025-06-02 02:01:17.392325+00', '{"rules": [{"type": "attendee_type", "value": "mason", "operator": "equals"}, {"type": "grand_lodge", "value": "UGLNSWACT", "operator": "equals"}], "operator": "AND"}', 'eebddef5-6833-43e3-8d32-700508b1c089', '{"individuals","lodges"}'), 
  ('46c2dbe0-708e-47be-9046-a4ff597a8158', null, 'Ceremony & Banquet', 'Grand Proclamation Ceremony and Banquet', '135.00', '0.00', '135.00', 'false', null, '1', '{"(7196514b-d4b8-4fe0-93ac-deb4c205dd09,1)","(fd12d7f0-f346-49bf-b1eb-0682ad226216,1)"}', '2025-06-02 02:01:17.392325+00', '2025-06-02 02:01:17.392325+00', '{"rules": []}', 'eebddef5-6833-43e3-8d32-700508b1c089', '{"individuals","delegations"}'), 
  ('794841e4-5f04-4899-96e2-c0afece4d5f2', null, 'Lodge Package', 'Package for Lodges - 10 tickets for Banquet', '1150.00', '0.00', '1150.00', 'true', null, '10', '{"(fd12d7f0-f346-49bf-b1eb-0682ad226216,10)"}', '2025-06-02 02:01:17.392325+00', '2025-06-02 02:01:17.392325+00', '{"rules": [{"type": "registration_type", "value": "lodges", "operator": "equals"}]}', 'eebddef5-6833-43e3-8d32-700508b1c089', '{"lodges"}'), 
  ('88567b9c-9675-4ee2-b572-eace1c580eb4', null, 'All Events', 'Complete Grand Proclamation 2025 experience including all events', '280.00', '0.00', '280.00', 'false', null, '1', '{"(d586ecc1-e410-4ef3-a59c-4a53a866bc33,1)","(be94ef03-6647-48d5-97ea-f98c862e30e6,1)","(7196514b-d4b8-4fe0-93ac-deb4c205dd09,1)","(fd12d7f0-f346-49bf-b1eb-0682ad226216,1)","(bce41292-3662-44a7-85da-eeb1a1e89d8a,1)"}', '2025-06-02 02:01:17.392325+00', '2025-06-02 02:01:17.392325+00', '{"rules": []}', 'eebddef5-6833-43e3-8d32-700508b1c089', '{"individuals","delegations"}'), 
  ('e7f8a9b0-c1d2-4e5f-9876-543210fedcba', null, 'Ladies Brunch, Ceremony & Banquet', 'Ladies Brunch, Grand Proclamation Ceremony and Banquet Package for Guests', '185.00', '0.00', '185.00', 'false', null, '1', '{"(d4e5f6a7-b8c9-4567-def0-456789012345,1)","(7196514b-d4b8-4fe0-93ac-deb4c205dd09,1)","(fd12d7f0-f346-49bf-b1eb-0682ad226216,1)"}', '2025-06-07 12:00:00+00', '2025-06-07 12:00:00+00', '{"rules": [{"type": "attendee_type", "value": "guest", "operator": "equals"}]}', 'eebddef5-6833-43e3-8d32-700508b1c089', '{"individuals"}')
ON CONFLICT (package_id) 
DO UPDATE SET 
  event_id = EXCLUDED.event_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  original_price = EXCLUDED.original_price,
  discount = EXCLUDED.discount,
  package_price = EXCLUDED.package_price,
  is_active = EXCLUDED.is_active,
  includes_description = EXCLUDED.includes_description,
  qty = EXCLUDED.qty,
  included_items = EXCLUDED.included_items,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  eligibility_criteria = EXCLUDED.eligibility_criteria,
  function_id = EXCLUDED.function_id,
  registration_types = EXCLUDED.registration_types;