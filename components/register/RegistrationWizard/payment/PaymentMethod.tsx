"use client"

import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutForm } from "./CheckoutForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethodProps {
  clientSecret: string | null;
  totalAmount: number;
  paymentIntentError: string | null;
  isPaymentIntentLoading: boolean;
  onPaymentSuccess: (paymentIntentId: string, billingDetails: any) => void;
  onPaymentError: (errorMessage: string) => void;
  setIsProcessingPayment: (isProcessing: boolean) => void;
  billingDetails: any;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
  clientSecret,
  totalAmount,
  paymentIntentError,
  isPaymentIntentLoading,
  onPaymentSuccess,
  onPaymentError,
  setIsProcessingPayment,
  billingDetails
}) => {
  // Show loading state
  if (isPaymentIntentLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Setting up payment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (paymentIntentError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Payment Setup Error</AlertTitle>
        <AlertDescription>{paymentIntentError}</AlertDescription>
      </Alert>
    );
  }

  // Show payment form when client secret is available
  if (clientSecret) {
    return (
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
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              clientSecret={clientSecret}
              totalAmount={totalAmount}
              onPaymentSuccess={onPaymentSuccess}
              onPaymentError={onPaymentError}
              setIsProcessingPayment={setIsProcessingPayment}
              billingDetails={billingDetails}
            />
          </Elements>
        </CardContent>
      </Card>
    );
  }

  // Fallback state
  return (
    <Alert>
      <AlertTitle>Payment Setup</AlertTitle>
      <AlertDescription>
        Preparing payment form. Please wait...
      </AlertDescription>
    </Alert>
  );
};