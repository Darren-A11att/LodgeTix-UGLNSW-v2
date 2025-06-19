// Square Web Payments SDK configuration
export interface SquareConfig {
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
}

// Square Web Payments SDK card styling options
export const SQUARE_CARD_OPTIONS = {
  style: {
    input: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSize: '16px',
    },
    '.input-container': {
      borderColor: '#d1d5db',
      borderRadius: '6px',
      borderWidth: '1px',
    },
    '.input-container.is-focus': {
      borderColor: '#2563eb',
    },
    '.input-container.is-error': {
      borderColor: '#dc2626',
    },
    '.message-text': {
      color: '#dc2626',
    },
    '.message-text.is-error': {
      color: '#dc2626',
    },
  },
};

// Get validated Square configuration
export const getSquareConfig = (): SquareConfig | null => {
  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  const environment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT as 'sandbox' | 'production';

  if (!applicationId) {
    console.error('NEXT_PUBLIC_SQUARE_APPLICATION_ID is not defined');
    return null;
  }

  if (!locationId) {
    console.error('NEXT_PUBLIC_SQUARE_LOCATION_ID is not defined');
    return null;
  }

  if (!environment || (environment !== 'sandbox' && environment !== 'production')) {
    console.error('NEXT_PUBLIC_SQUARE_ENVIRONMENT must be "sandbox" or "production"');
    return null;
  }

  return {
    applicationId,
    locationId,
    environment,
  };
};

// Square Web Payments SDK script URL
export const getSquareScriptUrl = (environment: 'sandbox' | 'production'): string => {
  return environment === 'sandbox' 
    ? 'https://sandbox.web.squarecdn.com/v1/square.js'
    : 'https://web.squarecdn.com/v1/square.js';
};