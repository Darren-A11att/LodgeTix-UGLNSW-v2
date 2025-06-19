/**
 * Payment Service - Square Implementation
 * Replaced Stripe functionality with Square payment processing
 */

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

/**
 * Create a Square payment
 * @deprecated This function is being replaced by the unified payment service
 */
export async function createSquarePayment(
  amount: number,
  currency: string = 'AUD',
  token: string,
  metadata?: Record<string, string>
): Promise<PaymentResult> {
  console.warn('createSquarePayment is deprecated. Use unified payment service instead.');
  
  try {
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        paymentMethodId: token,
        metadata,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Payment failed');
    }

    return {
      success: true,
      paymentId: result.paymentIntentId,
    };
  } catch (error: any) {
    console.error('Error creating Square payment:', error);
    return {
      success: false,
      error: error.message || 'Payment processing failed',
    };
  }
}

/**
 * Get user orders - placeholder for Square implementation
 * @deprecated Use the registration service instead
 */
export async function getUserOrders() {
  console.warn('getUserOrders is deprecated. Use registration service instead.');
  return [];
}

/**
 * Get user subscription - not applicable for Square
 * @deprecated Square doesn't handle subscriptions the same way as Stripe
 */
export async function getUserSubscription() {
  console.warn('getUserSubscription is not applicable for Square payments.');
  return null;
}

/**
 * Legacy mock function - kept for compatibility
 * @deprecated Use the Square payment flow instead
 */
export async function mockSuccessfulPayment(productId: string) {
  console.warn('mockSuccessfulPayment is deprecated. Use Square payment flow instead.');
  return {
    id: `mock_payment_${Date.now()}`,
    status: 'succeeded',
    amount: 0,
    currency: 'AUD',
  };
}