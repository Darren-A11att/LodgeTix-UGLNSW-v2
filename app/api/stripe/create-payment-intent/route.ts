import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Validate environment variable exists at the module scope
if (!process.env.STRIPE_SECRET_KEY) {
  // This error will be thrown when the serverless function initializes if the key is missing
  // It's better to catch this early.
  console.error("FATAL ERROR: STRIPE_SECRET_KEY is not set in environment variables.");
  // Depending on deployment, you might want the function to not even deploy or start.
  // For a running server, this check will prevent Stripe from being initialized without a key.
}

// Initialize Stripe with your secret key
// The console.log for debugging the key can be removed once the issue is resolved.
console.log("STRIPE_SECRET_KEY from env in API route:", process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { // The '!' asserts it's non-null after the check above
  apiVersion: '2025-04-30.basil', // Using the version suggested by the linter for stripe@18.1.0
});

export async function POST(request: Request) {
  // Re-check here as well, or rely on Stripe SDK to throw if key was truly undefined at init
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is missing during POST request processing.");
    return NextResponse.json({ error: 'Server configuration error: Stripe key missing.' }, { status: 500 });
  }
  try {
    // Log request details
    console.group("🔄 Stripe Payment Intent Request");

    // Parse request body
    const requestBody = await request.json();
    console.log("Request payload:", JSON.stringify(requestBody, null, 2));

    const { amount, currency } = requestBody;

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

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      // You can add metadata here if needed, e.g., order ID, customer ID
      metadata: {
        created_at: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      },
    });

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