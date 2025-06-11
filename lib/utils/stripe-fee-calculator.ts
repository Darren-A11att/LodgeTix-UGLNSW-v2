/**
 * Stripe Fee Calculator Utility - Complete Overhaul
 * Handles calculation of Stripe transaction fees with correct Connect implementation
 * 
 * Key Features:
 * - Guarantees connected accounts receive exact subtotal amounts
 * - Platform fee capping with environment configuration
 * - Geolocation-based domestic vs international fee determination
 * - Correct fee calculation formula for Stripe Connect transfer_data[amount]
 */

export interface StripeFeeCalculation {
  /** The amount the connected account will receive (guaranteed) */
  connectedAmount: number;
  /** Platform fee charged (capped at configured maximum) */
  platformFee: number;
  /** Stripe processing fee */
  stripeFee: number;
  /** Total amount the customer will pay */
  customerPayment: number;
  /** Processing fees shown to customer (stripeFee + platformFee) */
  processingFeesDisplay: number;
  /** Whether domestic or international rates were used */
  isDomestic: boolean;
  /** Breakdown for debugging */
  breakdown: {
    platformFeePercentage: number;
    platformFeeCap: number;
    stripePercentage: number;
    stripeFixed: number;
  };
}

export interface FeeCalculatorOptions {
  /** ISO country code (e.g., 'AU', 'US', 'GB') */
  userCountry?: string;
  /** Override platform fee percentage (uses env var if not provided) */
  platformFeePercentage?: number;
  /** Override platform fee cap (uses env var if not provided) */
  platformFeeCap?: number;
  /** Override domestic determination */
  isDomestic?: boolean;
}

// Australian Stripe fee rates
const STRIPE_RATES = {
  domestic: {
    percentage: 0.017, // 1.7%
    fixed: 0.30, // $0.30 AUD
    description: "1.7% + $0.30 AUD (Australian cards)"
  },
  international: {
    percentage: 0.035, // 3.5%
    fixed: 0.30, // $0.30 AUD
    description: "3.5% + $0.30 AUD (International cards)"
  }
} as const;

/**
 * Get platform fee configuration from environment variables
 */
function getPlatformFeeConfig(): { percentage: number; cap: number } {
  const percentage = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0.02');
  const cap = parseFloat(process.env.STRIPE_PLATFORM_FEE_CAP || '20');
  
  return { 
    percentage: isNaN(percentage) ? 0.02 : percentage,
    cap: isNaN(cap) ? 20 : cap
  };
}

/**
 * Determine if a card should be treated as domestic based on user's country
 */
function isDomesticCard(userCountry?: string): boolean {
  if (!userCountry) return false; // Default to international for safety
  return userCountry.toUpperCase() === 'AU';
}

/**
 * Calculate platform fee with capping
 */
function calculatePlatformFee(
  connectedAmount: number, 
  percentage: number, 
  cap: number
): number {
  const calculatedFee = connectedAmount * percentage;
  return Math.min(calculatedFee, cap);
}

/**
 * MAIN FUNCTION: Calculate Stripe fees using the correct formula
 * 
 * Formula: Total = (ConnectedAmount + PlatformFee + StripeFlatFee) ÷ (1 - StripeRate)
 * 
 * This ensures:
 * - Connected account gets exactly the subtotal via transfer_data[amount]
 * - Platform gets exactly their desired percentage (2% capped at $20)
 * - Customer pays the correct total that covers all fees
 * - Stripe takes their fee from the total amount
 * 
 * For Stripe payment intent:
 * - amount: total customer payment
 * - on_behalf_of: connected account ID
 * - application_fee_amount: platform fee + stripe fee
 * - transfer_data.amount: exact subtotal (connected account revenue)
 * - transfer_data.destination: same as on_behalf_of
 */
