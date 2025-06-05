import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { getQRCodeService } from '@/lib/services/qr-code-service';
import { getPDFService } from '@/lib/services/pdf-service';

/**
 * Endpoint to verify a registration payment status directly with Stripe via FDW
 * This checks the current Stripe payment intent status and updates the registration if needed
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // This is now primarily used as a redirect handler after 3D Secure
  // Convert to GET for redirect handling
  return GET(request, { params });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    console.group("🔍 Verify Registration Payment");
    console.log("Registration ID:", registrationId);
    
    // Check if this is a redirect from 3D Secure
    const url = new URL(request.url);
    const isRedirect = url.searchParams.has('payment_intent') || url.searchParams.has('redirect_status');
    
    if (isRedirect) {
      console.log("3D Secure redirect detected");
      
      // Import redirect function
      const { redirect } = await import('next/navigation');
      
      // Import payment completion service
      const { getPaymentCompletionService } = await import('@/lib/services/payment-completion-service');
      const paymentCompletionService = getPaymentCompletionService();
      
      // Wait for confirmation number
      const result = await paymentCompletionService.waitForConfirmationNumber(registrationId);
      
      if (result.success && result.confirmationNumber) {
        // Get function data to build redirect URL
        const supabase = await createClient();
        const { data: registration } = await supabase
          .from('registrations')
          .select('function_id, registration_type, functions!inner(slug)')
          .eq('registration_id', registrationId)
          .single();
        
        const functionSlug = registration?.functions?.slug || 'functions';
        const registrationType = result.registrationType || registration?.registration_type || 'individuals';
        
        // Redirect to type-specific confirmation page
        console.log(`Redirecting to confirmation page: /functions/${functionSlug}/register/confirmation/${registrationType}/${result.confirmationNumber}`);
        console.groupEnd();
        redirect(`/functions/${functionSlug}/register/confirmation/${registrationType}/${result.confirmationNumber}`);
      } else {
        // Redirect to error page if confirmation number generation failed
        console.error("Failed to get confirmation number:", result.error);
        console.groupEnd();
        redirect(`/functions?error=confirmation_failed`);
      }
    }
    
    // Otherwise, continue with the original API behavior
    console.log("API request mode - checking payment status");
    
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

    const supabase = await createClient();
    
    // First get the registration to check if we have a payment intent
    const { data: registration, error: findError } = await supabase
      .from('registrations')
      .select("*")
      .eq("registration_id", registrationId)
      .single();
    
    if (findError || !registration) {
      console.error("Registration not found:", findError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }
    
    if (!registration.stripe_payment_intent_id) {
      console.error("No payment intent ID found on registration");
      console.groupEnd();
      return NextResponse.json(
        { error: "No payment intent associated with this registration" },
        { status: 400 }
      );
    }
    
    // Import Stripe dynamically
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
    });
    
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      registration.stripe_payment_intent_id
    );
    
    console.log("Payment Intent Status:", paymentIntent.status);
    
    // Update registration based on payment status
    let updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (paymentIntent.status === 'succeeded') {
      updateData.status = 'paid';
      updateData.payment_status = 'completed';
      
      // Also update tickets to completed
      const { data: updatedTickets, error: ticketUpdateError } = await supabase
        .from("tickets") 
        .update({ 
          ticket_status: "completed",
          status: "completed",
          updated_at: new Date().toISOString()
        })
        .eq("registration_id", registrationId)
        .select();
        
      if (ticketUpdateError) {
        console.error("Error updating tickets:", ticketUpdateError);
      } else if (updatedTickets) {
        // Generate QR codes for all tickets
        const qrCodeService = getQRCodeService();
        const qrPromises = updatedTickets.map(async (ticket) => {
          try {
            const qrData = {
              ticketId: ticket_id,
              registrationId: ticket.registration_id,
              attendeeId: ticket.attendee_id,
              eventId: ticket.event_id,
              ticketType: 'General', // You may need to fetch this from event_tickets
            };
            
            const qrUrl = await qrCodeService.generateAndStore(qrData);
            
            if (qrUrl) {
              // Update ticket with QR code URL
              await supabase
                .from('tickets')
                .update({ qr_code_url: qrUrl })
                .eq('ticket_id', ticket.ticket_id);
            }
            
            return qrUrl;
          } catch (error) {
            console.error(`Error generating QR code for ticket ${ticket_id}:`, error);
            return null;
          }
        });
        
        await Promise.all(qrPromises);
        console.log(`Generated QR codes for ${updatedTickets.length} tickets`);
      }
    } else if (paymentIntent.status === 'requires_payment_method') {
      updateData.payment_status = 'failed';
    } else if (paymentIntent.status === 'processing') {
      updateData.payment_status = 'pending';
    } else if (paymentIntent.status === 'requires_action') {
      updateData.payment_status = 'pending';
    }
    
    // Update registration
    const { data: updatedRegistration, error: updateError } = await supabase
      .from('registrations')
      .update(updateData)
      .eq("registration_id", registrationId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating registration:", updateError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to update registration status" },
        { status: 500 }
      );
    }
    
    console.log("Registration payment verified and updated");
    console.groupEnd();
    
    return NextResponse.json({
      success: true,
      paymentStatus: paymentIntent.status,
      registrationStatus: updatedRegistration.status,
      registrationPaymentStatus: updatedRegistration.payment_status
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
 * GET endpoint handles both:
 * 1. 3D Secure redirect from Stripe - redirects to confirmation page
 * 2. API calls to check payment status
 */
async function originalGET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    console.group("🔍 Check Registration Payment with Stripe FDW");
    console.log("Registration ID:", registrationId);
    
    // Get the payment intent ID for this registration
    const supabase = await createClient();
    const { data: registrationData, error: registrationError } = await supabase
      .from('registrations')
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
    const { data: stripeData, error: stripeError } = await supabase
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