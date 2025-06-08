import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  calculateStripeFees, 
  calculateFeesWithGeolocation,
  validateFeeCalculation,
  formatFeeBreakdown,
  getFeeExplanation,
  getFeeConfiguration,
  getPlatformFeePercentage,
  getPlatformFeeCap,
  isDomesticCard,
  getProcessingFeeLabel,
  STRIPE_RATES
} from '../stripe-fee-calculator';

// Mock environment variables
const originalEnv = process.env;

describe('Stripe Fee Calculator - Complete Overhaul', () => {
  beforeEach(() => {
    // Reset environment variables for each test
    process.env = { ...originalEnv };
    process.env.STRIPE_PLATFORM_FEE_PERCENTAGE = '0.02'; // 2%
    process.env.STRIPE_PLATFORM_FEE_CAP = '20'; // $20 cap
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Basic Fee Calculation', () => {
    it('calculates domestic fees correctly for small order', () => {
      const result = calculateStripeFees(500, { isDomestic: true });
      
      // For $500 order:
      // Platform fee = min($500 * 0.02, $20) = $10
      // Customer payment = (($500 + $10) + $0.30) / (1 - 0.017) = $519.13
      // Stripe fee = $519.13 * 0.017 + $0.30 = $9.13
      // Processing fees = $519.13 - $500 = $19.13
      
      expect(result.connectedAmount).toBe(500);
      expect(result.platformFee).toBe(10);
      expect(result.customerPayment).toBeCloseTo(519.13, 2);
      expect(result.stripeFee).toBeCloseTo(9.13, 2);
      expect(result.processingFeesDisplay).toBeCloseTo(19.13, 2);
      expect(result.isDomestic).toBe(true);
      
      // Validate the calculation
      const validation = validateFeeCalculation(result);
      expect(validation.isValid).toBe(true);
    });

    it('calculates domestic fees correctly for large order with platform fee cap', () => {
      const result = calculateStripeFees(2300, { isDomestic: true });
      
      // For $2,300 order:
      // Platform fee = min($2,300 * 0.02, $20) = $20 (capped)
      // Customer payment = (($2,300 + $20) + $0.30) / (1 - 0.017) = $2,360.43
      // Stripe fee = $2,360.43 * 0.017 + $0.30 = $40.43
      // Processing fees = $2,360.43 - $2,300 = $60.43
      
      expect(result.connectedAmount).toBe(2300);
      expect(result.platformFee).toBe(20); // Capped at $20
      expect(result.customerPayment).toBeCloseTo(2360.43, 2);
      expect(result.stripeFee).toBeCloseTo(40.43, 2);
      expect(result.processingFeesDisplay).toBeCloseTo(60.43, 2);
      expect(result.isDomestic).toBe(true);
      
      // Validate the calculation
      const validation = validateFeeCalculation(result);
      expect(validation.isValid).toBe(true);
    });

    it('calculates international fees correctly', () => {
      const result = calculateStripeFees(2300, { isDomestic: false });
      
      // For $2,300 order with international rates (3.5%):
      // Platform fee = min($2,300 * 0.02, $20) = $20 (capped)
      // Customer payment = (($2,300 + $20) + $0.30) / (1 - 0.035) = $2,404.46
      // Stripe fee = $2,404.46 * 0.035 + $0.30 = $84.46
      // Processing fees = $2,404.46 - $2,300 = $104.46
      
      expect(result.connectedAmount).toBe(2300);
      expect(result.platformFee).toBe(20); // Capped at $20
      expect(result.customerPayment).toBeCloseTo(2404.46, 2);
      expect(result.stripeFee).toBeCloseTo(84.46, 2);
      expect(result.processingFeesDisplay).toBeCloseTo(104.46, 2);
      expect(result.isDomestic).toBe(false);
      
      // Validate the calculation
      const validation = validateFeeCalculation(result);
      expect(validation.isValid).toBe(true);
    });

    it('handles very large orders where platform fee would exceed cap', () => {
      const result = calculateStripeFees(5000, { isDomestic: true });
      
      // For $5,000 order:
      // Platform fee = min($5,000 * 0.02, $20) = $20 (capped, not $100)
      expect(result.connectedAmount).toBe(5000);
      expect(result.platformFee).toBe(20); // Capped, not $100
      
      // Customer should pay less because platform fee is capped
      expect(result.customerPayment).toBeLessThan(5000 + 100 + 50); // Much less than uncapped
      
      const validation = validateFeeCalculation(result);
      expect(validation.isValid).toBe(true);
    });

    it('handles edge case of zero amount', () => {
      const result = calculateStripeFees(0, { isDomestic: true });
      
      expect(result.connectedAmount).toBe(0);
      expect(result.platformFee).toBe(0);
      expect(result.customerPayment).toBeCloseTo(0.31, 2); // Just the fixed fee
      expect(result.stripeFee).toBeCloseTo(0.31, 2);
      
      const validation = validateFeeCalculation(result);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Platform Fee Capping', () => {
    it('applies platform fee percentage for small amounts', () => {
      const amounts = [100, 500, 750]; // All should be under $20 cap
      
      amounts.forEach(amount => {
        const result = calculateStripeFees(amount, { isDomestic: true });
        const expectedPlatformFee = amount * 0.02; // 2%
        
        expect(result.platformFee).toBeCloseTo(expectedPlatformFee, 2);
        expect(result.platformFee).toBeLessThan(20); // Under cap
      });
    });

    it('caps platform fee at configured maximum', () => {
      const largeAmounts = [1500, 2300, 5000, 10000];
      
      largeAmounts.forEach(amount => {
        const result = calculateStripeFees(amount, { isDomestic: true });
        
        expect(result.platformFee).toBe(20); // Always capped at $20
        expect(result.platformFee).toBeLessThan(amount * 0.02); // Less than uncapped amount
      });
    });

    it('respects custom platform fee cap', () => {
      const result = calculateStripeFees(5000, { 
        isDomestic: true,
        platformFeeCap: 50 // Custom $50 cap
      });
      
      expect(result.platformFee).toBe(50); // Custom cap applied
    });
  });

  describe('Geolocation-based Fee Determination', () => {
    it('treats Australian customers as domestic', () => {
      const result = calculateFeesWithGeolocation(1000, 'AU');
      
      expect(result.isDomestic).toBe(true);
      expect(result.breakdown.stripePercentage).toBe(0.017);
    });

    it('treats non-Australian customers as international', () => {
      const countries = ['US', 'GB', 'CA', 'NZ', 'DE'];
      
      countries.forEach(country => {
        const result = calculateFeesWithGeolocation(1000, country);
        
        expect(result.isDomestic).toBe(false);
        expect(result.breakdown.stripePercentage).toBe(0.035);
      });
    });

    it('defaults to international when no country provided', () => {
      const result = calculateFeesWithGeolocation(1000);
      
      expect(result.isDomestic).toBe(false); // Default to international for safety
      expect(result.breakdown.stripePercentage).toBe(0.035);
    });

    it('handles country code case insensitivity', () => {
      const variations = ['au', 'Au', 'aU', 'AU'];
      
      variations.forEach(country => {
        const result = calculateFeesWithGeolocation(1000, country);
        expect(result.isDomestic).toBe(true);
      });
    });
  });

  describe('Environment Variable Configuration', () => {
    it('uses environment variables for platform fee configuration', () => {
      process.env.STRIPE_PLATFORM_FEE_PERCENTAGE = '0.03'; // 3%
      process.env.STRIPE_PLATFORM_FEE_CAP = '15'; // $15 cap
      
      const result = calculateStripeFees(1000, { isDomestic: true });
      
      expect(result.breakdown.platformFeePercentage).toBe(0.03);
      expect(result.breakdown.platformFeeCap).toBe(15);
      expect(result.platformFee).toBe(15); // min(1000 * 0.03, 15) = 15
    });

    it('uses default values when environment variables are missing', () => {
      delete process.env.STRIPE_PLATFORM_FEE_PERCENTAGE;
      delete process.env.STRIPE_PLATFORM_FEE_CAP;
      
      const result = calculateStripeFees(1000, { isDomestic: true });
      
      expect(result.breakdown.platformFeePercentage).toBe(0.02); // Default 2%
      expect(result.breakdown.platformFeeCap).toBe(20); // Default $20
    });

    it('handles invalid environment variable values gracefully', () => {
      process.env.STRIPE_PLATFORM_FEE_PERCENTAGE = 'invalid';
      process.env.STRIPE_PLATFORM_FEE_CAP = 'also-invalid';
      
      const result = calculateStripeFees(1000, { isDomestic: true });
      
      // Should use defaults when parsing fails
      expect(result.breakdown.platformFeePercentage).toBe(0.02);
      expect(result.breakdown.platformFeeCap).toBe(20);
    });
  });

  describe('Fee Validation', () => {
    it('validates correct fee calculations', () => {
      const result = calculateStripeFees(1500, { isDomestic: true });
      const validation = validateFeeCalculation(result);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('detects calculation errors', () => {
      const result = calculateStripeFees(1500, { isDomestic: true });
      
      // Manually corrupt the calculation
      result.customerPayment = 999; // Incorrect value
      
      const validation = validateFeeCalculation(result);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('validates platform fee cap enforcement', () => {
      const result = calculateStripeFees(5000, { isDomestic: true });
      
      // Manually set platform fee above cap
      result.platformFee = 150; // Way above $20 cap
      
      const validation = validateFeeCalculation(result);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('exceeds cap'))).toBe(true);
    });
  });

  describe('UI Helper Functions', () => {
    it('formats fee breakdown correctly', () => {
      const result = calculateStripeFees(1000, { isDomestic: true });
      const formatted = formatFeeBreakdown(result);
      
      expect(formatted.subtotal).toBe('$1000.00');
      expect(formatted.total).toMatch(/^\$\d+\.\d{2}$/); // Proper currency format
      expect(formatted.processingFees).toMatch(/^\$\d+\.\d{2}$/);
      expect(formatted.feeType).toBe('Processing fees'); // Domestic
    });

    it('shows international fee label for international customers', () => {
      const result = calculateStripeFees(1000, { isDomestic: false });
      const formatted = formatFeeBreakdown(result);
      
      expect(formatted.feeType).toBe('International processing fees');
    });

    it('generates helpful fee explanations', () => {
      const result = calculateStripeFees(1000, { isDomestic: true });
      const explanation = getFeeExplanation(result);
      
      expect(explanation).toContain('platform fee');
      expect(explanation).toContain('Stripe fees');
      expect(explanation).toContain('domestic');
      expect(explanation).toContain('event organizer receives the full ticket price');
    });
  });

  describe('Utility Functions', () => {
    it('correctly identifies domestic cards', () => {
      expect(isDomesticCard('AU')).toBe(true);
      expect(isDomesticCard('au')).toBe(true);
      expect(isDomesticCard('US')).toBe(false);
      expect(isDomesticCard('')).toBe(false);
      expect(isDomesticCard(undefined)).toBe(false);
    });

    it('provides correct processing fee labels', () => {
      expect(getProcessingFeeLabel(true)).toBe('Processing fees');
      expect(getProcessingFeeLabel(false)).toBe('International processing fees');
    });

    it('provides fee configuration', () => {
      const config = getFeeConfiguration();
      
      expect(config.platformFeePercentage).toBe(0.02);
      expect(config.platformFeeCap).toBe(20);
      expect(config.domesticRates).toEqual(STRIPE_RATES.domestic);
      expect(config.internationalRates).toEqual(STRIPE_RATES.international);
    });

    it('exposes individual configuration getters', () => {
      expect(getPlatformFeePercentage()).toBe(0.02);
      expect(getPlatformFeeCap()).toBe(20);
    });
  });

  describe('Real-world Examples', () => {
    it('matches the PRD example: $2,300 domestic order', () => {
      const result = calculateStripeFees(2300, { isDomestic: true });
      
      // From PRD: connected gets $2,300, platform fee capped at $20
      expect(result.connectedAmount).toBe(2300);
      expect(result.platformFee).toBe(20);
      
      // Customer should pay around $2,360 (corrected calculation)
      expect(result.customerPayment).toBeCloseTo(2360.43, 1);
      
      // Processing fees should be around $60 (corrected calculation)
      expect(result.processingFeesDisplay).toBeCloseTo(60.43, 1);
      
      const validation = validateFeeCalculation(result);
      expect(validation.isValid).toBe(true);
    });

    it('matches the PRD example: $2,300 international order', () => {
      const result = calculateStripeFees(2300, { isDomestic: false });
      
      // From PRD: connected gets $2,300, platform fee capped at $20
      expect(result.connectedAmount).toBe(2300);
      expect(result.platformFee).toBe(20);
      
      // International customer should pay more (around $2,404 from PRD)
      expect(result.customerPayment).toBeCloseTo(2404.45, 1);
      
      // Processing fees should be higher (~$104 from PRD)
      expect(result.processingFeesDisplay).toBeCloseTo(104.45, 1);
      
      const validation = validateFeeCalculation(result);
      expect(validation.isValid).toBe(true);
    });

    it('handles the original problem case', () => {
      // Original issue: connected account got $2,293.28 instead of $2,300
      const result = calculateStripeFees(2300, { isDomestic: true });
      
      // With new calculation, connected account should get exactly $2,300
      expect(result.connectedAmount).toBe(2300);
      
      // Verify the math works out correctly
      const totalReceived = result.connectedAmount + result.platformFee + result.stripeFee;
      expect(totalReceived).toBeCloseTo(result.customerPayment, 0.1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles very small amounts', () => {
      const result = calculateStripeFees(1, { isDomestic: true });
      
      expect(result.connectedAmount).toBe(1);
      expect(result.platformFee).toBeCloseTo(0.02, 2); // 2% of $1
      expect(result.customerPayment).toBeGreaterThan(1);
      
      const validation = validateFeeCalculation(result);
      expect(validation.isValid).toBe(true);
    });

    it('handles maximum realistic amounts', () => {
      const result = calculateStripeFees(100000, { isDomestic: true });
      
      expect(result.connectedAmount).toBe(100000);
      expect(result.platformFee).toBe(20); // Still capped at $20
      
      const validation = validateFeeCalculation(result);
      expect(validation.isValid).toBe(true);
    });

    it('handles decimal amounts correctly', () => {
      const result = calculateStripeFees(123.45, { isDomestic: true });
      
      expect(result.connectedAmount).toBe(123.45);
      expect(result.platformFee).toBeCloseTo(2.47, 2); // 2% of $123.45
      
      const validation = validateFeeCalculation(result);
      expect(validation.isValid).toBe(true);
    });
  });
});