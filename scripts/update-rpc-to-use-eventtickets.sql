-- Update create_registration RPC to use eventtickets instead of ticket_definitions
CREATE OR REPLACE FUNCTION public.create_registration(
  registration_data jsonb,
  attendees_data jsonb,
  tickets_data jsonb
) RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  -- Registration variables
  v_registration_id UUID;
  v_customer_id UUID;
  v_event_id UUID;
  v_billing_details jsonb;
  
  -- Person/Attendee variables
  v_person_id UUID;
  v_attendee_id UUID;
  v_person_mapping jsonb := '{}'::jsonb;
  v_primary_attendee_id UUID;
  
  -- Organisation/Lodge variables
  v_lodge_id UUID;
  v_grandlodge_org_id UUID;
  v_lodge_org_id UUID;
  v_org_id UUID;
  
  -- Result variables
  v_result jsonb;
  v_attendee_results jsonb := '[]'::jsonb;
  v_ticket_results jsonb := '[]'::jsonb;
  v_people_created jsonb := '[]'::jsonb;
  
  -- Loop variables
  attendee_record jsonb;
  ticket_record jsonb;
  v_person_data jsonb;
  v_masonic_data jsonb;
  
  -- Validation variables
  v_event_exists boolean;
  v_child_event_id UUID;
  v_event_ticket_exists boolean;
  
