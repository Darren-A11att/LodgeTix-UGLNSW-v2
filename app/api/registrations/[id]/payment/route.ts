/**
 * Square Payment Route
 * 
 * This route has been updated to use Square instead of Stripe:
 * - No longer updates registration status (webhook handles this)
 * - No redundant callbacks to registration-specific endpoints
 * - Only handles payment creation/confirmation
 * - Uses unified Square payment service for consistency
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { unifiedSquarePaymentService } from '@/lib/services/unified-square-payment-service';


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("💳 Payment Intent Creation/Confirmation");
    
    const registrationId = (await params).id;
    const data = await request.json();
    
    console.log("Request data:", {
      registrationId,
      createNewIntent: data.createNewIntent,
      paymentIntentId: data.paymentIntentId,
      sessionId: data.sessionId
    });
    
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
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Verify user owns this registration
    const { data: existingRegistration, error: fetchError } = await supabase
      .from("registrations")
      .select("*")
      .eq("registration_id", registrationId)
      .single();
    
    if (fetchError || !existingRegistration) {
      console.error("Registration not found:", fetchError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }
    
    if (existingRegistration.auth_user_id !== user.id) {
      console.error("User does not own this registration");
      console.groupEnd();
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Check if already paid
    if (existingRegistration.status === "completed" || existingRegistration.payment_status === "completed") {
      console.error("Registration already paid");
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration has already been paid" },
        { status: 400 }
      );
    }
    
    let finalPaymentIntentId = data.paymentIntentId;
    let requiresAction = false;
    let clientSecret = null;
    
    // Create new Square payment
    if (data.createNewIntent || !data.paymentId) {
      console.log("Creating new Square payment using unified Square payment service");
      
      // Extract billing details
      const billingDetails = data.billingDetails || {
        name: data.cardholderName || `${existingRegistration.billing_first_name} ${existingRegistration.billing_last_name}`,
        email: existingRegistration.billing_email,
        phone: existingRegistration.billing_phone,
        address: {
          line1: existingRegistration.billing_address,
          city: existingRegistration.billing_city,
          state: existingRegistration.billing_state,
          postal_code: existingRegistration.billing_postal_code,
          country: data.billingCountry || existingRegistration.billing_country || 'AU'
        }
      };
      
      try {
        const paymentResponse = await unifiedSquarePaymentService.createPaymentIntent({
          registrationId,
          paymentMethodId: data.paymentMethodId, // Square nonce or token
          billingDetails,
          sessionId: data.sessionId,
          referrer: data.referrer
        });
        
        finalPaymentIntentId = paymentResponse.paymentId;
        
        console.log("Square payment created successfully:", {
          paymentId: finalPaymentIntentId,
          totalAmount: paymentResponse.totalAmount,
          processingFees: paymentResponse.processingFees,
          subtotal: paymentResponse.subtotal,
          status: paymentResponse.status
        });
        
      } catch (error: any) {
        console.error("Error creating Square payment:", error);
        console.groupEnd();
        return NextResponse.json(
          { error: error.message || "Failed to create Square payment" },
          { status: 500 }
        );
      }
    }
    
    // Note: Square payments are processed immediately, no separate confirmation step needed
    if (data.paymentId && !data.createNewIntent) {
      console.log("Square payment already processed, no further action needed");
      finalPaymentIntentId = data.paymentId;
    }
    
    // IMPORTANT: NO STATUS UPDATES HERE
    // The webhook will handle all status updates to ensure single source of truth
    
    console.log("Payment processing completed without status updates");
    console.groupEnd();
    
    // Return response
    return NextResponse.json({
      success: true,
      paymentId: finalPaymentIntentId,
      registrationId
    });
    
  } catch (error: any) {
    console.error("Unexpected error in payment route:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}