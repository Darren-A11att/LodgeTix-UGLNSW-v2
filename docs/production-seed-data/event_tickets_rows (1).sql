INSERT INTO "public"."event_tickets" ("event_ticket_id", "event_id", "name", "description", "price", "total_capacity", "available_count", "reserved_count", "sold_count", "status", "is_active", "created_at", "updated_at", "eligibility_criteria", "stripe_price_id") 
VALUES 
  ('bce41292-3662-44a7-85da-eeb1a1e89d8a', '567fa008-40de-4f87-89f5-900933f898b2', 'Farewell Cruise Luncheon', null, '75', '150', '150', '0', '0', 'Active', 'true', '2025-06-02 02:00:17.585068+00', '2025-06-18 06:42:24.292071+00', '{"rules": []}', null), 
  ('c3d4e5f6-a7b8-4923-cdef-345678901234', '03a51924-1606-47c9-838d-9dc32657cd59', 'Grand Proclamation Banquet - 3rd Floor', null, '115', '30', '30', '0', '0', 'False', 'false', '2025-06-07 12:00:00+00', '2025-06-13 03:27:24.59918+00', '{"rules": []}', null), 
  ('a1b2c3d4-e5f6-4789-abcd-ef1234567890', '03a51924-1606-47c9-838d-9dc32657cd59', 'Grand Proclamation Banquet - Marble Foyer', null, '115', '102', '102', '0', '0', 'False', 'false', '2025-06-07 12:00:00+00', '2025-06-13 02:19:56.707201+00', '{"rules": []}', null), 
  ('b2c3d4e5-f6a7-4891-bcde-f23456789012', '03a51924-1606-47c9-838d-9dc32657cd59', 'Grand Proclamation Banquet - Mezzanine', null, '115', '30', '30', '0', '0', 'False', 'false', '2025-06-07 12:00:00+00', '2025-06-13 03:27:24.59918+00', '{"rules": []}', null), 
  ('7196514b-d4b8-4fe0-93ac-deb4c205dd09', '6c12952b-7cf3-4d6a-81bd-1ac3b7ff7076', 'Grand Proclamation Ceremony', null, '20', '600', '600', '0', '0', 'Active', 'true', '2025-06-02 01:54:23.077909+00', '2025-06-18 07:35:52.315247+00', '{"rules": []}', null), 
  ('d4e5f6a7-b8c9-4567-def0-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ladies Brunch', null, '50', '100', '100', '0', '0', 'Active', 'true', '2025-06-07 12:00:00+00', '2025-06-18 06:42:24.292071+00', '{"rules": []}', null), 
  ('d586ecc1-e410-4ef3-a59c-4a53a866bc33', 'e842bdb2-aff8-46d8-a347-bf50840fff13', 'Meet & Greet Cocktail Party', null, '70', '200', '200', '0', '0', 'Active', 'true', '2025-06-02 01:54:23.077909+00', '2025-06-18 06:47:38.68921+00', '{"rules": []}', null), 
  ('fd12d7f0-f346-49bf-b1eb-0682ad226216', '03a51924-1606-47c9-838d-9dc32657cd59', 'Proclamation Banquet - Best Available', null, '115', '480', '480', '0', '0', 'Active', 'true', '2025-06-02 01:54:23.077909+00', '2025-06-18 10:56:29.647464+00', '{"rules": []}', null), 
  ('be94ef03-6647-48d5-97ea-f98c862e30e6', 'd19d0c78-bf04-48a3-b8c5-7b9724079451', 'Quarterly Communication', null, '0', '500', '500', '0', '0', 'Active', 'true', '2025-06-02 01:54:23.077909+00', '2025-06-07 12:00:00+00', '{"rules": [{"type": "attendee_type", "value": "mason", "operator": "equals"}, {"type": "grand_lodge", "value": "UGLNSWACT", "operator": "equals"}], "operator": "AND"}', null)
ON CONFLICT (event_ticket_id) 
DO UPDATE SET 
  event_id = EXCLUDED.event_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  total_capacity = EXCLUDED.total_capacity,
  available_count = EXCLUDED.available_count,
  reserved_count = EXCLUDED.reserved_count,
  sold_count = EXCLUDED.sold_count,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  eligibility_criteria = EXCLUDED.eligibility_criteria,
  stripe_price_id = EXCLUDED.stripe_price_id;