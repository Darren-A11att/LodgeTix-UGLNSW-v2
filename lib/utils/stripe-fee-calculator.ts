/**
 * Stripe Fee Calculator Utility
 * Handles calculation of Stripe transaction fees for Australian accounts
 */

export interface StripeFeeCalculation {
  subtotal: number;
  stripeFee: number;
  platformFee: number;
  total: number;
}

export interface FeeCalculatorOptions {
  isDomestic?: boolean;
  platformFeePercentage?: number;
  feeMode?: 'pass_to_customer' | 'absorb';
}

// Australian Stripe fee rates
const STRIPE_RATES = {
  domestic: {
    percentage: 0.0175, // 1.75%
    fixed: 0.30 // $0.30 AUD
  },
  international: {
    percentage: 0.029, // 2.9%
    fixed: 0.30 // $0.30 AUD
  }
} as const;

// Stripe fee configuration with descriptions
export const STRIPE_FEE_CONFIG = {
  domestic: {
    percentage: STRIPE_RATES.domestic.percentage,
    fixed: STRIPE_RATES.domestic.fixed,
    description: "1.75% + $0.30 AUD"
  },
  international: {
    percentage: STRIPE_RATES.international.percentage,
    fixed: STRIPE_RATES.international.fixed,
    description: "2.9% + $0.30 AUD"
  }
} as const;

/**
 * Calculate Stripe transaction fees
 * Note: This uses standard Stripe pricing - actual fees may vary based on:
 * - Card type (domestic/international)
 * - Connected account pricing
 * - Negotiated rates
 */
export function calculateStripeFees(
  subtotal: number,
  options: FeeCalculatorOptions = {}
): StripeFeeCalculation {
  const {
    isDomestic = true, // Assume domestic by default
    platformFeePercentage = 0.05, // 5% platform fee
    feeMode = 'pass_to_customer'
  } = options;
  
  // Select appropriate Stripe fee rates
  const rates = isDomestic ? STRIPE_RATES.domestic : STRIPE_RATES.international;
  
  let stripeFee: number;
  let total: number;
  
  if (feeMode === 'pass_to_customer') {
    // Calculate fees to pass to customer
    // For pass-through fees, we need to solve: total = (subtotal + fee) where fee = total * % + fixed
    // Rearranging: total = (subtotal + fixed) / (1 - percentage)
    total = (subtotal + rates.fixed) / (1 - rates.percentage);
    stripeFee = total - subtotal;
  } else {
    // Absorb fees - customer pays subtotal only
    stripeFee = subtotal * rates.percentage + rates.fixed;
    total = subtotal;
  }
  
  // Platform fee is calculated on the subtotal
  const platformFee = subtotal * platformFeePercentage;
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    stripeFee: Number(stripeFee.toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
    total: Number(total.toFixed(2))
  };
}

/**
 * Calculate the Stripe fee for a given amount (for absorbed fees)
 */
export function calculateAbsorbedStripeFee(
  amount: number,
  isDomestic: boolean = true
): number {
  const rates = isDomestic ? STRIPE_RATES.domestic : STRIPE_RATES.international;
  return Number((amount * rates.percentage + rates.fixed).toFixed(2));
}

/**
 * Format fee for display
 */
export function formatFeeBreakdown(calculation: StripeFeeCalculation): string[] {
  return [
    `Subtotal: $${calculation.subtotal.toFixed(2)}`,
    `Processing Fee: $${calculation.stripeFee.toFixed(2)}`,
    `Total: $${calculation.total.toFixed(2)}`
  ];
}

/**
 * Get fee disclaimer text
 */
export function getFeeDisclaimer(): string {
  return "A processing fee is added to cover payment processing costs. This ensures the full ticket price goes to the event organizer.";
}

/**
 * Get fee explanation for different fee modes
 */
export function getFeeExplanation(feeMode: 'pass_to_customer' | 'absorb' = 'pass_to_customer'): string {
  if (feeMode === 'pass_to_customer') {
    return "Payment processing fees are added to ensure event organizers receive the full ticket price.";
  }
  return "The ticket price shown is the final amount you'll pay. Processing fees are covered by the event organizer.";
}

/**
 * Parse fee mode from environment or default
 */
export function getFeeModeFromEnv(): 'pass_to_customer' | 'absorb' {
  const mode = process.env.NEXT_PUBLIC_STRIPE_FEE_MODE;
  return mode === 'absorb' ? 'absorb' : 'pass_to_customer';
}

/**
 * Get platform fee percentage from environment or default
 */
export function getPlatformFeePercentage(): number {
  const percentage = process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE;
  return percentage ? parseFloat(percentage) : 0.05; // Default 5%
}