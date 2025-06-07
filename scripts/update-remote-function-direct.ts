#!/usr/bin/env node

/**
 * Update the RPC function on remote database using direct SQL execution
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://pwwpcjbbxotmiqrisjvf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateRPCFunction() {
  try {
    console.log('🔧 Creating the corrected RPC function on remote database...');
    
    // Execute the corrected RPC function directly
    const { data, error } = await supabase.rpc('query', {
      query: `
CREATE OR REPLACE FUNCTION "public"."upsert_individual_registration"("p_registration_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_registration_id uuid;
    v_booking_contact_id uuid;
    v_customer_id uuid;
    v_function_id uuid;
    v_primary_attendee_id uuid;
    v_attendee_id uuid;
    v_contact_id uuid;
    v_attendee jsonb;
    v_ticket jsonb;
    v_confirmation_number text;
    v_result jsonb;
    v_payment_status text;
    v_attendee_type text;
    v_contact_preference text;
    v_attendee_email text;
    v_attendee_phone text;
    v_raw_data_id uuid;
    v_organisation_id uuid;
    v_status text;
    v_attendee_ticket_map jsonb := '{}';
    v_ticket_event_id uuid;
BEGIN
    -- Extract registration ID
    v_registration_id := COALESCE((p_registration_data->>'registrationId')::uuid, gen_random_uuid());
    
    -- Extract required fields with proper type casting
    v_customer_id := (p_registration_data->>'authUserId')::uuid;
    v_function_id := (p_registration_data->>'functionId')::uuid;
    
    -- Extract organisation_id from primary attendee if they are a Mason
    IF p_registration_data->'primaryAttendee' IS NOT NULL AND 
       LOWER(p_registration_data->'primaryAttendee'->>'attendeeType') = 'mason' THEN
        v_organisation_id := (p_registration_data->'primaryAttendee'->>'lodgeOrganisationId')::uuid;
    END IF;
    
    -- Validate required fields
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer ID (authUserId) is required';
    END IF;
    
    IF v_function_id IS NULL THEN
        RAISE EXCEPTION 'Function ID is required';
    END IF;
    
    -- Extract payment status
    v_payment_status := COALESCE(p_registration_data->>'paymentStatus', 'pending');
    
    -- Generate confirmation number if not provided
    v_confirmation_number := COALESCE(
        p_registration_data->>'confirmationNumber',
        'IND-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0')
    );
    
    -- Upsert customer record
    INSERT INTO customers (
        customer_id,
        first_name,
        last_name,
        email,
        phone,
        customer_type,
        auth_user_id,
        created_at,
        updated_at
    ) VALUES (
        v_customer_id,
        COALESCE(p_registration_data->'billingDetails'->>'firstName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'lastName', ''),
        COALESCE(p_registration_data->'billingDetails'->>'emailAddress', ''),
        COALESCE(p_registration_data->'billingDetails'->>'mobileNumber', ''),
        'booking_contact'::customer_type,
        v_customer_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Use customer_id as booking_contact_id since it references customers table
    v_booking_contact_id := v_customer_id;
    
    -- Upsert registration with organisation_id
    INSERT INTO registrations (
        registration_id,
        customer_id,
        auth_user_id,
        function_id,
        registration_type,
        confirmation_number,
        payment_status,
        total_amount_paid,
        subtotal,
        stripe_fee,
        stripe_payment_intent_id,
        registration_data,
        organisation_id,
        booking_contact_id,
        created_at,
        updated_at
    ) VALUES (
        v_registration_id,
        v_customer_id,
        v_customer_id,
        v_function_id,
        'individuals'::registration_type,
        v_confirmation_number,
        v_payment_status::payment_status,
        COALESCE((p_registration_data->>'totalAmount')::decimal, 0),
        COALESCE((p_registration_data->>'subtotal')::decimal, 0),
        COALESCE((p_registration_data->>'stripeFee')::decimal, 0),
        p_registration_data->>'paymentIntentId',
        p_registration_data,
        v_organisation_id,
        v_booking_contact_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (registration_id) DO UPDATE SET
        payment_status = EXCLUDED.payment_status,
        total_amount_paid = EXCLUDED.total_amount_paid,
        subtotal = EXCLUDED.subtotal,
        stripe_fee = EXCLUDED.stripe_fee,
        stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
        registration_data = EXCLUDED.registration_data,
        organisation_id = COALESCE(EXCLUDED.organisation_id, registrations.organisation_id),
        updated_at = CURRENT_TIMESTAMP;
    
    -- Process primary attendee (NO RELATIONSHIP MAPPING - SET TO NULL)
    IF p_registration_data->'primaryAttendee' IS NOT NULL THEN
        v_attendee := p_registration_data->'primaryAttendee';
        v_primary_attendee_id := gen_random_uuid();
        
        -- Get attendee type with proper case handling
        v_attendee_type := LOWER(COALESCE(v_attendee->>'attendeeType', 'guest'));
        v_contact_preference := LOWER(COALESCE(v_attendee->>'contactPreference', 'directly'));
        
        -- Extract email and phone with proper field mapping
        v_attendee_email := COALESCE(
            v_attendee->>'email',
            v_attendee->>'primaryEmail',
            p_registration_data->'billingDetails'->>'emailAddress',
            p_registration_data->'billingDetails'->>'email'
        );
        
        v_attendee_phone := COALESCE(
            v_attendee->>'mobileNumber',
            v_attendee->>'phone',
            v_attendee->>'primaryPhone',
            p_registration_data->'billingDetails'->>'mobileNumber',
            p_registration_data->'billingDetails'->>'phone'
        );
        
        -- Insert primary attendee WITHOUT relationships (set to NULL)
        INSERT INTO attendees (
            attendee_id,
            registration_id,
            attendee_type,
            is_primary,
            related_attendee_id,
            first_name,
            last_name,
            title,
            suffix_1,
            suffix_2,
            suffix_3,
            dietary_requirements,
            special_needs,
            contact_preference,
            primary_email,
            primary_phone,
            attendee_data,
            created_at,
            updated_at
        ) VALUES (
            v_primary_attendee_id,
            v_registration_id,
            v_attendee_type::attendee_type,
            true,
            NULL, -- Always NULL - no relationship validation
            v_attendee->>'firstName',
            v_attendee->>'lastName',
            v_attendee->>'title',
            v_attendee->>'suffix1',
            v_attendee->>'suffix2',
            v_attendee->>'suffix3',
            v_attendee->>'dietaryRequirements',
            v_attendee->>'specialNeeds',
            v_contact_preference::attendee_contact_preference,
            v_attendee_email,
            v_attendee_phone,
            v_attendee,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        -- Add to attendee mapping for tickets
        v_attendee_ticket_map := jsonb_set(
            v_attendee_ticket_map, 
            ARRAY[v_attendee->>'attendeeId'], 
            to_jsonb(v_primary_attendee_id::text)
        );
    END IF;
    
    -- Process additional attendees (NO RELATIONSHIP MAPPING - SET TO NULL)
    IF p_registration_data->'additionalAttendees' IS NOT NULL THEN
        FOR v_attendee IN SELECT * FROM jsonb_array_elements(p_registration_data->'additionalAttendees')
        LOOP
            v_attendee_id := gen_random_uuid();
            
            v_attendee_type := LOWER(COALESCE(v_attendee->>'attendeeType', 'guest'));
            v_contact_preference := LOWER(COALESCE(v_attendee->>'contactPreference', 'directly'));
            
            -- Extract email and phone
            v_attendee_email := COALESCE(
                v_attendee->>'email',
                v_attendee->>'primaryEmail'
            );
            
            v_attendee_phone := COALESCE(
                v_attendee->>'mobileNumber',
                v_attendee->>'phone',
                v_attendee->>'primaryPhone'
            );
            
            -- Insert additional attendee WITHOUT relationships (set to NULL)
            INSERT INTO attendees (
                attendee_id,
                registration_id,
                attendee_type,
                is_primary,
                related_attendee_id,
                first_name,
                last_name,
                title,
                suffix_1,
                suffix_2,
                suffix_3,
                dietary_requirements,
                special_needs,
                contact_preference,
                primary_email,
                primary_phone,
                attendee_data,
                created_at,
                updated_at
            ) VALUES (
                v_attendee_id,
                v_registration_id,
                v_attendee_type::attendee_type,
                false,
                NULL, -- Always NULL - no relationship validation
                v_attendee->>'firstName',
                v_attendee->>'lastName',
                v_attendee->>'title',
                v_attendee->>'suffix1',
                v_attendee->>'suffix2',
                v_attendee->>'suffix3',
                v_attendee->>'dietaryRequirements',
                v_attendee->>'specialNeeds',
                v_contact_preference::attendee_contact_preference,
                v_attendee_email,
                v_attendee_phone,
                v_attendee,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
            
            -- Add to attendee mapping for tickets
            v_attendee_ticket_map := jsonb_set(
                v_attendee_ticket_map, 
                ARRAY[v_attendee->>'attendeeId'], 
                to_jsonb(v_attendee_id::text)
            );
        END LOOP;
    END IF;
    
    -- Process tickets (existing ticket processing logic remains the same)
    IF p_registration_data->'tickets' IS NOT NULL THEN
        FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_registration_data->'tickets')
        LOOP
            -- Map frontend attendee ID to database attendee ID
            v_attendee_id := (v_attendee_ticket_map->>v_ticket->>'attendeeId')::uuid;
            
            -- Look up event_id from event_tickets table
            v_ticket_event_id := NULL;
            IF v_ticket->>'eventTicketId' IS NOT NULL THEN
                SELECT event_id INTO v_ticket_event_id
                FROM event_tickets
                WHERE event_ticket_id = (v_ticket->>'eventTicketId')::uuid;
            END IF;
            
            INSERT INTO tickets (
                ticket_id,
                attendee_id,
                event_id,
                ticket_type_id,
                package_id,
                price_paid,
                original_price,
                registration_id,
                status,
                payment_status,
                is_partner_ticket,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_attendee_id,
                COALESCE(v_ticket_event_id, (v_ticket->>'eventId')::uuid),
                (v_ticket->>'ticketTypeId')::uuid,
                CASE 
                    WHEN v_ticket->>'packageId' IS NOT NULL AND v_ticket->>'packageId' != 'null'
                    THEN (v_ticket->>'packageId')::uuid 
                    ELSE NULL 
                END,
                COALESCE((v_ticket->>'price')::numeric, 0),
                COALESCE((v_ticket->>'price')::numeric, 0),
                v_registration_id,
                'Active',
                CASE 
                    WHEN v_payment_status = 'completed' THEN 'Paid'
                    ELSE 'Unpaid'
                END,
                COALESCE((v_ticket->>'isPartnerTicket')::boolean, false),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END IF;
    
    -- Return success result
    RETURN jsonb_build_object(
        'success', true,
        'registrationId', v_registration_id,
        'customerId', v_customer_id,
        'bookingContactId', v_booking_contact_id,
        'primaryAttendeeId', v_primary_attendee_id,
        'confirmationNumber', v_confirmation_number
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Individual registration failed: %', SQLERRM;
END;
$$;
      `
    });
    
    if (error) {
      console.error('❌ Error updating RPC function:', error);
      throw error;
    }
    
    console.log('✅ RPC function updated successfully');
    
    // Test the function with a simple call
    console.log('🧪 Testing updated RPC function...');
    
    // Create anonymous session for testing
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    
    const testPayload = {
      authUserId: authData.user.id,
      functionId: 'eebddef5-6833-43e3-8d32-700508b1c089',
      registrationId: crypto.randomUUID(),
      primaryAttendee: {
        attendeeId: crypto.randomUUID(),
        firstName: 'Test',
        lastName: 'User',
        attendeeType: 'guest',
        isPrimary: true,
        email: 'test@example.com',
        mobileNumber: '0123456789'
      },
      billingDetails: {
        firstName: 'Test',
        lastName: 'User',
        emailAddress: 'test@example.com',
        mobileNumber: '0123456789'
      },
      paymentStatus: 'pending',
      totalAmount: 100.00,
      subtotal: 90.00,
      stripeFee: 10.00
    };
    
    const { data: testResult, error: testError } = await supabase.rpc('upsert_individual_registration', {
      p_registration_data: testPayload
    });
    
    if (testError) {
      console.error('❌ RPC function test failed:', testError);
      throw testError;
    }
    
    console.log('✅ RPC function test passed:', testResult);
    console.log('🎉 Remote database RPC function is now working!');
    
  } catch (error: any) {
    console.error('💥 Failed to update RPC function:', error.message);
    process.exit(1);
  }
}

updateRPCFunction();