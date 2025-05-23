"use client"

import { Elements, StripeElementsOptions } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Info, Loader2 } from "lucide-react";
import { BillingDetails } from "@/lib/billing-details-schema";
import { CheckoutForm } from "./CheckoutForm";
import { StripeBillingDetailsForClient } from "./types";

// Initialize Stripe with publishable key from environment variables
// Using a hardcoded publishable test key for development to avoid environment variable issues
// This is only a test key, so it's safe to include in the source code for development purposes
// In production, you should use environment variables
const STRIPE_TEST_KEY = "pk_test_51RHeDLKBASow5NsWZ7rLKWR1Ebz1nOpzNchOdwhc2Bvkb3SZDGHA5X3vRO50wUwTtlMzmYOWXqpdFBgWfdb3cu1g00npSvJ5Gp";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || STRIPE_TEST_KEY);

interface PaymentMethodProps {
  clientSecret: string | null;
  totalAmount: number;
  paymentIntentError: string | null;
  isPaymentIntentLoading: boolean;
  onPaymentSuccess: (paymentIntentId: string, billingDetailsForStripe: StripeBillingDetailsForClient) => void;
  onPaymentError: (errorMessage: string) => void;
  setIsProcessingPayment: (isProcessing: boolean) => void;
  billingDetails: BillingDetails;
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
  const elementsOptions: StripeElementsOptions = clientSecret
    ? {
        clientSecret,
        appearance: { theme: 'stripe' },
        loader: 'auto', // Use auto loader
        // Disable features that might cause cross-origin issues
        allowedPresentationMethods: [], // Disable Apple Pay, Google Pay, etc.
      }
    : {};
  
  // No payment needed for free events
  if (totalAmount <= 0) {
    return null;
  }
  
  // Show loading state while payment intent is being created
  if (isPaymentIntentLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-8 mt-4 bg-white rounded-md shadow-lg p-6">
        <Loader2 className="h-10 w-10 animate-spin text-masonic-navy" />
        <p className="text-lg font-semibold text-masonic-navy">Initializing payment gateway...</p>
      </div>
    );
  }
  
  // Show error if payment intent creation failed
  if (paymentIntentError && !isPaymentIntentLoading) {
    return (
      <Alert variant="destructive" className="mt-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Payment Initialization Error</AlertTitle>
        <AlertDescription>{paymentIntentError}</AlertDescription>
      </Alert>
    );
  }
  
  // Show payment form once client secret is available
  if (clientSecret) {
    return (
      <Card className="border-masonic-gold shadow-md">
        <CardHeader className="bg-masonic-gold/10">
          <CardTitle className="flex items-center text-masonic-navy">
            <CreditCard className="mr-2 h-5 w-5" /> Payment Method
          </CardTitle>
          <CardDescription>Complete your registration by providing your payment details below.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Elements stripe={stripePromise} options={elementsOptions}>
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
  
  // Default case - something is wrong
  return null;
};