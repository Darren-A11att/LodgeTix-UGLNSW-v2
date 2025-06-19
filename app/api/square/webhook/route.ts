import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getPaymentConfig } from '@/lib/config/payment';
import { calculateSquareFees } from '@/lib/utils/square-fee-calculator';
import crypto from 'crypto';

// Square webhook event types
interface SquareWebhookEvent {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object: any;
  };
}

interface SquarePayment {
  id: string;
  status: 'APPROVED' | 'PENDING' | 'COMPLETED' | 'CANCELED' | 'FAILED';
  amount_money: {
    amount: number;
    currency: string;
  };
  location_id: string;
  reference_id?: string; // This should contain our registration ID
  buyer_email_address?: string;
  created_at: string;
  updated_at: string;
  receipt_number?: string;
  receipt_url?: string;
}

/**
 * Verify Square webhook signature
 */
function verifySquareWebhookSignature(
  body: string,
  signature: string,
  url: string,
  notificationUrl: string,
  webhookSignatureKey: string
): boolean {
  try {
    // Square webhook signature verification
    // https://developer.squareup.com/docs/webhooks/step3verify
    
    // Combine the request body with the notification URL
    const payload = notificationUrl + body;
    
    // Create HMAC using the webhook signature key
    const hmac = crypto.createHmac('sha1', webhookSignatureKey);
    hmac.update(payload, 'utf8');
    const expectedSignature = hmac.digest('base64');
    
    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  } catch (error) {
    console.error('Square webhook signature verification error:', error);
    return false;
  }
}

/**
 * Convert Square amount (cents) to dollars
 */
function convertSquareAmountToDollars(amountInCents: number): number {
  return Number((amountInCents / 100).toFixed(2));
}

