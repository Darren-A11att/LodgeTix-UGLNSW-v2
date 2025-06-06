-- Fix incorrect column references in upsert_individual_registration function
-- The raw_registrations table uses 'raw_id' as primary key, not 'id'

-- Drop all versions of the function
DROP FUNCTION IF EXISTS upsert_individual_registration(jsonb);
DROP FUNCTION IF EXISTS upsert_individual_registration(
  uuid, uuid, uuid, text, text, jsonb, jsonb, jsonb, 
  numeric, numeric, numeric, text, jsonb, boolean, boolean, uuid, boolean
);

CREATE OR REPLACE FUNCTION upsert_individual_registration(
  "registrationId" uuid DEFAULT NULL,
  "functionId" uuid DEFAULT NULL,
  "eventId" uuid DEFAULT NULL,
  "eventTitle" text DEFAULT NULL,
  "registrationType" text DEFAULT NULL,
  "primaryAttendee" jsonb DEFAULT NULL,
  "additionalAttendees" jsonb DEFAULT NULL,
  "tickets" jsonb DEFAULT NULL,
  "totalAmount" numeric DEFAULT NULL,
  "subtotal" numeric DEFAULT NULL,
  "stripeFee" numeric DEFAULT NULL,
  "paymentIntentId" text DEFAULT NULL,
  "billingDetails" jsonb DEFAULT NULL,
  "agreeToTerms" boolean DEFAULT NULL,
  "billToPrimaryAttendee" boolean DEFAULT NULL,
  "authUserId" uuid DEFAULT NULL,
  "paymentCompleted" boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
  v_registration_id uuid;
  v_customer_id uuid;
  v_contact_id uuid;
  v_attendee jsonb;
  v_ticket jsonb;
  v_attendee_id uuid;
  v_ticket_id uuid;
  v_existing_payment_intent text;
  v_status character varying(50);
  v_contact_preference text;
  v_email text;
  v_phone text;
  v_raw_id uuid;  -- Add variable to store raw_id
BEGIN
  -- Start transaction
  BEGIN
    -- Determine registration status based on payment completion
    IF "paymentCompleted" = true THEN
      v_status := 'confirmed';
    ELSE
      v_status := 'pending';
    END IF;

    -- Insert raw registration data for tracking
    INSERT INTO raw_registrations (
      raw_id,  -- Use actual column name
      registration_type,
      raw_data,
      processed
    ) VALUES (
      gen_random_uuid(),
      "registrationType",
      jsonb_build_object(
        'registrationId', "registrationId",
        'functionId', "functionId",
        'eventId', "eventId",
        'eventTitle', "eventTitle",
        'registrationType', "registrationType",
        'primaryAttendee', "primaryAttendee",
        'additionalAttendees', "additionalAttendees",
        'tickets', "tickets",
        'totalAmount', "totalAmount",
        'subtotal', "subtotal",
        'stripeFee', "stripeFee",
        'paymentIntentId', "paymentIntentId",
        'billingDetails', "billingDetails",
        'agreeToTerms', "agreeToTerms",
        'billToPrimaryAttendee', "billToPrimaryAttendee",
        'authUserId', "authUserId",
        'paymentCompleted', "paymentCompleted"
      ),
      false
    ) RETURNING raw_id INTO v_raw_id;  -- Store the raw_id

    -- Check if registration exists
    IF "registrationId" IS NOT NULL THEN
      SELECT stripe_payment_intent_id INTO v_existing_payment_intent
      FROM registrations
      WHERE registration_id = "registrationId";
      
      v_registration_id := "registrationId";
    ELSE
      v_registration_id := gen_random_uuid();
    END IF;

    -- Extract email with multiple fallbacks
    v_email := COALESCE(
      "billingDetails"->>'emailAddress',     -- Frontend ContactInfo field
      "billingDetails"->>'email',             -- Alternative field name
      "primaryAttendee"->>'email',            -- Attendee field
      "primaryAttendee"->>'primaryEmail'      -- Alternative attendee field
    );

    -- Extract phone with multiple fallbacks
    v_phone := COALESCE(
      "billingDetails"->>'mobileNumber',      -- Frontend ContactInfo field
      "billingDetails"->>'phone',             -- Alternative field name
      "primaryAttendee"->>'mobileNumber',     -- Attendee field  
      "primaryAttendee"->>'phone',            -- Alternative attendee field
      "primaryAttendee"->>'primaryPhone'      -- Another alternative
    );

    -- Insert or update contact information
    INSERT INTO contacts (
      contact_id,
      first_name,
      last_name,
      email,
      mobile_number,
      billing_email,
      billing_phone,
      billing_street_address,
      billing_street_address_2,
      billing_city,
      billing_state,
      billing_postal_code,
      billing_country
    ) VALUES (
      gen_random_uuid(),
      COALESCE(
        "billingDetails"->>'firstName',
        "primaryAttendee"->>'firstName'
      ),
      COALESCE(
        "billingDetails"->>'lastName',
        "primaryAttendee"->>'lastName'
      ),
      v_email,
      v_phone,
      "billingDetails"->>'emailAddress',     -- Keep original billing email
      "billingDetails"->>'mobileNumber',     -- Keep original billing phone
      "billingDetails"->'billingAddress'->>'addressLine1',
      "billingDetails"->'billingAddress'->>'addressLine2',
      "billingDetails"->'billingAddress'->>'city',
      "billingDetails"->'billingAddress'->>'state',
      "billingDetails"->'billingAddress'->>'postcode',
      "billingDetails"->'billingAddress'->>'country'
    )
    ON CONFLICT (email) 
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      mobile_number = EXCLUDED.mobile_number,
      billing_email = EXCLUDED.billing_email,
      billing_phone = EXCLUDED.billing_phone,
      billing_street_address = EXCLUDED.billing_street_address,
      billing_street_address_2 = EXCLUDED.billing_street_address_2,
      billing_city = EXCLUDED.billing_city,
      billing_state = EXCLUDED.billing_state,
      billing_postal_code = EXCLUDED.billing_postal_code,
      billing_country = EXCLUDED.billing_country,
      updated_at = CURRENT_TIMESTAMP
    RETURNING contact_id INTO v_contact_id;

    -- Insert or update customer
    INSERT INTO customers (
      customer_id,
      first_name,
      last_name,
      email,
      phone,
      customer_type
    ) VALUES (
      gen_random_uuid(),
      COALESCE(
        "billingDetails"->>'firstName',
        "primaryAttendee"->>'firstName'
      ),
      COALESCE(
        "billingDetails"->>'lastName',
        "primaryAttendee"->>'lastName'
      ),
      v_email,
      v_phone,
      'booking_contact'::customer_type
    )
    ON CONFLICT (email) 
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone = EXCLUDED.phone,
      updated_at = CURRENT_TIMESTAMP
    RETURNING customer_id INTO v_customer_id;

    -- Insert or update registration
    IF v_existing_payment_intent IS NOT NULL AND "paymentIntentId" IS NOT NULL 
       AND v_existing_payment_intent != "paymentIntentId" THEN
      RAISE EXCEPTION 'Registration already has a different payment intent';
    END IF;

    INSERT INTO registrations (
      registration_id,  -- Fixed from id
      function_id,
      customer_id,
      -- contact_id, -- Column doesn't exist in registrations table
      total_amount_paid,  -- Fixed from total_amount
      subtotal,
      stripe_fee,
      stripe_payment_intent_id,  -- Fixed from payment_intent_id
      status,
      registration_type,
      agree_to_terms,
      payment_status,  -- Use payment_status instead of payment_completed
      registration_data  -- Store complete data
    ) VALUES (
      v_registration_id,
      "functionId",
      v_customer_id,
      -- v_contact_id,
      "totalAmount",
      "subtotal",
      "stripeFee",
      "paymentIntentId",
      v_status,
      'individuals'::registration_type,
      "agreeToTerms",
      CASE WHEN "paymentCompleted" = true THEN 'completed'::payment_status ELSE 'pending'::payment_status END,
      jsonb_build_object(
        'primaryAttendee', "primaryAttendee",
        'additionalAttendees', "additionalAttendees",
        'billingDetails', "billingDetails",
        'tickets', "tickets"
      )
    )
    ON CONFLICT (registration_id) 
    DO UPDATE SET
      total_amount_paid = EXCLUDED.total_amount_paid,
      subtotal = EXCLUDED.subtotal,
      stripe_fee = EXCLUDED.stripe_fee,
      stripe_payment_intent_id = COALESCE(registrations.stripe_payment_intent_id, EXCLUDED.stripe_payment_intent_id),
      status = EXCLUDED.status,
      payment_status = EXCLUDED.payment_status,
      registration_data = EXCLUDED.registration_data,
      updated_at = CURRENT_TIMESTAMP;

    -- Process attendees (primary + additional)
    FOR v_attendee IN 
      SELECT * FROM jsonb_array_elements(
        CASE 
          WHEN "primaryAttendee" IS NOT NULL THEN 
            jsonb_build_array("primaryAttendee") || COALESCE("additionalAttendees", '[]'::jsonb)
          ELSE 
            COALESCE("additionalAttendees", '[]'::jsonb)
        END
      )
    LOOP
      -- Fix contact preference case (lowercase to proper case)
      v_contact_preference := CASE (v_attendee->>'contactPreference')::text
        WHEN 'directly' THEN 'Directly'
        WHEN 'primaryattendee' THEN 'PrimaryAttendee'
        WHEN 'providelater' THEN 'ProvideLater'
        ELSE v_attendee->>'contactPreference'
      END;

      -- Extract email with fallbacks for attendee
      v_email := COALESCE(
        v_attendee->>'email',
        v_attendee->>'primaryEmail',
        "billingDetails"->>'emailAddress',
        "billingDetails"->>'email'
      );

      -- Extract phone with fallbacks for attendee
      v_phone := COALESCE(
        v_attendee->>'mobileNumber',
        v_attendee->>'phone',
        v_attendee->>'primaryPhone',
        "billingDetails"->>'mobileNumber',
        "billingDetails"->>'phone'
      );

      INSERT INTO attendees (
        attendee_id,
        registration_id,
        -- customer_id, -- Not in attendees table according to schema
        attendee_type,
        is_primary,
        first_name,
        last_name,
        title,
        suffix_1,
        suffix_2,
        suffix_3,
        primary_email,
        primary_phone,
        email,  -- Legacy field - populate for compatibility
        phone,  -- Legacy field - populate for compatibility
        contact_preference,
        dietary_requirements,
        special_needs,
        -- Mason-specific fields are stored in attendee_data JSON
        -- masonic_title,
        -- rank,
        -- grand_officer_status,
        -- present_grand_officer_role,
        -- lodge_id,
        -- grand_lodge_id,
        has_partner,
        relationship,
        attendee_data
      ) VALUES (
        COALESCE((v_attendee->>'attendeeId')::uuid, gen_random_uuid()),
        v_registration_id,
        -- v_customer_id, -- Not in attendees table
        (v_attendee->>'attendeeType')::attendee_type,
        COALESCE((v_attendee->>'isPrimary')::boolean, false),
        v_attendee->>'firstName',
        v_attendee->>'lastName',
        v_attendee->>'title',
        v_attendee->>'suffix1',
        v_attendee->>'suffix2',
        v_attendee->>'suffix3',
        v_email,  -- primary_email
        v_phone,  -- primary_phone
        v_email,  -- email (legacy)
        v_phone,  -- phone (legacy)
        v_contact_preference::attendee_contact_preference,
        v_attendee->>'dietaryRequirements',
        v_attendee->>'specialNeeds',
        -- Mason-specific fields are stored in attendee_data JSON
        -- v_attendee->>'masonicTitle',
        -- v_attendee->>'rank',
        -- (v_attendee->>'grandOfficerStatus')::grand_officer_status,
        -- v_attendee->>'presentGrandOfficerRole',
        -- (v_attendee->>'lodge_id')::uuid,
        -- (v_attendee->>'grand_lodge_id')::uuid,
        COALESCE((v_attendee->>'hasPartner')::boolean, false),
        v_attendee->>'relationship',
        v_attendee  -- Store complete data
      )
      ON CONFLICT (attendee_id) 
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        title = EXCLUDED.title,
        suffix_1 = EXCLUDED.suffix_1,
        suffix_2 = EXCLUDED.suffix_2,
        suffix_3 = EXCLUDED.suffix_3,
        primary_email = EXCLUDED.primary_email,
        primary_phone = EXCLUDED.primary_phone,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        contact_preference = EXCLUDED.contact_preference,
        dietary_requirements = EXCLUDED.dietary_requirements,
        special_needs = EXCLUDED.special_needs,
        -- Mason-specific fields are updated in attendee_data JSON
        -- masonic_title = EXCLUDED.masonic_title,
        -- rank = EXCLUDED.rank,
        -- grand_officer_status = EXCLUDED.grand_officer_status,
        -- present_grand_officer_role = EXCLUDED.present_grand_officer_role,
        -- lodge_id = EXCLUDED.lodge_id,
        -- grand_lodge_id = EXCLUDED.grand_lodge_id,
        has_partner = EXCLUDED.has_partner,
        relationship = EXCLUDED.relationship,
        attendee_data = EXCLUDED.attendee_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING attendee_id INTO v_attendee_id;
    END LOOP;

    -- Process tickets
    FOR v_ticket IN SELECT * FROM jsonb_array_elements("tickets")
    LOOP
      INSERT INTO tickets (
        ticket_id,
        registration_id,
        attendee_id,
        event_id,
        package_id,
        -- ticket_type, -- Column doesn't exist
        -- ticket_number, -- Column doesn't exist
        price_paid,  -- Fixed from price
        ticket_price,  -- Also store as ticket_price
        status,
        ticket_status,  -- Also store as ticket_status
        payment_status,
        purchased_at
        -- check_in_time, -- Column is checked_in_at
        -- notes -- Column doesn't exist
      ) VALUES (
        gen_random_uuid(),
        v_registration_id,
        (v_ticket->>'attendeeId')::uuid,
        (v_ticket->>'eventId')::uuid,
        (v_ticket->>'packageId')::uuid,
        -- v_ticket->>'ticketType',
        -- v_ticket->>'ticketNumber',
        (v_ticket->>'price')::numeric,
        (v_ticket->>'price')::numeric,  -- ticket_price
        COALESCE(v_ticket->>'status', 'Active'),
        COALESCE(v_ticket->>'status', 'Active'),  -- ticket_status
        CASE WHEN "paymentCompleted" = true THEN 'Paid' ELSE 'Unpaid' END,
        CASE WHEN "paymentCompleted" = true THEN CURRENT_TIMESTAMP ELSE NULL END
        -- NULL, -- checked_in_at
        -- v_ticket->>'notes'
      )
      ON CONFLICT (ticket_id) DO NOTHING;
    END LOOP;

    -- Update raw registration as processed
    UPDATE raw_registrations 
    SET 
      processed = true,
      registration_id = v_registration_id
    WHERE raw_id = v_raw_id;  -- FIX: Use the stored raw_id

    RETURN v_registration_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log error in raw registrations
      IF v_raw_id IS NOT NULL THEN
        UPDATE raw_registrations 
        SET 
          processed = false,
          error_message = SQLERRM
        WHERE raw_id = v_raw_id;  -- FIX: Use the stored raw_id
      END IF;
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to document the fix
COMMENT ON FUNCTION upsert_individual_registration IS 'Handles individual registration with flexible field mapping. Fixed to use raw_id column instead of id for raw_registrations table references.';