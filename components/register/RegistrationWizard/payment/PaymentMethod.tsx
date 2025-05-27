"use client"

import React, { forwardRef } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutForm, CheckoutFormHandle } from "./CheckoutForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
    );
  }
);