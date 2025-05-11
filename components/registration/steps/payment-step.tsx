"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistrationStore } from "@/lib/registration-store";
import { 
  billingDetailsSchema, 
  type BillingDetails,
} from "@/lib/billing-details-schema";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StripeBillingDetailsForClient } from "../payment/types";

// Import modular components
import { BillingDetailsForm } from "../payment/BillingDetailsForm";
import { PaymentMethod } from "../payment/PaymentMethod";
import { OrderSummary } from "../payment/OrderSummary";

// Import confirmation number generator and store action
// import { generateConfirmationNumber } from "@/lib/confirmation-utils"; // REMOVED

export function PaymentStep() {
  // Store state from Zustand
  const primaryAttendee = useRegistrationStore((s) => s.attendeeDetails.primaryAttendee);
  const additionalAttendees = useRegistrationStore((s) => s.attendeeDetails.additionalAttendees);
  const currentTickets = useRegistrationStore((s) => s.ticketSelection.tickets);
  const registrationType = useRegistrationStore((s) => s.registrationType);
  const paymentDetailsFromStore = useRegistrationStore((s) => s.paymentDetails);
  const setPaymentDetailsInStore = useRegistrationStore((s) => s.setPaymentDetails);
  // const setConfirmationNumberInStore = useRegistrationStore((s) => s.setConfirmationNumber); // REMOVED
  const setConfirmedRegistrationDetailsInStore = useRegistrationStore((s) => s.setConfirmedRegistrationDetails); // ADDED
  const goToNextStep = useRegistrationStore((s) => s.goToNextStep);
  const goToPrevStep = useRegistrationStore((s) => s.goToPrevStep);

  // Local component state
  const [localPaymentProcessingError, setLocalPaymentProcessingError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  // State for managing client secret and its loading/error for Stripe
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPaymentIntentLoading, setIsPaymentIntentLoading] = useState(false);
  const [paymentIntentError, setPaymentIntentError] = useState<string | null>(null);

  // Calculate total amount
  const totalAmount = currentTickets.reduce((sum, ticket) => sum + ticket.price, 0);

  // Setup form with Zod validation
  const form = useForm<BillingDetails>({
    resolver: zodResolver(billingDetailsSchema),
    defaultValues: {
      billToPrimary: false, // Default to false (unchecked)
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

  // Effect to fetch payment intent when totalAmount changes
  useEffect(() => {
    if (totalAmount > 0) {
      setIsPaymentIntentLoading(true);
      setPaymentIntentError(null);
      setClientSecret(null); // Clear previous client secret

      const createIntent = async () => {
        try {
          const response = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: totalAmount, currency: 'aud' }), // Assuming AUD, make this dynamic if needed
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to create payment intent: ${response.statusText}`);
          }

          const data = await response.json();
          setClientSecret(data.clientSecret);
        } catch (error: any) {
          setPaymentIntentError(error.message);
          console.error("Error fetching payment intent:", error);
        } finally {
          setIsPaymentIntentLoading(false);
        }
      };

      createIntent();
    } else {
      // If total amount is 0, no need for a payment intent
      setClientSecret(null);
      setIsPaymentIntentLoading(false);
      setPaymentIntentError(null);
    }
  }, [totalAmount]);

  // Handle successful payment
  const handleSuccessfulPayment = async (paymentIntentId: string, stripeBillingDetailsUsed: StripeBillingDetailsForClient) => {
    setIsProcessingPayment(false);
    setIsSubmittingOrder(true);
    setSubmissionError(null);

    // Generate confirmation number HERE
    // const eventCode = registrationType?.split('-')[0].toUpperCase() || "GI"; // REMOVED
    // const newConfirmationNumber = generateConfirmationNumber(eventCode); // REMOVED
    // setConfirmationNumberInStore(newConfirmationNumber); // REMOVED

    // Update payment details in store with only the necessary non-sensitive information
    setPaymentDetailsInStore({
      ...paymentDetailsFromStore,
      paymentIntentId: paymentIntentId,
      last4: stripeBillingDetailsUsed?.name ? `Billed to: ${stripeBillingDetailsUsed.name}` : 'N/A',
      paymentMethodId: null,
    });

    // Prepare registration data for submission
    const registrationData = {
      registrationId: useRegistrationStore.getState().registrationId,
      // confirmationNumber: newConfirmationNumber, // REMOVED - No longer generated here
      registrationType,
      primaryAttendee,
      additionalAttendees,
      tickets: currentTickets,
      totalAmount,
      paymentIntentId,
      billingDetails: {
        ...form.getValues(),
        country: form.getValues('country.isoCode'),
        stateTerritory: form.getValues('stateTerritory.name'),
      },
    };

    try {
      // Submit registration data
      console.group("📝 Registration Submission");
      console.log("Registration Data:", JSON.stringify(registrationData, null, 2));
      console.log("Total Amount:", `$${totalAmount.toFixed(2)}`);
      console.log("Payment Intent ID:", paymentIntentId);
      console.log("Registration ID:", registrationData.registrationId);
      // console.log("Confirmation Number:", registrationData.confirmationNumber); // REMOVED or comment out if it causes error due to missing field
      console.groupEnd();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // SIMULATE receiving confirmation number from Supabase
      const backendConfirmationNumber = `SUPA-${Math.floor(10000 + Math.random() * 90000)}`; // Example
      setConfirmedRegistrationDetailsInStore({ confirmationNumber: backendConfirmationNumber }); // ADDED

      console.group("✅ Registration Success");
      console.log("Successfully saved registration with ID:", registrationData.registrationId);
      console.log("Confirmation Number from Supabase:", backendConfirmationNumber); // MODIFIED to log received number
      console.groupEnd();

      goToNextStep();
    } catch (error: any) {
      console.group("❌ Registration Error");
      console.error("Error submitting registration:", error);
      console.groupEnd();

      setSubmissionError(error.message || "Failed to save your registration after payment. Please contact support.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Handle payment errors
  const handlePaymentError = (errorMessage: string) => {
    setLocalPaymentProcessingError(errorMessage);
    setIsProcessingPayment(false);
  };

  // Form submission handler for billing details
  const onBillingSubmit = async (data: BillingDetails) => {
    setLocalPaymentProcessingError(null);
    
    // Validate payment requirements
    if (totalAmount > 0 && !clientSecret) {
      setLocalPaymentProcessingError("Payment gateway is not ready. Please wait or try refreshing.");
      return;
    }
    
    // For free orders, just proceed to the next step
    if (totalAmount === 0 && currentTickets.length > 0) {
      try {
        setIsSubmittingOrder(true);
        setSubmissionError(null);

        // Generate confirmation number HERE
        // const eventCode = registrationType?.split('-')[0].toUpperCase() || "GI"; // REMOVED
        // const newConfirmationNumberForFreeOrder = generateConfirmationNumber(eventCode); // REMOVED
        // setConfirmationNumberInStore(newConfirmationNumberForFreeOrder); // REMOVED

        // Update payment details in store with only the necessary non-sensitive information
        setPaymentDetailsInStore({
          ...paymentDetailsFromStore,
          paymentIntentId: null,
          last4: null,
          paymentMethodId: null,
        });

        // Prepare data (similar to paid orders, but without paymentIntentId)
        const registrationDataForFreeOrder = {
          registrationId: useRegistrationStore.getState().registrationId,
          // confirmationNumber: newConfirmationNumberForFreeOrder, // REMOVED
          registrationType,
          primaryAttendee,
          additionalAttendees: useRegistrationStore.getState().attendeeDetails.additionalAttendees,
          tickets: currentTickets,
          totalAmount,
          billingDetails: {
            ...form.getValues(),
            country: form.getValues('country.isoCode'),
            stateTerritory: form.getValues('stateTerritory.name'),
          },
        };

        console.group("📝 Free Registration Submission");
        console.log("Registration Data:", JSON.stringify(registrationDataForFreeOrder, null, 2));
        // console.log("Confirmation Number:", registrationDataForFreeOrder.confirmationNumber); // REMOVED or comment out
        console.groupEnd();

        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

        // SIMULATE receiving confirmation number from Supabase for free order
        const backendConfirmationNumberForFreeOrder = `SUPA-FREE-${Math.floor(10000 + Math.random() * 90000)}`; // Example
        setConfirmedRegistrationDetailsInStore({ confirmationNumber: backendConfirmationNumberForFreeOrder }); // ADDED

        console.group("✅ Free Registration Success");
        console.log("Successfully saved free registration with ID:", registrationDataForFreeOrder.registrationId);
        console.log("Confirmation Number from Supabase:", backendConfirmationNumberForFreeOrder); // ADDED
        console.groupEnd();

        goToNextStep();
      } catch (error: any) {
        console.error("Error submitting free registration to Supabase:", error);
        setSubmissionError(error.message || "Failed to save your registration. Please contact support.");
      } finally {
        setIsSubmittingOrder(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader>
        <h1 className="text-2xl font-bold text-masonic-navy">Payment Details</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please provide your billing and payment information.</p>
      </SectionHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onBillingSubmit)} className="space-y-6">
          
          {/* Main two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8"> 
            
            {/* Left column (Billing Details & Payment Method) */}
            <div className="md:col-span-2 space-y-6">
              {/* Billing Details Form */}
              <BillingDetailsForm 
                form={form}
                primaryAttendee={primaryAttendee}
              />

              {/* Payment Method Section */}
              <PaymentMethod
                clientSecret={clientSecret}
                totalAmount={totalAmount}
                paymentIntentError={paymentIntentError}
                isPaymentIntentLoading={isPaymentIntentLoading}
                onPaymentSuccess={handleSuccessfulPayment}
                onPaymentError={handlePaymentError}
                setIsProcessingPayment={setIsProcessingPayment}
                billingDetails={form.getValues()}
              />
            </div>

            {/* Right column (Order Summary & Alerts) */}
            <div className="md:col-span-1">
              <OrderSummary
                primaryAttendee={primaryAttendee}
                additionalAttendees={additionalAttendees}
                currentTickets={currentTickets}
                totalAmount={totalAmount}
                isProcessingPayment={isProcessingPayment}
                isSubmittingOrder={isSubmittingOrder}
                isPaymentIntentLoading={isPaymentIntentLoading}
                localPaymentProcessingError={localPaymentProcessingError}
                submissionError={submissionError}
              />
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={goToPrevStep} 
              disabled={isProcessingPayment || isSubmittingOrder}
              className="border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Review Order
            </Button>
            
            {/* Only show Complete Registration for free orders */}
            {totalAmount === 0 && currentTickets.length > 0 && !isSubmittingOrder && (
               <Button 
                 type="submit" 
                 disabled={isSubmittingOrder} 
                 className="bg-masonic-navy hover:bg-masonic-blue"
               >
                  Complete Registration
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}