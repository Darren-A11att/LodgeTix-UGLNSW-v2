import { NextResponse } from "next/server";
import { table, supabase } from "@/lib/supabase";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;
    console.group("💲 Update Registration Payment Status");
    console.log("Raw Request URL:", request.url);
    console.log("Registration ID from params:", registrationId);
    
    // Validate registration ID format - should be a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(registrationId)) {
      console.error(`Invalid registration ID format: ${registrationId}`);
      console.error(`Expected UUID format (e.g. '123e4567-e89b-12d3-a456-426614174000')`);
      console.groupEnd();
      return NextResponse.json(
        { error: `Invalid registration ID format. Expected UUID, received: ${registrationId}` },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    console.log("Payment data:", JSON.stringify(data, null, 2));
    
    const {
      paymentIntentId,
      totalAmount,
      status = "paid",
      paymentStatus = "completed",
    } = data;
    
    // Add more validation for required data
    if (!paymentIntentId) {
      console.error("Missing payment intent ID");
      console.groupEnd();
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }
    
    if (typeof totalAmount !== 'number' || totalAmount < 0) {
      console.error(`Invalid totalAmount: ${totalAmount}`);
      console.groupEnd();
      return NextResponse.json(
        { error: "Total amount must be a non-negative number" },
        { status: 400 }
      );
    }
    
    // Log the exact database query we're about to perform for debugging
    console.log("DB Operation: Looking up registration with exact query:");
    console.log(`table("Registrations").select("*").eq("registrationId", "${registrationId}").single()`);
    
    // Check if registration exists - query with tracing
    console.log("Looking up registration with ID:", registrationId);
    console.log("Executing Supabase query using actual schema names: supabase.from(\"Registrations\").select(\"*\").eq(\"registrationId\", registrationId).single()");
    
    const { data: existingRegistration, error: findError } = await supabase
      .from("Registrations")
      .select("*")
      .eq("registrationId", registrationId)
      .single();
    
    if (findError) {
      console.error("Database error when looking for registration:", findError);
      console.log("Error details:", JSON.stringify(findError, null, 2));
      console.log("Hint: Make sure the registration ID exists and matches exactly");
      console.groupEnd();
      return NextResponse.json(
        { error: `Registration not found: ${findError.message}` },
        { status: 404 }
      );
    }
    
    if (!existingRegistration) {
      console.error("Registration not found in database - no error but empty result");
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration not found - record does not exist" },
        { status: 404 }
      );
    }
    
    console.log("Found registration:", JSON.stringify(existingRegistration, null, 2));
    
    // Prepare update data with actual schema column names
    const updateData = {
      status: status,
      paymentStatus: paymentStatus,
      totalAmountPaid: totalAmount,
      stripePaymentIntentId: paymentIntentId,
      updatedAt: new Date().toISOString()
    };
    
    console.log("Update data:", JSON.stringify(updateData, null, 2));
    
    // Update registration record
    console.log("Executing update query using actual schema names: supabase.from(\"Registrations\").update(updateData).eq(\"registrationId\", registrationId)");
    const { data: updatedRegistration, error: updateError } = await supabase
      .from("Registrations")
      .update(updateData)
      .eq("registrationId", registrationId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating registration:", updateError);
      console.log("Error details:", JSON.stringify(updateError, null, 2));
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to update registration: ${updateError.message}` },
        { status: 500 }
      );
    }
    
    // Also update related tickets to 'confirmed' status
    console.log("Updating tickets for registration:", registrationId);
    const { error: ticketUpdateError } = await supabase
      .from("Tickets")
      .update({ 
        status: "confirmed", 
        updatedat: new Date().toISOString() 
      })
      .eq("registrationId", registrationId);
    
    if (ticketUpdateError) {
      console.warn("Error updating tickets:", ticketUpdateError);
      console.log("Error details:", JSON.stringify(ticketUpdateError, null, 2));
      // Continue despite ticket update error
    } else {
      console.log("Tickets updated successfully");
    }
    
    // Also verify payment status using the Stripe FDW
    try {
      console.log("Verifying payment through Stripe FDW...");
      const { data: stripeVerificationData, error: stripeVerificationError } = await supabase
        .rpc('check_payment_intent_status', { payment_intent_id: paymentIntentId });

      if (stripeVerificationError) {
        console.warn("Warning: Unable to verify payment through Stripe FDW:", stripeVerificationError);
      } else {
        console.log("Stripe payment verification result:", stripeVerificationData);
        
        // If Stripe says the payment intent is not succeeded, log a warning
        if (stripeVerificationData && stripeVerificationData.status !== 'succeeded') {
          console.warn(`Warning: Stripe payment status is ${stripeVerificationData.status}, but we're proceeding with the update as requested`);
        }
      }
    } catch (stripeCheckError) {
      console.warn("Warning: Error when checking Stripe payment status:", stripeCheckError);
      // Non-blocking error, we'll continue with the update
    }
    
    console.log("Registration payment updated successfully");
    
    // Generate a confirmation number
    const confirmationNumber = `REG-${registrationId.substring(0, 8).toUpperCase()}`;
    console.log("Generated confirmation number:", confirmationNumber);
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId,
      confirmationNumber,
      registrationData: updatedRegistration
    });
  } catch (error: any) {
    console.error("Error updating registration payment:", error);
    console.log("Error stack:", error.stack);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to update registration payment: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;
    console.group("💲 Check Registration Payment Status");
    console.log("Request URL:", request.url);
    console.log("Registration ID:", registrationId);
    
    // First, check if registration exists
    const { data: existingRegistration, error: findError } = await supabase
      .from("Registrations")
      .select("*")
      .eq("registrationId", registrationId)
      .single();
    
    if (findError) {
      console.error("Database error when checking registration:", findError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Registration not found: ${findError.message}` },
        { status: 404 }
      );
    }
    
    if (!existingRegistration) {
      console.error("Registration not found - no error but empty result");
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration not found - record does not exist" },
        { status: 404 }
      );
    }
    
    console.log("Found registration:", JSON.stringify(existingRegistration, null, 2));
    
    // Use the Stripe FDW to get real-time payment status from Stripe
    let stripePaymentData = null;
    
    if (existingRegistration.stripePaymentIntentId) {
      try {
        console.log("Checking real-time payment status from Stripe FDW...");
        const { data: fdwData, error: fdwError } = await supabase
          .rpc('check_payment_intent_status', { 
            payment_intent_id: existingRegistration.stripePaymentIntentId 
          });
          
        if (fdwError) {
          console.warn("Warning: Unable to check Stripe payment status:", fdwError);
        } else {
          stripePaymentData = fdwData;
          console.log("Real-time Stripe payment data:", stripePaymentData);
          
          // If there's a mismatch between our DB and Stripe, log it
          if (stripePaymentData && 
              ((stripePaymentData.status === 'succeeded' && existingRegistration.paymentStatus !== 'completed') ||
               (stripePaymentData.status !== 'succeeded' && existingRegistration.paymentStatus === 'completed'))) {
            console.warn("Warning: Payment status mismatch between database and Stripe!");
            console.warn(`Database: ${existingRegistration.paymentStatus}, Stripe: ${stripePaymentData.status}`);
          }
        }
      } catch (stripeCheckError) {
        console.warn("Error checking Stripe payment status:", stripeCheckError);
      }
    }
    
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId,
      paymentStatus: existingRegistration.paymentStatus,
      status: existingRegistration.status,
      stripePaymentIntentId: existingRegistration.stripePaymentIntentId,
      // Include the live Stripe payment data if available
      stripePaymentData: stripePaymentData
    });
    
  } catch (error: any) {
    console.error("Error checking registration:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to check registration: ${error.message}` },
      { status: 500 }
    );
  }
} 