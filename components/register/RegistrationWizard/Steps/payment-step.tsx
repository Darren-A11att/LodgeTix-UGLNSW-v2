"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistrationStore, UnifiedAttendeeData, BillingDetailsType, selectAnonymousSessionEstablished } from '../../../../lib/registrationStore';
import { 
  billingDetailsSchema, 
  type BillingDetails as FormBillingDetailsSchema,
} from "@/lib/billing-details-schema";
import { getBrowserClient } from '@/lib/supabase-unified';

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
  const anonymousSessionEstablished = useRegistrationStore(selectAnonymousSessionEstablished);
  const setAnonymousSessionEstablished = useRegistrationStore((s) => s.setAnonymousSessionEstablished);

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

  // Fallback Turnstile state (only used if session lost)
  const [fallbackTurnstileToken, setFallbackTurnstileToken] = useState<string | null>(null);
  const [isFallbackVerifying, setIsFallbackVerifying] = useState(false);
  const [fallbackTurnstileError, setFallbackTurnstileError] = useState<string | null>(null);
  const [showFallbackTurnstile, setShowFallbackTurnstile] = useState(false);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);

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

  // Check session status on mount - simpler approach
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("🔍 Payment Step: Checking session status...");
        console.log("📊 Store anonymousSessionEstablished:", anonymousSessionEstablished);
        
        const { data: { session }, error } = await getBrowserClient().auth.getSession();
        if (error) {
          console.error("❌ Error checking session:", error);
          setShowFallbackTurnstile(true);
        } else if (session && session.user.is_anonymous) {
          console.log("✅ Valid anonymous session found");
          setAnonymousSessionEstablished(true);
          setShowFallbackTurnstile(false);
        } else {
          console.log("⚠️ No session found, but store indicates session was established");
          console.log("🔄 Attempting to refresh session...");
          
          // Try to refresh the session first
          try {
            const { data: { session: refreshedSession }, error: refreshError } = await getBrowserClient().auth.refreshSession();
            if (refreshedSession && refreshedSession.user.is_anonymous) {
              console.log("✅ Session refreshed successfully");
              setAnonymousSessionEstablished(true);
              setShowFallbackTurnstile(false);
            } else {
              console.log("❌ Session refresh failed - session truly lost");
              setAnonymousSessionEstablished(false);
              setShowFallbackTurnstile(true);
            }
          } catch (refreshError) {
            console.error("❌ Error refreshing session:", refreshError);
            setAnonymousSessionEstablished(false);
            setShowFallbackTurnstile(true);
          }
        }
      } catch (error) {
        console.error("❌ Unexpected error checking session:", error);
        setShowFallbackTurnstile(true);
      } finally {
        setSessionCheckComplete(true);
      }
    };
    
    checkSession();
  }, [anonymousSessionEstablished, setAnonymousSessionEstablished]);

  // Explicit Turnstile rendering for payment fallback
  useEffect(() => {
    if (!showFallbackTurnstile) return;

    const renderFallbackTurnstile = () => {
      const container = document.getElementById('payment-turnstile-container');
      if (!container) return;

      // Clear any existing widget
      container.innerHTML = '';

      if ((window as any).turnstile) {
        console.log("🔐 Payment Fallback: Explicitly rendering Turnstile widget");
        const widgetId = (window as any).turnstile.render('#payment-turnstile-container', {
          sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            console.log("🔐 Payment Fallback: Turnstile success callback triggered");
            handleFallbackTurnstileToken(token);
          },
          'error-callback': () => {
            console.error("🔐 Payment Fallback: Turnstile error callback triggered");
            setFallbackTurnstileError('Failed to load security verification. Please refresh and try again.');
          }
        });
        
        if (widgetId) {
          console.log("✅ Payment Fallback: Turnstile widget rendered with ID:", widgetId);
        } else {
          console.error("❌ Payment Fallback: Turnstile render failed");
          setFallbackTurnstileError('Failed to render security verification widget.');
        }
      } else {
        console.log("⏳ Payment Fallback: Turnstile not ready, waiting...");
        setTimeout(renderFallbackTurnstile, 500);
      }
    };

    // Simple polling approach - more reliable than turnstile.ready()
    renderFallbackTurnstile();
  }, [showFallbackTurnstile]);

  const handleFallbackTurnstileToken = async (token: string) => {
    setFallbackTurnstileToken(token);
    setIsFallbackVerifying(true);
    setFallbackTurnstileError(null);

    try {
      console.log("🔐 Fallback: Verifying Turnstile token and creating anonymous session...");
      const response = await fetch('/api/verify-turnstile-and-anon-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success && result.anonymousAuthUser) {
        console.log('✅ Fallback: Turnstile verified and anonymous session created:', result.anonymousAuthUser.id);
        setAnonymousSessionEstablished(true);
        setShowFallbackTurnstile(false);
        setFallbackTurnstileError(null);
        
        // Re-check session to ensure client picks it up
        const { data: { session } } = await getBrowserClient().auth.getSession();
        if (session) {
          console.log('✅ Fallback: Anonymous session confirmed on client');
        }
      } else {
        console.error('❌ Fallback: Turnstile/Auth verification failed:', result.error, result.errorCodes);
        setFallbackTurnstileError(result.error || 'Security verification failed. Please try again.');
        if (window.turnstile) {
          window.turnstile.reset?.('turnstile-widget-container');
        }
        setFallbackTurnstileToken(null);
      }
    } catch (error: any) {
      console.error('❌ Fallback: Error during Turnstile verification:', error);
      setFallbackTurnstileError('An unexpected error occurred during verification. Please try again.');
      if (window.turnstile) {
        window.turnstile.reset?.('turnstile-widget-container');
      }
      setFallbackTurnstileToken(null);
    } finally {
      setIsFallbackVerifying(false);
    }
  };

  // Simplified payment intent creation effect
  useEffect(() => {
    console.log("💰 Payment Intent Creation Logic");
    console.log("💰 totalAmount:", totalAmount);
    console.log("💰 anonymousSessionEstablished:", anonymousSessionEstablished);
    console.log("💰 sessionCheckComplete:", sessionCheckComplete);
    console.log("💰 clientSecret exists:", !!clientSecret);

    // Only create payment intent if session is established and we haven't created one yet
    if (totalAmount > 0 && anonymousSessionEstablished && sessionCheckComplete && !clientSecret && !isPaymentIntentLoading) {
      console.log("💰 Creating payment intent...");
      setIsPaymentIntentLoading(true);
      setIsPaymentIntentReady(false);
      setPaymentIntentError(null);

      // Small delay to ensure session is fully established
      const timeoutId = setTimeout(() => {
        createPaymentIntent();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      console.log("💰 Payment intent creation blocked:", {
        totalAmount: totalAmount > 0,
        sessionEstablished: anonymousSessionEstablished,
        sessionCheckComplete,
        hasClientSecret: !!clientSecret,
        isLoading: isPaymentIntentLoading
      });
    }
  }, [
    totalAmount, 
    createPaymentIntent,
    anonymousSessionEstablished,
    sessionCheckComplete,
    clientSecret,
    isPaymentIntentLoading
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
    if (!anonymousSessionEstablished) {
      setSubmissionError("Session expired. Please complete the security verification below before proceeding.");
      console.error("Attempted to submit billing without anonymous session.");
      setShowFallbackTurnstile(true); // Show fallback Turnstile
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

    // Show loading state while checking session
    if (!sessionCheckComplete) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-masonic-navy"></div>
          <p className="ml-3 text-masonic-navy">Verifying session...</p>
        </div>
      );
    }

    // Show session error if no session and no fallback showing
    if (!anonymousSessionEstablished && !showFallbackTurnstile) {
      return (
        <div className="space-y-4 p-6 border rounded-md bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800">Session Required</h3>
          <p className="text-sm text-yellow-700">
            Your security verification session has expired. Please return to the registration type page to complete verification.
          </p>
          <Button
            onClick={() => {
              const setCurrentStep = useRegistrationStore.getState().setCurrentStep;
              setCurrentStep(1);
            }}
            variant="outline"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            Return to Registration Type
          </Button>
        </div>
      );
    }

    // Show payment form if session is established
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
            disabled={isProcessingPayment || isSubmittingOrder || !isPaymentIntentReady || !anonymousSessionEstablished}
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
    <div className="space-y-6">
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
      
      {/* Fallback Turnstile Widget */}
      {showFallbackTurnstile && (
        <div className="mt-4 p-4 border rounded bg-yellow-50">
          <p className="text-sm mb-2">Session expired. Please verify:</p>
          <div id="payment-turnstile-container"></div>
          {isFallbackVerifying && <p className="text-sm mt-2">Verifying...</p>}
          {fallbackTurnstileError && (
            <p className="text-red-600 text-sm mt-2">{fallbackTurnstileError}</p>
          )}
        </div>
      )}
    </div>
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