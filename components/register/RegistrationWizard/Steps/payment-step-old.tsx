"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistrationStore, UnifiedAttendeeData, BillingDetailsType, selectAnonymousSessionEstablished } from '../../../../lib/registrationStore';
import { 
  billingDetailsSchema, 
  type BillingDetails as FormBillingDetailsSchema,
} from "@/lib/billing-details-schema";
import { createClient } from '@/utils/supabase/client';

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StripeBillingDetailsForClient } from "../payment/types";

// Import modular components
import { BillingDetailsForm } from "../payment/BillingDetailsForm";
import { PaymentMethod } from "../payment/PaymentMethod";
import { OrderSummary } from "../payment/OrderSummary";
import { PaymentProcessing } from "../payment/PaymentProcessing";
import { getPaymentSummaryData } from '../Summary/summary-data/payment-summary-data';
import { SummaryRenderer } from '../Summary/SummaryRenderer';
import { TwoColumnStepLayout } from "../Layouts/TwoColumnStepLayout";
import { getEventTicketsService, type TicketDefinition, type EventPackage } from '@/lib/services/event-tickets-service';

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
  console.log("💳 PaymentStep component rendering");
  
  // Debug localStorage
  try {
    const storedData = localStorage.getItem('lodgetix-registration-storage');
    console.log("💳 localStorage data exists:", !!storedData);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      console.log("💳 localStorage contains:", {
        hasDraftId: !!parsed?.state?.draftId,
        attendeesCount: parsed?.state?.attendees?.length || 0,
        registrationType: parsed?.state?.registrationType
      });
    }
  } catch (e) {
    console.error("💳 localStorage error:", e);
  }
  
  // Store state from Zustand
  const allStoreAttendees = useRegistrationStore((s) => s.attendees);
  const registrationType = useRegistrationStore((s) => s.registrationType);
  const packages = useRegistrationStore((s) => s.packages);
  const storeBillingDetails = useRegistrationStore((s) => s.billingDetails);
  const updateStoreBillingDetails = useRegistrationStore((s) => s.updateBillingDetails);
  const setStoreConfirmationNumber = useRegistrationStore((s) => s.setConfirmationNumber);
  const storeDraftId = useRegistrationStore((s) => s.draftId);
  const eventId = useRegistrationStore((s) => s.eventId); // Get eventId from store
  const goToNextStep = useRegistrationStore((s) => s.goToNextStep);
  const goToPrevStep = useRegistrationStore((s) => s.goToPrevStep);
  const anonymousSessionEstablished = useRegistrationStore(selectAnonymousSessionEstablished);
  const setAnonymousSessionEstablished = useRegistrationStore((s) => s.setAnonymousSessionEstablished);
  
  console.log("💳 Store state:", {
    attendeesCount: allStoreAttendees.length,
    anonymousSessionEstablished,
    registrationType,
    hasDraftId: !!storeDraftId,
    draftId: storeDraftId
  });

  // Local component state
  const [localPaymentProcessingError, setLocalPaymentProcessingError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showProcessingSteps, setShowProcessingSteps] = useState(false);
  const [processingSteps, setProcessingSteps] = useState([
    { name: 'Payment received', description: 'Processing your payment', status: 'upcoming' as const },
    { name: 'Validating registration', description: 'Verifying registration details', status: 'upcoming' as const },
    { name: 'Reserving tickets', description: 'Securing your event tickets', status: 'upcoming' as const },
    { name: 'Generating confirmation', description: 'Creating your QR codes', status: 'upcoming' as const },
    { name: 'Sending confirmation', description: 'Preparing your email receipt', status: 'upcoming' as const },
  ]);
  
  const [confirmedRegistrationId, setConfirmedRegistrationId] = useState<string | null>(null);

  // Session state
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);
  
  // State for dynamic ticket and package data
  const [ticketTypes, setTicketTypes] = useState<TicketDefinition[]>([]);
  const [ticketPackages, setTicketPackages] = useState<EventPackage[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

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
    // Don't calculate if tickets haven't loaded yet
    if (isLoadingTickets) return [];
    
    return allStoreAttendees.flatMap(attendee => {
      const attendeeId = attendee.attendeeId;
      const selection = packages[attendeeId];
      
      if (!selection) return [];
      
      let tickets: Array<{ id: string; name: string; price: number; attendeeId: string; isPackage?: boolean; description?: string }> = [];

      if (selection.ticketDefinitionId) {
        const pkgInfo = ticketPackages.find(p => p.id === selection.ticketDefinitionId);
        if (pkgInfo) {
          tickets.push({ 
            id: `${attendeeId}-${pkgInfo.id}`,
            name: pkgInfo.name, 
            price: pkgInfo.price, 
            attendeeId, 
            isPackage: true,
            description: pkgInfo.description || `Package: ${pkgInfo.name}`
          });
        }
      } else if (selection.selectedEvents && selection.selectedEvents.length > 0) {
        selection.selectedEvents.forEach(eventId => {
          const eventInfo = ticketTypes.find(t => t.id === eventId);
          if (eventInfo) {
            tickets.push({ 
              id: `${attendeeId}-${eventInfo.id}`,
              name: eventInfo.name, 
              price: eventInfo.price, 
              attendeeId, 
              isPackage: false,
              description: eventInfo.description || eventInfo.name
            });
          }
        });
      }
      return tickets;
    });
  }, [allStoreAttendees, packages, ticketTypes, ticketPackages, isLoadingTickets]);
  
  // Ref for payment element to trigger Stripe processing
  const paymentElementRef = useRef<HTMLDivElement>(null);
  
  // Monitor ref availability
  useEffect(() => {
    console.log("🔍 PaymentStep: paymentElementRef status:", {
      exists: !!paymentElementRef.current,
      element: paymentElementRef.current
    });
  }, []); // Run once on mount

  // Fetch tickets and packages on component mount
  useEffect(() => {
    async function fetchTicketsAndPackages() {
      try {
        setIsLoadingTickets(true);
        setTicketsError(null);
        
        const service = getEventTicketsService();
        const parentEventId = eventId || "307c2d85-72d5-48cf-ac94-082ca2a5d23d"; // Fallback to Grand Proclamation
        
        console.log("💳 PaymentStep: Fetching tickets for event:", parentEventId);
        
        const result = await service.getEventTicketsAndPackages(parentEventId);
        
        console.log("💳 PaymentStep: Loaded tickets:", result.tickets.length);
        console.log("💳 PaymentStep: Loaded packages:", result.packages.length);
        
        setTicketTypes(result.tickets);
        setTicketPackages(result.packages);
      } catch (error) {
        console.error('Error fetching tickets and packages:', error);
        setTicketsError(error instanceof Error ? error.message : 'Failed to load ticket information');
      } finally {
        setIsLoadingTickets(false);
      }
    }
    
    fetchTicketsAndPackages();
  }, [eventId]);

  // Calculate total amount from derived tickets
  const totalAmount = useMemo(() => {
    const total = currentTicketsForSummary.reduce((sum, ticket) => sum + ticket.price, 0);
    console.log("💰 PaymentStep: Total amount calculation:", {
      ticketCount: currentTicketsForSummary.length,
      tickets: currentTicketsForSummary.map(t => ({ name: t.name, price: t.price })),
      totalAmount: total
    });
    return total;
  }, [currentTicketsForSummary]);

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

  // Load stored billing details from Zustand store on mount
  useEffect(() => {
    if (storeBillingDetails && Object.keys(storeBillingDetails).length > 0) {
      console.log('💳 Loading stored billing details from draft:', storeBillingDetails);
      
      // Map stored billing details to form schema
      // Note: We need to handle country and state mapping differently since they're objects
      const formData: Partial<FormBillingDetailsSchema> = {
        billToPrimary: false, // This is managed separately by the checkbox logic
        firstName: storeBillingDetails.firstName || '',
        lastName: storeBillingDetails.lastName || '',
        businessName: storeBillingDetails.businessName || '',
        businessNumber: storeBillingDetails.businessNumber || '',
        addressLine1: storeBillingDetails.addressLine1 || '',
        mobileNumber: storeBillingDetails.phone || '',
        suburb: storeBillingDetails.city || '',
        postcode: storeBillingDetails.postalCode || '',
        emailAddress: storeBillingDetails.email || '',
        // Country and state need to be handled by the BillingDetailsForm component
        // as they require the full country/state objects, not just ISO codes
      };
      
      // Update form with stored values
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.setValue(key as keyof FormBillingDetailsSchema, value as any, { 
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false 
          });
        }
      });
      
      // Note: Country and State will need to be handled in BillingDetailsForm
      // as they require fetching the full objects from the countries/states lists
    }
  }, []); // Run only on mount

  // Check session status on mount - simpler approach
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("🔍 Payment Step: Checking session status...");
        console.log("📊 Store anonymousSessionEstablished:", anonymousSessionEstablished);
        
        // If store already indicates session is established, trust it
        if (anonymousSessionEstablished) {
          console.log("✅ Store indicates session is established");
          setSessionCheckComplete(true);
          return;
        }
        
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("❌ Error checking session:", error);
          // Don't immediately show Turnstile - session might exist but had a temporary error
          setAnonymousSessionEstablished(false);
        } else if (session && session.user) {
          // Accept any authenticated session, not just anonymous
          console.log("✅ Valid session found (anonymous:", session.user.is_anonymous, ")");
          setAnonymousSessionEstablished(true);
        } else {
          console.log("⚠️ No session found");
          setAnonymousSessionEstablished(false);
        }
      } catch (error) {
        console.error("❌ Unexpected error checking session:", error);
      } finally {
        setSessionCheckComplete(true);
      }
    };
    
    checkSession();
  }, []); // Remove dependencies to run only once on mount


  const handlePaymentMethodCreated = async (paymentMethodId: string, stripeBillingDetailsUsed: StripeBillingDetailsForClient, regId: string) => {
    // Clear the payment timeout if it exists
    if ((window as any).__paymentTimeout) {
      clearTimeout((window as any).__paymentTimeout);
      delete (window as any).__paymentTimeout;
      console.log("✅ Cleared payment timeout - payment method created");
    }
    
    if (!regId) {
      console.error("❌ Critical Error: handleTwoStepPaymentSuccess called without a valid registrationId.");
      setLocalPaymentProcessingError("Failed to update registration: Missing critical registration ID after payment method creation.");
      setIsProcessingPayment(false);
      return;
    }
    console.log("💳 Two-Step Payment - Payment Method Created");
    console.log("Payment Method ID:", paymentMethodId);
    console.log("Registration ID for update:", regId);

    // Clear any previous errors
    setLocalPaymentProcessingError(null);
    setIsProcessingPayment(true);

    try {
      // Update processing steps - payment method created
      setProcessingSteps(prev => {
        const newSteps = [...prev];
        newSteps[0] = { ...newSteps[0], status: 'complete' }; // Registration saved
        newSteps[1] = { ...newSteps[1], status: 'complete' }; // Payment method created
        newSteps[2] = { ...newSteps[2], status: 'current' }; // Now processing payment
        return newSteps;
      });

      // Call API to create payment intent and process payment server-side
      const updateResponse = await fetch(`/api/registrations/${regId}/payment`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId,
          totalAmount,
          billingDetails: stripeBillingDetailsUsed
        }),
      });

      console.log("Response Status:", updateResponse.status);
      const updateResult = await updateResponse.json();

      if (!updateResponse.ok) {
        console.error("API Error Response:", updateResult);
        throw new Error(
          updateResult.error || "Failed to process payment"
        );
      }

      console.log("✅ Payment processing initiated:", updateResult);
      
      // Check if we have a redirect URL for 3D Secure or other verification
      if (updateResult.requiresAction && updateResult.clientSecret) {
        console.log("🔐 Payment requires additional authentication");
        // Handle 3D Secure authentication
        const stripe = (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        const { error } = await stripe.confirmCardPayment(updateResult.clientSecret);
        
        if (error) {
          throw new Error(`Authentication failed: ${error.message}`);
        }
        
        // After successful authentication, verify payment status
        const verifyResponse = await fetch(`/api/registrations/${regId}/verify-payment`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
        });
        
        if (!verifyResponse.ok) {
          throw new Error("Failed to verify payment after authentication");
        }
      }
      
      setStoreConfirmationNumber(updateResult.confirmationNumber || regId);
      
      // Continue with remaining processing steps
      const updateStep = (index: number, status: 'complete' | 'current') => {
        setProcessingSteps(prev => {
          const newSteps = [...prev];
          newSteps[index] = { ...newSteps[index], status };
          if (status === 'current' && index > 0) {
            newSteps[index - 1] = { ...newSteps[index - 1], status: 'complete' };
          }
          return newSteps;
        });
      };
      
      // Continue with remaining steps
      setTimeout(() => updateStep(3, 'current'), 1500);
      setTimeout(() => updateStep(4, 'current'), 3000);
      
      // Complete all steps and navigate to confirmation
      setTimeout(() => {
        setProcessingSteps(prev => {
          const newSteps = [...prev];
          newSteps[4] = { ...newSteps[4], status: 'complete' };
          return newSteps;
        });
        
        // Small delay before navigation for visual completion
        setTimeout(() => {
          setShowProcessingSteps(false);
          goToNextStep(); // Proceed to confirmation page
        }, 1000);
      }, 4500);

    } catch (error: any) {
      console.error("❌ Payment Processing Error");
      console.error("Error processing payment:", error.message);
      console.error("Stack Trace:", error.stack);
      setLocalPaymentProcessingError(`Failed to process payment: ${error.message}. Please contact support with your registration ID: ${regId}.`);
      
      // Update processing steps to show error
      setProcessingSteps(prev => {
        const newSteps = [...prev];
        const paymentStepIndex = newSteps.findIndex(step => step.name.toLowerCase().includes('payment'));
        if (paymentStepIndex >= 0) {
          newSteps[paymentStepIndex] = { ...newSteps[paymentStepIndex], status: 'error' };
        }
        return newSteps;
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };


  const handlePaymentError = (errorMessage: string) => {
    console.error("❌ Payment Error:", errorMessage);
    
    // Clear the payment timeout if it exists
    if ((window as any).__paymentTimeout) {
      clearTimeout((window as any).__paymentTimeout);
      delete (window as any).__paymentTimeout;
      console.log("✅ Cleared payment timeout - payment failed");
    }
    
    // Update processing steps to show error on payment step
    setProcessingSteps(prev => {
      const newSteps = [...prev];
      // Find the payment processing step (should be index 1)
      const paymentStepIndex = newSteps.findIndex(step => step.name.toLowerCase().includes('payment'));
      if (paymentStepIndex >= 0) {
        newSteps[paymentStepIndex] = { ...newSteps[paymentStepIndex], status: 'error' };
      }
      return newSteps;
    });
    
    setLocalPaymentProcessingError(errorMessage);
    setIsProcessingPayment(false);
    setIsSubmittingOrder(false); // Also re-enable the form
  };
  
  const handleBackToPayment = () => {
    console.log("🔙 Going back to payment form");
    setShowProcessingSteps(false);
    setLocalPaymentProcessingError(null);
    setSubmissionError(null);
    setIsProcessingPayment(false);
    setIsSubmittingOrder(false);
    
    // Reset processing steps for next attempt
    setProcessingSteps([
      { name: 'Saving registration', description: 'Creating your registration record', status: 'upcoming' as const },
      { name: 'Processing payment', description: 'Securely processing your payment', status: 'upcoming' as const },
      { name: 'Reserving tickets', description: 'Securing your event tickets', status: 'upcoming' as const },
      { name: 'Generating confirmation', description: 'Creating your QR codes', status: 'upcoming' as const },
      { name: 'Sending confirmation', description: 'Preparing your email receipt', status: 'upcoming' as const },
    ]);
  };

  const {reset: resetBillingForm, formState: {isDirty: billingFormIsDirty, isValid: billingFormIsValid, errors: billingFormErrors}} = form;

  // This function will be called by CheckoutForm AFTER creating payment method
  const onPaymentSuccessWrapper = (paymentMethodId: string, stripeBillingDetailsUsed: StripeBillingDetailsForClient) => {
    if (!confirmedRegistrationId) {
        console.error("CRITICAL: onPaymentSuccessWrapper called without confirmedRegistrationId. This should not happen.");
        setLocalPaymentProcessingError("A critical error occurred. Payment method was created but registration update failed. Please contact support.");
        return;
    }
    
    console.log("💳 Payment method created, ready to process payment");
    handlePaymentMethodCreated(paymentMethodId, stripeBillingDetailsUsed, confirmedRegistrationId);
  };

  const onBillingSubmit = async (data: FormBillingDetailsSchema) => {
    console.log("🔶 Billing Form Submit (onBillingSubmit)");
    if (!anonymousSessionEstablished) {
      setSubmissionError("Session expired. Please return to the registration type page to complete verification.");
      console.error("Attempted to submit billing without anonymous session.");
      return;
    }
    console.log("🅿️ Billing details submitted:", data);
    updateStoreBillingDetails(data);
    setLocalPaymentProcessingError(null); // Clear previous errors
    setIsSubmittingOrder(true); // Indicate that the order submission process has started
    setSubmissionError(null);
    
    // Show processing view immediately
    setShowProcessingSteps(true);
    
    // Initialize steps with first step as current
    setProcessingSteps([
      { name: 'Saving registration', description: 'Creating your registration record', status: 'current' as const },
      { name: 'Processing payment', description: 'Securely processing your payment', status: 'upcoming' as const },
      { name: 'Reserving tickets', description: 'Securing your event tickets', status: 'upcoming' as const },
      { name: 'Generating confirmation', description: 'Creating your QR codes', status: 'upcoming' as const },
      { name: 'Sending confirmation', description: 'Preparing your email receipt', status: 'upcoming' as const },
    ]);

    // Step 1: Save Registration Data via onSaveData prop or fallback to direct API call
    let saveDataFunction = props.onSaveData;
    
    // If no onSaveData prop is provided, create a fallback function
    if (!saveDataFunction) {
        console.warn("⚠️ onSaveData prop not provided, using fallback registration save function");
        saveDataFunction = async () => {
            // Fallback: directly call the registration API
            console.log("🔐 Using fallback save function, getting user session...");
            
            // Get the current user session (anonymous or authenticated)
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            console.log("🔐 User session result:", user ? `Found user: ${user.id}` : "No user found");
            
            if (!user) {
                console.error("❌ No authenticated user found");
                throw new Error('User authentication required. Please refresh the page and try again.');
            }
            
            const registrationData = {
                registrationType,
                primaryAttendee,
                additionalAttendees: otherAttendees,
                tickets: currentTicketsForSummary,
                totalAmount,
                billingDetails: data,
                eventId: eventId, // Use eventId from store, not from primaryAttendee
                customerId: user.id // Include the authenticated user ID
            };
            
            console.log("📤 Fallback function sending data with customerId:", registrationData.customerId);
            
            // Get the current session to include auth token
            const { data: { session } } = await supabase.auth.getSession();
            
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            
            // Include auth token if available
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            
            const response = await fetch('/api/registrations', {
                method: 'POST',
                headers,
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
        
        // Check for warnings about partial saves
        if (saveResult.warning) {
            console.warn("⚠️ Registration Warning:", saveResult.warning);
            console.warn(`⚠️ Saved ${saveResult.savedAttendees || 0} of ${saveResult.totalAttendees || 0} attendees`);
        }
        
        setConfirmedRegistrationId(serverGeneratedRegistrationId); // Store the TRUE ID
        
        // Update processing steps - registration is now saved
        setProcessingSteps(prev => {
            const newSteps = [...prev];
            newSteps[0] = { ...newSteps[0], status: 'complete' }; // Registration saved
            newSteps[1] = { ...newSteps[1], status: 'current' }; // Now processing payment
            return newSteps;
        });

        // Store the registration result in window for CheckoutForm to access
        window.__registrationResult = saveResult;
        window.__registrationId = serverGeneratedRegistrationId;
        console.log("💾 Stored registration data in window object");

        // Step 2: If registration save is successful, dispatch event to trigger Stripe payment in CheckoutForm
        // This relies on CheckoutForm listening for this event and having clientSecret ready.
        // Add retry mechanism to ensure Stripe is ready
        let retryCount = 0;
        const maxRetries = 20; // 10 seconds total (20 * 500ms)
        
        const attemptPayment = () => {
            retryCount++;
            console.log(`🔍 Payment attempt ${retryCount}/${maxRetries}`);
            console.log("🔍 Checking paymentElementRef:", {
                exists: !!paymentElementRef.current,
                element: paymentElementRef.current,
                tagName: paymentElementRef.current?.tagName
            });
            
            // Check if Stripe is loaded in the window
            const stripeLoaded = !!(window as any).Stripe;
            const checkoutFormReady = !!(window as any).__checkoutFormReady;
            console.log("🔍 Stripe loaded in window:", stripeLoaded);
            console.log("🔍 CheckoutForm ready:", checkoutFormReady);
            
            // Check if we've reached max retries first
            if (retryCount >= maxRetries) {
                console.error("⏱️ Payment processing timeout after max retries");
                setSubmissionError("Payment processing timed out. Your registration has been saved. Please try the payment again or contact support if the issue persists.");
                setIsSubmittingOrder(false);
                setIsProcessingPayment(false);
                return;
            }
            
            // Only dispatch if CheckoutForm is ready
            if (!checkoutFormReady) {
                console.warn("⚠️ CheckoutForm not ready yet, will retry...");
                // Set timeout to retry
                const retryTimeout = setTimeout(() => {
                    attemptPayment();
                }, 500);
                (window as any).__paymentTimeout = retryTimeout;
                return;
            }
            
            console.log("🔶 Dispatching continuePayment event to window for Stripe payment processing.");
            const continuePaymentEvent = new CustomEvent('continuePayment', { 
                detail: { 
                    registrationId: serverGeneratedRegistrationId,
                    registrationResult: saveResult
                } 
            });
            window.dispatchEvent(continuePaymentEvent);
            
            // Set a timeout to check if payment has started
            const paymentTimeout = setTimeout(() => {
                // Check if payment has started (isProcessingPayment should be true)
                if (!isProcessingPayment) {
                    console.warn("⚠️ Payment not started after dispatch, retrying...");
                    attemptPayment();
                } else {
                    console.log("✅ Payment processing started");
                }
            }, 1000); // Give it 1 second to start after dispatch
            
            // Store timeout ID so it can be cleared on successful payment
            (window as any).__paymentTimeout = paymentTimeout;
        };
        
        // Start the payment attempt after a small delay
        setTimeout(attemptPayment, 100);

    } catch (error: any) {
        console.error("❌ Error during registration save process:", error);
        
        // Update processing steps to show error
        setProcessingSteps(prev => {
            const newSteps = [...prev];
            // Find the current step and mark it as error
            const currentIndex = newSteps.findIndex(step => step.status === 'current');
            if (currentIndex >= 0) {
                newSteps[currentIndex] = { ...newSteps[currentIndex], status: 'error' };
            }
            return newSteps;
        });
        
        // Check if it's an authentication error
        if (error.message && error.message.includes('authentication')) {
            setSubmissionError('Your session has expired. Please refresh the page and try again.');
        } else {
            setSubmissionError(`An error occurred while saving your registration: ${error.message}. Please try again.`);
        }
        setIsSubmittingOrder(false);
        setIsProcessingPayment(false);
    }
    // setIsSubmittingOrder(false); // Moved to finally block or after dispatch if payment is async and blocking further UI
  };
  
  // Effect to handle saveRegistration event from CheckoutForm
  useEffect(() => {
    const handleSaveRegistration = (event: Event) => {
      console.log("📝 Received saveRegistration event from CheckoutForm");
      const customEvent = event as CustomEvent;
      
      // First check if the form is valid
      const formElement = document.getElementById('payment-step-form') as HTMLFormElement;
      if (formElement) {
        // Check form validity before attempting submission
        const isFormValid = form.formState.isValid;
        
        if (!isFormValid) {
          console.error("❌ Form validation failed - cannot submit");
          
          // Dispatch validation failure event to reset CheckoutForm state
          const validationFailureEvent = new CustomEvent('paymentValidationFailed', {
            detail: {
              errors: form.formState.errors,
              message: 'Please complete all required billing fields before proceeding with payment.'
            }
          });
          window.dispatchEvent(validationFailureEvent);
          
          // Trigger form validation to show error messages
          form.trigger();
          
          // Focus on the first error field
          const firstErrorField = Object.keys(form.formState.errors)[0];
          if (firstErrorField) {
            const errorElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
            errorElement?.focus();
          }
          
          return;
        }
        
        console.log("📝 Form is valid - triggering form submission programmatically");
        formElement.requestSubmit();
      } else {
        console.error("❌ Could not find form element to submit");
        
        // Still dispatch failure event to reset CheckoutForm state
        const failureEvent = new CustomEvent('paymentValidationFailed', {
          detail: {
            message: 'Unable to process payment form. Please refresh and try again.'
          }
        });
        window.dispatchEvent(failureEvent);
      }
    };

    // Add event listener to window for global event handling
    window.addEventListener('saveRegistration', handleSaveRegistration);
    console.log("🎯 PaymentStep: Added saveRegistration event listener to window");

    // Cleanup
    return () => {
      window.removeEventListener('saveRegistration', handleSaveRegistration);
      console.log("🎯 PaymentStep: Removed saveRegistration event listener from window");
    };
  }, [form]);

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
    console.log("🎨 renderFormContent called");
    console.log("🎨 sessionCheckComplete:", sessionCheckComplete);
    console.log("🎨 anonymousSessionEstablished:", anonymousSessionEstablished);
    
    const onActualSubmit = form.handleSubmit(onBillingSubmit);

    // Show processing steps if payment is being processed
    if (showProcessingSteps) {
      return (
        <PaymentProcessing 
          steps={processingSteps} 
          error={localPaymentProcessingError || submissionError}
          onBackToPayment={handleBackToPayment}
        />
      );
    }

    // Show loading state while tickets are being fetched
    if (isLoadingTickets) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-masonic-navy"></div>
          <p className="ml-3 text-masonic-navy">Loading ticket information...</p>
        </div>
      );
    }

    // Show error if tickets failed to load
    if (ticketsError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Failed to Load Tickets</AlertTitle>
          <AlertDescription>{ticketsError}</AlertDescription>
        </Alert>
      );
    }

    // Show loading state while checking session
    if (!sessionCheckComplete) {
      console.log("🎨 Showing session verification loading state");
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-masonic-navy"></div>
          <p className="ml-3 text-masonic-navy">Verifying session...</p>
        </div>
      );
    }

    // Show session error if no session
    if (!anonymousSessionEstablished) {
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
          <BillingDetailsForm form={form} primaryAttendee={primaryAttendee ? {
            firstName: primaryAttendee.firstName || undefined,
            lastName: primaryAttendee.lastName || undefined,
            primaryPhone: primaryAttendee.primaryPhone || undefined,
            primaryEmail: primaryAttendee.primaryEmail || undefined,
            grandLodgeId: primaryAttendee.grandLodgeId || undefined,
            attendeeType: primaryAttendee.attendeeType || undefined
          } : null} />
          <div ref={paymentElementRef}>
            <PaymentMethod 
              totalAmount={totalAmount}
              onPaymentSuccess={onPaymentSuccessWrapper}
              onPaymentError={handlePaymentError}
              setIsProcessingPayment={setIsProcessingPayment}
              billingDetails={form.getValues()}
            />
          </div>
          
          {localPaymentProcessingError && (
            <Alert variant="destructive">
              <AlertTitle>Payment Processing Error</AlertTitle>
              <AlertDescription>{localPaymentProcessingError}</AlertDescription>
            </Alert>
          )}
          
          {/* Show validation errors if form is submitted but invalid */}
          {form.formState.isSubmitted && !form.formState.isValid && (
            <Alert variant="destructive">
              <AlertTitle>Please complete required fields</AlertTitle>
              <AlertDescription>
                Please fill in all required billing information before proceeding with payment.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex">
            <Button 
              type="button"
              variant="outline" 
              onClick={goToPrevStep} 
              disabled={isSubmittingOrder || isProcessingPayment}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous Step
            </Button>
          </div>

          {/* Removed Turnstile widget - session should be established in registration type step */}
        </form>
      </Form>
    );
  };

  // Render the summary part
  const renderSummaryContent = () => {
    const summaryData = getPaymentSummaryData({
      totalAmount,
      isPaymentValid: form.formState.isValid && !isSubmittingOrder,
      attendeeCount: (primaryAttendee ? 1 : 0) + otherAttendees.length,
      ticketCount: currentTicketsForSummary.length,
      isProcessing: isProcessingPayment || isSubmittingOrder,
      error: localPaymentProcessingError || submissionError
    });
    
    return <SummaryRenderer {...summaryData} />;
  };

  return (
    <TwoColumnStepLayout
      summaryContent={renderSummaryContent()}
      summaryTitle="Step Summary"
      currentStep={5}
      totalSteps={6}
      stepName="Payment"
    >
      {renderFormContent()}
    </TwoColumnStepLayout>
  );
}

export default PaymentStep;