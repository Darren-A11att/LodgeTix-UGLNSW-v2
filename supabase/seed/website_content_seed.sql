-- Website Content Seed Data
-- Based on comprehensive homepage element analysis

-- Note: Replace {FEATURED_FUNCTION_ID} with the actual UUID of your featured function
-- You can find this in your functions table or FEATURED_FUNCTION_ID environment variable

-- =====================================================
-- CLEAR EXISTING DATA (Optional - uncomment if needed)
-- =====================================================
-- DELETE FROM website.scripts;
-- DELETE FROM website.sponsor_sections;
-- DELETE FROM website.footer_content;
-- DELETE FROM website.navigation_links;
-- DELETE FROM website.cta_sections;
-- DELETE FROM website.location_info;
-- DELETE FROM website.sponsors;
-- DELETE FROM website.hero_sections;
-- DELETE FROM website.meta_tags;

-- =====================================================
-- META TAGS
-- =====================================================
INSERT INTO website.meta_tags (
    function_id, 
    page_path, 
    title, 
    description, 
    og_title, 
    og_description,
    keywords,
    robots,
    additional_meta
) VALUES 
(
    '{FEATURED_FUNCTION_ID}',
    '/',
    'Grand Proclamation 2025 | United Grand Lodge of NSW & ACT',
    'Created with v0', -- Current static description
    'Grand Proclamation 2025',
    'The official gathering of the United Grand Lodge of NSW & ACT',
    ARRAY['freemasonry', 'masonic', 'grand lodge', 'nsw', 'act', 'proclamation', '2025'],
    'index,follow',
    '{"generator": ";)"}'::jsonb
)
ON CONFLICT (function_id, page_path) DO UPDATE
SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    og_title = EXCLUDED.og_title,
    og_description = EXCLUDED.og_description,
    keywords = EXCLUDED.keywords,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- HERO SECTIONS
-- =====================================================
INSERT INTO website.hero_sections (
    function_id,
    title,
    subtitle,
    description,
    primary_cta_text,
    primary_cta_link,
    secondary_cta_text,
    secondary_cta_link,
    image_url,
    image_alt,
    show_dates,
    show_location,
    custom_content
) VALUES 
(
    '{FEATURED_FUNCTION_ID}',
    'Grand Proclamation 2025',
    'Celebrating Excellence in Freemasonry',
    'Join us for the most prestigious Masonic event of the year, where tradition meets fellowship in the heart of Sydney.',
    'Register Now',
    '/functions',
    'Learn More',
    '/functions',
    '/placeholder.svg?height=600&width=800&text=Grand+Proclamation+2025',
    'Grand Proclamation 2025',
    true,
    true,
    '{
        "date_display": "15th - 17th March 2025",
        "venue_display": "Sydney Masonic Centre",
        "background_pattern": "gradient-to-br from-masonic-blue/20 to-transparent"
    }'::jsonb
);

-- =====================================================
-- SPONSOR SECTION CONFIGURATION
-- =====================================================
INSERT INTO website.sponsor_sections (
    function_id,
    title,
    subtitle,
    show_tiers,
    layout
) VALUES 
(
    '{FEATURED_FUNCTION_ID}',
    'Our Distinguished Sponsors',
    'Supporting Masonic Excellence and Tradition',
    true,
    'grid'
);

-- =====================================================
-- SPONSORS
-- =====================================================
INSERT INTO website.sponsors (
    function_id,
    name,
    tier,
    logo_url,
    logo_alt,
    website_url,
    sort_order
) VALUES 
('{FEATURED_FUNCTION_ID}', 'Grand Lodge of NSW & ACT', 'grand', '/placeholder.svg?height=100&width=200&text=Grand+Lodge', 'Grand Lodge of NSW & ACT', NULL, 1),
('{FEATURED_FUNCTION_ID}', 'Major Sponsor', 'major', '/placeholder.svg?height=100&width=200&text=Major+Sponsor', 'Major Sponsor', NULL, 2),
('{FEATURED_FUNCTION_ID}', 'Gold Sponsor', 'gold', '/placeholder.svg?height=100&width=200&text=Gold+Sponsor', 'Gold Sponsor', NULL, 3),
('{FEATURED_FUNCTION_ID}', 'Silver Sponsor', 'silver', '/placeholder.svg?height=100&width=200&text=Silver+Sponsor', 'Silver Sponsor', NULL, 4);

