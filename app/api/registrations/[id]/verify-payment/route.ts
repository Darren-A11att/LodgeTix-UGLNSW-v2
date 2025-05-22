import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase-unified";

/**
 * Endpoint to verify a registration payment status directly with Stripe via FDW
 * This checks the current Stripe payment intent status and updates the registration if needed
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;
    console.group("🔍 Verify Registration Payment with Stripe FDW");
    console.log("Registration ID:", registrationId);
    
    // Validate registration ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(registrationId)) {
      console.error(`Invalid registration ID format: ${registrationId}`);
      console.groupEnd();
      return NextResponse.json(
        { error: `Invalid registration ID format. Expected UUID, received: ${registrationId}` },
        { status: 400 }
      );
    }

    // Call the verify_registration_payment function which accesses Stripe FDW
    const { data: verificationResult, error: verificationError } = await getServerClient()
      .rpc('verify_registration_payment', { reg_id: registrationId });
    
    if (verificationError) {
      console.error("Error verifying payment status:", verificationError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to verify payment status: ${verificationError.message}` },
        { status: 500 }
      );
    }
    
    console.log("Payment verification result:", verificationResult);
    console.groupEnd();
    
    return NextResponse.json({
      success: verificationResult.success,
      registrationId,
      verificationResult
    });
    
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to verify payment: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check a registration's payment status from the Stripe FDW
 * This is read-only and won't update the registration
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;
    console.group("🔍 Check Registration Payment with Stripe FDW");
    console.log("Registration ID:", registrationId);
    
    // Get the payment intent ID for this registration
    const { data: registrationData, error: registrationError } = await getServerClient()
      .from("registrations")
      .select("status, payment_status, stripe_payment_intent_id")
      .eq("registration_id", registrationId)
      .single();
    
    if (registrationError) {
      console.error("Error retrieving registration:", registrationError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Registration not found: ${registrationError.message}` },
        { status: 404 }
      );
    }
    
    if (!registrationData.stripe_payment_intent_id) {
      console.log("No payment intent ID associated with this registration");
      console.groupEnd();
      return NextResponse.json({
        success: false,
        registrationId,
        error: "No payment intent associated with this registration"
      });
    }
    
    // Get payment status directly from Stripe via FDW
    const { data: stripeData, error: stripeError } = await getServerClient()
      .rpc('check_payment_intent_status', { 
        payment_intent_id: registrationData.stripe_payment_intent_id 
      });
    
    if (stripeError) {
      console.error("Error checking Stripe payment data:", stripeError);
      console.groupEnd();
      return NextResponse.json(
        { error: `Failed to check Stripe payment: ${stripeError.message}` },
        { status: 500 }
      );
    }
    
    // Check for status mismatch 
    let statusMismatch = false;
    if (stripeData.status === 'succeeded' && registrationData.payment_status !== 'completed') {
      statusMismatch = true;
      console.warn("Warning: Payment is successful in Stripe but not marked complete in database");
    } else if (stripeData.status !== 'succeeded' && registrationData.payment_status === 'completed') {
      statusMismatch = true;
      console.warn("Warning: Payment is marked complete in database but not successful in Stripe");
    }
    
    console.log("Payment verification complete");
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      registrationId,
      registrationStatus: registrationData.status,
      payment_status: registrationData.payment_status, 
      stripe_payment_intent_id: registrationData.stripe_payment_intent_id,
      stripeStatus: stripeData.status,
      stripeData: stripeData,
      statusMismatch,
      needsUpdate: statusMismatch && stripeData.status === 'succeeded'
    });
    
  } catch (error: any) {
    console.error("Error checking payment:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: `Failed to check payment: ${error.message}` },
      { status: 500 }
    );
  }
} 