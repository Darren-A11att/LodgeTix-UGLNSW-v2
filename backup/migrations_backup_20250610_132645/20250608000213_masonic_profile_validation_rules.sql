-- Comprehensive validation rules for masonic profile creation
-- Implements business rules from BUG-003 design decisions

-- Function to validate masonic profile data before creation
CREATE OR REPLACE FUNCTION validate_masonic_profile_data(
    p_masonic_data JSONB,
    p_attendee_type TEXT DEFAULT NULL
) RETURNS TABLE (
    is_valid BOOLEAN,
    errors TEXT[],
    warnings TEXT[],
    validation_details JSONB
) AS $$
DECLARE
    v_errors TEXT[] := '{}';
    v_warnings TEXT[] := '{}';
    v_details JSONB := '{}';
    v_rank TEXT;
    v_lodge_id TEXT;
    v_grand_lodge_id TEXT;
    v_masonic_title TEXT;
    v_grand_officer_status TEXT;
    v_present_grand_officer_role TEXT;
BEGIN
    -- Extract fields from JSONB
    v_rank := p_masonic_data->>'rank';
    v_lodge_id := p_masonic_data->>'lodge_id';
    v_grand_lodge_id := p_masonic_data->>'grand_lodge_id';
    v_masonic_title := COALESCE(p_masonic_data->>'masonic_title', p_masonic_data->>'title');
    v_grand_officer_status := p_masonic_data->>'grandOfficerStatus';
    v_present_grand_officer_role := p_masonic_data->>'presentGrandOfficerRole';
    
    -- Business Rule 1: Only create masonic profiles for mason attendees
    IF p_attendee_type IS NOT NULL AND p_attendee_type != 'mason' THEN
        v_errors := array_append(v_errors, 'Masonic profiles can only be created for attendee_type = ''mason''');
    END IF;
    
    -- Business Rule 2: Rank is required for masonic profiles
    IF v_rank IS NULL OR trim(v_rank) = '' THEN
        v_errors := array_append(v_errors, 'Masonic rank is required for profile creation');
    ELSE
        -- Validate rank values (based on registration-types.ts)
        IF v_rank NOT IN ('EAF', 'FCF', 'MM', 'IM', 'GL') THEN
            v_warnings := array_append(v_warnings, 'Non-standard masonic rank: ' || v_rank);
        END IF;
    END IF;
    
    -- Business Rule 3: Either lodge_id OR grand_lodge_id required (check_masonic_affiliation constraint)
    IF (v_lodge_id IS NULL OR trim(v_lodge_id) = '') AND 
       (v_grand_lodge_id IS NULL OR trim(v_grand_lodge_id) = '') THEN
        v_errors := array_append(v_errors, 'Either lodge_id or grand_lodge_id must be provided for masonic profiles');
    END IF;
    
    -- Validation Rule 4: UUID format validation for organisation IDs
    IF v_lodge_id IS NOT NULL AND trim(v_lodge_id) != '' THEN
        IF v_lodge_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_errors := array_append(v_errors, 'lodge_id must be a valid UUID format');
        END IF;
    END IF;
    
    IF v_grand_lodge_id IS NOT NULL AND trim(v_grand_lodge_id) != '' THEN
        IF v_grand_lodge_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_errors := array_append(v_errors, 'grand_lodge_id must be a valid UUID format');
        END IF;
    END IF;
    
    -- Validation Rule 5: Field length constraints (based on database schema)
    IF v_masonic_title IS NOT NULL AND length(v_masonic_title) > 50 THEN
        v_errors := array_append(v_errors, 'masonic_title cannot exceed 50 characters');
    END IF;
    
    IF v_rank IS NOT NULL AND length(v_rank) > 50 THEN
        v_errors := array_append(v_errors, 'rank cannot exceed 50 characters');
    END IF;
    
    IF v_present_grand_officer_role IS NOT NULL AND length(v_present_grand_officer_role) > 100 THEN
        v_errors := array_append(v_errors, 'grand_office cannot exceed 100 characters');
    END IF;
    
    -- Business Rule 6: Grand officer consistency validation
    IF v_grand_officer_status = 'Present' AND (v_present_grand_officer_role IS NULL OR trim(v_present_grand_officer_role) = '') THEN
        v_warnings := array_append(v_warnings, 'Present grand officer status requires presentGrandOfficerRole to be specified');
    END IF;
    
    -- Validation Rule 7: Masonic title consistency
    IF v_masonic_title IS NOT NULL THEN
        -- Validate title values (based on registration-types.ts)
        IF v_masonic_title NOT IN ('Bro', 'W Bro', 'VW Bro', 'RW Bro', 'MW Bro') THEN
            v_warnings := array_append(v_warnings, 'Non-standard masonic title: ' || v_masonic_title);
        END IF;
    ELSE
        v_warnings := array_append(v_warnings, 'No masonic title provided - consider adding for completeness');
    END IF;
    
    -- Build validation details
    v_details := jsonb_build_object(
        'extracted_fields', jsonb_build_object(
            'rank', v_rank,
            'lodge_id', v_lodge_id,
            'grand_lodge_id', v_grand_lodge_id,
            'masonic_title', v_masonic_title,
            'grand_officer_status', v_grand_officer_status,
            'present_grand_officer_role', v_present_grand_officer_role
        ),
        'validation_rules_applied', jsonb_build_array(
            'attendee_type_restriction',
            'rank_required',
            'affiliation_required',
            'uuid_format_validation',
            'field_length_constraints',
            'grand_officer_consistency',
            'masonic_title_validation'
        ),
        'validation_timestamp', CURRENT_TIMESTAMP
    );
    
    -- Return validation results
    RETURN QUERY SELECT 
        array_length(v_errors, 1) = 0 OR v_errors = '{}' as is_valid,
        v_errors,
        v_warnings,
        v_details;
