-- Create content table for general page content
CREATE TABLE IF NOT EXISTS public.content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page VARCHAR(50) NOT NULL,
    section VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content_features table for feature lists
CREATE TABLE IF NOT EXISTS public.content_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content_values table for value propositions
CREATE TABLE IF NOT EXISTS public.content_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_page ON public.content(page);
CREATE INDEX IF NOT EXISTS idx_content_features_page ON public.content_features(page);
CREATE INDEX IF NOT EXISTS idx_content_values_page ON public.content_values(page);

-- Add RLS policies (disabled by default, can be enabled if needed)
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_values ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Content is viewable by everyone" ON public.content
    FOR SELECT USING (true);

CREATE POLICY "Content features are viewable by everyone" ON public.content_features
    FOR SELECT USING (true);

CREATE POLICY "Content values are viewable by everyone" ON public.content_values
    FOR SELECT USING (true);

-- Insert default about page content (optional)
INSERT INTO public.content (page, section, title, description, "order") VALUES
    ('about', 'mission', 'Our Mission', 'LodgeTix was founded with a simple mission: to make Masonic event management easier and more accessible for Lodges of all sizes. We understand the unique needs of Masonic organizations and have built our platform specifically to address those needs.', 1),
    ('about', 'history', 'Created By Freemasons', 'As active Freemasons ourselves, we''ve experienced firsthand the challenges of organizing Lodge meetings, degree ceremonies, installations, and social events. We''ve built LodgeTix to solve the problems we encountered, creating a platform that respects Masonic traditions while embracing modern technology.', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.content_features (page, title, description, icon, "order") VALUES
    ('about', 'Masonic-Specific Event Types', 'Create events specifically for Lodge meetings, degree ceremonies, installations, and festive boards with fields tailored to Masonic needs.', 'shield', 1),
    ('about', 'Privacy Controls', 'Control who can see your events with options for public events, members-only events, and private events.', 'layout-grid', 2),
    ('about', 'Visitor Management', 'Easily manage visiting Brethren with special ticket types and the ability to collect Lodge information.', 'users', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.content_values (page, title, description, "order") VALUES
    ('about', 'Brotherly Love', 'We believe in fostering connections between Brethren across different Lodges and jurisdictions.', 1),
    ('about', 'Relief', 'We aim to relieve the administrative burden on Lodge Secretaries and event organizers.', 2),
    ('about', 'Truth', 'We operate with transparency and integrity in all our business practices.', 3)
ON CONFLICT (id) DO NOTHING;