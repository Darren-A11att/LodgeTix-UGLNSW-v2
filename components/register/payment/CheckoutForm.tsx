"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import { CreditCard, ShieldCheck } from "lucide-react";
import { CARD_ELEMENT_OPTIONS } from "./CardElementOptions";
import { CheckoutFormProps, StripeBillingDetailsForClient } from "./types";

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  clientSecret,
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
  setIsProcessingPayment,
  billingDetails
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessingPayment(true);
    setCardError(null);

    if (!stripe || !elements) {
      onPaymentError("Stripe.js has not yet loaded.");
      setIsProcessingPayment(false);
      return;
    }

    const cardElement = elements.getElement(CardElement) as StripeCardElement;
    if (!cardElement) {
      onPaymentError("Card element not found.");
      setIsProcessingPayment(false);
      return;
    }

    const stripeBillingDetails: StripeBillingDetailsForClient = {
      name: `${billingDetails.firstName} ${billingDetails.lastName}`,
      email: billingDetails.emailAddress,
      phone: billingDetails.mobileNumber,
      address: {
        line1: billingDetails.addressLine1,
        city: billingDetails.suburb,
        state: billingDetails.stateTerritory?.name,
        postal_code: billingDetails.postcode,
        country: billingDetails.country?.isoCode,
      },
    };
    
    if (billingDetails.businessName) {
      stripeBillingDetails.address = stripeBillingDetails.address || {};
      stripeBillingDetails.address.line2 = billingDetails.businessName;
    }

    console.group("💳 Stripe Payment Confirmation");
    console.log("Stripe Billing Details being sent:", JSON.stringify(stripeBillingDetails, null, 2));
    console.log("Client Secret:", clientSecret ? `${clientSecret.substring(0, 10)}...` : "null");
    console.groupEnd();

    // Start time for measuring processing duration
    const startTime = performance.now();

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: stripeBillingDetails,
      },
    });

    // Log the payment intent result
    const duration = Math.round(performance.now() - startTime);
    console.group(`💳 Stripe Payment Result (${duration}ms)`);
    if (error) {
      console.error("Payment Error:", error);
    } else if (paymentIntent) {
      console.log("Payment Intent:", JSON.stringify({
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        created: new Date(paymentIntent.created * 1000).toISOString(),
      }, null, 2));
    } else {
      console.log("No payment intent or error returned");
    }
    console.groupEnd();

    if (error) {
      onPaymentError(error.message || "An unexpected error occurred during payment.");
      setIsProcessingPayment(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaymentSuccess(paymentIntent.id, stripeBillingDetails);
    } else {
      onPaymentError("Payment was not successful. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="card-element" className="block text-sm font-medium text-gray-700 mb-1">
          Credit or debit card
        </label>
        <div id="card-element" className="p-3 border border-gray-300 rounded-md bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        {cardError && <p className="mt-2 text-sm text-red-600">{cardError}</p>}
        <p className="mt-2 text-xs text-gray-500 flex items-center">
          <ShieldCheck className="h-3 w-3 mr-1 text-green-600" /> Your payment information is securely processed.
        </p>
      </div>
      
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || !elements || !clientSecret}
        className="w-full bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold flex items-center justify-center"
      >
        <CreditCard className="mr-2 h-5 w-5" />
        Pay ${totalAmount.toFixed(2)}
      </Button>
    </div>
  );
};