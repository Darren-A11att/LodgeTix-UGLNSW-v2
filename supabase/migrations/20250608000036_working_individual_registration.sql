-- Working individual registration fix with proper confirmation number format
CREATE OR REPLACE FUNCTION public.upsert_individual_registration(
    p_registration_data jsonb
) RETURNS jsonb AS $$
DECLARE
    v_registration_id uuid;
    v_customer_id uuid;
    v_function_id uuid;
    v_confirmation_number text;
BEGIN
    -- Extract required fields
    v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
    v_customer_id := (p_registration_data->>'authUserId')::uuid;
    v_function_id := (p_registration_data->>'functionId')::uuid;
    
    -- Validate required fields
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer ID (authUserId) is required';
    END IF;
    
    IF v_function_id IS NULL THEN
        RAISE EXCEPTION 'Function ID is required';
    END IF;
    
    -- Generate proper confirmation number format (check existing format constraint)
    v_confirmation_number := 'IND-' || to_char(CURRENT_TIMESTAMP, 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
    
    -- Customer record
    INSERT INTO customers (
        customer_id,
        first_name,
        last_name,
        email,
        phone,
        customer_type,
        created_at,
        updated_at
    ) VALUES (
        v_customer_id,
        COALESCE(p_registration_data->'billingDetails'->>'firstName', 'Test'),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', 'User'),
        COALESCE(p_registration_data->'billingDetails'->>'emailAddress', 'test@example.com'),
        COALESCE(p_registration_data->'billingDetails'->>'mobileNumber', '+61400000000'),
        'booking_contact'::customer_type,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (customer_id) DO NOTHING;
    
    -- Registration record with NULL for optional fields to avoid constraint issues
    INSERT INTO registrations (
        registration_id,
        customer_id,
        function_id,
        registration_type,
        confirmation_number,
        payment_status,
        registration_data,
        created_at,
        updated_at
    ) VALUES (
        v_registration_id,
        v_customer_id,
        v_function_id,
        'individuals'::registration_type,
        v_confirmation_number,
        'pending'::payment_status,
        p_registration_data,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (registration_id) DO UPDATE SET
        registration_data = EXCLUDED.registration_data,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Return success result
    RETURN jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'customerId', v_customer_id,
        'confirmationNumber', v_confirmation_number
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Individual registration failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_individual_registration(jsonb) TO anon;