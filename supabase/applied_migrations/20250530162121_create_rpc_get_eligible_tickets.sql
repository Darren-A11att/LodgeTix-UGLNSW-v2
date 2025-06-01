-- Create RPC function: get_eligible_tickets
-- Purpose: Determine which tickets each attendee can purchase based on eligibility criteria

CREATE OR REPLACE FUNCTION public.get_eligible_tickets(
    p_event_id UUID,
    p_registration_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_registration_type TEXT;
    v_attendee RECORD;
    v_ticket_type RECORD;
    v_eligible_tickets JSONB;
    v_attendee_eligible_tickets JSONB;
BEGIN
    -- Input validation
    IF p_event_id IS NULL THEN
        RAISE EXCEPTION 'Event ID is required';
    END IF;
    
    IF p_registration_id IS NULL THEN
        RAISE EXCEPTION 'Registration ID is required';
    END IF;

    -- Get registration type
    SELECT registration_type INTO v_registration_type
    FROM registrations
    WHERE registration_id = p_registration_id;

    IF v_registration_type IS NULL THEN
        RAISE EXCEPTION 'Registration not found with ID: %', p_registration_id;
    END IF;

    -- Initialize result
    v_eligible_tickets := '[]'::jsonb;

    -- Loop through each attendee in the registration
    FOR v_attendee IN 
        SELECT 
            a.attendee_id,
            a.attendee_type,
            a.first_name,
            a.last_name,
            a.full_name,
            a.is_partner,
            a.masonic_profile_id,
            a.rank,
            a.grand_rank,
            a.grand_officer,
            a.lodge_id,
            a.grand_lodge_id
        FROM attendee_complete_view a
        WHERE a.registration_id = p_registration_id
    LOOP
        -- Initialize eligible tickets for this attendee
        v_attendee_eligible_tickets := '[]'::jsonb;
        
        -- Loop through available ticket types for the event
        FOR v_ticket_type IN
            SELECT 
                t.ticket_type_id,
                t.ticket_type_name,
                t.description,
                t.price,
                t.actual_available,
                t.eligibility_criteria,
                t.eligibility_rules,
                t.ticket_category
            FROM ticket_availability_view t
            WHERE t.event_id = p_event_id
              AND t.is_active = true
              AND t.status = 'Active'
              AND t.actual_available > 0
        LOOP
            -- Check if attendee meets eligibility criteria
            IF check_ticket_eligibility(
                v_attendee.attendee_type,
                v_attendee.rank,
                v_attendee.grand_rank,
                v_attendee.grand_officer,
                v_attendee.lodge_id,
                v_attendee.grand_lodge_id,
                v_registration_type,
                v_ticket_type.eligibility_rules
            ) THEN
                -- Add to eligible tickets
                v_attendee_eligible_tickets := v_attendee_eligible_tickets || 
                    jsonb_build_object(
                        'ticket_type_id', v_ticket_type.ticket_type_id,
                        'ticket_type_name', v_ticket_type.ticket_type_name,
                        'description', v_ticket_type.description,
                        'price', v_ticket_type.price,
                        'available_count', v_ticket_type.actual_available,
                        'category', v_ticket_type.ticket_category
                    );
            END IF;
        END LOOP;
        
        -- Add attendee with their eligible tickets
        v_eligible_tickets := v_eligible_tickets || 
            jsonb_build_object(
                'attendee_id', v_attendee.attendee_id,
                'attendee_name', v_attendee.full_name,
                'attendee_type', v_attendee.attendee_type,
                'is_partner', v_attendee.is_partner,
                'eligible_tickets', v_attendee_eligible_tickets
            );
    END LOOP;

    -- Return the result
    v_result := v_eligible_tickets::json;
    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in get_eligible_tickets: % %', SQLERRM, SQLSTATE;
END;
$$;

-- Create helper function to check ticket eligibility
CREATE OR REPLACE FUNCTION public.check_ticket_eligibility(
    p_attendee_type TEXT,
    p_rank TEXT,
    p_grand_rank TEXT,
    p_grand_officer BOOLEAN,
    p_lodge_id UUID,
    p_grand_lodge_id UUID,
    p_registration_type TEXT,
    p_eligibility_rules JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_rule JSONB;
    v_passes_rule BOOLEAN;
BEGIN
    -- If no eligibility rules, ticket is available to all
    IF p_eligibility_rules IS NULL OR jsonb_array_length(p_eligibility_rules) = 0 THEN
        RETURN TRUE;
    END IF;

    -- Check each rule
    FOR v_rule IN SELECT * FROM jsonb_array_elements(p_eligibility_rules)
    LOOP
        v_passes_rule := TRUE;
        
        -- Check attendee type
        IF v_rule->>'attendee_type' IS NOT NULL AND 
           v_rule->>'attendee_type' != p_attendee_type THEN
            v_passes_rule := FALSE;
        END IF;
        
        -- Check registration type
        IF v_rule->>'registration_type' IS NOT NULL AND 
           v_rule->>'registration_type' != p_registration_type THEN
            v_passes_rule := FALSE;
        END IF;
        
        -- Check mason rank requirement
        IF v_rule->>'min_rank' IS NOT NULL AND p_attendee_type = 'mason' THEN
            -- Simple rank comparison (could be enhanced with rank hierarchy)
            IF p_rank IS NULL OR 
               NOT (p_rank = ANY(ARRAY['Master Mason', 'Past Master', 'Grand Officer']) 
                    AND v_rule->>'min_rank' = 'Master Mason') THEN
                v_passes_rule := FALSE;
            END IF;
        END IF;
        
        -- Check grand officer requirement
        IF (v_rule->>'grand_officer')::boolean = true AND 
           (p_grand_officer IS NULL OR p_grand_officer = false) THEN
            v_passes_rule := FALSE;
        END IF;
        
        -- Check lodge requirement
        IF v_rule->>'lodge_id' IS NOT NULL AND 
           v_rule->>'lodge_id' != p_lodge_id::text THEN
            v_passes_rule := FALSE;
        END IF;
        
        -- Check grand lodge requirement
        IF v_rule->>'grand_lodge_id' IS NOT NULL AND 
           v_rule->>'grand_lodge_id' != p_grand_lodge_id::text THEN
            v_passes_rule := FALSE;
        END IF;
        
        -- If any rule passes, the ticket is eligible
        IF v_passes_rule THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    
    -- No rules passed
    RETURN FALSE;
END;
$$;

-- Add function comments
COMMENT ON FUNCTION public.get_eligible_tickets(UUID, UUID) IS 
'Determines which tickets each attendee in a registration can purchase based on eligibility criteria. Returns a JSON array of attendees with their eligible tickets.';

COMMENT ON FUNCTION public.check_ticket_eligibility(TEXT, TEXT, TEXT, BOOLEAN, UUID, UUID, TEXT, JSONB) IS
'Helper function to check if an attendee meets the eligibility criteria for a specific ticket type.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_eligible_tickets(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ticket_eligibility(TEXT, TEXT, TEXT, BOOLEAN, UUID, UUID, TEXT, JSONB) TO authenticated;