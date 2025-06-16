"use client"

import React, { forwardRef, useMemo } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutForm, CheckoutFormHandle } from "./CheckoutForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle } from "lucide-react";
import { StripeErrorBoundary } from "./StripeErrorBoundary";

// Validate Stripe key before attempting to load
const getStripeKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
    return null;
  }
  if (!key.startsWith('pk_')) {
    console.error('Invalid Stripe publishable key format:', key);
    return null;
  }
  return key;
};

const stripeKey = getStripeKey();

interface PaymentMethodProps {
  totalAmount: number;
  onPaymentSuccess: (paymentMethodId: string, billingDetails: any) => void;
  onPaymentError: (errorMessage: string) => void;
  setIsProcessingPayment: (isProcessing: boolean) => void;
  billingDetails: any;
  isProcessing?: boolean;
}

export const PaymentMethod = forwardRef<CheckoutFormHandle, PaymentMethodProps>(
  function PaymentMethod(
    {
      totalAmount,
      onPaymentSuccess,
      onPaymentError,
      setIsProcessingPayment,
      billingDetails,
      isProcessing = false
    },
    ref
  ) {
    // Create Stripe promise only if key is valid, and memoize it
    const stripePromise = useMemo(() => {
      if (!stripeKey) {
        return null;
      }
      try {
        return loadStripe(stripeKey);
      } catch (error) {
        console.error('Failed to load Stripe:', error);
        return null;
      }
    }, []);

    // Show error if Stripe key is invalid
    if (!stripeKey || !stripePromise) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
              Payment Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Payment processing is currently unavailable. Please contact support or try again later.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    return (
      <StripeErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Complete your registration by providing your payment details below.
            </p>
            <Elements stripe={stripePromise}>
              <CheckoutForm
                ref={ref}
                totalAmount={totalAmount}
                onPaymentSuccess={onPaymentSuccess}
                onPaymentError={onPaymentError}
                setIsProcessingPayment={setIsProcessingPayment}
                billingDetails={billingDetails}
                isProcessing={isProcessing}
              />
            </Elements>
          </CardContent>
        </Card>
      </StripeErrorBoundary>
    );
  }
);