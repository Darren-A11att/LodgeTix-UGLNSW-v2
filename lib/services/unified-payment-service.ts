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

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UnifiedPaymentRequest {
  registrationId: string;
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
    const { registrationId, billingDetails, sessionId, referrer } = request;
    
    // Fetch complete registration data
    const paymentData = await getRegistrationWithFullContext(registrationId);
    
    if (!paymentData) {
      throw new Error('Registration not found');
    }
    
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
    
    // Create payment intent with correct parameters for Stripe Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(feeCalculation.customerPayment * 100), // Convert to cents
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
      metadata: metadata as any, // Stripe requires Record<string, string>
      
      // CRITICAL: Set on_behalf_of for the connected account
      on_behalf_of: organization.stripe_onbehalfof,
      
      // Application fee includes BOTH platform fee AND stripe fee
      // This is what gets deducted before the connected account receives their funds
      application_fee_amount: Math.round((feeCalculation.platformFee + feeCalculation.stripeFee) * 100),
      
      // Transfer data ensures connected account receives EXACT subtotal
      transfer_data: {
        destination: organization.stripe_onbehalfof,
        amount: Math.round(registration.subtotal * 100), // Exactly the ticket revenue!
      },
      
      // Statement descriptor
      statement_descriptor_suffix: paymentData.function?.name
        ?.substring(0, 22)
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim(),
    });
    
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
}

// Export singleton instance
export const unifiedPaymentService = new UnifiedPaymentService();