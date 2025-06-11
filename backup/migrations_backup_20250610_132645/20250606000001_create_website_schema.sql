-- Create website schema for CMS functionality
CREATE SCHEMA IF NOT EXISTS website;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- META TAGS TABLE
-- =====================================================
CREATE TABLE website.meta_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_id UUID REFERENCES public.functions(function_id) ON DELETE CASCADE,
    page_path VARCHAR(255) NOT NULL DEFAULT '/',
    title VARCHAR(255),
    description TEXT,
    keywords TEXT[],
    og_image VARCHAR(500),
    og_title VARCHAR(255),
    og_description TEXT,
    twitter_card VARCHAR(50),
    canonical_url VARCHAR(500),
    robots VARCHAR(100) DEFAULT 'index,follow',
    additional_meta JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(function_id, page_path)
);

-- =====================================================
-- HERO SECTIONS TABLE
-- =====================================================
CREATE TABLE website.hero_sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_id UUID REFERENCES public.functions(function_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    primary_cta_text VARCHAR(100),
    primary_cta_link VARCHAR(255),
    secondary_cta_text VARCHAR(100),
    secondary_cta_link VARCHAR(255),
    image_url VARCHAR(500),
    image_alt VARCHAR(255),
    background_image_url VARCHAR(500),
    show_dates BOOLEAN DEFAULT true,
    show_location BOOLEAN DEFAULT true,
    custom_content JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SPONSORS TABLE
-- =====================================================
CREATE TABLE website.sponsors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_id UUID REFERENCES public.functions(function_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    logo_alt VARCHAR(255),
    website_url VARCHAR(500),
    tier VARCHAR(50) CHECK (tier IN ('grand', 'major', 'gold', 'silver', 'bronze')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- LOCATION INFO TABLE
-- =====================================================
CREATE TABLE website.location_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_id UUID REFERENCES public.functions(function_id) ON DELETE CASCADE,
    venue_name VARCHAR(255) NOT NULL,
    venue_badge VARCHAR(100),
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Australia',
    map_embed_url TEXT,
    directions_url VARCHAR(500),
    features JSONB DEFAULT '[]',
    transport_info TEXT,
    parking_info TEXT,
    accessibility_info TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CTA SECTIONS TABLE
-- =====================================================
CREATE TABLE website.cta_sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_id UUID REFERENCES public.functions(function_id) ON DELETE CASCADE,
    section_key VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    primary_cta_text VARCHAR(100),
    primary_cta_link VARCHAR(255),
    secondary_cta_text VARCHAR(100),
    secondary_cta_link VARCHAR(255),
    info_text VARCHAR(255),
    background_style VARCHAR(50) DEFAULT 'gradient',
    custom_content JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(function_id, section_key)
);

-- =====================================================
-- NAVIGATION LINKS TABLE
-- =====================================================
CREATE TABLE website.navigation_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_id UUID REFERENCES public.functions(function_id) ON DELETE CASCADE,
    menu_location VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    is_external BOOLEAN DEFAULT false,
    open_in_new_tab BOOLEAN DEFAULT false,
    requires_auth BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FOOTER CONTENT TABLE
-- =====================================================
CREATE TABLE website.footer_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_id UUID REFERENCES public.functions(function_id) ON DELETE CASCADE,
    company_name VARCHAR(100) DEFAULT 'LodgeTix',
    company_description TEXT,
    copyright_text VARCHAR(255),
    social_links JSONB DEFAULT '[]',
    newsletter_enabled BOOLEAN DEFAULT false,
    newsletter_title VARCHAR(100),
    newsletter_description TEXT,
    external_links JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SPONSOR SECTIONS CONFIG TABLE
-- =====================================================
CREATE TABLE website.sponsor_sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_id UUID REFERENCES public.functions(function_id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Our Distinguished Sponsors',
    subtitle VARCHAR(255) DEFAULT 'Supporting Masonic Excellence and Tradition',
    show_tiers BOOLEAN DEFAULT true,
    layout VARCHAR(50) DEFAULT 'grid',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- THIRD-PARTY SCRIPTS TABLE
-- =====================================================
CREATE TABLE website.scripts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_id UUID REFERENCES public.functions(function_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    script_url VARCHAR(500),
    script_content TEXT,
    load_position VARCHAR(50) DEFAULT 'head',
    script_attributes JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_meta_tags_function_path ON website.meta_tags(function_id, page_path) WHERE is_active = true;
CREATE INDEX idx_hero_sections_function ON website.hero_sections(function_id) WHERE is_active = true;
CREATE INDEX idx_sponsors_function_tier ON website.sponsors(function_id, tier) WHERE is_active = true;
CREATE INDEX idx_navigation_links_location ON website.navigation_links(function_id, menu_location) WHERE is_active = true;
CREATE INDEX idx_cta_sections_key ON website.cta_sections(function_id, section_key) WHERE is_active = true;

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION website.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all tables
CREATE TRIGGER update_meta_tags_updated_at BEFORE UPDATE ON website.meta_tags
    FOR EACH ROW EXECUTE PROCEDURE website.update_updated_at_column();

CREATE TRIGGER update_hero_sections_updated_at BEFORE UPDATE ON website.hero_sections
    FOR EACH ROW EXECUTE PROCEDURE website.update_updated_at_column();

CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON website.sponsors
    FOR EACH ROW EXECUTE PROCEDURE website.update_updated_at_column();

CREATE TRIGGER update_location_info_updated_at BEFORE UPDATE ON website.location_info
    FOR EACH ROW EXECUTE PROCEDURE website.update_updated_at_column();

CREATE TRIGGER update_cta_sections_updated_at BEFORE UPDATE ON website.cta_sections
    FOR EACH ROW EXECUTE PROCEDURE website.update_updated_at_column();

CREATE TRIGGER update_navigation_links_updated_at BEFORE UPDATE ON website.navigation_links
    FOR EACH ROW EXECUTE PROCEDURE website.update_updated_at_column();

CREATE TRIGGER update_footer_content_updated_at BEFORE UPDATE ON website.footer_content
    FOR EACH ROW EXECUTE PROCEDURE website.update_updated_at_column();

CREATE TRIGGER update_sponsor_sections_updated_at BEFORE UPDATE ON website.sponsor_sections
    FOR EACH ROW EXECUTE PROCEDURE website.update_updated_at_column();

CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON website.scripts
    FOR EACH ROW EXECUTE PROCEDURE website.update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE website.meta_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.hero_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.location_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.cta_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.navigation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.footer_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.sponsor_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE website.scripts ENABLE ROW LEVEL SECURITY;

-- Public read access for active content
CREATE POLICY "Public can view active meta tags" ON website.meta_tags
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active hero sections" ON website.hero_sections
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active sponsors" ON website.sponsors
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active location info" ON website.location_info
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active CTA sections" ON website.cta_sections
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active navigation links" ON website.navigation_links
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active footer content" ON website.footer_content
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active sponsor sections" ON website.sponsor_sections
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active scripts" ON website.scripts
    FOR SELECT USING (is_active = true);

-- Admin/organiser write access (you'll need to adjust based on your auth setup)
-- Example for authenticated users with organiser role:
-- CREATE POLICY "Organisers can manage content" ON website.meta_tags
--     FOR ALL USING (auth.uid() IN (SELECT user_id FROM organisers WHERE function_id = meta_tags.function_id));

-- =====================================================
-- INITIAL SEED DATA
-- =====================================================
-- Get the featured function ID (you'll need to replace this with actual ID)
DO $$
DECLARE
    featured_function_id UUID;
BEGIN
    -- Get the first active function or use a specific one
    SELECT function_id INTO featured_function_id FROM public.functions WHERE is_published = true LIMIT 1;
    
    -- Insert default meta tags
    INSERT INTO website.meta_tags (function_id, page_path, title, description, og_title, og_description)
    VALUES 
    (featured_function_id, '/', 'Grand Proclamation 2025 | United Grand Lodge of NSW & ACT', 
     'Join us for the most prestigious Masonic event of the year', 
     'Grand Proclamation 2025', 
     'The official gathering of the United Grand Lodge of NSW & ACT');

    -- Insert hero section content
    INSERT INTO website.hero_sections (function_id, title, subtitle, description, primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link)
    VALUES 
    (featured_function_id, 
     'Grand Proclamation 2025', 
     'Celebrating Excellence in Freemasonry',
     'Join us for the most prestigious Masonic event of the year, where tradition meets fellowship in the heart of Sydney.',
     'Register Now', '/functions', 
     'Learn More', '/functions');

    -- Insert sponsor section config
    INSERT INTO website.sponsor_sections (function_id, title, subtitle)
    VALUES 
    (featured_function_id, 
     'Our Distinguished Sponsors', 
     'Supporting Masonic Excellence and Tradition');

    -- Insert sample sponsors
    INSERT INTO website.sponsors (function_id, name, tier, logo_url, logo_alt, sort_order)
    VALUES 
    (featured_function_id, 'Grand Lodge of NSW & ACT', 'grand', '/placeholder.svg?height=100&width=200&text=Grand+Lodge', 'Grand Lodge of NSW & ACT', 1),
    (featured_function_id, 'Major Sponsor', 'major', '/placeholder.svg?height=100&width=200&text=Major+Sponsor', 'Major Sponsor', 2),
    (featured_function_id, 'Gold Sponsor', 'gold', '/placeholder.svg?height=100&width=200&text=Gold+Sponsor', 'Gold Sponsor', 3),
    (featured_function_id, 'Silver Sponsor', 'silver', '/placeholder.svg?height=100&width=200&text=Silver+Sponsor', 'Silver Sponsor', 4);

    -- Insert location info
    INSERT INTO website.location_info (
        function_id, venue_name, venue_badge, address_line_1, address_line_2, 
        city, state, postal_code, features, parking_info
    )
    VALUES 
    (featured_function_id, 
     'Sydney Masonic Centre', 
     'Premium Venue',
     '279 Castlereagh Street', 
     '',
     'Sydney', 'NSW', '2000',
     '[
        {"icon": "Building2", "title": "Historic Venue", "description": "A landmark of Masonic tradition"},
        {"icon": "Train", "title": "Central Location", "description": "Easy access via public transport"},
        {"icon": "Wifi", "title": "Modern Facilities", "description": "State-of-the-art amenities"},
        {"icon": "Car", "title": "Secure Parking", "description": "Ample parking available"}
     ]'::jsonb,
     'Ample parking available');

    -- Insert CTA section
    INSERT INTO website.cta_sections (
        function_id, section_key, title, subtitle, description, 
        primary_cta_text, primary_cta_link, info_text
    )
    VALUES 
    (featured_function_id, 
     'homepage_bottom',
     'Ready to Join Us?', 
     'Secure Your Place at the Grand Proclamation 2025',
     'Don''t miss this historic gathering of Freemasons from across New South Wales and the Australian Capital Territory.',
     'Register Now', '/functions',
     'Limited places available • Secure online payment • Instant confirmation');

    -- Insert navigation links
    INSERT INTO website.navigation_links (function_id, menu_location, label, url, sort_order)
    VALUES 
    (NULL, 'header', 'Home', '/', 1),
    (NULL, 'header', 'Functions', '/functions', 2),
    (NULL, 'header', 'About', '/about', 3),
    (NULL, 'header', 'Contact', '/contact', 4),
    (NULL, 'footer_quick_links', 'Events', '/functions', 1),
    (NULL, 'footer_quick_links', 'About', '/about', 2),
    (NULL, 'footer_quick_links', 'Contact', '/contact', 3),
    (NULL, 'footer_quick_links', 'Help', '/help', 4);

    -- Insert footer content
    INSERT INTO website.footer_content (
        function_id, company_name, company_description, 
        copyright_text, external_links
    )
    VALUES 
    (NULL, 
     'LodgeTix',
     'The official ticketing platform for the United Grand Lodge of NSW & ACT',
     '© 2024 LodgeTix. All rights reserved.',
     '[
        {"label": "Visit United Grand Lodge of NSW & ACT", "url": "https://masons.au", "icon": "ExternalLink"}
     ]'::jsonb);

END $$;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================
-- Function to get website content with fallbacks
CREATE OR REPLACE FUNCTION website.get_hero_content(p_function_id UUID)
RETURNS TABLE (
    title VARCHAR(255),
    subtitle VARCHAR(255),
    description TEXT,
    primary_cta_text VARCHAR(100),
    primary_cta_link VARCHAR(255),
    secondary_cta_text VARCHAR(100),
    secondary_cta_link VARCHAR(255),
    image_url VARCHAR(500),
    image_alt VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.title,
        h.subtitle,
        h.description,
        h.primary_cta_text,
        h.primary_cta_link,
        h.secondary_cta_text,
        h.secondary_cta_link,
        h.image_url,
        h.image_alt
    FROM website.hero_sections h
    WHERE h.function_id = p_function_id 
    AND h.is_active = true
    ORDER BY h.sort_order
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get navigation with global fallback
CREATE OR REPLACE FUNCTION website.get_navigation_links(p_function_id UUID, p_menu_location VARCHAR(50))
RETURNS TABLE (
    label VARCHAR(100),
    url VARCHAR(255),
    icon VARCHAR(50),
    is_external BOOLEAN,
    open_in_new_tab BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.label,
        n.url,
        n.icon,
        n.is_external,
        n.open_in_new_tab
    FROM website.navigation_links n
    WHERE (n.function_id = p_function_id OR n.function_id IS NULL)
    AND n.menu_location = p_menu_location
    AND n.is_active = true
    ORDER BY n.sort_order;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON SCHEMA website IS 'Content management system for website components';
COMMENT ON TABLE website.meta_tags IS 'SEO and meta information for pages';
COMMENT ON TABLE website.hero_sections IS 'Hero section content for landing pages';
COMMENT ON TABLE website.sponsors IS 'Sponsor information and logos';
COMMENT ON TABLE website.location_info IS 'Venue and location details';
COMMENT ON TABLE website.cta_sections IS 'Call-to-action sections';
COMMENT ON TABLE website.navigation_links IS 'Navigation menu items';
COMMENT ON TABLE website.footer_content IS 'Footer configuration and content';
COMMENT ON TABLE website.sponsor_sections IS 'Sponsor section configuration';
COMMENT ON TABLE website.scripts IS 'Third-party scripts and integrations';