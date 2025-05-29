-- Function to update all payment-related statuses after successful payment
CREATE OR REPLACE FUNCTION update_registration_payment_status(
  p_registration_id UUID,
  p_payment_status TEXT,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_amount_paid NUMERIC DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_registration_updated INTEGER := 0;
  v_attendees_updated INTEGER := 0;
  v_tickets_updated INTEGER := 0;
  v_new_status TEXT;
  v_new_payment_status TEXT;
BEGIN
  -- Determine new statuses based on payment status
  IF p_payment_status = 'completed' OR p_payment_status = 'succeeded' THEN
    v_new_status := 'paid';
    v_new_payment_status := 'completed';
  ELSIF p_payment_status = 'requires_action' THEN
    v_new_status := 'pending_payment';
    v_new_payment_status := 'requires_action';
  ELSIF p_payment_status = 'failed' THEN
    v_new_status := 'unpaid';
    v_new_payment_status := 'failed';
  ELSE
    v_new_status := 'unpaid';
    v_new_payment_status := 'pending';
  END IF;

  -- Start transaction
  BEGIN
    -- Update registration
    UPDATE registrations
    SET 
      status = v_new_status,
      payment_status = v_new_payment_status,
      stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
      total_amount_paid = COALESCE(p_amount_paid, total_amount_paid),
      updated_at = NOW()
    WHERE registration_id = p_registration_id;
    
    GET DIAGNOSTICS v_registration_updated = ROW_COUNT;

    -- Note: Attendees table doesn't have payment_status column
    -- Payment is tracked at registration level only
    v_attendees_updated := 0;

    -- Update tickets
    UPDATE tickets
    SET 
      ticket_status = CASE 
        WHEN v_new_payment_status = 'completed' THEN 'completed'
        WHEN v_new_payment_status = 'failed' THEN 'cancelled'
        ELSE 'pending'
      END,
      updated_at = NOW()
    WHERE registration_id = p_registration_id;
    
    GET DIAGNOSTICS v_tickets_updated = ROW_COUNT;

    -- Build result
    v_result := jsonb_build_object(
      'success', true,
      'registration_id', p_registration_id,
      'updates', jsonb_build_object(
        'registration_updated', v_registration_updated,
        'attendees_updated', v_attendees_updated,
        'tickets_updated', v_tickets_updated
      ),
      'new_status', v_new_status,
      'new_payment_status', v_new_payment_status
    );

    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback is automatic
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
      );
  END;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_registration_payment_status TO authenticated;

-- Create a trigger function that automatically updates statuses when payment_status changes
CREATE OR REPLACE FUNCTION trigger_update_related_payment_statuses()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if payment_status actually changed
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    -- Update attendees
    UPDATE attendees
    SET 
      payment_status = CASE 
        WHEN NEW.payment_status = 'completed' THEN 'paid'
        WHEN NEW.payment_status = 'failed' THEN 'failed'
        ELSE 'pending'
      END,
      updated_at = NOW()
    WHERE registration_id = NEW.registration_id;

    -- Update tickets
    UPDATE tickets
    SET 
      ticket_status = CASE 
        WHEN NEW.payment_status = 'completed' THEN 'completed'
        WHEN NEW.payment_status = 'failed' THEN 'cancelled'
        ELSE 'pending'
      END,
      updated_at = NOW()
    WHERE registration_id = NEW.registration_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on registrations table
DROP TRIGGER IF EXISTS update_payment_statuses_on_registration_change ON registrations;
CREATE TRIGGER update_payment_statuses_on_registration_change
  AFTER UPDATE ON registrations
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION trigger_update_related_payment_statuses();

-- Function to handle webhook updates from Stripe
CREATE OR REPLACE FUNCTION handle_stripe_webhook_payment_update(
  p_payment_intent_id TEXT,
  p_stripe_status TEXT,
  p_amount_received INTEGER -- Amount in cents
)
RETURNS jsonb AS $$
DECLARE
  v_registration RECORD;
  v_result jsonb;
BEGIN
  -- Find the registration by payment intent ID
  SELECT * INTO v_registration
  FROM registrations
  WHERE stripe_payment_intent_id = p_payment_intent_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Registration not found',
      'payment_intent_id', p_payment_intent_id
    );
  END IF;
  
  -- Map Stripe status to our status
  RETURN update_registration_payment_status(
    v_registration.registration_id,
    p_stripe_status,
    p_payment_intent_id,
    p_amount_received / 100.0 -- Convert cents to dollars
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission for webhook function
GRANT EXECUTE ON FUNCTION handle_stripe_webhook_payment_update TO service_role;