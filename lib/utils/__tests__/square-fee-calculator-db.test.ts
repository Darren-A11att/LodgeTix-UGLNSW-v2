import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FeeCalculationValues } from '../../types/payment-gateway';

// Mock the payment gateway service singleton
vi.mock('../../services/payment-gateway-service', () => ({
  paymentGatewayService: {
    getFeeCalculationValues: vi.fn()
  }
}));

// Import after mock
import { calculateSquareFeesWithDb } from '../square-fee-calculator';
import { paymentGatewayService } from '../../services/payment-gateway-service';

describe('calculateSquareFeesWithDb - Database-driven fee calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with active configuration', () => {
    it('should calculate fees using database values', async () => {
      const mockFeeValues: FeeCalculationValues = {
        fee_mode: 'pass_on',
        domestic_card_percentage: 0.022, // 2.2%
        domestic_card_fixed: 0.00,
        international_card_percentage: 0.022,
        international_card_fixed: 0.00,
        platform_fee_percentage: 0.02, // 2%
        platform_fee_min: 1.00,
        platform_fee_cap: 20.00
      };

      vi.mocked(paymentGatewayService.getFeeCalculationValues).mockResolvedValue(mockFeeValues);

      const result = await calculateSquareFeesWithDb(1150.00, { isDomestic: true });

      expect(result).toEqual({
        connectedAmount: 1150.00,
        platformFee: 20.00, // 2% of 1150 = 23, capped at 20
        squareFee: 26.32,
        customerPayment: 1196.32,
        processingFeesDisplay: 46.32,
        isDomestic: true,
        breakdown: {
          platformFeePercentage: 0.02,
          platformFeeCap: 20.00,
          platformFeeMinimum: 1.00,
          squarePercentage: 0.022,
          squareFixed: 0.00
        }
      });
    });

    it('should handle international card fees', async () => {
      const mockFeeValues: FeeCalculationValues = {
        fee_mode: 'pass_on',
        domestic_card_percentage: 0.022,
        domestic_card_fixed: 0.00,
        international_card_percentage: 0.035, // 3.5%
        international_card_fixed: 0.50, // $0.50 fixed
        platform_fee_percentage: 0.02,
        platform_fee_min: 1.00,
        platform_fee_cap: 20.00
      };

      vi.mocked(paymentGatewayService.getFeeCalculationValues).mockResolvedValue(mockFeeValues);

      const result = await calculateSquareFeesWithDb(100.00, { isDomestic: false });

      // Platform fee: 2% of 100 = 2.00
      // Numerator: 100 + 2 + 0.50 = 102.50
      // Denominator: 1 - 0.035 = 0.965
      // Customer payment: 102.50 / 0.965 = 106.22
      expect(result).toEqual({
        connectedAmount: 100.00,
        platformFee: 2.00,
        squareFee: 4.22, // (106.22 * 0.035) + 0.50
        customerPayment: 106.22,
        processingFeesDisplay: 6.22,
        isDomestic: false,
        breakdown: {
          platformFeePercentage: 0.02,
          platformFeeCap: 20.00,
          platformFeeMinimum: 1.00,
          squarePercentage: 0.035,
          squareFixed: 0.50
        }
      });
    });

    it('should apply platform fee minimum', async () => {
      const mockFeeValues: FeeCalculationValues = {
        fee_mode: 'pass_on',
        domestic_card_percentage: 0.022,
        domestic_card_fixed: 0.00,
        international_card_percentage: 0.022,
        international_card_fixed: 0.00,
        platform_fee_percentage: 0.02,
        platform_fee_min: 1.00,
        platform_fee_cap: 20.00
      };

      vi.mocked(paymentGatewayService.getFeeCalculationValues).mockResolvedValue(mockFeeValues);

      const result = await calculateSquareFeesWithDb(10.00, { isDomestic: true });

      // Platform fee: 2% of 10 = 0.20, but minimum is 1.00
      expect(result.platformFee).toBe(1.00);
    });

    it('should handle absorb mode', async () => {
      const mockFeeValues: FeeCalculationValues = {
        fee_mode: 'absorb',
        domestic_card_percentage: 0.022,
        domestic_card_fixed: 0.00,
        international_card_percentage: 0.022,
        international_card_fixed: 0.00,
        platform_fee_percentage: 0.02,
        platform_fee_min: 1.00,
        platform_fee_cap: 20.00
      };

      vi.mocked(paymentGatewayService.getFeeCalculationValues).mockResolvedValue(mockFeeValues);

      const result = await calculateSquareFeesWithDb(100.00, { isDomestic: true });

      // In absorb mode, customer pays only the subtotal
      expect(result.customerPayment).toBe(100.00);
      expect(result.processingFeesDisplay).toBe(0.00);
      expect(result.platformFee).toBe(0.00);
      expect(result.squareFee).toBe(0.00);
    });
  });

  describe('with no active configuration', () => {
    it('should default to zero fees when no configuration exists', async () => {
      const mockFeeValues: FeeCalculationValues = {
        fee_mode: 'absorb',
        domestic_card_percentage: 0,
        domestic_card_fixed: 0,
        international_card_percentage: 0,
        international_card_fixed: 0,
        platform_fee_percentage: 0,
        platform_fee_min: 0,
        platform_fee_cap: 0
      };

      vi.mocked(paymentGatewayService.getFeeCalculationValues).mockResolvedValue(mockFeeValues);

      const result = await calculateSquareFeesWithDb(1000.00, { isDomestic: true });

      expect(result).toEqual({
        connectedAmount: 1000.00,
        platformFee: 0.00,
        squareFee: 0.00,
        customerPayment: 1000.00,
        processingFeesDisplay: 0.00,
        isDomestic: true,
        breakdown: {
          platformFeePercentage: 0,
          platformFeeCap: 0,
          platformFeeMinimum: 0,
          squarePercentage: 0,
          squareFixed: 0
        }
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when database fetch fails', async () => {
      vi.mocked(paymentGatewayService.getFeeCalculationValues).mockRejectedValue(new Error('Database connection failed'));

      await expect(calculateSquareFeesWithDb(100.00))
        .rejects.toThrow('Failed to calculate fees: Database connection failed');
    });
  });

  describe('geolocation support', () => {
    it('should determine domestic vs international based on country code', async () => {
      const mockFeeValues: FeeCalculationValues = {
        fee_mode: 'pass_on',
        domestic_card_percentage: 0.022,
        domestic_card_fixed: 0.00,
        international_card_percentage: 0.035,
        international_card_fixed: 0.50,
        platform_fee_percentage: 0.02,
        platform_fee_min: 1.00,
        platform_fee_cap: 20.00
      };

      vi.mocked(paymentGatewayService.getFeeCalculationValues).mockResolvedValue(mockFeeValues);

      // Test with Australian card (domestic)
      const domesticResult = await calculateSquareFeesWithDb(100.00, { userCountry: 'AU' });
      expect(domesticResult.isDomestic).toBe(true);
      expect(domesticResult.breakdown.squarePercentage).toBe(0.022);

      // Test with US card (international)
      const internationalResult = await calculateSquareFeesWithDb(100.00, { userCountry: 'US' });
      expect(internationalResult.isDomestic).toBe(false);
      expect(internationalResult.breakdown.squarePercentage).toBe(0.035);
    });
  });
});