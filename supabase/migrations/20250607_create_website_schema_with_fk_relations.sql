-- Create Website Schema and Homepage Section Tables with Foreign Key Relations
-- This migration creates a dedicated schema for website content management
-- with tables for each homepage section that support both static content
-- and dynamic content from related database tables

-- Create the website schema
CREATE SCHEMA IF NOT EXISTS website;

-- Set search path to include the website schema
SET search_path = public, website;

-- Create update timestamp function in website schema
CREATE OR REPLACE FUNCTION website.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Table 1: Hero Content with Function Relationship
CREATE TABLE website.hero_content (
    hero_content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Static content fields
    title TEXT NOT NULL DEFAULT 'Welcome to LodgeTix',
    description TEXT NOT NULL DEFAULT 'Your premier destination for Masonic events and ticketing.',
    badge_text TEXT DEFAULT 'United Grand Lodge of NSW & ACT official ticketing platform',
    background_image_url TEXT DEFAULT '/placeholder.svg?height=800&width=800',
    -- Function relationship
    function_id UUID REFERENCES public.functions(function_id) ON DELETE SET NULL,
    use_function_data BOOLEAN DEFAULT false,
    -- Override fields for when using function data
    override_title TEXT,
    override_description TEXT,
    override_badge_text TEXT,
    override_image_url TEXT,
    -- CTA configuration
    cta_primary_text TEXT DEFAULT 'Get Tickets',
    cta_primary_url TEXT,
    cta_secondary_text TEXT DEFAULT 'Learn more',
    cta_secondary_url TEXT DEFAULT '/functions',
    -- Display options
    show_location BOOLEAN DEFAULT true,
    show_date_time BOOLEAN DEFAULT true,
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 2: Hero Navigation Items
CREATE TABLE website.hero_navigation (
    navigation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    href TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 3: Sponsors with Enhanced Configuration
CREATE TABLE website.sponsors (
    sponsor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    url TEXT,
    display_order INTEGER DEFAULT 0,
    section_heading TEXT DEFAULT 'Proudly supported by Masonic organizations across NSW & ACT',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 4: Featured Events Configuration
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

-- Table 5: Featured Events with Event Relationship
CREATE TABLE website.featured_events (
    featured_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Event relationship
    event_id UUID REFERENCES public.events(event_id) ON DELETE CASCADE,
    use_event_data BOOLEAN DEFAULT true,
    -- Override fields for custom content
    override_title TEXT,
    override_description TEXT,
    override_date TEXT,
    override_location TEXT,
    override_image_url TEXT,
    override_price TEXT,
    -- Display configuration
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 6: Location Content with Location Relationship
CREATE TABLE website.location_content (
    location_content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Static content fields
    heading TEXT NOT NULL DEFAULT 'Experience Excellence',
    subheading TEXT NOT NULL DEFAULT 'Premium Venues, Perfect Experiences',
    description TEXT NOT NULL DEFAULT 'Our events are hosted at carefully selected venues throughout NSW & ACT.',
    image_url TEXT NOT NULL DEFAULT '/placeholder.svg?height=600&width=800&text=Lodge+Hall',
    -- Location relationship
    location_id UUID REFERENCES public.locations(location_id) ON DELETE SET NULL,
    use_location_data BOOLEAN DEFAULT false,
    -- Override fields for when using location data
    override_heading TEXT,
    override_subheading TEXT,
    override_description TEXT,
    override_image_url TEXT,
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 7: Location Features
CREATE TABLE website.location_features (
    location_feature_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL, -- e.g., 'MapPinIcon', 'ClockIcon', 'UserGroupIcon'
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 8: CTA Content
CREATE TABLE website.cta_content (
    cta_content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heading TEXT NOT NULL DEFAULT 'Join Our Community',
    description TEXT NOT NULL DEFAULT 'Become part of a tradition that spans centuries.',
    secondary_description TEXT,
    button_text TEXT DEFAULT 'Explore Events',
    button_url TEXT DEFAULT '/functions',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 9: CTA Images
CREATE TABLE website.cta_images (
    cta_image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alt_text TEXT NOT NULL,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    image_position TEXT CHECK (image_position IN ('main', 'secondary', 'tertiary', 'quaternary')) DEFAULT 'main',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_hero_content_function_id ON website.hero_content(function_id);
CREATE INDEX idx_hero_content_active ON website.hero_content(is_active);
CREATE INDEX idx_hero_navigation_display_order ON website.hero_navigation(display_order) WHERE is_active = true;
CREATE INDEX idx_sponsors_display_order ON website.sponsors(display_order) WHERE is_active = true;
CREATE INDEX idx_featured_events_event_id ON website.featured_events(event_id);
CREATE INDEX idx_featured_events_display_order ON website.featured_events(display_order) WHERE is_active = true;
CREATE INDEX idx_location_content_location_id ON website.location_content(location_id);
CREATE INDEX idx_location_content_active ON website.location_content(is_active);
CREATE INDEX idx_location_features_display_order ON website.location_features(display_order) WHERE is_active = true;
CREATE INDEX idx_cta_content_active ON website.cta_content(is_active);
CREATE INDEX idx_cta_images_display_order ON website.cta_images(display_order) WHERE is_active = true;

-- Add updated_at triggers for automatic timestamp updates
CREATE TRIGGER update_hero_content_updated_at 
    BEFORE UPDATE ON website.hero_content 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

CREATE TRIGGER update_hero_navigation_updated_at 
    BEFORE UPDATE ON website.hero_navigation 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

CREATE TRIGGER update_sponsors_updated_at 
    BEFORE UPDATE ON website.sponsors 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

CREATE TRIGGER update_featured_events_config_updated_at 
    BEFORE UPDATE ON website.featured_events_config 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

CREATE TRIGGER update_featured_events_updated_at 
    BEFORE UPDATE ON website.featured_events 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

CREATE TRIGGER update_location_content_updated_at 
    BEFORE UPDATE ON website.location_content 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

CREATE TRIGGER update_location_features_updated_at 
    BEFORE UPDATE ON website.location_features 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

CREATE TRIGGER update_cta_content_updated_at 
    BEFORE UPDATE ON website.cta_content 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

CREATE TRIGGER update_cta_images_updated_at 
    BEFORE UPDATE ON website.cta_images 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE website.hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.hero_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.featured_events_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.featured_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.location_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.location_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.cta_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.cta_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access and authenticated write access
-- Hero Content Policies
CREATE POLICY "Hero content is viewable by everyone" 
    ON website.hero_content FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Hero content is editable by authenticated users" 
    ON website.hero_content FOR ALL 
    USING (auth.role() = 'authenticated');

-- Hero Navigation Policies
CREATE POLICY "Hero navigation is viewable by everyone" 
    ON website.hero_navigation FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Hero navigation is editable by authenticated users" 
    ON website.hero_navigation FOR ALL 
    USING (auth.role() = 'authenticated');

-- Sponsors Policies
CREATE POLICY "Sponsors are viewable by everyone" 
    ON website.sponsors FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Sponsors are editable by authenticated users" 
    ON website.sponsors FOR ALL 
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

-- Location Content Policies
CREATE POLICY "Location content is viewable by everyone" 
    ON website.location_content FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Location content is editable by authenticated users" 
    ON website.location_content FOR ALL 
    USING (auth.role() = 'authenticated');

-- Location Features Policies
CREATE POLICY "Location features are viewable by everyone" 
    ON website.location_features FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Location features are editable by authenticated users" 
    ON website.location_features FOR ALL 
    USING (auth.role() = 'authenticated');

-- CTA Content Policies
CREATE POLICY "CTA content is viewable by everyone" 
    ON website.cta_content FOR SELECT 
    USING (is_active = true);

CREATE POLICY "CTA content is editable by authenticated users" 
    ON website.cta_content FOR ALL 
    USING (auth.role() = 'authenticated');

-- CTA Images Policies
CREATE POLICY "CTA images are viewable by everyone" 
    ON website.cta_images FOR SELECT 
    USING (is_active = true);

CREATE POLICY "CTA images are editable by authenticated users" 
    ON website.cta_images FOR ALL 
    USING (auth.role() = 'authenticated');

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
    l.place_name AS location_name,
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
            COALESCE(fe.override_location, l.place_name)
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

-- Add table comments for documentation
COMMENT ON SCHEMA website IS 'Schema for website content management tables';

COMMENT ON TABLE website.hero_content IS 
'Stores hero section content with optional function data inheritance';

COMMENT ON TABLE website.hero_navigation IS 
'Stores navigation menu items for the hero section header';

COMMENT ON TABLE website.sponsors IS 
'Stores sponsor information and logos displayed in the sponsors section';

COMMENT ON TABLE website.featured_events_config IS 
'Configuration for the featured events section including titles and display settings';

COMMENT ON TABLE website.featured_events IS 
'Stores which events are featured on the homepage with optional override data';

COMMENT ON TABLE website.location_content IS 
'Stores main content for the location info section with optional location data inheritance';

COMMENT ON TABLE website.location_features IS 
'Stores feature list items displayed in the location info section';

COMMENT ON TABLE website.cta_content IS 
'Stores main content for the call-to-action section including headings and descriptions';

COMMENT ON TABLE website.cta_images IS 
'Stores multiple images used in the CTA section with positioning information';

-- Insert default data
-- Hero Content
INSERT INTO website.hero_content (title, description, badge_text, background_image_url) VALUES (
    'Welcome to LodgeTix',
    'Your premier destination for Masonic events and ticketing. Join us for memorable occasions and timeless traditions.',
    'United Grand Lodge of NSW & ACT official ticketing platform',
    '/placeholder.svg?height=800&width=800'
);

-- Hero Navigation
INSERT INTO website.hero_navigation (name, href, display_order) VALUES 
    ('Events', '/functions', 1),
    ('About', '/about', 2),
    ('Contact', '/contact', 3),
    ('Help', '/help', 4);

-- Sponsors
INSERT INTO website.sponsors (name, logo_url, display_order) VALUES 
    ('United Grand Lodge of NSW & ACT', '/placeholder.svg?height=48&width=158&text=UGL', 1),
    ('Masonic Care NSW', '/placeholder.svg?height=48&width=158&text=Care', 2),
    ('Freemasons Foundation', '/placeholder.svg?height=48&width=158&text=Foundation', 3),
    ('Royal Arch Chapter', '/placeholder.svg?height=48&width=158&text=Royal+Arch', 4),
    ('Mark Master Masons', '/placeholder.svg?height=48&width=158&text=Mark', 5);

-- Featured Events Configuration
INSERT INTO website.featured_events_config DEFAULT VALUES;

-- Location Content
INSERT INTO website.location_content (heading, subheading, description, image_url) VALUES (
    'Experience Excellence',
    'Premium Venues, Perfect Experiences',
    'Our events are hosted at carefully selected venues throughout NSW & ACT, ensuring every occasion meets the highest standards of quality, accessibility, and Masonic tradition.',
    '/placeholder.svg?height=600&width=800&text=Lodge+Hall'
);

-- Location Features
INSERT INTO website.location_features (name, description, icon_name, display_order) VALUES 
    ('Prime Locations', 'Our events are held at prestigious venues across NSW & ACT, offering convenient access and parking for all attendees.', 'MapPinIcon', 1),
    ('Convenient Timing', 'Events are scheduled to accommodate working schedules, with both evening and weekend options available.', 'ClockIcon', 2),
    ('Community Focused', 'Join a welcoming community of Masons and guests from across the region, building lasting friendships and connections.', 'UserGroupIcon', 3);

-- CTA Content
INSERT INTO website.cta_content (heading, description, secondary_description) VALUES (
    'Join Our Community',
    'Become part of a tradition that spans centuries. Experience the brotherhood, ceremony, and fellowship that makes Freemasonry a cornerstone of community life.',
    'From intimate lodge meetings to grand installations, our events offer opportunities to connect with like-minded individuals, participate in meaningful ceremonies, and contribute to charitable causes that make a difference in our communities.'
);

-- CTA Images
INSERT INTO website.cta_images (alt_text, image_url, display_order, image_position) VALUES 
    ('Masonic ceremony in progress', '/placeholder.svg?height=400&width=592&text=Ceremony', 1, 'main'),
    ('Lodge meeting with brethren', '/placeholder.svg?height=604&width=768&text=Lodge+Meeting', 2, 'secondary'),
    ('Masonic charitable work', '/placeholder.svg?height=842&width=1152&text=Charity+Work', 3, 'tertiary'),
    ('Historic lodge building', '/placeholder.svg?height=604&width=768&text=Historic+Lodge', 4, 'quaternary');

-- Default featured events (fallback examples)
INSERT INTO website.featured_events (
    event_id, 
    use_event_data, 
    override_title, 
    override_description, 
    override_date, 
    override_location, 
    override_image_url, 
    override_price, 
    display_order
) VALUES 
(
    NULL,
    false,
    'Third Degree Ceremony',
    'A solemn ceremony raising a Brother to the sublime degree of a Master Mason. Experience the ancient traditions and profound symbolism of Freemasonry.',
    'Saturday, October 14, 2023',
    'Lodge Commonwealth No. 400, Sydney',
    '/placeholder.svg?height=400&width=1000',
    '$20',
    1
),
(
    NULL,
    false,
    'Masonic Education Night',
    'Learn about the symbolism and history of Freemasonry from distinguished speakers. Deepen your understanding of our ancient craft.',
    'Monday, September 25, 2023',
    'Lodge Antiquity No. 1, Sydney',
    '/placeholder.svg?height=400&width=1000',
    '$15',
    2
);