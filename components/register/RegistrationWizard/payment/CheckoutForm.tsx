"use client"

import { useState, memo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import { CreditCard, ShieldCheck } from "lucide-react";
import { CARD_ELEMENT_OPTIONS } from "./CardElementOptions";
import { CheckoutFormProps, StripeBillingDetailsForClient } from "./types";

// Add global type declarations for our window extensions
declare global {
  interface Window {
    __registrationResult?: any;
    __registrationId?: string;
  }
}

export const CheckoutForm = memo(function CheckoutForm({
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
  setIsProcessingPayment,
  billingDetails
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string | null>(null);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const paymentElementRef = useRef<HTMLDivElement>(null);
  
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

  // Listen for validation failure event to reset state
  useEffect(() => {
    const handleValidationFailed = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log("🚫 Payment validation failed:", customEvent.detail);
      
      // Reset the submission state so user can try again
      setIsSubmittingRegistration(false);
      setIsProcessingPayment(false);
      
      // Show the error message to user if provided
      if (customEvent.detail?.message) {
        onPaymentError(customEvent.detail.message);
      }
    };
    
    window.addEventListener('paymentValidationFailed', handleValidationFailed);
    console.log("🎯 CheckoutForm: Added paymentValidationFailed event listener");
    
    return () => {
      window.removeEventListener('paymentValidationFailed', handleValidationFailed);
      console.log("🎯 CheckoutForm: Removed paymentValidationFailed event listener");
    };
  }, [onPaymentError, setIsProcessingPayment]);
  
  // Listen for the continuePayment event
  useEffect(() => {
    const handleContinuePayment = async (e: Event) => {
      console.log("🔄 Continuing payment after registration saved");
      
      // Get detailed event information
      const customEvent = e as CustomEvent;
      console.log("Event detail:", customEvent.detail);
      
      // Debug current context
      console.log("📊 CheckoutForm State Check:");
      console.log("  • Payment Element Exists:", !!paymentElementRef.current);
      console.log("  • Stripe Ready:", !!stripe);
      console.log("  • Elements Ready:", !!elements);
      console.log("  • Client Secret:", clientSecret ? "exists" : "missing");
      
      // Get the registration result from the window global or event detail
      let registrationId;
      let registrationResult = window.__registrationResult;
      
      console.log("Initial window.__registrationResult:", registrationResult);
      
      // First check if the event contains registration details
      if (customEvent.detail?.registrationId) {
        registrationId = customEvent.detail.registrationId;
        console.log("Using registration ID from event detail:", registrationId);
        
        // If the event also has the full result, update the window storage
        if (customEvent.detail.registrationResult) {
          window.__registrationResult = customEvent.detail.registrationResult;
          // Verify the update worked
          const verifyResult = window.__registrationResult;
          console.log("Updated window.__registrationResult:", verifyResult);
          console.log("ID match check:", 
            verifyResult?.registrationId === customEvent.detail.registrationId ? "✅ Match" : "❌ Mismatch");
        }
      }
      // Otherwise try the window storage
      else if (registrationResult?.registrationId) {
        registrationId = registrationResult.registrationId;
        console.log("Using registration ID from window.__registrationResult:", registrationId);
      } 
      // Last resort - check the standalone ID property
      else if (window.__registrationId) {
        registrationId = window.__registrationId;
        console.log("Using registration ID from window.__registrationId:", registrationId);
        
        // Create a minimal registrationResult
        window.__registrationResult = {
          registrationId: registrationId,
          success: true
        };
        console.log("Created minimal __registrationResult from ID");
      }
      else {
        console.error("❌ Missing registration data in handleContinuePayment");
        console.error("Event detail:", customEvent.detail);
        console.error("__registrationResult:", registrationResult);
        console.error("__registrationId:", window.__registrationId);
        onPaymentError("Registration data was not properly saved before payment processing. Please try again.");
        return;
      }
      
      console.log("💾 Using registration ID for payment:", registrationId);
      
      if (!stripe || !elements) {
        console.error("Stripe not initialized");
        onPaymentError("Payment system not initialized. Please refresh and try again.");
        return;
      }

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        console.error("Card element not found");
        onPaymentError("Payment form not fully loaded. Please refresh and try again.");
        return;
      }

      setIsProcessingPayment(true);

      try {
        // Two-step flow: Create payment method token
        console.log("💳 Creating payment method token");
        const { error: tokenError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: getBillingDetailsForStripe(),
        });

        if (tokenError) {
          console.error("Token creation error:", tokenError);
          onPaymentError(`Failed to create payment method: ${tokenError.message}`);
          return;
        }

        if (paymentMethod) {
          console.log("Payment method created:", paymentMethod.id);
          // Pass payment method ID to parent
          onPaymentSuccess(paymentMethod.id, getBillingDetailsForStripe());
        }
      } catch (err: any) {
        console.error("Payment processing error:", err);
        onPaymentError(`Error processing payment: ${err.message}`);
      } finally {
        setIsProcessingPayment(false);
        setIsSubmittingRegistration(false); // Always reset submission state
      }
    };
    
    // Add event listener to window for global event dispatch
    window.addEventListener('continuePayment', handleContinuePayment);
    console.log("🎯 CheckoutForm: Added continuePayment event listener to window");
    
    // Cleanup function
    return () => {
      window.removeEventListener('continuePayment', handleContinuePayment);
      console.log("🎯 CheckoutForm: Removed continuePayment event listener from window");
    };
  }, [stripe, elements, billingDetails, onPaymentSuccess, onPaymentError, setIsProcessingPayment]);

  // Cleanup effect to clear any submission timeout on unmount
  useEffect(() => {
    return () => {
      if ((window as any).__submissionTimeout) {
        clearTimeout((window as any).__submissionTimeout);
        delete (window as any).__submissionTimeout;
        console.log("🧹 Cleaned up submission timeout on unmount");
      }
    };
  }, []);

  const handleSubmit = async () => {
    // Using button click instead of form submit - no need for preventDefault
    setIsProcessingPayment(true);
    setCardError(null);
    setIsSubmittingRegistration(true);

    console.log("🔶 Stripe Payment Submit");
    console.log("🔶 Stripe instance ready:", stripe ? "yes" : "no");
    console.log("🔶 Elements ready:", elements ? "yes" : "no");

    if (!stripe || !elements) {
      onPaymentError("Stripe.js has not yet loaded.");
      setIsProcessingPayment(false);
      setIsSubmittingRegistration(false);
      return;
    }

    const cardElement = elements.getElement(CardElement) as StripeCardElement;
    console.log("🔶 Card element found:", cardElement ? "yes" : "no");
    
    if (!cardElement) {
      onPaymentError("Card element not found.");
      setIsProcessingPayment(false);
      setIsSubmittingRegistration(false);
      return;
    }
    
    // Add a safeguard timeout to prevent permanent locking
    const submissionTimeout = setTimeout(() => {
      console.warn("⏱️ Submission timeout - resetting state");
      setIsSubmittingRegistration(false);
      setIsProcessingPayment(false);
      onPaymentError("Payment processing timed out. Please try again.");
    }, 15000); // 15 second timeout
    
    // Store timeout ID for cleanup
    (window as any).__submissionTimeout = submissionTimeout;

    // Debug window state before dispatching event
    console.log("🔶 Global state check before saveRegistration event:");
    console.log("  • window.__registrationResult:", window.__registrationResult);
    console.log("  • window.__registrationId:", window.__registrationId);

    // First, trigger the parent form submission to save registration data
    // This uses a custom event dispatched to the window
    console.log("🔶 Dispatching saveRegistration event to window to save data first");
    const formSubmitEvent = new CustomEvent('saveRegistration', {
      bubbles: true,
      cancelable: true,
      detail: { isPaymentFormSubmit: true }
    });
    
    // Dispatch to window for consistent global event handling
    window.dispatchEvent(formSubmitEvent);
    
    // The actual payment processing is now handled by the continuePayment event listener
    
    // Clear any existing submission timeout when dispatching new request
    if ((window as any).__submissionTimeout) {
      clearTimeout((window as any).__submissionTimeout);
    }
  };

  return (
    <div className="space-y-6">
      <div ref={paymentElementRef}>
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
          disabled={!stripe || !elements || isSubmittingRegistration}
          className="w-full bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold flex items-center justify-center mt-4"
        >
          {isSubmittingRegistration ? (
            <>Processing...</>
          ) : (
            <><CreditCard className="mr-2 h-5 w-5" /> Pay ${totalAmount.toFixed(2)}</>
          )}
        </Button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render when relevant props change
  return (
    prevProps.clientSecret === nextProps.clientSecret &&
    prevProps.totalAmount === nextProps.totalAmount &&
    prevProps.billingDetails === nextProps.billingDetails
  );
});