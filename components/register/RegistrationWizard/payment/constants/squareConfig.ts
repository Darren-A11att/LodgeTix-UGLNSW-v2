/**
 * Square Configuration Constants
 * Client-side configuration for Square payment processing
 */

import { getPaymentConfig } from '@/lib/config/payment';

// Get Square configuration from environment
export const SQUARE_APPLICATION_ID = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '';
export const SQUARE_ENVIRONMENT = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox';

// Square card form styling options
export const SQUARE_CARD_OPTIONS = {
  style: {
    fontSize: '16px',
    color: '#1f2937',
    fontFamily: 'system-ui, sans-serif',
    '::placeholder': {
      color: '#9ca3af',
    },
    '.input-container': {
      borderRadius: '6px',
      borderColor: '#d1d5db',
    },
    '.input-container.is-focus': {
      borderColor: '#3b82f6',
    },
    '.input-container.is-error': {
      borderColor: '#ef4444',
    },
  },
};

// Square payment form options
export const SQUARE_PAYMENT_OPTIONS = {
  applicationId: SQUARE_APPLICATION_ID,
  environment: SQUARE_ENVIRONMENT,
  locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '',
};

// Validation helpers
export function validateSquareConfig(): string[] {
  const errors: string[] = [];

  if (!SQUARE_APPLICATION_ID) {
    errors.push('NEXT_PUBLIC_SQUARE_APPLICATION_ID is required');
  }

  if (!SQUARE_ENVIRONMENT) {
    errors.push('NEXT_PUBLIC_SQUARE_ENVIRONMENT is required');
  } else {
    const validEnvironments = ['sandbox', 'production'];
    if (!validEnvironments.includes(SQUARE_ENVIRONMENT)) {
      errors.push('Invalid Square environment (must be sandbox or production)');
    }
  }

  if (!process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
    errors.push('NEXT_PUBLIC_SQUARE_LOCATION_ID is required');
  }

  return errors;
}

// Check if Square is properly configured
export function isSquareConfigured(): boolean {
  return validateSquareConfig().length === 0;
}