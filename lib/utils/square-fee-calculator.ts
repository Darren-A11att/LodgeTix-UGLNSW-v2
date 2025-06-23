/**
 * Square Fee Calculator Utility
 * Handles calculation of Square transaction fees with platform fee implementation
 * 
 * Key Features:
 * - Guarantees connected accounts receive exact subtotal amounts
 * - Platform fee capping with environment configuration
 * - Geolocation-based domestic vs international fee determination
 * - Correct fee calculation formula for Square payments
 */

export interface SquareFeeCalculation {
  /** The amount the connected account will receive (guaranteed) */
  connectedAmount: number;
  /** Platform fee charged (capped at configured maximum) */
  platformFee: number;
  /** Square processing fee */
  squareFee: number;
  /** Total amount the customer will pay */
  customerPayment: number;
  /** Processing fees shown to customer (squareFee + platformFee) */
  processingFeesDisplay: number;
  /** Whether domestic or international rates were used */
  isDomestic: boolean;
  /** Breakdown for debugging */
  breakdown: {
    platformFeePercentage: number;
    platformFeeCap: number;
    platformFeeMinimum: number;
    squarePercentage: number;
    squareFixed: number;
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

// Australian Square fee rates
const SQUARE_RATES = {
  domestic: {
    percentage: 0.022, // 2.2%
    fixed: 0.00, // No fixed fee
    description: "2.2% (Australian cards)"
  },
  international: {
    percentage: 0.022, // 2.2%
    fixed: 0.00, // No fixed fee
    description: "2.2% (International cards)"
  }
} as const;

/**
 * Get platform fee configuration from environment variables
 */
function getPlatformFeeConfig(): { percentage: number; cap: number; minimum: number } {
  const percentage = parseFloat(process.env.SQUARE_PLATFORM_FEE_PERCENTAGE || process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '0.02');
  const cap = parseFloat(process.env.SQUARE_PLATFORM_FEE_CAP || process.env.STRIPE_PLATFORM_FEE_CAP || '20');
  const minimum = parseFloat(process.env.SQUARE_PLATFORM_FEE_MINIMUM || process.env.STRIPE_PLATFORM_FEE_MINIMUM || '1');
  
  return { 
    percentage: isNaN(percentage) ? 0.02 : percentage,
    cap: isNaN(cap) ? 20 : cap,
    minimum: isNaN(minimum) ? 1 : minimum
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
 * Calculate platform fee with minimum and maximum capping
 */
function calculatePlatformFee(
  connectedAmount: number, 
  percentage: number, 
  cap: number,
  minimum: number
): number {
  const calculatedFee = connectedAmount * percentage;
  return Math.max(minimum, Math.min(calculatedFee, cap));
}

/**
 * MAIN FUNCTION: Calculate Square fees using the correct formula
 * 
 * Formula: Total = (ConnectedAmount + PlatformFee + SquareFlatFee) ÷ (1 - SquareRate)
 * 
 * This ensures:
 * - Connected account gets exactly the subtotal
 * - Platform gets exactly their desired fee (2% with $1 minimum, capped at $20)
 * - Customer pays the correct total that covers all fees
 * - Square takes their fee from the total amount
 */
export function calculateSquareFees(
  connectedAmount: number,
  options: FeeCalculatorOptions = {}
): SquareFeeCalculation {
  // Get configuration
  const platformConfig = getPlatformFeeConfig();
  const platformFeePercentage = options.platformFeePercentage ?? platformConfig.percentage;
  const platformFeeCap = options.platformFeeCap ?? platformConfig.cap;
  const platformFeeMinimum = platformConfig.minimum;
  
  // Determine if domestic or international
  const isDomestic = options.isDomestic ?? isDomesticCard(options.userCountry);
  const squareRates = isDomestic ? SQUARE_RATES.domestic : SQUARE_RATES.international;
  
  // Calculate platform fee with minimum and maximum capping
  const platformFee = calculatePlatformFee(connectedAmount, platformFeePercentage, platformFeeCap, platformFeeMinimum);
  
  // Use the CORRECT formula:
  // Total = (ConnectedAmount + PlatformFee + SquareFlatFee) ÷ (1 - SquareRate)
  
  // Step 1: Calculate numerator
  const numerator = connectedAmount + platformFee + squareRates.fixed;
  
  // Step 2: Calculate denominator
  const denominator = 1 - squareRates.percentage;
  
  // Step 3: Calculate total customer payment
  const customerPayment = numerator / denominator;
  
  // Step 4: Calculate actual Square fee
  // Square takes: (percentage of total) + fixed fee
  const squareFee = (customerPayment * squareRates.percentage) + squareRates.fixed;
  
  // Processing fees display (what customer sees as "Processing fees")
  const processingFeesDisplay = customerPayment - connectedAmount;
  
  return {
    connectedAmount: Number(connectedAmount.toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
    squareFee: Number(squareFee.toFixed(2)),
    customerPayment: Number(customerPayment.toFixed(2)),
    processingFeesDisplay: Number(processingFeesDisplay.toFixed(2)),
    isDomestic,
    breakdown: {
      platformFeePercentage,
      platformFeeCap,
      platformFeeMinimum,
      squarePercentage: squareRates.percentage,
      squareFixed: squareRates.fixed,
    }
  };
}

/**
 * Convenience function for calculating fees with geolocation
 */
export function calculateFeesWithGeolocation(
  connectedAmount: number,
  userCountry?: string
): SquareFeeCalculation {
  return calculateSquareFees(connectedAmount, { userCountry });
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use calculateSquareFees instead
 */
export function calculateAbsorbedSquareFee(
  amount: number,
  isDomestic: boolean = true
): number {
  const rates = isDomestic ? SQUARE_RATES.domestic : SQUARE_RATES.international;
  return Number((amount * rates.percentage + rates.fixed).toFixed(2));
}

/**
 * Format fee breakdown for UI display
 */
export function formatFeeBreakdown(calculation: SquareFeeCalculation): {
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
export function getFeeExplanation(calculation: SquareFeeCalculation): string {
  const platformFeeFormatted = `$${calculation.platformFee.toFixed(2)}`;
  const squareFeeFormatted = `$${calculation.squareFee.toFixed(2)}`;
  const feeType = calculation.isDomestic ? 'domestic' : 'international';
  
  return `Processing fees include platform fee (${platformFeeFormatted}) and ${feeType} Square fees (${squareFeeFormatted}). This ensures the event organizer receives the full ticket price.`;
}

/**
 * Validate fee calculation (for testing and debugging)
 */
export function validateFeeCalculation(calculation: SquareFeeCalculation): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check that customer payment equals connected amount + platform fee + square fee
  const expectedTotal = calculation.connectedAmount + calculation.platformFee + calculation.squareFee;
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
  
  // Check platform fee cap and minimum
  const { percentage, cap, minimum } = getPlatformFeeConfig();
  const calculatedFee = calculation.connectedAmount * percentage;
  const expectedPlatformFee = Math.max(minimum, Math.min(calculatedFee, cap));
  if (Math.abs(calculation.platformFee - expectedPlatformFee) > tolerance) {
    errors.push(`Platform fee calculation mismatch: expected ${expectedPlatformFee}, got ${calculation.platformFee}`);
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
  platformFeeMinimum: number;
  domesticRates: typeof SQUARE_RATES.domestic;
  internationalRates: typeof SQUARE_RATES.international;
} {
  const config = getPlatformFeeConfig();
  return {
    platformFeePercentage: config.percentage,
    platformFeeCap: config.cap,
    platformFeeMinimum: config.minimum,
    domesticRates: SQUARE_RATES.domestic,
    internationalRates: SQUARE_RATES.international
  };
}

/**
 * Get fee mode from environment
 */
export function getFeeModeFromEnv(): 'pass_to_customer' | 'absorb' {
  const mode = process.env.NEXT_PUBLIC_SQUARE_FEE_MODE || process.env.NEXT_PUBLIC_STRIPE_FEE_MODE;
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
export { SQUARE_RATES };

// Type exports
export type { FeeCalculatorOptions };

/**
 * NEW DATABASE-DRIVEN FUNCTION
 * Calculate Square fees using database configuration
 * This will replace the environment variable-based calculation
 */
export async function calculateSquareFeesWithDb(
  connectedAmount: number,
  options: FeeCalculatorOptions = {}
): Promise<SquareFeeCalculation> {
  try {
    // Import payment gateway service (server-side only)
    const { paymentGatewayService } = await import('../services/payment-gateway-service');
    
    // Fetch fee configuration from database
    const feeConfig = await paymentGatewayService.getFeeCalculationValues();
    
    console.log('[calculateSquareFeesWithDb] Fee config from database:', JSON.stringify(feeConfig, null, 2));
    
    // Handle absorb mode - customer pays only the subtotal
    if (feeConfig.fee_mode === 'absorb') {
      return {
        connectedAmount: Number(connectedAmount.toFixed(2)),
        platformFee: 0,
        squareFee: 0,
        customerPayment: Number(connectedAmount.toFixed(2)),
        processingFeesDisplay: 0,
        isDomestic: options.isDomestic ?? true,
        breakdown: {
          platformFeePercentage: 0,
          platformFeeCap: 0,
          platformFeeMinimum: 0,
          squarePercentage: 0,
          squareFixed: 0,
        }
      };
    }
    
    // Determine if domestic or international
    const isDomestic = options.isDomestic ?? isDomesticCard(options.userCountry);
    
    // Select appropriate rates based on card type
    const cardPercentage = isDomestic 
      ? feeConfig.domestic_card_percentage 
      : feeConfig.international_card_percentage;
    const cardFixed = isDomestic 
      ? feeConfig.domestic_card_fixed 
      : feeConfig.international_card_fixed;
    
    // Calculate platform fee with minimum and maximum capping
    const platformFee = calculatePlatformFee(
      connectedAmount, 
      feeConfig.platform_fee_percentage, 
      feeConfig.platform_fee_cap,
      feeConfig.platform_fee_min
    );
    
    console.log('[calculateSquareFeesWithDb] Fee calculation details:', {
      connectedAmount,
      isDomestic,
      platformFeePercentage: feeConfig.platform_fee_percentage,
      platformFee,
      cardPercentage,
      cardFixed
    });
    
    // Use the CORRECT formula:
    // Total = (ConnectedAmount + PlatformFee + CardFixedFee) ÷ (1 - CardRate)
    
    // Step 1: Calculate numerator
    const numerator = connectedAmount + platformFee + cardFixed;
    
    // Step 2: Calculate denominator
    const denominator = 1 - cardPercentage;
    
    // Step 3: Calculate total customer payment
    const customerPayment = numerator / denominator;
    
    // Step 4: Calculate actual card processing fee
    const cardProcessingFee = (customerPayment * cardPercentage) + cardFixed;
    
    // Processing fees display (what customer sees as "Processing fees")
    const processingFeesDisplay = customerPayment - connectedAmount;
    
    return {
      connectedAmount: Number(connectedAmount.toFixed(2)),
      platformFee: Number(platformFee.toFixed(2)),
      squareFee: Number(cardProcessingFee.toFixed(2)),
      customerPayment: Number(customerPayment.toFixed(2)),
      processingFeesDisplay: Number(processingFeesDisplay.toFixed(2)),
      isDomestic,
      breakdown: {
        platformFeePercentage: feeConfig.platform_fee_percentage,
        platformFeeCap: feeConfig.platform_fee_cap,
        platformFeeMinimum: feeConfig.platform_fee_min,
        squarePercentage: cardPercentage,
        squareFixed: cardFixed,
      }
    };
  } catch (error) {
    console.error('Failed to calculate fees with database configuration:', error);
    throw new Error(`Failed to calculate fees: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}