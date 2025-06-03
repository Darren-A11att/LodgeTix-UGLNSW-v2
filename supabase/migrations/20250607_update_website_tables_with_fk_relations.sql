-- Update Website Schema Tables with Foreign Key Relations
-- This migration updates the existing website schema tables to support
-- both direct data entry and inheritance from related database tables

-- Set search path to include the website schema
SET search_path = public, website;

-- Update Hero Content Table to support function relationship
ALTER TABLE website.hero_content 
ADD COLUMN function_id UUID REFERENCES public.functions(function_id) ON DELETE SET NULL,
ADD COLUMN use_function_data BOOLEAN DEFAULT false,
ADD COLUMN override_title TEXT,
ADD COLUMN override_description TEXT,
ADD COLUMN override_badge_text TEXT,
ADD COLUMN override_image_url TEXT,
ADD COLUMN cta_primary_text TEXT DEFAULT 'Get Tickets',
ADD COLUMN cta_primary_url TEXT,
ADD COLUMN cta_secondary_text TEXT DEFAULT 'Learn more',
ADD COLUMN cta_secondary_url TEXT DEFAULT '/functions',
ADD COLUMN show_location BOOLEAN DEFAULT true,
ADD COLUMN show_date_time BOOLEAN DEFAULT true;

-- Add navigation configuration to hero content
CREATE TABLE website.hero_navigation (
    navigation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    href TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Featured Events Configuration Table
CREATE TABLE website.featured_events_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_title TEXT DEFAULT 'Featured Events',
    section_description TEXT DEFAULT 'Experience the finest in Masonic tradition and fellowship. Join us for these carefully curated events that celebrate our heritage and strengthen our community bonds.',
    max_events INTEGER DEFAULT 2,
    cta_text TEXT DEFAULT 'View All Events',
    cta_url TEXT DEFAULT '/functions',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Featured Events Selection Table with FK to events
CREATE TABLE website.featured_events (
    featured_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(event_id) ON DELETE CASCADE,
    use_event_data BOOLEAN DEFAULT true,
    override_title TEXT,
    override_description TEXT,
    override_date TEXT,
    override_location TEXT,
    override_image_url TEXT,
    override_price TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Update sponsors section to add more configuration options
ALTER TABLE website.sponsors 
ADD COLUMN url TEXT,
ADD COLUMN section_heading TEXT DEFAULT 'Proudly supported by Masonic organizations across NSW & ACT';

-- Update location content to support location relationship
ALTER TABLE website.location_content 
ADD COLUMN location_id UUID REFERENCES public.locations(location_id) ON DELETE SET NULL,
ADD COLUMN use_location_data BOOLEAN DEFAULT false,
ADD COLUMN override_heading TEXT,
ADD COLUMN override_subheading TEXT,
ADD COLUMN override_description TEXT,
ADD COLUMN override_image_url TEXT;

-- Add indexes for new foreign key columns
CREATE INDEX idx_hero_content_function_id ON website.hero_content(function_id);
CREATE INDEX idx_featured_events_event_id ON website.featured_events(event_id);
CREATE INDEX idx_featured_events_display_order ON website.featured_events(display_order) WHERE is_active = true;
CREATE INDEX idx_location_content_location_id ON website.location_content(location_id);
CREATE INDEX idx_hero_navigation_display_order ON website.hero_navigation(display_order) WHERE is_active = true;

-- Add updated_at triggers for new tables
CREATE TRIGGER update_hero_navigation_updated_at 
    BEFORE UPDATE ON website.hero_navigation 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

CREATE TRIGGER update_featured_events_config_updated_at 
    BEFORE UPDATE ON website.featured_events_config 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

CREATE TRIGGER update_featured_events_updated_at 
    BEFORE UPDATE ON website.featured_events 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

-- Enable Row Level Security on new tables
ALTER TABLE website.hero_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.featured_events_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.featured_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
-- Hero Navigation Policies
CREATE POLICY "Hero navigation is viewable by everyone" 
    ON website.hero_navigation FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Hero navigation is editable by authenticated users" 
    ON website.hero_navigation FOR ALL 
    USING (auth.role() = 'authenticated');

-- Featured Events Config Policies
CREATE POLICY "Featured events config is viewable by everyone" 
    ON website.featured_events_config FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Featured events config is editable by authenticated users" 
    ON website.featured_events_config FOR ALL 
    USING (auth.role() = 'authenticated');

-- Featured Events Policies
CREATE POLICY "Featured events are viewable by everyone" 
    ON website.featured_events FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Featured events are editable by authenticated users" 
    ON website.featured_events FOR ALL 
    USING (auth.role() = 'authenticated');

-- Add table comments for documentation
COMMENT ON TABLE website.hero_navigation IS 
'Stores navigation menu items for the hero section header';

COMMENT ON TABLE website.featured_events_config IS 
'Configuration for the featured events section including titles and display settings';

COMMENT ON TABLE website.featured_events IS 
'Stores which events are featured on the homepage with optional override data';

COMMENT ON COLUMN website.hero_content.use_function_data IS 
'When true, hero section will display data from the linked function instead of static content';

COMMENT ON COLUMN website.hero_content.override_title IS 
'Override title to use instead of function title when use_function_data is true';

COMMENT ON COLUMN website.featured_events.use_event_data IS 
'When true, display data from the linked event; when false, use override fields';

-- Insert default navigation items
INSERT INTO website.hero_navigation (name, href, display_order) VALUES 
    ('Events', '/functions', 1),
    ('About', '/about', 2),
    ('Contact', '/contact', 3),
    ('Help', '/help', 4);

-- Insert default featured events configuration
INSERT INTO website.featured_events_config DEFAULT VALUES;

-- Create views to simplify data access with inheritance logic
CREATE OR REPLACE VIEW website.hero_content_display AS
SELECT 
    hc.hero_content_id,
    CASE 
        WHEN hc.use_function_data AND f.function_id IS NOT NULL THEN
            COALESCE(hc.override_title, f.name)
        ELSE 
            hc.title
    END AS display_title,
    CASE 
        WHEN hc.use_function_data AND f.function_id IS NOT NULL THEN
            COALESCE(hc.override_description, f.description)
        ELSE 
            hc.description
    END AS display_description,
    CASE 
        WHEN hc.use_function_data AND f.function_id IS NOT NULL THEN
            COALESCE(hc.override_badge_text, o.name)
        ELSE 
            hc.badge_text
    END AS display_badge_text,
    CASE 
        WHEN hc.use_function_data AND f.function_id IS NOT NULL THEN
            COALESCE(hc.override_image_url, f.image_url)
        ELSE 
            hc.background_image_url
    END AS display_image_url,
    hc.cta_primary_text,
    CASE 
        WHEN hc.use_function_data AND f.function_id IS NOT NULL THEN
            COALESCE(hc.cta_primary_url, '/functions/' || f.slug || '/register')
        ELSE 
            hc.cta_primary_url
    END AS display_cta_primary_url,
    hc.cta_secondary_text,
    hc.cta_secondary_url,
    hc.show_location,
    hc.show_date_time,
    f.start_date AS function_date,
    l.name AS location_name,
    hc.is_active
FROM website.hero_content hc
LEFT JOIN public.functions f ON hc.function_id = f.function_id
LEFT JOIN public.organisations o ON f.organiser_id = o.organisation_id
LEFT JOIN public.locations l ON f.location_id = l.location_id;

CREATE OR REPLACE VIEW website.featured_events_display AS
SELECT 
    fe.featured_event_id,
    fe.display_order,
    CASE 
        WHEN fe.use_event_data AND e.event_id IS NOT NULL THEN
            COALESCE(fe.override_title, e.title)
        ELSE 
            fe.override_title
    END AS display_title,
    CASE 
        WHEN fe.use_event_data AND e.event_id IS NOT NULL THEN
            COALESCE(fe.override_description, e.description)
        ELSE 
            fe.override_description
    END AS display_description,
    CASE 
        WHEN fe.use_event_data AND e.event_id IS NOT NULL THEN
            COALESCE(fe.override_date, to_char(e.event_start, 'Day, DD Month YYYY'))
        ELSE 
            fe.override_date
    END AS display_date,
    CASE 
        WHEN fe.use_event_data AND e.event_id IS NOT NULL THEN
            COALESCE(fe.override_location, l.name)
        ELSE 
            fe.override_location
    END AS display_location,
    CASE 
        WHEN fe.use_event_data AND e.event_id IS NOT NULL THEN
            COALESCE(fe.override_image_url, e.image_url)
        ELSE 
            fe.override_image_url
    END AS display_image_url,
    fe.override_price AS display_price,
    e.slug AS event_slug,
    f.slug AS function_slug,
    fe.is_active
FROM website.featured_events fe
LEFT JOIN public.events e ON fe.event_id = e.event_id
LEFT JOIN public.functions f ON e.function_id = f.function_id
LEFT JOIN public.locations l ON e.location_id = l.location_id
WHERE fe.is_active = true
ORDER BY fe.display_order;

CREATE OR REPLACE VIEW website.location_content_display AS
SELECT 
    lc.location_content_id,
    CASE 
        WHEN lc.use_location_data AND l.location_id IS NOT NULL THEN
            COALESCE(lc.override_heading, lc.heading)
        ELSE 
            lc.heading
    END AS display_heading,
    CASE 
        WHEN lc.use_location_data AND l.location_id IS NOT NULL THEN
            COALESCE(lc.override_subheading, lc.subheading)
        ELSE 
            lc.subheading
    END AS display_subheading,
    CASE 
        WHEN lc.use_location_data AND l.location_id IS NOT NULL THEN
            COALESCE(lc.override_description, lc.description)
        ELSE 
            lc.description
    END AS display_description,
    CASE 
        WHEN lc.use_location_data AND l.location_id IS NOT NULL THEN
            COALESCE(lc.override_image_url, lc.image_url)
        ELSE 
            lc.image_url
    END AS display_image_url,
    lc.is_active
FROM website.location_content lc
LEFT JOIN public.locations l ON lc.location_id = l.location_id;

-- Grant appropriate permissions on views
GRANT SELECT ON website.hero_content_display TO anon, authenticated;
GRANT SELECT ON website.featured_events_display TO anon, authenticated;
GRANT SELECT ON website.location_content_display TO anon, authenticated;