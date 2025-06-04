-- Final migration for individuals registration system
-- This handles all requirements including customer_id changes and comprehensive data creation

-- First, ensure we have auth_user_id on attendees table
ALTER TABLE attendees 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_attendees_auth_user_id ON attendees(auth_user_id);

-- Ensure registrations table has customer_id
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(customer_id);

CREATE INDEX IF NOT EXISTS idx_registrations_customer_id ON registrations(customer_id);

-- Update foreign key constraint for customer_id
ALTER TABLE registrations 
DROP CONSTRAINT IF EXISTS registrations_customer_id_fkey;

ALTER TABLE registrations
ADD CONSTRAINT registrations_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES customers(customer_id) 
ON DELETE SET NULL;

-- Drop existing objects to recreate with updates
DROP VIEW IF EXISTS public.individuals_registration_complete_view CASCADE;
DROP VIEW IF EXISTS public.individuals_registered_view CASCADE;
DROP FUNCTION IF EXISTS public.upsert_individual_registration CASCADE;

-- Create the comprehensive RPC function
CREATE OR REPLACE FUNCTION public.upsert_individual_registration(
  p_registration_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registration_id uuid;
  v_function_id uuid;
  v_auth_user_id uuid;
  v_customer_id uuid;
  v_booking_contact_id uuid;
  v_primary_attendee_id uuid;
  v_attendee_record jsonb;
  v_ticket_record jsonb;
  v_package_record record;
  v_package_item jsonb;
  v_event_ticket record;
  v_confirmation_number text;
  v_bill_to_primary boolean;
  v_is_payment_update boolean := false;
  v_existing_status text;
BEGIN
  -- Extract core data
  v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
  v_function_id := (p_registration_data->>'functionId')::uuid;
  v_bill_to_primary := COALESCE((p_registration_data->>'billToPrimaryAttendee')::boolean, false);
  v_auth_user_id := (p_registration_data->>'authUserId')::uuid;
  v_customer_id := v_auth_user_id; -- customer_id is auth.uid()
  
  -- Generate confirmation number
  v_confirmation_number := 'FUNC-' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                          substr(v_registration_id::text, 1, 4);

  -- Check if this is a payment update
  SELECT status INTO v_existing_status
  FROM registrations
  WHERE registration_id = v_registration_id;
  
  v_is_payment_update := v_existing_status IS NOT NULL AND 
                        (p_registration_data->>'paymentCompleted')::boolean = true;

  -- Step 1: ALWAYS create/update customer record
  INSERT INTO customers (
    customer_id,
    email,
    first_name,
    last_name,
    phone,
    business_name,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    billing_email,
    billing_phone,
    billing_organisation_name,
    billing_street_address,
    billing_city,
    billing_state,
    billing_postal_code,
    billing_country,
    customer_type,
    contact_id,
    created_at,
    updated_at
  ) VALUES (
    v_customer_id,
    p_registration_data->'billingDetails'->>'emailAddress',
    p_registration_data->'billingDetails'->>'firstName',
    p_registration_data->'billingDetails'->>'lastName',
    p_registration_data->'billingDetails'->>'mobileNumber',
    p_registration_data->'billingDetails'->>'businessName',
    p_registration_data->'billingDetails'->>'addressLine1',
    p_registration_data->'billingDetails'->>'addressLine2',
    p_registration_data->'billingDetails'->>'suburb',
    p_registration_data->'billingDetails'->'stateTerritory'->>'name',
    p_registration_data->'billingDetails'->>'postcode',
    p_registration_data->'billingDetails'->'country'->>'name',
    p_registration_data->'billingDetails'->>'emailAddress',
    p_registration_data->'billingDetails'->>'mobileNumber',
    p_registration_data->'billingDetails'->>'businessName',
    p_registration_data->'billingDetails'->>'addressLine1',
    p_registration_data->'billingDetails'->>'suburb',
    p_registration_data->'billingDetails'->'stateTerritory'->>'name',
    p_registration_data->'billingDetails'->>'postcode',
    p_registration_data->'billingDetails'->'country'->>'name',
    'booking_contact',
    v_booking_contact_id, -- Will be set after creating contact
    NOW(),
    NOW()
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    business_name = EXCLUDED.business_name,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    postal_code = EXCLUDED.postal_code,
    country = EXCLUDED.country,
    billing_email = EXCLUDED.billing_email,
    billing_phone = EXCLUDED.billing_phone,
    billing_organisation_name = EXCLUDED.billing_organisation_name,
    billing_street_address = EXCLUDED.billing_street_address,
    billing_city = EXCLUDED.billing_city,
    billing_state = EXCLUDED.billing_state,
    billing_postal_code = EXCLUDED.billing_postal_code,
    billing_country = EXCLUDED.billing_country,
    contact_id = COALESCE(EXCLUDED.contact_id, customers.contact_id),
    updated_at = NOW();

  -- Step 2: ALWAYS create booking contact in contacts table
  INSERT INTO contacts (
    auth_user_id,
    email,
    first_name,
    last_name,
    mobile_number,
    type,
    title,
    business_name,
    address_line_1,
    address_line_2,
    suburb_city,
    state,
    postcode,
    country,
    billing_email,
    billing_phone,
    billing_organisation_name,
    billing_street_address,
    billing_city,
    billing_state,
    billing_postal_code,
    billing_country,
    created_at,
    updated_at
  ) VALUES (
    v_auth_user_id,
    p_registration_data->'billingDetails'->>'emailAddress',
    p_registration_data->'billingDetails'->>'firstName',
    p_registration_data->'billingDetails'->>'lastName',
    p_registration_data->'billingDetails'->>'mobileNumber',
    'individual',
    p_registration_data->'billingDetails'->>'title',
    p_registration_data->'billingDetails'->>'businessName',
    p_registration_data->'billingDetails'->>'addressLine1',
    p_registration_data->'billingDetails'->>'addressLine2',
    p_registration_data->'billingDetails'->>'suburb',
    p_registration_data->'billingDetails'->'stateTerritory'->>'name',
    p_registration_data->'billingDetails'->>'postcode',
    p_registration_data->'billingDetails'->'country'->>'name',
    p_registration_data->'billingDetails'->>'emailAddress',
    p_registration_data->'billingDetails'->>'mobileNumber',
    p_registration_data->'billingDetails'->>'businessName',
    p_registration_data->'billingDetails'->>'addressLine1',
    p_registration_data->'billingDetails'->>'suburb',
    p_registration_data->'billingDetails'->'stateTerritory'->>'name',
    p_registration_data->'billingDetails'->>'postcode',
    p_registration_data->'billingDetails'->'country'->>'name',
    NOW(),
    NOW()
  )
  RETURNING contact_id INTO v_booking_contact_id;

  -- Update customer with contact_id
  UPDATE customers 
  SET contact_id = v_booking_contact_id 
  WHERE customer_id = v_customer_id;

  -- Step 3: Process all attendees
  FOR v_attendee_record IN 
    SELECT * FROM jsonb_array_elements(
      COALESCE(
        jsonb_build_array(p_registration_data->'primaryAttendee') || 
        COALESCE(p_registration_data->'additionalAttendees', '[]'::jsonb),
        '[]'::jsonb
      )
    )
  LOOP
    DECLARE
      v_contact_id uuid := NULL;
      v_attendee_id uuid;
      v_is_primary boolean;
      v_attendee_type text;
      v_contact_preference text;
      v_should_create_contact boolean;
      v_lodge_org_id uuid;
    BEGIN
      v_is_primary := COALESCE((v_attendee_record->>'isPrimary')::boolean, false);
      v_attendee_type := LOWER(COALESCE(v_attendee_record->>'attendeeType', 'guest'));
      v_contact_preference := LOWER(COALESCE(v_attendee_record->>'contactPreference', 'directly'));
      
      -- Only create contact if preference is 'directly'
      v_should_create_contact := v_contact_preference = 'directly';
      
      -- Get lodge organisation_id if mason
      IF v_attendee_type = 'mason' AND v_attendee_record->>'lodge_id' IS NOT NULL THEN
        SELECT organisation_id INTO v_lodge_org_id
        FROM lodges 
        WHERE lodge_id = (v_attendee_record->>'lodge_id')::uuid;
      END IF;
      
      -- Create contact only if should_create_contact
      IF v_should_create_contact THEN
        -- Determine suffix values based on attendee type
        DECLARE
          v_suffix_1 text;
          v_suffix_2 text;
          v_suffix_3 text;
          v_partner_name text;
        BEGIN
          IF v_attendee_type = 'mason' THEN
            -- Mason suffix logic
            IF v_attendee_record->>'rank' = 'GL' THEN
              v_suffix_1 := v_attendee_record->>'grandRank';
              v_suffix_2 := 'Grand Officer';
              v_suffix_3 := COALESCE(v_attendee_record->>'grandOffice', v_attendee_record->>'otherGrandOffice');
            ELSE
              v_suffix_1 := v_attendee_record->>'rank';
              v_suffix_2 := NULL;
              v_suffix_3 := NULL;
            END IF;
          ELSE
            -- Guest suffix logic
            IF (v_attendee_record->>'isPartner')::boolean THEN
              v_suffix_1 := v_attendee_record->>'relationship';
              -- Need to get partner name from related attendee
              -- This would require looking up the related attendee
              v_suffix_2 := v_attendee_record->>'partnerName'; -- Assuming this is passed
              v_suffix_3 := NULL;
            ELSE
              v_suffix_1 := 'guest';
              v_suffix_2 := NULL;
              v_suffix_3 := NULL;
            END IF;
          END IF;
          
          INSERT INTO contacts (
            email,
            first_name,
            last_name,
            mobile_number,
            title,
            suffix_1,
            suffix_2,
            suffix_3,
            type,
            contact_preference,
            dietary_requirements,
            special_needs,
            has_partner,
            is_partner,
            organisation_id,
            created_at,
            updated_at
          ) VALUES (
            v_attendee_record->>'email',
            v_attendee_record->>'firstName',
            v_attendee_record->>'lastName',
            v_attendee_record->>'phone',
            CASE 
              WHEN v_attendee_type = 'mason' THEN v_attendee_record->>'masonicTitle'
              ELSE v_attendee_record->>'title'
            END,
            v_suffix_1,
            v_suffix_2,
            v_suffix_3,
            'individual',
            v_contact_preference,
            v_attendee_record->>'dietaryRequirements',
            v_attendee_record->>'specialNeeds',
            (v_attendee_record->>'hasPartner')::boolean,
            (v_attendee_record->>'isPartner')::boolean,
            v_lodge_org_id,
            NOW(),
            NOW()
          )
          RETURNING contact_id INTO v_contact_id;
        END;
      END IF;
      
      -- Create attendee record (ALWAYS)
      INSERT INTO attendees (
        attendee_id,
        registration_id,
        contact_id,
        auth_user_id,
        attendee_type,
        first_name,
        last_name,
        email,
        phone,
        title,
        suffix,
        is_primary,
        has_partner,
        is_partner,
        contact_preference,
        dietary_requirements,
        special_needs,
        related_attendee_id,
        event_title,
        created_at,
        updated_at
      ) VALUES (
        COALESCE((v_attendee_record->>'attendee_id')::uuid, gen_random_uuid()),
        v_registration_id,
        v_contact_id, -- NULL if contact not created
        CASE 
          WHEN v_is_primary AND v_bill_to_primary THEN v_auth_user_id 
          ELSE NULL 
        END,
        v_attendee_type,
        v_attendee_record->>'firstName',
        v_attendee_record->>'lastName',
        CASE WHEN v_should_create_contact THEN v_attendee_record->>'email' ELSE NULL END,
        CASE WHEN v_should_create_contact THEN v_attendee_record->>'phone' ELSE NULL END,
        CASE 
          WHEN v_attendee_type = 'mason' THEN v_attendee_record->>'masonicTitle'
          ELSE v_attendee_record->>'title'
        END,
        CASE 
          WHEN v_attendee_type = 'mason' THEN
            CASE 
              WHEN v_attendee_record->>'rank' = 'GL' THEN v_attendee_record->>'grandRank'
              ELSE v_attendee_record->>'rank'
            END
          ELSE NULL
        END,
        v_is_primary,
        (v_attendee_record->>'hasPartner')::boolean,
        CASE WHEN (v_attendee_record->>'isPartner')::boolean THEN 'true' END,
        v_contact_preference,
        v_attendee_record->>'dietaryRequirements',
        v_attendee_record->>'specialNeeds',
        (v_attendee_record->>'related_attendee_id')::uuid,
        p_registration_data->>'eventTitle',
        NOW(),
        NOW()
      )
      RETURNING attendee_id INTO v_attendee_id;
      
      -- Store primary attendee ID
      IF v_is_primary THEN
        v_primary_attendee_id := v_attendee_id;
      END IF;
      
      -- Create masonic profile if mason AND contact exists
      IF v_attendee_type = 'mason' AND v_contact_id IS NOT NULL THEN
        INSERT INTO masonic_profiles (
          contact_id,
          masonic_title,
          rank,
          grand_rank,
          grand_officer,
          grand_office,
          lodge_id,
          grand_lodge_id,
          created_at,
          updated_at
        ) VALUES (
          v_contact_id,
          v_attendee_record->>'masonicTitle',
          v_attendee_record->>'rank',
          v_attendee_record->>'grandRank',
          v_attendee_record->>'grandOfficer',
          COALESCE(v_attendee_record->>'grandOffice', v_attendee_record->>'otherGrandOffice'),
          (v_attendee_record->>'lodge_id')::uuid,
          (v_attendee_record->>'grand_lodge_id')::uuid,
          NOW(),
          NOW()
        );
      END IF;
    END;
  END LOOP;

  -- Step 4: Create or update registration
  INSERT INTO registrations (
    registration_id,
    function_id,
    customer_id,
    auth_user_id,
    registration_type,
    registration_date,
    status,
    payment_status,
    total_amount_paid,
    total_price_paid,
    subtotal,
    stripe_fee,
    includes_processing_fee,
    confirmation_number,
    stripe_payment_intent_id,
    agree_to_terms,
    primary_attendee_id,
    registration_data,
    created_at,
    updated_at
  ) VALUES (
    v_registration_id,
    v_function_id,
    v_customer_id,
    v_auth_user_id,
    'individuals',
    NOW(),
    CASE WHEN v_is_payment_update THEN 'registered' ELSE 'pending' END,
    CASE WHEN v_is_payment_update THEN 'paid' ELSE 'pending' END,
    CASE WHEN v_is_payment_update THEN (p_registration_data->>'totalAmountPaid')::numeric ELSE 0 END,
    COALESCE((p_registration_data->>'subtotal')::numeric, 0),
    COALESCE((p_registration_data->>'subtotal')::numeric, 0),
    COALESCE((p_registration_data->>'stripeFee')::numeric, 0),
    COALESCE((p_registration_data->>'stripeFee')::numeric, 0) > 0,
    v_confirmation_number,
    p_registration_data->>'paymentIntentId',
    COALESCE((p_registration_data->>'agreeToTerms')::boolean, true),
    v_primary_attendee_id,
    jsonb_build_array(p_registration_data),
    NOW(),
    NOW()
  )
  ON CONFLICT (registration_id) DO UPDATE SET
    customer_id = COALESCE(registrations.customer_id, EXCLUDED.customer_id),
    total_price_paid = CASE WHEN v_is_payment_update THEN EXCLUDED.total_price_paid ELSE registrations.total_price_paid END,
    total_amount_paid = CASE WHEN v_is_payment_update THEN EXCLUDED.total_amount_paid ELSE registrations.total_amount_paid END,
    status = CASE WHEN v_is_payment_update THEN 'registered' ELSE registrations.status END,
    payment_status = CASE WHEN v_is_payment_update THEN 'paid' ELSE registrations.payment_status END,
    subtotal = EXCLUDED.subtotal,
    stripe_fee = EXCLUDED.stripe_fee,
    includes_processing_fee = EXCLUDED.includes_processing_fee,
    stripe_payment_intent_id = COALESCE(EXCLUDED.stripe_payment_intent_id, registrations.stripe_payment_intent_id),
    confirmation_number = COALESCE(EXCLUDED.confirmation_number, registrations.confirmation_number),
    primary_attendee_id = COALESCE(EXCLUDED.primary_attendee_id, registrations.primary_attendee_id),
    updated_at = NOW(),
    registration_data = registrations.registration_data || jsonb_build_array(p_registration_data);

  -- Step 5: Process tickets (including package expansion)
  FOR v_ticket_record IN 
    SELECT * FROM jsonb_array_elements(COALESCE(p_registration_data->'tickets', '[]'::jsonb))
  LOOP
    DECLARE
      v_attendee_id uuid;
      v_is_package boolean;
      v_package_id uuid;
    BEGIN
      v_attendee_id := (v_ticket_record->>'attendeeId')::uuid;
      v_is_package := COALESCE((v_ticket_record->>'isFromPackage')::boolean, false);
      v_package_id := (v_ticket_record->>'packageId')::uuid;
      
      IF v_is_package AND v_package_id IS NOT NULL THEN
        -- Expand package into individual tickets
        SELECT * INTO v_package_record
        FROM packages
        WHERE package_id = v_package_id;
        
        -- Create ticket for each event_ticket in package
        FOR v_package_item IN 
          SELECT * FROM jsonb_array_elements(v_package_record.included_items)
        LOOP
          -- Get event ticket details
          SELECT * INTO v_event_ticket
          FROM event_tickets
          WHERE event_ticket_id = (v_package_item->>'event_ticket_id')::uuid;
          
          -- Calculate discounted price
          DECLARE
            v_discounted_price numeric;
          BEGIN
            v_discounted_price := v_event_ticket.price - 
              (v_event_ticket.price * COALESCE(v_package_record.discount, 0) / 100);
            
            -- Insert ticket
            INSERT INTO tickets (
              ticket_id,
              attendee_id,
              event_id,
              registration_id,
              ticket_type_id,
              ticket_price,
              original_price,
              price_paid,
              status,
              ticket_status,
              payment_status,
              is_partner_ticket,
              package_id,
              currency,
              created_at,
              updated_at
            ) VALUES (
              gen_random_uuid(),
              v_attendee_id,
              v_event_ticket.event_id,
              v_registration_id,
              v_event_ticket.event_ticket_id,
              v_event_ticket.price,
              v_event_ticket.price,
              v_discounted_price,
              CASE WHEN v_is_payment_update THEN 'sold' ELSE 'reserved' END,
              CASE WHEN v_is_payment_update THEN 'sold' ELSE 'reserved' END,
              CASE WHEN v_is_payment_update THEN 'paid' ELSE 'unpaid' END,
              false,
              v_package_id,
              'AUD',
              NOW(),
              NOW()
            );
          END;
        END LOOP;
      ELSE
        -- Regular ticket (not from package)
        SELECT * INTO v_event_ticket
        FROM event_tickets
        WHERE event_ticket_id = (v_ticket_record->>'ticketTypeId')::uuid;
        
        INSERT INTO tickets (
          ticket_id,
          attendee_id,
          event_id,
          registration_id,
          ticket_type_id,
          ticket_price,
          original_price,
          price_paid,
          status,
          ticket_status,
          payment_status,
          is_partner_ticket,
          package_id,
          currency,
          purchased_at,
          created_at,
          updated_at
        ) VALUES (
          COALESCE((v_ticket_record->>'ticket_id')::uuid, gen_random_uuid()),
          v_attendee_id,
          (v_ticket_record->>'eventId')::uuid,
          v_registration_id,
          (v_ticket_record->>'ticketTypeId')::uuid,
          v_event_ticket.price,
          v_event_ticket.price,
          COALESCE((v_ticket_record->>'price')::numeric, v_event_ticket.price),
          CASE WHEN v_is_payment_update THEN 'sold' ELSE 'reserved' END,
          CASE WHEN v_is_payment_update THEN 'sold' ELSE 'reserved' END,
          CASE WHEN v_is_payment_update THEN 'paid' ELSE 'unpaid' END,
          COALESCE((v_ticket_record->>'isPartnerTicket')::boolean, false),
          NULL,
          'AUD',
          CASE WHEN v_is_payment_update THEN NOW() ELSE NULL END,
          NOW(),
          NOW()
        );
      END IF;
    END;
  END LOOP;
  
  -- Update event ticket counts if payment completed
  IF v_is_payment_update THEN
    WITH ticket_counts AS (
      SELECT 
        et.event_ticket_id,
        COUNT(*) as sold_count
      FROM tickets t
      JOIN event_tickets et ON t.ticket_type_id = et.event_ticket_id
      WHERE t.registration_id = v_registration_id
        AND t.status = 'sold'
      GROUP BY et.event_ticket_id
    )
    UPDATE event_tickets et
    SET 
      sold_count = COALESCE(et.sold_count, 0) + tc.sold_count,
      reserved_count = GREATEST(0, COALESCE(et.reserved_count, 0) - tc.sold_count),
      available_count = GREATEST(0, et.total_capacity - (COALESCE(et.sold_count, 0) + tc.sold_count))
    FROM ticket_counts tc
    WHERE et.event_ticket_id = tc.event_ticket_id;
  END IF;

  -- Return success with registration details
  RETURN jsonb_build_object(
    'success', true,
    'registrationId', v_registration_id,
    'confirmationNumber', v_confirmation_number,
    'customerId', v_customer_id,
    'bookingContactId', v_booking_contact_id,
    'primaryAttendeeId', v_primary_attendee_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to process individual registration: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO authenticated;

-- Create simplified view for confirmation page
CREATE OR REPLACE VIEW public.individuals_registered_view AS
SELECT 
  r.registration_id,
  r.confirmation_number,
  r.registration_date,
  r.payment_status,
  r.total_amount_paid,
  r.total_price_paid,
  r.stripe_fee,
  r.subtotal,
  
  -- Booking contact from customers/contacts join
  c.first_name as booking_first_name,
  c.last_name as booking_last_name,
  c.email as booking_email,
  c.phone as booking_phone,
  c.billing_street_address,
  c.billing_city,
  c.billing_state,
  c.billing_postal_code,
  
  -- Function details
  f.name as function_name,
  f.start_date as function_start_date,
  f.end_date as function_end_date,
  
  -- Attendees with tickets
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'attendee_id', a.attendee_id,
        'full_name', CONCAT(a.first_name, ' ', a.last_name),
        'email', a.email,
        'phone', a.phone,
        'attendee_type', a.attendee_type,
        'is_primary', a.is_primary,
        'tickets', (
          SELECT json_agg(
            jsonb_build_object(
              'ticket_id', t.ticket_id,
              'event_name', e.title,
              'event_date', e.event_start,
              'price_paid', t.price_paid,
              'qr_code_url', t.qr_code_url
            )
          )
          FROM tickets t
          JOIN events e ON t.event_id = e.event_id
          WHERE t.attendee_id = a.attendee_id
        )
      )
    ) FILTER (WHERE a.attendee_id IS NOT NULL),
    '[]'::json
  ) as attendees

