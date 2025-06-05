-- Create database webhook for registration completion
-- Note: This is a template - actual webhook creation depends on your Supabase setup

-- First, create a function to track webhook calls (optional, for debugging)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_name text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  event_type text NOT NULL,
  payload jsonb,
  response jsonb,
  status_code int,
  created_at timestamptz DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_webhook_name ON webhook_logs(webhook_name);

-- Function to validate if a registration should trigger confirmation generation
CREATE OR REPLACE FUNCTION should_generate_confirmation()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if this is an UPDATE
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Check if registration just completed
  IF NEW.status = 'completed' AND 
     NEW.payment_status = 'completed' AND
     OLD.confirmation_number IS NULL AND
     NEW.confirmation_number IS NULL THEN
    
    -- Log this for debugging (optional)
    INSERT INTO webhook_logs (
      webhook_name, 
      table_name, 
      record_id, 
      event_type,
      payload
    ) VALUES (
      'generate_confirmation',
      TG_TABLE_NAME,
      NEW.id::text,
      TG_OP,
      jsonb_build_object(
        'registration_id', NEW.id,
        'registration_type', NEW.registration_type,
        'status', NEW.status,
        'payment_status', NEW.payment_status
      )
    );
    
    -- In Supabase, webhooks are configured through the dashboard
    -- This trigger is mainly for logging and validation
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS registration_completion_trigger ON registrations;
CREATE TRIGGER registration_completion_trigger
  AFTER UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION should_generate_confirmation();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon, service_role;
GRANT SELECT, INSERT ON webhook_logs TO service_role;

-- Add RLS policies for webhook_logs (only service role can access)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook logs"
  ON webhook_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Instructions for setting up the actual webhook in Supabase Dashboard:
COMMENT ON TABLE registrations IS E'
WEBHOOK CONFIGURATION:
1. Go to Database Webhooks in Supabase Dashboard
2. Create new webhook with:
   - Name: generate_confirmation
   - Table: registrations
   - Events: UPDATE
   - URL: {SUPABASE_URL}/functions/v1/generate-confirmation
   - Headers: 
     - Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
     - Content-Type: application/json
   - Payload: Enable "Include record payload"
';