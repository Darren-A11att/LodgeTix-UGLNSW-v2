"use client"

import { useState, useImperativeHandle, forwardRef } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ShieldCheck } from "lucide-react";
import { CARD_ELEMENT_OPTIONS } from "./CardElementOptions";
import { CheckoutFormProps, StripeBillingDetailsForClient } from "./types";

export interface CheckoutFormHandle {
  createPaymentMethod: () => Promise<{ paymentMethodId?: string; error?: string }>;
}

export const CheckoutForm = forwardRef<CheckoutFormHandle, CheckoutFormProps>(
  function CheckoutForm(
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
    const stripe = useStripe();
    const elements = useElements();
    const [cardError, setCardError] = useState<string | null>(null);
    const [isCardComplete, setIsCardComplete] = useState(false);
    
    // Helper function to format billing details for Stripe
    const getBillingDetailsForStripe = (): StripeBillingDetailsForClient => {
      return {
        name: `${billingDetails.firstName} ${billingDetails.lastName}`,
        email: billingDetails.emailAddress,
        phone: billingDetails.mobileNumber,
        address: {
          line1: billingDetails.addressLine1,
          city: billingDetails.suburb,
          state: billingDetails.stateTerritory?.name,
          postal_code: billingDetails.postcode,
          country: billingDetails.country?.isoCode,
          ...(billingDetails.businessName ? { line2: billingDetails.businessName } : {})
        }
      };
    };

    // Expose createPaymentMethod to parent via ref
    useImperativeHandle(ref, () => ({
      createPaymentMethod: async () => {
        console.log("💳 CheckoutForm: Creating payment method");
        
        if (!stripe || !elements) {
          const error = "Payment system not ready. Please refresh and try again.";
          console.error("Stripe not initialized");
          setCardError(error);
          return { error };
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          const error = "Payment form not loaded. Please refresh and try again.";
          console.error("Card element not found");
          setCardError(error);
          return { error };
        }

        if (!isCardComplete) {
          const error = "Please complete your card details";
          setCardError(error);
          return { error };
        }

        setCardError(null);

        try {
          // Create payment method
          const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: getBillingDetailsForStripe(),
          });

          if (error) {
            console.error("Payment method error:", error);
            setCardError(error.message || "Failed to process payment details");
            return { error: error.message };
          } else if (paymentMethod) {
            console.log("✅ Payment method created:", paymentMethod.id);
            return { paymentMethodId: paymentMethod.id };
          }
          
          return { error: "Failed to create payment method" };
        } catch (err: any) {
          console.error("Payment error:", err);
          const errorMsg = err.message || "An unexpected error occurred";
          setCardError(errorMsg);
          return { error: errorMsg };
        }
      }
    }));

    // Handle card element changes
    const handleCardChange = (event: any) => {
      setCardError(event.error ? event.error.message : null);
      setIsCardComplete(event.complete);
    };

    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="card-element" className="block text-sm font-medium text-gray-700 mb-1">
            Credit or debit card
          </label>
          <div id="card-element" className="p-3 border border-gray-300 rounded-md bg-white">
            <CardElement 
              options={CARD_ELEMENT_OPTIONS} 
              onChange={handleCardChange}
            />
          </div>
          {cardError && <p className="mt-2 text-sm text-red-600">{cardError}</p>}
          <p className="mt-2 text-xs text-gray-500 flex items-center">
            <ShieldCheck className="h-3 w-3 mr-1 text-green-600" /> Your payment information is securely processed.
          </p>
        </div>

        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Total amount: ${totalAmount.toFixed(2)} AUD
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Your card will be charged upon confirmation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);