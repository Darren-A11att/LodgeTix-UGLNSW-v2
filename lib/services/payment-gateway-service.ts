import { createClient } from '@/utils/supabase/server';
import type { PaymentGatewayConfig, FeeCalculationValues, PaymentGatewayName } from '../types/payment-gateway';
import * as Sentry from '@sentry/nextjs';
import { supabaseRealtimeSingleton } from './supabase-realtime-singleton';

/**
 * Service for managing payment gateway configuration from database
 * Replaces environment variable-based configuration
 * Uses Supabase Realtime to keep cache synchronized with database
 */
export class PaymentGatewayService {
  private static instance: PaymentGatewayService;
  private sessionCache: PaymentGatewayConfig | null = null;
  private lastFetchTime: number = 0;
  private realtimeSubscription: any = null;
  private isSubscribed: boolean = false;
  
  // Track when config was last validated (for monitoring)
  private lastValidationTime: number = 0;

  constructor() {
    // Initialize realtime subscription on first use
    this.setupRealtimeSubscription();
  }

  static getInstance(): PaymentGatewayService {
    if (!PaymentGatewayService.instance) {
      PaymentGatewayService.instance = new PaymentGatewayService();
    }
    return PaymentGatewayService.instance;
  }

  /**
   * Setup realtime subscription to payment_gateway table changes
   */
  private async setupRealtimeSubscription() {
    if (this.isSubscribed) return;
    
    try {
      // Use the persistent realtime client
      const realtimeClient = supabaseRealtimeSingleton.getClient();
      
      // Subscribe to all changes on payment_gateway table
      this.realtimeSubscription = realtimeClient
        .channel('payment-gateway-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payment_gateway' },
          (payload) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 [PaymentGateway] Database change detected:', payload.eventType);
            }
            
            // Clear cache on any change to payment_gateway table
            this.clearCache();
            
            // Log the change for monitoring
            if (payload.eventType === 'UPDATE' && payload.new) {
              console.log('📝 [PaymentGateway] Configuration updated:', {
                gateway: (payload.new as any).payment_gateway,
                feeMode: (payload.new as any).fee_mode,
                isActive: (payload.new as any).is_active
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ [PaymentGateway] Subscribed to realtime updates');
            }
          }
        });
    } catch (error) {
      console.error('Failed to setup realtime subscription:', error);
      // Continue without realtime - will still work with manual cache clearing
    }
  }

  /**
   * Get the active payment gateway configuration
   * Cache persists indefinitely until database changes trigger invalidation
   */
  async getActiveConfiguration(): Promise<PaymentGatewayConfig | null> {
    // Return cached config if available
    if (this.sessionCache) {
      if (process.env.NODE_ENV === 'development') {
        const cacheAge = Math.round((Date.now() - this.lastFetchTime) / 1000);
        console.log(`💾 [PaymentGateway] Using cached configuration (age: ${cacheAge}s)`);
      }
      return this.sessionCache;
    }

    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('payment_gateway')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        const errorMessage = 'Failed to fetch payment gateway configuration';
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`🚨 [PaymentGateway] ${errorMessage}:`, error);
          console.log('💡 [PaymentGateway] Defaulting to absorb mode (zero fees) due to database error');
          console.log('💡 [PaymentGateway] Customers will be charged subtotal only, no processing fees');
        } else {
          // Production: Log error to Sentry
          Sentry.captureException(new Error(errorMessage), {
            extra: {
              error,
              service: 'PaymentGatewayService',
              method: 'getActiveConfiguration',
              fallback: 'absorb_mode'
            },
            tags: {
              component: 'payment_gateway',
              severity: 'warning'
            }
          });
        }
        
        // Don't throw - return null to trigger absorb mode
        return null;
      }

      // Update session cache
      this.sessionCache = data || null;
      this.lastFetchTime = Date.now();
      this.lastValidationTime = Date.now();

      // Log successful configuration load in development
      if (data && process.env.NODE_ENV === 'development') {
        console.log('✅ [PaymentGateway] Successfully loaded configuration:', {
          gateway: data.payment_gateway,
          mode: data.fee_mode,
          domesticRate: `${data.domestic_card_percentage}%`,
          platformFee: `${data.platform_fee_percentage}% (min $${data.platform_fee_min}, max $${data.platform_fee_cap})`
        });
        console.log('📋 [PaymentGateway] Raw database values:', JSON.stringify(data, null, 2));
      }

      return data || null;
    } catch (error) {
      const errorMessage = 'Unexpected error in payment gateway configuration';
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`🚨 [PaymentGateway] ${errorMessage}:`, error);
        console.log('💡 [PaymentGateway] Defaulting to absorb mode (zero fees) due to unexpected error');
        console.log('💡 [PaymentGateway] This could be a connection issue or server error');
      } else {
        // Production: Log error to Sentry
        Sentry.captureException(error instanceof Error ? error : new Error(errorMessage), {
          extra: {
            originalError: error,
            service: 'PaymentGatewayService',
            method: 'getActiveConfiguration',
            fallback: 'absorb_mode'
          },
          tags: {
            component: 'payment_gateway',
            severity: 'error'
          }
        });
      }
      
      // On any error, return null to trigger absorb mode (zero fees)
      return null;
    }
  }

  /**
   * Get fee calculation values with percentage conversion
   * Converts stored percentages (2.20) to decimals (0.022)
   * Returns zero fees (absorb mode) if no active configuration or database error
   * This ensures checkout always works, even during database outages
   */
  async getFeeCalculationValues(): Promise<FeeCalculationValues> {
    const config = await this.getActiveConfiguration();

    if (!config) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 [PaymentGateway] No active configuration found - using absorb mode');
        console.log('🎯 [PaymentGateway] Processing fees: $0.00 (absorbed by business)');
      }
      
      // Default to zero fees (absorb mode)
      return {
        fee_mode: 'absorb',
        domestic_card_percentage: 0,
        domestic_card_fixed: 0,
        international_card_percentage: 0,
        international_card_fixed: 0,
        platform_fee_percentage: 0,
        platform_fee_min: 0,
        platform_fee_cap: 0
      };
    }

    const feeValues = {
      fee_mode: config.fee_mode,
      // Convert percentage format (2.20 -> 0.022) with proper precision
      domestic_card_percentage: Number(((config.domestic_card_percentage || 0) / 100).toFixed(4)),
      domestic_card_fixed: Number((config.domestic_card_fixed || 0).toFixed(2)),
      international_card_percentage: Number(((config.international_card_percentage || 0) / 100).toFixed(4)),
      international_card_fixed: Number((config.international_card_fixed || 0).toFixed(2)),
      platform_fee_percentage: Number(((config.platform_fee_percentage || 0) / 100).toFixed(4)),
      platform_fee_min: Number((config.platform_fee_min || 0).toFixed(2)),
      platform_fee_cap: Number((config.platform_fee_cap || 0).toFixed(2))
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [PaymentGateway] Fee values from database:', {
        fee_mode: feeValues.fee_mode,
        domestic_card_percentage: `${config.domestic_card_percentage}% -> ${feeValues.domestic_card_percentage}`,
        platform_fee_percentage: `${config.platform_fee_percentage}% -> ${feeValues.platform_fee_percentage}`,
        platform_fee_min: feeValues.platform_fee_min,
        platform_fee_cap: feeValues.platform_fee_cap
      });
    }

    return feeValues;
  }

  /**
   * Get the active payment gateway name
   */
  async getActivePaymentGateway(): Promise<PaymentGatewayName | null> {
    const config = await this.getActiveConfiguration();
    return config ? config.payment_gateway : null;
  }

  /**
   * Clear the session cache
   * Called when:
   * - Configuration changes are detected
   * - Manual refresh is needed
   * - Testing requires fresh data
   */
  clearCache(): void {
    this.sessionCache = null;
    this.lastFetchTime = 0;
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 [PaymentGateway] Session cache cleared');
    }
  }
  
  /**
   * Get cache status for monitoring
   */
  getCacheStatus(): { isCached: boolean; ageInSeconds: number; lastValidation: number; realtimeActive: boolean } {
    const isCached = !!this.sessionCache;
    const ageInSeconds = isCached ? Math.round((Date.now() - this.lastFetchTime) / 1000) : 0;
    const lastValidation = this.lastValidationTime;
    
    return { isCached, ageInSeconds, lastValidation, realtimeActive: this.isSubscribed };
  }
  
  /**
   * Cleanup realtime subscription
   * Call this when shutting down the service
   */
  async cleanup(): Promise<void> {
    if (this.realtimeSubscription) {
      await this.realtimeSubscription.unsubscribe();
      this.isSubscribed = false;
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 [PaymentGateway] Unsubscribed from realtime updates');
      }
    }
  }
}

// Export singleton instance
export const paymentGatewayService = PaymentGatewayService.getInstance();