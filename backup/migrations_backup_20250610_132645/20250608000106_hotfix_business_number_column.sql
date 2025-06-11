-- HOTFIX: Remove business_number column references from upsert_lodge_registration
-- This fixes the immediate production error while preserving lodge number in registration_data

CREATE OR REPLACE FUNCTION public.upsert_lodge_registration(
  p_function_id uuid,
  p_package_id uuid,
  p_table_count integer,
  p_booking_contact jsonb,
  p_lodge_details jsonb,
  p_payment_status text DEFAULT 'pending'::text,
  p_stripe_payment_intent_id text DEFAULT NULL::text,
  p_registration_id uuid DEFAULT NULL::uuid,
  p_total_amount numeric DEFAULT 0,
  p_subtotal numeric DEFAULT 0,
  p_stripe_fee numeric DEFAULT 0,
  p_metadata jsonb DEFAULT NULL::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_customer_id uuid;
  v_registration_id uuid;
  v_booking_contact_id uuid;
  v_confirmation_number text;
  v_organisation_id uuid;
  v_organisation_name text;
  v_organisation_number text;
  v_total_attendees integer;
  v_package_price numeric;
  v_result jsonb;
  v_event_ticket record;
  v_event_id uuid;
  v_ticket_count integer;
  v_i integer;
  v_status text;
BEGIN
  -- Validate input
  IF p_booking_contact IS NULL OR p_booking_contact->>'email' IS NULL THEN
    RAISE EXCEPTION 'Booking contact email is required';
  END IF;

  IF p_lodge_details IS NULL OR p_lodge_details->>'lodgeName' IS NULL THEN
    RAISE EXCEPTION 'Lodge name is required';
  END IF;

  -- Calculate total attendees based on table count
  v_total_attendees := p_table_count * 10;

  -- Get package price
  SELECT package_price INTO v_package_price
  FROM packages
  WHERE package_id = p_package_id;

  -- Extract customer ID from auth context or booking contact
  v_customer_id := COALESCE(
    auth.uid(),
    (p_booking_contact->>'authUserId')::uuid
  );

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required';
  END IF;

  -- Create or update customer record (FIXED: removed business_number)
  INSERT INTO customers (
    customer_id,
    customer_type,
    first_name,
    last_name,
    email,
    phone,
    business_name,
    created_at,
    updated_at
  ) VALUES (
    v_customer_id,
    'booking_contact',
    p_booking_contact->>'firstName',
    p_booking_contact->>'lastName',
    p_booking_contact->>'email',
    p_booking_contact->>'mobile',
    p_lodge_details->>'lodgeName',
    now(),
    now()
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    business_name = EXCLUDED.business_name,
    updated_at = now();

  -- Create booking contact if needed
  v_booking_contact_id := gen_random_uuid();

  -- Set registration ID and confirmation number
  v_registration_id := COALESCE(p_registration_id, gen_random_uuid());
  
  -- For lodge registrations, set confirmation_number to NULL initially
  -- Edge Function will generate it after payment completion
  v_confirmation_number := NULL;

  -- Extract organisation details - use organisation_id from lodge details
  v_organisation_id := COALESCE(
    (p_lodge_details->>'organisation_id')::uuid,
    (p_lodge_details->>'lodge_id')::uuid  -- Fallback for backward compatibility
  );
  v_organisation_name := p_lodge_details->>'lodgeName';
  v_organisation_number := p_lodge_details->>'lodgeNumber';

  -- Determine status based on payment
  IF p_payment_status IN ('completed', 'paid') THEN
    v_status := 'completed';
  ELSE
    v_status := 'pending';
  END IF;

  -- Create or update registration
  INSERT INTO registrations (
    registration_id,
    function_id,
    customer_id,
    auth_user_id,
    organisation_id,
    organisation_name,
    organisation_number,
    primary_attendee,
    attendee_count,
    registration_type,
    status,
    payment_status,
    stripe_payment_intent_id,
    registration_date,
    agree_to_terms,
    total_amount_paid,
    total_price_paid,
    subtotal,
    stripe_fee,
    includes_processing_fee,
    created_at,
    updated_at,
    confirmation_number,
    registration_data
  ) VALUES (
    v_registration_id,
    p_function_id,
    v_customer_id,
    v_customer_id,
    v_organisation_id,
    v_organisation_name,
    v_organisation_number,
    jsonb_build_object(
      'firstName', p_booking_contact->>'firstName',
      'lastName', p_booking_contact->>'lastName',
      'email', p_booking_contact->>'email',
      'mobile', p_booking_contact->>'mobile',
      'dietaryRequirements', p_booking_contact->>'dietaryRequirements',
      'additionalInfo', p_booking_contact->>'additionalInfo'
    ),
    v_total_attendees,
    'lodge',
    v_status,  -- Set status based on payment
    p_payment_status,
    p_stripe_payment_intent_id,
    now(),
    COALESCE((p_booking_contact->>'agreeToTerms')::boolean, true),
    p_total_amount,
    p_total_amount,
    p_subtotal,
    p_stripe_fee,
    p_stripe_fee > 0,
    now(),
    now(),
    v_confirmation_number,
    jsonb_build_object(
      'bookingContact', p_booking_contact,
      'lodgeDetails', p_lodge_details,
      'packageId', p_package_id,
      'tableCount', p_table_count,
      'metadata', p_metadata,
      'lodgeNumber', p_lodge_details->>'lodgeNumber'  -- Store lodge number in registration_data
    )
  )
  ON CONFLICT (registration_id) DO UPDATE SET
    function_id = EXCLUDED.function_id,
    organisation_id = EXCLUDED.organisation_id,
    organisation_name = EXCLUDED.organisation_name,
    organisation_number = EXCLUDED.organisation_number,
    primary_attendee = EXCLUDED.primary_attendee,
    attendee_count = EXCLUDED.attendee_count,
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
    total_amount_paid = EXCLUDED.total_amount_paid,
    total_price_paid = EXCLUDED.total_price_paid,
    subtotal = EXCLUDED.subtotal,
    stripe_fee = EXCLUDED.stripe_fee,
    includes_processing_fee = EXCLUDED.includes_processing_fee,
    registration_data = EXCLUDED.registration_data,
    updated_at = now();

  -- Create tickets for lodge registrations based on package included_items
  IF p_payment_status IN ('completed', 'paid') THEN
    -- Get included items from package
    FOR v_event_ticket IN 
      SELECT 
        item.event_ticket_id,
        item.quantity,
        et.event_id,
        et.price
      FROM packages p
      CROSS JOIN LATERAL unnest(p.included_items) AS item
      JOIN event_tickets et ON et.event_ticket_id = item.event_ticket_id
      WHERE p.package_id = p_package_id
    LOOP
      -- Create tickets for each included item
      v_ticket_count := v_event_ticket.quantity * p_table_count;
      
      FOR v_i IN 1..v_ticket_count LOOP
        INSERT INTO tickets (
          ticket_id,
          attendee_id,  -- NULL for lodge tickets
          registration_id,
          event_id,
          event_ticket_id,
          price_paid,
          status,
          ticket_number,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          NULL,  -- No attendee for lodge tickets
          v_registration_id,
          v_event_ticket.event_id,
          v_event_ticket.event_ticket_id,
          v_event_ticket.price,
          'sold'::ticket_status,
          'LDG-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0'),
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        );
      END LOOP;
    END LOOP;
  END IF;

  -- Update payment status if needed
  IF p_payment_status IN ('completed', 'paid') THEN
    UPDATE registrations 
    SET 
      payment_status = 'completed',
      status = 'completed',
      updated_at = now()
    WHERE registration_id = v_registration_id;
  END IF;

  -- Count created tickets
  SELECT COUNT(*) INTO v_ticket_count
  FROM tickets
  WHERE registration_id = v_registration_id;

  -- Return result
  v_result := jsonb_build_object(
    'success', true,
    'registrationId', v_registration_id,
    'confirmationNumber', v_confirmation_number,
    'customerId', v_customer_id,
    'bookingContactId', v_booking_contact_id,
    'organisationName', v_organisation_name,
    'tableCount', p_table_count,
    'totalAttendees', v_total_attendees,
    'createdTickets', v_ticket_count
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in upsert_lodge_registration: %', SQLERRM;
END;
$function$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.upsert_lodge_registration(uuid, uuid, integer, jsonb, jsonb, text, text, uuid, numeric, numeric, numeric, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_lodge_registration(uuid, uuid, integer, jsonb, jsonb, text, text, uuid, numeric, numeric, numeric, jsonb) TO anon;