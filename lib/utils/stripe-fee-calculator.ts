import { z } from 'zod';

export interface StripeFeeCalculation {
  subtotal: number;
  stripeFee: number;
  platformFee: number;
  total: number;
  organizationReceives: number;
}

/**
 * Calculate Stripe transaction fees that will be passed to the customer
 * This ensures the organization receives the full ticket price
 * 
 * Note: This uses standard Stripe pricing - actual fees may vary based on:
 * - Card type (domestic/international)
 * - Connected account pricing
 * - Negotiated rates
 */
export function calculateStripeFees(
  subtotal: number,
  options: {
    isDomestic?: boolean;
    platformFeePercentage?: number;
  } = {}
): StripeFeeCalculation {
  const {
    isDomestic = true, // Assume domestic by default
    platformFeePercentage = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0.05') // 5% default
  } = options;
  
  // Stripe fee rates for Australia
  const stripePercentage = isDomestic ? 0.0175 : 0.029; // 1.75% or 2.9%
  const stripeFixedFee = 0.30; // $0.30 AUD
  
  // Calculate fees
  // For pass-through fees, we need to solve: total = (subtotal + fee) where fee = total * % + fixed
  // Rearranging: total = (subtotal + fixed) / (1 - percentage)
  const totalWithStripeFee = (subtotal + stripeFixedFee) / (1 - stripePercentage);
  const stripeFee = totalWithStripeFee - subtotal;
  
  // Platform fee is calculated on the subtotal (paid by organization from their revenue)
  const platformFee = subtotal * platformFeePercentage;
  
  // Total amount customer pays (includes Stripe fee but not platform fee)
  const total = totalWithStripeFee;
  
  // Amount organization receives after platform fee (but before Stripe processes it)
  const organizationReceives = subtotal - platformFee;
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    stripeFee: Number(stripeFee.toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
    total: Number(total.toFixed(2)),
    organizationReceives: Number(organizationReceives.toFixed(2))
  };
}

/**
 * Format fee for display
 */
export function formatFeeBreakdown(calculation: StripeFeeCalculation): {
  subtotal: string;
  processingFee: string;
  total: string;
} {
  return {
    subtotal: `$${calculation.subtotal.toFixed(2)}`,
    processingFee: `$${calculation.stripeFee.toFixed(2)}`,
    total: `$${calculation.total.toFixed(2)}`
  };
}

/**
 * Get fee disclaimer text
 */
export function getFeeDisclaimer(): string {
  return "A processing fee is added to cover payment processing costs. This ensures the full ticket price goes to the event organizer.";
}

/**
 * Get short fee disclaimer
 */
export function getShortFeeDisclaimer(): string {
  return "Includes payment processing fee";
}

/**
 * Calculate fee for display purposes (before having exact card type)
 * Shows the domestic rate by default with a note about potential variation
 */
export function getEstimatedFeeDisplay(subtotal: number): {
  calculation: StripeFeeCalculation;
  disclaimer: string;
} {
  const calculation = calculateStripeFees(subtotal, { isDomestic: true });
  
  return {
    calculation,
    disclaimer: "Processing fee shown is for Australian cards. International cards may incur a slightly higher fee."
  };
}

/**
 * Validate that amounts match expected values (for security)
 */
export function validateFeeCalculation(
  subtotal: number,
  total: number,
  isDomestic: boolean = true
): boolean {
  const calculated = calculateStripeFees(subtotal, { isDomestic });
  
  // Allow for small rounding differences (1 cent)
  return Math.abs(calculated.total - total) < 0.02;
}

// Export fee configuration for transparency
export const STRIPE_FEE_CONFIG = {
  domestic: {
    percentage: 0.0175,
    fixed: 0.30,
    description: "1.75% + $0.30 AUD"
  },
  international: {
    percentage: 0.029,
    fixed: 0.30,
    description: "2.9% + $0.30 AUD"
  }
};