BEGIN
  -- Start transaction
  BEGIN
    -- Extract IDs from registration data
    v_registration_id := (registration_data->>'registration_id')::UUID;
    v_customer_id := (registration_data->>'customer_id')::UUID;
    v_event_id := (registration_data->>'event_id')::UUID;
    v_billing_details := registration_data->'registration_data'->'billingDetails';
    
    -- =================================================================
    -- STEP 0: Prerequisites Check
    -- =================================================================
    
    -- Verify parent event exists
    SELECT EXISTS(SELECT 1 FROM events WHERE id = v_event_id) INTO v_event_exists;
    IF NOT v_event_exists THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Parent event does not exist',
        'detail', format('Event ID %s not found', v_event_id)
      );
    END IF;
    
    -- Verify event tickets exist for all tickets
    FOR ticket_record IN SELECT * FROM jsonb_array_elements(tickets_data) LOOP
      IF ticket_record->>'event_ticket_id' IS NOT NULL THEN
        SELECT EXISTS(
          SELECT 1 FROM eventtickets 
          WHERE id = (ticket_record->>'event_ticket_id')::UUID
        ) INTO v_event_ticket_exists;
        
        IF NOT v_event_ticket_exists THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Event ticket does not exist',
            'detail', format('Event ticket ID %s not found', ticket_record->>'event_ticket_id')
          );
        END IF;
      END IF;
    END LOOP;
    
    -- =================================================================
    -- STEP 1: Create all People records first (no dependencies)
    -- =================================================================
    FOR attendee_record IN SELECT * FROM jsonb_array_elements(attendees_data) LOOP
      v_person_data := attendee_record->'person';
      v_attendee_id := (attendee_record->>'attendeeid')::UUID;
      
      IF v_person_data IS NOT NULL AND v_person_data != 'null'::jsonb THEN
        v_person_id := gen_random_uuid();
        
        INSERT INTO people (
          person_id,
          first_name,
          last_name,
          title,
          suffix,
          primary_email,
          primary_phone,
          dietary_requirements,
          special_needs,
          created_at,
          updated_at
        ) VALUES (
          v_person_id,
          v_person_data->>'first_name',
          v_person_data->>'last_name',
          v_person_data->>'title',
          v_person_data->>'suffix',
          v_person_data->>'primary_email',
          v_person_data->>'primary_phone',
          v_person_data->>'dietary_requirements',
          v_person_data->>'special_needs',
          NOW(),
          NOW()
        );
        
        -- Store the person_id mapping for later use
        v_person_mapping := v_person_mapping || jsonb_build_object(v_attendee_id::text, v_person_id::text);
        
        -- Track primary attendee
        IF (attendee_record->>'isPrimary')::boolean = true THEN
          v_primary_attendee_id := v_attendee_id;
        END IF;
        
        -- Add to people created list
        v_people_created := v_people_created || jsonb_build_object(
          'attendee_id', v_attendee_id,
          'person_id', v_person_id,
          'name', v_person_data->>'first_name' || ' ' || v_person_data->>'last_name'
        );
      END IF;
    END LOOP;
    
    -- =================================================================
    -- STEP 2: Create Customer record (depends on: none)
    -- =================================================================
    IF NOT EXISTS (SELECT 1 FROM customers WHERE id = v_customer_id) THEN
      -- Find primary person's details if billing details are missing
      DECLARE
        v_primary_person_id UUID;
        v_primary_email text;
        v_primary_phone text;
      BEGIN
        -- Get primary attendee's person_id
        v_primary_person_id := v_person_mapping->>v_primary_attendee_id::text;
        
        -- Get primary person's contact details if available
        IF v_primary_person_id IS NOT NULL THEN
          SELECT primary_email, primary_phone 
          INTO v_primary_email, v_primary_phone
          FROM people 
          WHERE person_id = v_primary_person_id;
        END IF;
        
        INSERT INTO customers (
          id,
          user_id,
          first_name,
          last_name,
          email,
          phone,
          billing_first_name,
          billing_last_name,
          billing_email,
          billing_phone,
          billing_street_address,
          billing_city,
          billing_state,
          billing_postal_code,
          billing_country,
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          country,
          person_id,
          created_at,
          updated_at
        ) VALUES (
          v_customer_id,
          v_customer_id, -- user_id is same as customer_id for authenticated users
          COALESCE(v_billing_details->>'firstName', 'Guest'),
          COALESCE(v_billing_details->>'lastName', 'User'),
          COALESCE(v_billing_details->>'emailAddress', v_primary_email),
          COALESCE(v_billing_details->>'mobileNumber', v_primary_phone),
          v_billing_details->>'firstName',
          v_billing_details->>'lastName',
          v_billing_details->>'emailAddress',
          v_billing_details->>'mobileNumber',
          v_billing_details->>'addressLine1',
          v_billing_details->>'city',
          v_billing_details->>'stateProvince',
          v_billing_details->>'postalCode',
          v_billing_details->>'country',
          v_billing_details->>'addressLine1',
          v_billing_details->>'addressLine2',
          v_billing_details->>'city',
          v_billing_details->>'stateProvince',
          v_billing_details->>'postalCode',
          v_billing_details->>'country',
          v_primary_person_id, -- Link to primary attendee's person record
          NOW(),
          NOW()
        );
      END;
    ELSE
      -- Update existing customer with billing details if provided
      IF v_billing_details IS NOT NULL AND v_billing_details != 'null'::jsonb THEN
        UPDATE customers SET
          first_name = COALESCE(v_billing_details->>'firstName', first_name),
          last_name = COALESCE(v_billing_details->>'lastName', last_name),
          email = COALESCE(v_billing_details->>'emailAddress', email),
          phone = COALESCE(v_billing_details->>'mobileNumber', phone),
          billing_first_name = COALESCE(v_billing_details->>'firstName', billing_first_name),
          billing_last_name = COALESCE(v_billing_details->>'lastName', billing_last_name),
          billing_email = COALESCE(v_billing_details->>'emailAddress', billing_email),
          billing_phone = COALESCE(v_billing_details->>'mobileNumber', billing_phone),
          billing_street_address = COALESCE(v_billing_details->>'addressLine1', billing_street_address),
          billing_city = COALESCE(v_billing_details->>'city', billing_city),
          billing_state = COALESCE(v_billing_details->>'stateProvince', billing_state),
          billing_postal_code = COALESCE(v_billing_details->>'postalCode', billing_postal_code),
          billing_country = COALESCE(v_billing_details->>'country', billing_country),
          address_line1 = COALESCE(v_billing_details->>'addressLine1', address_line1),
          address_line2 = COALESCE(v_billing_details->>'addressLine2', address_line2),
          city = COALESCE(v_billing_details->>'city', city),
          state = COALESCE(v_billing_details->>'stateProvince', state),
          postal_code = COALESCE(v_billing_details->>'postalCode', postal_code),
          country = COALESCE(v_billing_details->>'country', country),
          updated_at = NOW()
        WHERE id = v_customer_id;
      END IF;
    END IF;
    
    -- =================================================================
    -- STEP 3: Create Registration (depends on: customers, events)
    -- =================================================================
    INSERT INTO registrations (
      registration_id,
      customer_id,
      event_id,
      registration_type,
      registration_date,
      total_price_paid,
      total_amount_paid,
      payment_status,
      status,
      agree_to_terms,
      registration_data,
      created_at,
      updated_at,
      confirmation_number
    ) VALUES (
      v_registration_id,
      v_customer_id,
      v_event_id,
      registration_data->>'registration_type',
      (registration_data->>'registration_date')::timestamp with time zone,
      (registration_data->>'total_price_paid')::numeric,
      (registration_data->>'total_amount_paid')::numeric,
      COALESCE(registration_data->>'payment_status', 'pending'),
      COALESCE(registration_data->>'status', 'unpaid'),
      (registration_data->>'agree_to_terms')::boolean,
      registration_data->'registration_data',
      NOW(),
      NOW(),
      -- Generate a confirmation number: REG-YYYYMMDD-XXXX
      'REG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(v_registration_id::text FROM 1 FOR 4))
    );
    
    -- =================================================================
    -- STEP 4: Create Organisation/Lodge records (depends on: none)
    -- Then create Masonic Profiles (depends on: people, organisations)
    -- Then create Attendees (depends on: people, registrations)
    -- =================================================================
    FOR attendee_record IN SELECT * FROM jsonb_array_elements(attendees_data) LOOP
      v_attendee_id := (attendee_record->>'attendeeid')::UUID;
      v_person_id := (v_person_mapping->>v_attendee_id::text)::UUID;
      v_masonic_data := attendee_record->'masonic_profile';
      
      -- If this is a Mason, create lodge/organisation records
      IF v_masonic_data IS NOT NULL AND v_masonic_data != 'null'::jsonb THEN
        -- Get or create grand lodge organisation
        v_grandlodge_org_id := (v_masonic_data->>'grandlodgeorganisationid')::UUID;
        
        -- Get or create lodge organisation
        v_lodge_org_id := (v_masonic_data->>'lodgeorganisationid')::UUID;
        
        -- Get lodge ID
        v_lodge_id := (v_masonic_data->>'lodgeid')::UUID;
        
        -- Create MasonicProfile
        INSERT INTO masonicprofiles (
          mason_id,
          person_id,
          masonic_title,
          rank,
          grand_rank,
          grand_officer,
          present_grand_office,
          lodge_id,
          grand_lodge_organisation_id,
          lodge_organisation_id,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          v_person_id,
          v_masonic_data->>'masonictitle',
          v_masonic_data->>'rank',
          v_masonic_data->>'grandrank',
          v_masonic_data->>'grandofficer',
          v_masonic_data->>'grandoffice',
          v_lodge_id,
          v_grandlodge_org_id,
          v_lodge_org_id,
          NOW(),
          NOW()
        );
      END IF;
      
      -- Create Attendee record
      INSERT INTO attendees (
        attendee_id,
        registration_id,
        attendee_type,
        contact_preference,
        dietary_requirements,
        special_needs,
        relationship,
        related_attendee_id,
        event_title,
        person_id,
        created_at,
        updated_at
      ) VALUES (
        v_attendee_id,
        v_registration_id,
        COALESCE(attendee_record->>'attendeetype', 'guest'),
        COALESCE(attendee_record->>'contactpreference', 'directly'),
        attendee_record->>'dietaryrequirements',
        attendee_record->>'specialneeds',
        attendee_record->>'relationship',
        (attendee_record->>'relatedattendeeid')::UUID,
        attendee_record->>'eventtitle',
        v_person_id,
        NOW(),
        NOW()
      );
      
      -- Add to results
      v_attendee_results := v_attendee_results || jsonb_build_object(
        'attendee_id', v_attendee_id,
        'person_id', v_person_id,
        'type', attendee_record->>'attendeetype'
      );
    END LOOP;
    
    -- =================================================================
    -- STEP 5: Create Tickets (depends on: registrations, attendees, eventtickets)
    -- =================================================================
    FOR ticket_record IN SELECT * FROM jsonb_array_elements(tickets_data) LOOP
      -- Create child event if needed
      IF ticket_record->>'event_ticket_id' IS NOT NULL THEN
        -- Get the event ticket details to find the child event
        SELECT event_id INTO v_child_event_id
        FROM eventtickets
        WHERE id = (ticket_record->>'event_ticket_id')::UUID;
        
        -- If no child event specified, use parent event
        v_child_event_id := COALESCE(v_child_event_id, v_event_id);
      ELSE
        v_child_event_id := v_event_id;
      END IF;
      
      INSERT INTO tickets (
        ticket_id,
        registration_id,
        attendee_id,
        event_id,
        event_ticket_id,
        ticket_price,
        price_paid,
        payment_status,
        status,
        purchased_at,
        is_partner_ticket,
        created_at,
        updated_at
      ) VALUES (
        (ticket_record->>'ticket_id')::UUID,
        v_registration_id,
        (ticket_record->>'attendee_id')::UUID,
        v_child_event_id,
        (ticket_record->>'event_ticket_id')::UUID,
        (ticket_record->>'ticket_price')::numeric,
        (ticket_record->>'price_paid')::numeric,
        COALESCE(ticket_record->>'payment_status', 'Pending'),
        COALESCE(ticket_record->>'ticket_status', 'pending'),
        CASE 
          WHEN ticket_record->>'payment_status' = 'Paid' THEN NOW()
          ELSE NULL
        END,
        COALESCE((ticket_record->>'is_partner_ticket')::boolean, false),
        NOW(),
        NOW()
      );
      
      -- Add to results
      v_ticket_results := v_ticket_results || jsonb_build_object(
        'ticket_id', ticket_record->>'ticket_id',
        'attendee_id', ticket_record->>'attendee_id',
        'event_ticket_id', ticket_record->>'event_ticket_id'
      );
    END LOOP;
    
    -- =================================================================
    -- STEP 6: Build and return success response
    -- =================================================================
    v_result := jsonb_build_object(
      'success', true,
      'registration_id', v_registration_id,
      'customer_id', v_customer_id,
      'registration', jsonb_build_object(
        'id', v_registration_id,
        'status', COALESCE(registration_data->>'status', 'unpaid'),
        'payment_status', COALESCE(registration_data->>'payment_status', 'pending'),
        'total_amount', (registration_data->>'total_price_paid')::numeric
      ),
      'people_created', v_people_created,
      'attendees_created', v_attendee_results,
      'tickets_created', v_ticket_results,
      'summary', jsonb_build_object(
        'people_count', jsonb_array_length(v_people_created),
        'attendees_count', jsonb_array_length(v_attendee_results),
        'tickets_count', jsonb_array_length(v_ticket_results),
        'total_amount', (registration_data->>'total_price_paid')::numeric
      )
    );
    
    RETURN v_result;
    
  EXCEPTION
    WHEN foreign_key_violation THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Foreign key constraint violation',
        'detail', SQLERRM,
        'hint', 'Check that all referenced IDs exist'
      );
    WHEN unique_violation THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Duplicate key violation',
        'detail', SQLERRM,
        'hint', 'A record with this ID already exists'
      );
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE,
        'hint', 'Check the data structure and database logs for more details'
      );
  END;
END;
$function$;