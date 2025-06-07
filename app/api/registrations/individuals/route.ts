import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { createClientWithToken } from '@/utils/supabase/server-with-token';
import { captureCompleteRegistrationStoreState, storeZustandCaptureInRawRegistrations } from '@/lib/utils/zustand-store-capture';

export async function POST(request: Request) {
  try {
    console.group("📝 Individuals Registration API");
    
    const data = await request.json();
    console.log("Received registration data:", JSON.stringify(data, null, 2));
    
    // Create a client to log raw payload
    const supabaseForLogging = await createClient();
    
    // Log the initial form data to raw_registrations table for debugging (frontend submission)
    try {
      const { error: rawError } = await supabaseForLogging
        .from('raw_registrations')
        .insert({
          raw_data: {
            source: 'frontend_form_submission',
            timestamp: new Date().toISOString(),
            form_data: data,
            note: 'Initial form data before server-side processing and enrichment'
          },
          registration_id: data.registrationId || null,
          registration_type: 'individuals_frontend',
          created_at: new Date().toISOString()
        });
      
      if (rawError) {
        console.error('Error logging frontend form data:', rawError);
      } else {
        console.log('Frontend form data logged to raw_registrations table');
      }
    } catch (logError) {
      console.error('Failed to log frontend form data:', logError);
    }
    
    // ====== CAPTURE COMPLETE ZUSTAND STORE STATE ======
    // This captures the complete registration store state for 100% data fidelity
    try {
      const { 
        completeZustandStoreState,
        calculatedPricing 
      } = data;
      
      if (completeZustandStoreState) {
        console.log('🏪 Capturing complete Zustand registration store state...');
        
        const storeCapture = await captureCompleteRegistrationStoreState(
          data,
          calculatedPricing || {
            totalAmount: data.totalAmount || 0,
            subtotal: data.subtotal || 0,
            stripeFee: data.stripeFee || 0
          }
        );
        
        const captureResult = await storeZustandCaptureInRawRegistrations(
          supabaseForLogging,
          storeCapture,
          data.registrationId
        );
        
        if (captureResult.success) {
          console.log(`✅ Complete Zustand store captured: ${storeCapture.metadata.field_count} fields`);
        } else {
          console.error('❌ Failed to capture Zustand store:', captureResult.error);
        }
      } else {
        console.warn('⚠️ No complete Zustand store state provided - capturing only API payload');
      }
    } catch (storeError) {
      console.error('Failed to capture Zustand store state:', storeError);
      // Don't fail the entire request for store capture issues
    }
    // ====== END ZUSTAND STORE CAPTURE ======
    
    // Extract the auth token from headers
    const authHeader = request.headers.get('authorization');
    console.log("Auth header present:", !!authHeader);
    
    // Extract data from the request
    const {
      primaryAttendee,
      additionalAttendees = [],
      tickets = [],
      totalAmount = 0,
      subtotal = 0,
      stripeFee = 0,
      paymentIntentId = null,
      billingDetails,
      eventId,
      functionId,
      customerId,
      billToPrimaryAttendee = false,
      agreeToTerms = true,
      registrationId = null // Optional for draft recovery
    } = data;
    
    // Validate required fields
    if (!customerId) {
      console.error("CRITICAL: customerId (auth.uid()) not provided");
      console.groupEnd();
      return NextResponse.json(
        { error: "User authentication token not provided or invalid." },
        { status: 401 }
      );
    }
    
    if (!functionId) {
      console.error("Missing function ID");
      console.groupEnd();
      return NextResponse.json(
        { error: "Function ID is required for registration" },
        { status: 400 }
      );
    }
    
    if (!primaryAttendee) {
      console.error("Missing primary attendee data");
      console.groupEnd();
      return NextResponse.json(
        { error: "Primary attendee data is required" },
        { status: 400 }
      );
    }
    
    if (!billingDetails || !billingDetails.emailAddress || !billingDetails.firstName || !billingDetails.lastName) {
      console.error("Missing or incomplete billing details");
      console.groupEnd();
      return NextResponse.json(
        { error: "Complete billing details are required" },
        { status: 400 }
      );
    }
    
    // Validate event ID if provided
    let finalEventId = eventId;
    let eventTitle = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (finalEventId && !uuidRegex.test(finalEventId)) {
      console.error(`Invalid event ID format: ${finalEventId}`);
      console.groupEnd();
      return NextResponse.json(
        { error: "Invalid event ID format. Must be a valid UUID." },
        { status: 400 }
      );
    }
    
    // Authenticate user
    let user = null;
    let supabase = null;
    
    // Try auth header first
    if (authHeader) {
      console.log("Attempting authentication with Authorization header");
      try {
        const result = await createClientWithToken(authHeader);
        supabase = result.supabase;
        user = result.user;
        console.log("Successfully authenticated with Authorization header:", user.id);
      } catch (headerAuthError) {
        console.log("Authorization header auth failed:", headerAuthError);
      }
    }
    
    // Fall back to cookie auth
    if (!user) {
      console.log("Attempting cookie-based authentication");
      supabase = await createClient();
      
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      console.log("Cookie auth result:", { user: cookieUser?.id, error: authError?.message });
      
      if (!authError && cookieUser) {
        user = cookieUser;
      }
    }
    
    // Verify authentication
    if (!user) {
      console.error("Authentication failed: No valid session found");
      console.groupEnd();
      return NextResponse.json(
        { error: "User not authenticated. Please refresh the page and try again." },
        { status: 401 }
      );
    }
    
    // Verify customer ID matches authenticated user
    if (user.id !== customerId) {
      console.error("Customer ID mismatch:", { userId: user.id, customerId });
      console.groupEnd();
      return NextResponse.json(
        { error: "Authentication mismatch. Please refresh the page and try again." },
        { status: 403 }
      );
    }
    
    // Get event title if eventId provided
    if (finalEventId) {
      try {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('title')
          .eq('event_id', finalEventId)
          .single();
          
        if (!eventError && eventData) {
          eventTitle = eventData.title;
          console.log(`Found event title: ${eventTitle}`);
        }
      } catch (error) {
        console.log("Could not fetch event title, continuing without it");
      }
    }
    
    // Prepare the data for the RPC function
    const rpcData = {
      registrationId: registrationId, // Use provided ID or let RPC generate one
      functionId,
      eventId: finalEventId,
      eventTitle,
      registrationType: 'individuals',
      primaryAttendee,
      additionalAttendees,
      tickets,
      totalAmount,
      subtotal,
      stripeFee,
      paymentIntentId,
      billingDetails,
      agreeToTerms,
      billToPrimaryAttendee,
      authUserId: user.id,
      paymentCompleted: false // Initial registration, not payment completion
    };
    
    console.log("Calling upsert_individual_registration RPC with data:", JSON.stringify(rpcData, null, 2));
    
    // Log the COMPLETE, ENRICHED registration data (this is what we really want for debugging)
    try {
      const comprehensiveRegistrationData = {
        source: 'complete_server_processed_data',
        timestamp: new Date().toISOString(),
        
        // Original form submission from frontend
        original_form_data: data,
        
        // Complete processed registration data sent to RPC
        processed_registration_data: rpcData,
        
        // Additional context and metadata
        processing_context: {
          auth_user_id: user.id,
          is_anonymous_user: user.is_anonymous || false,
          user_email: user.email,
          function_context: {
            function_id: functionId,
            event_id: finalEventId,
            event_title: eventTitle
          },
          validation_passed: true,
          processing_completed_at: new Date().toISOString()
        },
        
        // Data comparison for gap analysis
        data_gaps_analysis: {
          frontend_fields_count: data ? Object.keys(data).length : 0,
          processed_fields_count: rpcData ? Object.keys(rpcData).length : 0,
          ticket_count: rpcData.tickets?.length || 0,
          attendee_count: (rpcData.primaryAttendee ? 1 : 0) + (rpcData.additionalAttendees?.length || 0),
          has_pricing_data: (rpcData.totalAmount > 0 || rpcData.subtotal > 0),
          has_fee_calculation: rpcData.stripeFee > 0,
          note: 'This record contains both original form data and complete processed data for comprehensive analysis'
        }
      };

      const { error: comprehensiveError } = await supabaseForLogging
        .from('raw_registrations')
        .insert({
          raw_data: comprehensiveRegistrationData,
          registration_id: data.registrationId || null,
          registration_type: 'individuals_complete',
          created_at: new Date().toISOString()
        });
      
      if (comprehensiveError) {
        console.error('Error logging comprehensive registration data:', comprehensiveError);
      } else {
        console.log('✅ Comprehensive registration data logged with pricing, fees, and complete attendee details');
      }
    } catch (logError) {
      console.error('Failed to log comprehensive registration data:', logError);
    }
    
    // Call the RPC function
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('upsert_individual_registration', {
        p_registration_data: rpcData
      });
    
    if (rpcError) {
      console.error("RPC Error:", rpcError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to create registration: ${rpcError.message}` },
        { status: 500 }
      );
    }
    
    if (!rpcResult?.success) {
      console.error("RPC returned unsuccessful result:", rpcResult);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to create registration. Please try again." },
        { status: 500 }
      );
    }
    
    console.log("Individual registration created successfully:", rpcResult);
    
    const finalRegistrationId = rpcResult?.registrationId || rpcResult?.registration_id;
    let confirmationNumber = rpcResult?.confirmationNumber || rpcResult?.confirmation_number;
    
    // Log the FINAL RESULT data with all generated IDs and confirmation details
    try {
      // Get customer record to capture complete customer data
      let customerRecord = null;
      try {
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('customer_id', user.id)
          .single();
          
        if (!customerError && customer) {
          customerRecord = customer;
        }
      } catch (error) {
        console.log('Could not fetch customer record for logging');
      }

      const finalResultData = {
        source: 'final_registration_result',
        timestamp: new Date().toISOString(),
        
        // Complete RPC result
        rpc_result: rpcResult,
        
        // Generated IDs and confirmation data
        generated_data: {
          final_registration_id: finalRegistrationId,
          confirmation_number: confirmationNumber,
          customer_id: user.id,
          function_id: functionId,
          event_id: finalEventId
        },
        
        // Complete customer record (what actually gets stored in database)
        customer_record: customerRecord,
        
        // Success metrics
        processing_summary: {
          registration_successful: !!rpcResult?.success,
          confirmation_generated: !!confirmationNumber,
          registration_id_generated: !!finalRegistrationId,
          customer_authenticated: !!user.id,
          total_amount_processed: rpcData.totalAmount,
          tickets_processed: rpcData.tickets?.length || 0,
          attendees_processed: (rpcData.primaryAttendee ? 1 : 0) + (rpcData.additionalAttendees?.length || 0)
        }
      };

      const { error: finalError } = await supabaseForLogging
        .from('raw_registrations')
        .insert({
          raw_data: finalResultData,
          registration_id: finalRegistrationId,
          registration_type: 'individuals_final_result',
          created_at: new Date().toISOString()
        });
      
      if (finalError) {
        console.error('Error logging final result data:', finalError);
      } else {
        console.log('✅ Final registration result logged with all generated IDs and customer data');
      }
    } catch (logError) {
      console.error('Failed to log final result data:', logError);
    }
    
    // Update raw_registrations with the final registration_id if it wasn't provided initially
    if (!registrationId && finalRegistrationId) {
      try {
        const { error: updateError } = await supabaseForLogging
          .from('raw_registrations')
          .update({ registration_id: finalRegistrationId })
          .eq('raw_data->customerId', customerId)
          .is('registration_id', null)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (updateError) {
          console.error('Error updating raw_registrations with registration_id:', updateError);
        } else {
          console.log('Updated raw_registrations with final registration_id:', finalRegistrationId);
        }
      } catch (error) {
        console.error('Failed to update raw_registrations:', error);
      }
    }
    
    // Generate confirmation number if payment was provided
    if (paymentIntentId && !confirmationNumber) {
      console.log("Triggering confirmation number generation...");
      
      try {
        // Invoke the confirmation generation edge function
        const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('generate-confirmation', {
          body: {
            type: 'UPDATE',
            table: 'registrations',
            schema: 'public',
            record: {
              id: finalRegistrationId,
              registration_id: finalRegistrationId,
              status: 'completed',
              payment_status: 'completed',
              confirmation_number: null,
              registration_type: 'individuals',
              function_id: functionId,
              customer_id: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            old_record: {
              id: finalRegistrationId,
              registration_id: finalRegistrationId,
              status: 'pending',
              payment_status: 'pending',
              confirmation_number: null,
              registration_type: 'individuals',
              function_id: functionId,
              customer_id: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
        });

        if (edgeFunctionError) {
          console.error('Edge function error:', edgeFunctionError);
        } else {
          console.log('Edge function invoked successfully:', edgeFunctionData);
        }
      } catch (edgeError) {
        console.error('Failed to invoke edge function:', edgeError);
      }
      
      // Poll for confirmation number after triggering edge function
      console.log("Polling for confirmation number...");
      
      const maxPolls = 5;
      const pollInterval = 3000; // 3 seconds
      
      for (let i = 0; i < maxPolls; i++) {
        // Wait for poll interval (except on first iteration)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        
        console.log(`Poll attempt ${i + 1}/${maxPolls}`);
        
        // Query the confirmation view
        const { data: confirmationData, error: confirmationError } = await supabase
          .from('individuals_registration_confirmation_view')
          .select('confirmation_number')
          .eq('registration_id', finalRegistrationId)
          .single();
        
        if (confirmationData?.confirmation_number) {
          confirmationNumber = confirmationData.confirmation_number;
          console.log('Confirmation number found:', confirmationNumber);
          break;
        }
        
        if (confirmationError && confirmationError.code !== 'PGRST116') {
          console.error('Error polling for confirmation:', confirmationError);
        }
      }
      
      // If no confirmation number after polling, return error
      if (!confirmationNumber) {
        console.error('Confirmation number generation timeout');
        console.groupEnd();
        return NextResponse.json(
          { 
            error: 'Confirmation number generation timeout. Registration was successful but confirmation is pending.',
            registrationId: finalRegistrationId
          },
          { status: 500 }
        );
      }
    }
    
    // Fetch the complete registration data from the view
    const { data: registrationView, error: viewError } = await supabase
      .from('individuals_registration_complete_view')
      .select('*')
      .eq('registration_id', finalRegistrationId)
      .single();
    
    if (viewError) {
      console.warn("Could not fetch registration view:", viewError);
      // Don't fail the request, just log the warning
    } else {
      console.log("Registration view data:", {
        attendees: registrationView?.attendees?.length || 0,
        tickets: registrationView?.total_tickets || 0,
        contacts: registrationView?.total_contacts_created || 0
      });
    }
    
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId: finalRegistrationId,
      confirmationNumber: confirmationNumber,
      registrationData: {
        registration_id: finalRegistrationId,
        customer_id: rpcResult?.customerId || rpcResult?.customer_id,
        booking_contact_id: rpcResult?.bookingContactId || rpcResult?.booking_contact_id,
        primary_attendee_id: rpcResult?.primaryAttendeeId || rpcResult?.primary_attendee_id
      }
    });
    
  } catch (error: any) {
    console.error("Error in individuals registration API:", error);
    console.error("Stack trace:", error.stack);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to process registration: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.group("💲 Update Individuals Registration Payment");
    
    const data = await request.json();
    const { registrationId, paymentIntentId, totalAmountPaid } = data;
    
    if (!registrationId) {
      console.error("Missing registration ID");
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration ID is required" },
        { status: 400 }
      );
    }
    
    // Validate registration ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(registrationId)) {
      console.error(`Invalid registration ID format: ${registrationId}`);
      console.groupEnd();
      return NextResponse.json(
        { error: "Invalid registration ID format" },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Fetch existing registration
    const { data: existingRegistration, error: fetchError } = await supabase
      .from('registrations')
      .select('*')
      .eq('registration_id', registrationId)
      .single();
    
    if (fetchError || !existingRegistration) {
      console.error("Registration not found:", fetchError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }
    
    // Prepare payment completion data
    const rpcData = {
      registrationId,
      functionId: existingRegistration.function_id,
      totalAmountPaid,
      paymentIntentId,
      paymentCompleted: true,
      paymentStatus: 'completed', // Set payment_status to completed
      status: 'completed', // Set overall status to completed to trigger edge function
      confirmationNumber: existingRegistration.confirmation_number,
      subtotal: existingRegistration.subtotal,
      stripeFee: existingRegistration.stripe_fee,
      authUserId: existingRegistration.auth_user_id
    };
    
    console.log("Calling upsert_individual_registration for payment completion:", rpcData);
    
    // Call RPC to update payment status
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('upsert_individual_registration', {
        p_registration_data: rpcData
      });
    
    if (rpcError) {
      console.error("RPC Error during payment update:", rpcError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to update payment: ${rpcError.message}` },
        { status: 500 }
      );
    }
    
    console.log("Payment updated successfully:", rpcResult);
    
    // Generate confirmation number after successful payment
    try {
      console.log("Triggering confirmation number generation after payment completion...");
      
      // Invoke the confirmation generation edge function
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('generate-confirmation', {
        body: {
          type: 'UPDATE',
          table: 'registrations',
          schema: 'public',
          record: {
            id: registrationId,
            registration_id: registrationId,
            status: 'completed',
            payment_status: 'completed',
            confirmation_number: null,
            registration_type: 'individuals',
            function_id: existingRegistration.function_id,
            customer_id: existingRegistration.auth_user_id || '',
            created_at: existingRegistration.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          old_record: {
            id: registrationId,
            registration_id: registrationId,
            status: 'pending',
            payment_status: 'pending',
            confirmation_number: null,
            registration_type: 'individuals',
            function_id: existingRegistration.function_id,
            customer_id: existingRegistration.auth_user_id || '',
            created_at: existingRegistration.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
      });

      if (edgeFunctionError) {
        console.error('Edge function error:', edgeFunctionError);
      } else {
        console.log('Edge function invoked successfully after payment:', edgeFunctionData);
      }
    } catch (edgeError) {
      console.error('Failed to invoke edge function after payment:', edgeError);
    }
    
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId
    });
    
  } catch (error: any) {
    console.error("Error updating payment:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to update payment: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registrationId');
    
    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required" },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Fetch from the comprehensive view
    const { data: registration, error } = await supabase
      .from('individuals_registration_complete_view')
      .select('*')
      .eq('registration_id', registrationId)
      .single();
    
    if (error) {
      console.error("Error fetching registration:", error);
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      registration
    });
    
  } catch (error: any) {
    console.error("Error fetching registration:", error);
    return NextResponse.json(
      { error: `Failed to fetch registration: ${error.message}` },
      { status: 500 }
    );
  }
}