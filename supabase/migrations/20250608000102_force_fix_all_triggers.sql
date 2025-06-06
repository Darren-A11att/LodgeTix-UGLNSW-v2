-- FORCE FIX: Comprehensive solution to the webhook trigger issues
-- This will drop ALL triggers and functions, then recreate correctly

-- Step 1: Drop ALL triggers on registrations table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name 
              FROM information_schema.triggers 
              WHERE event_object_table = 'registrations' 
              AND event_object_schema = 'public')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.registrations CASCADE', r.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- Step 2: Drop ALL functions that might be related
DROP FUNCTION IF EXISTS should_generate_confirmation() CASCADE;
DROP FUNCTION IF EXISTS handle_registration_update() CASCADE;
DROP FUNCTION IF EXISTS webhook_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS registration_confirmation_trigger() CASCADE;

-- Step 3: Ensure webhook_logs table has correct structure
-- First check if it exists and has the right columns
DO $$
BEGIN
    -- Ensure the table exists
    CREATE TABLE IF NOT EXISTS webhook_logs (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        webhook_name text NOT NULL,
        table_name text NOT NULL,
        record_id text,
        event_type text NOT NULL,
        payload jsonb,
        response jsonb,
        status_code integer,
        created_at timestamptz DEFAULT now()
    );
    
    -- If 'operation' column exists, drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_logs' 
        AND column_name = 'operation'
    ) THEN
        ALTER TABLE webhook_logs DROP COLUMN operation;
        RAISE NOTICE 'Dropped operation column from webhook_logs';
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        -- Table already exists, that's fine
        NULL;
END $$;

-- Step 4: Create the ONLY trigger function we need
CREATE OR REPLACE FUNCTION should_generate_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if this is an UPDATE
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Check if registration just completed payment
  IF NEW.status = 'completed' AND 
     NEW.payment_status = 'completed' AND
     (OLD.status IS DISTINCT FROM 'completed' OR OLD.payment_status IS DISTINCT FROM 'completed') THEN
    
    -- Log to webhook_logs for debugging
    BEGIN
      INSERT INTO webhook_logs (
        webhook_name, 
        table_name, 
        record_id, 
        event_type,  -- CORRECT column name
        payload
      ) VALUES (
        'generate_confirmation',
        TG_TABLE_NAME,
        NEW.registration_id::text,  -- CORRECT: using registration_id
        'UPDATE',  -- Use static value instead of TG_OP to be safe
        jsonb_build_object(
          'registration_id', NEW.registration_id,
          'registration_type', NEW.registration_type,
          'function_id', NEW.function_id,
          'status', NEW.status,
          'payment_status', NEW.payment_status,
          'old_status', OLD.status,
          'old_payment_status', OLD.payment_status,
          'trigger', 'payment_completion',
          'timestamp', now()
        )
      );
      RAISE LOG 'Webhook log created for registration %', NEW.registration_id;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Failed to create webhook log: % - %', SQLERRM, SQLSTATE;
    END;
    
    -- Try to call Edge Function (optional, may fail in local dev)
    BEGIN
      PERFORM net.http_post(
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
      RAISE LOG 'Edge Function call skipped (local dev): %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 5: Create ONLY ONE trigger
CREATE TRIGGER registration_payment_webhook_trigger
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION should_generate_confirmation();

-- Step 6: Add documentation
COMMENT ON FUNCTION should_generate_confirmation() IS 'FINAL FIX: Triggers confirmation when payment completes. Uses correct column names.';
COMMENT ON TRIGGER registration_payment_webhook_trigger ON public.registrations IS 'FINAL: Single trigger for payment completion';

-- Step 7: Grant permissions
GRANT SELECT, INSERT ON webhook_logs TO authenticated, service_role;

-- Step 8: Verify no other triggers exist
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'registrations' 
    AND event_object_schema = 'public';
    
    RAISE NOTICE 'Total triggers on registrations table: %', trigger_count;
    
    IF trigger_count > 1 THEN
        RAISE WARNING 'Multiple triggers detected! There should only be one.';
    END IF;
END $$;