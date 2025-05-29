-- Complete fix for RPC function with all snake_case column names
-- This replaces the entire create_registration function with correct column names

-- First ensure new columns exist on attendees table
ALTER TABLE attendees 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS suffix TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_partner TEXT,
ADD COLUMN IF NOT EXISTS has_partner BOOLEAN DEFAULT FALSE;

-- Add columns to people table if needed
ALTER TABLE people
ADD COLUMN IF NOT EXISTS has_partner BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_partner TEXT,
ADD COLUMN IF NOT EXISTS relationship TEXT;

-- Create masonic_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS masonic_profiles (
  attendee_id UUID PRIMARY KEY REFERENCES attendees(attendee_id) ON DELETE CASCADE,
  rank TEXT,
  masonic_title TEXT,
  grand_rank TEXT,
  grand_officer TEXT,
  grand_office TEXT,
  grand_officer_status TEXT,
  present_grand_officer_role TEXT,
  past_titles TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update masonic_profiles table to match new structure if it exists
ALTER TABLE masonic_profiles
ADD COLUMN IF NOT EXISTS grand_rank TEXT,
ADD COLUMN IF NOT EXISTS grand_officer TEXT,
ADD COLUMN IF NOT EXISTS grand_office TEXT;

-- Drop and recreate the function with correct column names
DROP FUNCTION IF EXISTS create_registration(jsonb, jsonb, jsonb);

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
        has_partner,
        is_partner,
        relationship,
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
        COALESCE((v_attendee_record.value->'person'->>'has_partner')::BOOLEAN, FALSE),
        v_attendee_record.value->'person'->>'is_partner',
        v_attendee_record.value->'person'->>'relationship',
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
    
    -- Create attendee with snake_case column names
    v_attendee_id := (v_attendee_record.value->>'attendee_id')::UUID;
    
    INSERT INTO attendees (
      attendee_id,
      registration_id,
      person_id,
      attendee_type,
      is_primary,
      is_partner,
      has_partner,
      dietary_requirements,
      special_needs,
      contact_preference,
      relationship,
      related_attendee_id,
      event_title,
      title,
      first_name,
      last_name,
      suffix,
      email,
      phone,
      created_at,
      updated_at
    ) VALUES (
      v_attendee_id,
      v_registration_id,
      v_person_id,
      (v_attendee_record.value->>'attendee_type')::attendee_type,
      COALESCE((v_attendee_record.value->>'is_primary')::BOOLEAN, FALSE),
      v_attendee_record.value->>'is_partner',
      COALESCE((v_attendee_record.value->>'has_partner')::BOOLEAN, FALSE),
      v_attendee_record.value->>'dietary_requirements',
      v_attendee_record.value->>'special_needs',
      (v_attendee_record.value->>'contact_preference')::attendee_contact_preference,
      v_attendee_record.value->>'relationship',
      (v_attendee_record.value->>'related_attendee_id')::UUID,
      v_attendee_record.value->>'event_title',
      v_attendee_record.value->>'title',
      v_attendee_record.value->>'first_name',
      v_attendee_record.value->>'last_name',
      v_attendee_record.value->>'suffix',
      v_attendee_record.value->>'email',
      v_attendee_record.value->>'phone',
      NOW(),
      NOW()
    );
    
    -- Track primary attendee
    IF (v_attendee_record.value->>'is_primary')::BOOLEAN = TRUE THEN
      v_primary_attendee_id := v_attendee_id;
    END IF;
    
    -- Create masonic profile if applicable
    v_masonic_profile_created := FALSE;
    IF v_attendee_record.value->'masonic_profile' IS NOT NULL AND 
       v_attendee_record.value->>'attendee_type' = 'mason' THEN
      
      INSERT INTO masonic_profiles (
        attendee_id,
        rank,
        masonic_title,
        grand_rank,
        grand_officer,
        grand_office,
        notes,
        created_at,
        updated_at
      ) VALUES (
        v_attendee_id,
        v_attendee_record.value->'masonic_profile'->>'rank',
        v_attendee_record.value->'masonic_profile'->>'masonic_title',
        v_attendee_record.value->'masonic_profile'->>'grand_rank',
        v_attendee_record.value->'masonic_profile'->>'grand_officer',
        v_attendee_record.value->'masonic_profile'->>'grand_office',
        v_attendee_record.value->'masonic_profile'->>'notes',
        NOW(),
        NOW()
      );
      
      -- Also handle lodge information
      IF v_attendee_record.value->>'grandlodge_org_id' IS NOT NULL THEN
        UPDATE attendees 
        SET grandlodge_org_id = (v_attendee_record.value->>'grandlodge_org_id')::UUID
        WHERE attendee_id = v_attendee_id;
      END IF;
      
      IF v_attendee_record.value->>'lodge_org_id' IS NOT NULL THEN
        UPDATE attendees 
        SET lodge_org_id = (v_attendee_record.value->>'lodge_org_id')::UUID
        WHERE attendee_id = v_attendee_id;
      END IF;
      
      IF v_attendee_record.value->>'lodge_name_number' IS NOT NULL THEN
        UPDATE attendees 
        SET lodge_name_number = v_attendee_record.value->>'lodge_name_number'
        WHERE attendee_id = v_attendee_id;
      END IF;
      
      v_masonic_profile_created := TRUE;
    END IF;
    
    -- Add to results
    v_attendee_results := v_attendee_results || jsonb_build_object(
      'attendee_id', v_attendee_id,
      'person_id', v_person_id,
      'attendee_type', v_attendee_record.value->>'attendee_type',
      'is_primary', COALESCE((v_attendee_record.value->>'is_primary')::BOOLEAN, FALSE),
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_registration TO authenticated;

-- Also fix the payment status trigger to use snake_case columns
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_payment_statuses_on_registration_change ON registrations;
CREATE TRIGGER update_payment_statuses_on_registration_change
  AFTER UPDATE ON registrations
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION trigger_update_related_payment_statuses();