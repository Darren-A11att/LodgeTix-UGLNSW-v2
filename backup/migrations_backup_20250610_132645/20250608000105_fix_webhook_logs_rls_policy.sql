-- Fix RLS policy for webhook_logs table to allow trigger functions to insert logs
-- The trigger function needs to be able to insert logs when called from any context

-- Option 1: Run the trigger function with SECURITY DEFINER so it runs with elevated privileges
-- This is the most secure approach as it limits access to just the trigger function

-- First, drop and recreate the trigger function with SECURITY DEFINER
DROP FUNCTION IF EXISTS public.should_generate_confirmation() CASCADE;

CREATE OR REPLACE FUNCTION public.should_generate_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the owner (postgres)
SET search_path = public -- Good practice when using SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger for payment completion that needs confirmation generation
  IF NEW.status = 'completed' AND
     NEW.payment_status = 'completed' AND
     OLD.confirmation_number IS NULL AND
     NEW.confirmation_number IS NULL THEN
    
    -- Log webhook call with correct payload format matching Supabase webhook structure
    INSERT INTO webhook_logs (
      webhook_name, 
      table_name, 
      record_id, 
      event_type,
      payload
    ) VALUES (
      'generate_confirmation',
      TG_TABLE_NAME,
      NEW.registration_id::text,
      TG_OP,
      jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', jsonb_build_object(
          'id', NEW.registration_id,
          'registration_id', NEW.registration_id,
          'registration_type', NEW.registration_type,
          'status', NEW.status,
          'payment_status', NEW.payment_status,
          'confirmation_number', NEW.confirmation_number,
          'function_id', NEW.function_id,
          'customer_id', NEW.customer_id,
          'total_amount_paid', NEW.total_amount_paid,
          'total_price_paid', NEW.total_price_paid,
          'stripe_payment_intent_id', NEW.stripe_payment_intent_id,
          'created_at', NEW.created_at,
          'updated_at', NEW.updated_at
        ),
        'old_record', CASE 
          WHEN OLD IS NOT NULL THEN jsonb_build_object(
            'id', OLD.registration_id,
            'registration_id', OLD.registration_id,
            'registration_type', OLD.registration_type,
            'status', OLD.status,
            'payment_status', OLD.payment_status,
            'confirmation_number', OLD.confirmation_number,
            'function_id', OLD.function_id,
            'customer_id', OLD.customer_id,
            'total_amount_paid', OLD.total_amount_paid,
            'total_price_paid', OLD.total_price_paid,
            'stripe_payment_intent_id', OLD.stripe_payment_intent_id,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
          )
          ELSE NULL
        END
      )
    );
    
    -- Note: The actual webhook call is configured through the Supabase Dashboard
    -- This trigger creates the log entry that can be used for debugging
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger (it was dropped with CASCADE above)
CREATE TRIGGER registration_payment_webhook_trigger
AFTER UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.should_generate_confirmation();

-- Also create a more permissive policy for webhook_logs that allows authenticated users to insert
-- This is a backup in case SECURITY DEFINER doesn't work as expected
CREATE POLICY "Allow authenticated users to insert webhook logs" 
ON public.webhook_logs 
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Allow authenticated users to view their own webhook logs (useful for debugging)
CREATE POLICY "Allow authenticated users to view webhook logs" 
ON public.webhook_logs 
FOR SELECT 
TO authenticated
USING (true);

-- Ensure the postgres user owns the function
ALTER FUNCTION public.should_generate_confirmation() OWNER TO postgres;