-- =====================================================
-- LOCATION INFO
-- =====================================================
INSERT INTO website.location_info (
    function_id,
    venue_name,
    venue_badge,
    address_line_1,
    address_line_2,
    city,
    state,
    postal_code,
    country,
    directions_url,
    features,
    transport_info,
    parking_info,
    accessibility_info
) VALUES 
(
    '{FEATURED_FUNCTION_ID}',
    'Sydney Masonic Centre',
    'Premium Venue',
    '279 Castlereagh Street',
    '',
    'Sydney',
    'NSW',
    '2000',
    'Australia',
    'https://maps.google.com/?q=279+Castlereagh+Street+Sydney+NSW+2000',
    '[
        {
            "icon": "Building2",
            "title": "Historic Venue",
            "description": "A landmark of Masonic tradition"
        },
        {
            "icon": "Train",
            "title": "Central Location",
            "description": "Easy access via public transport"
        },
        {
            "icon": "Wifi",
            "title": "Modern Facilities",
            "description": "State-of-the-art amenities"
        },
        {
            "icon": "Car",
            "title": "Secure Parking",
            "description": "Ample parking available"
        }
    ]'::jsonb,
    'Easy access via public transport',
    'Ample parking available',
    NULL
);

-- =====================================================
-- CTA SECTIONS
-- =====================================================
INSERT INTO website.cta_sections (
    function_id,
    section_key,
    title,
    subtitle,
    description,
    primary_cta_text,
    primary_cta_link,
    info_text,
    background_style,
    custom_content
) VALUES 
(
    '{FEATURED_FUNCTION_ID}',
    'homepage_bottom',
    'Ready to Join Us?',
    'Secure Your Place at the Grand Proclamation 2025',
    'Don''t miss this historic gathering of Freemasons from across New South Wales and the Australian Capital Territory.',
    'Register Now',
    '/functions',
    'Limited places available • Secure online payment • Instant confirmation',
    'gradient',
    '{
        "gradient_from": "masonic-navy",
        "gradient_to": "masonic-blue",
        "decorative_patterns": true,
        "button_icon": "ArrowRight"
    }'::jsonb
);

-- =====================================================
-- NAVIGATION LINKS - HEADER
-- =====================================================
INSERT INTO website.navigation_links (
    function_id,
    menu_location,
    label,
    url,
    icon,
    is_external,
    open_in_new_tab,
    sort_order
) VALUES 
-- Header navigation (global - no function_id)
(NULL, 'header', 'Home', '/', NULL, false, false, 1),
(NULL, 'header', 'Functions', '/functions', NULL, false, false, 2),
(NULL, 'header', 'About', '/about', NULL, false, false, 3),
(NULL, 'header', 'Contact', '/contact', NULL, false, false, 4);

-- =====================================================
-- NAVIGATION LINKS - MOBILE MENU
-- =====================================================
INSERT INTO website.navigation_links (
    function_id,
    menu_location,
    label,
    url,
    icon,
    is_external,
    open_in_new_tab,
    sort_order
) VALUES 
-- Mobile navigation (same as header)
(NULL, 'mobile', 'Home', '/', NULL, false, false, 1),
(NULL, 'mobile', 'Functions', '/functions', NULL, false, false, 2),
(NULL, 'mobile', 'About', '/about', NULL, false, false, 3),
(NULL, 'mobile', 'Contact', '/contact', NULL, false, false, 4);

-- =====================================================
-- NAVIGATION LINKS - FOOTER
-- =====================================================
INSERT INTO website.navigation_links (
    function_id,
    menu_location,
    label,
    url,
    icon,
    is_external,
    open_in_new_tab,
    sort_order
) VALUES 
-- Footer Quick Links
(NULL, 'footer_quick_links', 'Events', '/functions', NULL, false, false, 1),
(NULL, 'footer_quick_links', 'About', '/about', NULL, false, false, 2),
(NULL, 'footer_quick_links', 'Contact', '/contact', NULL, false, false, 3),
(NULL, 'footer_quick_links', 'Help', '/help', NULL, false, false, 4),
-- Footer Legal Links
(NULL, 'footer_legal', 'Privacy Policy', '/privacy', NULL, false, false, 1),
(NULL, 'footer_legal', 'Terms of Service', '/terms', NULL, false, false, 2),
(NULL, 'footer_legal', 'Refund Policy', '/refund-policy', NULL, false, false, 3);

-- =====================================================
-- FOOTER CONTENT
-- =====================================================
INSERT INTO website.footer_content (
    function_id,
    company_name,
    company_description,
    copyright_text,
    external_links,
    custom_content
) VALUES 
(
    NULL, -- Global footer
    'LodgeTix',
    'The official ticketing platform for the United Grand Lodge of NSW & ACT',
    '© 2024 LodgeTix. All rights reserved.',
    '[
        {
            "label": "Visit United Grand Lodge of NSW & ACT",
            "url": "https://masons.au",
            "icon": "ExternalLink"
        }
    ]'::jsonb,
    '{
        "logo_size": "md",
        "event_info": {
            "title": "Grand Proclamation 2025",
            "date": "15-17 March 2025",
            "venue": "Sydney Masonic Centre"
        }
    }'::jsonb
);

