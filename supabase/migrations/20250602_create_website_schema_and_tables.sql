-- Create Website Schema and Content Management Tables
-- This migration creates a dedicated schema for website content management
-- with tables for each homepage section to replace placeholder content

-- Create the website schema
CREATE SCHEMA IF NOT EXISTS website;

-- Set search path to include the website schema
SET search_path = public, website;

-- Table 1: Hero Content
-- Purpose: Store hero section content when no function data is available
CREATE TABLE website.hero_content (
    hero_content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    badge_text TEXT,
    background_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 2: Sponsors
-- Purpose: Store sponsor information and logos for the sponsors section
CREATE TABLE website.sponsors (
    sponsor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 3: Location Content
-- Purpose: Store main content for the location info section
CREATE TABLE website.location_content (
    location_content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heading TEXT NOT NULL,
    subheading TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 4: Location Features
-- Purpose: Store the feature list items for the location info section
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

-- Table 5: CTA Content
-- Purpose: Store main content for the call-to-action section
CREATE TABLE website.cta_content (
    cta_content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heading TEXT NOT NULL,
    description TEXT NOT NULL,
    secondary_description TEXT,
    button_text TEXT DEFAULT 'Explore Events',
    button_url TEXT DEFAULT '/functions',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 6: CTA Images
-- Purpose: Store the multiple images used in the CTA section
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
CREATE INDEX idx_sponsors_display_order ON website.sponsors(display_order) WHERE is_active = true;
CREATE INDEX idx_location_features_display_order ON website.location_features(display_order) WHERE is_active = true;
CREATE INDEX idx_cta_images_display_order ON website.cta_images(display_order) WHERE is_active = true;
CREATE INDEX idx_hero_content_active ON website.hero_content(is_active);
CREATE INDEX idx_location_content_active ON website.location_content(is_active);
CREATE INDEX idx_cta_content_active ON website.cta_content(is_active);

-- Add updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION website.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hero_content_updated_at 
    BEFORE UPDATE ON website.hero_content 
    FOR EACH ROW EXECUTE FUNCTION website.update_updated_at_column();

CREATE TRIGGER update_sponsors_updated_at 
    BEFORE UPDATE ON website.sponsors 
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
ALTER TABLE website.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.location_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.location_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.cta_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.cta_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (website content is public)
-- and authenticated write access for content management

-- Hero Content Policies
CREATE POLICY "Hero content is viewable by everyone" 
    ON website.hero_content FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Hero content is editable by authenticated users" 
    ON website.hero_content FOR ALL 
    USING (auth.role() = 'authenticated');

-- Sponsors Policies
CREATE POLICY "Sponsors are viewable by everyone" 
    ON website.sponsors FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Sponsors are editable by authenticated users" 
    ON website.sponsors FOR ALL 
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

-- Add table comments for documentation
COMMENT ON SCHEMA website IS 'Schema for website content management tables';

COMMENT ON TABLE website.hero_content IS 
'Stores hero section fallback content when no function data is available';

COMMENT ON TABLE website.sponsors IS 
'Stores sponsor information and logos displayed in the sponsors section';

COMMENT ON TABLE website.location_content IS 
'Stores main content for the location info section including heading, description, and image';

COMMENT ON TABLE website.location_features IS 
'Stores feature list items displayed in the location info section';

COMMENT ON TABLE website.cta_content IS 
'Stores main content for the call-to-action section including headings and descriptions';

COMMENT ON TABLE website.cta_images IS 
'Stores multiple images used in the CTA section with positioning information';

-- Insert default data to replace current placeholder content
-- Hero Content
INSERT INTO website.hero_content (title, description, badge_text, background_image_url) VALUES (
    'Welcome to LodgeTix',
    'Your premier destination for Masonic events and ticketing. Join us for memorable occasions and timeless traditions.',
    'United Grand Lodge of NSW & ACT official ticketing platform',
    '/placeholder.svg?height=800&width=800'
);

-- Sponsors (current placeholder sponsors)
INSERT INTO website.sponsors (name, logo_url, display_order) VALUES 
    ('United Grand Lodge of NSW & ACT', '/placeholder.svg?height=48&width=158&text=UGL', 1),
    ('Masonic Care NSW', '/placeholder.svg?height=48&width=158&text=Care', 2),
    ('Freemasons Foundation', '/placeholder.svg?height=48&width=158&text=Foundation', 3),
    ('Royal Arch Chapter', '/placeholder.svg?height=48&width=158&text=Royal+Arch', 4),
    ('Mark Master Masons', '/placeholder.svg?height=48&width=158&text=Mark', 5);

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