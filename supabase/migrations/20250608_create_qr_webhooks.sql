-- Migration: Create database webhooks for QR code generation
-- This sets up webhooks to trigger Edge Functions when tickets or attendees are created

-- Note: Database webhooks in Supabase are configured through the dashboard or CLI
-- This migration file documents the SQL equivalent for reference

-- The actual webhook configuration should be done via:
-- 1. Supabase Dashboard > Database > Webhooks
-- 2. Or using Supabase CLI commands

-- Webhook 1: Ticket QR Generation
-- Name: generate-ticket-qr-webhook
-- Table: tickets
-- Events: INSERT
-- URL: https://[PROJECT_REF].supabase.co/functions/v1/generate-ticket-qr
-- Method: POST
-- Headers: 
--   Content-Type: application/json
--   Authorization: Bearer [ANON_KEY]

-- Webhook 2: Attendee QR Generation  
-- Name: generate-attendee-qr-webhook
-- Table: attendees
-- Events: INSERT
-- URL: https://[PROJECT_REF].supabase.co/functions/v1/generate-attendee-qr
-- Method: POST
-- Headers:
--   Content-Type: application/json
--   Authorization: Bearer [ANON_KEY]

-- For local development, you can use pg_net extension (if available):
-- Note: This is for reference only - use Supabase Dashboard/CLI in production

-- Example of what the webhook would look like using pg_net:
/*
-- Enable pg_net extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to call Edge Function for tickets
CREATE OR REPLACE FUNCTION trigger_ticket_qr_generation()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.supabase_functions_url') || '/generate-ticket-qr',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'tickets',
      'record', row_to_json(NEW),
      'old_record', NULL
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to call Edge Function for attendees
CREATE OR REPLACE FUNCTION trigger_attendee_qr_generation()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.supabase_functions_url') || '/generate-attendee-qr',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'attendees',
      'record', row_to_json(NEW),
      'old_record', NULL
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER generate_ticket_qr_trigger
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ticket_qr_generation();

CREATE TRIGGER generate_attendee_qr_trigger
  AFTER INSERT ON attendees
  FOR EACH ROW
  EXECUTE FUNCTION trigger_attendee_qr_generation();
*/

-- Add comment to document webhook setup
COMMENT ON TABLE tickets IS 'Webhook configured: generate-ticket-qr-webhook triggers on INSERT to generate QR codes';
COMMENT ON TABLE attendees IS 'Webhook configured: generate-attendee-qr-webhook triggers on INSERT to generate QR codes';