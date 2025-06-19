import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { 
  updateOrganizationConnectStatus, 
  handleAccountDeauthorization,
  logPayoutDetails,
  calculatePlatformFees 
} from '@/lib/utils/stripe-connect-helpers';
import { getPaymentConfig } from '@/lib/config/payment';

// Initialize Stripe client lazily with proper error handling
function getStripeClient() {
  const config = getPaymentConfig();
  
  if (!config.stripe) {
    throw new Error('Stripe configuration is not available');
  }
  
  if (!config.stripe.secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }
  
  if (!config.stripe.secretKey.startsWith('sk_')) {
    throw new Error('Invalid STRIPE_SECRET_KEY format');
  }
  
  return new Stripe(config.stripe.secretKey, {
    apiVersion: config.stripe.apiVersion as any,
  });
}

const config = getPaymentConfig();
const webhookSecret = config.stripe?.webhookSecret || '';
const connectWebhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const accountId = request.headers.get('stripe-account');
  
  console.group(accountId ? 
    `🔔 Connected Account Webhook (${accountId})` : 
    "🔔 Platform Webhook"
  );
  
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
      // Use different webhook secrets for platform vs connected accounts
      const secret = accountId && connectWebhookSecret ? connectWebhookSecret : webhookSecret;
      
      const stripe = getStripeClient();
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        secret
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
        
      // Connect-specific events
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
        
      case 'account.application.authorized':
        await handleAccountAuthorized(event.data.object as Stripe.Account);
        break;
        
      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object as Stripe.Account);
        break;
        
      case 'capability.updated':
        await handleCapabilityUpdated(event.data.object as Stripe.Capability);
        break;
        
      case 'payout.created':
        await handlePayoutCreated(event.data.object as Stripe.Payout);
        break;
        
      case 'payout.failed':
        await handlePayoutFailed(event.data.object as Stripe.Payout);
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

