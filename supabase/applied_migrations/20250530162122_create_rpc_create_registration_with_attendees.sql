-- Create RPC function: create_registration_with_attendees
-- Purpose: Atomic registration creation with attendees and masonic profiles

CREATE OR REPLACE FUNCTION public.create_registration_with_attendees(
    p_registration_data JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_registration_id UUID;
    v_contact_id UUID;
    v_primary_attendee_id UUID;
    v_attendee_id UUID;
    v_partner_attendee_id UUID;
    v_masonic_profile_id UUID;
    v_attendee JSON;
    v_result JSON;
    v_attendees_data JSON;
    v_partner_data JSON;
BEGIN
    -- Start transaction
    -- Extract data from JSON
    v_attendees_data := p_registration_data->'attendees';
    
    -- Input validation
    IF p_registration_data->>'event_id' IS NULL THEN
        RAISE EXCEPTION 'Event ID is required';
    END IF;
    
    IF p_registration_data->>'registration_type' IS NULL THEN
        RAISE EXCEPTION 'Registration type is required';
    END IF;
    
    IF v_attendees_data IS NULL OR json_array_length(v_attendees_data) = 0 THEN
        RAISE EXCEPTION 'At least one attendee is required';
    END IF;

    -- Create or get contact record for the customer
    IF p_registration_data->>'contact_id' IS NOT NULL THEN
        v_contact_id := (p_registration_data->>'contact_id')::UUID;
    ELSE
        -- Create new contact
        INSERT INTO contacts (
            first_name,
            last_name,
            email,
            mobile_number,
            address_line_1,
            address_line_2,
            suburb_city,
            state,
            postcode,
            country
        ) VALUES (
            p_registration_data->>'customer_first_name',
            p_registration_data->>'customer_last_name',
            p_registration_data->>'customer_email',
            p_registration_data->>'customer_phone',
            p_registration_data->>'customer_address_line_1',
            p_registration_data->>'customer_address_line_2',
            p_registration_data->>'customer_city',
            p_registration_data->>'customer_state',
            p_registration_data->>'customer_postcode',
            COALESCE(p_registration_data->>'customer_country', 'Australia')
        )
        RETURNING contact_id INTO v_contact_id;
    END IF;

    -- Create registration record
    INSERT INTO registrations (
        event_id,
        contact_id,
        organisation_id,
        registration_type,
        status,
        payment_status,
        registration_date,
        agree_to_terms,
        registration_data
    ) VALUES (
        (p_registration_data->>'event_id')::UUID,
        v_contact_id,
        NULLIF(p_registration_data->>'organisation_id', '')::UUID,
        p_registration_data->>'registration_type',
        'pending',
        'pending',
        NOW(),
        COALESCE((p_registration_data->>'agree_to_terms')::BOOLEAN, false),
        p_registration_data
    )
    RETURNING registration_id INTO v_registration_id;

    -- Process each attendee
    FOR v_attendee IN SELECT * FROM json_array_elements(v_attendees_data)
    LOOP
        -- Reset partner ID for each attendee
        v_partner_attendee_id := NULL;
        
        -- Create contact for attendee if not the customer
        IF v_attendee->>'contact_id' IS NOT NULL THEN
            v_contact_id := (v_attendee->>'contact_id')::UUID;
        ELSIF (v_attendee->>'email' IS NULL OR v_attendee->>'email' != p_registration_data->>'customer_email') THEN
            INSERT INTO contacts (
                first_name,
                last_name,
                email,
                mobile_number
            ) VALUES (
                v_attendee->>'first_name',
                v_attendee->>'last_name',
                v_attendee->>'email',
                v_attendee->>'phone'
            )
            RETURNING contact_id INTO v_contact_id;
        END IF;

        -- Create attendee record
        INSERT INTO attendees (
            registration_id,
            contact_id,
            attendee_type,
            title,
            first_name,
            last_name,
            suffix,
            email,
            phone,
            dietary_requirements,
            special_needs,
            contact_preference,
            is_primary,
            has_partner
        ) VALUES (
            v_registration_id,
            v_contact_id,
            v_attendee->>'attendee_type',
            v_attendee->>'title',
            v_attendee->>'first_name',
            v_attendee->>'last_name',
            v_attendee->>'suffix',
            v_attendee->>'email',
            v_attendee->>'phone',
            v_attendee->>'dietary_requirements',
            v_attendee->>'special_needs',
            COALESCE(v_attendee->>'contact_preference', 'email'),
            COALESCE((v_attendee->>'is_primary')::BOOLEAN, false),
            COALESCE((v_attendee->>'has_partner')::BOOLEAN, false)
        )
        RETURNING attendee_id INTO v_attendee_id;

        -- Set primary attendee ID
        IF COALESCE((v_attendee->>'is_primary')::BOOLEAN, false) THEN
            v_primary_attendee_id := v_attendee_id;
        END IF;

        -- Create masonic profile if attendee is a mason
        IF v_attendee->>'attendee_type' = 'mason' THEN
            INSERT INTO masonic_profiles (
                contact_id,
                masonic_title,
                rank,
                grand_rank,
                grand_officer,
                grand_office,
                lodge_id,
                grand_lodge_id
            ) VALUES (
                v_contact_id,
                v_attendee->>'masonic_title',
                v_attendee->>'rank',
                v_attendee->>'grand_rank',
                COALESCE((v_attendee->>'grand_officer')::BOOLEAN, false),
                v_attendee->>'grand_office',
                NULLIF(v_attendee->>'lodge_id', '')::UUID,
                NULLIF(v_attendee->>'grand_lodge_id', '')::UUID
            )
            RETURNING masonic_profile_id INTO v_masonic_profile_id;
        END IF;

        -- Handle partner if exists
        IF v_attendee->'partner' IS NOT NULL AND v_attendee->'partner' != 'null'::json THEN
            v_partner_data := v_attendee->'partner';
            
            -- Create contact for partner
            INSERT INTO contacts (
                first_name,
                last_name,
                email,
                mobile_number
            ) VALUES (
                v_partner_data->>'first_name',
                v_partner_data->>'last_name',
                v_partner_data->>'email',
                v_partner_data->>'phone'
            )
            RETURNING contact_id INTO v_contact_id;

            -- Create partner attendee
            INSERT INTO attendees (
                registration_id,
                contact_id,
                attendee_type,
                title,
                first_name,
                last_name,
                suffix,
                email,
                phone,
                dietary_requirements,
                special_needs,
                contact_preference,
                is_primary,
                is_partner,
                related_attendee_id,
                relationship
            ) VALUES (
                v_registration_id,
                v_contact_id,
                v_partner_data->>'attendee_type',
                v_partner_data->>'title',
                v_partner_data->>'first_name',
                v_partner_data->>'last_name',
                v_partner_data->>'suffix',
                v_partner_data->>'email',
                v_partner_data->>'phone',
                v_partner_data->>'dietary_requirements',
                v_partner_data->>'special_needs',
                COALESCE(v_partner_data->>'contact_preference', 'email'),
                false,
                true,
                v_attendee_id,
                v_partner_data->>'relationship'
            )
            RETURNING attendee_id INTO v_partner_attendee_id;

            -- Update main attendee with partner relationship
            UPDATE attendees
            SET related_attendee_id = v_partner_attendee_id,
                relationship = v_partner_data->>'relationship'
            WHERE attendee_id = v_attendee_id;
        END IF;
    END LOOP;

    -- Update registration with primary attendee
    UPDATE registrations
    SET primary_attendee_id = v_primary_attendee_id
    WHERE registration_id = v_registration_id;

    -- Build and return the complete registration
    SELECT json_build_object(
        'registration_id', r.registration_id,
        'confirmation_number', r.confirmation_number,
        'status', r.status,
        'registration_type', r.registration_type,
        'event_id', r.event_id,
        'attendees', (
            SELECT json_agg(
                json_build_object(
                    'attendee_id', a.attendee_id,
                    'full_name', a.full_name,
                    'attendee_type', a.attendee_type,
                    'is_primary', a.is_primary,
                    'is_partner', a.is_partner,
                    'partner_full_name', a.partner_full_name,
                    'masonic_profile_id', a.masonic_profile_id
                )
                ORDER BY a.is_primary DESC, a.created_at
            )
            FROM attendee_complete_view a
            WHERE a.registration_id = r.registration_id
        )
    ) INTO v_result
    FROM registrations r
    WHERE r.registration_id = v_registration_id;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback is automatic in case of exception
        RAISE EXCEPTION 'Error in create_registration_with_attendees: % %', SQLERRM, SQLSTATE;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION public.create_registration_with_attendees(JSON) IS 
'Creates a complete registration with attendees, masonic profiles, and partner relationships in a single atomic transaction. Returns the created registration with attendee details.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_registration_with_attendees(JSON) TO authenticated;