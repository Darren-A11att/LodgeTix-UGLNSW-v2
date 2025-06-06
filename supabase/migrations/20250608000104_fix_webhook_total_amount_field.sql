-- Fix webhook trigger function to use correct field names for total amount
-- The registrations table has 'total_amount_paid' and 'total_price_paid', not 'total_amount'

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
          'total_price_paid', NEW.total_price_paid,
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
            'total_price_paid', OLD.total_price_paid,
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

-- Also check if booking_contact fields exist, if not remove them from the payload
DO $$
BEGIN
  -- Check if booking_contact_email column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registrations' 
    AND column_name = 'booking_contact_email'
  ) THEN
    -- Recreate function without booking_contact fields
    CREATE OR REPLACE FUNCTION public.should_generate_confirmation()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $func$
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
    $func$;
  END IF;
END;
$$;