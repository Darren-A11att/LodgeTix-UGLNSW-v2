import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  console.group("🔔 Stripe Webhook Handler");
  
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');
    
    if (!signature) {
      console.error("No Stripe signature found in headers");
      console.groupEnd();
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      console.groupEnd();
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }
    
    console.log("Webhook event type:", event.type);
    console.log("Event ID:", event.id);
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    console.groupEnd();
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    console.groupEnd();
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("💰 Payment Intent Succeeded:", paymentIntent.id);
  console.log("Amount:", paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
  
  // Extract registration ID from metadata
  const registrationId = paymentIntent.metadata?.registration_id;
  
  if (!registrationId) {
    console.error("No registration ID found in payment intent metadata");
    return;
  }
  
  const adminClient = createAdminClient();
  
  // Update registration status
  const { data: updatedRegistration, error: updateError } = await adminClient
    .from('registrations')
    .update({
      status: 'paid',
      payment_status: 'completed',
      stripe_payment_intent_id: paymentIntent.id,
      total_amount_paid: paymentIntent.amount / 100,
      updated_at: new Date().toISOString()
    })
    .eq('registration_id', registrationId)
    .select()
    .single();
  
  if (updateError) {
    console.error("Error updating registration:", updateError);
    return;
  }
  
  console.log("✅ Registration updated successfully");
  
  // Update tickets to completed status
  const { error: ticketError } = await adminClient
    .from('tickets')
    .update({
      ticket_status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('registration_id', registrationId);
  
  if (ticketError) {
    console.error("Error updating tickets:", ticketError);
  } else {
    console.log("✅ Tickets updated to completed status");
  }
  
  // TODO: Send confirmation email
  // This would typically trigger an email service to send the confirmation
  console.log("📧 Confirmation email would be sent here");
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("❌ Payment Intent Failed:", paymentIntent.id);
  console.log("Error:", paymentIntent.last_payment_error?.message);
  
  const registrationId = paymentIntent.metadata?.registration_id;
  
  if (!registrationId) {
    console.error("No registration ID found in payment intent metadata");
    return;
  }
  
  const adminClient = createAdminClient();
  
  // Update registration status
  const { error: updateError } = await adminClient
    .from('registrations')
    .update({
      payment_status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('registration_id', registrationId);
  
  if (updateError) {
    console.error("Error updating registration:", updateError);
  } else {
    console.log("✅ Registration marked as payment failed");
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  console.log("🔐 Payment Intent Requires Action:", paymentIntent.id);
  console.log("Next action type:", paymentIntent.next_action?.type);
  
  const registrationId = paymentIntent.metadata?.registration_id;
  
  if (!registrationId) {
    console.error("No registration ID found in payment intent metadata");
    return;
  }
  
  const adminClient = createAdminClient();
  
  // Update registration status
  const { error: updateError } = await adminClient
    .from('registrations')
    .update({
      payment_status: 'requires_action',
      updated_at: new Date().toISOString()
    })
    .eq('registration_id', registrationId);
  
  if (updateError) {
    console.error("Error updating registration:", updateError);
  } else {
    console.log("✅ Registration marked as requires action");
  }
}

// Export config to handle raw body for webhook signature verification
export const runtime = 'nodejs';