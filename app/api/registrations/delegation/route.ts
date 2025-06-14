import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { createClientWithToken } from '@/utils/supabase/server-with-token';
import { captureCompleteDelegationStoreState, storeZustandCaptureInRawRegistrations } from '@/lib/utils/zustand-store-capture';

export async function POST(request: Request) {
  try {
    console.group("📝 Delegation Registration API");
    
    const data = await request.json();
    console.log("Received delegation registration data:", JSON.stringify(data, null, 2));
    
    // Create a client to log raw payload
    const supabaseForLogging = await createClient();
    
    // Log the raw payload to raw_registrations table for debugging
    try {
      const { error: rawError } = await supabaseForLogging
        .from('raw_registrations')
        .insert({
          raw_data: data,
          registration_id: data.registrationId || null, // Include registration_id if provided
          registration_type: 'delegation',
          created_at: new Date().toISOString()
        });
      
      if (rawError) {
        console.error('Error logging raw payload:', rawError);
      } else {
        console.log('Raw payload logged to raw_registrations table with registration_id:', data.registrationId);
      }
    } catch (logError) {
      console.error('Failed to log raw payload:', logError);
    }
    
    // ====== CAPTURE COMPLETE DELEGATION ZUSTAND STORE STATE ======
    try {
      const { 
        completeDelegationZustandStoreState,
        calculatedPricing 
      } = data;
      
      if (completeDelegationZustandStoreState) {
        console.log('🏪 Capturing complete Delegation Zustand store state...');
        
        const delegationStoreCapture = await captureCompleteDelegationStoreState(
          data,
          calculatedPricing || {
            totalAmount: data.totalAmount || 0,
            subtotal: data.subtotal || 0,
            stripeFee: data.stripeFee || 0
          }
        );
        
        const captureResult = await storeZustandCaptureInRawRegistrations(
          supabaseForLogging,
          delegationStoreCapture,
          data.registrationId
        );
        
        if (captureResult.success) {
          console.log(`✅ Complete Delegation Zustand store captured: ${delegationStoreCapture.metadata.field_count} fields`);
        } else {
          console.error('❌ Failed to capture Delegation Zustand store:', captureResult.error);
        }
      } else {
        console.warn('⚠️ No complete Delegation Zustand store state provided - capturing only API payload');
      }
    } catch (storeError) {
      console.error('Failed to capture Delegation Zustand store state:', storeError);
    }
    // ====== END DELEGATION ZUSTAND STORE CAPTURE ======
    
    // Extract the auth token from headers
    const authHeader = request.headers.get('authorization');
    console.log("Auth header present:", !!authHeader);
    
    // Extract data from the request
    const {
      delegates = [], // Array of delegates (including head of delegation)
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
      registrationId = null, // Optional for draft recovery
      delegationDetails = {}  // Contains name, delegationType, grand_lodge_id
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
    
    if (!delegates || delegates.length === 0) {
      console.error("Missing delegates data");
      console.groupEnd();
      return NextResponse.json(
        { error: "At least one delegate is required" },
        { status: 400 }
      );
    }
    
    if (!delegationDetails.name) {
      console.error("Missing delegation name");
      console.groupEnd();
      return NextResponse.json(
        { error: "Delegation name is required" },
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
    
    // Prepare the data for the RPC function
    const rpcData = {
      registrationId: registrationId, // Use provided ID or let RPC generate one
      functionId,
      eventId,
      eventTitle,
      registrationType: 'delegation',
      delegates, // Array of all delegates
      tickets,
      totalAmount,
      subtotal,
      stripeFee,
      paymentIntentId,
      billingDetails,
      delegationDetails,
      agreeToTerms,
      billToPrimaryAttendee,
      authUserId: user.id,
      paymentCompleted: false // Initial registration, not payment completion
    };
    
    console.log("Calling upsert_delegation_registration RPC with data:", JSON.stringify(rpcData, null, 2));
    
    // Log the COMPLETE, ENRICHED delegation registration data
    try {
      const comprehensiveDelegationData = {
        source: 'complete_delegation_server_processed_data',
        timestamp: new Date().toISOString(),
        
        // Original form submission from frontend
        original_form_data: data,
        
        // Complete processed registration data sent to RPC
        processed_registration_data: rpcData,
        
        // Delegation-specific context
        delegation_context: {
          delegation_details: delegationDetails,
          delegates_count: delegates?.length || 0,
          total_amount_paid: totalAmount,
          subtotal: subtotal,
          stripe_fee: stripeFee,
          representative_count: delegationDetails?.representativeCount
        },
        
        // Processing metadata
        processing_context: {
          function_id: functionId,
          event_id: eventId,
          event_title: eventTitle,
          registration_type: 'delegation',
          auth_user_id: user.id,
          validation_passed: true,
          processing_completed_at: new Date().toISOString()
        }
      };

      const { error: comprehensiveError } = await supabaseForLogging
        .from('raw_registrations')
        .insert({
          raw_data: comprehensiveDelegationData,
          registration_id: data.registrationId || null,
          registration_type: 'delegation_complete',
          created_at: new Date().toISOString()
        });
      
      if (comprehensiveError) {
        console.error('Error logging comprehensive delegation data:', comprehensiveError);
      } else {
        console.log('✅ Comprehensive delegation registration data logged');
      }
    } catch (logError) {
      console.error('Failed to log comprehensive delegation data:', logError);
    }
    
    // Call the RPC function
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('upsert_delegation_registration', {
        p_registration_data: rpcData
      });
    
    if (rpcError) {
      console.error("RPC Error:", rpcError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to create delegation registration: ${rpcError.message}` },
        { status: 500 }
      );
    }
    
    if (!rpcResult?.success) {
      console.error("RPC returned unsuccessful result:", rpcResult);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to create delegation registration. Please try again." },
        { status: 500 }
      );
    }
    
    console.log("Delegation registration created successfully:", rpcResult);
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId: rpcResult.registrationId,
      registrationData: {
        registration_id: rpcResult.registrationId,
        customer_id: rpcResult.customerId,
        booking_contact_id: rpcResult.bookingContactId,
        head_delegate_id: rpcResult.headDelegateId,
        delegation_name: rpcResult.delegationName,
        delegation_type: rpcResult.delegationType
      }
    });
    
  } catch (error: any) {
    console.error("Error in delegation registration API:", error);
    console.error("Stack trace:", error.stack);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to process delegation registration: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.group("💲 Update Delegation Registration Payment");
    
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
      confirmationNumber: existingRegistration.confirmation_number,
      subtotal: existingRegistration.subtotal,
      stripeFee: existingRegistration.stripe_fee,
      authUserId: existingRegistration.auth_user_id
    };
    
    console.log("Calling upsert_delegation_registration for payment completion:", rpcData);
    
    // Call RPC to update payment status
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('upsert_delegation_registration', {
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
      console.log("Triggering confirmation number generation after delegation payment completion...");
      
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
            registration_type: 'delegation',
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
            registration_type: 'delegation',
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
        console.log('Edge function invoked successfully after delegation payment:', edgeFunctionData);
      }
    } catch (edgeError) {
      console.error('Failed to invoke edge function after delegation payment:', edgeError);
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
    
    // Fetch from the delegation view (needs to be created)
    const { data: registration, error } = await supabase
      .from('registrations')
      .select(`
        *,
        customers!inner(*),
        attendees(*)
      `)
      .eq('registration_id', registrationId)
      .eq('registration_type', 'delegation')
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