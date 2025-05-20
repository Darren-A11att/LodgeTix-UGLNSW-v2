-- =============================================================================
-- LodgeTix Event Schema Enhancement
-- =============================================================================
-- This script enhances the existing Events table with additional fields and data
-- It preserves all existing data and relationships while adding new functionality
-- 
-- Author: Claude
-- Date: 2023-05-20
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SECTION 1: ALTER TABLE - Add missing columns
-- =============================================================================
DO $$
BEGIN
  -- New descriptive fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'subtitle')
    THEN ALTER TABLE public."Events" ADD COLUMN subtitle TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'degree_type')
    THEN ALTER TABLE public."Events" ADD COLUMN degree_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'dress_code')
    THEN ALTER TABLE public."Events" ADD COLUMN dress_code TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'regalia')
    THEN ALTER TABLE public."Events" ADD COLUMN regalia TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'regalia_description')
    THEN ALTER TABLE public."Events" ADD COLUMN regalia_description TEXT;
  END IF;

  -- Organizer information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'organizer_name')
    THEN ALTER TABLE public."Events" ADD COLUMN organizer_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'organizer_contact')
    THEN ALTER TABLE public."Events" ADD COLUMN organizer_contact JSONB;
  END IF;

  -- Publishing status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'is_published')
    THEN ALTER TABLE public."Events" ADD COLUMN is_published BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'publish_option')
    THEN ALTER TABLE public."Events" ADD COLUMN publish_option TEXT;
  END IF;

  -- Rich content fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'sections')
    THEN ALTER TABLE public."Events" ADD COLUMN sections JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'attendance')
    THEN ALTER TABLE public."Events" ADD COLUMN attendance JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'documents')
    THEN ALTER TABLE public."Events" ADD COLUMN documents JSONB;
  END IF;

  -- Relationships
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'related_events')
    THEN ALTER TABLE public."Events" ADD COLUMN related_events UUID[];
  END IF;

  -- Enhanced location data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Events' AND column_name = 'location_json')
    THEN ALTER TABLE public."Events" ADD COLUMN location_json JSONB;
  END IF;
END $$;

-- =============================================================================
-- SECTION 2: Data Migration - Update existing data
-- =============================================================================

-- Set is_published based on featured for existing records
UPDATE public."Events" 
SET is_published = featured 
WHERE is_published IS NULL;

-- Set location_json based on existing location field
UPDATE public."Events" 
SET location_json = jsonb_build_object('name', location)
WHERE location IS NOT NULL AND location_json IS NULL;

-- Add slug uniqueness constraint if not already present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Events' AND column_name = 'slug'
  ) AND NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'events_slug_unique'
  ) THEN
    ALTER TABLE public."Events" ADD CONSTRAINT events_slug_unique UNIQUE (slug);
    
    -- Ensure slug is NOT NULL
    ALTER TABLE public."Events" ALTER COLUMN slug SET NOT NULL;
  END IF;
END $$;

-- =============================================================================
-- SECTION 3: Enhance Grand Proclamation Event
-- =============================================================================

-- Update the main Grand Proclamation event with rich content
UPDATE public."Events"
SET 
  regalia = 'Full regalia according to rank',
  dress_code = 'Morning suit or dark lounge suit',
  degree_type = 'Master Mason',
  sections = jsonb_build_object(
    'about', 'The formal Proclamation ceremony of the Grand Master and officers of the United Grand Lodge of NSW & ACT. This prestigious weekend brings together Freemasons from around the world for a series of ceremonial and social events.',
    'schedule', jsonb_build_array(
      jsonb_build_object(
        'date', '2025-09-11',
        'items', jsonb_build_array(
          jsonb_build_object(
            'time', '2:00 PM',
            'title', 'Registration & Welcome Pack Collection',
            'location', 'Foyer, Sydney Masonic Centre',
            'description', 'Collect your registration package, event tickets, name badge, and commemorative items.'
          ),
          jsonb_build_object(
            'time', '6:00 PM',
            'title', 'Welcome Reception',
            'location', 'Grand Ballroom, Sydney Masonic Centre',
            'description', 'Meet and greet fellow attendees from around the world in a relaxed atmosphere.'
          )
        )
      ),
      jsonb_build_object(
        'date', '2025-09-12',
        'items', jsonb_build_array(
          jsonb_build_object(
            'time', '10:00 AM',
            'title', 'Grand Officers Preparation Meeting',
            'location', 'Meeting Room 3, Sydney Masonic Centre',
            'description', 'Rehearsal and final instructions for Grand Officers.'
          ),
          jsonb_build_object(
            'time', '2:00 PM',
            'title', E'Partners\' Harbour Cruise',
            'location', 'Sydney Harbour',
            'description', 'Harbour cruise with lunch and sightseeing for partners.'
          ),
          jsonb_build_object(
            'time', '7:00 PM',
            'title', 'Grand Proclamation Gala Dinner',
            'location', 'International Convention Centre, Sydney',
            'description', 'A formal black-tie dinner celebrating the Grand Proclamation.'
          )
        )
      ),
      jsonb_build_object(
        'date', '2025-09-13',
        'items', jsonb_build_array(
          jsonb_build_object(
            'time', '10:00 AM',
            'title', 'Grand Proclamation Ceremony',
            'location', 'Grand Lodge, Sydney Masonic Centre',
            'description', 'The formal ceremony for the Proclamation of the Grand Master and his officers.'
          ),
          jsonb_build_object(
            'time', '2:00 PM',
            'title', E'Thanksgiving Service',
            'location', E'St. Andrew\'s Cathedral, Sydney',
            'description', 'A non-denominational service of thanksgiving.'
          )
        )
      ),
      jsonb_build_object(
        'date', '2025-09-14',
        'items', jsonb_build_array(
          jsonb_build_object(
            'time', '11:30 AM',
            'title', 'Farewell Lunch',
            'location', 'Sydney Masonic Centre',
            'description', 'Conclude your Grand Proclamation weekend with a relaxed lunch.'
          )
        )
      )
    ),
    'details', jsonb_build_array(
      jsonb_build_object(
        'title', 'Dress Code',
        'content', 'Grand Proclamation Ceremony: Morning Suit or Dark Lounge Suit with Full Regalia according to rank.\n\nGrand Proclamation Gala Dinner: Black Tie with Miniature Jewels only.\n\nFarewell Lunch: Smart Casual, no regalia.'
      ),
      jsonb_build_object(
        'title', 'Regalia Requirements',
        'content', 'Grand Officers: Full dress regalia with chain collars (if applicable).\n\nPast Grand Officers: Full dress regalia with appropriate past rank jewels.\n\nWorshipful Masters: Full dress regalia with collar and jewel of office.\n\nMaster Masons: Craft regalia (apron, collar, and jewel).'
      ),
      jsonb_build_object(
        'title', 'Visitors from Other Jurisdictions',
        'content', 'Visitors from other Grand Lodges are most welcome and should wear the regalia of their own jurisdiction. Please bring your Grand Lodge certificate for registration.'
      )
    )
  ),
  attendance = jsonb_build_object(
    'expected', 500,
    'description', '500+ Brethren'
  ),
  documents = jsonb_build_array(
    jsonb_build_object(
      'title', 'Proclamation Program',
      'fileUrl', '#',
      'documentType', 'Program'
    ),
    jsonb_build_object(
      'title', 'Accommodation Guide',
      'fileUrl', '#',
      'documentType', 'Guide'
    ),
    jsonb_build_object(
      'title', 'Sydney Visitor Guide',
      'fileUrl', '#',
      'documentType', 'Guide'
    )
  ),
  organizer_name = 'United Grand Lodge of NSW & ACT',
  organizer_contact = jsonb_build_object(
    'email', 'events@masons.org.au',
    'website', 'https://masons.org.au'
  )
