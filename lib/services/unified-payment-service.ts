/**
 * Unified Payment Service
 * Centralizes all payment processing logic for consistent Stripe fee calculations
 * and metadata handling across all registration types (individuals, lodge, delegation)
 * 
 * Key Features:
 * - Ensures connected accounts receive exact subtotal amounts
 * - Consistent metadata structure with function details (not event)
 * - Proper fee calculation using stripe-fee-calculator
 * - Type-specific metadata handling
 */

import Stripe from 'stripe';
import { calculateStripeFees } from '@/lib/utils/stripe-fee-calculator';
import { getRegistrationWithFullContext } from '@/lib/api/stripe-queries-fixed';
import type { StripeFeeCalculation } from '@/lib/utils/stripe-fee-calculator';

// Initialize Stripe client lazily with proper error handling
function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }
  
  if (!stripeSecretKey.startsWith('sk_')) {
    throw new Error('Invalid STRIPE_SECRET_KEY format');
  }
  
  return new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UnifiedPaymentRequest {
  registrationId: string;
  paymentMethodId?: string; // Payment method ID to attach to the PaymentIntent
  billingDetails: {
    name: string;
    email: string;
    phone?: string;
    address: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country: string; // Critical for domestic/international fee determination
    };
  };
  sessionId?: string;
  referrer?: string;
}

export interface UnifiedPaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
  totalAmount: number;
  processingFees: number;
  subtotal: number;
  platformFee: number;
}

interface BaseMetadata {
  // Registration identification
  registrationId: string;
  registrationType: 'individuals' | 'lodge' | 'delegation';
  
  // Function details (NOT event!)
  functionId: string;
  functionName: string;
  functionSlug: string;
  
  // Organization and connected account
  organisationId: string;
  organisationName: string;
  stripe_onbehalfof: string;
  
  // Financial breakdown (all amounts in dollars)
  subtotal: string;
  platformFee: string;
  stripeFee: string;
  totalAmount: string;
  processingFeesDisplay: string;
  currency: 'aud';
  isDomesticCard: string;
  cardCountry: string;
  platformFeePercentage: string;
  platformFeeCap: string;
  platformFeeMinimum: string;
  
  // Session tracking
  sessionId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  appVersion: string;
  referrer?: string;
  
  // Counts
  totalAttendees: string;
  ticketsCount: string;
  
  // Timestamps
  createdAt: string;
  
  // EXPLICITLY NO confirmation number at this stage
}

interface IndividualsMetadata extends BaseMetadata {
  // Primary attendee details
  primaryAttendeeName: string;
  primaryAttendeeEmail: string;
  primaryAttendeePhone?: string;
  
  // Attendee breakdown
  attendeeTypes: string; // JSON stringified object
  attendeeNames: string; // Comma-separated list
  
  // Masonic details (if applicable)
  primaryLodgeName?: string;
  primaryLodgeNumber?: string;
  primaryGrandLodge?: string;
}

interface LodgeMetadata extends BaseMetadata {
  // Lodge identification
  lodgeId: string;
  lodgeName: string;
  lodgeNumber: string;
  
  // Grand Lodge details
  grandLodgeId: string;
  grandLodgeName: string;
  grandLodgeAbbreviation: string;
  
  // Lodge contact person
  lodgeContactName: string;
  lodgeContactEmail: string;
  lodgeContactPhone?: string;
  
  // Lodge-specific data
  tableCount: string;
  lodgeCity?: string;
  lodgeState?: string;
}

interface DelegationMetadata extends BaseMetadata {
  // Booking contact (not "leader")
  bookingContactName: string;
  bookingContactEmail: string;
  bookingContactPhone?: string;
  
  // Delegation details
  delegationName: string;
  delegationType: 'ticketsOnly' | 'fullRegistration';
  
  // For full registration only
  delegateCount?: string;
  attendeeTypes?: string; // JSON stringified object
  delegateNames?: string; // Comma-separated list
}

type PaymentIntentMetadata = IndividualsMetadata | LodgeMetadata | DelegationMetadata;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get device type from user agent
 */
function getDeviceType(userAgent?: string): 'desktop' | 'mobile' | 'tablet' {
  if (!userAgent) return 'desktop';
  
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod/.test(ua) && !/ipad|tablet/.test(ua)) {
    return 'mobile';
  }
  if (/ipad|tablet|playbook|silk/.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Get app version from environment
 */
function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
}

/**
 * Build comprehensive metadata for payment intent
 */
