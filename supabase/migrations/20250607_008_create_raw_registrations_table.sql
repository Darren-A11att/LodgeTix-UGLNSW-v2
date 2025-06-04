-- Create raw_registrations table for debugging and auditing
CREATE TABLE IF NOT EXISTS public.raw_registrations (
    raw_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on created_at for performance
CREATE INDEX idx_raw_registrations_created_at ON public.raw_registrations(created_at);

-- Enable RLS
ALTER TABLE public.raw_registrations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts
CREATE POLICY "Allow anonymous inserts to raw_registrations" ON public.raw_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create policy to allow reads for authenticated users
CREATE POLICY "Allow authenticated reads from raw_registrations" ON public.raw_registrations
FOR SELECT
TO authenticated
USING (true);