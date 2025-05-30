import { NextResponse } from "next/server";
import { createAdminClient } from '@/utils/supabase/admin';
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
  try {
    const { id: registrationId } = await params;
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

    const adminClient = createAdminClient();
    
    // First get the registration to check if we have a payment intent
    const { data: registration, error: findError } = await adminClient
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
      apiVersion: '2025-04-30.basil',
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
      const { data: updatedTickets, error: ticketUpdateError } = await adminClient
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
              ticketId: ticket.id,
              registrationId: ticket.registration_id,
              attendeeId: ticket.attendee_id,
              eventId: ticket.event_id,
              ticketType: 'General', // You may need to fetch this from event_tickets
            };
            
            const qrUrl = await qrCodeService.generateAndStore(qrData);
            
            if (qrUrl) {
              // Update ticket with QR code URL
              await adminClient
                .from('tickets')
                .update({ qr_code_url: qrUrl })
                .eq('id', ticket.id);
            }
            
            return qrUrl;
          } catch (error) {
            console.error(`Error generating QR code for ticket ${ticket.id}:`, error);
            return null;
          }
        });
        
        await Promise.all(qrPromises);
        console.log(`Generated QR codes for ${updatedTickets.length} tickets`);
      }
    } else if (paymentIntent.status === 'requires_payment_method') {
      updateData.payment_status = 'failed';
    } else if (paymentIntent.status === 'processing') {
      updateData.payment_status = 'processing';
    } else if (paymentIntent.status === 'requires_action') {
      updateData.payment_status = 'requires_action';
    }
    
    // Update registration
    const { data: updatedRegistration, error: updateError } = await adminClient
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
 * GET endpoint to check a registration's payment status from the Stripe FDW
 * This is read-only and won't update the registration
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    console.group("🔍 Check Registration Payment with Stripe FDW");
    console.log("Registration ID:", registrationId);
    
    // Get the payment intent ID for this registration
    const adminClient = createAdminClient();
    const { data: registrationData, error: registrationError } = await adminClient
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
    const { data: stripeData, error: stripeError } = await adminClient
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