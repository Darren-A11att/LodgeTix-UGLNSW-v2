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

export class SquareErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a Square Web Payments SDK related error
    const isSquareError = error.message.includes('Square') || 
                         error.message.includes('payments') ||
                         error.message.includes('tokenize') ||
                         error.stack?.includes('square') || 
                         error.message.includes('Cannot read properties of undefined');
    
    return {
      hasError: isSquareError,
      error: isSquareError ? error : null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Square Error Boundary caught an error:', error, errorInfo);
    
    // Log to error reporting service
    if (error.message.includes('Square') || error.stack?.includes('square')) {
      console.error('Square Web Payments SDK error detected:', {
        error: error.message,
        stack: error.stack,
        applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ? 'SET' : 'MISSING',
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ? 'SET' : 'MISSING',
        environment: process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT
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