WHERE id = '307c2d85-72d5-48cf-ac94-082ca2a5d23d';  -- Grand Proclamation 2025

-- Link all related events to the main Grand Proclamation event
UPDATE public."Events"
SET related_events = ARRAY[
  '03a51924-1606-47c9-838d-9dc32657cd59'::uuid,  -- Grand Proclamation Gala Dinner
  '6c12952b-7cf3-4d6a-81bd-1ac3b7ff7076'::uuid,  -- Grand Proclamation Ceremony
  'e842bdb2-aff8-46d8-a347-bf50840fff13'::uuid,  -- Welcome Reception
  'fe60bd57-5ce9-420a-bbf2-402c49c640f4'::uuid,  -- Registration
  'd25af559-60a2-4c9c-8c82-4209672dea36'::uuid,  -- Thanksgiving Service
  '567fa008-40de-4f87-89f5-900933f898b2'::uuid,  -- Farewell Lunch
  '3ec4a9cc-d32e-4bea-b57e-b3c8327aac43'::uuid,  -- Grand Officers Meeting
  'ee59fbbb-df27-499d-a81b-29b9ed8c8c49'::uuid   -- Partners' Harbour Cruise
]
WHERE id = '307c2d85-72d5-48cf-ac94-082ca2a5d23d';  -- Grand Proclamation 2025

-- =============================================================================
-- SECTION 4: Create formatted_events view
-- =============================================================================

-- Create a view with formatted date/time fields
CREATE OR REPLACE VIEW public.formatted_events AS
SELECT 
  e.*,
  -- Formatted date (e.g., "Sunday, 27 April 25")
  TO_CHAR(e."eventStart" AT TIME ZONE 'UTC', 'Day, DD Month YY') AS day_formatted,
  -- Short date (e.g., "27-04-2025")
  TO_CHAR(e."eventStart" AT TIME ZONE 'UTC', 'DD-MM-YYYY') AS date_formatted,
  -- Formatted time (e.g., "06:00 PM")
  TO_CHAR(e."eventStart" AT TIME ZONE 'UTC', 'HH12:MI AM') AS time_formatted,
  -- End time (e.g., "09:00 PM")
  TO_CHAR(e."eventEnd" AT TIME ZONE 'UTC', 'HH12:MI AM') AS until_formatted,
  -- Duration in hours
  EXTRACT(EPOCH FROM (e."eventEnd" - e."eventStart"))/3600 AS duration_hours,
  -- Calculate multi-day status
  (e."eventEnd" > e."eventStart" + INTERVAL '1 day') AS is_multi_day_calc
FROM 
  public."Events" e;

-- Add descriptive comment to the Events table
COMMENT ON TABLE public."Events" IS 'Primary events table for LodgeTix platform with support for new fields';

-- =============================================================================
-- SECTION 5: Set permissions
-- =============================================================================

-- Grant appropriate permissions (uncomment if needed)
-- GRANT SELECT ON public."Events" TO anon;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public."Events" TO authenticated;
-- GRANT SELECT ON public.formatted_events TO anon, authenticated;