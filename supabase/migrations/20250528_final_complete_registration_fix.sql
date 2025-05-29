-- Migration: Final Complete Registration Fix
-- Description: Updates RPC functions to handle actual database column names and proper mapping
-- Date: 2025-05-28

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.complete_registration(UUID, JSONB);
DROP FUNCTION IF EXISTS public.update_payment_status_and_complete(UUID, TEXT);

-- Create the complete_registration function with proper column name handling
CREATE OR REPLACE FUNCTION public.complete_registration(
    p_registration_id UUID,
    p_payment_data JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    registration_id UUID,
    confirmation_number TEXT,
    stripe_payment_intent_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_status TEXT;
    v_confirmation_number TEXT;
    v_stripe_payment_intent_id TEXT;
    v_registration_exists BOOLEAN;
BEGIN
    -- Check if registration exists
    SELECT EXISTS(
        SELECT 1 FROM "Registrations" 
        WHERE "RegistrationID" = p_registration_id
    ) INTO v_registration_exists;
    
    IF NOT v_registration_exists THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN AS success,
            'Registration not found'::TEXT AS message,
            NULL::UUID AS registration_id,
            NULL::TEXT AS confirmation_number,
            NULL::TEXT AS stripe_payment_intent_id;
        RETURN;
    END IF;

    -- Get current status
    SELECT "RegistrationStatus" 
    INTO v_current_status
    FROM "Registrations"
    WHERE "RegistrationID" = p_registration_id;

    -- Check if already completed
    IF v_current_status = 'completed' THEN
        SELECT 
            "ConfirmationNumber",
            "StripePaymentIntentID"
        INTO 
            v_confirmation_number,
            v_stripe_payment_intent_id
        FROM "Registrations"
        WHERE "RegistrationID" = p_registration_id;
        
        RETURN QUERY SELECT 
            TRUE::BOOLEAN AS success,
            'Registration already completed'::TEXT AS message,
            p_registration_id AS registration_id,
            v_confirmation_number AS confirmation_number,
            v_stripe_payment_intent_id AS stripe_payment_intent_id;
        RETURN;
    END IF;

    -- Extract values from payment data with proper mapping
    -- Map snake_case input to actual database column names
    v_stripe_payment_intent_id := COALESCE(
        p_payment_data->>'stripe_payment_intent_id',
        p_payment_data->>'stripePaymentIntentId',
        p_payment_data->>'StripePaymentIntentID'
    );

    -- Generate confirmation number if not exists
    SELECT "ConfirmationNumber" 
    INTO v_confirmation_number
    FROM "Registrations" 
    WHERE "RegistrationID" = p_registration_id;
    
    IF v_confirmation_number IS NULL THEN
        v_confirmation_number := 'GI-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                                LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;

    -- Update registration with proper column names
    UPDATE "Registrations"
    SET 
        "RegistrationStatus" = 'completed',
        "PaymentStatus" = 'completed',
        "CompletedAt" = NOW(),
        "UpdatedAt" = NOW(),
        "ConfirmationNumber" = v_confirmation_number,
        "StripePaymentIntentID" = COALESCE(v_stripe_payment_intent_id, "StripePaymentIntentID"),
        "PaymentMethod" = COALESCE(
            p_payment_data->>'payment_method',
            p_payment_data->>'paymentMethod',
            p_payment_data->>'PaymentMethod',
            "PaymentMethod"
        ),
        "PaymentAmount" = COALESCE(
            (p_payment_data->>'payment_amount')::DECIMAL,
            (p_payment_data->>'paymentAmount')::DECIMAL,
            (p_payment_data->>'PaymentAmount')::DECIMAL,
            "PaymentAmount"
        ),
        "Currency" = COALESCE(
            p_payment_data->>'currency',
            p_payment_data->>'Currency',
            "Currency"
        ),
        "PaymentProcessorFee" = COALESCE(
            (p_payment_data->>'payment_processor_fee')::DECIMAL,
            (p_payment_data->>'paymentProcessorFee')::DECIMAL,
            (p_payment_data->>'PaymentProcessorFee')::DECIMAL,
            "PaymentProcessorFee"
        ),
        "NetAmount" = COALESCE(
            (p_payment_data->>'net_amount')::DECIMAL,
            (p_payment_data->>'netAmount')::DECIMAL,
            (p_payment_data->>'NetAmount')::DECIMAL,
            "NetAmount"
        ),
        "PaymentMetadata" = COALESCE(
            p_payment_data->'metadata',
            p_payment_data->'Metadata',
            "PaymentMetadata"
        )
    WHERE "RegistrationID" = p_registration_id;

    -- Update related tickets status
    UPDATE "Tickets"
    SET 
        "TicketStatus" = 'confirmed',
        "UpdatedAt" = NOW()
    WHERE "RegistrationID" = p_registration_id
    AND "TicketStatus" != 'cancelled';

    -- Return success
    RETURN QUERY SELECT 
        TRUE::BOOLEAN AS success,
        'Registration completed successfully'::TEXT AS message,
        p_registration_id AS registration_id,
        v_confirmation_number AS confirmation_number,
        v_stripe_payment_intent_id AS stripe_payment_intent_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error details
        RAISE LOG 'Error in complete_registration: % - %', SQLERRM, SQLSTATE;
        
        RETURN QUERY SELECT 
            FALSE::BOOLEAN AS success,
            FORMAT('Error completing registration: %s', SQLERRM)::TEXT AS message,
            NULL::UUID AS registration_id,
            NULL::TEXT AS confirmation_number,
            NULL::TEXT AS stripe_payment_intent_id;
END;
$$;

-- Create update_payment_status_and_complete function with proper column names
CREATE OR REPLACE FUNCTION public.update_payment_status_and_complete(
    p_registration_id UUID,
    p_stripe_payment_intent_id TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    registration_id UUID,
    confirmation_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_confirmation_number TEXT;
    v_registration_exists BOOLEAN;
    v_current_status TEXT;
BEGIN
    -- Check if registration exists
    SELECT EXISTS(
        SELECT 1 FROM "Registrations" 
        WHERE "RegistrationID" = p_registration_id
    ) INTO v_registration_exists;
    
    IF NOT v_registration_exists THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN AS success,
            'Registration not found'::TEXT AS message,
            NULL::UUID AS registration_id,
            NULL::TEXT AS confirmation_number;
        RETURN;
    END IF;

    -- Get current status
    SELECT "RegistrationStatus" 
    INTO v_current_status
    FROM "Registrations"
    WHERE "RegistrationID" = p_registration_id;

    -- Check if already completed
    IF v_current_status = 'completed' THEN
        SELECT "ConfirmationNumber"
        INTO v_confirmation_number
        FROM "Registrations"
        WHERE "RegistrationID" = p_registration_id;
        
        RETURN QUERY SELECT 
            TRUE::BOOLEAN AS success,
            'Registration already completed'::TEXT AS message,
            p_registration_id AS registration_id,
            v_confirmation_number AS confirmation_number;
        RETURN;
    END IF;

    -- Generate confirmation number if not exists
    SELECT "ConfirmationNumber" 
    INTO v_confirmation_number
    FROM "Registrations" 
    WHERE "RegistrationID" = p_registration_id;
    
    IF v_confirmation_number IS NULL THEN
        v_confirmation_number := 'GI-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                                LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;

    -- Update registration
    UPDATE "Registrations"
    SET 
        "RegistrationStatus" = 'completed',
        "PaymentStatus" = 'completed',
        "CompletedAt" = NOW(),
        "UpdatedAt" = NOW(),
        "ConfirmationNumber" = v_confirmation_number,
        "StripePaymentIntentID" = COALESCE(p_stripe_payment_intent_id, "StripePaymentIntentID")
    WHERE "RegistrationID" = p_registration_id;

    -- Update related tickets
    UPDATE "Tickets"
    SET 
        "TicketStatus" = 'confirmed',
        "UpdatedAt" = NOW()
    WHERE "RegistrationID" = p_registration_id
    AND "TicketStatus" != 'cancelled';

    -- Return success
    RETURN QUERY SELECT 
        TRUE::BOOLEAN AS success,
        'Payment status updated and registration completed'::TEXT AS message,
        p_registration_id AS registration_id,
        v_confirmation_number AS confirmation_number;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error details
        RAISE LOG 'Error in update_payment_status_and_complete: % - %', SQLERRM, SQLSTATE;
        
        RETURN QUERY SELECT 
            FALSE::BOOLEAN AS success,
            FORMAT('Error updating payment status: %s', SQLERRM)::TEXT AS message,
            NULL::UUID AS registration_id,
            NULL::TEXT AS confirmation_number;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.complete_registration(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_registration(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.update_payment_status_and_complete(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_status_and_complete(UUID, TEXT) TO anon;

-- Add helpful comments
COMMENT ON FUNCTION public.complete_registration(UUID, JSONB) IS 
'Completes a registration by updating status, generating confirmation number, and recording payment details. Handles both snake_case and PascalCase input formats.';

COMMENT ON FUNCTION public.update_payment_status_and_complete(UUID, TEXT) IS 
'Updates payment status and completes registration. Used by Stripe webhook to finalize successful payments.';

-- Create indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_registrations_confirmation_number 
ON "Registrations"("ConfirmationNumber");

CREATE INDEX IF NOT EXISTS idx_registrations_stripe_payment_intent 
ON "Registrations"("StripePaymentIntentID");

CREATE INDEX IF NOT EXISTS idx_registrations_status_payment 
ON "Registrations"("RegistrationStatus", "PaymentStatus");