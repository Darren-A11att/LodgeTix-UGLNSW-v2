import { NextResponse } from "next/server";
import { table, getServerClient } from "@/lib/supabase-unified";

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
    console.log(`from("Registrations").select("*").eq("registration_id", "${registrationId}").single()`);
    
    // Check if registration exists - query with tracing
    console.log("Looking up registration with ID:", registrationId);
    console.log("Executing Supabase query using actual schema names: supabase.from(\"Registrations\").select(\"*\").eq(\"registrationId\", registrationId).single()");
    
    const { data: existingRegistration, error: findError } = await getServerClient()
      .from("registrations")
      .select("*")
      .eq("registration_id", registrationId)
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
      payment_status: paymentStatus,
      total_amount_paid: totalAmount,
      stripe_payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString()
    };
    
    console.log("Update data:", JSON.stringify(updateData, null, 2));
    
    // Update registration record
    console.log("Executing update query using actual schema names: supabase.from(\"Registrations\").update(updateData).eq(\"registrationId\", registrationId)");
    const { data: updatedRegistration, error: updateError } = await getServerClient()
      .from("registrations")
      .update(updateData)
      .eq("registration_id", registrationId)
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
    // TODO: This section needs review. The link between registrations and tickets is unclear.
    // The previous .eq("registration_id", registrationId) or .eq("registration_id", registrationId) on "Tickets" table is likely incorrect
    // as "Tickets" table does not have a direct registrationId FK according to Tickets.sql.
    // Commenting out this block to prevent errors until the correct linking logic is implemented.
    /*
    console.log("Updating tickets for registration:", registrationId);
    const { error: ticketUpdateError } = await supabase
      .from("tickets") 
      .update({ 
        status: "confirmed", // 'status' is lowercase in Tickets.sql
        updatedat: new Date().toISOString() // 'updatedat' is lowercase in Tickets.sql
      })
      // This .eq() clause needs to use the correct column(s) from "Tickets" that link to a registration
      // For example, if linked via eventid and a specific attendee tied to the registration:
      // .eq("eventid", existingRegistration.event_id) 
      // .eq("attendeeid", existingRegistration.primary_attendee_id) // Assuming primaryAttendeeId is the link
      .eq("some_linking_column_placeholder", registrationId); // Replace with actual logic
    
    if (ticketUpdateError) {
      console.warn("Error updating tickets (logic needs review):", ticketUpdateError);
      console.log("Error details (ticket update):", JSON.stringify(ticketUpdateError, null, 2));
    } else {
      console.log("Tickets update attempted (review logic)");
    }
    */
    
    // Also verify payment status using the Stripe FDW
    try {
      console.log("Verifying payment through Stripe FDW...");
      const { data: stripeVerificationData, error: stripeVerificationError } = await getServerClient()
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
      registration_data: updatedRegistration
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
    const { data: existingRegistrationData, error: findError } = await getServerClient()
      .from("registrations")
      .select("*")
      .eq("registration_id", registrationId)
      .single();
    
    if (findError) {
      console.error("Database error when looking for registration (GET):", findError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Registration not found: ${findError.message}` },
        { status: 404 }
      );
    }

    if (!existingRegistrationData) {
      console.error("Registration not found in database (GET) - no error but empty result");
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration not found - record does not exist (GET)" },
        { status: 404 }
      );
    }
    
    console.log("Found registration (GET):", JSON.stringify(existingRegistrationData, null, 2));

    // Store the fetched registration data to use its fields
    const currentRegistration = existingRegistrationData;

    // Verify payment through Stripe FDW
    let stripePaymentData = null;
    if (currentRegistration && currentRegistration.stripe_payment_intent_id) {
      console.log("Verifying payment through Stripe FDW for intent:", currentRegistration.stripe_payment_intent_id);
      const { data: fdwData, error: fdwError } = await getServerClient()
        .rpc('check_payment_intent_status', { payment_intent_id: currentRegistration.stripe_payment_intent_id });

      if (fdwError) {
        console.warn("Warning: Unable to verify payment through Stripe FDW (GET):", fdwError);
      } else {
        stripePaymentData = fdwData;
        console.log("Stripe payment verification result (GET):", stripePaymentData);
        
        // If there's a mismatch between our DB and Stripe, log it
        if (stripePaymentData && 
           ((stripePaymentData.status === 'succeeded' && currentRegistration.payment_status !== 'completed') ||
            (stripePaymentData.status !== 'succeeded' && currentRegistration.payment_status === 'completed'))) {
          console.warn("Warning: Payment status mismatch between database and Stripe! (GET)");
          console.warn(`Database: ${currentRegistration.payment_status}, Stripe: ${stripePaymentData.status}`);
        }
      }
    } else {
      console.log("No Stripe payment intent ID found on registration or registration not found (GET). Skipping Stripe FDW check.");
    }
    
    console.log("Registration status check complete (GET)");
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId,
      payment_status: currentRegistration.payment_status,
      status: currentRegistration.status,
      stripe_payment_intent_id: currentRegistration.stripe_payment_intent_id,
      stripePaymentData: stripePaymentData
    });
  } catch (error: any) {
    console.error("Error checking registration payment status (GET):", error);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to check registration: ${error.message}` },
      { status: 500 }
    );
  }
} 