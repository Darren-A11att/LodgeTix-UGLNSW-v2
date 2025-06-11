-- Fix webhook payload format to match edge function expectations
-- This migration updates the registration completion trigger to send the correct payload format

CREATE OR REPLACE FUNCTION public.should_generate_confirmation()
RETURNS trigger
LANGUAGE plpgsql
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
          'stripe_payment_intent_id', NEW.stripe_payment_intent_id,
          'booking_contact_email', NEW.booking_contact_email,
          'booking_contact_first_name', NEW.booking_contact_first_name,
          'booking_contact_last_name', NEW.booking_contact_last_name,
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
            'stripe_payment_intent_id', OLD.stripe_payment_intent_id,
            'booking_contact_email', OLD.booking_contact_email,
            'booking_contact_first_name', OLD.booking_contact_first_name,
            'booking_contact_last_name', OLD.booking_contact_last_name,
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

-- Update the comment on the registrations table with corrected webhook setup instructions
COMMENT ON TABLE public.registrations IS '
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
   - HTTP Method: POST
   - Payload: Enable "Include record payload"
   
Note: The webhook will receive the full Supabase webhook payload format:
{
  "type": "UPDATE",
  "table": "registrations", 
  "schema": "public",
  "record": { ... },
  "old_record": { ... }
}

This trigger function logs webhook calls for debugging purposes.
';