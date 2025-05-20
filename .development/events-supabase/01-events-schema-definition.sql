-- Create the events schema
CREATE SCHEMA IF NOT EXISTS events;

-- Create the main events table in the events schema
CREATE TABLE IF NOT EXISTS events.events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Core event fields
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  
  -- Time fields
  event_start TIMESTAMP WITH TIME ZONE NOT NULL,
  event_end TIMESTAMP WITH TIME ZONE,
  
  -- Location
  location JSONB, -- Store structured location data
  
  -- Categories and types
  category TEXT,
  type TEXT,
  degree_type TEXT,
  
  -- Event details
  dress_code TEXT,
  regalia TEXT,
  regalia_description TEXT,
  image_url TEXT,
  
  -- Organization
  organizer_id UUID,
  organizer_name TEXT,
  organizer_contact JSONB,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  publish_option TEXT,
  featured BOOLEAN DEFAULT false,
  
  -- Relationships
  parent_event_id UUID REFERENCES events.events(id),
  
  -- Arrays and JSONB
  eligibility_requirements TEXT[],
  sections JSONB, -- about, schedule, details
  attendance JSONB,
  documents JSONB,
  related_events UUID[],
  event_includes TEXT[],
  important_information TEXT[],
  
  -- Legacy support
  legacy_id TEXT,
  
  -- Additional fields
  latitude NUMERIC,
  longitude NUMERIC,
  is_multi_day BOOLEAN GENERATED ALWAYS AS (event_end > event_start + INTERVAL '1 day') STORED,
  is_purchasable_individually BOOLEAN DEFAULT true,
  
  CONSTRAINT events_pkey PRIMARY KEY (id)
);

-- Create indexes on the events.events table
CREATE INDEX IF NOT EXISTS events_slug_idx ON events.events(slug);
CREATE INDEX IF NOT EXISTS events_event_start_idx ON events.events(event_start);
CREATE INDEX IF NOT EXISTS events_category_idx ON events.events(category);
CREATE INDEX IF NOT EXISTS events_is_published_idx ON events.events(is_published);
CREATE INDEX IF NOT EXISTS events_featured_idx ON events.events(featured);
CREATE INDEX IF NOT EXISTS events_parent_event_id_idx ON events.events(parent_event_id);
CREATE INDEX IF NOT EXISTS events_legacy_id_idx ON events.events(legacy_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION events.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_modtime
BEFORE UPDATE ON events.events
FOR EACH ROW
EXECUTE FUNCTION events.update_modified_column();

-- Create a view for formatted event dates/times
CREATE OR REPLACE VIEW events.formatted_events AS
SELECT 
  e.*,
  -- Formatted date (e.g., "Sunday, 27 April 25")
  TO_CHAR(e.event_start, 'Day, DD Month YY') AS day_formatted,
  -- Short date (e.g., "27-04-2025")
  TO_CHAR(e.event_start, 'DD-MM-YYYY') AS date_formatted,
  -- Formatted time (e.g., "06:00 PM")
  TO_CHAR(e.event_start, 'HH12:MI AM') AS time_formatted,
  -- End time (e.g., "09:00 PM")
  TO_CHAR(e.event_end, 'HH12:MI AM') AS until_formatted,
  -- Duration in hours
  EXTRACT(EPOCH FROM (e.event_end - e.event_start))/3600 AS duration_hours
FROM 
  events.events e;

-- Row Level Security for events.events
ALTER TABLE events.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view published events" 
  ON events.events FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Authenticated users can view all events" 
  ON events.events FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all events" 
  ON events.events FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));

-- Grant permissions
GRANT USAGE ON SCHEMA events TO anon, authenticated;
GRANT SELECT ON events.events TO anon;
GRANT ALL ON events.events TO authenticated;
GRANT SELECT ON events.formatted_events TO anon, authenticated;