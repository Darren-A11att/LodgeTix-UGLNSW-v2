import { NextResponse } from 'next/server';
import { getPaymentConfig, validatePaymentConfig, getActivePaymentGateway } from '@/lib/config/payment';

export async function GET() {
  const paymentConfig = getPaymentConfig();
  const activeGateway = getActivePaymentGateway();
  const paymentErrors = validatePaymentConfig(paymentConfig);

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    
    // Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    
    // Payment Gateway Configuration
    PAYMENT_GATEWAY: process.env.PAYMENT_GATEWAY || 'SQUARE (default)',
    PLATFORM_FEE_PERCENTAGE: process.env.PLATFORM_FEE_PERCENTAGE || '0.022 (default)',
    PLATFORM_FEE_CAP: process.env.PLATFORM_FEE_CAP || '20 (default)',
    
    // Stripe Configuration
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'MISSING',
    
    // Square Configuration
    NEXT_PUBLIC_SQUARE_APPLICATION_ID: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ? 'SET' : 'MISSING',
    SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN ? 'SET' : 'MISSING',
    SQUARE_LOCATION_ID: process.env.SQUARE_LOCATION_ID ? 'SET' : 'MISSING',
    SQUARE_ENVIRONMENT: process.env.SQUARE_ENVIRONMENT || 'sandbox (default)',
    SQUARE_WEBHOOK_SIGNATURE_KEY: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ? 'SET' : 'MISSING',
  };

  return NextResponse.json({
    status: 'Environment variables check',
    environment: process.env.NODE_ENV,
    paymentGateway: {
      active: activeGateway,
      configured: paymentErrors.length === 0,
      errors: paymentErrors,
    },
    variables: envVars,
    timestamp: new Date().toISOString(),
  });
}