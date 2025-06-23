import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PaymentGatewayService } from '../payment-gateway-service';
import type { PaymentGatewayConfig } from '../../types/payment-gateway';
import * as supabaseServer from '@/utils/supabase/server';

// Mock Supabase client
vi.mock('@/utils/supabase/server');

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn()
}));

describe('PaymentGatewayService', () => {
  let service: PaymentGatewayService;
  let mockSupabase: any;

  beforeEach(() => {
    vi.useFakeTimers();
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    };
    
    // Mock the createClient function
    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    
    service = new PaymentGatewayService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getActiveConfiguration', () => {
    it('should fetch the active payment gateway configuration', async () => {
      const mockConfig: PaymentGatewayConfig = {
        payment_gateway_id: 1,
        payment_gateway_uuid: '123e4567-e89b-12d3-a456-426614174000',
        payment_gateway: 'square',
        fee_mode: 'pass_on',
        domestic_card_percentage: 2.20,
        domestic_card_fixed: 0.00,
        international_card_percentage: 2.20,
        international_card_fixed: 0.00,
        platform_fee_percentage: 2.00,
        platform_fee_min: 1.00,
        platform_fee_cap: 20.00,
        is_active: true,
        created_on: new Date().toISOString(),
        enabled_on: new Date().toISOString(),
        disabled_on: null
      };

      mockSupabase.single.mockResolvedValue({ data: mockConfig, error: null });

      const result = await service.getActiveConfiguration();

      expect(mockSupabase.from).toHaveBeenCalledWith('payment_gateway');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('should return null when no active configuration exists', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const result = await service.getActiveConfiguration();

      expect(result).toBeNull();
    });

    it('should return null when database query fails (defaults to absorb mode)', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error', code: 'DB_ERROR' } 
      });

      const result = await service.getActiveConfiguration();
      expect(result).toBeNull();
    });

    it('should return null when unexpected error occurs (defaults to absorb mode)', async () => {
      mockSupabase.single.mockRejectedValue(new Error('Connection failed'));

      const result = await service.getActiveConfiguration();
      expect(result).toBeNull();
    });
  });

  describe('getFeeCalculationValues', () => {
    it('should return fee values for calculation when configuration exists', async () => {
      const mockConfig: PaymentGatewayConfig = {
        payment_gateway_id: 1,
        payment_gateway_uuid: '123e4567-e89b-12d3-a456-426614174000',
        payment_gateway: 'square',
        fee_mode: 'pass_on',
        domestic_card_percentage: 2.20,
        domestic_card_fixed: 0.00,
        international_card_percentage: 2.20,
        international_card_fixed: 0.00,
        platform_fee_percentage: 2.00,
        platform_fee_min: 1.00,
        platform_fee_cap: 20.00,
        is_active: true,
        created_on: new Date().toISOString(),
        enabled_on: new Date().toISOString(),
        disabled_on: null
      };

      mockSupabase.single.mockResolvedValue({ data: mockConfig, error: null });

      const result = await service.getFeeCalculationValues();

      expect(result.fee_mode).toBe('pass_on');
      expect(result.domestic_card_fixed).toBe(0.00);
      expect(result.domestic_card_percentage).toBeCloseTo(0.022, 5);
      expect(result.international_card_percentage).toBeCloseTo(0.022, 5);
      expect(result.international_card_fixed).toBe(0.00);
      expect(result.platform_fee_percentage).toBeCloseTo(0.02, 5);
      expect(result.platform_fee_min).toBe(1.00);
      expect(result.platform_fee_cap).toBe(20.00);
    });

    it('should return zero fees when no active configuration exists', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const result = await service.getFeeCalculationValues();

      expect(result).toEqual({
        fee_mode: 'absorb',
        domestic_card_percentage: 0,
        domestic_card_fixed: 0,
        international_card_percentage: 0,
        international_card_fixed: 0,
        platform_fee_percentage: 0,
        platform_fee_min: 0,
        platform_fee_cap: 0
      });
    });

    it('should handle null values in configuration', async () => {
      const mockConfig: PaymentGatewayConfig = {
        payment_gateway_id: 1,
        payment_gateway_uuid: '123e4567-e89b-12d3-a456-426614174000',
        payment_gateway: 'square',
        fee_mode: 'pass_on',
        domestic_card_percentage: 2.20,
        domestic_card_fixed: null as any, // null value
        international_card_percentage: null as any, // null value
        international_card_fixed: 0.00,
        platform_fee_percentage: 2.00,
        platform_fee_min: null as any, // null value
        platform_fee_cap: 20.00,
        is_active: true,
        created_on: new Date().toISOString(),
        enabled_on: new Date().toISOString(),
        disabled_on: null
      };

      mockSupabase.single.mockResolvedValue({ data: mockConfig, error: null });

      const result = await service.getFeeCalculationValues();

      expect(result.fee_mode).toBe('pass_on');
      expect(result.domestic_card_percentage).toBeCloseTo(0.022, 5);
      expect(result.domestic_card_fixed).toBe(0); // null converted to 0
      expect(result.international_card_percentage).toBe(0); // null converted to 0
      expect(result.international_card_fixed).toBe(0.00);
      expect(result.platform_fee_percentage).toBeCloseTo(0.02, 5);
      expect(result.platform_fee_min).toBe(0); // null converted to 0
      expect(result.platform_fee_cap).toBe(20.00);
    });

    it('should return absorb mode (zero fees) when database error occurs', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed', code: 'DB_ERROR' } 
      });

      const result = await service.getFeeCalculationValues();

      expect(result.fee_mode).toBe('absorb');
      expect(result.domestic_card_percentage).toBe(0);
      expect(result.domestic_card_fixed).toBe(0);
      expect(result.international_card_percentage).toBe(0);
      expect(result.international_card_fixed).toBe(0);
      expect(result.platform_fee_percentage).toBe(0);
      expect(result.platform_fee_min).toBe(0);
      expect(result.platform_fee_cap).toBe(0);
    });
  });

  describe('getActivePaymentGateway', () => {
    it('should return the payment gateway name', async () => {
      const mockConfig: PaymentGatewayConfig = {
        payment_gateway_id: 1,
        payment_gateway_uuid: '123e4567-e89b-12d3-a456-426614174000',
        payment_gateway: 'square',
        fee_mode: 'pass_on',
        domestic_card_percentage: 2.20,
        domestic_card_fixed: 0.00,
        international_card_percentage: 2.20,
        international_card_fixed: 0.00,
        platform_fee_percentage: 2.00,
        platform_fee_min: 1.00,
        platform_fee_cap: 20.00,
        is_active: true,
        created_on: new Date().toISOString(),
        enabled_on: new Date().toISOString(),
        disabled_on: null
      };

      mockSupabase.single.mockResolvedValue({ data: mockConfig, error: null });

      const result = await service.getActivePaymentGateway();

      expect(result).toBe('square');
    });

    it('should return null when no active configuration exists', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const result = await service.getActivePaymentGateway();

      expect(result).toBeNull();
    });
  });

  describe('caching behavior', () => {
    it('should cache the configuration after first fetch', async () => {
      const mockConfig: PaymentGatewayConfig = {
        payment_gateway_id: 1,
        payment_gateway_uuid: '123e4567-e89b-12d3-a456-426614174000',
        payment_gateway: 'square',
        fee_mode: 'pass_on',
        domestic_card_percentage: 2.20,
        domestic_card_fixed: 0.00,
        international_card_percentage: 2.20,
        international_card_fixed: 0.00,
        platform_fee_percentage: 2.00,
        platform_fee_min: 1.00,
        platform_fee_cap: 20.00,
        is_active: true,
        created_on: new Date().toISOString(),
        enabled_on: new Date().toISOString(),
        disabled_on: null
      };

      mockSupabase.single.mockResolvedValue({ data: mockConfig, error: null });

      // First call
      await service.getActiveConfiguration();
      
      // Second call - should use cache
      await service.getActiveConfiguration();

      // Database should only be called once due to caching
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache after TTL expires', async () => {
      const mockConfig: PaymentGatewayConfig = {
        payment_gateway_id: 1,
        payment_gateway_uuid: '123e4567-e89b-12d3-a456-426614174000',
        payment_gateway: 'square',
        fee_mode: 'pass_on',
        domestic_card_percentage: 2.20,
        domestic_card_fixed: 0.00,
        international_card_percentage: 2.20,
        international_card_fixed: 0.00,
        platform_fee_percentage: 2.00,
        platform_fee_min: 1.00,
        platform_fee_cap: 20.00,
        is_active: true,
        created_on: new Date().toISOString(),
        enabled_on: new Date().toISOString(),
        disabled_on: null
      };

      mockSupabase.single.mockResolvedValue({ data: mockConfig, error: null });

      // First call
      await service.getActiveConfiguration();
      
      // Simulate cache expiry
      vi.advanceTimersByTime(6 * 60 * 1000); // 6 minutes
      
      // Second call - should fetch from database again
      await service.getActiveConfiguration();

      // Database should be called twice
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });
  });
});