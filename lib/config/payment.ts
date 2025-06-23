/**
 * Payment Gateway Configuration
 * Centralizes all payment-related configuration for both Stripe and Square
 * 
 * IMPORTANT: Payment fees are now stored in the database (payment_gateway table)
 * Only API credentials remain in environment variables
 */

// Payment gateway selection
export type PaymentGateway = 'STRIPE' | 'SQUARE';

export interface PaymentConfig {
  gateway: PaymentGateway;
  // Platform fees removed - now in database
  stripe?: StripeConfig;
  square?: SquareConfig;
}

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  apiVersion: string;
}

export interface SquareConfig {
  environment: 'sandbox' | 'production';
  applicationId: string;
  accessToken: string;
  locationId: string;
  webhookSignatureKey: string;
}

/**
 * Get payment configuration based on environment variables
 */
export function getPaymentConfig(): PaymentConfig {
  // Gateway selection still from env var for now
  // TODO: Move this to database in future
  const gateway = (process.env.PAYMENT_GATEWAY || 'SQUARE') as PaymentGateway;
  
  const config: PaymentConfig = {
    gateway,
    // Platform fees now loaded from database via PaymentGatewayService
  };

  // Add Stripe configuration if available
  if (process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    config.stripe = {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      apiVersion: '2024-11-20.acacia',
    };
  }

  // Add Square configuration if available
  if (process.env.SQUARE_ACCESS_TOKEN && process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID) {
    config.square = {
      environment: (process.env.SQUARE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
      applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      locationId: process.env.SQUARE_LOCATION_ID || '',
      webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '',
    };
  }

  return config;
}

/**
 * Validate payment configuration
 */
export function validatePaymentConfig(config: PaymentConfig): string[] {
  const errors: string[] = [];

  if (config.gateway === 'STRIPE') {
    if (!config.stripe) {
      errors.push('Stripe configuration is missing');
    } else {
      if (!config.stripe.secretKey) {
        errors.push('STRIPE_SECRET_KEY is required');
      }
      if (!config.stripe.publishableKey) {
        errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required');
      }
      if (!config.stripe.webhookSecret) {
        errors.push('STRIPE_WEBHOOK_SECRET is required');
      }
    }
  }

  if (config.gateway === 'SQUARE') {
    if (!config.square) {
      errors.push('Square configuration is missing');
    } else {
      if (!config.square.accessToken) {
        errors.push('SQUARE_ACCESS_TOKEN is required');
      }
      if (!config.square.applicationId) {
        errors.push('NEXT_PUBLIC_SQUARE_APPLICATION_ID is required');
      }
      if (!config.square.locationId) {
        errors.push('SQUARE_LOCATION_ID is required');
      }
      if (!config.square.webhookSignatureKey) {
        errors.push('SQUARE_WEBHOOK_SIGNATURE_KEY is required');
      }
    }
  }

  return errors;
}

/**
 * Get the active payment gateway
 * @deprecated Use PaymentGatewayService.getActivePaymentGateway() instead
 */
export function getActivePaymentGateway(): PaymentGateway {
  // Still using env var for backward compatibility
  // Will be removed once all code is updated to use PaymentGatewayService
  return (process.env.PAYMENT_GATEWAY || 'SQUARE') as PaymentGateway;
}

/**
 * Get the active payment gateway from database (async)
 * This is the new preferred method
 */
export async function getActivePaymentGatewayAsync(): Promise<PaymentGateway> {
  // Dynamic import based on environment
  let paymentGatewayService: any;
  
  if (typeof window === 'undefined') {
    // Server-side: use server version
    const module = await import('../services/payment-gateway-service');
    paymentGatewayService = module.paymentGatewayService;
  } else {
    // Client-side: use client version
    const module = await import('../services/payment-gateway-service-client');
    paymentGatewayService = module.paymentGatewayServiceClient;
  }
  
  const gateway = await paymentGatewayService.getActivePaymentGateway();
  
  if (!gateway) {
    // Fallback to env var if no database configuration
    return getActivePaymentGateway();
  }
  
  // Convert lowercase database value to uppercase for consistency
  return gateway.toUpperCase() as PaymentGateway;
}

/**
 * Check if a payment gateway is properly configured
 */
export function isPaymentGatewayConfigured(gateway: PaymentGateway): boolean {
  const config = getPaymentConfig();
  const errors = validatePaymentConfig(config);
  return errors.length === 0 && config.gateway === gateway;
}

/**
 * Get Square client configuration
 */
export function getSquareClientConfig() {
  const config = getPaymentConfig();
  
  if (!config.square) {
    throw new Error('Square configuration is not available');
  }

  return {
    environment: config.square.environment,
    customUrl: config.square.environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com' 
      : 'https://connect.squareup.com',
  };
}

/**
 * Get Stripe client configuration
 */
export function getStripeClientConfig() {
  const config = getPaymentConfig();
  
  if (!config.stripe) {
    throw new Error('Stripe configuration is not available');
  }

  return {
    apiVersion: config.stripe.apiVersion,
    typescript: true,
  };
}