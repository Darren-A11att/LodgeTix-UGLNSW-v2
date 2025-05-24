import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Validate environment variable exists at the module scope
if (!process.env.STRIPE_SECRET_KEY) {
  // This error will be thrown when the serverless function initializes if the key is missing
  console.error("FATAL ERROR: STRIPE_SECRET_KEY is not set in environment variables.");
}

// Initialize Stripe with your secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

// Stripe key validation successful

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil', // Using the version suggested by the linter for stripe@18.1.0
});

export async function POST(request: Request) {
  try {
    // Log request details
    console.group("🔄 Stripe Payment Intent Request");

    // Parse request body
    const requestBody = await request.json();
    console.log("Request payload:", JSON.stringify(requestBody, null, 2));

    const { amount, currency, idempotencyKey } = requestBody;

    if (!amount || !currency) {
      console.log("❌ Validation Error: Missing amount or currency");
      console.groupEnd();
      return NextResponse.json({ error: 'Missing amount or currency' }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      console.log(`❌ Validation Error: Invalid amount: ${amount}`);
      console.groupEnd();
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (typeof currency !== 'string' ) {
      console.log(`❌ Validation Error: Invalid currency: ${currency}`);
      console.groupEnd();
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }

    console.log(`Creating payment intent for ${amount / 100} ${currency.toUpperCase()}`);

    // Create start time for measuring performance
    const startTime = performance.now();

    // Prepare the options for the payment intent creation
    const paymentIntentOptions = {
      amount: Math.round(amount), // Amount in cents, ensure it's an integer
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      // You can add metadata here if needed, e.g., order ID, customer ID
      metadata: {
        created_at: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      },
    };

    // Options for the API call
    const apiOptions: Stripe.RequestOptions = {};
    
    // If idempotency key is provided, use it
    if (idempotencyKey) {
      console.log(`Using idempotency key: ${idempotencyKey.substring(0, 10)}...`);
      apiOptions.idempotencyKey = idempotencyKey;
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create(
      paymentIntentOptions,
      apiOptions
    );

    // Calculate duration
    const duration = Math.round(performance.now() - startTime);

    // Log response
    console.log(`✅ Payment Intent created in ${duration}ms`);
    console.log("Payment Intent ID:", paymentIntent.id);
    console.log("Client Secret (partial):", paymentIntent.client_secret
      ? `${paymentIntent.client_secret.substring(0, 10)}...`
      : "null");
    console.log("Status:", paymentIntent.status);
    console.groupEnd();

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      status: paymentIntent.status,
    });

  } catch (error: any) {
    console.group("❌ Stripe Payment Intent Error");
    console.error('Error creating PaymentIntent:', error);

    // Log additional details for debugging
    if (error instanceof Stripe.errors.StripeError) {
      console.log("Stripe Error Type:", error.type);
      console.log("Stripe Error Code:", error.code);
      console.log("Stripe Error Param:", error.param);
    }

    console.groupEnd();

    // Check for specific Stripe error types if needed
    if (error instanceof Stripe.errors.StripeError) {
        return NextResponse.json({
          error: error.message,
          type: error.type,
          code: error.code
        }, { status: error.statusCode || 500 });
    }

    return NextResponse.json({
      error: error.message || 'Failed to create PaymentIntent',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 