export async function POST(request: NextRequest) {
  console.group("🟦 Square Webhook Handler");
  
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-square-signature');
    const url = request.url;
    
    if (!signature) {
      console.error("No Square signature found in headers");
      console.groupEnd();
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }
    
    // Get Square webhook configuration
    const config = getPaymentConfig();
    const webhookSignatureKey = config.square?.webhookSignatureKey;
    
    if (!webhookSignatureKey) {
      console.error("Square webhook signature key not configured");
      console.groupEnd();
      return NextResponse.json(
        { error: 'Webhook signature key not configured' },
        { status: 500 }
      );
    }
    
    // Verify webhook signature
    const notificationUrl = url; // Use the full request URL
    const isValidSignature = verifySquareWebhookSignature(
      body,
      signature,
      url,
      notificationUrl,
      webhookSignatureKey
    );
    
    if (!isValidSignature) {
      console.error("Square webhook signature verification failed");
      console.groupEnd();
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
    
    // Parse webhook event
    let event: SquareWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error("Failed to parse webhook body:", err);
      console.groupEnd();
      return NextResponse.json(
        { error: 'Invalid JSON in webhook body' },
        { status: 400 }
      );
    }
    
    console.log("Square webhook event type:", event.type);
    console.log("Event ID:", event.event_id);
    console.log("Merchant ID:", event.merchant_id);
    
    // Handle different Square webhook event types
    switch (event.type) {
      case 'payment.updated':
        await handlePaymentUpdated(event.data.object as SquarePayment);
        break;
        
      case 'payment.created':
        await handlePaymentCreated(event.data.object as SquarePayment);
        break;
        
      default:
        console.log(`Unhandled Square event type: ${event.type}`);
    }
    
    console.groupEnd();
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error("Square webhook handler error:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle Square payment.updated event - This is the main success handler
 */
async function handlePaymentUpdated(payment: SquarePayment) {
  console.log("💰 Square Payment Updated:", payment.id);
  console.log("Status:", payment.status);
  console.log("Amount:", convertSquareAmountToDollars(payment.amount_money.amount), payment.amount_money.currency);
  
  // Only process successful payments
  if (payment.status === 'COMPLETED' || payment.status === 'APPROVED') {
    await handlePaymentSuccess(payment);
  } else if (payment.status === 'FAILED' || payment.status === 'CANCELED') {
    await handlePaymentFailed(payment);
  } else {
    console.log(`Payment status ${payment.status} - no action required`);
  }
}

/**
 * Handle Square payment.created event - Usually for tracking
 */
async function handlePaymentCreated(payment: SquarePayment) {
  console.log("🆕 Square Payment Created:", payment.id);
  console.log("Status:", payment.status);
  console.log("Amount:", convertSquareAmountToDollars(payment.amount_money.amount), payment.amount_money.currency);
  
  // If the payment is already completed at creation (which can happen with Square)
  if (payment.status === 'COMPLETED' || payment.status === 'APPROVED') {
    await handlePaymentSuccess(payment);
  }
}

/**
 * Enhanced payment success handler - Single source of truth for Square payment completion
 */
async function handlePaymentSuccess(payment: SquarePayment) {
  console.log("✅ Square Payment Success:", payment.id);
  
  // Extract registration ID from reference_id
  const registrationId = payment.reference_id;
  
  if (!registrationId) {
    console.error("No registration ID found in Square payment reference_id");
    return;
  }
  
  console.log(`Processing Square payment for registration: ${registrationId}`);
  
  const supabase = await createClient();
  
  // Get current registration data for fee calculation
  const { data: registration, error: fetchError } = await supabase
    .from('registrations')
    .select('subtotal, total_amount_paid, registration_type')
    .eq('registration_id', registrationId)
    .single();
  
  if (fetchError || !registration) {
    console.error("Error fetching registration:", fetchError);
    throw new Error(`Failed to fetch registration: ${fetchError?.message}`);
  }
  
  // Calculate fees based on the payment amount
  const totalAmountPaid = convertSquareAmountToDollars(payment.amount_money.amount);
  const subtotal = registration.subtotal || totalAmountPaid;
  
  // Calculate Square fees (assuming domestic card for now - in production, this would be determined from payment metadata)
  const feeCalculation = calculateSquareFees(subtotal, { userCountry: 'AU' });
  
  // CRITICAL: This is the ONLY place we update status to 'completed'
  const updateData: any = {
    status: 'completed',
    payment_status: 'completed',
    square_payment_id: payment.id, // Store Square payment ID instead of Stripe
    total_amount_paid: totalAmountPaid,
    square_fee: feeCalculation.squareFee,
    platform_fee: feeCalculation.platformFee,
    updated_at: new Date().toISOString()
  };
  
  // Add receipt information if available
  if (payment.receipt_number) {
    updateData.receipt_number = payment.receipt_number;
  }
  if (payment.receipt_url) {
    updateData.receipt_url = payment.receipt_url;
  }
  
  console.log(`Updating ${registration.registration_type || 'unknown'} registration to completed status`);
  
  const { data: updatedRegistration, error: updateError } = await supabase
    .from('registrations')
    .update(updateData)
    .eq('registration_id', registrationId)
    .select()
    .single();
  
  if (updateError) {
    console.error("Error updating registration:", updateError);
    // Square will retry the webhook if we return an error
    throw new Error(`Failed to update registration: ${updateError.message}`);
  }
  
  console.log("✅ Registration updated successfully");
  
  // Update tickets to 'sold' status
  const { error: ticketError } = await supabase
    .from('tickets')
    .update({
      status: 'sold',
      ticket_status: 'sold',
      purchased_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('registration_id', registrationId)
    .eq('status', 'reserved');
  
  if (ticketError) {
    console.error("Error updating tickets:", ticketError);
    // Non-critical - continue processing
  } else {
    console.log("✅ Tickets updated to sold status");
  }
  
  // Log payment details for monitoring
  console.log("💰 Square payment breakdown:", {
    paymentId: payment.id,
    total: totalAmountPaid,
    squareFee: feeCalculation.squareFee,
    platformFee: feeCalculation.platformFee,
    subtotal: subtotal,
    currency: payment.amount_money.currency
  });
  
  // The database trigger will handle confirmation number generation
  console.log("Database trigger will generate confirmation number");
  
  // Log success for monitoring
  console.log(`✅ Square payment processing complete for ${registration.registration_type} registration ${registrationId}`);
}

/**
 * Handle Square payment failure
 */
async function handlePaymentFailed(payment: SquarePayment) {
  console.log("❌ Square Payment Failed:", payment.id);
  console.log("Status:", payment.status);
  
  const registrationId = payment.reference_id;
  
  if (!registrationId) {
    console.error("No registration ID found in Square payment reference_id");
    return;
  }
  
  const supabase = await createClient();
  
  // Update registration to failed status
  const { error: updateError } = await supabase
    .from('registrations')
    .update({
      status: 'failed',
      payment_status: 'failed',
      square_payment_id: payment.id,
      updated_at: new Date().toISOString()
    })
    .eq('registration_id', registrationId);
  
  if (updateError) {
    console.error("Error updating registration:", updateError);
  }
  
  // Log failure
  console.error(`Square payment failed for registration ${registrationId}: ${payment.status}`);
}