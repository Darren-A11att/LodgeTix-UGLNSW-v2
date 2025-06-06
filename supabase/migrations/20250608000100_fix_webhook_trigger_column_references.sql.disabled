-- Fix webhook trigger function to use correct column names and table schema
-- The trigger function was referencing 'id' instead of 'registration_id'
-- Also fixing the webhook_logs column references to match actual table schema

-- Drop any existing triggers first
DROP TRIGGER IF EXISTS registration_completion_trigger ON registrations;
DROP TRIGGER IF EXISTS registration_confirmation_trigger ON registrations;

CREATE OR REPLACE FUNCTION should_generate_confirmation()
RETURNS trigger AS $$
DECLARE
  v_webhook_log_id uuid;
BEGIN
  -- Only proceed if this is a payment completion (both status fields set to completed)
  IF NEW.status = 'completed' AND NEW.payment_status = 'completed' AND 
     (OLD.status IS DISTINCT FROM 'completed' OR OLD.payment_status IS DISTINCT FROM 'completed') THEN
    
    -- Log this for debugging using correct webhook_logs schema
    INSERT INTO webhook_logs (
      webhook_name, 
      table_name, 
      record_id, 
      event_type,
      payload
    ) VALUES (
      'generate_confirmation',
      TG_TABLE_NAME,
      NEW.registration_id::text,  -- Fixed: use registration_id instead of id
      TG_OP,
      jsonb_build_object(
        'registration_id', NEW.registration_id,  -- Fixed: use registration_id instead of id
        'registration_type', NEW.registration_type,
        'function_id', NEW.function_id,
        'status', NEW.status,
        'payment_status', NEW.payment_status,
        'trigger', 'payment_completion'
      )
    ) RETURNING id INTO v_webhook_log_id;
    
    -- In Supabase, webhooks are configured through the dashboard
    -- This trigger is mainly for logging and validation
    -- The actual webhook call will be handled by Supabase's webhook system
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger with a consistent name
CREATE TRIGGER registration_completion_trigger
  AFTER UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION should_generate_confirmation();

-- Add comment for documentation
COMMENT ON FUNCTION should_generate_confirmation() IS 'Triggers confirmation number generation when a registration payment is completed. Fixed to use correct registration_id field and webhook_logs schema.';