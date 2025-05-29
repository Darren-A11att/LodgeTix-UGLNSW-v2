-- Migration: Fix Registration Functions for Lowercase Table Names
-- Description: Updates RPC functions to use correct lowercase table and column names
-- Date: 2025-05-28

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.complete_registration CASCADE;
DROP FUNCTION IF EXISTS public.update_payment_status_and_complete CASCADE;

-- Create the complete_registration function with correct lowercase table/column names
CREATE OR REPLACE FUNCTION public.complete_registration(
    registration_data json,
    attendees_data json,
    tickets_data json,
    masonic_profiles_data json DEFAULT NULL,
    customer_data json DEFAULT NULL,
    people_data json DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_registration_id UUID;
    registration_record RECORD;
    attendee_record RECORD;
    person_record RECORD;
    ticket_record RECORD;
    masonic_profile_record RECORD;
    result_json JSON;
    confirmation_number TEXT;
BEGIN
    -- Validate input
    IF registration_data IS NULL OR attendees_data IS NULL OR tickets_data IS NULL THEN
        RAISE EXCEPTION 'Missing required data';
    END IF;

    BEGIN
        -- Create registration with proper enum casting
        INSERT INTO registrations (
            registration_id,
            customer_id,
            event_id,
            registration_type,
            registration_date,
            total_price_paid,
            status,
            payment_status,
            stripe_payment_intent_id,
            agree_to_terms,
            registration_data
        ) VALUES (
            COALESCE((registration_data->>'registration_id')::UUID, gen_random_uuid()),
            (registration_data->>'customer_id')::UUID,
            (registration_data->>'event_id')::UUID,
            (registration_data->>'registration_type')::registration_type,
            COALESCE((registration_data->>'registration_date')::TIMESTAMP, NOW()),
            COALESCE((registration_data->>'total_price_paid')::DECIMAL, 0),
            COALESCE(registration_data->>'status', 'pending'),
            COALESCE((registration_data->>'payment_status')::payment_status, 'pending'::payment_status),
            registration_data->>'stripe_payment_intent_id',
            COALESCE((registration_data->>'agree_to_terms')::BOOLEAN, false),
            registration_data->'registration_data'
        ) RETURNING registration_id INTO new_registration_id;

        -- Create people records if provided
        IF people_data IS NOT NULL THEN
            FOR person_record IN SELECT * FROM json_array_elements(people_data) LOOP
                INSERT INTO people (
                    person_id,
                    first_name,
                    last_name,
                    title,
                    suffix,
                    primary_email,
                    primary_phone,
                    street_address,
                    city,
                    state,
                    postal_code,
                    country,
                    dietary_requirements,
                    special_needs,
                    is_organisation
                ) VALUES (
                    COALESCE((person_record.value->>'person_id')::UUID, gen_random_uuid()),
                    person_record.value->>'first_name',
                    person_record.value->>'last_name',
                    person_record.value->>'title',
                    person_record.value->>'suffix',
                    person_record.value->>'primary_email',
                    person_record.value->>'primary_phone',
                    person_record.value->>'street_address',
                    person_record.value->>'city',
                    person_record.value->>'state',
                    person_record.value->>'postal_code',
                    person_record.value->>'country',
                    person_record.value->>'dietary_requirements',
                    person_record.value->>'special_needs',
                    COALESCE((person_record.value->>'is_organisation')::BOOLEAN, false)
                ) ON CONFLICT (person_id) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    primary_email = EXCLUDED.primary_email,
                    primary_phone = EXCLUDED.primary_phone;
            END LOOP;
        END IF;

        -- Create attendees with correct column names (all lowercase, no underscores)
        FOR attendee_record IN SELECT * FROM json_array_elements(attendees_data) LOOP
            INSERT INTO attendees (
                attendeeid,
                registrationid,
                person_id,
                attendeetype,
                relatedattendeeid,
                relationship,
                contactpreference,
                dietaryrequirements,
                specialneeds,
                eventtitle
            ) VALUES (
                COALESCE((attendee_record.value->>'attendee_id')::UUID, gen_random_uuid()),
                new_registration_id,
                (attendee_record.value->>'person_id')::UUID,
                (attendee_record.value->>'attendee_type')::attendee_type,
                (attendee_record.value->>'related_attendee_id')::UUID,
                attendee_record.value->>'relationship',
                COALESCE((attendee_record.value->>'contact_preference')::attendee_contact_preference, 'directly'::attendee_contact_preference),
                attendee_record.value->>'dietary_requirements',
                attendee_record.value->>'special_needs',
                attendee_record.value->>'event_title'
            );
        END LOOP;

        -- Create masonic profiles if provided with correct column names (all lowercase, no underscores)
        IF masonic_profiles_data IS NOT NULL THEN
            FOR masonic_profile_record IN SELECT * FROM json_array_elements(masonic_profiles_data) LOOP
                -- Check if attendee_id exists in value
                IF masonic_profile_record.value->>'attendee_id' IS NOT NULL THEN
                    INSERT INTO masonicprofiles (
                        masonicprofileid,
                        person_id,
                        rank,
                        masonictitle,
                        grandrank,
                        grandofficer,
                        grandoffice,
                        lodgeid
                    ) VALUES (
                        gen_random_uuid(),
                        -- Get person_id from attendees table using the attendee_id
                        (SELECT person_id FROM attendees WHERE attendeeid = (masonic_profile_record.value->>'attendee_id')::UUID),
                        masonic_profile_record.value->>'rank',
                        masonic_profile_record.value->>'masonic_title',
                        masonic_profile_record.value->>'grand_rank',
                        masonic_profile_record.value->>'grand_officer',
                        masonic_profile_record.value->>'grand_office',
                        (masonic_profile_record.value->>'lodge_id')::UUID
                    ) ON CONFLICT (person_id) DO UPDATE SET
                        rank = EXCLUDED.rank,
                        masonictitle = EXCLUDED.masonictitle,
                        grandrank = EXCLUDED.grandrank,
                        grandofficer = EXCLUDED.grandofficer,
                        grandoffice = EXCLUDED.grandoffice,
                        lodgeid = EXCLUDED.lodgeid;
                END IF;
            END LOOP;
        END IF;

        -- Create tickets
        FOR ticket_record IN SELECT * FROM json_array_elements(tickets_data) LOOP
            INSERT INTO tickets (
                ticket_id,
                attendee_id,
                event_id,
                registration_id,
                ticket_definition_id,
                event_ticket_id,
                price_paid,
                status,
                is_partner_ticket
            ) VALUES (
                COALESCE((ticket_record.value->>'ticket_id')::UUID, gen_random_uuid()),
                (ticket_record.value->>'attendee_id')::UUID,
                (ticket_record.value->>'event_id')::UUID,
                new_registration_id,
                (ticket_record.value->>'ticket_definition_id')::UUID,
                (ticket_record.value->>'event_ticket_id')::UUID,
                COALESCE((ticket_record.value->>'price_paid')::DECIMAL, 0),
                COALESCE(ticket_record.value->>'status', 'reserved'),
                COALESCE((ticket_record.value->>'is_partner_ticket')::BOOLEAN, false)
            );
        END LOOP;

        -- Get the confirmation number
        SELECT confirmation_number INTO confirmation_number
        FROM registrations
        WHERE registration_id = new_registration_id;

        -- Build result
        result_json := json_build_object(
            'success', true,
            'registration_id', new_registration_id,
            'confirmation_number', confirmation_number,
            'message', 'Registration created successfully'
        );

        RETURN result_json;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Error creating registration: %', SQLERRM;
    END;
END;
$$;

-- Create the update_payment_status_and_complete function with correct lowercase table/column names
CREATE OR REPLACE FUNCTION public.update_payment_status_and_complete(
    p_payment_intent_id text,
    p_new_status payment_status
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_registration_id UUID;
    v_result json;
BEGIN
    -- Update the registration payment status
    UPDATE registrations
    SET 
        payment_status = p_new_status,
        updated_at = NOW()
    WHERE stripe_payment_intent_id = p_payment_intent_id
    RETURNING registration_id INTO v_registration_id;

    IF v_registration_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Registration not found'
        );
    END IF;

    -- Build result
    v_result := json_build_object(
        'success', true,
        'registration_id', v_registration_id,
        'payment_status', p_new_status
    );

    RETURN v_result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION complete_registration TO authenticated;
GRANT EXECUTE ON FUNCTION complete_registration TO anon;
GRANT EXECUTE ON FUNCTION update_payment_status_and_complete TO authenticated;
GRANT EXECUTE ON FUNCTION update_payment_status_and_complete TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION complete_registration IS 'Creates a complete registration with attendees, tickets, and optional masonic profiles';
COMMENT ON FUNCTION update_payment_status_and_complete IS 'Updates payment status for a registration based on payment intent ID';