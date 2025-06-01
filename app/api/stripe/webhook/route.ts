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

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
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
    console.log("Event ID:", event.event_id);
    
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
        
      case 'payout.paid':
        await handlePayoutPaid(event.data.object as Stripe.Payout);
        break;
        
      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;
        
      case 'application_fee.created':
        await handleApplicationFeeCreated(event.data.object as Stripe.ApplicationFee);
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
  
  // Check if this is a Connect payment
  const connectedAccountId = paymentIntent.on_behalf_of;
  const applicationFeeAmount = paymentIntent.application_fee_amount;
  
  if (connectedAccountId) {
    console.log("🏦 Connected Account:", connectedAccountId);
    console.log("💸 Platform Fee:", applicationFeeAmount ? applicationFeeAmount / 100 : 0);
  }
  
  // Extract registration ID from metadata
  const registrationId = paymentIntent.metadata?.registration_id;
  
  if (!registrationId) {
    console.error("No registration ID found in payment intent metadata");
    return;
  }
  
  const supabase = await createClient();
  
  // Update registration with Connect details
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
  
  const { data: updatedRegistration, error: updateError } = await supabase
    .from('registrations')
    .update(updateData)
    .eq('registration_id', registrationId)
    .select()
    .single();
  
  if (updateError) {
    console.error("Error updating registration:", updateError);
    return;
  }
  
  console.log("✅ Registration updated successfully");
  
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
        amount: paymentIntent.amount / 100,
        platform_fee: applicationFeeAmount ? applicationFeeAmount / 100 : 0,
        currency: paymentIntent.currency,
        status: 'succeeded',
        created_at: new Date().toISOString()
      });
      
    if (logError) {
      console.error("Error logging connected account payment:", logError);
    }
  }
  
  // Update tickets to completed status
  const { error: ticketError } = await supabase
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
  
  const supabase = await createClient();
  
  // Update registration status
  const { error: updateError } = await supabase
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
  
  const supabase = await createClient();
  
  // Update registration status
  const { error: updateError } = await supabase
    .from('registrations')
    .update({
      payment_status: 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('registration_id', registrationId);
  
  if (updateError) {
    console.error("Error updating registration:", updateError);
  } else {
    console.log("✅ Registration marked as requires action");
  }
}

// Connect Event Handlers
async function handleAccountUpdated(account: Stripe.Account) {
  console.log("🏦 Account Updated:", account.id);
  
  try {
    const status = await updateOrganizationConnectStatus(account.id, account);
    
    // Send notification if account becomes active
    if (status.isActive) {
      // TODO: Send email notification to organization
      console.log("✅ Account fully activated:", account.id);
    }
    
    if (status.requiresAction) {
      console.log("⚠️ Account requires action:", account.id);
    }
  } catch (error) {
    console.error("Error updating organization:", error);
  }
}

async function handleAccountAuthorized(account: Stripe.Account) {
  console.log("✅ Account Authorized:", account.id);
  
  const supabase = await createClient();
  
  // Update organization status
  const { error } = await supabase
    .from('organisations')
    .update({
      stripe_account_status: 'authorized',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_onbehalfof', account.id);
    
  if (error) {
    console.error("Error updating organization authorization:", error);
  }
}

async function handleAccountDeauthorized(account: Stripe.Account) {
  console.log("❌ Account Deauthorized:", account.id);
  
  try {
    await handleAccountDeauthorization(account.id);
    
    // TODO: Send notification to platform admin about deauthorization
    console.log("⚠️ Organization deauthorized their Stripe connection");
  } catch (error) {
    console.error("Error handling deauthorization:", error);
  }
}

async function handleCapabilityUpdated(capability: Stripe.Capability) {
  console.log("🔧 Capability Updated:", capability.id);
  console.log("Status:", capability.status);
  console.log("Account:", capability.account);
  
  // Capability updates are handled through account.updated events
  // This is here for additional logging if needed
}

async function handlePayoutCreated(payout: Stripe.Payout) {
  console.log("💸 Payout Created:", payout.id);
  console.log("Amount:", payout.amount / 100, payout.currency.toUpperCase());
  console.log("Arrival Date:", new Date(payout.arrival_date * 1000).toISOString());
  
  try {
    await logPayoutDetails(payout);
    console.log("✅ Payout logged successfully");
  } catch (error) {
    console.error("Error logging payout:", error);
  }
}

async function handlePayoutFailed(payout: Stripe.Payout) {
  console.log("❌ Payout Failed:", payout.id);
  console.log("Failure Reason:", payout.failure_message);
  
  const supabase = await createClient();
  
  // Update payout status
  const { error } = await supabase
    .from('organisation_payouts')
    .update({
      status: 'failed',
      metadata: {
        ...payout.metadata,
        failure_message: payout.failure_message,
        failure_code: payout.failure_code
      }
    })
    .eq('payout_id', payout.id);
    
  if (error) {
    console.error("Error updating failed payout:", error);
  }
  
  // TODO: Send notification about failed payout
  console.log("⚠️ Payout failed, notification should be sent");
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  console.log("✅ Payout Paid:", payout.id);
  
  const supabase = await createClient();
  
  // Update payout status
  const { error } = await supabase
    .from('organisation_payouts')
    .update({
      status: 'paid'
    })
    .eq('payout_id', payout.id);
    
  if (error) {
    console.error("Error updating paid payout:", error);
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log("🔄 Transfer Created:", transfer.id);
  console.log("Amount:", transfer.amount / 100, transfer.currency.toUpperCase());
  console.log("Destination:", transfer.destination);
  
  // Log transfer for reconciliation
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('platform_transfers')
    .insert({
      transfer_id: transfer.id,
      source_transaction: transfer.source_transaction,
      destination_account: transfer.destination as string,
      amount: transfer.amount / 100,
      currency: transfer.currency,
      description: transfer.description,
      metadata: transfer.metadata,
      created_at: new Date().toISOString()
    });
    
  if (error) {
    console.error("Error logging transfer:", error);
  }
}

async function handleApplicationFeeCreated(fee: Stripe.ApplicationFee) {
  console.log("💰 Application Fee Created:", fee.id);
  console.log("Amount:", fee.amount / 100, fee.currency.toUpperCase());
  
  // The charge property contains the charge ID, we need to fetch the full charge object
  // to get the metadata
  if (typeof fee.charge === 'string') {
    try {
      const charge = await stripe.charges.retrieve(fee.charge);
      const registrationId = charge.metadata?.registration_id;
      
      if (registrationId) {
        const supabase = await createClient();
        
        const { error } = await supabase
          .from('registrations')
          .update({
            platform_fee_amount: fee.amount / 100,
            platform_fee_id: fee.id,
            updated_at: new Date().toISOString()
          })
          .eq('registration_id', registrationId);
          
        if (error) {
          console.error("Error updating registration with fee:", error);
        }
      }
    } catch (err) {
      console.error("Error retrieving charge for application fee:", err);
    }
  }
}

// Export config to handle raw body for webhook signature verification
export const runtime = 'nodejs';