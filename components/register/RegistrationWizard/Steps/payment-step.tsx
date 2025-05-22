"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistrationStore, UnifiedAttendeeData, BillingDetailsType } from '../../../../lib/registrationStore';
import { 
  billingDetailsSchema, 
  type BillingDetails as FormBillingDetailsSchema,
} from "@/lib/billing-details-schema";
import { supabase } from "@/lib/supabase"; // Import Supabase client
import TurnstileWidget from '@/components/TurnstileWidget'; // Import TurnstileWidget

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StripeBillingDetailsForClient } from "../payment/types";

// Import modular components
import { BillingDetailsForm } from "../payment/BillingDetailsForm";
import { PaymentMethod } from "../payment/PaymentMethod";
import { OrderSummary } from "../payment/OrderSummary";
import { TwoColumnStepLayout } from "../Layouts/TwoColumnStepLayout";

// Placeholder ticket definitions (should be imported from a shared source eventually)
const ticketTypesMinimal = [
  { id: "d5891f32-a57c-48f3-b71a-3832eb0c8f21", name: "Installation Ceremony", price: 75 },
  { id: "f2c9b7e1-d85a-4e03-9c53-4b7f62e8d9a3", name: "Grand Banquet", price: 150 },
  { id: "7ae31d05-6f8b-49ec-b2c8-18df3ef7d9b6", name: "Farewell Brunch", price: 45 },
  { id: "3c5b1e8d-947a-42f6-b837-0d72c614a53f", name: "City Tour", price: 60 },
];
const ticketPackagesMinimal = [
  { id: "a9e3d210-7f65-4c8b-9d1a-f5b83e92c615", name: "Complete Package", price: 250, includes: ["d5891f32-a57c-48f3-b71a-3832eb0c8f21", "f2c9b7e1-d85a-4e03-9c53-4b7f62e8d9a3", "7ae31d05-6f8b-49ec-b2c8-18df3ef7d9b6", "3c5b1e8d-947a-42f6-b837-0d72c614a53f"] },
  { id: "b821c7d5-3e5f-49a2-8d16-7e09bf432a87", name: "Ceremony & Banquet", price: 200, includes: ["d5891f32-a57c-48f3-b71a-3832eb0c8f21", "f2c9b7e1-d85a-4e03-9c53-4b7f62e8d9a3"] },
  { id: "c743e9f1-5a82-4d07-b6c3-8901fdae5243", name: "Social Package", price: 180, includes: ["f2c9b7e1-d85a-4e03-9c53-4b7f62e8d9a3", "7ae31d05-6f8b-49ec-b2c8-18df3ef7d9b6", "3c5b1e8d-947a-42f6-b837-0d72c614a53f"] },
];

// Add global type declarations for our window extensions
declare global {
  interface Window {
    __registrationResult?: any;
    __registrationId?: string;
  }
}

// Props interface for PaymentStep
interface PaymentStepProps {
  onSaveData?: () => Promise<{ success: boolean; registrationId?: string; error?: string }>;
  onFormSubmit?: (data: any) => void;
}

