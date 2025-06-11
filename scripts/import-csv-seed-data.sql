-- LodgeTix CSV Data Import Script
-- This script imports data from CSV exports and sets up relationships

-- Start transaction to ensure data consistency
BEGIN;

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create default organization if it doesn't exist first
INSERT INTO organisations (
    organisation_id,
    name,
    type,
    city,
    state,
    country,
    created_at
) VALUES (
    'b290f1ee-6c54-4b01-90e6-d701748f0896'::uuid,
    'United Grand Lodge of NSW & ACT',
    'grandlodge',
    'Sydney',
    'NSW',
    'Australia',
    NOW()
) ON CONFLICT (organisation_id) DO NOTHING;

-- Create default location if it doesn't exist
INSERT INTO locations (
    location_id,
    place_name,
    street_address,
    suburb,
    state,
    postal_code,
    country,
    created_at
) VALUES (
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    'Sydney Masonic Centre',
    '279 Castlereagh St',
    'Sydney',
    'NSW',
    '2000',
    'Australia',
    NOW()
) ON CONFLICT (location_id) DO NOTHING;

-- Now create the featured function record
-- This will be our main function that all events are linked to
INSERT INTO functions (
    function_id,
    name,
    slug,
    description,
    start_date,
    end_date,
    organiser_id,
    is_published,
    created_at,
    updated_at
) VALUES (
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    'Grand Installation 2025',
    'grand-installation-2025',
    'The United Grand Lodge of NSW & ACT cordially invites you to attend the Installation of MW Bro Bernie Khristian Albano as Grand Master.',
    '2025-05-15 04:00:00+00'::timestamptz,
    '2025-05-17 07:00:00+00'::timestamptz,
    'b290f1ee-6c54-4b01-90e6-d701748f0896'::uuid,
    true,
    NOW(),
    NOW()
) ON CONFLICT (function_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();


-- Insert events from CSV data
-- Based on events_new_rows.csv structure
INSERT INTO events (
    event_id,
    title,
    subtitle,
    description,
    slug,
    event_start,
    event_end,
    location_id,
    organiser_id,
    function_id,
    type,
    degree_type,
    dress_code,
    regalia,
    is_published,
    featured,
    is_purchasable_individually,
    is_multi_day,
    created_at,
    updated_at
) VALUES 
-- Third Degree Ceremony
(
    'd290f1ee-6c54-4b01-90e6-d701748f0851'::uuid,
    'Third Degree Ceremony',
    '',
    'A solemn ceremony raising a Brother to the sublime degree of a Master Mason.',
    'third-degree-ceremony-2023',
    '2023-10-10 08:00:00+00'::timestamptz,
    '2023-10-10 11:00:00+00'::timestamptz,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0896'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    'degree-ceremony',
    'third',
    'dark',
    'craft',
    true,
    false,
    true,
    false,
    '2023-08-14 14:00:00+00'::timestamptz,
    '2023-08-31 14:00:00+00'::timestamptz
),
-- Masonic Education Night
(
    'd290f1ee-6c54-4b01-90e6-d701748f0852'::uuid,
    'Masonic Education Night',
    '',
    'Learn about the symbolism and history of Freemasonry from distinguished speakers.',
    'masonic-lecture-series-2023',
    '2023-09-25 09:00:00+00'::timestamptz,
    '2023-09-25 11:00:00+00'::timestamptz,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0896'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    'lecture',
    '',
    'dark',
    'craft',
    true,
    false,
    true,
    false,
    '2023-07-31 14:00:00+00'::timestamptz,
    '2023-08-14 14:00:00+00'::timestamptz
),
-- Annual Charity Gala
(
    'd290f1ee-6c54-4b01-90e6-d701748f0853'::uuid,
    'Annual Charity Gala',
    '',
    'A formal dinner raising funds for the Masonic charities of NSW & ACT.',
    'annual-charity-gala-2023',
    '2023-12-05 08:00:00+00'::timestamptz,
    '2023-12-05 12:00:00+00'::timestamptz,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0896'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    'charity',
    '',
    'black',
    'none',
    true,
    false,
    true,
    false,
    '2023-08-31 14:00:00+00'::timestamptz,
    '2023-09-30 14:00:00+00'::timestamptz
),
-- Grand Installation 2025
(
    'd290f1ee-6c54-4b01-90e6-d701748f0854'::uuid,
    'Grand Installation',
    'MW Bro Bernie Khristian Albano',
    'The United Grand Lodge of NSW & ACT cordially invites you to attend the Installation of MW Bro Bernie Khristian Albano as Grand Master.',
    'grand-installation-2025',
    '2025-05-15 04:00:00+00'::timestamptz,
    '2025-05-17 07:00:00+00'::timestamptz,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0896'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    'installation',
    '',
    'morning',
    'craft',
    true,
    false,
    true,
    true,
    '2025-05-19 01:12:40.162482+00'::timestamptz,
    '2025-05-19 01:12:40.162482+00'::timestamptz
)
ON CONFLICT (event_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    function_id = EXCLUDED.function_id,
    updated_at = NOW();

-- Insert event tickets from CSV data
-- Based on event_tickets_rows.csv structure
INSERT INTO event_tickets (
    event_ticket_id,
    event_id,
    name,
    description,
    price,
    total_capacity,
    available_count,
    reserved_count,
    sold_count,
    status,
    is_active,
    eligibility_criteria,
    created_at,
    updated_at
) VALUES 
-- Farewell Cruise Luncheon
(
    'bce41292-3662-44a7-85da-eeb1a1e89d8a'::uuid,
    '567fa008-40de-4f87-89f5-900933f898b2'::uuid,
    'Farewell Cruise Luncheon',
    '',
    75.00,
    150,
    150,
    0,
    0,
    'Active',
    true,
    '{"rules": []}'::jsonb,
    '2025-06-02 02:00:17.585068+00'::timestamptz,
    '2025-06-07 12:00:00+00'::timestamptz
),
-- Grand Proclamation Banquet - 3rd Floor
(
    'c3d4e5f6-a7b8-4923-cdef-345678901234'::uuid,
    '03a51924-1606-47c9-838d-9dc32657cd59'::uuid,
    'Grand Proclamation Banquet - 3rd Floor',
    '',
    115.00,
    30,
    30,
    0,
    0,
    'Active',
    true,
    '{"rules": []}'::jsonb,
    '2025-06-07 12:00:00+00'::timestamptz,
    '2025-06-07 12:00:00+00'::timestamptz
),
-- Grand Proclamation Banquet - Banquet Hall
(
    'fd12d7f0-f346-49bf-b1eb-0682ad226216'::uuid,
    '03a51924-1606-47c9-838d-9dc32657cd59'::uuid,
    'Grand Proclamation Banquet - Banquet Hall',
    '',
    115.00,
    320,
    320,
    0,
    0,
    'Active',
    true,
    '{"rules": []}'::jsonb,
    '2025-06-02 01:54:23.077909+00'::timestamptz,
    '2025-06-07 12:00:00+00'::timestamptz
),
-- Grand Proclamation Banquet - Marble Foyer
(
    'a1b2c3d4-e5f6-4789-abcd-ef1234567890'::uuid,
    '03a51924-1606-47c9-838d-9dc32657cd59'::uuid,
    'Grand Proclamation Banquet - Marble Foyer',
    '',
    115.00,
    102,
    102,
    0,
    0,
    'Active',
    true,
    '{"rules": []}'::jsonb,
    '2025-06-07 12:00:00+00'::timestamptz,
    '2025-06-07 12:00:00+00'::timestamptz
)
ON CONFLICT (event_ticket_id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    total_capacity = EXCLUDED.total_capacity,
    available_count = EXCLUDED.available_count,
    updated_at = NOW();

-- Insert packages from CSV data
-- Based on EventPackages_rows.csv structure
INSERT INTO packages (
    package_id,
    function_id,
    event_id,
    name,
    description,
    includes_description,
    package_price,
    is_active,
    registration_types,
    created_at,
    updated_at
) VALUES 
-- Full Package
(
    '4f1f5e3a-0b3b-4b0e-8b3b-9f4e8d0a9b3e'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    '307c2d85-72d5-48cf-ac94-082ca2a5d23d'::uuid,
    'Full Package',
    'Access to all events throughout the weekend',
    ARRAY['Welcome Reception (Friday)', 'Proclamation Ceremony (Saturday)', 'Gala Dinner (Saturday)', 'Thanksgiving Service (Sunday)', 'Farewell Lunch (Sunday)', 'Commemorative Gift Package'],
    350.00,
    true,
    ARRAY['individuals', 'lodges', 'delegations'],
    '2025-05-06 10:43:34.570449+00'::timestamptz,
    NOW()
),
-- Ceremony Only
(
    'a2e8c0b5-1c4c-4c1f-9c4c-8d0a9b3e4f1f'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    '307c2d85-72d5-48cf-ac94-082ca2a5d23d'::uuid,
    'Ceremony Only',
    'Access to the main Proclamation ceremony only',
    ARRAY['Proclamation Ceremony (Saturday)', 'Commemorative Program'],
    150.00,
    true,
    ARRAY['individuals', 'lodges', 'delegations'],
    '2025-05-06 10:43:34.570449+00'::timestamptz,
    NOW()
),
-- Complete Package
(
    'a9e3d210-7f65-4c8b-9d1a-f5b83e92c615'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    '307c2d85-72d5-48cf-ac94-082ca2a5d23d'::uuid,
    'Complete Package',
    'Includes all events (save $80)',
    ARRAY['Installation Ceremony', 'Grand Banquet', 'Farewell Brunch', 'City Tour'],
    420.00,
    true,
    ARRAY['individuals', 'lodges', 'delegations'],
    '2025-05-21 07:59:40.539025+00'::timestamptz,
    NOW()
),
-- Social Events
(
    'b3d9d1a4-2d5d-4d2e-ad5d-7c1b0a9b3e4f'::uuid,
    'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid,
    '307c2d85-72d5-48cf-ac94-082ca2a5d23d'::uuid,
    'Social Events',
    'Access to all social events (no ceremony)',
    ARRAY['Welcome Reception (Friday)', 'Gala Dinner (Saturday)', 'Farewell Lunch (Sunday)'],
    200.00,
    true,
    ARRAY['individuals', 'lodges', 'delegations'],
    '2025-05-06 10:43:34.570449+00'::timestamptz,
    NOW()
)
ON CONFLICT (package_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    package_price = EXCLUDED.package_price,
    function_id = EXCLUDED.function_id,
    updated_at = NOW();

-- Create some sample display scopes if they don't exist
INSERT INTO display_scopes (
    id,
    name,
    created_at
) VALUES 
(
    gen_random_uuid(),
    'public',
    NOW()
),
(
    gen_random_uuid(),
    'members_only',
    NOW()
),
(
    gen_random_uuid(),
    'lodge_members',
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Update function to include event IDs
UPDATE functions 
SET function_events = ARRAY[
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'd290f1ee-6c54-4b01-90e6-d701748f0852',
    'd290f1ee-6c54-4b01-90e6-d701748f0853',
    'd290f1ee-6c54-4b01-90e6-d701748f0854'
]::uuid[]
WHERE function_id = 'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid;

-- Create some website content for the homepage
INSERT INTO website_content (
    id,
    page_identifier,
    content_type,
    title,
    content,
    metadata,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'homepage',
    'hero_section',
    'Grand Installation 2025',
    'Join us for the Installation of MW Bro Bernie Khristian Albano as Grand Master of the United Grand Lodge of NSW & ACT.',
    '{"featured_function_id": "b290f1ee-6c54-4b01-90e6-d701748f0001"}'::jsonb,
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'homepage',
    'featured_function',
    'Grand Installation Weekend',
    'A special weekend celebrating the installation of our new Grand Master with ceremonies, banquets, and fellowship.',
    '{"function_id": "b290f1ee-6c54-4b01-90e6-d701748f0001", "button_text": "Register Now"}'::jsonb,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (page_identifier, content_type) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Commit the transaction
COMMIT;

-- Display summary of inserted data
SELECT 
    'Functions' as table_name,
    COUNT(*) as record_count
FROM functions
WHERE function_id = 'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid

UNION ALL

SELECT 
    'Events' as table_name,
    COUNT(*) as record_count
FROM events
WHERE function_id = 'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid

UNION ALL

SELECT 
    'Event Tickets' as table_name,
    COUNT(*) as record_count
FROM event_tickets

UNION ALL

SELECT 
    'Packages' as table_name,
    COUNT(*) as record_count
FROM packages
WHERE function_id = 'b290f1ee-6c54-4b01-90e6-d701748f0001'::uuid;