-- =====================================================
-- THIRD-PARTY SCRIPTS
-- =====================================================
INSERT INTO website.scripts (
    function_id,
    name,
    script_url,
    script_content,
    load_position,
    script_attributes,
    sort_order
) VALUES 
-- Cloudflare Turnstile (global)
(
    NULL,
    'Cloudflare Turnstile',
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
    NULL,
    'head',
    '{}'::jsonb,
    1
);

-- =====================================================
-- PLACEHOLDER IMAGE REFERENCES
-- =====================================================
-- This creates a reference table for all placeholder images that should be replaced
-- with real images stored in the public-events bucket

CREATE TABLE IF NOT EXISTS website.image_placeholders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    component VARCHAR(100),
    current_placeholder VARCHAR(500),
    suggested_filename VARCHAR(255),
    dimensions VARCHAR(50),
    description TEXT,
    uploaded_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO website.image_placeholders (component, current_placeholder, suggested_filename, dimensions, description) VALUES
('hero', '/placeholder.svg?height=600&width=800&text=Grand+Proclamation+2025', 'hero-grand-proclamation-2025.jpg', '800x600', 'Main hero image for Grand Proclamation 2025'),
('sponsors', '/placeholder.svg?height=100&width=200&text=Grand+Lodge', 'sponsor-grand-lodge.png', '200x100', 'Grand Lodge of NSW & ACT logo'),
('sponsors', '/placeholder.svg?height=100&width=200&text=Major+Sponsor', 'sponsor-major.png', '200x100', 'Major sponsor logo'),
('sponsors', '/placeholder.svg?height=100&width=200&text=Gold+Sponsor', 'sponsor-gold.png', '200x100', 'Gold sponsor logo'),
('sponsors', '/placeholder.svg?height=100&width=200&text=Silver+Sponsor', 'sponsor-silver.png', '200x100', 'Silver sponsor logo');

-- =====================================================
-- HELPER FUNCTION TO UPDATE FUNCTION-SPECIFIC CONTENT
-- =====================================================
CREATE OR REPLACE FUNCTION website.seed_content_for_function(p_function_id UUID)
RETURNS void AS $$
BEGIN
    -- Update all function_id placeholders with actual ID
    UPDATE website.meta_tags SET function_id = p_function_id WHERE function_id = '{FEATURED_FUNCTION_ID}';
    UPDATE website.hero_sections SET function_id = p_function_id WHERE function_id = '{FEATURED_FUNCTION_ID}';
    UPDATE website.sponsors SET function_id = p_function_id WHERE function_id = '{FEATURED_FUNCTION_ID}';
    UPDATE website.sponsor_sections SET function_id = p_function_id WHERE function_id = '{FEATURED_FUNCTION_ID}';
    UPDATE website.location_info SET function_id = p_function_id WHERE function_id = '{FEATURED_FUNCTION_ID}';
    UPDATE website.cta_sections SET function_id = p_function_id WHERE function_id = '{FEATURED_FUNCTION_ID}';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INSTRUCTIONS FOR USE
-- =====================================================
-- 1. Replace {FEATURED_FUNCTION_ID} with your actual function ID throughout this file
--    OR run: SELECT website.seed_content_for_function('your-function-uuid-here');
--
-- 2. Upload real images to Supabase Storage:
--    - Create folders in public-events bucket: /website/heroes/, /website/sponsors/
--    - Upload images and update the URLs in the respective tables
--
-- 3. To get storage URLs after upload:
--    SELECT storage.get_public_url('public-events', 'website/heroes/hero-grand-proclamation-2025.jpg');
--
-- 4. Update placeholder URLs with real storage URLs:
--    UPDATE website.hero_sections 
--    SET image_url = storage.get_public_url('public-events', 'website/heroes/hero-grand-proclamation-2025.jpg')
--    WHERE function_id = 'your-function-id';

-- =====================================================
-- SAMPLE QUERY TO CHECK SEEDED DATA
-- =====================================================
-- SELECT 
--     'meta_tags' as table_name, COUNT(*) as count FROM website.meta_tags
-- UNION ALL
-- SELECT 'hero_sections', COUNT(*) FROM website.hero_sections
-- UNION ALL
-- SELECT 'sponsors', COUNT(*) FROM website.sponsors
-- UNION ALL
-- SELECT 'navigation_links', COUNT(*) FROM website.navigation_links
-- UNION ALL
-- SELECT 'footer_content', COUNT(*) FROM website.footer_content;