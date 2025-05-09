-- Create the Grand Lodges table
CREATE TABLE IF NOT EXISTS public.grand_lodges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on grand_lodges
ALTER TABLE public.grand_lodges ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read grand_lodges
CREATE POLICY "Authenticated users can read grand_lodges" 
  ON public.grand_lodges FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create the Lodges table
CREATE TABLE IF NOT EXISTS public.lodges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  number TEXT,
  grand_lodge_id UUID REFERENCES public.grand_lodges(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on lodges
ALTER TABLE public.lodges ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read lodges
CREATE POLICY "Authenticated users can read lodges" 
  ON public.lodges FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert their own lodges
CREATE POLICY "Authenticated users can create lodges" 
  ON public.lodges FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_grand_lodges_name_trigram ON public.grand_lodges USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lodges_name_trigram ON public.lodges USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lodges_number_trigram ON public.lodges USING gin(number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lodges_grand_lodge_id ON public.lodges(grand_lodge_id);

-- Make sure the pg_trgm extension is enabled for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Insert sample Grand Lodges if the table is empty
INSERT INTO public.grand_lodges (name, country)
SELECT name, country
FROM (VALUES 
  ('United Grand Lodge of England', 'United Kingdom'),
  ('Grand Lodge of Scotland', 'United Kingdom'),
  ('Grand Lodge of Ireland', 'Ireland'),
  ('United Grand Lodge of New South Wales & Australian Capital Territory', 'Australia'),
  ('United Grand Lodge of Victoria', 'Australia'),
  ('United Grand Lodge of Queensland', 'Australia'),
  ('Grand Lodge of Western Australia', 'Australia'),
  ('Grand Lodge of South Australia & Northern Territory', 'Australia'),
  ('Grand Lodge of Tasmania', 'Australia'),
  ('Grand Lodge of New Zealand', 'New Zealand')
) AS sample_data(name, country)
WHERE NOT EXISTS (SELECT 1 FROM public.grand_lodges LIMIT 1);

-- Create search function for Grand Lodges
CREATE OR REPLACE FUNCTION search_grand_lodges(search_query TEXT)
RETURNS SETOF public.grand_lodges AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.grand_lodges
  WHERE name ILIKE '%' || search_query || '%'
  ORDER BY name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create search function for Lodges
CREATE OR REPLACE FUNCTION search_lodges(search_query TEXT, grand_lodge_id_param UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  name TEXT,
  number TEXT,
  grand_lodge_id UUID,
  grand_lodge_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.name, l.number, l.grand_lodge_id, gl.name as grand_lodge_name, l.created_at, l.updated_at
  FROM public.lodges l
  JOIN public.grand_lodges gl ON l.grand_lodge_id = gl.id
  WHERE (l.name ILIKE '%' || search_query || '%' OR l.number ILIKE '%' || search_query || '%')
    AND (grand_lodge_id_param IS NULL OR l.grand_lodge_id = grand_lodge_id_param)
  ORDER BY l.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample lodges for testing
INSERT INTO public.lodges (name, number, grand_lodge_id)
SELECT l.name, l.number, gl.id
FROM (VALUES
  ('Lodge of Antiquity', '2', 'United Grand Lodge of England'),
  ('Royal Somerset House', '4', 'United Grand Lodge of England'),
  ('Lodge of Friendship', '6', 'United Grand Lodge of England'),
  ('British', '8', 'United Grand Lodge of England'),
  ('Sydney Lodge', '1', 'United Grand Lodge of New South Wales & Australian Capital Territory'),
  ('Lodge of Australia', '3', 'United Grand Lodge of New South Wales & Australian Capital Territory'),
  ('Brisbane Lodge', '1', 'United Grand Lodge of Queensland')
) AS l(name, number, gl_name)
JOIN public.grand_lodges gl ON gl.name = l.gl_name
WHERE NOT EXISTS (SELECT 1 FROM public.lodges LIMIT 1);
