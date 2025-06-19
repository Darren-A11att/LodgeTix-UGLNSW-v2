INSERT INTO "public"."display_scopes" ("id", "name", "created_at") 
VALUES 
  ('2a5e3b6d-cc0f-494e-8b2f-57608b1324f5', 'authenticated', '2025-04-27 04:25:04.365529+00'), 
  ('5cd95867-3a19-4f26-a3c4-6e160f816e9d', 'anonymous', '2025-04-27 04:25:04.365529+00')
ON CONFLICT (id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  created_at = EXCLUDED.created_at;