-- Add Square catalog support for Orders API integration

-- Add catalog_object_id to packages table
ALTER TABLE public.packages 
ADD COLUMN IF NOT EXISTS catalog_object_id TEXT;

-- Rename qty to quantity in packages table
ALTER TABLE public.packages 
RENAME COLUMN qty TO quantity;

-- Add catalog_object_id to event_tickets table
ALTER TABLE public.event_tickets 
ADD COLUMN IF NOT EXISTS catalog_object_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.packages.catalog_object_id IS 'Square Catalog Item ID for inventory tracking and order creation';
COMMENT ON COLUMN public.packages.quantity IS 'Number of items included in this package (renamed from qty)';
COMMENT ON COLUMN public.event_tickets.catalog_object_id IS 'Square Catalog Item ID for individual ticket inventory tracking';

-- Create helper function to get column information (for tests)
CREATE OR REPLACE FUNCTION get_column_info(p_table_name text, p_column_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = p_table_name
    AND c.column_name = p_column_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the upsert_lodge_registration function to accept Square order information
CREATE OR REPLACE FUNCTION public.upsert_lodge_registration(
    p_function_id uuid,
    p_package_id uuid,
    p_package_quantity integer, -- Changed from p_table_count
    p_booking_contact jsonb,
    p_lodge_details jsonb,
    p_payment_status text DEFAULT 'pending'::text,
    p_square_payment_id text DEFAULT NULL::text,
    p_square_order_id text DEFAULT NULL::text,
    p_square_customer_id text DEFAULT NULL::text,
    p_registration_id uuid DEFAULT NULL::uuid,
    p_total_amount numeric DEFAULT 0,
    p_total_price_paid numeric DEFAULT 0,
    p_platform_fee_amount numeric DEFAULT 0,
    p_square_fee numeric DEFAULT 0,
    p_metadata jsonb DEFAULT NULL::jsonb,
    p_connected_account_id text DEFAULT NULL::text
)
 RETURNS TABLE(
    registrationId uuid, 
    confirmationNumber text, 
    customerId text, 
    paymentId text
)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_customer_id uuid;
    v_booking_contact_id uuid;
    v_registration_id uuid;
    v_attendee_id uuid;
    v_confirmation_number text;
    v_lodge_grand_lodge_id uuid;
    v_lodge_lodge_id uuid;
    v_lodge_name text;
    v_package_price numeric;
    v_package_quantity integer;
    v_total_tickets integer;
BEGIN
    -- Extract lodge details
    v_lodge_grand_lodge_id := (p_lodge_details->>'grand_lodge_id')::uuid;
    v_lodge_lodge_id := (p_lodge_details->>'lodge_id')::uuid;
    v_lodge_name := p_lodge_details->>'lodgeName';
    
    -- Get or create customer
    INSERT INTO customers (
        email,
        customer_type,
        user_id
    ) VALUES (
        p_booking_contact->>'email',
        'organisation',
        auth.uid()
    )
    ON CONFLICT (email) DO UPDATE
        SET updated_at = NOW()
    RETURNING customer_id INTO v_customer_id;
    
    -- Get package details including quantity
    SELECT package_price, quantity 
    INTO v_package_price, v_package_quantity
    FROM packages 
    WHERE package_id = p_package_id;
    
    -- Calculate total tickets: package quantity × items per package × user selected quantity
    v_total_tickets := COALESCE(v_package_quantity, 1) * p_package_quantity;
    
    -- Upsert booking contact
    INSERT INTO booking_contacts (
        customer_id,
        registration_id,
        title,
        first_name,
        last_name,
        email,
        phone,
        address_line_1,
        address_line_2,
        suburb,
        state_territory,
        postcode,
        country,
        billing_first_name,
        billing_last_name,
        billing_email,
        billing_phone,
        billing_address_line_1,
        billing_address_line_2,
        billing_suburb,
        billing_state_territory,
        billing_postcode,
        billing_country,
        special_requirements,
        dietary_requirements,
        accessibility_requirements,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship
    ) VALUES (
        v_customer_id,
        p_registration_id,
        COALESCE(p_booking_contact->>'title', ''),
        p_booking_contact->>'firstName',
        p_booking_contact->>'lastName',
        p_booking_contact->>'email',
        COALESCE(p_booking_contact->>'phone', p_booking_contact->>'mobile'),
        COALESCE(p_booking_contact->>'addressLine1', ''),
        p_booking_contact->>'addressLine2',
        COALESCE(p_booking_contact->>'suburb', p_booking_contact->>'city', ''),
        COALESCE(p_booking_contact->>'stateTerritory', p_booking_contact->>'state', ''),
        COALESCE(p_booking_contact->>'postcode', p_booking_contact->>'postalCode', ''),
        COALESCE(p_booking_contact->>'country', 'Australia'),
        p_booking_contact->>'firstName',
        p_booking_contact->>'lastName',
        p_booking_contact->>'email',
        COALESCE(p_booking_contact->>'phone', p_booking_contact->>'mobile'),
        COALESCE(p_booking_contact->>'addressLine1', ''),
        p_booking_contact->>'addressLine2',
        COALESCE(p_booking_contact->>'suburb', p_booking_contact->>'city', ''),
        COALESCE(p_booking_contact->>'stateTerritory', p_booking_contact->>'state', ''),
        COALESCE(p_booking_contact->>'postcode', p_booking_contact->>'postalCode', ''),
        COALESCE(p_booking_contact->>'country', 'Australia'),
        COALESCE(p_booking_contact->>'specialRequirements', ''),
        COALESCE(p_booking_contact->>'dietaryRequirements', ''),
        COALESCE(p_booking_contact->>'accessibilityRequirements', ''),
        COALESCE(p_booking_contact->>'emergencyContactName', ''),
        COALESCE(p_booking_contact->>'emergencyContactPhone', ''),
        COALESCE(p_booking_contact->>'emergencyContactRelationship', '')
    )
    ON CONFLICT (customer_id, COALESCE(registration_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO UPDATE SET
        title = EXCLUDED.title,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        updated_at = NOW()
    RETURNING booking_contact_id INTO v_booking_contact_id;
    
    -- Handle registration upsert
    IF p_registration_id IS NOT NULL THEN
        -- Update existing registration
        UPDATE registrations SET
            total_amount = p_total_amount,
            total_price_paid = p_total_price_paid,
            platform_fee_amount = p_platform_fee_amount,
            stripe_fee = p_square_fee,
            payment_status = p_payment_status,
            stripe_payment_intent_id = p_square_payment_id,
            stripe_connected_account_id = p_connected_account_id,
            status = CASE 
                WHEN p_payment_status = 'completed' THEN 'completed'
                ELSE status
            END,
            updated_at = NOW()
        WHERE registration_id = p_registration_id
        RETURNING registration_id, confirmation_number 
        INTO v_registration_id, v_confirmation_number;
    ELSE
        -- Generate confirmation number for new registration
        v_confirmation_number := generate_confirmation_number('LDG');
        
        -- Create new registration
        INSERT INTO registrations (
            customer_id,
            booking_contact_id,
            function_id,
            event_id,
            total_amount,
            total_price_paid,
            platform_fee_amount,
            stripe_fee,
            status,
            payment_status,
            registration_type,
            stripe_payment_intent_id,
            stripe_connected_account_id,
            organization_id,
            confirmation_number,
            metadata
        ) VALUES (
            v_customer_id,
            v_booking_contact_id,
            p_function_id,
            NULL,
            p_total_amount,
            p_total_price_paid,
            p_platform_fee_amount,
            p_square_fee,
            CASE 
                WHEN p_payment_status = 'completed' THEN 'completed'::registration_status
                ELSE 'pending'::registration_status
            END,
            p_payment_status,
            'lodges',
            p_square_payment_id,
            p_connected_account_id,
            v_lodge_lodge_id,
            v_confirmation_number,
            jsonb_build_object(
                'lodgeDetails', p_lodge_details,
                'packageQuantity', p_package_quantity,
                'totalTickets', v_total_tickets,
                'squareOrderId', p_square_order_id,
                'squareCustomerId', p_square_customer_id,
                'originalMetadata', p_metadata
            )
        )
        RETURNING registration_id, confirmation_number 
        INTO v_registration_id, v_confirmation_number;
    END IF;
    
    -- Create or update the lodge attendee record
    INSERT INTO attendees (
        registration_id,
        customer_id,
        attendee_type,
        title,
        first_name,
        last_name,
        email,
        phone,
        organisation,
        is_primary,
        attendance_status,
        special_requirements,
        dietary_requirements,
        accessibility_requirements,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        metadata
    ) VALUES (
        v_registration_id,
        v_customer_id,
        'lodge_bulk',
        'Lodge',
        v_lodge_name,
        'Group Registration',
        p_booking_contact->>'email',
        COALESCE(p_booking_contact->>'phone', p_booking_contact->>'mobile'),
        v_lodge_name,
        true,
        'registered',
        '',
        '',
        '',
        COALESCE(p_booking_contact->>'emergencyContactName', ''),
        COALESCE(p_booking_contact->>'emergencyContactPhone', ''),
        COALESCE(p_booking_contact->>'emergencyContactRelationship', ''),
        jsonb_build_object(
            'grandLodgeId', v_lodge_grand_lodge_id,
            'lodgeId', v_lodge_lodge_id,
            'packageQuantity', p_package_quantity,
            'totalTickets', v_total_tickets,
            'packageId', p_package_id
        )
    )
    ON CONFLICT (registration_id, email) DO UPDATE
        SET 
            updated_at = NOW(),
            metadata = EXCLUDED.metadata
    RETURNING attendee_id INTO v_attendee_id;
    
    -- Create attendee selections for the lodge package
    INSERT INTO attendee_selections (
        attendee_id,
        package_id,
        quantity,
        unit_price,
        subtotal
    ) VALUES (
        v_attendee_id,
        p_package_id,
        p_package_quantity,
        v_package_price,
        v_package_price * p_package_quantity
    )
    ON CONFLICT (attendee_id, COALESCE(package_id, '00000000-0000-0000-0000-000000000000'::uuid), 
                COALESCE(event_ticket_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO UPDATE SET
        quantity = EXCLUDED.quantity,
        subtotal = EXCLUDED.subtotal,
        updated_at = NOW();
    
    -- Return the result
    RETURN QUERY
    SELECT 
        v_registration_id as registrationId,
        v_confirmation_number as confirmationNumber,
        v_customer_id::text as customerId,
        p_square_payment_id as paymentId;
END;
$function$;