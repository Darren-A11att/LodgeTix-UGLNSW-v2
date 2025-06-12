import { NextRequest, NextResponse } from 'next/server';

/**
 * Payment Return Handler
 * This endpoint handles returns from redirect-based payment methods
 * (e.g., BACS, SEPA, Bancontact, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');
    
    console.log('💳 Payment return handler:', {
      paymentIntentId,
      redirectStatus,
      hasClientSecret: !!paymentIntentClientSecret
    });
    
    // For now, just redirect to a generic success page
    // In a real implementation, you'd:
    // 1. Verify the payment intent status
    // 2. Update your database
    // 3. Redirect to appropriate confirmation page
    
    if (redirectStatus === 'succeeded') {
      return NextResponse.redirect(new URL('/payment/success', request.url));
    } else if (redirectStatus === 'failed') {
      return NextResponse.redirect(new URL('/payment/failed', request.url));
    } else {
      return NextResponse.redirect(new URL('/payment/pending', request.url));
    }
    
  } catch (error) {
    console.error('Error in payment return handler:', error);
    return NextResponse.redirect(new URL('/payment/error', request.url));
  }
}