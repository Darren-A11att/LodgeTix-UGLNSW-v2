-- Migration: Add QR Code URLs to attendees and ensure auth_user_id in registrations
-- This migration adds the necessary columns for QR code storage

-- Add qr_code_url to attendees table
ALTER TABLE public.attendees 
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Add index for performance when looking up by QR code
CREATE INDEX IF NOT EXISTS idx_attendees_qr_code_url 
ON public.attendees(qr_code_url) 
WHERE qr_code_url IS NOT NULL;

-- Ensure auth_user_id exists in registrations (for QR code data)
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Add index for auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_registrations_auth_user_id 
ON public.registrations(auth_user_id) 
WHERE auth_user_id IS NOT NULL;

-- Add comment documenting the purpose
COMMENT ON COLUMN public.attendees.qr_code_url IS 'URL to the attendee QR code image stored in Supabase Storage';
COMMENT ON COLUMN public.registrations.auth_user_id IS 'Auth user ID of the person who created the registration';

-- Create attendee-qr-codes storage bucket as PUBLIC
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('attendee-qr-codes', 'attendee-qr-codes', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create ticket-qr-codes storage bucket as PUBLIC
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('ticket-qr-codes', 'ticket-qr-codes', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET public = true;

-- Since buckets are public, we don't need SELECT policies for public access
-- The public=true on the bucket handles that automatically

-- RLS policies for attendee-qr-codes bucket
-- Allow service role to upload attendee QR codes (Edge Functions)
CREATE POLICY "Service role can upload attendee QR codes" ON storage.objects
FOR INSERT TO service_role
WITH CHECK (bucket_id = 'attendee-qr-codes');

-- Allow service role to update attendee QR codes
CREATE POLICY "Service role can update attendee QR codes" ON storage.objects
FOR UPDATE TO service_role
USING (bucket_id = 'attendee-qr-codes');

-- RLS policies for ticket-qr-codes bucket
-- Allow service role to upload ticket QR codes (Edge Functions)
CREATE POLICY "Service role can upload ticket QR codes" ON storage.objects
FOR INSERT TO service_role
WITH CHECK (bucket_id = 'ticket-qr-codes');

-- Allow service role to update ticket QR codes
CREATE POLICY "Service role can update ticket QR codes" ON storage.objects
FOR UPDATE TO service_role
USING (bucket_id = 'ticket-qr-codes');