import { createAdminClient } from '@/utils/supabase/admin';
import Stripe from 'stripe';

export interface ConnectAccountStatus {
  isActive: boolean;
  canAcceptPayments: boolean;
  canReceivePayouts: boolean;
  requiresAction: boolean;
  status: 'pending' | 'active' | 'restricted' | 'deauthorized';
}

/**
 * Parse Stripe Connect account status
 */
export function parseConnectAccountStatus(account: Stripe.Account): ConnectAccountStatus {
  const isActive = account.charges_enabled && account.payouts_enabled;
  const canAcceptPayments = account.charges_enabled || false;
  const canReceivePayouts = account.payouts_enabled || false;
  const requiresAction = !account.details_submitted || (!canAcceptPayments && !canReceivePayouts);
  
  let status: ConnectAccountStatus['status'] = 'pending';
  if (isActive) {
    status = 'active';
  } else if (canAcceptPayments && !canReceivePayouts) {
    status = 'restricted';
  }
  
  return {
    isActive,
    canAcceptPayments,
    canReceivePayouts,
    requiresAction,
    status
  };
}

/**
 * Update organization Connect status in database
 */
export async function updateOrganizationConnectStatus(
  accountId: string, 
  account: Stripe.Account
) {
  const adminClient = createAdminClient();
  const status = parseConnectAccountStatus(account);
  
  const { error } = await adminClient
    .from('organisations')
    .update({
      stripe_account_status: status.status,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_details_submitted: account.details_submitted,
      stripe_capabilities: {
        card_payments: account.capabilities?.card_payments,
        transfers: account.capabilities?.transfers,
        platform_payments: account.capabilities?.platform_payments
      },
      updated_at: new Date().toISOString()
    })
    .eq('stripe_onbehalfof', accountId);
    
  if (error) {
    console.error("Error updating organization Connect status:", error);
    throw error;
  }
  
  return status;
}

/**
 * Handle account deauthorization
 */
export async function handleAccountDeauthorization(accountId: string) {
  const adminClient = createAdminClient();
  
  // Update organization status
  const { error: updateError } = await adminClient
    .from('organisations')
    .update({
      stripe_account_status: 'deauthorized',
      stripe_payouts_enabled: false,
      stripe_onbehalfof: null, // Clear the connection
      updated_at: new Date().toISOString()
    })
    .eq('stripe_onbehalfof', accountId);
    
  if (updateError) {
    console.error("Error handling deauthorization:", updateError);
    throw updateError;
  }
  
  // Mark all pending registrations for this organization as requiring attention
  const { data: org } = await adminClient
    .from('organisations')
    .select('organisation_id')
    .eq('stripe_onbehalfof', accountId)
    .single();
    
  if (org) {
    // Get events for this organization
    const { data: events } = await adminClient
      .from('events')
      .select('event_id')
      .eq('organiser_id', org.organisation_id);
      
    if (events && events.length > 0) {
      const eventIds = events.map(e => e.event_id);
      
      // Update registrations to indicate payment processor issue
      const { error: regError } = await adminClient
        .from('registrations')
        .update({
          payment_status: 'processor_disconnected',
          updated_at: new Date().toISOString()
        })
        .in('event_id', eventIds)
        .eq('payment_status', 'pending');
        
      if (regError) {
        console.error("Error updating registrations after deauthorization:", regError);
      }
    }
  }
}

/**
 * Log payout details for reporting
 */
export async function logPayoutDetails(payout: Stripe.Payout) {
  const adminClient = createAdminClient();
  
  const payoutData = {
    payout_id: payout.id,
    organisation_stripe_id: payout.destination as string,
    amount: payout.amount / 100,
    currency: payout.currency,
    status: payout.status,
    arrival_date: new Date(payout.arrival_date * 1000).toISOString(),
    method: payout.method,
    description: payout.description,
    metadata: {
      ...payout.metadata,
      type: payout.type,
      source_type: payout.source_type,
      bank_account: payout.bank_account ? {
        last4: (payout.bank_account as any).last4,
        bank_name: (payout.bank_account as any).bank_name
      } : null
    },
    created_at: new Date().toISOString()
  };
  
  const { error } = await adminClient
    .from('organisation_payouts')
    .upsert(payoutData, {
      onConflict: 'payout_id'
    });
    
  if (error) {
    console.error("Error logging payout:", error);
    throw error;
  }
  
  return payoutData;
}

/**
 * Calculate and log platform fees
 */
export async function calculatePlatformFees(
  paymentIntent: Stripe.PaymentIntent,
  registrationId: string
) {
  const amount = paymentIntent.amount / 100;
  const applicationFeeAmount = paymentIntent.application_fee_amount ? 
    paymentIntent.application_fee_amount / 100 : 0;
  
  // Calculate the net amount the organization receives
  const organizationReceives = amount - applicationFeeAmount;
  
  return {
    totalAmount: amount,
    platformFee: applicationFeeAmount,
    organizationReceives,
    feePercentage: amount > 0 ? (applicationFeeAmount / amount) * 100 : 0
  };
}