END;
$$ LANGUAGE plpgsql;

-- Function to check if organisation IDs exist before creating masonic profiles
CREATE OR REPLACE FUNCTION validate_masonic_organisation_references(
    p_lodge_id UUID DEFAULT NULL,
    p_grand_lodge_id UUID DEFAULT NULL
) RETURNS TABLE (
    lodge_exists BOOLEAN,
    grand_lodge_exists BOOLEAN,
    lodge_name TEXT,
    grand_lodge_name TEXT,
    validation_passed BOOLEAN,
    missing_references TEXT[]
) AS $$
DECLARE
    v_lodge_exists BOOLEAN := FALSE;
    v_grand_lodge_exists BOOLEAN := FALSE;
    v_lodge_name TEXT;
    v_grand_lodge_name TEXT;
    v_missing TEXT[] := '{}';
BEGIN
    -- Check lodge existence
    IF p_lodge_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM organisations 
            WHERE organisation_id = p_lodge_id
        ), organisation_name INTO v_lodge_exists, v_lodge_name
        FROM organisations 
        WHERE organisation_id = p_lodge_id
        LIMIT 1;
        
        IF NOT v_lodge_exists THEN
            v_missing := array_append(v_missing, 'lodge_id: ' || p_lodge_id::text);
        END IF;
    END IF;
    
    -- Check grand lodge existence
    IF p_grand_lodge_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM organisations 
            WHERE organisation_id = p_grand_lodge_id
        ), organisation_name INTO v_grand_lodge_exists, v_grand_lodge_name
        FROM organisations 
        WHERE organisation_id = p_grand_lodge_id
        LIMIT 1;
        
        IF NOT v_grand_lodge_exists THEN
            v_missing := array_append(v_missing, 'grand_lodge_id: ' || p_grand_lodge_id::text);
        END IF;
    END IF;
    
    RETURN QUERY SELECT 
        v_lodge_exists,
        v_grand_lodge_exists,
        v_lodge_name,
        v_grand_lodge_name,
        array_length(v_missing, 1) = 0 OR v_missing = '{}' as validation_passed,
        v_missing;
END;
$$ LANGUAGE plpgsql;

