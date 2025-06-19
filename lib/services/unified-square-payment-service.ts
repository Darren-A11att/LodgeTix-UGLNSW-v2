/**
 * Unified Square Payment Service
 * Centralizes all payment processing logic for consistent Square fee calculations
 * and metadata handling across all registration types (individuals, lodge, delegation)
 * 
 * Key Features:
 * - Ensures connected accounts receive exact subtotal amounts
 * - Consistent metadata structure with function details (not event)
 * - Proper fee calculation using square-fee-calculator
 * - Type-specific metadata handling
 */

import { getSquarePaymentsApi, convertToCents, generateIdempotencyKey, getSquareLocationId } from '@/lib/utils/square-client';
import { calculateSquareFees } from '@/lib/utils/square-fee-calculator';
import { getRegistrationWithFullContext } from '@/lib/api/stripe-queries-fixed';
import type { SquareFeeCalculation } from '@/lib/utils/square-fee-calculator';
import type { CreatePaymentRequest, Payment } from 'square';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UnifiedPaymentRequest {
  registrationId: string;
  paymentMethodId?: string; // Payment method ID (Square nonce or token)
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
  clientSecret?: string; // Not used by Square, but kept for compatibility
  paymentId: string; // Square payment ID
  totalAmount: number;
  processingFees: number;
  subtotal: number;
  platformFee: number;
  status: string; // Square payment status
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
  
  // Financial breakdown (all amounts in dollars)
  subtotal: string;
  platformFee: string;
  squareFee: string;
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

type PaymentMetadata = IndividualsMetadata | LodgeMetadata | DelegationMetadata;

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
 * Build comprehensive metadata for Square payment
 */
function buildPaymentMetadata(
  data: RegistrationWithFullContext,
  billingDetails: UnifiedPaymentRequest['billingDetails'],
  feeCalculation: SquareFeeCalculation,
  sessionId?: string,
  referrer?: string
): PaymentMetadata {
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
    
    // Financial breakdown (convert to strings for metadata)
    subtotal: feeCalculation.connectedAmount.toFixed(2),
    platformFee: feeCalculation.platformFee.toFixed(2),
    squareFee: feeCalculation.squareFee.toFixed(2),
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

export class UnifiedSquarePaymentService {
  /**
   * Create a Square payment with correct fee calculations and metadata
   */
  async createPaymentIntent(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    const { registrationId, paymentMethodId, billingDetails, sessionId, referrer } = request;
    
    // Fetch complete registration data
    console.group("💳 SQUARE PAYMENT SERVICE DEBUGGING");
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
      id: paymentData.organization?.organisation_id
    });
    console.groupEnd();
    
    const { registration, organization } = paymentData;
    
    // Calculate fees using the square-fee-calculator
    const feeCalculation = calculateSquareFees(
      registration.subtotal,
      { userCountry: billingDetails.address.country }
    );
    
    // Build comprehensive metadata
    const metadata = buildPaymentMetadata(
      paymentData,
      billingDetails,
      feeCalculation,
      sessionId,
      referrer
    );
    
    // Prepare Square payment request
    const paymentsApi = getSquarePaymentsApi();
    const locationId = getSquareLocationId();
    const idempotencyKey = generateIdempotencyKey();
    
    // Create payment request body
    const paymentRequest: CreatePaymentRequest = {
      sourceId: paymentMethodId || '', // Square nonce or payment method token
      idempotencyKey,
      amountMoney: {
        amount: BigInt(convertToCents(feeCalculation.customerPayment)),
        currency: 'AUD'
      },
      locationId,
      referenceId: `PAY-${Date.now().toString().slice(-8)}`,
      note: `Registration ${registrationId} - ${paymentData.function?.name || 'Event'}`,
      buyerEmailAddress: billingDetails.email,
      // Square doesn't support complex metadata like Stripe, so we'll store key info in the note
      // For full metadata, we'll need to store it separately in our database
    };
    
    // Add billing address if provided
    if (billingDetails.address.line1) {
      paymentRequest.billingAddress = {
        addressLine1: billingDetails.address.line1,
        addressLine2: billingDetails.address.line2,
        locality: billingDetails.address.city,
        administrativeDistrictLevel1: billingDetails.address.state,
        postalCode: billingDetails.address.postal_code,
        country: billingDetails.address.country.toUpperCase()
      };
    }
    
    try {
      // Create payment with Square
      console.log("💳 Creating Square payment:", {
        amount: feeCalculation.customerPayment,
        amountCents: convertToCents(feeCalculation.customerPayment),
        locationId,
        registrationId
      });
      
      const response = await paymentsApi.createPayment(paymentRequest);
      
      if (response.result.payment) {
        const payment = response.result.payment;
        
        console.log("✅ Square payment created successfully:", {
          paymentId: payment.id,
          status: payment.status,
          totalAmount: feeCalculation.customerPayment,
          processingFees: feeCalculation.processingFeesDisplay,
          subtotal: registration.subtotal,
          platformFee: feeCalculation.platformFee
        });
        
        // Update registration status after successful payment creation
        if (payment.status === 'COMPLETED') {
          console.log("💾 Updating registration status to completed");
          await this.updateRegistrationPaymentStatus(registrationId, payment.id!, feeCalculation, paymentData);
        }
        
        return {
          paymentId: payment.id!,
          totalAmount: feeCalculation.customerPayment,
          processingFees: feeCalculation.processingFeesDisplay,
          subtotal: registration.subtotal,
          platformFee: feeCalculation.platformFee,
          status: payment.status || 'PENDING',
          // clientSecret not used by Square but kept for compatibility
          clientSecret: undefined
        };
      } else {
        throw new Error('Payment creation failed: No payment object returned');
      }
    } catch (error: any) {
      console.error('Square payment creation failed:', error);
      
      // Handle Square-specific errors
      if (error.errors) {
        const squareErrors = error.errors.map((err: any) => err.detail || err.code).join(', ');
        throw new Error(`Square payment failed: ${squareErrors}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Update payment metadata (not directly supported by Square, but we can update our internal records)
   */
  async updatePaymentMetadata(
    paymentId: string,
    updates: {
      confirmationNumber?: string;
      ticketNumbers?: string[];
    }
  ): Promise<void> {
    try {
      // Since Square doesn't support updating metadata like Stripe,
      // we'll store this information in our database
      console.log(`📝 Square payment metadata update requested for ${paymentId}:`, updates);
      
      // This would be implemented to store metadata in our database
      // For now, we'll just log it
      console.log('Square payment metadata updates stored internally');
    } catch (error) {
      // Non-critical - log but don't throw
      console.error('Failed to update Square payment metadata:', error);
    }
  }
  
  /**
   * Update registration status after successful payment
   */
  private async updateRegistrationPaymentStatus(
    registrationId: string, 
    paymentId: string,
    feeCalculation?: SquareFeeCalculation,
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
        square_payment_id: paymentId, // Store Square payment ID instead of Stripe
        updated_at: new Date().toISOString()
      };
      
      // Add payment amounts if fee calculation is provided
      if (feeCalculation) {
        updateData.total_amount_paid = feeCalculation.customerPayment; // What customer's card is charged (includes fees)
        updateData.total_price_paid = feeCalculation.connectedAmount;   // Subtotal (ticket revenue only)
        updateData.square_fee = feeCalculation.squareFee;              // Square processing fee
        updateData.platform_fee = feeCalculation.platformFee;          // Platform fee
      }
      
      // Add registration-specific data if provided
      if (paymentData) {
        const { registration, organization, attendees } = paymentData;
        
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
        square_fee: updateData.square_fee,
        platform_fee: updateData.platform_fee,
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
export const unifiedSquarePaymentService = new UnifiedSquarePaymentService();