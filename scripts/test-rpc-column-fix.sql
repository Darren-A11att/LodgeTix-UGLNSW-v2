-- Test script to verify column names after migration
-- Run this after applying the migration to ensure it works

-- Check attendees table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'attendees' 
AND column_name IN ('registrationid', 'registration_id')
ORDER BY column_name;

-- Check tickets table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name IN ('registration_id', 'registrationid')
ORDER BY column_name;

-- Test the RPC function with minimal data
SELECT create_registration(
  jsonb_build_object(
    'registration_id', gen_random_uuid(),
    'customer_id', gen_random_uuid(),
    'event_id', (SELECT id FROM events LIMIT 1),
    'status', 'test',
    'total_price_paid', 100
  ),
  '[]'::jsonb,
  '[]'::jsonb
);