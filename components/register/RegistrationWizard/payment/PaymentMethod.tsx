"use client"

import React, { forwardRef } from "react";
import { CheckoutForm, CheckoutFormHandle } from "./CheckoutForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle, ShieldCheck } from "lucide-react";
import { SquareErrorBoundary } from "./SquareErrorBoundary";
import { useSquareWebPayments } from "./useSquareWebPayments";
import { getSquareConfig } from "./SquareConfig";

interface PaymentMethodProps {
  totalAmount: number;
  onPaymentSuccess: (token: string, billingDetails: any) => void;
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
    const { payments, isLoaded, error } = useSquareWebPayments();
    const squareConfig = getSquareConfig();

    // Show error if Square configuration is invalid
    if (!squareConfig || error) {
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
                {error || 'Payment processing is currently unavailable. Please contact support or try again later.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    // Show loading state while Square Web Payments SDK initializes
    if (!isLoaded || !payments) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
              <p className="text-sm text-gray-700">
                Payment system is initializing. Please wait a moment...
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <SquareErrorBoundary>
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <CreditCard className="w-5 h-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Security Note */}
            <Alert className="border-blue-200 bg-blue-50">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                Your payment information is securely processed by Square. We never store your card details.
              </AlertDescription>
            </Alert>

            <CheckoutForm
              ref={ref}
              totalAmount={totalAmount}
              onPaymentSuccess={onPaymentSuccess}
              onPaymentError={onPaymentError}
              setIsProcessingPayment={setIsProcessingPayment}
              billingDetails={billingDetails}
              isProcessing={isProcessing}
              payments={payments}
            />
          </CardContent>
        </Card>
      </SquareErrorBoundary>
    );
  }
);