function buildPaymentIntentMetadata(
  data: RegistrationWithFullContext,
  billingDetails: UnifiedPaymentRequest['billingDetails'],
  feeCalculation: StripeFeeCalculation,
  sessionId?: string,
  referrer?: string
): PaymentIntentMetadata {
  const { registration, event, organization, function: functionData, attendees, tickets, lodge_registration } = data;
  
  // Build common metadata
  const commonMetadata: BaseMetadata = {
    // Registration identification
    registrationId: registration.registration_id,
    registrationType: registration.registration_type as 'individuals' | 'lodge' | 'delegation',
    
    // Function details (prioritize function over event)
    functionId: functionData?.function_id || event.function_id || '',
    functionName: functionData?.name || '',
    functionSlug: functionData?.slug || '',
    
    // Organization and connected account
    organisationId: organization.organisation_id,
    organisationName: organization.name,
    stripe_onbehalfof: organization.stripe_onbehalfof || '',
    
    // Financial breakdown (convert to strings for Stripe metadata)
    subtotal: feeCalculation.connectedAmount.toFixed(2),
    platformFee: feeCalculation.platformFee.toFixed(2),
    stripeFee: feeCalculation.stripeFee.toFixed(2),
    totalAmount: feeCalculation.customerPayment.toFixed(2),
    processingFeesDisplay: feeCalculation.processingFeesDisplay.toFixed(2),
    currency: 'aud',
    isDomesticCard: feeCalculation.isDomestic.toString(),
    cardCountry: billingDetails.address.country,
    platformFeePercentage: feeCalculation.breakdown.platformFeePercentage.toString(),
    platformFeeCap: feeCalculation.breakdown.platformFeeCap.toString(),
    platformFeeMinimum: feeCalculation.breakdown.platformFeeMinimum.toString(),
    
    // Session tracking
    sessionId: sessionId || '',
    deviceType: getDeviceType(),
    appVersion: getAppVersion(),
    referrer,
    
    // Counts
    totalAttendees: attendees.length.toString(),
    ticketsCount: tickets.length.toString(),
    
    // Timestamps
    createdAt: new Date().toISOString(),
  };
  
  // Build type-specific metadata
  switch (registration.registration_type) {
    case 'individuals': {
      const primaryAttendee = attendees.find(a => a.is_primary_contact) || attendees[0];
      const attendeeTypes = attendees.reduce((acc, a) => {
        acc[a.attendee_type] = (acc[a.attendee_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const metadata: IndividualsMetadata = {
        ...commonMetadata,
        // Primary attendee details
        primaryAttendeeName: primaryAttendee ? `${primaryAttendee.first_name} ${primaryAttendee.last_name}` : '',
        primaryAttendeeEmail: primaryAttendee?.email || '',
        primaryAttendeePhone: primaryAttendee?.phone_number || undefined,
        
        // Attendee breakdown
        attendeeTypes: JSON.stringify(attendeeTypes),
        attendeeNames: attendees.map(a => `${a.first_name} ${a.last_name}`).join(', '),
        
        // Masonic details (if applicable)
        primaryLodgeName: primaryAttendee?.lodge_name || undefined,
        primaryLodgeNumber: primaryAttendee?.lodge_number || undefined,
        primaryGrandLodge: primaryAttendee?.grand_lodge || undefined,
      };
      
      return metadata;
    }
    
    case 'lodge': {
      const lodgeData = lodge_registration;
      const lodgeInfo = lodgeData?.lodges;
      const grandLodgeInfo = lodgeInfo?.grand_lodges;
      
      // Find lodge contact from attendees or use billing details
      const lodgeContact = attendees.find(a => a.is_primary_contact) || attendees[0];
      
      const metadata: LodgeMetadata = {
        ...commonMetadata,
        // Lodge identification
        lodgeId: lodgeInfo?.lodge_id || '',
        lodgeName: lodgeInfo?.name || '',
        lodgeNumber: lodgeInfo?.number || '',
        
        // Grand Lodge details
        grandLodgeId: grandLodgeInfo?.grand_lodge_id || '',
        grandLodgeName: grandLodgeInfo?.name || '',
        grandLodgeAbbreviation: grandLodgeInfo?.abbreviation || '',
        
        // Lodge contact person
        lodgeContactName: billingDetails.name,
        lodgeContactEmail: billingDetails.email,
        lodgeContactPhone: billingDetails.phone,
        
        // Lodge-specific data
        tableCount: lodgeData?.table_count?.toString() || '0',
        lodgeCity: organization.city || undefined,
        lodgeState: organization.state || undefined,
      };
      
      return metadata;
    }
    
    case 'delegation': {
      const hasDelegates = attendees.length > 0;
      const bookingContact = attendees.find(a => a.is_primary_contact) || attendees[0];
      
      const attendeeTypes = hasDelegates ? attendees.reduce((acc, a) => {
        acc[a.attendee_type] = (acc[a.attendee_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) : {};
      
      const metadata: DelegationMetadata = {
        ...commonMetadata,
        // Booking contact
        bookingContactName: bookingContact ? `${bookingContact.first_name} ${bookingContact.last_name}` : billingDetails.name,
        bookingContactEmail: bookingContact?.email || billingDetails.email,
        bookingContactPhone: bookingContact?.phone_number || billingDetails.phone,
        
        // Delegation details
        delegationName: organization.name, // Using organization name as delegation name
        delegationType: hasDelegates ? 'fullRegistration' : 'ticketsOnly',
        
        // For full registration only
        delegateCount: hasDelegates ? attendees.length.toString() : undefined,
        attendeeTypes: hasDelegates ? JSON.stringify(attendeeTypes) : undefined,
        delegateNames: hasDelegates ? attendees.map(a => `${a.first_name} ${a.last_name}`).join(', ') : undefined,
      };
      
      return metadata;
    }
    
    default:
      // This should never happen, but TypeScript needs it
      return commonMetadata as any;
  }
}

// ============================================
// MAIN SERVICE CLASS
// ============================================

export class UnifiedPaymentService {
  /**
   * Create a payment intent with correct fee calculations and metadata
   */
  async createPaymentIntent(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    const { registrationId, paymentMethodId, billingDetails, sessionId, referrer } = request;
    
    // Fetch complete registration data
    console.group("💳 PAYMENT SERVICE DEBUGGING");
    console.log("🔍 Fetching registration data for ID:", registrationId);
    
    const paymentData = await getRegistrationWithFullContext(registrationId);
    
    if (!paymentData) {
      console.error("❌ Registration not found in database");
      console.groupEnd();
      throw new Error('Registration not found');
    }
    
    console.log("📊 Retrieved registration data:", {
      subtotal: paymentData.registration.subtotal,
      totalAmount: paymentData.registration.total_amount_paid,
      attendeeCount: paymentData.attendees?.length || 0,
      ticketsCount: paymentData.tickets?.length || 0,
      registrationType: paymentData.registration.registration_type,
      registrationId: paymentData.registration.registration_id
    });
    console.log("🏢 Organization data:", {
      name: paymentData.organization?.name,
      stripeAccount: paymentData.organization?.stripe_onbehalfof
    });
    console.groupEnd();
    
    const { registration, organization } = paymentData;
    
    // Validate connected account
    if (!organization.stripe_onbehalfof) {
      throw new Error('No connected Stripe account for this organization');
    }
    
    // Calculate fees using the stripe-fee-calculator
    const feeCalculation = calculateStripeFees(
      registration.subtotal,
      { userCountry: billingDetails.address.country }
    );
    
    // Build comprehensive metadata
    const metadata = buildPaymentIntentMetadata(
      paymentData,
      billingDetails,
      feeCalculation,
      sessionId,
      referrer
    );
    
    // Prepare payment intent creation parameters
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(feeCalculation.customerPayment * 100), // Convert to cents
      currency: 'aud',
      metadata: metadata as any, // Stripe requires Record<string, string>
      
      // CRITICAL: Set on_behalf_of for the connected account
      on_behalf_of: organization.stripe_onbehalfof,
      
      // Transfer data ensures connected account receives EXACT subtotal
      // The application fee will be automatically calculated as the difference
      transfer_data: {
        destination: organization.stripe_onbehalfof,
        amount: Math.round(registration.subtotal * 100), // Exactly the ticket revenue!
      },
      
      // Statement descriptor
      statement_descriptor_suffix: paymentData.function?.name
        ?.substring(0, 22)
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim(),
    };
    
    // Configure payment method handling
    if (paymentMethodId) {
      console.log("💳 Attaching payment method to PaymentIntent:", paymentMethodId);
      // Match the successful payment pattern: attach method, manual confirmation, confirm=false
      paymentIntentParams.payment_method = paymentMethodId;
      paymentIntentParams.confirmation_method = 'manual';
      paymentIntentParams.confirm = false; // Create first, confirm separately
    } else {
      // When no payment method provided, use automatic payment methods
      paymentIntentParams.automatic_payment_methods = { enabled: true };
    }
    
    // Create payment intent with correct parameters for Stripe Connect
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    
    // If we attached a payment method, confirm it immediately with secret key
    if (paymentMethodId && paymentIntent.status === 'requires_confirmation') {
      console.log("💳 Confirming PaymentIntent with secret key:", paymentIntent.id);
      
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/return`
      });
      
      console.log("✅ PaymentIntent confirmed:", confirmedPaymentIntent.status);
      
      // Update registration status after successful payment confirmation
      if (confirmedPaymentIntent.status === 'succeeded') {
        console.log("💾 Updating registration status to completed");
        await this.updateRegistrationPaymentStatus(registrationId, confirmedPaymentIntent.id, feeCalculation, paymentData);
      }
      return {
        clientSecret: confirmedPaymentIntent.client_secret!,
        paymentIntentId: confirmedPaymentIntent.id,
        totalAmount: feeCalculation.customerPayment,
        processingFees: feeCalculation.processingFeesDisplay,
        subtotal: registration.subtotal,
        platformFee: feeCalculation.platformFee,
        stripeFee: feeCalculation.stripeFee,
      };
    }
    
    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      totalAmount: feeCalculation.customerPayment,
      processingFees: feeCalculation.processingFeesDisplay,
      subtotal: registration.subtotal,
      platformFee: feeCalculation.platformFee,
      stripeFee: feeCalculation.stripeFee,
    };
  }
  
  /**
   * Update payment intent metadata (used after confirmation generation)
   */
  async updatePaymentIntentMetadata(
    paymentIntentId: string,
    updates: {
      confirmationNumber?: string;
      ticketNumbers?: string[];
    }
  ): Promise<void> {
    try {
      const stripe = getStripeClient();
      // Fetch existing metadata to preserve it
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Update with new values
      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: {
          ...paymentIntent.metadata,
          confirmationNumber: updates.confirmationNumber || paymentIntent.metadata.confirmationNumber,
          confirmationGeneratedAt: updates.confirmationNumber ? new Date().toISOString() : paymentIntent.metadata.confirmationGeneratedAt,
          ticketNumbers: updates.ticketNumbers?.join(',') || paymentIntent.metadata.ticketNumbers || 'pending',
          ticketCount: updates.ticketNumbers?.length.toString() || paymentIntent.metadata.ticketCount,
        }
      });
    } catch (error) {
      // Non-critical - log but don't throw
      console.error('Failed to update Stripe metadata:', error);
    }
  }
  
  /**
   * Update registration status after successful payment
   */
  private async updateRegistrationPaymentStatus(
    registrationId: string, 
    paymentIntentId: string,
    feeCalculation?: any,
    paymentData?: any
  ): Promise<void> {
    try {
      // Import Supabase client
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();
      
      // Prepare update data
      const updateData: any = {
        status: 'completed',
        payment_status: 'completed',
        stripe_payment_intent_id: paymentIntentId,
        payment_intent_id: paymentIntentId, // Add payment_intent_id field
        updated_at: new Date().toISOString()
      };
      
      // Add payment amounts if fee calculation is provided
      if (feeCalculation) {
        updateData.total_amount_paid = feeCalculation.customerPayment; // What customer's card is charged (includes fees)
        updateData.total_price_paid = feeCalculation.connectedAmount;   // Subtotal (ticket revenue only)
        updateData.stripe_fee = feeCalculation.stripeFee;              // Stripe processing fee
        updateData.platform_fee = feeCalculation.platformFee;          // Platform fee
      }
      
      // Add registration-specific data if provided
      if (paymentData) {
        const { registration, organization, attendees } = paymentData;
        
        // Add connected account ID
        if (organization?.stripe_onbehalfof) {
          updateData.connected_account_id = organization.stripe_onbehalfof;
        }
        
        // For individuals registration, add primary attendee and attendee count
        if (registration.registration_type === 'individuals' && attendees && attendees.length > 0) {
          const primaryAttendee = attendees.find(a => a.is_primary_contact) || attendees[0];
          if (primaryAttendee) {
            updateData.primary_attendee_id = primaryAttendee.attendee_id;
          }
          updateData.attendee_count = attendees.length;
        }
      }
      
      // Update registration status and payment details
      const { error } = await supabase
        .from('registrations')
        .update(updateData)
        .eq('registration_id', registrationId);
      
      if (error) {
        console.error('Failed to update registration status:', error);
        throw error;
      }
      
      console.log(`✅ Registration ${registrationId} marked as completed with data:`, {
        status: updateData.status,
        payment_status: updateData.payment_status,
        total_amount_paid: updateData.total_amount_paid,
        total_price_paid: updateData.total_price_paid,
        stripe_fee: updateData.stripe_fee,
        platform_fee: updateData.platform_fee,
        connected_account_id: updateData.connected_account_id,
        primary_attendee_id: updateData.primary_attendee_id,
        attendee_count: updateData.attendee_count
      });
      
    } catch (error) {
      console.error('Error updating registration payment status:', error);
      // Don't throw - we don't want to fail the payment if this update fails
    }
  }
}

// Export singleton instance
export const unifiedPaymentService = new UnifiedPaymentService();