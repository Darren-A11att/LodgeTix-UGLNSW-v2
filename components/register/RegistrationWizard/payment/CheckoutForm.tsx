"use client"

import { useState, useImperativeHandle, forwardRef, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { SQUARE_CARD_OPTIONS } from "./SquareConfig";
import { CheckoutFormProps, SquareBillingDetails } from "./types";
import { useRouter } from 'next/navigation';

export interface CheckoutFormHandle {
  createPaymentMethod: () => Promise<{ token?: string; error?: string }>;
}

export const CheckoutForm = forwardRef<CheckoutFormHandle, CheckoutFormProps>(
  function CheckoutForm(
    {
      totalAmount,
      onPaymentSuccess,
      onPaymentError,
      setIsProcessingPayment,
      billingDetails,
      isProcessing = false,
      payments
    },
    ref
  ) {
    const router = useRouter();
    const cardRef = useRef<HTMLDivElement>(null);
    const [card, setCard] = useState<any>(null);
    const [cardError, setCardError] = useState<string | null>(null);
    const [isCardComplete, setIsCardComplete] = useState(false);
    const [isProcessingLocal, setIsProcessingLocal] = useState(false);
    
    // STEP 2: Check for completed registration & payment before starting payment
    const checkForCompletedRegistration = (): boolean => {
      console.log("🔍 STEP 2: Checking localStorage for completed registration & payment...");
      
      try {
        const recentRegistration = localStorage.getItem('recent_registration');
        if (recentRegistration) {
          const registrationData = JSON.parse(recentRegistration);
          
          console.log("📋 Found localStorage data:", {
            confirmationNumber: registrationData.confirmationNumber,
            registrationId: registrationData.registrationId,
            hasPaymentCompleted: !!registrationData.confirmationNumber
          });
          
          // Only redirect if this registration has a confirmation number (payment completed)
          if (registrationData.confirmationNumber) {
            console.log("✅ Found completed registration with confirmation:", registrationData.confirmationNumber);
            console.log("🚀 Redirecting to confirmation page to prevent duplicate payment");
            
            // Get the function slug from the current URL
            const pathSegments = window.location.pathname.split('/');
            const functionSlugIndex = pathSegments.indexOf('functions') + 1;
            const functionSlug = pathSegments[functionSlugIndex] || '';
            
            // Redirect to confirmation page
            router.push(`/functions/${functionSlug}/register/confirmation/fallback/${registrationData.confirmationNumber}`);
            return true; // Payment should be blocked
          } else {
            console.log("ℹ️ Found registration data but no confirmation number - proceeding with payment");
          }
        } else {
          console.log("ℹ️ No localStorage registration data found - proceeding with fresh payment");
        }
      } catch (error) {
        console.warn("⚠️ Error checking localStorage:", error);
        // Continue with payment if localStorage check fails
      }
      
      return false; // Proceed with payment
    };

    // Helper function to format billing details for Square
    const getBillingDetailsForSquare = (): SquareBillingDetails => {
      // billingDetails are already in Square format from UnifiedPaymentForm
      // Check if we have the Square format fields first
      if (billingDetails?.givenName) {
        return billingDetails as SquareBillingDetails;
      }
      
      // Fallback for legacy format (shouldn't happen in individuals flow)
      const addressLines = [billingDetails?.addressLine1 || ''];
      if (billingDetails?.businessName) {
        addressLines.push(billingDetails.businessName);
      }
      
      return {
        givenName: billingDetails?.firstName || 'Customer',
        familyName: billingDetails?.lastName || 'Name',
        email: billingDetails?.emailAddress || 'customer@example.com',
        phone: billingDetails?.mobileNumber || '',
        addressLines,
        city: billingDetails?.suburb || '',
        state: billingDetails?.stateTerritory?.name || '',
        postalCode: billingDetails?.postcode || '',
        country: billingDetails?.country?.isoCode || 'AU', // Default to AU for fee calculation
      };
    };

    // Initialize Square card component
    useEffect(() => {
      let cardInstance: any = null;
      let mounted = true;

      const initializeCard = async () => {
        if (!payments || !cardRef.current || card) return; // Don't reinitialize if card already exists

        try {
          console.log('🔧 Creating new Square card instance');
          cardInstance = await payments.card(SQUARE_CARD_OPTIONS);
          
          if (mounted) {
            await cardInstance.attach('#square-card-element');
            setCard(cardInstance);
            setIsCardComplete(true);
            console.log('✅ Square card attached successfully');
          }
        } catch (error: any) {
          console.error('❌ Error initializing Square card:', error);
          if (mounted) {
            setCardError('Failed to initialize payment form');
          }
        }
      };

      initializeCard();

      // Cleanup function with proper reference
      return () => {
        mounted = false;
        if (cardInstance) {
          console.log('🧹 Cleaning up Square card instance');
          cardInstance.destroy();
        }
      };
    }, [payments]); // Don't include card in dependencies to avoid re-initialization loop

    // Create payment method function using Square tokenization
    const createPaymentMethod = async () => {
      console.log("💳 CheckoutForm: Creating Square payment token");
      
      if (!payments || !card) {
        const error = "Payment system not ready. Please refresh and try again.";
        console.error("Square not initialized", { payments: !!payments, card: !!card });
        setCardError(error);
        return { error };
      }

      setCardError(null);
      setIsProcessingLocal(true);
      setIsProcessingPayment(true);

      try {
        // Tokenize card using simple Square tokenization (as per docs)
        console.log("🔍 Starting Square tokenization...");
        const result = await card.tokenize();

        if (result.status === 'OK' && result.token) {
          console.log("✅ Square token created:", result.token);
          // Call the success handler with token and billing details
          await onPaymentSuccess(result.token, getBillingDetailsForSquare());
          return { token: result.token };
        } else if (result.errors) {
          const errorMessage = result.errors.map(error => error.detail || error.message).join(', ');
          console.error("Square tokenization errors:", result.errors);
          console.error("Full error details:", JSON.stringify(result.errors, null, 2));
          setCardError(errorMessage);
          return { error: errorMessage };
        }
        
        return { error: "Failed to create payment token" };
      } catch (err: any) {
        console.error("Square payment error:", err);
        const errorMsg = err.message || "An unexpected error occurred";
        setCardError(errorMsg);
        onPaymentError(errorMsg);
        return { error: errorMsg };
      } finally {
        setIsProcessingLocal(false);
        setIsProcessingPayment(false);
      }
    };

    // Expose createPaymentMethod to parent via ref
    useImperativeHandle(ref, () => ({
      createPaymentMethod
    }));

    // Handle direct button click
    const handleButtonClick = async () => {
      console.log("💳 STEP 1: User clicks Pay Now");
      
      // STEP 2: Check for completed registration & payment before starting payment processing
      const shouldBlockPayment = checkForCompletedRegistration();
      if (shouldBlockPayment) {
        console.log("🚫 Payment blocked - redirecting to existing confirmation");
        return; // Stop here, redirect already happened
      }
      
      console.log("✅ No completed registration found - proceeding with payment");
      // STEP 3: Proceed with payment method creation
      await createPaymentMethod();
    };

    // Guard against Square not being available
    if (!payments) {
      return (
        <div className="space-y-6">
          <div className="p-4 border border-red-300 rounded-md bg-red-50">
            <p className="text-sm text-red-700">
              Payment system is initializing. Please wait a moment and try again.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <label htmlFor="square-card-element" className="block text-sm font-medium text-gray-700 mb-1">
            We accept Visa, Mastercard or American Express
          </label>
          <div 
            id="square-card-element" 
            ref={cardRef}
            className="min-h-[40px] p-2"
          />
          {cardError && <p className="mt-2 text-sm text-red-600">{cardError}</p>}
          <p className="mt-2 text-xs text-gray-500 flex items-center">
            <ShieldCheck className="h-3 w-3 mr-1 text-green-600" /> Your payment information is securely processed.
          </p>
        </div>

        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CreditCard className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Total amount: ${totalAmount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AUD
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Your card will be charged upon confirmation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment button - only shown when parent doesn't control submission */}
        {!isProcessing && (
          <Button
            type="button"
            onClick={handleButtonClick}
            disabled={!payments || !card || isProcessingLocal}
            className="w-full"
          >
            {isProcessingLocal ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Complete Payment'
            )}
          </Button>
        )}
      </div>
    );
  }
);