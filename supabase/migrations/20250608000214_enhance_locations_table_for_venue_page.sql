-- Migration: Enhance locations table for venue page
-- Date: 2025-01-07
-- Purpose: Add missing columns for comprehensive venue information display

-- Add missing contact and description columns
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS description TEXT;

-- Add venue information columns
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS parking_info TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS public_transport_info TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS accessibility_info TEXT;

-- Add image and maps support columns
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS google_maps_embed_url TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS google_maps_place_id TEXT;

-- Add operating hours and additional venue details
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS venue_features TEXT[];
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS dress_code TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.locations.phone IS 'Venue contact phone number';
COMMENT ON COLUMN public.locations.email IS 'Venue contact email address';
COMMENT ON COLUMN public.locations.website IS 'Venue official website URL';
COMMENT ON COLUMN public.locations.description IS 'Venue description and overview';
COMMENT ON COLUMN public.locations.parking_info IS 'Parking availability and instructions';
COMMENT ON COLUMN public.locations.public_transport_info IS 'Public transport access information';
COMMENT ON COLUMN public.locations.accessibility_info IS 'Accessibility features and accommodations';
COMMENT ON COLUMN public.locations.image_urls IS 'Array of venue image URLs stored in Supabase Storage';
COMMENT ON COLUMN public.locations.google_maps_embed_url IS 'Google Maps embed URL for venue';
COMMENT ON COLUMN public.locations.google_maps_place_id IS 'Google Maps Place ID for API integration';
COMMENT ON COLUMN public.locations.operating_hours IS 'Venue operating hours in JSON format';
COMMENT ON COLUMN public.locations.venue_features IS 'Array of venue features and amenities';
COMMENT ON COLUMN public.locations.dress_code IS 'Venue dress code requirements';

-- Create index for improved query performance
CREATE INDEX IF NOT EXISTS idx_locations_place_name ON public.locations(place_name);
CREATE INDEX IF NOT EXISTS idx_locations_google_place_id ON public.locations(google_maps_place_id);

-- Update RLS policies to ensure proper access
-- Allow public read access for venue information
DROP POLICY IF EXISTS "Allow public read access to venue information" ON public.locations;
CREATE POLICY "Allow public read access to venue information" ON public.locations
    FOR SELECT USING (true);

-- Allow authenticated users to update venue information (for organizers)
DROP POLICY IF EXISTS "Allow authenticated users to update venue information" ON public.locations;
CREATE POLICY "Allow authenticated users to update venue information" ON public.locations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow service role full access
DROP POLICY IF EXISTS "Allow service role full access to locations" ON public.locations;
CREATE POLICY "Allow service role full access to locations" ON public.locations
    FOR ALL USING (auth.role() = 'service_role');