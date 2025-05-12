"use client"

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistrationStore, UnifiedAttendeeData, BillingDetailsType } from '../../../lib/registrationStore';
import { 
  billingDetailsSchema, 
  type BillingDetails as FormBillingDetailsSchema,
} from "@/lib/billing-details-schema";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { SectionHeader } from "../registration/SectionHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StripeBillingDetailsForClient } from "../payment/types";

// Import modular components
import { BillingDetailsForm } from "../payment/BillingDetailsForm";
import { PaymentMethod } from "../payment/PaymentMethod";
import { OrderSummary } from "../payment/OrderSummary";

// Placeholder ticket definitions (should be imported from a shared source eventually)
const ticketTypesMinimal = [
  { id: "installation", name: "Installation Ceremony", price: 75 },
  { id: "banquet", name: "Grand Banquet", price: 150 },
  { id: "brunch", name: "Farewell Brunch", price: 45 },
  { id: "tour", name: "City Tour", price: 60 },
];
const ticketPackagesMinimal = [
  { id: "complete", name: "Complete Package", price: 250, includes: ["installation", "banquet", "brunch", "tour"] },
  { id: "ceremony-banquet", name: "Ceremony & Banquet", price: 200, includes: ["installation", "banquet"] },
  { id: "social", name: "Social Package", price: 180, includes: ["banquet", "brunch", "tour"] },
];

export function PaymentStep() {
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

  // Effect to fetch payment intent when totalAmount changes
  useEffect(() => {
    if (totalAmount > 0) {
      setIsPaymentIntentLoading(true);
      setPaymentIntentError(null);
      setClientSecret(null);

      const createIntent = async () => {
        try {
          const response = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: totalAmount, currency: 'aud' }),
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

    const registrationData = {
      registrationId: storeDraftId,
      registrationType,
      primaryAttendee: primaryAttendee, 
      additionalAttendees: otherAttendees, 
      tickets: currentTicketsForSummary,
      totalAmount,
      paymentIntentId,
      billingDetails: {
        ...currentFormValues,
        country: currentFormValues.country?.isoCode,
        stateTerritory: currentFormValues.stateTerritory?.name,
      },
    };

    try {
      console.group("📝 Registration Submission");
      console.log("Registration Data:", JSON.stringify(registrationData, null, 2));
      console.log("Total Amount:", `$${totalAmount.toFixed(2)}`);
      console.log("Payment Intent ID:", paymentIntentId);
      console.log("Registration ID:", registrationData.registrationId);
      console.groupEnd();

      await new Promise(resolve => setTimeout(resolve, 1500));

      const backendConfirmationNumber = `SUPA-${Math.floor(10000 + Math.random() * 90000)}`;
      setStoreConfirmationNumber(backendConfirmationNumber);

      console.group("✅ Registration Success");
      console.log("Successfully saved registration with ID:", registrationData.registrationId);
      console.log("Confirmation Number from Supabase:", backendConfirmationNumber);
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

  const handlePaymentError = (errorMessage: string) => {
    setLocalPaymentProcessingError(errorMessage);
    setIsProcessingPayment(false);
  };

  const onBillingSubmit = async (data: FormBillingDetailsSchema) => {
    setLocalPaymentProcessingError(null);
    
    if (totalAmount > 0 && !clientSecret) {
      setLocalPaymentProcessingError("Payment gateway is not ready. Please wait or try refreshing.");
      return;
    }
    
    if (totalAmount === 0 && currentTicketsForSummary.length > 0) {
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

        const registrationDataForFreeOrder = {
          registrationId: storeDraftId,
          registrationType,
          primaryAttendee: primaryAttendee,
          additionalAttendees: otherAttendees,
          tickets: currentTicketsForSummary,
          totalAmount,
          billingDetails: {
            ...currentFormValues,
            country: currentFormValues.country?.isoCode,
            stateTerritory: currentFormValues.stateTerritory?.name,
          },
        };

        console.group("📝 Free Registration Submission");
        console.log("Registration Data:", JSON.stringify(registrationDataForFreeOrder, null, 2));
        console.groupEnd();

        await new Promise(resolve => setTimeout(resolve, 1500));

        const backendConfirmationNumberForFreeOrder = `SUPA-FREE-${Math.floor(10000 + Math.random() * 90000)}`;
        setStoreConfirmationNumber(backendConfirmationNumberForFreeOrder);

        console.group("✅ Free Registration Success");
        console.log("Successfully saved free registration with ID:", registrationDataForFreeOrder.registrationId);
        console.log("Confirmation Number from Supabase:", backendConfirmationNumberForFreeOrder);
        console.groupEnd();

        goToNextStep();
      } catch (error: any) {
        console.group("❌ Free Registration Error");
        console.error("Error submitting free registration:", error);
        console.groupEnd();
        setSubmissionError(error.message || "Failed to save your free registration. Please contact support.");
      } finally {
        setIsSubmittingOrder(false);
      }
      return;
    }

    console.log("Billing details submitted, Stripe will handle payment processing.", data);
  };
  
  // Effect to prefill form if primary attendee data is available
  useEffect(() => {
    if (primaryAttendee && form.getValues('billToPrimary')) {
      form.reset({
        ...form.getValues(),
        billToPrimary: true,
        firstName: primaryAttendee.firstName || '',
        lastName: primaryAttendee.lastName || '',
        mobileNumber: primaryAttendee.primaryPhone || '', 
        emailAddress: primaryAttendee.primaryEmail || '',
        addressLine1: '',
        suburb: '',
        postcode: '',
        country: undefined,
        stateTerritory: undefined,
        businessName: '',
      });
    } else if (!form.getValues('billToPrimary')) {
      form.reset({
        ...form.getValues(),
        firstName: '',
        lastName: '',
        addressLine1: '',
        suburb: '',
        postcode: '',
        mobileNumber: '', 
        emailAddress: '',
        country: undefined,
        stateTerritory: undefined,
        businessName: '',
      });
    }
  }, [primaryAttendee, form.watch('billToPrimary'), form.reset]);

  return (
    <div className="space-y-8">
      <SectionHeader>
        <h1 className="text-2xl font-bold text-masonic-navy">Payment Details</h1>
        <div className="masonic-divider"></div>
        <p className="text-gray-600">Please provide your billing information and payment method.</p>
      </SectionHeader>

      {submissionError && (
        <Alert variant="destructive">
          <AlertTitle>Submission Error</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onBillingSubmit)} className="space-y-6">
              <BillingDetailsForm form={form} primaryAttendee={primaryAttendee}/>
              
              {totalAmount > 0 && clientSecret && (
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
        </div>

        <div className="lg:col-span-1 space-y-6">
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
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={goToPrevStep} disabled={isSubmittingOrder || isProcessingPayment}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous Step
        </Button>
        {(totalAmount === 0 && currentTicketsForSummary.length > 0) && (
             <Button onClick={form.handleSubmit(onBillingSubmit)} disabled={isSubmittingOrder} className="bg-masonic-gold text-masonic-navy hover:bg-masonic-lightgold">
                Complete Registration
             </Button>
        )}
      </div>
    </div>
  );
}