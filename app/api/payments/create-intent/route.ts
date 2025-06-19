/**
 * Unified Payment Intent Creation Endpoint
 * POST /api/payments/create-intent
 * 
 * This endpoint consolidates all payment intent creation logic into a single,
 * consistent implementation that ensures:
 * - Connected accounts receive exact subtotal amounts
 * - Correct fee calculations for domestic/international cards
 * - Comprehensive metadata with function details (not event)
 * - No premature status updates or confirmation generation
 * 
 * Updated to use Square CreatePayment API instead of Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedSquarePaymentService } from '@/lib/services/unified-square-payment-service';
import { createClient } from '@/utils/supabase/server';
import { createClientWithToken } from '@/utils/supabase/server-with-token';
import type { UnifiedPaymentRequest } from '@/lib/services/unified-square-payment-service';

export async function POST(request: NextRequest) {
  try {
    console.group('💳 Unified Payment Intent Creation');
    
    // Parse request body
    const body = await request.json();
    const { registrationId, paymentMethodId, billingDetails, sessionId, referrer } = body as UnifiedPaymentRequest;
    
    // Validate required fields
    if (!registrationId) {
      console.error('Missing registration ID');
      console.groupEnd();
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }
    
    if (!paymentMethodId) {
      console.error('Missing payment method ID');
      console.groupEnd();
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }
    
    if (!billingDetails || !billingDetails.address?.country) {
      console.error('Missing or incomplete billing details');
      console.groupEnd();
      return NextResponse.json(
        { error: 'Billing details with country are required for fee calculation' },
        { status: 400 }
      );
    }
    
    // Validate registration ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(registrationId)) {
      console.error(`Invalid registration ID format: ${registrationId}`);
      console.groupEnd();
      return NextResponse.json(
        { error: 'Invalid registration ID format' },
        { status: 400 }
      );
    }
    
    // Authenticate user using same dual pattern as registration API
    const authHeader = request.headers.get('authorization');
    console.log("Payment API - Auth header present:", !!authHeader);
    
    let user = null;
    let supabase = null;
    
    // Try auth header first (matches registration API pattern)
    if (authHeader) {
      console.log("Payment API - Attempting authentication with Authorization header");
      try {
        const result = await createClientWithToken(authHeader);
        supabase = result.supabase;
        user = result.user;
        console.log("Payment API - Successfully authenticated with Authorization header:", user.id);
      } catch (headerAuthError) {
        console.log("Payment API - Authorization header auth failed:", headerAuthError);
      }
    }
    
    // Fall back to cookie auth (matches registration API pattern)
    if (!user) {
      console.log("Payment API - Attempting cookie-based authentication");
      supabase = await createClient();
      
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      console.log("Payment API - Cookie auth result:", { user: cookieUser?.id, error: authError?.message });
      
      if (!authError && cookieUser) {
        user = cookieUser;
      }
    }
    
    // Handle authentication - support both authenticated and anonymous users
    const isAnonymousPayment = !user;
    
    if (isAnonymousPayment) {
      console.log('Payment API - Processing payment without authenticated user (anonymous registration)');
    } else {
      console.log('Payment API - Processing payment for authenticated user:', user.id);
    }
    
    // Verify user owns this registration (handle both authenticated and anonymous)
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('auth_user_id, status, payment_status')
      .eq('registration_id', registrationId)
      .single();
      
    if (regError || !registration) {
      console.error('Registration not found:', regError);
      console.groupEnd();
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    
    // For authenticated users, verify ownership
    // For anonymous registrations (auth_user_id is null), allow payment
    // For anonymous payment attempts, only allow if registration is also anonymous
    if (user && registration.auth_user_id !== null && registration.auth_user_id !== user.id) {
      console.error('User does not own this registration:', {
        currentUserId: user.id,
        registrationAuthUserId: registration.auth_user_id,
        registrationId: registrationId
      });
      console.groupEnd();
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // If no authenticated user but registration has an auth_user_id, block it
    if (!user && registration.auth_user_id !== null) {
      console.error('Anonymous user cannot pay for authenticated registration');
      console.groupEnd();
      return NextResponse.json(
        { error: 'Authentication required for this registration' },
        { status: 401 }
      );
    }
    
    // Log if this is an anonymous registration
    if (registration.auth_user_id === null) {
      console.log('Processing payment for anonymous registration');
    }
    
    // Check if already paid
    if (registration.status === 'completed' || registration.payment_status === 'completed') {
      console.error('Registration already paid');
      console.groupEnd();
      return NextResponse.json(
        { error: 'Registration has already been paid' },
        { status: 400 }
      );
    }
    
    console.log('Creating Square payment for registration:', {
      registrationId,
      userCountry: billingDetails.address.country,
      sessionId
    });
    
    // Create payment using unified Square service
    const paymentResponse = await unifiedSquarePaymentService.createPaymentIntent({
      registrationId,
      paymentMethodId, // ✅ Pass the payment method ID (Square nonce) to the service
      billingDetails,
      sessionId,
      referrer
    });
    
    console.log('Square payment created successfully:', {
      paymentId: paymentResponse.paymentId,
      totalAmount: paymentResponse.totalAmount,
      processingFees: paymentResponse.processingFees,
      subtotal: paymentResponse.subtotal,
      platformFee: paymentResponse.platformFee,
      status: paymentResponse.status
    });
    
    console.groupEnd();
    
    // Return response to client (maintaining compatibility with existing frontend)
    return NextResponse.json({
      clientSecret: paymentResponse.clientSecret, // Will be undefined for Square but keeps compatibility
      paymentIntentId: paymentResponse.paymentId, // Use Square payment ID
      paymentId: paymentResponse.paymentId, // Also provide as paymentId for clarity
      totalAmount: paymentResponse.totalAmount,
      processingFees: paymentResponse.processingFees,
      subtotal: paymentResponse.subtotal,
      status: paymentResponse.status
    });
    
  } catch (error: any) {
    console.error('Error creating Square payment:', error);
    console.groupEnd();
    
    // Handle specific error types
    if (error.message === 'Registration not found') {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    
    // Handle Square-specific errors
    if (error.message?.includes('Square payment failed:')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // Handle Square configuration errors
    if (error.message?.includes('SQUARE_') && error.message?.includes('not configured')) {
      return NextResponse.json(
        { error: 'Payment processing not properly configured' },
        { status: 500 }
      );
    }
    
    // Handle specific Square error codes
    if (error.errors && Array.isArray(error.errors)) {
      const squareErrors = error.errors.map((err: any) => err.detail || err.code).join(', ');
      return NextResponse.json(
        { error: `Payment failed: ${squareErrors}` },
        { status: 400 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}