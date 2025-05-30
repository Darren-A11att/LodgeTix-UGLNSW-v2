import { describe, it, expect } from 'vitest';
import { 
  calculateStripeFees, 
  calculateAbsorbedStripeFee,
  formatFeeBreakdown,
  getFeeDisclaimer,
  getFeeExplanation,
  getFeeModeFromEnv,
  getPlatformFeePercentage
} from '../stripe-fee-calculator';

describe('Stripe Fee Calculator', () => {
  describe('calculateStripeFees', () => {
    it('calculates domestic card fees correctly in pass-to-customer mode', () => {
      const result = calculateStripeFees(100, { 
        isDomestic: true,
        feeMode: 'pass_to_customer'
      });
      
      // For $100 with 1.75% + $0.30:
      // total = (100 + 0.30) / (1 - 0.0175) = 102.08
      // stripeFee = 102.08 - 100 = 2.08
      expect(result.subtotal).toBe(100);
      expect(result.stripeFee).toBeCloseTo(2.08, 2);
      expect(result.total).toBeCloseTo(102.08, 2);
      expect(result.platformFee).toBe(5); // 5% of $100
    });

    it('calculates international card fees correctly in pass-to-customer mode', () => {
      const result = calculateStripeFees(100, { 
        isDomestic: false,
        feeMode: 'pass_to_customer'
      });
      
      // For $100 with 2.9% + $0.30:
      // total = (100 + 0.30) / (1 - 0.029) = 103.31
      // stripeFee = 103.31 - 100 = 3.31
      expect(result.subtotal).toBe(100);
      expect(result.stripeFee).toBeCloseTo(3.31, 2);
      expect(result.total).toBeCloseTo(103.31, 2);
    });

    it('calculates fees correctly in absorb mode', () => {
      const result = calculateStripeFees(100, { 
        isDomestic: true,
        feeMode: 'absorb'
      });
      
      // In absorb mode, customer pays subtotal only
      expect(result.subtotal).toBe(100);
      expect(result.stripeFee).toBeCloseTo(2.05, 2); // 1.75% of 100 + 0.30
      expect(result.total).toBe(100); // Customer pays subtotal only
    });

    it('handles zero amount', () => {
      const result = calculateStripeFees(0);
      expect(result.subtotal).toBe(0);
      expect(result.stripeFee).toBeCloseTo(0.31, 2); // Just the fixed fee
      expect(result.total).toBeCloseTo(0.31, 2);
    });

    it('handles large amounts correctly', () => {
      const result = calculateStripeFees(10000, { 
        isDomestic: true,
        feeMode: 'pass_to_customer'
      });
      
      // For $10,000 with 1.75% + $0.30:
      // total = (10000 + 0.30) / (1 - 0.0175) = 10178.59
      // stripeFee = 178.59
      expect(result.subtotal).toBe(10000);
      expect(result.stripeFee).toBeCloseTo(178.59, 2);
      expect(result.total).toBeCloseTo(10178.59, 2);
    });

    it('rounds to 2 decimal places', () => {
      const result = calculateStripeFees(33.33);
      expect(result.subtotal).toBe(33.33);
      expect(Number.isInteger(result.stripeFee * 100)).toBe(true);
      expect(Number.isInteger(result.total * 100)).toBe(true);
    });

    it('uses custom platform fee percentage', () => {
      const result = calculateStripeFees(100, { 
        platformFeePercentage: 0.1 // 10%
      });
      expect(result.platformFee).toBe(10);
    });
  });

  describe('calculateAbsorbedStripeFee', () => {
    it('calculates domestic absorbed fee correctly', () => {
      const fee = calculateAbsorbedStripeFee(100, true);
      expect(fee).toBe(2.05); // 1.75% of 100 + 0.30
    });

    it('calculates international absorbed fee correctly', () => {
      const fee = calculateAbsorbedStripeFee(100, false);
      expect(fee).toBe(3.20); // 2.9% of 100 + 0.30
    });
  });

  describe('formatFeeBreakdown', () => {
    it('formats fee breakdown correctly', () => {
      const calculation = {
        subtotal: 100,
        stripeFee: 2.08,
        platformFee: 5,
        total: 102.08
      };
      
      const breakdown = formatFeeBreakdown(calculation);
      expect(breakdown).toEqual([
        'Subtotal: $100.00',
        'Processing Fee: $2.08',
        'Total: $102.08'
      ]);
    });
  });

  describe('getFeeDisclaimer', () => {
    it('returns fee disclaimer text', () => {
      const disclaimer = getFeeDisclaimer();
      expect(disclaimer).toContain('processing fee');
      expect(disclaimer).toContain('event organizer');
    });
  });

  describe('getFeeExplanation', () => {
    it('returns pass-to-customer explanation', () => {
      const explanation = getFeeExplanation('pass_to_customer');
      expect(explanation).toContain('fees are added');
      expect(explanation).toContain('full ticket price');
    });

    it('returns absorb explanation', () => {
      const explanation = getFeeExplanation('absorb');
      expect(explanation).toContain('final amount');
      expect(explanation).toContain('covered by the event organizer');
    });
  });

  describe('Environment configuration', () => {
    it('getFeeModeFromEnv defaults to pass_to_customer', () => {
      const mode = getFeeModeFromEnv();
      expect(mode).toBe('pass_to_customer');
    });

    it('getPlatformFeePercentage defaults to 5%', () => {
      const percentage = getPlatformFeePercentage();
      expect(percentage).toBe(0.05);
    });
  });
});