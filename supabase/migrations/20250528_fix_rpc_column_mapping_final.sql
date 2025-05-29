-- Final fix for RPC column mapping issues
-- This migration creates a working version of create_registration that handles
-- the mismatch between snake_case input data and the actual database column names

-- Drop existing function
DROP FUNCTION IF EXISTS public.create_registration(jsonb, jsonb, jsonb);

-- Create the fixed version
CREATE OR REPLACE FUNCTION public.create_registration(
  registration_data jsonb,
  attendees_data jsonb,
  tickets_data jsonb
) RETURNS jsonb AS $$
DECLARE
  v_registration_id UUID;
  v_customer_id UUID;
  v_event_id UUID;
  v_person_id UUID;
  v_attendee_id UUID;
  v_ticket_id UUID;
  v_confirmation_number TEXT;
  v_primary_attendee_id UUID;
  v_attendee_record jsonb;
  v_ticket_record jsonb;
  v_people_created jsonb := '[]'::jsonb;
  v_attendee_results jsonb := '[]'::jsonb;
  v_ticket_results jsonb := '[]'::jsonb;
  v_event_title TEXT;
BEGIN
  -- Extract registration data
  v_registration_id := (registration_data->>'registration_id')::UUID;
  v_customer_id := (registration_data->>'customer_id')::UUID;
  v_event_id := (registration_data->>'event_id')::UUID;
  
  -- Get event title
  SELECT title INTO v_event_title FROM events WHERE id = v_event_id;
  
  -- Create customer if needed
  IF NOT EXISTS (SELECT 1 FROM customers WHERE id = v_customer_id) THEN
    INSERT INTO customers (id, created_at, updated_at)
    VALUES (v_customer_id, NOW(), NOW());
  END IF;
  
  -- Create registration
  INSERT INTO registrations (
    registration_id,
    customer_id,
    event_id,
    registration_type,
    status,
    payment_status,
    total_amount_paid,
    total_price_paid,
    agree_to_terms,
    registration_data,
    created_at,
    updated_at
  ) VALUES (
    v_registration_id,
    v_customer_id,
    v_event_id,
    (registration_data->>'registration_type')::registration_type,
    COALESCE(registration_data->>'status', 'unpaid'),
    COALESCE((registration_data->>'payment_status')::payment_status, 'pending'::payment_status),
    COALESCE((registration_data->>'total_amount_paid')::NUMERIC, 0),
    COALESCE((registration_data->>'total_price_paid')::NUMERIC, 0),
    COALESCE((registration_data->>'agree_to_terms')::BOOLEAN, TRUE),
    ARRAY[registration_data->'registration_data']::jsonb[],
    NOW(),
    NOW()
  );
  
  -- Process attendees
  FOR v_attendee_record IN SELECT * FROM jsonb_array_elements(attendees_data) LOOP
    v_attendee_id := (v_attendee_record->>'attendee_id')::UUID;
    
    -- Create person if data provided
    IF v_attendee_record->'person' IS NOT NULL AND v_attendee_record->'person' != 'null'::jsonb THEN
      v_person_id := gen_random_uuid();
      
      INSERT INTO people (
        person_id,
        title,
        first_name,
        last_name,
        suffix,
        primary_email,
        primary_phone,
        dietary_requirements,
        special_needs,
        created_at,
        updated_at
      ) VALUES (
        v_person_id,
        v_attendee_record->'person'->>'title',
        v_attendee_record->'person'->>'first_name',
        v_attendee_record->'person'->>'last_name',
        v_attendee_record->'person'->>'suffix',
        v_attendee_record->'person'->>'primary_email',
        v_attendee_record->'person'->>'primary_phone',
        v_attendee_record->'person'->>'dietary_requirements',
        v_attendee_record->'person'->>'special_needs',
        NOW(),
        NOW()
      );
      
      v_people_created := v_people_created || jsonb_build_object(
        'person_id', v_person_id,
        'first_name', v_attendee_record->'person'->>'first_name',
        'last_name', v_attendee_record->'person'->>'last_name'
      );
    END IF;
    
    -- Create attendee with correct column mapping
    -- Map snake_case input to camelCase database columns
    INSERT INTO attendees (
      attendeeid,         -- maps from attendee_id
      registrationid,     -- maps from registration_id (we provide this)
      person_id,          -- stays the same
      attendeetype,       -- maps from attendee_type
      dietaryrequirements,-- maps from dietary_requirements
      specialneeds,       -- maps from special_needs
      contactpreference,  -- maps from contact_preference
      relationship,       -- stays the same
      relatedattendeeid,  -- maps from related_attendee_id
      eventtitle,         -- maps from event_title
      createdat,          -- we provide this
      updatedat           -- we provide this
    ) VALUES (
      v_attendee_id,
      v_registration_id,
      v_person_id,
      (v_attendee_record->>'attendee_type')::attendee_type,
      v_attendee_record->>'dietary_requirements',
      v_attendee_record->>'special_needs',
      (v_attendee_record->>'contact_preference')::attendee_contact_preference,
      v_attendee_record->>'relationship',
      (v_attendee_record->>'related_attendee_id')::UUID,
      COALESCE(v_attendee_record->>'event_title', v_event_title),
      NOW(),
      NOW()
    );
    
    -- Track primary attendee
    IF (v_attendee_record->>'is_primary')::BOOLEAN = TRUE THEN
      v_primary_attendee_id := v_attendee_id;
    END IF;
    
    -- Create masonic profile if applicable
    IF v_attendee_record->'masonic_profile' IS NOT NULL AND 
       v_attendee_record->>'attendee_type' = 'mason' THEN
      
      -- Check if masonicprofiles table exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'masonicprofiles') THEN
        INSERT INTO masonicprofiles (
          masonicprofileid,
          person_id,
          rank,
          masonictitle,
          grandrank,
          grandofficer,
          grandoffice,
          lodgeid,
          createdat,
          updatedat
        ) VALUES (
          gen_random_uuid(),
          v_person_id,
          v_attendee_record->'masonic_profile'->>'rank',
          v_attendee_record->'masonic_profile'->>'masonic_title',
          v_attendee_record->'masonic_profile'->>'grand_rank',
          v_attendee_record->'masonic_profile'->>'grand_officer',
          v_attendee_record->'masonic_profile'->>'grand_office',
          (v_attendee_record->>'lodge_org_id')::UUID,
          NOW(),
          NOW()
        );
      END IF;
    END IF;
    
    -- Add to results
    v_attendee_results := v_attendee_results || jsonb_build_object(
      'attendee_id', v_attendee_id,
      'person_id', v_person_id,
      'attendee_type', v_attendee_record->>'attendee_type',
      'is_primary', COALESCE((v_attendee_record->>'is_primary')::BOOLEAN, FALSE)
    );
  END LOOP;
  
  -- Update registration with primary attendee
  IF v_primary_attendee_id IS NOT NULL THEN
    UPDATE registrations 
    SET primary_attendee_id = v_primary_attendee_id
    WHERE registration_id = v_registration_id;
  END IF;
  
  -- Process tickets
  FOR v_ticket_record IN SELECT * FROM jsonb_array_elements(tickets_data) LOOP
    v_ticket_id := gen_random_uuid();
    
    -- Insert into tickets table with correct columns
    INSERT INTO tickets (
      ticket_id,
      registration_id,
      attendee_id,
      event_id,
      event_ticket_id,
      ticket_definition_id,
      package_id,
      price_paid,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_ticket_id,
      v_registration_id,
      (v_ticket_record->>'attendee_id')::UUID,
      v_event_id,
      (v_ticket_record->>'event_ticket_id')::UUID,
      (v_ticket_record->>'ticket_definition_id')::UUID,
      (v_ticket_record->>'package_id')::UUID,
      COALESCE((v_ticket_record->>'price_paid')::NUMERIC, (v_ticket_record->>'price_at_assignment')::NUMERIC, 0),
      'pending',
      NOW(),
      NOW()
    );
    
    -- Add to results
    v_ticket_results := v_ticket_results || jsonb_build_object(
      'ticket_id', v_ticket_id,
      'attendee_id', v_ticket_record->>'attendee_id',
      'ticket_type', v_ticket_record->>'ticket_type'
    );
  END LOOP;
  
  -- Get the auto-generated confirmation number
  SELECT confirmation_number INTO v_confirmation_number
  FROM registrations
  WHERE registration_id = v_registration_id;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'confirmation_number', v_confirmation_number,
    'customer_id', v_customer_id,
    'registration', jsonb_build_object(
      'id', v_registration_id,
      'confirmation_number', v_confirmation_number,
      'status', 'unpaid',
      'payment_status', 'pending',
      'total_amount', COALESCE((registration_data->>'total_price_paid')::NUMERIC, 0)
    ),
    'people_created', v_people_created,
    'attendees_created', v_attendee_results,
    'tickets_created', v_ticket_results,
    'summary', jsonb_build_object(
      'people_count', jsonb_array_length(v_people_created),
      'attendees_count', jsonb_array_length(v_attendee_results),
      'tickets_count', jsonb_array_length(v_ticket_results),
      'total_amount', COALESCE((registration_data->>'total_price_paid')::NUMERIC, 0)
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE,
      'hint', 'Check column names and data types'
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_registration TO authenticated;
GRANT EXECUTE ON FUNCTION create_registration TO anon;