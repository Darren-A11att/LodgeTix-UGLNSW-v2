import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { createClientWithToken } from '@/utils/supabase/server-with-token';
import { 
  captureCompleteRegistrationStoreState, 
  captureCompleteLodgeStoreState,
  captureCompleteDelegationStoreState,
  storeZustandCaptureInRawRegistrations 
} from '@/lib/utils/zustand-store-capture';

/**
 * Enhanced Individuals Registration API
 * 
 * This endpoint has been enhanced to handle ALL registration types:
 * - individuals (original functionality)
 * - lodge (no attendees, organization-level purchase)
 * - delegation (two branches: tickets only or full registration)
 * 
 * It maintains the existing direct edge function invocation pattern
 * and comprehensive Zustand store capture for all types.
 */

export async function POST(request: Request) {
  try {
    console.group("📝 Enhanced Registration API (All Types)");
    
    const data = await request.json();
    console.log("Received registration data type:", data.registrationType || 'individuals');
    
    // Detect registration type from payload
    const registrationType = data.registrationType || 'individuals';
    console.log(`Processing ${registrationType} registration`);
    
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
            registration_type: registrationType,
            note: `Initial ${registrationType} form data before server-side processing`
          },
          registration_id: data.registrationId || null,
          registration_type: `${registrationType}_frontend`,
          created_at: new Date().toISOString()
        });
      
      if (rawError) {
        console.error('Error logging frontend form data:', rawError);
      } else {
        console.log(`Frontend ${registrationType} form data logged to raw_registrations table`);
      }
    } catch (logError) {
      console.error('Failed to log frontend form data:', logError);
    }
    
    // ====== CAPTURE COMPLETE ZUSTAND STORE STATE ======
    // This captures the complete registration store state for 100% data fidelity
    try {
      const { 
        completeZustandStoreState,
        completeLodgeZustandStoreState,
        completeDelegationZustandStoreState,
        calculatedPricing 
      } = data;
      
      let storeCapture = null;
      
      // Branch based on registration type for store capture
      switch (registrationType) {
        case 'individuals':
          if (completeZustandStoreState) {
            console.log('🏪 Capturing complete Individual Zustand registration store state...');
            storeCapture = await captureCompleteRegistrationStoreState(
              data,
              calculatedPricing || {
                totalAmount: data.totalAmount || 0,
                subtotal: data.subtotal || 0,
                stripeFee: data.stripeFee || 0
              }
            );
          }
          break;
          
        case 'lodge':
          if (completeLodgeZustandStoreState) {
            console.log('🏪 Capturing complete Lodge Zustand registration store state...');
            storeCapture = await captureCompleteLodgeStoreState(
              data,
              calculatedPricing || {
                totalAmount: data.totalAmount || 0,
                subtotal: data.subtotal || 0,
                stripeFee: data.stripeFee || 0
              }
            );
          }
          break;
          
        case 'delegation':
          if (completeDelegationZustandStoreState) {
            console.log('🏪 Capturing complete Delegation Zustand registration store state...');
            storeCapture = await captureCompleteDelegationStoreState(
              data,
              calculatedPricing || {
                totalAmount: data.totalAmount || 0,
                subtotal: data.subtotal || 0,
                stripeFee: data.stripeFee || 0
              }
            );
          }
          break;
      }
      
      if (storeCapture) {
        const captureResult = await storeZustandCaptureInRawRegistrations(
          supabaseForLogging,
          storeCapture,
          data.registrationId
        );
        
        if (captureResult.success) {
          console.log(`✅ Complete ${registrationType} Zustand store captured: ${storeCapture.metadata.field_count} fields`);
        } else {
          console.error(`❌ Failed to capture ${registrationType} Zustand store:`, captureResult.error);
        }
      } else {
        console.warn(`⚠️ No complete ${registrationType} Zustand store state provided - capturing only API payload`);
      }
    } catch (storeError) {
      console.error('Failed to capture Zustand store state:', storeError);
      // Don't fail the entire request for store capture issues
    }
    // ====== END ZUSTAND STORE CAPTURE ======
    
    // Extract the auth token from headers
    const authHeader = request.headers.get('authorization');
    console.log("Auth header present:", !!authHeader);
    
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
    
    // Handle authentication - support both authenticated and anonymous users
    const isAnonymousRegistration = !user;
    
    if (isAnonymousRegistration) {
      console.log("Processing anonymous registration (no authenticated user)");
    } else {
      console.log("Processing authenticated registration for user:", user.id);
    }
    
    // Extract common data
    const {
      customerId,
      functionId,
      eventId,
      totalAmount = 0,
      subtotal = 0,
      stripeFee = 0,
      paymentIntentId = null,
      billingDetails,
      agreeToTerms = true,
      registrationId = null // Optional for draft recovery
    } = data;
    
    // Verify customer ID matches authenticated user (only for authenticated registrations)
    if (!isAnonymousRegistration && user.id !== customerId) {
      console.error("Customer ID mismatch:", { userId: user.id, customerId });
      console.groupEnd();
      return NextResponse.json(
        { error: "Authentication mismatch. Please refresh the page and try again." },
        { status: 403 }
      );
    }
    
    // For anonymous registrations, we'll generate a customer ID in the database function
    if (isAnonymousRegistration) {
      console.log("Anonymous registration - customer ID will be generated by database function");
    }
    
    // Validate function ID
    if (!functionId) {
      console.error("Missing function ID");
      console.groupEnd();
      return NextResponse.json(
        { error: "Function ID is required for registration" },
        { status: 400 }
      );
    }
    
    // Get event title if eventId provided
    let eventTitle = null;
    if (eventId) {
      try {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('title')
          .eq('event_id', eventId)
          .single();
          
        if (!eventError && eventData) {
          eventTitle = eventData.title;
          console.log(`Found event title: ${eventTitle}`);
        }
      } catch (error) {
        console.log("Could not fetch event title, continuing without it");
      }
    }
    
    // ====== BRANCH BASED ON REGISTRATION TYPE ======
    let rpcResult = null;
    let rpcError = null;
    
    switch (registrationType) {
      case 'individuals': {
        // Extract individual-specific data
        const {
          primaryAttendee,
          additionalAttendees = [],
          tickets = [],
          billToPrimaryAttendee = false,
        } = data;
        
        // Validate required fields
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
        
        console.group("🔧 INDIVIDUALS REGISTRATION API DEBUGGING");
        console.log("📥 API received data:", {
          subtotal,
          totalAmount,
          stripeFee,
          ticketsCount: tickets.length,
          attendeesCount: [primaryAttendee, ...additionalAttendees].length,
          functionId,
          registrationId
        });
        console.log("🎫 API received tickets:", tickets.map(t => ({
          attendeeId: t.attendeeId,
          ticketTypeId: t.ticketTypeId,
          price: t.price,
          isFromPackage: t.isFromPackage
        })));
        console.log("👥 API received attendees:", [primaryAttendee, ...additionalAttendees].map(a => ({
          firstName: a.firstName,
          lastName: a.lastName,
          isPrimary: a.isPrimary,
          attendeeId: a.attendeeId
        })));
        
        // Prepare the data for the RPC function
        const rpcData = {
          registrationId,
          functionId,
          eventId,
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
          paymentCompleted: false
        };
        
        console.log("📤 Calling upsert_individual_registration RPC with params:", {
          p_function_id: functionId,
          p_attendees_count: [primaryAttendee, ...additionalAttendees].length,
          p_selected_tickets_count: tickets.length,
          p_total_amount: totalAmount,
          p_subtotal: subtotal,
          p_stripe_fee: stripeFee,
          p_auth_user_id: user?.id || null
        });
        
        // Call the RPC function with multiple parameters
        const result = await supabase.rpc('upsert_individual_registration', {
          p_function_id: functionId,
          p_attendees: [primaryAttendee, ...additionalAttendees],
          p_selected_tickets: tickets,
          p_booking_contact: billingDetails,
          p_payment_status: 'pending',
          p_stripe_payment_intent_id: paymentIntentId,
          p_registration_id: registrationId,
          p_total_amount: totalAmount,
          p_subtotal: subtotal,
          p_stripe_fee: stripeFee,
          p_auth_user_id: user?.id || null, // Pass user ID if authenticated, null for anonymous
          p_metadata: {
            source: 'individuals-registration-api',
            created_at: new Date().toISOString()
          }
        });
        
        console.log("🔄 RPC function result:", result);
        console.groupEnd();
        
        rpcResult = result.data;
        rpcError = result.error;
        break;
      }
      
      case 'lodge': {
        // Extract lodge-specific data
        const {
          lodgeDetails,
          tickets = [],
          tableCount = 0,
        } = data;
        
        // Validate lodge details
        if (!lodgeDetails || !lodgeDetails.lodgeId) {
          console.error("Missing lodge details");
          console.groupEnd();
          return NextResponse.json(
            { error: "Lodge details are required" },
            { status: 400 }
          );
        }
        
        if (!billingDetails || !billingDetails.emailAddress) {
          console.error("Missing billing details for lodge");
          console.groupEnd();
          return NextResponse.json(
            { error: "Billing details are required" },
            { status: 400 }
          );
        }
        
        // Prepare lodge data (NO attendees array)
        const lodgeData = {
          registrationId,
          functionId,
          eventId,
          eventTitle,
          registrationType: 'lodge',
          lodgeDetails,
          tickets,
          tableCount,
          totalAmount,
          subtotal,
          stripeFee,
          paymentIntentId,
          billingDetails,
          agreeToTerms,
          authUserId: user.id,
          paymentCompleted: false
        };
        
        console.log("Calling upsert_lodge_registration RPC");
        
        const result = await supabase.rpc('upsert_lodge_registration', {
          p_registration_data: lodgeData
        });
        
        rpcResult = result.data;
        rpcError = result.error;
        break;
      }
      
      case 'delegation': {
        // Extract delegation-specific data
        const {
          delegationInfo,
          bookingContact,
          attendees = [],
          tickets = [],
        } = data;
        
        // Determine which branch based on attendees
        const hasDelegates = attendees && attendees.length > 0;
        
        // Validate delegation info
        if (!delegationInfo || !delegationInfo.name) {
          console.error("Missing delegation info");
          console.groupEnd();
          return NextResponse.json(
            { error: "Delegation information is required" },
            { status: 400 }
          );
        }
        
        if (!bookingContact || !bookingContact.emailAddress) {
          console.error("Missing booking contact");
          console.groupEnd();
          return NextResponse.json(
            { error: "Booking contact is required" },
            { status: 400 }
          );
        }
        
        // Prepare delegation data
        const delegationData = {
          registrationId,
          functionId,
          eventId,
          eventTitle,
          registrationType: 'delegation',
          delegationInfo,
          bookingContact,
          attendees: hasDelegates ? attendees : [], // Empty array for tickets-only
          tickets,
          totalAmount,
          subtotal,
          stripeFee,
          paymentIntentId,
          billingDetails: billingDetails || bookingContact, // Use booking contact as billing if not provided
          agreeToTerms,
          authUserId: user.id,
          paymentCompleted: false,
          isBulkTicketPurchase: !hasDelegates // Flag for tickets-only branch
        };
        
        console.log(`Calling upsert_delegation_registration RPC (${hasDelegates ? 'with attendees' : 'tickets only'})`);
        
        const result = await supabase.rpc('upsert_delegation_registration', {
          p_registration_data: delegationData
        });
        
        rpcResult = result.data;
        rpcError = result.error;
        break;
      }
      
      default:
        console.error("Invalid registration type:", registrationType);
        console.groupEnd();
        return NextResponse.json(
          { error: "Invalid registration type" },
          { status: 400 }
        );
    }
    
    // Handle RPC errors
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
    
    console.log(`${registrationType} registration created successfully:`, rpcResult);
    
    const finalRegistrationId = rpcResult?.registrationId || rpcResult?.registration_id;
    let confirmationNumber = rpcResult?.confirmationNumber || rpcResult?.confirmation_number;
    
    // Log the FINAL RESULT data
    try {
      const finalResultData = {
        source: 'final_registration_result',
        timestamp: new Date().toISOString(),
        registration_type: registrationType,
        rpc_result: rpcResult,
        generated_data: {
          final_registration_id: finalRegistrationId,
          confirmation_number: confirmationNumber,
          customer_id: user.id,
          function_id: functionId,
          event_id: eventId
        },
        processing_summary: {
          registration_successful: !!rpcResult?.success,
          confirmation_generated: !!confirmationNumber,
          registration_id_generated: !!finalRegistrationId,
          customer_authenticated: !!user.id,
          total_amount_processed: totalAmount,
          tickets_processed: data.tickets?.length || 0
        }
      };

      const { error: finalError } = await supabaseForLogging
        .from('raw_registrations')
        .insert({
          raw_data: finalResultData,
          registration_id: finalRegistrationId,
          registration_type: `${registrationType}_final_result`,
          created_at: new Date().toISOString()
        });
      
      if (finalError) {
        console.error('Error logging final result data:', finalError);
      } else {
        console.log(`✅ Final ${registrationType} registration result logged`);
      }
    } catch (logError) {
      console.error('Failed to log final result data:', logError);
    }
    
    // Generate confirmation number if payment was provided
    if (paymentIntentId && !confirmationNumber) {
      console.log("Triggering confirmation number generation...");
      
      try {
        // Invoke the confirmation generation edge function with type-specific data
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
              registration_type: registrationType, // Pass the actual registration type
              function_id: functionId,
              customer_id: user.id || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            old_record: {
              id: finalRegistrationId,
              registration_id: finalRegistrationId,
              status: 'pending',
              payment_status: 'pending',
              confirmation_number: null,
              registration_type: registrationType,
              function_id: functionId,
              customer_id: user.id || '',
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
        
        // Query the appropriate confirmation view based on type
        const viewName = registrationType === 'lodge' ? 
          'lodge_registration_confirmation_view' : 
          registrationType === 'delegation' ?
          'delegation_registration_confirmation_view' :
          'individuals_registration_confirmation_view';
          
        const { data: confirmationData, error: confirmationError } = await supabase
          .from(viewName)
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
    
    console.groupEnd();
    
    // Return consistent response for all types
    return NextResponse.json({
      success: true,
      registrationId: finalRegistrationId,
      registrationType,
      confirmationNumber: confirmationNumber,
      registrationData: {
        registration_id: finalRegistrationId,
        customer_id: rpcResult?.customerId || rpcResult?.customer_id,
        booking_contact_id: rpcResult?.bookingContactId || rpcResult?.booking_contact_id,
        primary_attendee_id: rpcResult?.primaryAttendeeId || rpcResult?.primary_attendee_id
      }
    });
    
  } catch (error: any) {
    console.error(`Error in enhanced registration API:`, error);
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
    console.group("💲 Update Registration Payment (All Types)");
    
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
    
    const registrationType = existingRegistration.registration_type;
    console.log(`Processing payment update for ${registrationType} registration`);
    
    // Branch based on registration type
    let rpcResult = null;
    let rpcError = null;
    
    switch (registrationType) {
      case 'individuals': {
        // Prepare payment completion data
        const rpcData = {
          registrationId,
          functionId: existingRegistration.function_id,
          totalAmountPaid,
          paymentIntentId,
          paymentCompleted: true,
          paymentStatus: 'completed',
          status: 'completed',
          confirmationNumber: existingRegistration.confirmation_number,
          subtotal: existingRegistration.subtotal,
          stripeFee: existingRegistration.stripe_fee,
          authUserId: existingRegistration.auth_user_id
        };
        
        console.log("Calling upsert_individual_registration for payment completion");
        
        const result = await supabase.rpc('upsert_individual_registration', {
          p_function_id: existingRegistration.function_id,
          p_attendees: [], // Empty for payment completion
          p_selected_tickets: [], // Empty for payment completion
          p_booking_contact: {}, // Empty for payment completion
          p_payment_status: 'completed',
          p_stripe_payment_intent_id: paymentIntentId,
          p_registration_id: registrationId,
          p_total_amount: totalAmountPaid,
          p_subtotal: existingRegistration.subtotal || 0,
          p_stripe_fee: existingRegistration.stripe_fee || 0,
          p_auth_user_id: existingRegistration.auth_user_id, // Use existing auth_user_id for payment completion
          p_metadata: {
            source: 'payment-completion',
            created_at: new Date().toISOString()
          }
        });
        
        rpcResult = result.data;
        rpcError = result.error;
        break;
      }
      
      case 'lodge': {
        // Prepare lodge payment completion data
        const rpcData = {
          registrationId,
          functionId: existingRegistration.function_id,
          totalAmountPaid,
          paymentIntentId,
          paymentCompleted: true,
          paymentStatus: 'completed',
          status: 'completed',
          authUserId: existingRegistration.auth_user_id
        };
        
        console.log("Calling upsert_lodge_registration for payment completion");
        
        const result = await supabase.rpc('upsert_lodge_registration', {
          p_registration_data: rpcData
        });
        
        rpcResult = result.data;
        rpcError = result.error;
        break;
      }
      
      case 'delegation': {
        // Prepare delegation payment completion data
        const rpcData = {
          registrationId,
          functionId: existingRegistration.function_id,
          totalAmountPaid,
          paymentIntentId,
          paymentCompleted: true,
          paymentStatus: 'completed',
          status: 'completed',
          authUserId: existingRegistration.auth_user_id
        };
        
        console.log("Calling upsert_delegation_registration for payment completion");
        
        const result = await supabase.rpc('upsert_delegation_registration', {
          p_registration_data: rpcData
        });
        
        rpcResult = result.data;
        rpcError = result.error;
        break;
      }
      
      default:
        console.error("Unknown registration type:", registrationType);
        console.groupEnd();
        return NextResponse.json(
          { error: "Unknown registration type" },
          { status: 400 }
        );
    }
    
    if (rpcError) {
      console.error("RPC Error during payment update:", rpcError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to update payment: ${rpcError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Payment updated successfully for ${registrationType}:`, rpcResult);
    
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
            registration_type: registrationType,
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
            registration_type: registrationType,
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
      registrationId,
      registrationType
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
    
    // First get the registration to determine type
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('registration_type')
      .eq('registration_id', registrationId)
      .single();
      
    if (regError || !registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }
    
    // Use appropriate view based on type
    const viewName = registration.registration_type === 'lodge' ? 
      'lodge_registration_complete_view' : 
      registration.registration_type === 'delegation' ?
      'delegation_registration_complete_view' :
      'individuals_registration_complete_view';
    
    // Fetch from the comprehensive view
    const { data: registrationData, error } = await supabase
      .from(viewName)
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
      registration: registrationData,
      registrationType: registration.registration_type
    });
    
  } catch (error: any) {
    console.error("Error fetching registration:", error);
    return NextResponse.json(
      { error: `Failed to fetch registration: ${error.message}` },
      { status: 500 }
    );
  }
}