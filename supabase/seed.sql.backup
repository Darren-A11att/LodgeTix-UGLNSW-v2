-- Website Content Seed Data
-- This seed file populates the website schema with all current homepage content

-- =====================================================
-- IMPORTANT: This uses your actual Featured Function ID
-- =====================================================
DO $$
DECLARE
    featured_function_id UUID;
BEGIN
    -- Get the featured function ID from your environment
    -- This should match your FEATURED_FUNCTION_ID in .env
    featured_function_id := 'eebddef5-6833-43e3-8d32-700508b1c089'::UUID;
    
    -- Verify this function exists
    IF NOT EXISTS (SELECT 1 FROM public.functions WHERE function_id = featured_function_id) THEN
        RAISE EXCEPTION 'Function ID % not found in functions table', featured_function_id;
    END IF;

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
        robots
    ) VALUES 
    (
        featured_function_id,
        '/',
        'Grand Proclamation 2025 | United Grand Lodge of NSW & ACT',
        'Created with v0', -- This is your current meta description
        'Grand Proclamation 2025',
        'The official gathering of the United Grand Lodge of NSW & ACT',
        ARRAY['freemasonry', 'masonic', 'grand lodge', 'nsw', 'act', 'proclamation', '2025'],
        'index,follow'
    )
    ON CONFLICT (function_id, page_path) DO UPDATE
    SET 
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP;

    -- =====================================================
    -- HERO SECTION (from hero-angled-design.tsx)
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
        show_location
    ) VALUES 
    (
        featured_function_id,
        'Grand Proclamation 2025', -- Current fallback title
        'Celebrating Excellence in Freemasonry', -- Current fallback subtitle
        'Join us for the most prestigious Masonic event of the year, where tradition meets fellowship in the heart of Sydney.',
        'Register Now',
        '/functions',
        'Learn More',
        '/functions',
        '/placeholder.svg?height=600&width=800&text=Grand+Proclamation+2025',
        'Grand Proclamation 2025',
        true,
        true
    );

    -- =====================================================
    -- SPONSOR SECTION CONFIG
    -- =====================================================
    INSERT INTO website.sponsor_sections (
        function_id,
        title,
        subtitle
    ) VALUES 
    (
        featured_function_id,
        'Our Distinguished Sponsors',
        'Supporting Masonic Excellence and Tradition'
    );

    -- =====================================================
    -- SPONSORS (from sponsors-section.tsx)
    -- =====================================================
    INSERT INTO website.sponsors (function_id, name, tier, logo_url, logo_alt, sort_order) VALUES 
    (featured_function_id, 'Grand Lodge of NSW & ACT', 'grand', '/placeholder.svg?height=100&width=200&text=Grand+Lodge', 'Grand Lodge of NSW & ACT', 1),
    (featured_function_id, 'Major Sponsor', 'major', '/placeholder.svg?height=100&width=200&text=Major+Sponsor', 'Major Sponsor', 2),
    (featured_function_id, 'Gold Sponsor', 'gold', '/placeholder.svg?height=100&width=200&text=Gold+Sponsor', 'Gold Sponsor', 3),
    (featured_function_id, 'Silver Sponsor', 'silver', '/placeholder.svg?height=100&width=200&text=Silver+Sponsor', 'Silver Sponsor', 4);

    -- =====================================================
    -- LOCATION INFO (from location-info-section.tsx)
    -- =====================================================
    INSERT INTO website.location_info (
        function_id,
        venue_name,
        venue_badge,
        address_line_1,
        city,
        state,
        postal_code,
        features,
        parking_info
    ) VALUES 
    (
        featured_function_id,
        'Sydney Masonic Centre',
        'Premium Venue',
        '279 Castlereagh Street',
        'Sydney',
        'NSW',
        '2000',
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
        'Ample parking available'
    );

    -- =====================================================
    -- CTA SECTION (from cta-section.tsx)
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
        background_style
    ) VALUES 
    (
        featured_function_id,
        'homepage_bottom',
        'Ready to Join Us?',
        'Secure Your Place at the Grand Proclamation 2025',
        'Don''t miss this historic gathering of Freemasons from across New South Wales and the Australian Capital Territory.',
        'Register Now',
        '/functions',
        'Limited places available • Secure online payment • Instant confirmation',
        'gradient'
    );

    -- =====================================================
    -- NAVIGATION - These are global (no function_id)
    -- =====================================================
    -- Header navigation
    INSERT INTO website.navigation_links (menu_location, label, url, sort_order) VALUES 
    ('header', 'Home', '/', 1),
    ('header', 'Functions', '/functions', 2),
    ('header', 'About', '/about', 3),
    ('header', 'Contact', '/contact', 4)
    ON CONFLICT DO NOTHING;

    -- Footer links
    INSERT INTO website.navigation_links (menu_location, label, url, sort_order) VALUES 
    ('footer_quick_links', 'Events', '/functions', 1),
    ('footer_quick_links', 'About', '/about', 2),
    ('footer_quick_links', 'Contact', '/contact', 3),
    ('footer_quick_links', 'Help', '/help', 4),
    ('footer_legal', 'Privacy Policy', '/privacy', 1),
    ('footer_legal', 'Terms of Service', '/terms', 2),
    ('footer_legal', 'Refund Policy', '/refund-policy', 3)
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- FOOTER CONTENT - Global
    -- =====================================================
    INSERT INTO website.footer_content (
        company_name,
        company_description,
        copyright_text,
        external_links
    ) VALUES 
    (
        'LodgeTix',
        'The official ticketing platform for the United Grand Lodge of NSW & ACT',
        '© 2024 LodgeTix. All rights reserved.',
        '[{"label": "Visit United Grand Lodge of NSW & ACT", "url": "https://masons.au", "icon": "ExternalLink"}]'::jsonb
    )
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- SCRIPTS - Global
    -- =====================================================
    INSERT INTO website.scripts (
        name,
        script_url,
        load_position
    ) VALUES 
    (
        'Cloudflare Turnstile',
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
        'head'
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Website content seeded successfully for function %', featured_function_id;
END $$;

-- =====================================================
-- VERIFY SEED DATA
-- =====================================================
SELECT 'Seeded content summary:' as info;
SELECT 
    'website.' || table_name as table_name, 
    count(*) as records
FROM (
    SELECT 'meta_tags' as table_name FROM website.meta_tags
    UNION ALL SELECT 'hero_sections' FROM website.hero_sections
    UNION ALL SELECT 'sponsors' FROM website.sponsors
    UNION ALL SELECT 'location_info' FROM website.location_info
    UNION ALL SELECT 'cta_sections' FROM website.cta_sections
    UNION ALL SELECT 'navigation_links' FROM website.navigation_links
    UNION ALL SELECT 'footer_content' FROM website.footer_content
    UNION ALL SELECT 'scripts' FROM website.scripts
) t
GROUP BY table_name
ORDER BY table_name;