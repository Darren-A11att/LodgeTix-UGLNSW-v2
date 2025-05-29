-- Fix column name mismatches in the create_registration RPC function
-- The attendees table uses 'registrationid' not 'registration_id'
-- The tickets table uses 'registrationid' not 'registration_id'

-- Drop the existing function to recreate it
DROP FUNCTION IF EXISTS public.create_registration(jsonb, jsonb, jsonb);

-- Recreate with correct column names
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
        v_primary_person jsonb;
      BEGIN
        SELECT p.* INTO v_primary_person
        FROM jsonb_array_elements(attendees_data) a
        CROSS JOIN LATERAL (
          SELECT * FROM jsonb_array_elements(v_people_created) pc
          WHERE pc->>'attendee_id' = a->>'attendeeid'
        ) p
        WHERE (a->>'isPrimary')::boolean = true
        LIMIT 1;
        
        INSERT INTO customers (
          id,
          email,
          first_name,
          last_name,
          phone,
          created_at,
          updated_at
        ) VALUES (
          v_customer_id,
          COALESCE(v_billing_details->>'emailAddress', v_billing_details->>'email', v_primary_person->>'primary_email'),
          COALESCE(v_billing_details->>'firstName', v_primary_person->>'first_name'),
          COALESCE(v_billing_details->>'lastName', v_primary_person->>'last_name'),
          COALESCE(v_billing_details->>'mobileNumber', v_billing_details->>'phone', v_primary_person->>'primary_phone'),
          NOW(),
          NOW()
        );
      END;
    END IF;
    
    -- =================================================================
    -- STEP 3: Create Registration record (depends on: customers)
    -- =================================================================
    INSERT INTO registrations (
      registration_id,
      customer_id,
      event_id,
      registration_date,
      status,
      total_amount_paid,
      total_price_paid,
      payment_status,
      agree_to_terms,
      stripe_payment_intent_id,
      primary_attendee_id,
      registration_type,
      created_at,
      updated_at,
      registration_data
    ) VALUES (
      v_registration_id,
      v_customer_id,
      v_event_id,
      NOW(),
      COALESCE(registration_data->>'status', 'unpaid'),
      COALESCE((registration_data->>'total_amount_paid')::numeric, 0),
      COALESCE((registration_data->>'total_price_paid')::numeric, 0),
      COALESCE(registration_data->>'payment_status', 'pending'),
      COALESCE((registration_data->>'agree_to_terms')::boolean, true),
      registration_data->>'stripe_payment_intent_id',
      v_primary_attendee_id,
      COALESCE(registration_data->>'registration_type', 'individuals'),
      NOW(),
      NOW(),
      registration_data
    );
    
    -- Also generate confirmation number
    UPDATE registrations 
    SET confirmation_number = 'REG-' || UPPER(SUBSTRING(v_registration_id::text, 1, 8))
    WHERE registration_id = v_registration_id;
    
    -- =================================================================
    -- STEP 4: Create Attendees (depends on: registrations, people)
    -- =================================================================
    FOR attendee_record IN SELECT * FROM jsonb_array_elements(attendees_data) LOOP
      v_attendee_id := (attendee_record->>'attendeeid')::UUID;
      v_person_id := (v_person_mapping->>v_attendee_id::text)::UUID;
      v_masonic_data := attendee_record->'masonic_profile';
      
      -- Handle mason-specific data if present
      IF v_masonic_data IS NOT NULL AND v_masonic_data != 'null'::jsonb THEN
        -- Extract lodge organisation IDs
        v_grandlodge_org_id := (attendee_record->>'grandlodge_org_id')::UUID;
        v_lodge_org_id := (attendee_record->>'lodge_org_id')::UUID;
        
        -- Create MasonicProfile
        INSERT INTO masonicprofiles (
          person_id,
          rank,
          masonic_title,
          grand_officer_status,
          present_grand_officer_role,
          past_titles,
          notes,
          grand_lodge_affiliation_id,
          lodge_affiliation_id,
          created_at,
          updated_at
        ) VALUES (
          v_person_id,
          v_masonic_data->>'rank',
          v_masonic_data->>'masonic_title',
          v_masonic_data->>'grand_officer_status',
          v_masonic_data->>'present_grand_officer_role',
          v_masonic_data->>'past_titles',
          v_masonic_data->>'notes',
          v_grandlodge_org_id,
          v_lodge_org_id,
          NOW(),
          NOW()
        );
      END IF;
      
      -- Create Attendee record (note: using 'registrationid' not 'registration_id')
      INSERT INTO attendees (
        attendeeid,
        registrationid,  -- Changed from registration_id
        attendeetype,
        contactpreference,
        dietaryrequirements,
        specialneeds,
        relationship,
        relatedattendeeid,
        eventtitle,
        person_id,
        createdat,
        updatedat
      ) VALUES (
        v_attendee_id,
        v_registration_id,
        COALESCE(attendee_record->>'attendeetype', 'guest')::attendee_type,
        COALESCE(attendee_record->>'contactpreference', 'directly')::attendee_contact_preference,
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
        -- Get the event_id from the eventticket
        SELECT event_id INTO v_child_event_id
        FROM eventtickets
        WHERE id = (ticket_record->>'event_ticket_id')::UUID;
        
        -- Create ticket (using correct column names)
        INSERT INTO tickets (
          ticket_id,
          registration_id,
          attendee_id,
          event_id,
          event_ticket_id,
          ticket_status,
          price_paid,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          v_registration_id,
          (ticket_record->>'attendee_id')::UUID,
          COALESCE(v_child_event_id, v_event_id),
          (ticket_record->>'event_ticket_id')::UUID,
          'pending',
          COALESCE((ticket_record->>'price_at_assignment')::numeric, 0),
          NOW(),
          NOW()
        );
        
        -- Add to results
        v_ticket_results := v_ticket_results || jsonb_build_object(
          'attendee_id', ticket_record->>'attendee_id',
          'event_ticket_id', ticket_record->>'event_ticket_id',
          'price', ticket_record->>'price_at_assignment'
        );
      END IF;
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