/**
 * Enhanced payment success handler - Single source of truth for payment completion
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("💰 Payment Intent Succeeded:", paymentIntent.id);
  console.log("Amount:", paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
  
  // Check if this is a Connect payment
  const connectedAccountId = paymentIntent.on_behalf_of || paymentIntent.transfer_data?.destination;
  const applicationFeeAmount = paymentIntent.application_fee_amount;
  
  if (connectedAccountId) {
    console.log("🏦 Connected Account:", connectedAccountId);
    console.log("💸 Platform Fee:", applicationFeeAmount ? applicationFeeAmount / 100 : 0);
  }
  
  // Extract registration ID from metadata (handle both formats)
  const registrationId = paymentIntent.metadata?.registrationId || paymentIntent.metadata?.registration_id;
  
  if (!registrationId) {
    console.error("No registration ID found in payment intent metadata");
    return;
  }
  
  console.log(`Processing payment for registration: ${registrationId}`);
  
  const supabase = await createClient();
  
  // CRITICAL: This is the ONLY place we update status to 'completed'
  const updateData: any = {
    status: 'completed',
    payment_status: 'completed',
    stripe_payment_intent_id: paymentIntent.id,
    total_amount_paid: paymentIntent.amount / 100,
    updated_at: new Date().toISOString()
  };
  
  // Add Connect-specific fields
  if (connectedAccountId) {
    updateData.connected_account_id = connectedAccountId;
    updateData.platform_fee_amount = applicationFeeAmount ? applicationFeeAmount / 100 : 0;
  }
  
  // Extract additional metadata for logging
  const registrationType = paymentIntent.metadata?.registrationType;
  const functionId = paymentIntent.metadata?.functionId;
  
  console.log(`Updating ${registrationType || 'unknown'} registration to completed status`);
  
  const { data: updatedRegistration, error: updateError } = await supabase
    .from('registrations')
    .update(updateData)
    .eq('registration_id', registrationId)
    .select()
    .single();
  
  if (updateError) {
    console.error("Error updating registration:", updateError);
    // Stripe will retry the webhook if we return an error
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
  
  // Log payment for connected account reporting
  if (connectedAccountId) {
    const fees = calculatePlatformFees(paymentIntent, registrationId);
    console.log("💰 Fee breakdown:", {
      total: fees.totalAmount,
      platformFee: fees.platformFee,
      organizationReceives: fees.organizationReceives,
      feePercentage: fees.feePercentage.toFixed(2) + '%'
    });
    
    const { error: logError } = await supabase
      .from('connected_account_payments')
      .insert({
        payment_intent_id: paymentIntent.id,
        connected_account_id: connectedAccountId,
        registration_id: registrationId,
        function_id: functionId,
        amount: paymentIntent.amount / 100,
        platform_fee: applicationFeeAmount ? applicationFeeAmount / 100 : 0,
        currency: paymentIntent.currency,
        status: 'succeeded',
        created_at: new Date().toISOString()
      });
      
    if (logError) {
      console.error("Error logging connected account payment:", logError);
      // Non-critical - continue processing
    }
  }
  
  // The database trigger will handle confirmation number generation
  console.log("Database trigger will generate confirmation number");
  
  // Log success for monitoring
  console.log(`✅ Payment processing complete for ${registrationType} registration ${registrationId}`);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("❌ Payment Intent Failed:", paymentIntent.id);
  
  const registrationId = paymentIntent.metadata?.registrationId || paymentIntent.metadata?.registration_id;
  
  if (!registrationId) {
    console.error("No registration ID found in payment intent metadata");
    return;
  }
  
  const supabase = await createClient();
  
  // Update registration to failed status
  const { error: updateError } = await supabase
    .from('registrations')
    .update({
      status: 'failed',
      payment_status: 'failed',
      stripe_payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString()
    })
    .eq('registration_id', registrationId);
  
  if (updateError) {
    console.error("Error updating registration:", updateError);
  }
  
  // Log failure reason
  const lastError = paymentIntent.last_payment_error;
  if (lastError) {
    console.error("Payment failure reason:", lastError.message);
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  console.log("⏳ Payment Intent Requires Action:", paymentIntent.id);
  
  const registrationId = paymentIntent.metadata?.registrationId || paymentIntent.metadata?.registration_id;
  
  if (!registrationId) {
    console.error("No registration ID found in payment intent metadata");
    return;
  }
  
  const supabase = await createClient();
  
  // Update registration to pending 3DS
  const { error: updateError } = await supabase
    .from('registrations')
    .update({
      status: 'pending',
      payment_status: 'processing',
      stripe_payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString()
    })
    .eq('registration_id', registrationId);
  
  if (updateError) {
    console.error("Error updating registration:", updateError);
  }
  
  console.log("Customer needs to complete 3D Secure authentication");
}

// Connect-specific handlers remain the same
async function handleAccountUpdated(account: Stripe.Account) {
  console.log("🏦 Account Updated:", account.id);
  
  const chargesEnabled = account.charges_enabled;
  const payoutsEnabled = account.payouts_enabled;
  const detailsSubmitted = account.details_submitted;
  
  console.log("Account status:", {
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted
  });
  
  // Update organization status in database
  await updateOrganizationConnectStatus(account);
}

async function handleAccountAuthorized(account: Stripe.Account) {
  console.log("✅ Account Authorized:", account.id);
  await updateOrganizationConnectStatus(account);
}

async function handleAccountDeauthorized(account: Stripe.Account) {
  console.log("❌ Account Deauthorized:", account.id);
  await handleAccountDeauthorization(account);
}

async function handleCapabilityUpdated(capability: Stripe.Capability) {
  console.log("🔧 Capability Updated:", capability.id);
  console.log("Status:", capability.status);
  
  if (capability.status === 'inactive' && capability.requirements) {
    console.log("Requirements:", capability.requirements);
  }
}

async function handlePayoutCreated(payout: Stripe.Payout) {
  console.log("💸 Payout Created:", payout.id);
  console.log("Amount:", payout.amount / 100, payout.currency.toUpperCase());
  console.log("Arrival date:", new Date(payout.arrival_date * 1000).toLocaleDateString());
  
  await logPayoutDetails(payout);
}

async function handlePayoutFailed(payout: Stripe.Payout) {
  console.log("❌ Payout Failed:", payout.id);
  console.log("Failure reason:", payout.failure_message);
  
  await logPayoutDetails(payout);
}