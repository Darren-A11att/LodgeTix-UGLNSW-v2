-- Final comprehensive fix for registration triggers
-- This ensures we have only one trigger with the correct field references

-- First, drop ALL triggers on registrations table
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all triggers on registrations table and drop them
    FOR r IN (SELECT trigger_name 
              FROM information_schema.triggers 
              WHERE event_object_table = 'registrations' 
              AND event_object_schema = 'public')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.registrations', r.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- Drop any existing webhook trigger functions
DROP FUNCTION IF EXISTS should_generate_confirmation() CASCADE;
DROP FUNCTION IF EXISTS handle_registration_update() CASCADE;
DROP FUNCTION IF EXISTS webhook_trigger_function() CASCADE;

-- Create the correct function with proper field names
CREATE OR REPLACE FUNCTION should_generate_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this is a payment completion (both status fields set to completed)
  IF NEW.status = 'completed' AND NEW.payment_status = 'completed' AND 
     (OLD.status IS DISTINCT FROM 'completed' OR OLD.payment_status IS DISTINCT FROM 'completed') THEN
    
    -- Log to webhook_logs for debugging
    BEGIN
      INSERT INTO webhook_logs (
        webhook_name,
        table_name,
        record_id,
        event_type,
        payload
      ) VALUES (
        'generate-confirmation',
        'registrations',
        NEW.registration_id::text,  -- CORRECT: using registration_id not id
        'payment_completed',
        jsonb_build_object(
          'registration_id', NEW.registration_id,
          'registration_type', NEW.registration_type,
          'function_id', NEW.function_id,
          'payment_status', NEW.payment_status,
          'status', NEW.status,
          'trigger', 'payment_completion',
          'timestamp', now()
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE LOG 'Failed to insert webhook log: %', SQLERRM;
    END;
    
    -- Try to call Edge Function (may not work in local dev)
    BEGIN
      PERFORM
        net.http_post(
          url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-confirmation',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
          ),
          body := jsonb_build_object(
            'registration_id', NEW.registration_id,
            'registration_type', NEW.registration_type
          )
        );
    EXCEPTION WHEN OTHERS THEN
      -- Expected to fail in local development
      RAISE LOG 'Edge Function call failed (expected in local dev): %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a single, properly named trigger
CREATE TRIGGER registration_payment_completed_trigger
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION should_generate_confirmation();

-- Add documentation
COMMENT ON FUNCTION should_generate_confirmation() IS 'Triggers confirmation generation when registration payment completes. Uses correct registration_id field.';
COMMENT ON TRIGGER registration_payment_completed_trigger ON public.registrations IS 'Monitors registrations for payment completion';