-- Fix the trigger function that incorrectly tries to update payment_status on attendees table
-- Attendees table doesn't have a payment_status column - payment is tracked at registration level only

CREATE OR REPLACE FUNCTION trigger_update_related_payment_statuses()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if payment_status actually changed
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    -- Note: Attendees table doesn't have payment_status column
    -- Payment status is tracked at registration level only
    -- So we don't update attendees table

    -- Update tickets only
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

-- Recreate the trigger to use the fixed function
DROP TRIGGER IF EXISTS update_payment_statuses_on_registration_change ON registrations;
CREATE TRIGGER update_payment_statuses_on_registration_change
  AFTER UPDATE ON registrations
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION trigger_update_related_payment_statuses();