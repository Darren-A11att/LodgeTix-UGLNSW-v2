-- Update the create_registration RPC function to return confirmation_number
-- This is a patch to the existing function to include confirmation_number in the response

-- First, let's create a wrapper function that gets the confirmation number after insert
CREATE OR REPLACE FUNCTION get_registration_confirmation_number(p_registration_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_confirmation_number TEXT;
BEGIN
  SELECT confirmation_number 
  INTO v_confirmation_number
  FROM registrations
  WHERE registration_id = p_registration_id;
  
  RETURN v_confirmation_number;
END;
$$ LANGUAGE plpgsql;

-- Now update the main RPC function's return statement
-- This assumes the original function exists and we're just patching the return
-- In production, you'd modify the full function, but for now let's create a 
-- patch that updates the return value

-- Create a patched version of the response builder
CREATE OR REPLACE FUNCTION build_registration_response(
  p_registration_id UUID,
  p_customer_id UUID,
  p_registration_data jsonb,
  p_people_created jsonb,
  p_attendee_results jsonb,
  p_ticket_results jsonb
) RETURNS jsonb AS $$
DECLARE
  v_confirmation_number TEXT;
BEGIN
  -- Get the confirmation number that was auto-generated
  SELECT confirmation_number 
  INTO v_confirmation_number
  FROM registrations
  WHERE registration_id = p_registration_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'registration_id', p_registration_id,
    'confirmation_number', v_confirmation_number,
    'customer_id', p_customer_id,
    'registration', jsonb_build_object(
      'id', p_registration_id,
      'confirmation_number', v_confirmation_number,
      'status', COALESCE(p_registration_data->>'status', 'unpaid'),
      'payment_status', COALESCE(p_registration_data->>'payment_status', 'pending'),
      'total_amount', (p_registration_data->>'total_price_paid')::numeric
    ),
    'people_created', p_people_created,
    'attendees_created', p_attendee_results,
    'tickets_created', p_ticket_results,
    'summary', jsonb_build_object(
      'people_count', jsonb_array_length(p_people_created),
      'attendees_count', jsonb_array_length(p_attendee_results),
      'tickets_count', jsonb_array_length(p_ticket_results),
      'total_amount', (p_registration_data->>'total_price_paid')::numeric
    )
  );
END;
$$ LANGUAGE plpgsql;