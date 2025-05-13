-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Events table with UUID primary key and slug field
CREATE TABLE IF NOT EXISTS public."Events" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  event_start TIMESTAMPTZ NOT NULL,
  event_end TIMESTAMPTZ,
  location TEXT,
  image_url TEXT,
  type TEXT,
  featured BOOLEAN DEFAULT false,
  is_multi_day BOOLEAN DEFAULT false,
  parent_event_id UUID REFERENCES public."Events"(id),
  event_includes TEXT[],
  important_information TEXT[],
  latitude FLOAT,
  longitude FLOAT,
  is_purchasable_individually BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS events_slug_idx ON public."Events"(slug);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_modtime
BEFORE UPDATE ON public."Events"
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create function to generate slugs from titles
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
  base_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Create base slug from title
  base_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[^\w\s-]', '', 'g'), -- Remove non-word chars
      '[\s_-]+', '-', 'g'                        -- Replace spaces with hyphens
    )
  );
  
  -- Trim leading/trailing hyphens
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Initial slug is the base slug
  slug := base_slug;
  
  -- Check if slug exists and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public."Events" WHERE slug = slug) LOOP
    slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Create a view for formatted events (includes calculated fields)
CREATE OR REPLACE VIEW public.formatted_events AS
SELECT 
  e.id,
  e.slug,
  e.title,
  e.description,
  e.event_start,
  e.event_end,
  e.location,
  e.image_url,
  e.type,
  e.featured,
  e.is_multi_day,
  e.parent_event_id,
  e.event_includes,
  e.important_information,
  e.latitude,
  e.longitude,
  e.is_purchasable_individually,
  e.created_at,
  e.updated_at,
  -- Formatted date (e.g., "Sunday, 27 April 25")
  TO_CHAR(e.event_start AT TIME ZONE 'UTC', 'Day, DD Month YY') AS day,
  -- Short date (e.g., "27-04-2025")
  TO_CHAR(e.event_start AT TIME ZONE 'UTC', 'DD-MM-YYYY') AS date,
  -- Formatted time (e.g., "06:00 PM")
  TO_CHAR(e.event_start AT TIME ZONE 'UTC', 'HH12:MI AM') AS time,
  -- End time (e.g., "09:00 PM")
  TO_CHAR(e.event_end AT TIME ZONE 'UTC', 'HH12:MI AM') AS until,
  -- For time comparisons (e.g., "19:00")
  TO_CHAR(e.event_start AT TIME ZONE 'UTC', 'HH24:MI') AS start_time_formatted,
  -- For time comparisons (e.g., "21:00")
  TO_CHAR(e.event_end AT TIME ZONE 'UTC', 'HH24:MI') AS end_time_formatted
FROM 
  public."Events" e;

-- Create a migration function to convert legacy string IDs to UUIDs with slugs
CREATE OR REPLACE FUNCTION migrate_legacy_event_ids()
RETURNS VOID AS $$
DECLARE
  event_rec RECORD;
  new_uuid UUID;
BEGIN
  -- This function would be implemented to handle migration of existing data
  -- Process each event in a temporary legacy events table
  FOR event_rec IN SELECT * FROM temp_legacy_events LOOP
    -- Generate UUID for this event
    new_uuid := uuid_generate_v4();
    
    -- Insert event with new UUID and use legacy ID as slug
    INSERT INTO public."Events" (
      id, 
      slug,
      title,
      description,
      event_start,
      event_end,
      location,
      image_url,
      type,
      featured
    ) VALUES (
      new_uuid,
      event_rec.legacy_id, -- Use legacy ID as the slug
      event_rec.title,
      event_rec.description,
      event_rec.event_start,
      event_rec.event_end,
      event_rec.location,
      event_rec.image_url,
      event_rec.type,
      event_rec.featured
    );
    
    -- Record the mapping for reference
    INSERT INTO legacy_id_mapping (legacy_id, uuid) 
    VALUES (event_rec.legacy_id, new_uuid);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create table for storing legacy ID to UUID mappings (for transition period)
CREATE TABLE IF NOT EXISTS public.legacy_id_mapping (
  legacy_id TEXT PRIMARY KEY,
  uuid UUID NOT NULL REFERENCES public."Events"(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant appropriate permissions for the tables
ALTER TABLE public."Events" ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
CREATE POLICY "Allow authenticated read access to events" 
  ON public."Events" FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create policy for organizers to manage their events
CREATE POLICY "Allow organizers to manage their events" 
  ON public."Events" FOR ALL
  USING (auth.uid() IN (
    SELECT organizer_id FROM event_organizers WHERE event_id = id
  ));

-- Admin access policy
CREATE POLICY "Allow admins full access to events" 
  ON public."Events" FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM administrators
  ));