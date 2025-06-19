/**
 * Square Client Initialization and Configuration
 * Provides centralized Square API client setup and common operations
 */

import { Client, Environment } from 'squareup';
import { getPaymentConfig, validatePaymentConfig } from '@/lib/config/payment';
import type { SquareConfig } from '@/lib/config/payment';

// Cache for Square client instance
let squareClient: Client | null = null;

/**
 * Get or create Square client instance
 */
export function getSquareClient(): Client {
  if (squareClient) {
    return squareClient;
  }

  const config = getPaymentConfig();
  
  if (!config.square) {
    throw new Error('Square configuration is not available. Please check your environment variables.');
  }

  const errors = validatePaymentConfig(config);
  if (errors.length > 0) {
    throw new Error(`Square configuration is invalid: ${errors.join(', ')}`);
  }

  // Validate access token format
  if (!config.square.accessToken.startsWith('EAAAl')) {
    throw new Error('Invalid Square access token format');
  }

  // Validate application ID format
  const isValidAppId = config.square.environment === 'sandbox' 
    ? config.square.applicationId.startsWith('sandbox-sq0idb-')
    : config.square.applicationId.startsWith('sq0idp-');
    
  if (!isValidAppId) {
    throw new Error(`Invalid Square application ID format for ${config.square.environment} environment`);
  }

  // Validate location ID format
  if (!config.square.locationId.startsWith('L')) {
    throw new Error('Invalid Square location ID format');
  }

  try {
    squareClient = new Client({
      accessToken: config.square.accessToken,
      environment: config.square.environment === 'production' 
        ? Environment.Production 
        : Environment.Sandbox,
    });

    console.log(`✅ Square client initialized for ${config.square.environment} environment`);
    return squareClient;
  } catch (error) {
    console.error('❌ Failed to initialize Square client:', error);
    throw new Error(`Failed to initialize Square client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get Square configuration for client-side use
 */
export function getSquareClientConfig() {
  const config = getPaymentConfig();
  
  if (!config.square) {
    throw new Error('Square configuration is not available');
  }

  return {
    applicationId: config.square.applicationId,
    locationId: config.square.locationId,
    environment: config.square.environment,
  };
}

/**
 * Validate Square webhook signature
 */
export function validateSquareWebhookSignature(
  body: string,
  signature: string,
  webhookSignatureKey?: string
): boolean {
  const config = getPaymentConfig();
  const signatureKey = webhookSignatureKey || config.square?.webhookSignatureKey;
  
  if (!signatureKey) {
    throw new Error('Square webhook signature key is not configured');
  }

  // Square webhook signature validation logic
  // This is a placeholder - implement actual Square webhook signature validation
  // Square uses HMAC-SHA256 for webhook signature verification
  const crypto = require('crypto');
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', signatureKey)
      .update(body, 'utf8')
      .digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  } catch (error) {
    console.error('Error validating Square webhook signature:', error);
    return false;
  }
}

/**
 * Get Square API URLs based on environment
 */
export function getSquareApiUrls() {
  const config = getPaymentConfig();
  
  if (!config.square) {
    throw new Error('Square configuration is not available');
  }

  const isProduction = config.square.environment === 'production';
  
  return {
    apiUrl: isProduction 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com',
    webPaymentsUrl: isProduction
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js',
  };
}

/**
 * Create Square payment request
 */
export interface SquarePaymentRequest {
  amount: number; // Amount in cents
  currency: string;
  sourceId: string; // Payment method token from Square Web Payments SDK
  locationId?: string;
  referenceId?: string;
  note?: string;
  applicationFee?: {
    amount: number; // Platform fee in cents
    feeRecipientId?: string;
  };
}

/**
 * Helper function to convert dollars to Square money format (cents)
 */
export function dollarsToSquareMoney(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Helper function to convert Square money format (cents) to dollars
 */
export function squareMoneyToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Reset Square client (useful for testing or configuration changes)
 */
export function resetSquareClient(): void {
  squareClient = null;
}