/**
 * Square Client Utility
 * Handles Square SDK initialization and configuration with proper error handling
 */

import { Client, Environment } from 'square';

// Initialize Square client lazily with proper error handling
function getSquareClient() {
  const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
  const squareEnvironment = process.env.SQUARE_ENVIRONMENT;
  
  if (!squareAccessToken) {
    throw new Error('SQUARE_ACCESS_TOKEN environment variable is not configured');
  }
  
  // Determine environment
  let environment: Environment;
  if (squareEnvironment === 'production') {
    environment = Environment.Production;
  } else if (squareEnvironment === 'sandbox') {
    environment = Environment.Sandbox;
  } else {
    // Default to sandbox for development
    environment = Environment.Sandbox;
    console.warn('SQUARE_ENVIRONMENT not set or invalid, defaulting to sandbox');
  }
  
  return new Client({
    accessToken: squareAccessToken,
    environment: environment,
    userAgentDetail: 'LodgeTix UGLNSW'
  });
}

/**
 * Get Square Payments API client
 */
export function getSquarePaymentsApi() {
  const client = getSquareClient();
  return client.paymentsApi;
}

/**
 * Get Square Locations API client
 */
export function getSquareLocationsApi() {
  const client = getSquareClient();
  return client.locationsApi;
}

/**
 * Get Square Applications API client
 */
export function getSquareApplicationsApi() {
  const client = getSquareClient();
  return client.applePayApi;
}

/**
 * Get the configured Square environment
 */
export function getSquareEnvironment(): string {
  return process.env.SQUARE_ENVIRONMENT || 'sandbox';
}

/**
 * Get the Square application ID
 */
export function getSquareApplicationId(): string {
  const applicationId = process.env.SQUARE_APPLICATION_ID;
  if (!applicationId) {
    throw new Error('SQUARE_APPLICATION_ID environment variable is not configured');
  }
  return applicationId;
}

/**
 * Get the default location ID
 */
export function getSquareLocationId(): string {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    throw new Error('SQUARE_LOCATION_ID environment variable is not configured');
  }
  return locationId;
}

/**
 * Convert amount from dollars to cents (Square requires amounts in cents)
 */
export function convertToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert amount from cents to dollars
 */
export function convertToDollars(amountInCents: number): number {
  return Number((amountInCents / 100).toFixed(2));
}

/**
 * Generate idempotency key for Square API calls
 */
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Validate Square environment configuration
 */
export function validateSquareConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    errors.push('SQUARE_ACCESS_TOKEN is required');
  }
  
  if (!process.env.SQUARE_APPLICATION_ID) {
    errors.push('SQUARE_APPLICATION_ID is required');
  }
  
  if (!process.env.SQUARE_LOCATION_ID) {
    errors.push('SQUARE_LOCATION_ID is required');
  }
  
  const environment = process.env.SQUARE_ENVIRONMENT;
  if (environment && !['sandbox', 'production'].includes(environment)) {
    errors.push('SQUARE_ENVIRONMENT must be either "sandbox" or "production"');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if Square is in production mode
 */
export function isSquareProduction(): boolean {
  return process.env.SQUARE_ENVIRONMENT === 'production';
}

/**
 * Get Square webhook signature key
 */
export function getSquareWebhookSignatureKey(): string {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey) {
    throw new Error('SQUARE_WEBHOOK_SIGNATURE_KEY environment variable is not configured');
  }
  return signatureKey;
}

// Export the main client getter
export { getSquareClient };