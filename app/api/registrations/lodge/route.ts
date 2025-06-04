import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { createClientWithToken } from '@/utils/supabase/server-with-token';

export async function POST(request: Request) {
  try {
    console.group("🏛️ Lodge Registration API");
    
    const data = await request.json();
    console.log("Received lodge registration data:", JSON.stringify(data, null, 2));
    
    // Store the raw payload data for tracking
    const rawPayloadData = {
      endpoint: '/api/registrations/lodge',
      method: 'POST',
      timestamp: new Date().toISOString(),
      payload: data
    };
    
    // Extract the auth token from headers
    const authHeader = request.headers.get('authorization');
    console.log("Auth header present:", !!authHeader);
    
    // Extract data from the request
    const {
      functionId,
      packageId,
      tableCount = 1,
      lodgeDetails,
      billingDetails,
      totalAmount = 0,
      subtotal = 0,
      stripeFee = 0,
      paymentIntentId = null,
      customerId,
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
    
    if (!packageId) {
      console.error("Missing package ID");
      console.groupEnd();
      return NextResponse.json(
        { error: "Package ID is required for lodge registration" },
        { status: 400 }
      );
    }
    
    if (!lodgeDetails || !lodgeDetails.lodgeName || !lodgeDetails.lodge_id) {
      console.error("Missing or incomplete lodge details");
      console.groupEnd();
      return NextResponse.json(
        { error: "Complete lodge details are required" },
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
    
    // Save raw payload to raw_payloads table
    console.log("Saving raw payload to tracking table");
    const { error: payloadError } = await supabase
      .from('raw_payloads')
      .insert([
        { 
          raw_data: rawPayloadData,
          created_at: new Date().toISOString()
        }
      ]);
    
    if (payloadError) {
      console.error('Error inserting raw payload data:', payloadError);
      // Don't fail the request, just log the error
    } else {
      console.log('Raw payload data saved successfully');
    }
    
    // Prepare booking contact data
    const bookingContact = {
      email: billingDetails.emailAddress,
      firstName: billingDetails.firstName,
      lastName: billingDetails.lastName,
      title: billingDetails.title,
      mobile: billingDetails.mobileNumber,
      phone: billingDetails.phone,
      addressLine1: billingDetails.addressLine1,
      addressLine2: billingDetails.addressLine2,
      suburb: billingDetails.suburb,
      postcode: billingDetails.postcode,
      stateTerritory: billingDetails.stateTerritory,
      country: billingDetails.country || { code: 'AU', name: 'Australia' },
      businessName: lodgeDetails.lodgeName,
      dietaryRequirements: billingDetails.dietaryRequirements,
      additionalInfo: billingDetails.specialNeeds
    };
    
    // Prepare RPC payload
    const rpcPayload = {
      p_function_id: functionId,
      p_package_id: packageId,
      p_table_count: tableCount,
      p_booking_contact: bookingContact,
      p_lodge_details: lodgeDetails,
      p_payment_status: 'pending',
      p_stripe_payment_intent_id: paymentIntentId,
      p_registration_id: registrationId,
      p_total_amount: totalAmount,
      p_subtotal: subtotal,
      p_stripe_fee: stripeFee,
      p_metadata: {
        agreeToTerms,
        createdVia: 'lodge_registration_api'
      }
    };
    
    console.log("Calling upsert_lodge_registration RPC with data:", rpcPayload);
    
    // Save RPC payload to raw_payloads table
    const { error: rpcPayloadError } = await supabase
      .from('raw_payloads')
      .insert([
        { 
          raw_data: {
            endpoint: '/api/registrations/lodge',
            method: 'RPC:upsert_lodge_registration',
            timestamp: new Date().toISOString(),
            payload: rpcPayload
          },
          created_at: new Date().toISOString()
        }
      ]);
    
    if (rpcPayloadError) {
      console.error('Error inserting RPC payload data:', rpcPayloadError);
    }
    
    // Call the RPC function
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('upsert_lodge_registration', rpcPayload);
    
    if (rpcError) {
      console.error("RPC Error:", rpcError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to create lodge registration: ${rpcError.message}` },
        { status: 500 }
      );
    }
    
    if (!rpcResult?.success) {
      console.error("RPC returned unsuccessful result:", rpcResult);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to create lodge registration. Please try again." },
        { status: 500 }
      );
    }
    
    console.log("Lodge registration created successfully:", rpcResult);
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId: rpcResult.registrationId,
      confirmationNumber: rpcResult.confirmationNumber,
      registrationData: {
        registration_id: rpcResult.registrationId,
        confirmation_number: rpcResult.confirmationNumber,
        customer_id: rpcResult.customerId,
        organisation_name: rpcResult.organisationName,
        table_count: rpcResult.tableCount,
        total_attendees: rpcResult.totalAttendees
      }
    });
    
  } catch (error: any) {
    console.error("Error in lodge registration API:", error);
    console.error("Stack trace:", error.stack);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to process lodge registration: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.group("💲 Update Lodge Registration Payment");
    
    const data = await request.json();
    const { registrationId, paymentIntentId, totalAmountPaid } = data;
    
    // Store the raw payload data for tracking
    const rawPayloadData = {
      endpoint: '/api/registrations/lodge',
      method: 'PUT',
      timestamp: new Date().toISOString(),
      payload: data
    };
    
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
    
    // Save raw payload to raw_payloads table
    console.log("Saving raw payload to tracking table");
    const { error: payloadError } = await supabase
      .from('raw_payloads')
      .insert([
        { 
          raw_data: rawPayloadData,
          created_at: new Date().toISOString()
        }
      ]);
    
    if (payloadError) {
      console.error('Error inserting raw payload data:', payloadError);
    } else {
      console.log('Raw payload data saved successfully');
    }
    
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
    
    console.log("Calling upsert_lodge_registration for payment completion");
    
    // Prepare RPC payload for update
    const rpcUpdatePayload = {
      p_function_id: existingRegistration.function_id,
      p_package_id: null, // Not needed for updates
      p_table_count: 1, // Not needed for updates
      p_booking_contact: {}, // Not needed for updates
      p_lodge_details: {}, // Not needed for updates
      p_payment_status: 'completed',
      p_stripe_payment_intent_id: paymentIntentId,
      p_registration_id: registrationId,
      p_total_amount: totalAmountPaid,
      p_subtotal: existingRegistration.subtotal,
      p_stripe_fee: existingRegistration.stripe_fee,
      p_metadata: null
    };
    
    // Save RPC payload to raw_payloads table
    const { error: rpcPayloadError } = await supabase
      .from('raw_payloads')
      .insert([
        { 
          raw_data: {
            endpoint: '/api/registrations/lodge',
            method: 'RPC:upsert_lodge_registration_update',
            timestamp: new Date().toISOString(),
            payload: rpcUpdatePayload
          },
          created_at: new Date().toISOString()
        }
      ]);
    
    if (rpcPayloadError) {
      console.error('Error inserting RPC update payload data:', rpcPayloadError);
    }
    
    // Call RPC to update payment status
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('upsert_lodge_registration', rpcUpdatePayload);
    
    if (rpcError) {
      console.error("RPC Error during payment update:", rpcError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to update payment: ${rpcError.message}` },
        { status: 500 }
      );
    }
    
    console.log("Payment updated successfully:", rpcResult);
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId,
      confirmationNumber: existingRegistration.confirmation_number
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
    
    // Fetch registration with customer details
    const { data: registration, error } = await supabase
      .from('registrations')
      .select(`
        *,
        customers (
          customer_id,
          email,
          first_name,
          last_name,
          phone,
          business_name,
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          country
        )
      `)
      .eq('registration_id', registrationId)
      .eq('registration_type', 'lodge')
      .single();
    
    if (error) {
      console.error("Error fetching lodge registration:", error);
      return NextResponse.json(
        { error: "Lodge registration not found" },
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