FROM registrations r
JOIN customers c ON r.customer_id = c.customer_id
LEFT JOIN functions f ON r.function_id = f.function_id
LEFT JOIN attendees a ON r.registration_id = a.registration_id
WHERE r.registration_type = 'individuals'
GROUP BY r.registration_id, c.customer_id, f.function_id;

-- Create comprehensive view
CREATE OR REPLACE VIEW public.individuals_registration_complete_view AS
SELECT 
  -- Registration core data
  r.registration_id,
  r.function_id,
  r.auth_user_id,
  r.customer_id,
  r.confirmation_number,
  r.registration_date,
  r.registration_type,
  r.status as registration_status,
  r.payment_status,
  r.total_amount_paid,
  r.total_price_paid,
  r.subtotal,
  r.stripe_fee,
  r.includes_processing_fee,
  r.stripe_payment_intent_id,
  r.agree_to_terms,
  r.primary_attendee_id,
  r.created_at as registration_created_at,
  r.updated_at as registration_updated_at,
  
  -- Function details
  f.name as function_name,
  f.slug as function_slug,
  f.start_date as function_start_date,
  f.end_date as function_end_date,
  
  -- Customer details (customer_id already selected from registrations above)
  c.email as customer_email,
  c.first_name as customer_first_name,
  c.last_name as customer_last_name,
  c.phone as customer_phone,
  c.business_name as customer_business_name,
  c.customer_type,
  
  -- Booking contact details (from contacts table)
  bc.contact_id as booking_contact_id,
  bc.auth_user_id as booking_auth_user_id,
  bc.first_name as booking_first_name,
  bc.last_name as booking_last_name,
  bc.email as booking_email,
  bc.mobile_number as booking_phone,
  bc.billing_email,
  bc.billing_phone,
  bc.billing_street_address,
  bc.billing_city,
  bc.billing_state,
  bc.billing_postal_code,
  bc.billing_country,
  bc.billing_organisation_name,
  
  -- All attendees with their contacts and masonic profiles
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        -- Attendee data
        'attendee_id', a.attendee_id,
        'is_primary', a.is_primary,
        'attendee_type', a.attendee_type,
        'first_name', a.first_name,
        'last_name', a.last_name,
        'email', a.email,
        'phone', a.phone,
        'title', a.title,
        'suffix', a.suffix,
        'has_partner', a.has_partner,
        'is_partner', a.is_partner,
        'contact_preference', a.contact_preference,
        'dietary_requirements', a.dietary_requirements,
        'special_needs', a.special_needs,
        'related_attendee_id', a.related_attendee_id,
        'auth_user_id', a.auth_user_id,
        
        -- Contact data (if exists)
        'contact', CASE 
          WHEN ac.contact_id IS NOT NULL THEN 
            jsonb_build_object(
              'contact_id', ac.contact_id,
              'email', ac.email,
              'first_name', ac.first_name,
              'last_name', ac.last_name,
              'mobile_number', ac.mobile_number,
              'title', ac.title,
              'suffix_1', ac.suffix_1,
              'suffix_2', ac.suffix_2,
              'suffix_3', ac.suffix_3,
              'organisation_id', ac.organisation_id
            )
          ELSE NULL
        END,
        
        -- Masonic profile (if exists)
        'masonic_profile', CASE 
          WHEN mp.masonic_profile_id IS NOT NULL THEN 
            jsonb_build_object(
              'masonic_profile_id', mp.masonic_profile_id,
              'masonic_title', mp.masonic_title,
              'rank', mp.rank,
              'grand_rank', mp.grand_rank,
              'grand_officer', mp.grand_officer,
              'grand_office', mp.grand_office,
              'lodge_id', mp.lodge_id,
              'lodge_name', l.name,
              'lodge_number', l.number,
              'grand_lodge_id', mp.grand_lodge_id,
              'grand_lodge_name', gl.name
            )
          ELSE NULL
        END,
        
        -- Tickets for this attendee
        'tickets', (
          SELECT json_agg(
            jsonb_build_object(
              'ticket_id', t.ticket_id,
              'event_id', t.event_id,
              'event_title', e.title,
              'event_date', e.event_start,
              'ticket_type_id', t.ticket_type_id,
              'ticket_price', t.ticket_price,
              'original_price', t.original_price,
              'price_paid', t.price_paid,
              'status', t.status,
              'ticket_status', t.ticket_status,
              'payment_status', t.payment_status,
              'is_partner_ticket', t.is_partner_ticket,
              'package_id', t.package_id,
              'purchased_at', t.purchased_at,
              'qr_code_url', t.qr_code_url
            )
          )
          FROM tickets t
          JOIN events e ON t.event_id = e.event_id
          WHERE t.attendee_id = a.attendee_id
            AND t.registration_id = r.registration_id
        )
      )
    ) FILTER (WHERE a.attendee_id IS NOT NULL),
    '[]'::json
  ) as attendees,
  
  -- Summary counts
  COUNT(DISTINCT a.attendee_id) as total_attendees,
  COUNT(DISTINCT CASE WHEN a.attendee_type = 'mason' THEN a.attendee_id END) as total_masons,
  COUNT(DISTINCT CASE WHEN a.attendee_type = 'guest' THEN a.attendee_id END) as total_guests,
  COUNT(DISTINCT ac.contact_id) as total_contacts_created,
  COUNT(DISTINCT mp.masonic_profile_id) as total_masonic_profiles,
  COUNT(DISTINCT t.ticket_id) as total_tickets,
  COUNT(DISTINCT CASE WHEN t.status = 'sold' THEN t.ticket_id END) as total_sold_tickets,
  COUNT(DISTINCT CASE WHEN t.status = 'reserved' THEN t.ticket_id END) as total_reserved_tickets

