"use client"

import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StripeBillingDetailsForClient } from "../payment/types";

// Import modular components
import { BillingDetailsForm } from "../payment/BillingDetailsForm";
import { PaymentMethod } from "../payment/PaymentMethod";
import { CheckoutFormHandle } from "../payment/CheckoutForm";
import { PaymentProcessing } from "../payment/PaymentProcessing";
import { getPaymentSummaryData } from '../Summary/summary-data/payment-summary-data';
import { SummaryRenderer } from '../Summary/SummaryRenderer';
import { TwoColumnStepLayout } from "../Layouts/TwoColumnStepLayout";
import { getEventTicketsService, type TicketDefinition, type EventPackage } from '@/lib/services/event-tickets-service';

interface PaymentStepProps {
  eventId: string;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSaveData?: () => Promise<{ success: boolean; registrationId?: string; error?: string }>;
  currentStep?: number;
  steps?: string[];
}

function PaymentStep(props: PaymentStepProps) {
  const { onNextStep: goToNextStep, onPrevStep: goToPrevStep, eventId } = props;
  
  // Store state
  const {
    attendees: allStoreAttendees,
    registrationType,
    packages,
    billingDetails: storeBillingDetails,
    updateBillingDetails: updateStoreBillingDetails,
    setConfirmationNumber: setStoreConfirmationNumber,
    draftId: storeDraftId,
    eventId: storeEventId,
  } = useRegistrationStore();
  
  const anonymousSessionEstablished = useRegistrationStore(selectAnonymousSessionEstablished);

  // State for ticket data
  const [ticketTypes, setTicketTypes] = useState<TicketDefinition[]>([]);
  const [ticketPackages, setTicketPackages] = useState<EventPackage[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  
  // State for payment processing
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentRegistrationId, setCurrentRegistrationId] = useState<string | null>(null);
  
  // Ref for payment method component
  const paymentMethodRef = useRef<CheckoutFormHandle>(null);
  
  // Processing steps for visual feedback
  const [showProcessingSteps, setShowProcessingSteps] = useState(false);
  const [processingSteps, setProcessingSteps] = useState([
    { name: 'Saving registration', description: 'Creating your registration record', status: 'upcoming' as const },
    { name: 'Processing payment', description: 'Securely processing your payment', status: 'upcoming' as const },
    { name: 'Confirming order', description: 'Finalizing your registration', status: 'upcoming' as const },
  ]);

  // Session state
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);

  // Derive attendee data
  const primaryAttendee = useMemo(() => 
    allStoreAttendees.find(att => att.isPrimary),
    [allStoreAttendees]
  );
  const otherAttendees = useMemo(() => 
    allStoreAttendees.filter(att => !att.isPrimary),
    [allStoreAttendees]
  );

  // Fetch tickets on mount
  useEffect(() => {
    async function fetchTicketsAndPackages() {
      try {
        setIsLoadingTickets(true);
        setTicketsError(null);
        
        const service = getEventTicketsService();
        const parentEventId = eventId || storeEventId || "307c2d85-72d5-48cf-ac94-082ca2a5d23d";
        
        console.log("💳 Fetching tickets for event:", parentEventId);
        
        const result = await service.getEventTicketsAndPackages(parentEventId);
        
        console.log("💳 Loaded tickets:", result.tickets.length);
        console.log("💳 Loaded packages:", result.packages.length);
        
        setTicketTypes(result.tickets);
        setTicketPackages(result.packages);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        setTicketsError(error instanceof Error ? error.message : 'Failed to load ticket information');
      } finally {
        setIsLoadingTickets(false);
      }
    }
    
    fetchTicketsAndPackages();
  }, [eventId, storeEventId]);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      console.log("🔐 Checking anonymous session status");
      const isEstablished = selectAnonymousSessionEstablished(useRegistrationStore.getState());
      console.log("🔐 Anonymous session established:", isEstablished);
      setSessionCheckComplete(true);
    };
    
    checkSession();
  }, []);

  // Calculate tickets for summary
  const currentTicketsForSummary = useMemo(() => {
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

  // Calculate total amount
  const totalAmount = useMemo(() => {
    const total = currentTicketsForSummary.reduce((sum, ticket) => sum + ticket.price, 0);
    console.log("💰 Total amount:", total);
    return total;
  }, [currentTicketsForSummary]);

  // Setup form
  const form = useForm<FormBillingDetailsSchema>({
    resolver: zodResolver(billingDetailsSchema),
    defaultValues: {
      billToPrimary: false,
      firstName: storeBillingDetails?.firstName || primaryAttendee?.firstName || '',
      lastName: storeBillingDetails?.lastName || primaryAttendee?.lastName || '',
      emailAddress: storeBillingDetails?.email || primaryAttendee?.primaryEmail || '',
      mobileNumber: storeBillingDetails?.phone || primaryAttendee?.primaryPhone || '',
      addressLine1: storeBillingDetails?.addressLine1 || '',
      businessName: storeBillingDetails?.businessName || '',
      suburb: storeBillingDetails?.city || '',
      postcode: storeBillingDetails?.postalCode || '',
      stateTerritory: storeBillingDetails?.stateProvince ? { name: storeBillingDetails.stateProvince } : null,
      country: storeBillingDetails?.country ? { isoCode: 'AU', name: 'Australia' } : { isoCode: 'AU', name: 'Australia' },
    }
  });

  // Linear payment flow - no events, no retries
  const handlePaymentSubmit = async (billingData: FormBillingDetailsSchema) => {
    console.log("🔶 Starting linear payment flow");
    
    if (!anonymousSessionEstablished) {
      setPaymentError("Session expired. Please return to the registration type page to complete verification.");
      return;
    }

    // Update store with billing details
    updateStoreBillingDetails(billingData);
    setPaymentError(null);
    setShowProcessingSteps(true);
    setIsProcessingPayment(true);
    
    // Update first step
    setProcessingSteps(prev => {
      const newSteps = [...prev];
      newSteps[0] = { ...newSteps[0], status: 'current' };
      return newSteps;
    });

    try {
      // Step 1: Save registration
      console.log("📨 Step 1: Saving registration");
      
      let registrationId: string;
      
      if (props.onSaveData) {
        // Use provided save function
        const result = await props.onSaveData();
        if (!result.success || !result.registrationId) {
          throw new Error(result.error || "Failed to save registration");
        }
        registrationId = result.registrationId;
      } else {
        // Direct API call
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User authentication required');
        }

        const registrationData = {
          registrationType,
          primaryAttendee,
          additionalAttendees: otherAttendees,
          tickets: currentTicketsForSummary,
          totalAmount,
          billingDetails: billingData,
          eventId: eventId || storeEventId,
          customerId: user.id
        };

        const response = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registrationData)
        });

        const result = await response.json();
        
        if (!response.ok || !result.registrationId) {
          throw new Error(result.error || 'Failed to save registration');
        }
        
        registrationId = result.registrationId;
      }

      console.log("✅ Registration saved:", registrationId);
      setCurrentRegistrationId(registrationId);
      
      // Update step status
      setProcessingSteps(prev => {
        const newSteps = [...prev];
        newSteps[0] = { ...newSteps[0], status: 'complete' };
        newSteps[1] = { ...newSteps[1], status: 'current' };
        return newSteps;
      });

      // Step 2: Create payment method
      console.log("💳 Step 2: Creating payment method");
      
      if (!paymentMethodRef.current) {
        throw new Error("Payment form not ready");
      }
      
      const paymentResult = await paymentMethodRef.current.createPaymentMethod();
      
      if (paymentResult.error) {
        throw new Error(paymentResult.error);
      }
      
      if (!paymentResult.paymentMethodId) {
        throw new Error("Failed to create payment method");
      }
      
      // Step 3: Process payment on server
      await handlePaymentMethodCreated(paymentResult.paymentMethodId, billingData);
      
    } catch (error: any) {
      console.error("❌ Error in payment flow:", error);
      setPaymentError(error.message || "An error occurred during processing");
      setShowProcessingSteps(false);
      setIsProcessingPayment(false);
      
      // Reset steps
      setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'upcoming' as const })));
    }
  };

  // Handle payment method creation from CheckoutForm
  const handlePaymentMethodCreated = async (paymentMethodId: string, billingData: any) => {
    console.log("💳 Step 3: Processing payment with method:", paymentMethodId);
    
    if (!currentRegistrationId) {
      setPaymentError("Registration ID missing. Please try again.");
      setIsProcessingPayment(false);
      return;
    }

    try {
      // Format billing details for Stripe
      const stripeBillingDetails: StripeBillingDetailsForClient = {
        name: `${billingData.firstName} ${billingData.lastName}`,
        email: billingData.emailAddress,
        phone: billingData.mobileNumber,
        address: {
          line1: billingData.addressLine1,
          city: billingData.suburb,
          state: billingData.stateTerritory?.name,
          postal_code: billingData.postcode,
          country: billingData.country?.isoCode || 'AU',
          ...(billingData.businessName ? { line2: billingData.businessName } : {})
        }
      };
      
      // Call server to create and confirm payment intent
      const response = await fetch(`/api/registrations/${currentRegistrationId}/payment`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId,
          totalAmount,
          billingDetails: stripeBillingDetails
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process payment");
      }

      console.log("✅ Payment processed:", result);
      
      // Handle 3D Secure if needed
      if (result.requiresAction && result.clientSecret) {
        console.log("🔐 3D Secure required");
        const stripe = (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        const { error } = await stripe.confirmCardPayment(result.clientSecret);
        
        if (error) {
          throw new Error(`Authentication failed: ${error.message}`);
        }
      }
      
      // Update final step
      setProcessingSteps(prev => {
        const newSteps = [...prev];
        newSteps[1] = { ...newSteps[1], status: 'complete' };
        newSteps[2] = { ...newSteps[2], status: 'complete' };
        return newSteps;
      });
      
      // Set confirmation number and proceed
      setStoreConfirmationNumber(result.confirmationNumber || currentRegistrationId);
      
      // Navigate to confirmation after a short delay
      setTimeout(() => {
        goToNextStep();
      }, 1500);
      
    } catch (error: any) {
      console.error("❌ Payment error:", error);
      setPaymentError(error.message || "Payment processing failed");
      setIsProcessingPayment(false);
      
      // Update steps to show error
      setProcessingSteps(prev => {
        const newSteps = [...prev];
        const currentIndex = newSteps.findIndex(s => s.status === 'current');
        if (currentIndex >= 0) {
          newSteps[currentIndex] = { ...newSteps[currentIndex], status: 'error' };
        }
        return newSteps;
      });
    }
  };

  // Form submit handler
  const onSubmit = form.handleSubmit(handlePaymentSubmit);

  // Render content
  const renderFormContent = () => {
    // Show processing steps if active
    if (showProcessingSteps) {
      return (
        <PaymentProcessing 
          steps={processingSteps}
          onBack={() => {
            setShowProcessingSteps(false);
            setPaymentError(null);
            setIsProcessingPayment(false);
            setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'upcoming' as const })));
          }}
          error={paymentError}
        />
      );
    }

    // Loading state
    if (isLoadingTickets) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="animate-spin h-8 w-8 text-masonic-navy mr-2" />
          <p className="text-masonic-navy">Loading payment information...</p>
        </div>
      );
    }

    // Error state
    if (ticketsError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Failed to Load Tickets</AlertTitle>
          <AlertDescription>{ticketsError}</AlertDescription>
        </Alert>
      );
    }

    // Session check
    if (!sessionCheckComplete) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-masonic-navy"></div>
          <p className="ml-3 text-masonic-navy">Verifying session...</p>
        </div>
      );
    }

    // Session error
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

    // Main form
    return (
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-8">
          <BillingDetailsForm form={form} primaryAttendee={primaryAttendee ? {
            firstName: primaryAttendee.firstName || undefined,
            lastName: primaryAttendee.lastName || undefined,
            primaryPhone: primaryAttendee.primaryPhone || undefined,
            primaryEmail: primaryAttendee.primaryEmail || undefined,
            grandLodgeId: primaryAttendee.grandLodgeId || undefined,
            attendeeType: primaryAttendee.attendeeType || undefined
          } : null} />
          
          <PaymentMethod 
            ref={paymentMethodRef}
            totalAmount={totalAmount}
            onPaymentSuccess={handlePaymentMethodCreated}
            onPaymentError={setPaymentError}
            setIsProcessingPayment={setIsProcessingPayment}
            billingDetails={form.getValues()}
            isProcessing={isProcessingPayment}
          />
          
          {paymentError && (
            <Alert variant="destructive">
              <AlertTitle>Payment Error</AlertTitle>
              <AlertDescription>{paymentError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between">
            <Button 
              type="button"
              variant="outline" 
              onClick={goToPrevStep} 
              disabled={isProcessingPayment}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous Step
            </Button>
            
            <Button 
              type="submit"
              disabled={isProcessingPayment || !form.formState.isValid}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Complete Payment - $${totalAmount.toFixed(2)}`
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  // Summary data
  const renderSummaryContent = () => {
    const summaryData = getPaymentSummaryData({
      totalAmount,
      isPaymentValid: form.formState.isValid && !isProcessingPayment,
      attendeeCount: (primaryAttendee ? 1 : 0) + otherAttendees.length,
      ticketCount: currentTicketsForSummary.length,
      isProcessing: isProcessingPayment,
      error: paymentError
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