-- Function to validate complete masonic profile creation request
CREATE OR REPLACE FUNCTION validate_complete_masonic_profile_creation(
    p_contact_id UUID,
    p_masonic_data JSONB,
    p_attendee_type TEXT DEFAULT 'mason'
) RETURNS TABLE (
    can_create_profile BOOLEAN,
    validation_errors TEXT[],
    validation_warnings TEXT[],
    contact_exists BOOLEAN,
    profile_already_exists BOOLEAN,
    data_validation_passed BOOLEAN,
    organisation_validation_passed BOOLEAN,
    recommended_action TEXT
) AS $$
DECLARE
    v_contact_exists BOOLEAN := FALSE;
    v_profile_exists BOOLEAN := FALSE;
    v_data_validation RECORD;
    v_org_validation RECORD;
    v_all_errors TEXT[] := '{}';
    v_all_warnings TEXT[] := '{}';
    v_recommended_action TEXT;
    v_lodge_id UUID;
    v_grand_lodge_id UUID;
BEGIN
    -- Check contact existence
    SELECT EXISTS(
        SELECT 1 FROM contacts WHERE contact_id = p_contact_id
    ) INTO v_contact_exists;
    
    IF NOT v_contact_exists THEN
        v_all_errors := array_append(v_all_errors, 'Contact with ID ' || p_contact_id::text || ' does not exist');
    END IF;
    
    -- Check if masonic profile already exists
    SELECT EXISTS(
        SELECT 1 FROM masonic_profiles WHERE contact_id = p_contact_id
    ) INTO v_profile_exists;
    
    -- Validate masonic data
    SELECT * INTO v_data_validation 
    FROM validate_masonic_profile_data(p_masonic_data, p_attendee_type);
    
    v_all_errors := v_all_errors || v_data_validation.errors;
    v_all_warnings := v_all_warnings || v_data_validation.warnings;
    
    -- Validate organisation references if data validation passed
    IF v_data_validation.is_valid THEN
        v_lodge_id := CASE 
            WHEN p_masonic_data->>'lodge_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            THEN (p_masonic_data->>'lodge_id')::uuid
            ELSE NULL
        END;
        
        v_grand_lodge_id := CASE 
            WHEN p_masonic_data->>'grand_lodge_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            THEN (p_masonic_data->>'grand_lodge_id')::uuid
            ELSE NULL
        END;
        
        SELECT * INTO v_org_validation 
        FROM validate_masonic_organisation_references(v_lodge_id, v_grand_lodge_id);
        
        IF NOT v_org_validation.validation_passed THEN
            v_all_errors := v_all_errors || ARRAY(
                SELECT 'Organisation not found: ' || unnest(v_org_validation.missing_references)
            );
        END IF;
    END IF;
    
    -- Determine recommended action
    IF array_length(v_all_errors, 1) > 0 THEN
        v_recommended_action := 'CANNOT_CREATE - Fix validation errors first';
    ELSIF v_profile_exists THEN
        v_recommended_action := 'UPDATE_EXISTING - Profile already exists for this contact';
    ELSE
        v_recommended_action := 'CREATE_NEW - All validations passed';
    END IF;
    
    RETURN QUERY SELECT 
        v_contact_exists AND 
        v_data_validation.is_valid AND 
        COALESCE(v_org_validation.validation_passed, TRUE) AND
        array_length(v_all_errors, 1) = 0 as can_create_profile,
        v_all_errors,
        v_all_warnings,
        v_contact_exists,
        v_profile_exists,
        v_data_validation.is_valid,
        COALESCE(v_org_validation.validation_passed, TRUE),
        v_recommended_action;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON FUNCTION validate_masonic_profile_data(JSONB, TEXT) IS 'Validates masonic profile data against business rules and constraints';
COMMENT ON FUNCTION validate_masonic_organisation_references(UUID, UUID) IS 'Validates that lodge and grand lodge organisation IDs exist in the database';
COMMENT ON FUNCTION validate_complete_masonic_profile_creation(UUID, JSONB, TEXT) IS 'Comprehensive validation for masonic profile creation including all prerequisites';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_masonic_profile_data(JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_masonic_organisation_references(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_complete_masonic_profile_creation(UUID, JSONB, TEXT) TO authenticated;