FROM registrations r
LEFT JOIN functions f ON r.function_id = f.function_id
LEFT JOIN customers c ON r.customer_id = c.customer_id
LEFT JOIN contacts bc ON c.contact_id = bc.contact_id
LEFT JOIN attendees a ON r.registration_id = a.registration_id
LEFT JOIN contacts ac ON a.contact_id = ac.contact_id
LEFT JOIN masonic_profiles mp ON ac.contact_id = mp.contact_id
LEFT JOIN lodges l ON mp.lodge_id = l.lodge_id
LEFT JOIN grand_lodges gl ON mp.grand_lodge_id = gl.grand_lodge_id
LEFT JOIN tickets t ON a.attendee_id = t.attendee_id AND r.registration_id = t.registration_id
WHERE r.registration_type = 'individuals'
GROUP BY 
  r.registration_id,
  f.function_id,
  c.customer_id,
  bc.contact_id;

-- Grant permissions
GRANT SELECT ON public.individuals_registered_view TO authenticated;
GRANT SELECT ON public.individuals_registered_view TO anon;
GRANT SELECT ON public.individuals_registration_complete_view TO authenticated;
GRANT SELECT ON public.individuals_registration_complete_view TO anon;

-- Update RLS policies for registrations to use both auth_user_id and customer_id
DROP POLICY IF EXISTS "registrations_select_own" ON registrations;
DROP POLICY IF EXISTS "registrations_insert_own" ON registrations;
DROP POLICY IF EXISTS "registrations_update_own" ON registrations;

CREATE POLICY "registrations_select_own" ON registrations
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid() OR
    customer_id = auth.uid()
  );

CREATE POLICY "registrations_insert_own" ON registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_id = auth.uid() OR
    customer_id = auth.uid()
  );

CREATE POLICY "registrations_update_own" ON registrations
  FOR UPDATE TO authenticated
  USING (
    (auth_user_id = auth.uid() OR customer_id = auth.uid()) AND 
    payment_status IN ('pending', 'unpaid')
  );

-- Add comments
COMMENT ON FUNCTION public.upsert_individual_registration IS 'Comprehensive function to create/update individual registrations with all related data';
COMMENT ON VIEW public.individuals_registration_complete_view IS 'Complete view of all data created by individual registration including customers, contacts, attendees, masonic profiles, and tickets';
COMMENT ON COLUMN registrations.customer_id IS 'References the booking contact customer record';
COMMENT ON COLUMN attendees.auth_user_id IS 'Set for primary attendee when billing to primary attendee';