"use client";

import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class StripeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a Stripe-related error
    const isStripeError = error.message.includes('match') || 
                         error.stack?.includes('stripe-js') || 
                         error.message.includes('Cannot read properties of undefined');
    
    return {
      hasError: isStripeError,
      error: isStripeError ? error : null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Stripe Error Boundary caught an error:', error, errorInfo);
    
    // Log to Sentry or other error reporting service
    if (error.message.includes('match') || error.stack?.includes('stripe-js')) {
      console.error('Stripe initialization error detected:', {
        error: error.message,
        stack: error.stack,
        stripeKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'MISSING'
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Payment processing is temporarily unavailable. Please refresh the page and try again. 
            If the problem persists, please contact support.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}