function PaymentStep(props: PaymentStepProps = {}) {
  // Store state from Zustand
  const allStoreAttendees = useRegistrationStore((s) => s.attendees);
  const registrationType = useRegistrationStore((s) => s.registrationType);
  const storeBillingDetails = useRegistrationStore((s) => s.billingDetails);
  const updateStoreBillingDetails = useRegistrationStore((s) => s.updateBillingDetails);
  const setStoreConfirmationNumber = useRegistrationStore((s) => s.setConfirmationNumber);
  const storeDraftId = useRegistrationStore((s) => s.draftId);
  const goToNextStep = useRegistrationStore((s) => s.goToNextStep);
  const goToPrevStep = useRegistrationStore((s) => s.goToPrevStep);

  // Derive attendee data
  const primaryAttendee = useMemo(() => 
    allStoreAttendees.find(att => att.isPrimary),
    [allStoreAttendees]
  );
  const otherAttendees = useMemo(() => 
    allStoreAttendees.filter(att => !att.isPrimary),
    [allStoreAttendees]
  );

  // Derive ticket data for summary and submission
  const currentTicketsForSummary = useMemo(() => {
    return allStoreAttendees.flatMap(attendee => {
      if (!attendee.ticket) return [];
      const { ticketDefinitionId, selectedEvents } = attendee.ticket;
      const attendeeId = attendee.attendeeId;
      let tickets: Array<{ id: string; name: string; price: number; attendeeId: string; isPackage?: boolean; description?: string }> = [];

      if (ticketDefinitionId) {
        const pkgInfo = ticketPackagesMinimal.find(p => p.id === ticketDefinitionId);
        if (pkgInfo) {
          tickets.push({ 
            id: `${attendeeId}-${pkgInfo.id}`,
            name: pkgInfo.name, 
            price: pkgInfo.price, 
            attendeeId, 
            isPackage: true,
            description: `Package: ${pkgInfo.name}` // Simplified description for summary
          });
        }
      } else {
        selectedEvents?.forEach(eventId => {
          const eventInfo = ticketTypesMinimal.find(e => e.id === eventId);
          if (eventInfo) {
            tickets.push({ 
              id: `${attendeeId}-${eventInfo.id}`,
              name: eventInfo.name, 
              price: eventInfo.price, 
              attendeeId, 
              isPackage: false,
              description: eventInfo.name // Simplified description for summary
            });
          }
        });
      }
      return tickets;
    });
  }, [allStoreAttendees]);

  // Local component state
  const [localPaymentProcessingError, setLocalPaymentProcessingError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPaymentIntentLoading, setIsPaymentIntentLoading] = useState(false);
  const [paymentIntentError, setPaymentIntentError] = useState<string | null>(null);
  const [isPaymentIntentReady, setIsPaymentIntentReady] = useState(false);
  const [confirmedRegistrationId, setConfirmedRegistrationId] = useState<string | null>(null);

  // New state variables for Turnstile and Anonymous Auth
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isVerifyingTurnstileAndAuth, setIsVerifyingTurnstileAndAuth] = useState(false);
  const [turnstileAuthError, setTurnstileAuthError] = useState<string | null>(null);
  const [anonymousSessionInitiated, setAnonymousSessionInitiated] = useState(false);
  const [showTurnstile, setShowTurnstile] = useState(false); // Control when to show the widget
  const [currentSupabaseSession, setCurrentSupabaseSession] = useState<any>(null); // To store session info

  // Calculate total amount from derived tickets
  const totalAmount = useMemo(() => 
    currentTicketsForSummary.reduce((sum, ticket) => sum + ticket.price, 0), 
    [currentTicketsForSummary]
  );

  // Setup form with Zod validation
  const form = useForm<FormBillingDetailsSchema>({
    resolver: zodResolver(billingDetailsSchema),
    defaultValues: {
      billToPrimary: false,
      firstName: '',
      lastName: '',
      businessName: '',
      addressLine1: '',
      mobileNumber: '',
      suburb: '',
      postcode: '',
      emailAddress: '',
      country: undefined,
      stateTerritory: undefined,
    },
  });

  // Create a debounced payment intent creation function
  const createPaymentIntent = useCallback(async () => {
    if (totalAmount <= 0) return;
    
    try {
      console.log("💰 Calling Stripe API to create payment intent...");
      
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount: totalAmount * 100, 
          currency: 'aud',
          idempotencyKey: `order-${Date.now()}-${Math.random().toString(36).substring(2, 10)}` 
        }),
      });

      console.log("💰 Stripe API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("💰 Stripe API error:", errorData);
        throw new Error(errorData.error || `Failed to create payment intent: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("💰 Stripe API success, client secret received (first 10 chars):", 
        data.clientSecret ? data.clientSecret.substring(0, 10) + "..." : "none");
      
      setClientSecret(data.clientSecret);
      setIsPaymentIntentReady(true);
    } catch (error: any) {
      console.error("💰 Error creating payment intent:", error);
      setPaymentIntentError(error.message);
      setIsPaymentIntentReady(false);
    } finally {
      setIsPaymentIntentLoading(false);
    }
  }, [totalAmount]);

  // Check for existing Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching Supabase session:", error);
        setTurnstileAuthError("Could not check user session.");
      } else if (session) {
        console.log("Existing Supabase session found:", session.user.id, "Is anonymous:", session.user.is_anonymous);
        setCurrentSupabaseSession(session);
        setAnonymousSessionInitiated(true); // Treat existing session as initiated
        setShowTurnstile(false); // No need for Turnstile if already session
      } else {
        console.log("No existing Supabase session. Turnstile might be needed.");
        setShowTurnstile(true); // Show Turnstile if no session
      }
    };
    checkSession();
  }, []);

  const handleTurnstileToken = async (token: string) => {
    setTurnstileToken(token);
    setIsVerifyingTurnstileAndAuth(true);
    setTurnstileAuthError(null);

    try {
      const response = await fetch('/api/verify-turnstile-and-anon-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success && result.anonymousAuthUser) {
        console.log('Turnstile verified and anonymous Supabase session initiated:', result.anonymousAuthUser.id);
        setAnonymousSessionInitiated(true);
        setShowTurnstile(false); // Hide Turnstile after success
        // Re-check session to ensure Supabase client picks it up
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentSupabaseSession(session);
      } else {
        console.error('Turnstile/Auth API call failed:', result.error, result.errorCodes);
        setTurnstileAuthError(result.error || 'Turnstile verification or anonymous sign-in failed.');
        // Potentially reset Turnstile widget here if needed, or allow user to retry
        window.turnstile?.reset?.('turnstile-widget-container');
        setTurnstileToken(null); // Reset token so user can try again
      }
    } catch (error: any) {
      console.error('Error calling verify-turnstile-and-anon-auth:', error);
      setTurnstileAuthError('An unexpected error occurred during verification.');
      window.turnstile?.reset?.('turnstile-widget-container');
      setTurnstileToken(null);
    } finally {
      setIsVerifyingTurnstileAndAuth(false);
    }
  };

  // Modify the payment intent creation effect
  useEffect(() => {
    console.log("EFFECT: Payment Intent Creation Logic RUNNING");
    console.log("EFFECT: totalAmount:", totalAmount);
    console.log("EFFECT: clientSecret:", clientSecret ? "exists" : "null");
    console.log("EFFECT: anonymousSessionInitiated:", anonymousSessionInitiated);
    console.log("EFFECT: currentSupabaseSession:", currentSupabaseSession ? "exists" : "null");
    console.log("EFFECT: isVerifyingTurnstileAndAuth:", isVerifyingTurnstileAndAuth);

    if (totalAmount > 0) {
      if (anonymousSessionInitiated) {
        console.log("EFFECT: CONDITION MET - Attempting to create payment intent.");
        setIsPaymentIntentLoading(true);
        setIsPaymentIntentReady(false);
        setPaymentIntentError(null);
        setClientSecret(null); // Reset client secret before creating a new one

        const timeoutId = setTimeout(() => {
          console.log("EFFECT: Timeout triggered, calling createPaymentIntent()");
          createPaymentIntent();
        }, 300);
        
        return () => {
          console.log("EFFECT: Cleanup function for payment intent timeout.");
          clearTimeout(timeoutId);
        };
      } else {
        console.log("EFFECT: CONDITION NOT MET (anonymousSessionInitiated is false) - Waiting for anonymous session.");
        if (!currentSupabaseSession && !isVerifyingTurnstileAndAuth && !showTurnstile) {
          console.log("EFFECT: Triggering Turnstile display because no session, not verifying, and not already shown.");
          setShowTurnstile(true);
        } else if (showTurnstile) {
            console.log("EFFECT: Turnstile is already set to be shown or is showing.");
        } else if (currentSupabaseSession) {
            console.log("EFFECT: Has currentSupabaseSession, but anonymousSessionInitiated is still false. This is odd.");
        } else if (isVerifyingTurnstileAndAuth) {
            console.log("EFFECT: Currently verifying Turnstile/Auth. Waiting.");
        }
      }
    } else {
      console.log("EFFECT: totalAmount is 0 or less. Not creating payment intent.");
    }
  }, [
    totalAmount, 
    createPaymentIntent,
    anonymousSessionInitiated, 
    currentSupabaseSession,
    isVerifyingTurnstileAndAuth
  ]);

  const handleSuccessfulPayment = async (paymentIntentId: string, stripeBillingDetailsUsed: StripeBillingDetailsForClient, regId: string) => {
    if (!regId) {
      console.error("❌ Critical Error: handleSuccessfulPayment called without a valid registrationId.");
      setLocalPaymentProcessingError("Failed to update registration: Missing critical registration ID after payment.");
      setIsProcessingPayment(false);
      return;
    }
    console.log("📝 Payment Success - Updating Registration");
    console.log("Payment Intent ID:", paymentIntentId);
    console.log("Registration ID for update:", regId);

    // Clear any previous errors
    setLocalPaymentProcessingError(null);
    setIsProcessingPayment(true); // Should already be true, but ensure

    try {
      // Validate UUID format for safety, though it should be server-generated
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(regId)) {
        console.error(`Invalid registration ID format for update: ${regId}`);
        setLocalPaymentProcessingError(`Invalid registration ID format: ${regId}. Cannot update payment status.`);
        setIsProcessingPayment(false);
        return;
      }

      console.log("Payment Update Data:", {
        paymentIntentId,
        totalAmount,
        status: "paid", // Or derive dynamically if needed
        paymentStatus: "completed", // Or derive dynamically if needed
      });

      const updateResponse = await fetch(`/api/registrations/${regId}/payment`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          totalAmount,
          status: "paid", // Example status, adjust as needed
          paymentStatus: "completed", // Example status, adjust as needed
        }),
      });

      console.log("Response Status:", updateResponse.status);
      const updateResult = await updateResponse.json();

      if (!updateResponse.ok) {
        console.error("API Error Response:", updateResult);
        throw new Error(
          updateResult.error || "Failed to update registration payment status"
        );
      }

      console.log("✅ Registration payment status updated:", updateResult);
      setStoreConfirmationNumber(updateResult.confirmationNumber || regId); // Use server's confirmation or fallback
      // Clear sensitive data from store if necessary, or mark registration as complete
      // e.g., useRegistrationStore.getState().clearSensitiveData();
      goToNextStep(); // Proceed to confirmation/thank you page

    } catch (error: any) {
      console.error("❌ Registration Update Error");
      console.error("Error updating registration payment status:", error.message);
      console.error("Stack Trace:", error.stack);
      setLocalPaymentProcessingError(`Payment succeeded, but failed to update registration: ${error.message}. Please contact support with your payment ID: ${paymentIntentId}.`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setLocalPaymentProcessingError(errorMessage);
    setIsProcessingPayment(false);
  };

  const {reset: resetBillingForm, formState: {isDirty: billingFormIsDirty, isValid: billingFormIsValid, errors: billingFormErrors}} = form;

  // Reference to payment element for event dispatch
  const paymentElementRef = React.useRef<HTMLDivElement>(null);

  // Passed as a prop to CheckoutForm
  // This function will be called by CheckoutForm AFTER Stripe payment is successful
  const onPaymentSuccessWrapper = (paymentIntentId: string, stripeBillingDetailsUsed: StripeBillingDetailsForClient) => {
    if (!confirmedRegistrationId) {
        console.error("CRITICAL: onPaymentSuccessWrapper called without confirmedRegistrationId. This should not happen.");
        setLocalPaymentProcessingError("A critical error occurred. Payment was made but registration update failed. Please contact support.");
        return;
    }
    handleSuccessfulPayment(paymentIntentId, stripeBillingDetailsUsed, confirmedRegistrationId);
  };

  const onBillingSubmit = async (data: FormBillingDetailsSchema) => {
    console.log("🔶 Billing Form Submit (onBillingSubmit)");
    if (!anonymousSessionInitiated) {
      setSubmissionError("Please complete the security check before proceeding.");
      console.error("Attempted to submit billing without anonymous session.");
      setShowTurnstile(true); // Ensure Turnstile is visible if not completed
      return;
    }
    console.log("🅿️ Billing details submitted:", data);
    updateStoreBillingDetails(data);
    setLocalPaymentProcessingError(null); // Clear previous errors
    setIsSubmittingOrder(true); // Indicate that the order submission process has started
    setSubmissionError(null);

    // Step 1: Save Registration Data via onSaveData prop or fallback to direct API call
    let saveDataFunction = props.onSaveData;
    
    // If no onSaveData prop is provided, create a fallback function
    if (!saveDataFunction) {
        console.warn("⚠️ onSaveData prop not provided, using fallback registration save function");
        saveDataFunction = async () => {
            // Fallback: directly call the registration API
            const registrationData = {
                registrationType,
                primaryAttendee,
                additionalAttendees: otherAttendees,
                tickets: currentTicketsForSummary,
                totalAmount,
                billingDetails: data,
                eventId: primaryAttendee?.eventId
            };
            
            const response = await fetch('/api/registrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registrationData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to save registration');
            }
            
            return result;
        };
    }

    try {
        console.log("📨 Attempting to save registration data first...");
        const saveResult = await saveDataFunction(); // Call the save function (prop or fallback)

        console.log("📬 Registration Save API Response:", saveResult);

        if (!saveResult || !saveResult.success || !saveResult.registrationId) {
            console.error("❌ Registration save failed or returned invalid data:", saveResult);
            const errorMessage = saveResult?.error || "Failed to save registration. Please try again.";
            setSubmissionError(errorMessage);
            setIsSubmittingOrder(false);
            return;
        }
        
        const serverGeneratedRegistrationId = saveResult.registrationId;
        console.log("✅ Registration saved successfully. Server Registration ID:", serverGeneratedRegistrationId);
        setConfirmedRegistrationId(serverGeneratedRegistrationId); // Store the TRUE ID

        // Step 2: If registration save is successful, dispatch event to trigger Stripe payment in CheckoutForm
        // This relies on CheckoutForm listening for this event and having clientSecret ready.
        if (paymentElementRef.current) {
            console.log("🔶 Dispatching continuePayment event to trigger Stripe payment processing.");
            // Pass the confirmed registration details, though CheckoutForm primarily needs to know to proceed.
            // The actual confirmedRegistrationId will be used by onPaymentSuccessWrapper.
            const continuePaymentEvent = new CustomEvent('continuePayment', { 
                detail: { /* No specific detail needed here anymore as CheckoutForm does not need to pass ID back */ } 
            });
            paymentElementRef.current.dispatchEvent(continuePaymentEvent);
        } else {
            console.error("❌ Payment element ref not found. Cannot dispatch continuePayment event.");
            setSubmissionError("Payment form error. Please refresh and try again.");
            setIsSubmittingOrder(false);
        }

    } catch (error: any) {
        console.error("❌ Error during registration save process:", error);
        setSubmissionError(`An error occurred while saving your registration: ${error.message}. Please try again.`);
        setIsSubmittingOrder(false);
    }
    // setIsSubmittingOrder(false); // Moved to finally block or after dispatch if payment is async and blocking further UI
  };
  
  // Effect to prefill form if primary attendee data is available
  useEffect(() => {
    if (primaryAttendee && form.getValues('billToPrimary')) {
      console.log('Prefilling billing details from primary attendee:', primaryAttendee);
      
      // Use setValue instead of form.reset to ensure the phone field updates correctly
      form.setValue('billToPrimary', true);
      form.setValue('firstName', primaryAttendee.firstName || '');
      form.setValue('lastName', primaryAttendee.lastName || '');
      form.setValue('mobileNumber', primaryAttendee.primaryPhone || '');
      form.setValue('emailAddress', primaryAttendee.primaryEmail || '');
      
    } else if (!form.getValues('billToPrimary')) {
      // Clear fields when bill to primary is unchecked
      form.setValue('firstName', '');
      form.setValue('lastName', '');
      form.setValue('mobileNumber', '');
      form.setValue('emailAddress', '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryAttendee, form.watch('billToPrimary')]);  // Explicitly disable exhaustive-deps rule

  // Render the form part
  const renderFormContent = () => {
    const onActualSubmit = form.handleSubmit(onBillingSubmit);

    // Check if we should be showing the Turnstile widget or payment form
    if (showTurnstile && !anonymousSessionInitiated && !currentSupabaseSession) {
      return (
        <div className="space-y-4 p-4 border rounded-md shadow-sm">
          <h3 className="text-lg font-semibold">Security Check</h3>
          <p className="text-sm text-muted-foreground">
            Please complete this quick security check to proceed with your registration.
          </p>
          <TurnstileWidget
            siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ''} // Ensure this env var is set
            onToken={handleTurnstileToken}
            onError={() => {
              setTurnstileAuthError('Failed to load or process security check. Please refresh or try again.');
            }}
          />
          {isVerifyingTurnstileAndAuth && <p className="text-sm">Verifying...</p>}
          {turnstileAuthError && (
            <Alert variant="destructive">
              <AlertTitle>Verification Error</AlertTitle>
              <AlertDescription>{turnstileAuthError}</AlertDescription>
            </Alert>
          )}
        </div>
      );
    }

    // If anonymous session is initiated or already existed, show the payment form
    return (
      <Form {...form}>
        <form 
          id="payment-step-form" // Make sure this ID matches what CheckoutForm expects if dispatching from there
          onSubmit={onActualSubmit} 
          className="space-y-8"
        >
          <BillingDetailsForm formControl={form.control} primaryAttendee={primaryAttendee} />
          <PaymentMethod 
            clientSecret={clientSecret}
            isPaymentIntentReady={isPaymentIntentReady}
            isProcessingPayment={isProcessingPayment}
            paymentIntentError={paymentIntentError}
            onPaymentSuccess={onPaymentSuccessWrapper}
            onPaymentError={handlePaymentError}
          />
          
          {localPaymentProcessingError && (
            <Alert variant="destructive">
              <AlertTitle>Payment Processing Error</AlertTitle>
              <AlertDescription>{localPaymentProcessingError}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={isProcessingPayment || isSubmittingOrder || !isPaymentIntentReady || !anonymousSessionInitiated}
            className="w-full"
            size="lg"
          >
            {isSubmittingOrder ? "Processing Order..." : (isProcessingPayment ? "Processing Payment..." : `Pay $${totalAmount.toFixed(2)}`)}
          </Button>
        </form>
      </Form>
    );
  };

  // Render the summary part
  const renderSummaryContent = () => (
    <OrderSummary
      primaryAttendee={primaryAttendee}
      additionalAttendees={otherAttendees}
      currentTickets={currentTicketsForSummary}
      totalAmount={totalAmount}
      isProcessingPayment={isProcessingPayment}
      isSubmittingOrder={isSubmittingOrder}
      isPaymentIntentLoading={isPaymentIntentLoading}
      localPaymentProcessingError={localPaymentProcessingError}
      submissionError={submissionError}
    />
  );

  return (
    <TwoColumnStepLayout
      renderLeftContent={renderFormContent}
      renderRightContent={renderSummaryContent}
      leftColumnTitle="Payment Details"
      rightColumnTitle="Order Summary"
      footerActions={(
        <>
          <Button variant="outline" onClick={goToPrevStep} disabled={isSubmittingOrder || isProcessingPayment}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous Step
          </Button>
          {/* The main submit button is now inside renderFormContent */}
          {/* Or, if you have a global submit button that triggers the form, ensure it checks anonymousSessionInitiated */}
        </>
      )}
      currentStepId="payment"
    />
  );
}

export default PaymentStep;