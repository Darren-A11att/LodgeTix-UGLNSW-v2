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
import { OneColumnStepLayout } from "../Layouts/OneColumnStepLayout";
import { getEventTicketsService, type TicketDefinition, type EventPackage } from '@/lib/services/event-tickets-service';

interface PaymentStepProps {
  eventId?: string;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  onSaveData?: () => Promise<{ success: boolean; registrationId?: string; error?: string }>;
  currentStep?: number;
  steps?: string[];
}

function PaymentStep(props: PaymentStepProps) {
  const { onNextStep, onPrevStep, eventId } = props;
  
  // Get navigation functions from store as fallback
  const storeGoToNextStep = useRegistrationStore((state) => state.goToNextStep);
  const storeGoToPrevStep = useRegistrationStore((state) => state.goToPrevStep);
  
  // Use props if provided, otherwise use store functions
  const goToNextStep = onNextStep || storeGoToNextStep;
  const goToPrevStep = onPrevStep || storeGoToPrevStep;
  
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
  
  // Processing steps for visual feedback
  const [showProcessingSteps, setShowProcessingSteps] = useState(false);
  const [processingSteps, setProcessingSteps] = useState([
    { name: 'Saving registration', description: 'Creating your registration record', status: 'upcoming' as const },
    { name: 'Processing payment', description: 'Securely processing your payment', status: 'upcoming' as const },
    { name: 'Confirming order', description: 'Finalizing your registration', status: 'upcoming' as const },
  ]);

  // Session state
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);
  
  // Ref for payment method component
  const paymentMethodRef = useRef<CheckoutFormHandle>(null);

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
        const GRAND_PROCLAMATION_PARENT_ID = "307c2d85-72d5-48cf-ac94-082ca2a5d23d";
        const targetEventId = eventId || storeEventId || GRAND_PROCLAMATION_PARENT_ID;
        
        console.log("💳 Fetching tickets for event:", targetEventId);
        console.log("💳 Props eventId:", eventId);
        console.log("💳 Store eventId:", storeEventId);
        
        // Check if this is the parent event or a child event (matching ticket selection logic)
        if (targetEventId === GRAND_PROCLAMATION_PARENT_ID) {
          // Fetch child events and their tickets
          const childEventsData = await service.getChildEventsWithTicketsAndPackages(targetEventId);
          
          // Aggregate all tickets from child events
          const allTickets: TicketDefinition[] = [];
          childEventsData.forEach(eventData => {
            allTickets.push(...eventData.tickets);
          });
          
          // Use packages from the first result (they're the same for all child events)
          if (childEventsData.length > 0) {
            console.log("💳 Loaded tickets from child events:", allTickets.length);
            console.log("💳 Loaded packages:", childEventsData[0].packages.length);
            setTicketTypes(allTickets);
            setTicketPackages(childEventsData[0].packages);
          }
        } else {
          // For a specific event, fetch its tickets and packages
          const result = await service.getEventTicketsAndPackages(targetEventId);
          console.log("💳 Loaded tickets:", result.tickets.length);
          console.log("💳 Loaded packages:", result.packages.length);
          setTicketTypes(result.tickets);
          setTicketPackages(result.packages);
        }
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

  // Function to expand packages into individual tickets for registration
  const expandPackagesForRegistration = (
    tickets: Array<any>,
    ticketTypes: TicketDefinition[],
    ticketPackages: EventPackage[]
  ) => {
    const expandedTickets: Array<any> = [];
    
    tickets.forEach(ticket => {
      if (ticket.isPackage) {
        // Find the package info - need to extract package ID from the compound ID
        const packageId = ticket.id.split('-').slice(1).join('-'); // Remove attendeeId prefix
        const packageInfo = ticketPackages.find(p => p.id === packageId);
        console.log(`📦 Looking for package ${packageId}:`, packageInfo);
        
        if (packageInfo) {
          // If we have individual tickets, expand the package
          if (packageInfo.includes && packageInfo.includes.length > 0 && ticketTypes.length > 0) {
            // Expand package into individual tickets
            packageInfo.includes.forEach(ticketTypeId => {
              const ticketType = ticketTypes.find(t => t.id === ticketTypeId);
              if (ticketType) {
                expandedTickets.push({
                  id: `${ticket.attendeeId}-${ticketType.id}`,
                  attendeeId: ticket.attendeeId,
                  event_id: ticketType.event_id,
                  eventTicketId: ticketType.id,
                  ticketTypeId: ticketType.id,
                  name: ticketType.name,
                  price: ticketType.price,
                  isFromPackage: true,
                  packageId: packageInfo.id,
                  packageName: packageInfo.name,
                  isPackage: false  // Individual ticket from package
                });
              }
            });
          } else {
            // Fallback: Use package as a single ticket when individual tickets aren't available
            expandedTickets.push({
              id: ticket.id,
              attendeeId: ticket.attendeeId,
              event_id: eventId || storeEventId, // Use the event ID from props or store
              eventTicketId: packageInfo.id,
              ticketTypeId: packageInfo.id,
              name: packageInfo.name,
              price: packageInfo.price,
              isFromPackage: true,
              packageId: packageInfo.id,
              packageName: packageInfo.name,
              isPackage: true  // This IS a package
            });
            console.log(`📦 Added package as single ticket: ${packageInfo.name} - $${packageInfo.price}`);
          }
        } else {
          console.warn(`📦 Package not found for ID: ${packageId}`);
        }
      } else {
        // Individual ticket - pass through
        expandedTickets.push({
          ...ticket,
          eventTicketId: ticket.id.split('-')[1] || ticket.id,  // Extract actual ticket ID
          ticketTypeId: ticket.id.split('-')[1] || ticket.id
        });
      }
    });
    
    console.log("📦 Expanded tickets for registration:", {
      original: tickets.length,
      expanded: expandedTickets.length,
      details: expandedTickets
    });
    
    return expandedTickets;
  };

  // Debug function to analyze why total might be 0
  const debugTicketCalculation = () => {
    console.log("🔍 DEBUG: Analyzing ticket calculation issue");
    console.log("1️⃣ Attendees:", {
      count: allStoreAttendees.length,
      ids: allStoreAttendees.map(a => ({ id: a.attendeeId, name: `${a.firstName} ${a.lastName}` }))
    });
    console.log("2️⃣ Packages from store:", packages);
    console.log("3️⃣ Ticket types loaded:", {
      count: ticketTypes.length,
      types: ticketTypes.map(t => ({ id: t.id, name: t.name, price: t.price }))
    });
    console.log("4️⃣ Ticket packages loaded:", {
      count: ticketPackages.length,
      packages: ticketPackages.map(p => ({ id: p.id, name: p.name, price: p.price }))
    });
    
    // Check each attendee's selection
    allStoreAttendees.forEach(attendee => {
      const selection = packages[attendee.attendeeId];
      console.log(`5️⃣ Attendee ${attendee.firstName} ${attendee.lastName} (${attendee.attendeeId}):`, {
        hasSelection: !!selection,
        selection,
        calculatedTickets: selection ? (
          selection.ticketDefinitionId 
            ? `Package: ${selection.ticketDefinitionId}`
            : `Individual tickets: ${selection.selectedEvents?.join(', ') || 'none'}`
        ) : 'NO SELECTION'
      });
    });
  };

  // Calculate tickets for summary
  const currentTicketsForSummary = useMemo(() => {
    if (isLoadingTickets) {
      console.log("🎫 Skipping ticket calculation - still loading");
      return [];
    }
    
    // Additional checks to ensure data is loaded
    const hasPackageSelections = Object.values(packages).some(p => p.ticketDefinitionId);
    const hasEventSelections = Object.values(packages).some(p => p.selectedEvents && p.selectedEvents.length > 0);
    
    if (hasPackageSelections && ticketPackages.length === 0) {
      console.warn("🎫 WARNING: Have package selections but ticketPackages not loaded yet");
      return [];
    }
    
    if (hasEventSelections && ticketTypes.length === 0) {
      console.warn("🎫 WARNING: Have event selections but ticketTypes not loaded yet");
      return [];
    }
    
    // Check if packages object is empty - might indicate store not hydrated yet
    const hasPackages = Object.keys(packages).length > 0;
    if (!hasPackages && allStoreAttendees.length > 0) {
      console.warn("🎫 WARNING: No packages found but attendees exist - store might not be hydrated");
    }
    
    console.log("🎫 Calculating tickets for summary:", {
      attendeeCount: allStoreAttendees.length,
      attendeeIds: allStoreAttendees.map(a => a.attendeeId),
      packagesData: packages,
      packagesKeys: Object.keys(packages),
      hasPackages,
      ticketTypesCount: ticketTypes.length,
      ticketPackagesCount: ticketPackages.length,
      ticketPrices: ticketTypes.map(t => ({ id: t.id, name: t.name, price: t.price })),
      packagePrices: ticketPackages.map(p => ({ id: p.id, name: p.name, price: p.price }))
    });
    
    return allStoreAttendees.flatMap(attendee => {
      const attendeeId = attendee.attendeeId;
      const selection = packages[attendeeId];
      
      console.log(`🎫 Processing attendee ${attendeeId}:`, {
        hasSelection: !!selection,
        selection,
        packagesObject: packages,
        attendeeIdType: typeof attendeeId,
        packageKeys: Object.keys(packages)
      });
      
      if (!selection) {
        console.warn(`🎫 NO SELECTION FOUND for attendee ${attendeeId}`);
        return [];
      }
      
      let tickets: Array<{ id: string; name: string; price: number; attendeeId: string; isPackage?: boolean; description?: string }> = [];

      if (selection.ticketDefinitionId) {
        console.log(`🎫 Looking for package ${selection.ticketDefinitionId} in ${ticketPackages.length} packages`);
        console.log(`🎫 Available packages:`, ticketPackages.map(p => ({ id: p.id, name: p.name })));
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
          console.log(`🎫 ✅ Added package ticket: ${pkgInfo.name} - $${pkgInfo.price}`);
        } else {
          console.warn(`🎫 ❌ Package ${selection.ticketDefinitionId} not found in ticketPackages`);
          console.warn(`🎫 This likely means packages haven't loaded yet`);
        }
      } else if (selection.selectedEvents && selection.selectedEvents.length > 0) {
        console.log(`🎫 Processing ${selection.selectedEvents.length} individual tickets`);
        selection.selectedEvents.forEach(ticketId => {
          const ticketInfo = ticketTypes.find(t => t.id === ticketId);
          console.log(`🎫 Looking for ticket ${ticketId}:`, ticketInfo);
          if (ticketInfo) {
            tickets.push({ 
              id: `${attendeeId}-${ticketInfo.id}`,
              name: ticketInfo.name, 
              price: ticketInfo.price, 
              attendeeId, 
              isPackage: false,
              description: ticketInfo.description || ticketInfo.name
            });
            console.log(`🎫 Added individual ticket: ${ticketInfo.name} - $${ticketInfo.price}`);
          } else {
            console.warn(`🎫 Ticket ${ticketId} not found in ticketTypes`);
          }
        });
      }
      return tickets;
    });
  }, [allStoreAttendees, packages, ticketTypes, ticketPackages, isLoadingTickets]);

  // Calculate total amount
  // IMPORTANT: For packages, we use the package price (which might include discounts)
  // NOT the sum of individual ticket prices
  const totalAmount = useMemo(() => {
    const total = currentTicketsForSummary.reduce((sum, ticket) => {
      const price = ticket.price || 0;
      if (price === 0) {
        console.warn(`⚠️ Ticket has $0 price:`, ticket);
      }
      return sum + price;
    }, 0);
    
    console.log("💰 Total amount calculation:", {
      total,
      ticketCount: currentTicketsForSummary.length,
      tickets: currentTicketsForSummary.map(t => ({ 
        name: t.name, 
        price: t.price,
        attendeeId: t.attendeeId,
        isPackage: t.isPackage 
      })),
      attendeeCount: allStoreAttendees.length,
      packages: Object.keys(packages).length,
      ticketTypesLoaded: ticketTypes.length,
      ticketPackagesLoaded: ticketPackages.length
    });
    
    // If total is 0 but we have attendees, run debug
    if (total === 0 && allStoreAttendees.length > 0) {
      console.warn("⚠️ Total is $0 but attendees exist - running debug");
      debugTicketCalculation();
    }
    
    return total;
  }, [currentTicketsForSummary]);

  // Setup form
  const form = useForm<FormBillingDetailsSchema>({
    resolver: zodResolver(billingDetailsSchema),
    defaultValues: {
      billToPrimary: false,
      // Don't pre-fill personal details from stored billing unless explicitly needed
      // This prevents confusion when user hasn't selected "bill to primary"
      firstName: '',
      lastName: '',
      emailAddress: '',
      mobileNumber: '',
      // Address fields can be pre-filled from stored data
      addressLine1: storeBillingDetails?.addressLine1 || '',
      businessName: storeBillingDetails?.businessName || '',
      suburb: storeBillingDetails?.city || '',
      postcode: storeBillingDetails?.postalCode || '',
      stateTerritory: storeBillingDetails?.stateProvince ? { name: storeBillingDetails.stateProvince } : null,
      country: storeBillingDetails?.country ? { isoCode: 'AU', name: 'Australia' } : { isoCode: 'AU', name: 'Australia' },
    }
  });

  // Watch form changes to update store
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateStoreBillingDetails(value as FormBillingDetailsSchema);
    });
    return () => subscription.unsubscribe();
  }, [form, updateStoreBillingDetails]);

  // Handle payment method creation from CheckoutForm
  const handlePaymentMethodCreated = async (paymentMethodId: string, stripeBillingDetails: StripeBillingDetailsForClient) => {
    console.log("💳 Payment method created, processing payment:", paymentMethodId);
    
    if (!anonymousSessionEstablished) {
      setPaymentError("Session expired. Please return to the registration type page to complete verification.");
      return;
    }

    setPaymentError(null);
    setShowProcessingSteps(true);
    setIsProcessingPayment(true);
    
    // Update steps to show registration saving
    setProcessingSteps(prev => {
      const newSteps = [...prev];
      newSteps[0] = { ...newSteps[0], status: 'current' };
      return newSteps;
    });

    try {
      // Step 1: Save registration if not already saved
      let registrationId = currentRegistrationId;
      
      if (!registrationId) {
        console.log("📨 Saving registration");
        
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

          const billingData = form.getValues();
          // Expand packages into individual tickets for registration
          const expandedTickets = expandPackagesForRegistration(
            currentTicketsForSummary,
            ticketTypes,
            ticketPackages
          );
          
          const registrationData = {
            registrationType,
            primaryAttendee,
            additionalAttendees: otherAttendees,
            tickets: expandedTickets,  // Use expanded tickets
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
      }
      
      // Update step status
      setProcessingSteps(prev => {
        const newSteps = [...prev];
        newSteps[0] = { ...newSteps[0], status: 'complete' };
        newSteps[1] = { ...newSteps[1], status: 'current' };
        return newSteps;
      });

      // Step 2: Process payment
      const response = await fetch(`/api/registrations/${registrationId}/payment`, {
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
      setStoreConfirmationNumber(result.confirmationNumber || registrationId);
      
      // Navigate to confirmation after a short delay
      setTimeout(() => {
        goToNextStep();
      }, 1500);
      
    } catch (error: any) {
      console.error("❌ Payment error:", error);
      setPaymentError(error.message || "Payment processing failed");
      setIsProcessingPayment(false);
      setShowProcessingSteps(false);
      
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

  // Form submit handler - just validates billing form
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The actual payment is triggered by the CheckoutForm button
  };

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

    // Main form with two-column 60/40 layout
    return (
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Left Column - Billing Details (60%) */}
            <div className="flex-1 space-y-6 md:flex-none md:w-[60%]">
              <h3 className="text-lg font-semibold">Billing Information</h3>
              <BillingDetailsForm form={form} primaryAttendee={primaryAttendee ? {
                firstName: primaryAttendee.firstName || undefined,
                lastName: primaryAttendee.lastName || undefined,
                primaryPhone: primaryAttendee.primaryPhone || undefined,
                primaryEmail: primaryAttendee.primaryEmail || undefined,
                grandLodgeId: primaryAttendee.grandLodgeId || undefined,
                attendeeType: primaryAttendee.attendeeType || undefined
              } : null} />
            </div>
            
            {/* Right Column - Order Summary and Payment (40%) */}
            <div className="flex-1 space-y-6 md:flex-none md:w-[40%]">
              <h3 className="text-lg font-semibold">Order Summary & Payment</h3>
              
              {/* Order Summary */}
              <div className="bg-gray-50 p-4 md:p-6 rounded-lg space-y-4">
                <h4 className="font-medium text-gray-900">Order Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Attendees:</span>
                    <span className="font-medium text-gray-900">{allStoreAttendees.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Tickets:</span>
                    <span className="font-medium text-gray-900">{currentTicketsForSummary.length}</span>
                  </div>
                  
                  {/* Ticket Details */}
                  {currentTicketsForSummary.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-gray-200">
                      {currentTicketsForSummary.map((ticket, idx) => (
                        <div key={ticket.id} className="flex justify-between text-xs">
                          <span className="text-gray-500 truncate pr-2" style={{ maxWidth: 'calc(100% - 60px)' }}>
                            {ticket.name}
                          </span>
                          <span className="text-gray-600 font-medium">${ticket.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className="border-t-2 border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-xl font-bold text-masonic-navy">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Method */}
              <PaymentMethod 
                ref={paymentMethodRef}
                totalAmount={totalAmount}
                onPaymentSuccess={handlePaymentMethodCreated}
                onPaymentError={setPaymentError}
                setIsProcessingPayment={setIsProcessingPayment}
                billingDetails={form.getValues()}
                isProcessing={isProcessingPayment}
              />
            </div>
          </div>
          
          {/* Error Alert */}
          {paymentError && (
            <Alert variant="destructive" className="mt-6">
              <AlertTitle>Payment Error</AlertTitle>
              <AlertDescription>{paymentError}</AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button 
              type="button"
              variant="outline" 
              onClick={goToPrevStep} 
              disabled={isProcessingPayment}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous Step
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  return (
    <OneColumnStepLayout
      currentStep={5}
      totalSteps={6}
      stepName="Payment"
    >
      {renderFormContent()}
    </OneColumnStepLayout>
  );
}

export default PaymentStep;