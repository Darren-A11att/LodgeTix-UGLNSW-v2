-- Quick fix for enum casting issues in create_registration function
-- This updates the existing function to properly cast enum types

CREATE OR REPLACE FUNCTION create_registration(
  registration_data jsonb,
  attendees_data jsonb,
  tickets_data jsonb
) RETURNS jsonb AS $$
DECLARE
  v_registration_id UUID;
  v_customer_id UUID;
  v_person_id UUID;
  v_attendee_id UUID;
  v_ticket_id UUID;
  v_confirmation_number TEXT;
  v_registration_record RECORD;
  v_attendee_record RECORD;
  v_ticket_record RECORD;
  v_people_created jsonb := '[]'::jsonb;
  v_attendee_results jsonb := '[]'::jsonb;
  v_ticket_results jsonb := '[]'::jsonb;
  v_primary_attendee_id UUID;
  v_masonic_profile_created BOOLEAN;
BEGIN
  -- Extract registration data
  v_registration_id := (registration_data->>'registration_id')::UUID;
  v_customer_id := (registration_data->>'customer_id')::UUID;
  
  -- Create registration with proper enum casting
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
    (registration_data->>'event_id')::UUID,
    (registration_data->>'registration_type')::registration_type,
    COALESCE(registration_data->>'status', 'unpaid'),
    COALESCE((registration_data->>'payment_status')::payment_status, 'pending'::payment_status),
    COALESCE((registration_data->>'total_amount_paid')::NUMERIC, 0),
    COALESCE((registration_data->>'total_price_paid')::NUMERIC, 0),
    COALESCE((registration_data->>'agree_to_terms')::BOOLEAN, TRUE),
    registration_data->'registration_data',
    NOW(),
    NOW()
  ) RETURNING * INTO v_registration_record;
  
  -- Process attendees
  FOR v_attendee_record IN SELECT * FROM jsonb_array_elements(attendees_data) LOOP
    -- Create person if needed
    v_person_id := NULL;
    
    IF v_attendee_record.value->'person' IS NOT NULL THEN
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
        gen_random_uuid(),
        v_attendee_record.value->'person'->>'title',
        v_attendee_record.value->'person'->>'first_name',
        v_attendee_record.value->'person'->>'last_name',
        v_attendee_record.value->'person'->>'suffix',
        v_attendee_record.value->'person'->>'primary_email',
        v_attendee_record.value->'person'->>'primary_phone',
        v_attendee_record.value->'person'->>'dietary_requirements',
        v_attendee_record.value->'person'->>'special_needs',
        NOW(),
        NOW()
      ) RETURNING person_id INTO v_person_id;
      
      -- Add to results
      v_people_created := v_people_created || jsonb_build_object(
        'person_id', v_person_id,
        'first_name', v_attendee_record.value->'person'->>'first_name',
        'last_name', v_attendee_record.value->'person'->>'last_name'
      );
    END IF;
    
    -- Create attendee with proper enum casting
    v_attendee_id := (v_attendee_record.value->>'attendeeid')::UUID;
    
    INSERT INTO attendees (
      attendeeid,
      registrationid,
      person_id,
      attendeetype,
      dietaryrequirements,
      specialneeds,
      contactpreference,
      relationship,
      relatedattendeeid,
      eventtitle,
      createdat,
      updatedat
    ) VALUES (
      v_attendee_id,
      v_registration_id,
      v_person_id,
      (v_attendee_record.value->>'attendeetype')::attendee_type,
      v_attendee_record.value->>'dietaryrequirements',
      v_attendee_record.value->>'specialneeds',
      (v_attendee_record.value->>'contactpreference')::attendee_contact_preference,
      v_attendee_record.value->>'relationship',
      (v_attendee_record.value->>'relatedattendeeid')::UUID,
      v_attendee_record.value->>'eventtitle',
      NOW(),
      NOW()
    );
    
    -- Track primary attendee
    IF (v_attendee_record.value->>'isPrimary')::BOOLEAN = TRUE THEN
      v_primary_attendee_id := v_attendee_id;
    END IF;
    
    -- Create masonic profile if applicable
    v_masonic_profile_created := FALSE;
    IF v_attendee_record.value->'masonic_profile' IS NOT NULL AND 
       v_attendee_record.value->>'attendeetype' = 'mason' THEN
      
      INSERT INTO masonic_profiles (
        attendee_id,
        rank,
        masonic_title,
        grand_officer_status,
        present_grand_officer_role,
        past_titles,
        notes,
        created_at,
        updated_at
      ) VALUES (
        v_attendee_id,
        v_attendee_record.value->'masonic_profile'->>'rank',
        v_attendee_record.value->'masonic_profile'->>'masonic_title',
        v_attendee_record.value->'masonic_profile'->>'grand_officer_status',
        v_attendee_record.value->'masonic_profile'->>'present_grand_officer_role',
        v_attendee_record.value->'masonic_profile'->>'past_titles',
        v_attendee_record.value->'masonic_profile'->>'notes',
        NOW(),
        NOW()
      );
      
      -- Also handle lodge information
      IF v_attendee_record.value->>'grandlodge_org_id' IS NOT NULL THEN
        UPDATE attendees 
        SET grandlodge_org_id = (v_attendee_record.value->>'grandlodge_org_id')::UUID
        WHERE attendeeid = v_attendee_id;
      END IF;
      
      IF v_attendee_record.value->>'lodge_org_id' IS NOT NULL THEN
        UPDATE attendees 
        SET lodge_org_id = (v_attendee_record.value->>'lodge_org_id')::UUID
        WHERE attendeeid = v_attendee_id;
      END IF;
      
      IF v_attendee_record.value->>'lodge_name_number' IS NOT NULL THEN
        UPDATE attendees 
        SET lodge_name_number = v_attendee_record.value->>'lodge_name_number'
        WHERE attendeeid = v_attendee_id;
      END IF;
      
      v_masonic_profile_created := TRUE;
    END IF;
    
    -- Add to results
    v_attendee_results := v_attendee_results || jsonb_build_object(
      'attendee_id', v_attendee_id,
      'person_id', v_person_id,
      'attendee_type', v_attendee_record.value->>'attendeetype',
      'is_primary', COALESCE((v_attendee_record.value->>'isPrimary')::BOOLEAN, FALSE),
      'masonic_profile_created', v_masonic_profile_created
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
    
    INSERT INTO tickets (
      ticket_id,
      registration_id,
      attendee_id,
      event_ticket_id,
      ticket_type,
      quantity,
      price_at_assignment,
      ticket_status,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      v_ticket_id,
      v_registration_id,
      (v_ticket_record.value->>'attendee_id')::UUID,
      (v_ticket_record.value->>'event_ticket_id')::UUID,
      v_ticket_record.value->>'ticket_type',
      COALESCE((v_ticket_record.value->>'quantity')::INTEGER, 1),
      COALESCE((v_ticket_record.value->>'price_at_assignment')::NUMERIC, 0),
      'pending',
      v_ticket_record.value->'metadata',
      NOW(),
      NOW()
    );
    
    -- Add to results
    v_ticket_results := v_ticket_results || jsonb_build_object(
      'ticket_id', v_ticket_id,
      'attendee_id', v_ticket_record.value->>'attendee_id',
      'ticket_type', v_ticket_record.value->>'ticket_type'
    );
  END LOOP;
  
  -- Get the auto-generated confirmation number
  SELECT confirmation_number INTO v_confirmation_number
  FROM registrations
  WHERE registration_id = v_registration_id;
  
  -- Return success with created records
  RETURN jsonb_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'confirmation_number', v_confirmation_number,
    'customer_id', v_customer_id,
    'registration', jsonb_build_object(
      'id', v_registration_id,
      'confirmation_number', v_confirmation_number,
      'status', v_registration_record.status,
      'payment_status', v_registration_record.payment_status,
      'total_amount', v_registration_record.total_price_paid
    ),
    'people_created', v_people_created,
    'attendees_created', v_attendee_results,
    'tickets_created', v_ticket_results,
    'summary', jsonb_build_object(
      'people_count', jsonb_array_length(v_people_created),
      'attendees_count', jsonb_array_length(v_attendee_results),
      'tickets_count', jsonb_array_length(v_ticket_results),
      'total_amount', v_registration_record.total_price_paid
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION create_registration TO authenticated;