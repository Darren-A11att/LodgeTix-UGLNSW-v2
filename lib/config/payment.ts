/**
 * Payment Gateway Configuration
 * Centralizes all payment-related configuration for both Stripe and Square
 */

// Payment gateway selection
export type PaymentGateway = 'STRIPE' | 'SQUARE';

export interface PaymentConfig {
  gateway: PaymentGateway;
  platformFee: {
    percentage: number;
    cap: number;
    minimum: number;
  };
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
  const gateway = (process.env.PAYMENT_GATEWAY || 'SQUARE') as PaymentGateway;
  
  const config: PaymentConfig = {
    gateway,
    platformFee: {
      percentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0.022'), // 2.2%
      cap: parseFloat(process.env.PLATFORM_FEE_CAP || '20'), // $20
      minimum: parseFloat(process.env.PLATFORM_FEE_MINIMUM || '0.50'), // $0.50
    },
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
 */
export function getActivePaymentGateway(): PaymentGateway {
  return (process.env.PAYMENT_GATEWAY || 'SQUARE') as PaymentGateway;
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