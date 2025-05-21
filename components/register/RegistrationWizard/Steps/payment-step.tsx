"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistrationStore, UnifiedAttendeeData, BillingDetailsType } from '../../../../lib/registrationStore';
import { 
  billingDetailsSchema, 
  type BillingDetails as FormBillingDetailsSchema,
} from "@/lib/billing-details-schema";

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

function PaymentStep() {
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
  const [registrationSaved, setRegistrationSaved] = useState(false);

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

  // Effect to fetch payment intent when totalAmount changes
  useEffect(() => {
    console.log("💰 Payment Intent Effect - totalAmount:", totalAmount);
    console.log("💰 Current client secret status:", clientSecret ? "exists" : "null");
    
    if (totalAmount > 0) {
      setIsPaymentIntentLoading(true);
      setIsPaymentIntentReady(false);
      setPaymentIntentError(null);
      setClientSecret(null);

      // Schedule creation with small delay to avoid duplicate requests from fast re-renders
      const timeoutId = setTimeout(() => {
        createPaymentIntent();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      console.log("💰 Total amount is zero or negative, not creating payment intent");
      setClientSecret(null);
      setIsPaymentIntentLoading(false);
      setPaymentIntentError(null);
      setIsPaymentIntentReady(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount]); // Only depend on totalAmount changes

  // Handle successful payment
  const handleSuccessfulPayment = async (paymentIntentId: string, stripeBillingDetailsUsed: StripeBillingDetailsForClient) => {
    setIsProcessingPayment(false);
    setIsSubmittingOrder(true);
    setSubmissionError(null);

    const currentFormValues = form.getValues();
    const billingDataForStore: BillingDetailsType = {
      firstName: currentFormValues.firstName,
      lastName: currentFormValues.lastName,
      email: currentFormValues.emailAddress,
      phone: currentFormValues.mobileNumber,
      addressLine1: currentFormValues.addressLine1,
      city: currentFormValues.suburb, 
      stateProvince: currentFormValues.stateTerritory?.name || '',
      postalCode: currentFormValues.postcode,
      country: currentFormValues.country?.isoCode || '',
    };
    updateStoreBillingDetails(billingDataForStore);
    
    try {
      console.group("📝 Payment Success - Updating Registration");
      console.log("Payment Intent ID:", paymentIntentId);
      
      // Try to get registration ID from multiple possible sources for resilience
      let registrationId;
      let source = "unknown";
      
      // Define UUID validation regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // Check which IDs we have available
      if (window.__registrationResult?.registrationId) {
        console.log(`Validating window.__registrationResult.registrationId: ${window.__registrationResult.registrationId}`);
        const isValidUuid = uuidRegex.test(window.__registrationResult.registrationId);
        console.log(`Valid UUID format? ${isValidUuid}`);
        
        if (isValidUuid) {
          registrationId = window.__registrationResult.registrationId;
          source = "window.__registrationResult (UUID validated)";
        } else {
          console.warn("Registration ID from window.__registrationResult is not a valid UUID");
        }
      }
      
      // If we don't have a valid UUID yet, try the dedicated ID property
      if (!registrationId && window.__registrationId) {
        console.log(`Validating window.__registrationId: ${window.__registrationId}`);
        const isValidUuid = uuidRegex.test(window.__registrationId);
        console.log(`Valid UUID format? ${isValidUuid}`);
        
        if (isValidUuid) {
          registrationId = window.__registrationId;
          source = "window.__registrationId (UUID validated)";
        } else {
          console.warn("Registration ID from window.__registrationId is not a valid UUID");
        }
      }
      
      // Still no valid UUID - this is likely an error case
      if (!registrationId) {
        throw new Error("No valid UUID registration ID found. Registration may not have been saved properly.");
      }
      
      console.log(`Registration ID (from ${source}):`, registrationId);
      
      // Prepare payment update data
      const paymentUpdateData = {
        paymentIntentId,
        totalAmount,
        status: 'paid',
        paymentStatus: 'completed',
      };
      console.log("Payment Update Data:", JSON.stringify(paymentUpdateData, null, 2));
      
      // Calculate the API URL
      const updateUrl = `/api/registrations/${registrationId}/payment`;
      console.log("PUT URL:", updateUrl);
      
      // Update the registration in Supabase with payment information
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentUpdateData),
      });

      console.log("Response Status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(errorData.error || `Failed to update registration: ${response.statusText}`);
      }

      const updateResult = await response.json();
      console.log("Update Response:", JSON.stringify(updateResult, null, 2));
      
      setStoreConfirmationNumber(updateResult.confirmationNumber || `CONF-${registrationId.substring(0, 8).toUpperCase()}`);

      console.log("✅ Registration Updated");
      console.log("Successfully updated registration payment status");
      console.log("Confirmation Number:", updateResult.confirmationNumber);
      console.groupEnd();

      goToNextStep();
    } catch (error: any) {
      console.group("❌ Registration Update Error");
      console.error("Error updating registration payment status:", error);
      console.log("Stack Trace:", error.stack);
      console.groupEnd();
      setSubmissionError(error.message || "Failed to update your registration after payment. Please contact support.");
    } finally {
      setIsSubmittingOrder(false);
      console.groupEnd();
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setLocalPaymentProcessingError(errorMessage);
    setIsProcessingPayment(false);
  };

  const onBillingSubmit = async (data: FormBillingDetailsSchema) => {
    setLocalPaymentProcessingError(null);
    
    // For paid orders, ensure payment intent is ready before proceeding
    if (totalAmount > 0) {
      if (!isPaymentIntentReady || !clientSecret) {
        setLocalPaymentProcessingError("Payment gateway is not ready. Please wait or try refreshing.");
        return null;
      }
    }
    
    try {
      setIsSubmittingOrder(true);
      setSubmissionError(null);

      const currentFormValues = form.getValues();
      const billingDataForStore: BillingDetailsType = {
        firstName: currentFormValues.firstName,
        lastName: currentFormValues.lastName,
        email: currentFormValues.emailAddress,
        phone: currentFormValues.mobileNumber,
        addressLine1: currentFormValues.addressLine1,
        city: currentFormValues.suburb, 
        stateProvince: currentFormValues.stateTerritory?.name || '',
        postalCode: currentFormValues.postcode,
        country: currentFormValues.country?.isoCode || '',
      };
      updateStoreBillingDetails(billingDataForStore);

      // Log the primary attendee and ticket data to confirm it's being included
      console.log("Primary Attendee:", primaryAttendee);
      console.log("Ticket Summary:", currentTicketsForSummary);

      const registrationData = {
        registrationId: storeDraftId,
        registrationType,
        primaryAttendee, 
        additionalAttendees: otherAttendees, 
        tickets: currentTicketsForSummary,
        totalAmount,
        eventId: primaryAttendee?.eventId,
        billingDetails: {
          ...currentFormValues,
          country: currentFormValues.country?.isoCode,
          stateTerritory: currentFormValues.stateTerritory?.name,
        },
        paymentStatus: totalAmount > 0 ? 'pending' : 'not_required',
      };

      // First, save registration to Supabase
      console.group("📝 Initial Registration Submission");
      console.log("Registration Data:", JSON.stringify(registrationData, null, 2));
      console.log("POST URL:", '/api/registrations');
      
      // Clone the registration data for debugging
      const debugData = JSON.parse(JSON.stringify(registrationData));
      console.log("Debug - Data being POSTed:", debugData);
      
      let fetchResponse;
      try {
        console.log("🔄 Starting fetch call to /api/registrations");
        fetchResponse = await fetch('/api/registrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
        });
        console.log("✅ Fetch call completed with status:", fetchResponse.status);
      } catch (fetchError) {
        console.error("❌ Fetch call failed with error:", fetchError);
        throw fetchError;
      }

      const response = fetchResponse;
      console.log("Response Status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(errorData.error || `Failed to save registration: ${response.statusText}`);
      }

      let parsedResult;
      try {
        const responseText = await response.text();
        console.log("Raw response text:", responseText);
        parsedResult = JSON.parse(responseText);
        console.log("Successfully parsed response JSON");
      } catch (parseError) {
        console.error("❌ Failed to parse response as JSON:", parseError);
        throw new Error("Invalid response format from server");
      }

      const registrationResult = parsedResult;
      console.log("Registration saved:", JSON.stringify(registrationResult, null, 2));
      
      // Manual debugging of result
      if (registrationResult) {
        console.group("📊 Registration Result Debug");
        console.log("Result Type:", typeof registrationResult);
        console.log("Has registrationId:", !!registrationResult.registrationId);
        if (registrationResult.registrationId) {
          console.log("Registration ID:", registrationResult.registrationId);
          console.log("Registration ID Type:", typeof registrationResult.registrationId);
          console.log("Registration ID Length:", registrationResult.registrationId.length);
        }
        console.log("Full Result:", registrationResult);
        console.groupEnd();
      } else {
        console.error("❌ registrationResult is null or undefined after parsing");
      }
      
      // Verify the server returned a valid UUID for registrationId
      if (!registrationResult.registrationId) {
        throw new Error("Server did not return a valid registration ID");
      }
      
      console.log("Server generated UUID:", registrationResult.registrationId);
      
      // IMPORTANT: Explicitly set this in the window object before proceeding
      // Set it before any other operations to ensure it's available
      window.__registrationResult = registrationResult;
      
      // Double-check it was set correctly - using a more explicit variable name for clarity
      const checkResult = window.__registrationResult;
      console.log("Verification: window.__registrationResult set to:", checkResult);
      
      if (!checkResult || !checkResult.registrationId) {
        console.error("CRITICAL: Failed to set window.__registrationResult properly");
        
        // Try setting it again with a direct object assignment
        window.__registrationResult = {
          ...registrationResult,
          registrationId: registrationResult.registrationId
        };
        
        console.log("Second verification attempt:", window.__registrationResult);
      }
      
      // Also store the returned registration ID in a separate property for redundancy
      window.__registrationId = registrationResult.registrationId;
      console.log("Verification: window.__registrationId set to:", window.__registrationId);
      
      // Store the returned registration ID to use in the payment update
      // This is crucial because the server generates a proper UUID
      const returnedRegistrationId = registrationResult.registrationId;
      console.log("Using registration ID for payment update:", returnedRegistrationId);
      console.groupEnd();
      
      // Mark registration as saved in state
      setRegistrationSaved(true);
      
      // For free orders, complete the process
      if (totalAmount === 0 && currentTicketsForSummary.length > 0) {
        setStoreConfirmationNumber(registrationResult.confirmationNumber);
        console.log("Free registration completed:", registrationResult.confirmationNumber);
        goToNextStep();
      }
      
      // Return the result explicitly so it can be used by the caller
      return registrationResult;
      
    } catch (error: any) {
      console.group("❌ Registration Error");
      console.error("Error submitting registration:", error);
      console.groupEnd();
      setSubmissionError(error.message || "Failed to save your registration. Please contact support.");
      throw error; // Re-throw the error so the caller knows it failed
    } finally {
      setIsSubmittingOrder(false);
    }
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
    const onSubmitFormWithPayment = async (e: CustomEvent | null = null) => {
      const data = form.getValues();
      
      try {
        setIsSubmittingOrder(true);
        setSubmissionError(null);
        
        // Call onBillingSubmit to save registration first and capture the result
        const registrationResult = await onBillingSubmit(data);
        
        // Ensure global registration data is available
        if (registrationResult && registrationResult.registrationId) {
          // Store globally for other components to access
          window.__registrationResult = registrationResult;
          window.__registrationId = registrationResult.registrationId;
          console.log("✅ Registration result from onSubmitFormWithPayment:", registrationResult);
        } else {
          console.error("⚠️ No registration result returned from onBillingSubmit");
        }
        
        setIsSubmittingOrder(false);
        
        // If this was triggered by the payment form and we have an error, cancel the payment
        if (e && submissionError) {
          e.preventDefault();
          return false;
        }
        
        return true;
      } catch (err) {
        console.error("Error submitting registration before payment:", err);
        setIsSubmittingOrder(false);
        if (e) {
          e.preventDefault();
        }
        return false;
      }
    };
    
    // Handle custom event from Stripe payment form
    const handleSaveRegistrationEvent = (e: Event) => {
      console.log("📣 Save Registration Event triggered");
      e.preventDefault(); // Prevent default to control the flow
      
      // Use CustomEvent type for the detail
      const customEvent = e as CustomEvent;
      
      // Debug current state before starting
      console.log("📊 State Check - Before onSubmitFormWithPayment:");
      console.log("  • Primary Attendee:", primaryAttendee);
      console.log("  • Tickets:", currentTicketsForSummary);
      console.log("  • Total Amount:", totalAmount);
      console.log("  • Client Secret:", clientSecret ? "exists" : "missing");
      console.log("  • Is Payment Intent Ready:", isPaymentIntentReady);
      
      // Instead of immediately returning from the promise, we need to handle the event synchronously
      // to properly control propagation
      onSubmitFormWithPayment(customEvent)
        .then(success => {
          // Debug the result of onSubmitFormWithPayment
          console.log("📊 onSubmitFormWithPayment result:", success);
          console.log("Current window.__registrationResult:", window.__registrationResult);
          
          if (success) {
            // Verify that we have a registration result stored
            const savedRegistrationResult = window.__registrationResult;
            
            if (!savedRegistrationResult || !savedRegistrationResult.registrationId) {
              console.error("❌ Registration saved but __registrationResult is missing or invalid:", savedRegistrationResult);
              
              // Attempt to recover by checking the alternative storage
              if (window.__registrationId) {
                console.log("⚠️ Attempting recovery using __registrationId:", window.__registrationId);
                // Create a minimal result object that can be used
                window.__registrationResult = {
                  registrationId: window.__registrationId,
                  success: true,
                  confirmationNumber: `REG-${window.__registrationId.substring(0, 8).toUpperCase()}`
                };
                console.log("✅ Recovery successful, created minimal registration result:", window.__registrationResult);
              } else {
                // Last resort - try to recover using the draft ID
                if (storeDraftId) {
                  console.log("⚠️ Last resort recovery: using storeDraftId:", storeDraftId);
                  window.__registrationId = storeDraftId;
                  window.__registrationResult = {
                    registrationId: storeDraftId,
                    success: true
                  };
                  console.log("⚠️ Created minimal result with draft ID - may not work with UUID requirements");
                } else {
                  console.error("❌ Recovery failed, no registration data available");
                  return;
                }
              }
            }
            
            console.log("✅ Registration saved with ID:", window.__registrationResult?.registrationId);
            console.log("✅ Registration saved, continuing with payment");
            
            // We need to manually continue the event propagation
            setTimeout(() => {
              // Additional verification before dispatch
              console.log("📊 Pre-dispatch check - Registration ID:", window.__registrationResult?.registrationId);
              
              // Dispatch a new event to continue the payment flow
              const continuePaymentEvent = new CustomEvent('continuePayment', {
                bubbles: true,
                cancelable: true,
                detail: { 
                  registrationId: window.__registrationResult?.registrationId,
                  registrationResult: window.__registrationResult
                }
              });
              console.log("🔄 Dispatching continuePayment event with registration ID:", window.__registrationResult?.registrationId);
              console.log("Event details:", continuePaymentEvent.detail);
              
              e.target?.dispatchEvent(continuePaymentEvent);
            }, 750); // Increase timeout to ensure registration is fully processed
          } else {
            // If registration failed, stop the event propagation
            console.log("❌ Registration failed, cancelling payment");
            e.stopPropagation();
          }
        })
        .catch(error => {
          console.error("Error during registration save:", error);
          console.error("Stack trace:", error.stack);
          e.stopPropagation();
        });
        
      // Always return false to prevent default and handle continuation manually
      return false;
    };
    
    // Add event listener for the custom event when component mounts
    useEffect(() => {
      const formEl = document.querySelector('form');
      if (formEl) {
        console.log("🔄 Adding saveRegistration event listener to form");
        formEl.addEventListener('saveRegistration', handleSaveRegistrationEvent);
      }
      
      return () => {
        if (formEl) {
          console.log("🔄 Removing saveRegistration event listener from form");
          formEl.removeEventListener('saveRegistration', handleSaveRegistrationEvent);
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Simplified dependency array to prevent re-adding event listeners
    
    return (
      <div className="space-y-6">
        {submissionError && (
          <Alert variant="destructive">
            <AlertTitle>Submission Error</AlertTitle>
            <AlertDescription>{submissionError}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={(e) => {
            e.preventDefault();
            onSubmitFormWithPayment();
          }} className="space-y-6">
            <BillingDetailsForm form={form} primaryAttendee={primaryAttendee}/>
            
            {/* Show payment component only when payment intent is ready */}
            {totalAmount > 0 && isPaymentIntentReady && clientSecret && (
              <PaymentMethod 
                clientSecret={clientSecret} 
                onPaymentSuccess={handleSuccessfulPayment}
                onPaymentError={handlePaymentError}
                billingDetails={form.getValues()}
                totalAmount={totalAmount}
                paymentIntentError={paymentIntentError}
                isPaymentIntentLoading={isPaymentIntentLoading}
                setIsProcessingPayment={setIsProcessingPayment}
              />
            )}
            {isPaymentIntentLoading && totalAmount > 0 && (
              <Alert>
                <AlertDescription>Loading payment options...</AlertDescription>
              </Alert>
            )}
            {paymentIntentError && totalAmount > 0 &&(
              <Alert variant="destructive">
                <AlertTitle>Payment Gateway Error</AlertTitle>
                <AlertDescription>{paymentIntentError} Please try refreshing the page or contact support.</AlertDescription>
              </Alert>
            )}
            {localPaymentProcessingError && (
                <Alert variant="destructive">
                  <AlertTitle>Payment Error</AlertTitle>
                  <AlertDescription>{localPaymentProcessingError}</AlertDescription>
                </Alert>
            )}
          </form>
        </Form>

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={goToPrevStep} disabled={isSubmittingOrder || isProcessingPayment}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous Step
          </Button>
          {(totalAmount === 0 && currentTicketsForSummary.length > 0) && (
              <Button onClick={() => form.handleSubmit(onBillingSubmit)()} disabled={isSubmittingOrder} className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
                Complete Registration
              </Button>
          )}
        </div>
      </div>
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
      summaryContent={renderSummaryContent()}
      summaryTitle="Order Summary"
    >
      {renderFormContent()}
    </TwoColumnStepLayout>
  );
}

export default PaymentStep;