export function calculateStripeFees(
  connectedAmount: number,
  options: FeeCalculatorOptions = {}
): StripeFeeCalculation {
  // Get configuration
  const platformConfig = getPlatformFeeConfig();
  const platformFeePercentage = options.platformFeePercentage ?? platformConfig.percentage;
  const platformFeeCap = options.platformFeeCap ?? platformConfig.cap;
  
  // Determine if domestic or international
  const isDomestic = options.isDomestic ?? isDomesticCard(options.userCountry);
  const stripeRates = isDomestic ? STRIPE_RATES.domestic : STRIPE_RATES.international;
  
  // Calculate platform fee with capping
  const platformFee = calculatePlatformFee(connectedAmount, platformFeePercentage, platformFeeCap);
  
  // Use the CORRECT formula:
  // Total = (ConnectedAmount + PlatformFee + StripeFlatFee) ÷ (1 - StripeRate)
  
  // Step 1: Calculate numerator
  const numerator = connectedAmount + platformFee + stripeRates.fixed;
  
  // Step 2: Calculate denominator
  const denominator = 1 - stripeRates.percentage;
  
  // Step 3: Calculate total customer payment
  const customerPayment = numerator / denominator;
  
  // Step 4: Calculate actual Stripe fee
  // Stripe takes: (percentage of total) + fixed fee
  const stripeFee = (customerPayment * stripeRates.percentage) + stripeRates.fixed;
  
  // Processing fees display (what customer sees as "Processing fees")
  // This is the application_fee_amount that includes both platform fee and stripe fees
  const processingFeesDisplay = customerPayment - connectedAmount;
  
  return {
    connectedAmount: Number(connectedAmount.toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
    stripeFee: Number(stripeFee.toFixed(2)),
    customerPayment: Number(customerPayment.toFixed(2)),
    processingFeesDisplay: Number(processingFeesDisplay.toFixed(2)),
    isDomestic,
    breakdown: {
      platformFeePercentage,
      platformFeeCap,
      stripePercentage: stripeRates.percentage,
      stripeFixed: stripeRates.fixed,
    }
  };
}

/**
 * Convenience function for calculating fees with geolocation
 */
export function calculateFeesWithGeolocation(
  connectedAmount: number,
  userCountry?: string
): StripeFeeCalculation {
  return calculateStripeFees(connectedAmount, { userCountry });
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use calculateStripeFees instead
 */
export function calculateAbsorbedStripeFee(
  amount: number,
  isDomestic: boolean = true
): number {
  const rates = isDomestic ? STRIPE_RATES.domestic : STRIPE_RATES.international;
  return Number((amount * rates.percentage + rates.fixed).toFixed(2));
}

/**
 * Format fee breakdown for UI display
 */
export function formatFeeBreakdown(calculation: StripeFeeCalculation): {
  subtotal: string;
  processingFees: string;
  total: string;
  feeType: string;
} {
  return {
    subtotal: `$${calculation.connectedAmount.toFixed(2)}`,
    processingFees: `$${calculation.processingFeesDisplay.toFixed(2)}`,
    total: `$${calculation.customerPayment.toFixed(2)}`,
    feeType: calculation.isDomestic ? 'Processing fees' : 'International processing fees'
  };
}

/**
 * Get detailed fee explanation
 */
export function getFeeExplanation(calculation: StripeFeeCalculation): string {
  const platformFeeFormatted = `$${calculation.platformFee.toFixed(2)}`;
  const stripeFeeFormatted = `$${calculation.stripeFee.toFixed(2)}`;
  const feeType = calculation.isDomestic ? 'domestic' : 'international';
  
  return `Processing fees include platform fee (${platformFeeFormatted}) and ${feeType} Stripe fees (${stripeFeeFormatted}). This ensures the event organizer receives the full ticket price.`;
}

/**
 * Validate fee calculation (for testing and debugging)
 */
export function validateFeeCalculation(calculation: StripeFeeCalculation): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check that customer payment equals connected amount + platform fee + stripe fee
  const expectedTotal = calculation.connectedAmount + calculation.platformFee + calculation.stripeFee;
  const actualTotal = calculation.customerPayment;
  const tolerance = 0.01; // 1 cent tolerance for rounding
  
  if (Math.abs(expectedTotal - actualTotal) > tolerance) {
    errors.push(`Total mismatch: expected ${expectedTotal.toFixed(2)}, got ${actualTotal.toFixed(2)}`);
  }
  
  // Check processing fees display
  const expectedProcessingFees = calculation.customerPayment - calculation.connectedAmount;
  if (Math.abs(expectedProcessingFees - calculation.processingFeesDisplay) > tolerance) {
    errors.push(`Processing fees display mismatch`);
  }
  
  // Check platform fee cap
  const { percentage, cap } = getPlatformFeeConfig();
  const maxAllowedPlatformFee = Math.min(calculation.connectedAmount * percentage, cap);
  if (calculation.platformFee > maxAllowedPlatformFee + tolerance) {
    errors.push(`Platform fee exceeds cap: ${calculation.platformFee} > ${maxAllowedPlatformFee}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get fee configuration for display
 */
export function getFeeConfiguration(): {
  platformFeePercentage: number;
  platformFeeCap: number;
  domesticRates: typeof STRIPE_RATES.domestic;
  internationalRates: typeof STRIPE_RATES.international;
} {
  const config = getPlatformFeeConfig();
  return {
    platformFeePercentage: config.percentage,
    platformFeeCap: config.cap,
    domesticRates: STRIPE_RATES.domestic,
    internationalRates: STRIPE_RATES.international
  };
}

/**
 * Get fee mode from environment
 */
export function getFeeModeFromEnv(): 'pass_to_customer' | 'absorb' {
  const mode = process.env.NEXT_PUBLIC_STRIPE_FEE_MODE;
  return mode === 'absorb' ? 'absorb' : 'pass_to_customer';
}

/**
 * Get platform fee percentage from environment
 */
export function getPlatformFeePercentage(): number {
  return getPlatformFeeConfig().percentage;
}

/**
 * Get platform fee cap from environment
 */
export function getPlatformFeeCap(): number {
  return getPlatformFeeConfig().cap;
}

/**
 * Determine if a card should be treated as domestic (for external use)
 */
export { isDomesticCard };

/**
 * Get the appropriate fee label based on domestic/international status
 */
export function getProcessingFeeLabel(isDomestic: boolean): string {
  return isDomestic ? 'Processing fees' : 'International processing fees';
}

/**
 * Get fee disclaimer text
 */
export function getFeeDisclaimer(): string {
  return "Processing fees are added to cover payment processing costs. This ensures the full amount goes to the event organizer.";
}

// Export rate constants for external use
export { STRIPE_RATES };

// Type exports
export type { FeeCalculatorOptions };