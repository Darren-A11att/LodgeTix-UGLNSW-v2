import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
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
      paymentMethodId,
      totalAmount,
      billingDetails
    } = data;
    
    // Add more validation for required data
    if (!paymentMethodId) {
      console.error("Missing payment method ID");
      console.groupEnd();
      return NextResponse.json(
        { error: "Payment method ID is required" },
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
    console.log(`from('registrations').select("*").eq("registration_id", "${registrationId}").single()`);
    
    // Check if registration exists - query with tracing
    console.log("Looking up registration with ID:", registrationId);
    console.log("Executing Supabase query: from('registrations').select('*').eq('registration_id', registrationId).single()");
    
    const adminClient = createAdminClient();
    const { data: existingRegistration, error: findError } = await adminClient
      .from('registrations')
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
    
    let finalPaymentIntentId;
    let requiresAction = false;
    let clientSecret = null;
    
    // Always use two-step flow: create payment intent from payment method
    console.log("💳 Creating payment intent from payment method");
    
    try {
      // Import Stripe dynamically to avoid circular dependencies
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-11-20.acacia',
      });
      
      // Create payment intent with the payment method but don't confirm yet
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'aud',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: false, // Don't confirm immediately
        metadata: {
          registration_id: registrationId,
          created_at: new Date().toISOString(),
        },
      });
      
      console.log("Created payment intent:", paymentIntent.id);
      console.log("Payment intent status:", paymentIntent.status);
      
      // Now confirm the payment intent with return URL for 3D Secure
      const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/events/${existingRegistration.event_id}/confirmation?registration_id=${registrationId}`,
      });
      
      finalPaymentIntentId = confirmedIntent.id;
      
      if (confirmedIntent.status === 'requires_action' || confirmedIntent.status === 'requires_source_action') {
        console.log("🔐 Payment requires additional authentication (3D Secure)");
        requiresAction = true;
        clientSecret = confirmedIntent.client_secret;
      } else if (confirmedIntent.status !== 'succeeded') {
        console.error("Unexpected payment status:", confirmedIntent.status);
        throw new Error(`Payment failed with status: ${confirmedIntent.status}`);
      }
      
    } catch (stripeError: any) {
      console.error("Stripe error:", stripeError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Payment processing failed: ${stripeError.message}` },
        { status: 500 }
      );
    }
    
    // Always use direct update approach (RPC function update_payment_status_and_complete not available)
    const updateData = {
      status: requiresAction ? "pending_payment" : "paid",
      payment_status: requiresAction ? "requires_action" : "completed",
      total_amount_paid: totalAmount,
      stripe_payment_intent_id: finalPaymentIntentId,
      updated_at: new Date().toISOString()
    };
    
    console.log("Update data:", JSON.stringify(updateData, null, 2));
    
    // Update registration record
    console.log("Executing update query: from('registrations').update(updateData).eq('registration_id', registrationId)");
    const { data: updatedRegistration, error: updateError } = await adminClient
      .from('registrations')
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
    
    // Also update related tickets to 'completed' status
    console.log("Updating tickets for registration:", registrationId);
    const { data: updatedTickets, error: ticketUpdateError } = await adminClient
      .from("tickets") 
      .update({ 
        ticket_status: requiresAction ? "pending" : "completed",
        updated_at: new Date().toISOString()
      })
      .eq("registration_id", registrationId)
      .select();
    
    if (ticketUpdateError) {
      console.error("Error updating tickets:", ticketUpdateError);
      console.log("Error details:", JSON.stringify(ticketUpdateError, null, 2));
      // Don't fail the whole request if tickets can't be updated
      // The registration is already marked as paid which is the critical part
    } else {
      console.log(`Successfully updated ${updatedTickets?.length || 0} tickets to completed status`);
    }
    
    // Note: Attendees table doesn't have payment_status column
    // Payment status is tracked at registration level only
    console.log("Payment status updated at registration level (attendees inherit from registration)");
    
    // Note: Stripe FDW verification removed - function doesn't exist in current schema
    console.log("Stripe payment intent created:", finalPaymentIntentId);
    
    console.log("Registration payment updated successfully");
    
    // Generate a confirmation number
    const confirmationNumber = `REG-${registrationId.substring(0, 8).toUpperCase()}`;
    console.log("Generated confirmation number:", confirmationNumber);
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId,
      confirmationNumber,
      registration_data: updatedRegistration,
      requiresAction,
      clientSecret,
      paymentIntentId: finalPaymentIntentId
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
    const adminClient = createAdminClient();
    const { data: existingRegistrationData, error: findError } = await adminClient
      .from('registrations')
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

    // Note: Stripe FDW verification removed - function doesn't exist in current schema
    console.log("Registration found with payment status:", currentRegistration.payment_status);
    console.log("Stripe payment intent ID:", currentRegistration.stripe_payment_intent_id || 'Not set');
    
    console.log("Registration status check complete (GET)");
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId,
      payment_status: currentRegistration.payment_status,
      status: currentRegistration.status,
      stripe_payment_intent_id: currentRegistration.stripe_payment_intent_id,
      total_amount_paid: currentRegistration.total_amount_paid
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