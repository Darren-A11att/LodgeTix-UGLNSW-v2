"use client"

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistrationStore, UnifiedAttendeeData, BillingDetailsType, selectAnonymousSessionEstablished } from '../../../../lib/registrationStore';
import { 
  billingDetailsSchema, 
  type BillingDetails as FormBillingDetailsSchema,
} from "@/lib/booking-contact-schema";
import { getBrowserClient } from '@/lib/supabase-singleton';

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Receipt, CreditCard, ShieldCheck } from "lucide-react";
import { SummaryRenderer } from '../Summary/SummaryRenderer';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SquareBillingDetails } from "../payment/types";

// Import modular components
import { BillingDetailsForm } from "../payment/BillingDetailsForm";
import { UnifiedPaymentForm } from "../payment/UnifiedPaymentForm";
import { PaymentProcessing } from "../payment/PaymentProcessing";
import { OneColumnStepLayout } from "../Layouts/OneColumnStepLayout";
import { getFunctionTicketsService, type FunctionTicketDefinition, type FunctionPackage } from '@/lib/services/function-tickets-service';
import { calculateSquareFees, SQUARE_RATES, formatFeeBreakdown, getFeeDisclaimer, getFeeModeFromEnv, getPlatformFeePercentage, isDomesticCard, getProcessingFeeLabel } from '@/lib/utils/square-fee-calculator';
import { resolveTicketPrices, expandPackagesWithPricing, validateTicketPricing, type TicketWithPrice, type EventTicketRecord, type PackageRecord } from '@/lib/utils/ticket-price-resolver';
import { Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';
import { getEnhancedTicketSummaryData } from '../Summary/summary-data/ticket-summary-data-enhanced';

interface PaymentStepProps {
  functionId?: string;
  functionData?: any;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  onSaveData?: () => Promise<{ success: boolean; registrationId?: string; error?: string }>;
  currentStep?: number;
  steps?: string[];
}

function PaymentStep(props: PaymentStepProps) {
  const { onNextStep, onPrevStep, functionId, functionData } = props;
  const router = useRouter();
  
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
    billingDetails: storeBillingDetails,
    updateBillingDetails: updateStoreBillingDetails,
    setConfirmationNumber: setStoreConfirmationNumber,
    draftId: storeDraftId,
    functionId: storeFunctionId,
    // Enhanced metadata structures (primary)
    attendeeSelections,
    orderSummary,
    lodgeBulkSelection,
    ticketMetadata,
    packageMetadata,
  } = useRegistrationStore();
  
  const anonymousSessionEstablished = useRegistrationStore(selectAnonymousSessionEstablished);
  
  // Get lodge registration data if applicable from unified store
  const { lodgeCustomer, lodgeDetails } = useRegistrationStore();

  // State for ticket data
  const [ticketTypes, setTicketTypes] = useState<FunctionTicketDefinition[]>([]);
  const [ticketPackages, setTicketPackages] = useState<FunctionPackage[]>([]);
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
  
  // Track if we've set the business name for lodge
  const hasSetBusinessName = useRef(false);

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
        
        const targetFunctionId = functionId || storeFunctionId;
        
        if (!targetFunctionId) {
          console.warn('💳 No functionId available, skipping ticket fetch');
          setTicketsError('Function ID not available');
          return;
        }
        
        console.log("💳 Fetching tickets for function:", targetFunctionId);
        console.log("💳 Props functionId:", functionId);
        console.log("💳 Store functionId:", storeFunctionId);
        
        const service = getFunctionTicketsService();
        const { tickets, packages } = await service.getFunctionTicketsAndPackages(targetFunctionId);
        
        console.log("💳 Loaded tickets:", tickets.length);
        console.log("💳 Loaded packages:", packages.length);
        setTicketTypes(tickets);
        setTicketPackages(packages);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        setTicketsError(error instanceof Error ? error.message : 'Failed to load ticket information');
      } finally {
        setIsLoadingTickets(false);
      }
    }
    
    fetchTicketsAndPackages();
  }, [functionId, storeFunctionId]);

  // Business name is now set in form initialization for lodge registrations

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

  // Function to expand packages into individual tickets for registration with price resolution
  const expandPackagesForRegistration = (
    tickets: Array<any>,
    ticketTypes: FunctionTicketDefinition[],
    ticketPackages: FunctionPackage[]
  ) => {
    // Convert to format expected by price resolver
    const eventTicketRecords: EventTicketRecord[] = ticketTypes.map(ticket => ({
      id: ticket.id,
      name: ticket.name,
      price: ticket.price,
      description: ticket.description,
      event_id: ticket.event_id || '',
      function_id: ticket.function_id || functionId || storeFunctionId || ''
    }));

    const packageRecords: PackageRecord[] = ticketPackages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      description: pkg.description,
      includes: pkg.includes || []
    }));

    // Use the enhanced package expansion with pricing
    const expandedTicketsWithPricing = expandPackagesWithPricing(
      tickets,
      eventTicketRecords,
      packageRecords
    );

    // Convert to format expected by registration API
    const expandedTickets = expandedTicketsWithPricing.map(ticket => ({
      id: ticket.id,
      attendeeId: ticket.attendeeId,
      function_id: functionId || storeFunctionId,
      eventTicketId: ticket.eventTicketId,
      ticketTypeId: ticket.eventTicketId,
      name: ticket.name,
      price: ticket.price, // ✅ Now guaranteed to be from database
      isFromPackage: ticket.isFromPackage,
      packageId: ticket.packageId,
      packageName: ticket.packageName,
      isPackage: ticket.isPackage
    }));
    
    console.log("📦 Expanded tickets for registration with database pricing:", {
      original: tickets.length,
      expanded: expandedTickets.length,
      totalValue: expandedTickets.reduce((sum, t) => sum + t.price, 0),
      details: expandedTickets.map(t => ({ name: t.name, price: t.price, fromPackage: t.isFromPackage }))
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
    console.log("2️⃣ Attendee selections from store:", attendeeSelections);
    console.log("3️⃣ Ticket types loaded:", {
      count: ticketTypes.length,
      types: ticketTypes.map(t => ({ id: t.id, name: t.name, price: t.price }))
    });
    console.log("4️⃣ Ticket packages loaded:", {
      count: ticketPackages.length,
      packages: ticketPackages.map(p => ({ id: p.id, name: p.name, price: p.price }))
    });
    
    // Check each attendee's selection using enhanced structure
    allStoreAttendees.forEach(attendee => {
      const selection = attendeeSelections?.[attendee.attendeeId];
      console.log(`5️⃣ Attendee ${attendee.firstName} ${attendee.lastName} (${attendee.attendeeId}):`, {
        hasSelection: !!selection,
        packageCount: selection?.packages.length || 0,
        ticketCount: selection?.individualTickets.length || 0,
        subtotal: selection?.attendeeSubtotal || 0,
        calculatedTickets: selection ? (
          selection.packages.length > 0
            ? `Packages: ${selection.packages.map(p => p.package.name).join(', ')}`
            : selection.individualTickets.length > 0
            ? `Individual tickets: ${selection.individualTickets.map(t => t.ticket.name).join(', ')}`
            : 'NO TICKETS'
        ) : 'NO SELECTION'
      });
    });
  };

  // Calculate enhanced ticket summary data using new metadata
  const enhancedSummaryData = useMemo(() => {
    return getEnhancedTicketSummaryData({
      attendeeSelections,
      orderSummary,
      lodgeBulkSelection,
      attendees: allStoreAttendees
    });
  }, [attendeeSelections, orderSummary, lodgeBulkSelection, allStoreAttendees]);

  // Calculate tickets for summary with price resolution (legacy - still needed for API submission)
  const currentTicketsForSummary = useMemo(() => {
    if (isLoadingTickets) {
      console.log("🎫 Skipping ticket calculation - still loading");
      return [];
    }
    
    // Additional checks to ensure data is loaded using enhanced structures
    const attendeeSummaries = Object.values(attendeeSelections || {});
    const hasPackageSelections = attendeeSummaries.some(summary => summary.packages.length > 0);
    const hasTicketSelections = attendeeSummaries.some(summary => summary.individualTickets.length > 0);
    
    if (hasPackageSelections && ticketPackages.length === 0) {
      console.warn("🎫 WARNING: Have package selections but ticketPackages not loaded yet");
      return [];
    }
    
    if (hasTicketSelections && ticketTypes.length === 0) {
      console.warn("🎫 WARNING: Have ticket selections but ticketTypes not loaded yet");
      return [];
    }
    
    // Check if attendee selections exist - might indicate store not hydrated yet
    const hasSelections = attendeeSummaries.length > 0;
    if (!hasSelections && allStoreAttendees.length > 0) {
      console.warn("🎫 WARNING: No selections found but attendees exist - store might not be hydrated");
    }
    
    console.log("🎫 Calculating tickets for summary with price resolution:", {
      attendeeCount: allStoreAttendees.length,
      attendeeIds: allStoreAttendees.map(a => a.attendeeId),
      attendeeSelectionsCount: attendeeSummaries.length,
      hasSelections,
      hasPackageSelections,
      hasTicketSelections,
      ticketTypesCount: ticketTypes.length,
      ticketPackagesCount: ticketPackages.length,
      ticketPrices: ticketTypes.map(t => ({ id: t.id, name: t.name, price: t.price })),
      packagePrices: ticketPackages.map(p => ({ id: p.id, name: p.name, price: p.price }))
    });
    
    // Build tickets using enhanced attendee selections
    const ticketsFromStore = allStoreAttendees.flatMap(attendee => {
      const attendeeId = attendee.attendeeId;
      const selection = attendeeSelections?.[attendeeId];
      
      console.log(`🎫 Processing attendee ${attendeeId}:`, {
        hasSelection: !!selection,
        packageCount: selection?.packages.length || 0,
        ticketCount: selection?.individualTickets.length || 0,
        subtotal: selection?.attendeeSubtotal || 0
      });
      
      if (!selection) {
        console.warn(`🎫 NO SELECTION FOUND for attendee ${attendeeId}`);
        return [];
      }
      
      let tickets: Array<{ id: string; name: string; price: number; attendeeId: string; isPackage?: boolean; eventTicketId?: string }> = [];

      // Add packages
      selection.packages.forEach(packageSelection => {
        const pkg = packageSelection.package;
        tickets.push({ 
          id: packageSelection.packageRecordId,
          name: pkg.name, 
          price: packageSelection.subtotal,
          attendeeId, 
          isPackage: true
        });
        console.log(`🎫 ✅ Added package: ${pkg.name} - $${packageSelection.subtotal}`);
      });

      // Add individual tickets
      selection.individualTickets.forEach(ticketSelection => {
        const ticket = ticketSelection.ticket;
        tickets.push({
          id: ticketSelection.ticketRecordId,
          name: ticket.name,
          price: ticketSelection.subtotal,
          attendeeId,
          isPackage: false,
          eventTicketId: ticket.ticketId
        });
        console.log(`🎫 ✅ Added individual ticket: ${ticket.name} - $${ticketSelection.subtotal}`);
      });
      
      return tickets;
    });

    // Convert ticket types and packages to format expected by price resolver
    const eventTicketRecords: EventTicketRecord[] = ticketTypes.map(ticket => ({
      id: ticket.id,
      name: ticket.name,
      price: ticket.price,
      description: ticket.description,
      event_id: ticket.event_id || '',
      function_id: ticket.function_id || functionId || storeFunctionId || ''
    }));

    const packageRecords: PackageRecord[] = ticketPackages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      description: pkg.description,
      includes: pkg.includes || []
    }));

    // Use the new price resolver to ensure correct pricing from database
    const resolvedTickets = resolveTicketPrices(
      ticketsFromStore,
      eventTicketRecords,
      packageRecords
    );

    // Validate that all tickets have non-zero prices
    const priceValidation = validateTicketPricing(resolvedTickets);
    if (!priceValidation.isValid) {
      console.error('🎯 Price validation failed:', priceValidation.zerotickets);
    }

    console.log('🎯 Final ticket summary with resolved prices:', {
      originalTickets: ticketsFromStore.length,
      resolvedTickets: resolvedTickets.length,
      totalValue: priceValidation.totalValue,
      allPricesValid: priceValidation.isValid
    });

    // Convert back to expected format for summary display
    return resolvedTickets.map(ticket => ({
      id: ticket.id,
      name: ticket.name,
      price: ticket.price, // Now guaranteed to be from database
      attendeeId: ticket.attendeeId,
      isPackage: ticket.isPackage,
      description: ticket.description
    }));
  }, [allStoreAttendees, attendeeSelections, ticketTypes, ticketPackages, isLoadingTickets, functionId, storeFunctionId]);

  // Use enhanced orderSummary subtotal directly
  const subtotal = useMemo(() => {
    if (orderSummary && orderSummary.subtotal > 0) {
      console.log("💰 Using enhanced orderSummary subtotal:", orderSummary.subtotal);
      return orderSummary.subtotal;
    }
    
    // Enhanced system should always provide subtotal - if missing, it's an error
    console.error("⚠️ Enhanced orderSummary subtotal missing or zero:", {
      orderSummary,
      attendeeCount: allStoreAttendees.length,
      hasOrderSummary: !!orderSummary
    });
    
    return 0;
  }, [orderSummary, allStoreAttendees.length]);

  // We'll calculate fees after form is defined - no default, will be set based on form value or geolocation
  const [billingCountry, setBillingCountry] = useState<{ isoCode: string; name: string } | null>(null);

  // Setup form
  const form = useForm<FormBillingDetailsSchema>({
    resolver: zodResolver(billingDetailsSchema),
    defaultValues: {
      billToPrimary: registrationType === 'lodge' ? true : false,
      // For lodge registrations, use lodge customer data
      firstName: registrationType === 'lodge' ? lodgeCustomer.firstName : '',
      lastName: registrationType === 'lodge' ? lodgeCustomer.lastName : '',
      emailAddress: registrationType === 'lodge' ? lodgeCustomer.email : '',
      mobileNumber: registrationType === 'lodge' ? lodgeCustomer.mobile : '',
      // Address fields can be pre-filled from stored data or lodge customer
      addressLine1: registrationType === 'lodge' ? lodgeCustomer.addressLine1 : (storeBillingDetails?.addressLine1 || ''),
      businessName: registrationType === 'lodge' ? (lodgeDetails.lodgeName || storeBillingDetails?.businessName || '') : (storeBillingDetails?.businessName || ''),
      suburb: registrationType === 'lodge' ? lodgeCustomer.city : (storeBillingDetails?.city || ''),
      postcode: registrationType === 'lodge' ? lodgeCustomer.postcode : (storeBillingDetails?.postalCode || ''),
      stateTerritory: registrationType === 'lodge' && lodgeCustomer.state ? { name: lodgeCustomer.state } : (storeBillingDetails?.stateProvince ? { name: storeBillingDetails.stateProvince } : null),
      country: registrationType === 'lodge' && lodgeCustomer.country ? { isoCode: 'AU', name: lodgeCustomer.country } : undefined,
    }
  });

  // Initialize billing country from form if it exists
  useEffect(() => {
    const currentCountry = form.getValues('country');
    if (currentCountry && !billingCountry) {
      setBillingCountry(currentCountry);
    }
  }, [form, billingCountry]);

  // Watch form changes to update store and billing country
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Only update store when values actually change (not on first render)
      if (type === 'change') {
        // Map form schema to store billing details format
        const billingDataForStore = {
          title: value.title || '',
          firstName: value.firstName || '',
          lastName: value.lastName || '',
          email: value.emailAddress || '',
          phone: value.mobileNumber || '',
          addressLine1: value.addressLine1 || '',
          addressLine2: value.addressLine2 || '',
          city: value.suburb || '',
          stateProvince: value.stateTerritory?.name || '',
          postalCode: value.postcode || '',
          country: value.country?.isoCode || '',
          businessName: value.businessName || '',
          businessNumber: value.businessNumber || '',
        };
        
        updateStoreBillingDetails(billingDataForStore);
      }
      
      // Update billing country for fee calculation
      if (value.country) {
        setBillingCountry(value.country);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, updateStoreBillingDetails]);

  // Calculate fees based on billing country
  const feeCalculation = useMemo(() => {
    const isDomestic = isDomesticCard(billingCountry?.isoCode);
    
    return calculateSquareFees(subtotal, {
      userCountry: billingCountry?.isoCode,
      isDomestic
    });
  }, [subtotal, billingCountry]);

  // Total amount including fees
  const totalAmount = feeCalculation.customerPayment;

  // Handle payment method creation from CheckoutForm
  const handlePaymentMethodCreated = async (paymentToken: string, squareBillingDetails: SquareBillingDetails) => {
    console.log("💳 STEP 3: Square payment token created, processing payment:", paymentToken);
    
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
      // Initialize supabase client and get session ONCE for consistency
      const supabaseClient = getBrowserClient();
      const sessionResult = await supabaseClient.auth.getSession();
      const session = sessionResult.data.session;
      const user = session?.user || null;
      
      console.log('🔐 Session consistency check:', {
        hasSession: !!session,
        hasUser: !!user,
        userId: user?.id,
        sessionId: session?.access_token?.substring(0, 20) + '...'
      });
      
      // Step 1: Save registration if not already saved
      let registrationId = currentRegistrationId;
      
      console.log("🔍 Registration creation decision:", {
        currentRegistrationId: currentRegistrationId,
        hasOnSaveData: !!props.onSaveData,
        willSkipCreation: !!registrationId
      });
      
      // CRITICAL: Verify that the existing registration actually has valid data
      if (registrationId) {
        console.log("🔍 Verifying existing registration:", registrationId);
        try {
          const verifyResponse = await fetch(`/api/registrations/individuals?registrationId=${registrationId}`, {
            headers: session?.access_token ? {
              'Authorization': `Bearer ${session.access_token}`
            } : {}
          });
          
          if (verifyResponse.ok) {
            const verifyResult = await verifyResponse.json();
            console.log("✅ Registration verification successful:", {
              subtotal: verifyResult.registration?.subtotal,
              attendeeCount: verifyResult.registration?.attendee_count,
              hasValidData: !!(verifyResult.registration?.subtotal > 0)
            });
            
            // If registration has no subtotal, force recreation
            if (!verifyResult.registration?.subtotal || verifyResult.registration.subtotal === 0) {
              console.warn("⚠️ Existing registration has invalid subtotal, forcing recreation");
              registrationId = null; // Force recreation
            }
          } else {
            console.warn("⚠️ Registration verification failed, forcing recreation");
            registrationId = null; // Force recreation
          }
        } catch (error) {
          console.warn("⚠️ Registration verification error, forcing recreation:", error);
          registrationId = null; // Force recreation
        }
      }
      
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
          // Use the session we already retrieved for consistency
          console.log('📝 Using consistent session for registration creation');

          const billingData = form.getValues();
          // Expand packages into individual tickets for registration
          const expandedTickets = expandPackagesForRegistration(
            currentTicketsForSummary,
            ticketTypes,
            ticketPackages
          );
          
          // Transform attendees data for the new API - PRESERVE ALL FIELDS for raw_registrations
          const transformedAttendees = [primaryAttendee, ...otherAttendees].map(attendee => ({
            // Core Identity Fields
            attendeeId: attendee.attendeeId,
            id: attendee.id,
            firstName: attendee.firstName,
            lastName: attendee.lastName,
            attendeeType: attendee.attendeeType,
            type: attendee.type,
            title: attendee.title,
            masonicTitle: attendee.masonicTitle,
            suffix: attendee.suffix,
            
            // Contact Information
            mobile: attendee.mobile,
            email: attendee.email,
            primaryPhone: attendee.primaryPhone,
            primaryEmail: attendee.primaryEmail,
            contactPreference: attendee.contactPreference,
            contactConfirmed: attendee.contactConfirmed,
            
            // Personal Details
            dietaryRequirements: attendee.dietaryRequirements,
            specialNeeds: attendee.specialNeeds,
            
            // Relationship Fields
            hasPartner: attendee.hasPartner,
            partner: attendee.partner,
            isPartner: attendee.isPartner,
            guestOfId: attendee.guestOfId,
            isPrimary: attendee.isPrimary,
            relationship: attendee.relationship,
            partnerOf: attendee.partnerOf,
            parentId: attendee.parentId,
            
            // Mason-specific Fields
            grand_lodge_id: attendee.grand_lodge_id,
            grandLodgeOrganisationId: attendee.grandLodgeOrganisationId,
            lodge_id: attendee.lodge_id,
            lodgeOrganisationId: attendee.lodgeOrganisationId,
            lodgeNameNumber: attendee.lodgeNameNumber,
            rank: attendee.rank,
            postNominals: attendee.postNominals,
            grandOfficerStatus: attendee.grandOfficerStatus,
            presentGrandOfficerRole: attendee.presentGrandOfficerRole,
            otherGrandOfficerRole: attendee.otherGrandOfficerRole,
            grandOfficerDetails: attendee.grandOfficerDetails,
            useSameLodge: attendee.useSameLodge,
            
            // Administrative Fields
            orderId: attendee.orderId,
            eventId: attendee.eventId,
            firstTime: attendee.firstTime,
            tableAssignment: attendee.tableAssignment,
            notes: attendee.notes,
            paymentStatus: attendee.paymentStatus,
            isCheckedIn: attendee.isCheckedIn,
            
            // Derived/Backend Fields
            grandLodgeName: attendee.grandLodgeName,
            lodgeName: attendee.lodgeName,
            createdAt: attendee.createdAt,
            updatedAt: attendee.updatedAt,
            
            // Backward compatibility - keep old field names for API compatibility
            phone: attendee.primaryPhone,
            isGrandOfficer: attendee.grandOfficerStatus === 'Present' || attendee.grandOfficerStatus === 'Past',
            grandOfficerRole: attendee.presentGrandOfficerRole || attendee.otherGrandOfficerRole
          }));

          // Transform ticket selections for the new API
          const selectedTickets = expandedTickets.map(ticket => ({
            attendeeId: ticket.attendeeId,
            packageId: ticket.isFromPackage ? ticket.packageId : null,
            eventTicketId: ticket.isFromPackage ? null : ticket.eventTicketId,
            quantity: 1
          }));

          // Transform booking contact for the new API
          const bookingContact = {
            title: billingData.title,
            firstName: billingData.firstName,
            lastName: billingData.lastName,
            suffix: billingData.suffix,
            email: billingData.emailAddress,
            mobile: billingData.mobileNumber,
            phone: billingData.phoneNumber,
            addressLine1: billingData.addressLine1,
            addressLine2: billingData.addressLine2,
            suburb: billingData.suburb,
            stateTerritory: billingData.stateTerritory,
            postcode: billingData.postcode,
            country: billingData.country,
            businessName: billingData.businessName,
            dietaryRequirements: primaryAttendee?.dietaryRequirements,
            additionalInfo: primaryAttendee?.specialNeeds
          };

          // Prepare data for the new individuals registration API with complete Zustand store state
          console.group("🚀 REGISTRATION DATA DEBUGGING");
          console.log("💰 Frontend calculated values:", {
            subtotal,
            totalAmount,
            squareFee: feeCalculation.squareFee,
            expandedTicketsCount: expandedTickets.length,
            attendeesCount: transformedAttendees.length,
            currentTicketsForSummaryCount: currentTicketsForSummary.length
          });
          console.log("🎫 Expanded tickets for registration:", expandedTickets.map(t => ({
            name: t.name,
            price: t.price,
            attendeeId: t.attendeeId,
            eventTicketId: t.eventTicketId,
            isFromPackage: t.isFromPackage
          })));
          console.log("👥 Transformed attendees:", transformedAttendees.map(a => ({
            firstName: a.firstName,
            lastName: a.lastName,
            isPrimary: a.isPrimary,
            attendeeId: a.attendeeId
          })));
          
          const registrationData = {
            functionId: functionId || storeFunctionId,
            eventId: undefined, // Will be determined from tickets
            customerId: user?.id || 'anonymous', // Use 'anonymous' placeholder for anonymous users
            primaryAttendee: transformedAttendees.find(a => a.isPrimary),
            additionalAttendees: transformedAttendees.filter(a => !a.isPrimary),
            tickets: expandedTickets.map(ticket => ({
              attendeeId: ticket.attendeeId,
              ticketTypeId: ticket.eventTicketId,
              eventId: ticket.eventId,
              price: ticket.price, // ✅ Now using resolved database pricing
              isFromPackage: ticket.isFromPackage || false,
              packageId: ticket.packageId || undefined
            })),
            billingDetails: {
              firstName: billingData.firstName,
              lastName: billingData.lastName,
              emailAddress: billingData.emailAddress,
              mobileNumber: billingData.mobileNumber,
              businessName: billingData.businessName,
              addressLine1: billingData.addressLine1,
              addressLine2: billingData.addressLine2,
              suburb: billingData.suburb,
              stateTerritory: billingData.stateTerritory,
              postcode: billingData.postcode,
              country: billingData.country,
              title: billingData.title
            },
            billToPrimaryAttendee: form.getValues('billToPrimaryAttendee') || false,
            totalAmount,
            subtotal,
            squareFee: feeCalculation.squareFee,
            agreeToTerms: true,
            registrationId: currentRegistrationId, // For draft recovery
            
            // ====== COMPLETE ZUSTAND STORE STATE CAPTURE ======
            completeZustandStoreState: {
              // Get complete store state including resolved pricing
              ...useRegistrationStore.getState(),
              // Override pricing data with resolved prices from database
              resolvedTicketPricing: {
                originalTickets: currentTicketsForSummary,
                databaseResolvedPrices: expandedTickets.map(t => ({
                  ticketId: t.eventTicketId,
                  resolvedPrice: t.price,
                  source: 'event_tickets_table'
                })),
                pricingValidation: validateTicketPricing(expandedTickets.map(t => ({
                  id: t.id,
                  name: t.name,
                  price: t.price,
                  attendeeId: t.attendeeId,
                  eventTicketId: t.eventTicketId,
                  isPackage: t.isPackage
                })))
              },
              // Capture timestamp for audit
              captureTimestamp: new Date().toISOString(),
              captureLocation: 'payment_step_registration_submission'
            },
            
            // Calculated pricing with resolved ticket prices
            calculatedPricing: {
              totalAmount,
              subtotal,
              squareFee: feeCalculation.squareFee,
              resolvedFromDatabase: true,
              priceResolutionTimestamp: new Date().toISOString()
            }
          };

          console.log("📤 Final registration data being sent to API:", {
            subtotal: registrationData.subtotal,
            totalAmount: registrationData.totalAmount,
            ticketsCount: registrationData.tickets.length,
            attendeesCount: (registrationData.primaryAttendee ? 1 : 0) + registrationData.additionalAttendees.length,
            functionId: registrationData.functionId,
            customerId: registrationData.customerId
          });
          console.groupEnd();
          
          // Prepare headers - use the consistent session we retrieved earlier
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
          
          console.log("📡 Sending registration API call...");
          const response = await fetch('/api/registrations/individuals', {
            method: 'POST',
            headers,
            body: JSON.stringify(registrationData)
          });

          const result = await response.json();
          
          console.group("📥 Registration API Response");
          console.log("Response status:", response.status);
          console.log("Response data:", result);
          console.groupEnd();
          
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

      // Step 2: Process payment using unified payment service - use same consistent session
      console.log('💳 Using consistent session for payment creation');
      const paymentHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (session?.access_token) {
        paymentHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/registrations/individuals/payment', {
        method: 'POST',
        headers: paymentHeaders,
        body: JSON.stringify({
          registrationId,
          paymentMethodId: paymentToken, // ✅ Pass the Square payment token
          billingDetails: squareBillingDetails,
          amount: totalAmount * 100, // Convert to cents (includes fees)
          subtotal: subtotal * 100, // Convert to cents (before fees)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process payment");
      }

      console.log("✅ Square payment created:", result);
      
      // Square handles payment authentication automatically during tokenization
      // No additional confirmation step needed like Stripe's 3D Secure
      
      // Update final step
      setProcessingSteps(prev => {
        const newSteps = [...prev];
        newSteps[1] = { ...newSteps[1], status: 'complete' };
        newSteps[2] = { ...newSteps[2], status: 'current' };
        return newSteps;
      });
      
      // Wait for confirmation number using polling endpoint
      console.log("⏳ Polling for confirmation number...");
      
      // Poll the confirmation endpoint - use same consistent session
      console.log('🔍 Using consistent session for confirmation polling');
      const confirmationHeaders: Record<string, string> = {};
      
      if (session?.access_token) {
        confirmationHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const confirmationResponse = await fetch(`/api/registrations/${registrationId}/confirmation`, {
        method: 'GET',
        headers: confirmationHeaders
      });
      
      const confirmationResult = await confirmationResponse.json();
      
      if (!confirmationResponse.ok) {
        throw new Error(confirmationResult.error || "Failed to retrieve confirmation number");
      }
      
      if (confirmationResult.confirmationNumber) {
        console.log("✅ Confirmation number received:", confirmationResult.confirmationNumber);
        console.log("📋 Registration type:", confirmationResult.registrationType);
        if (confirmationResult.isTemporary) {
          console.log("⚠️ Using temporary confirmation number");
        }
        
        // Update final step
        setProcessingSteps(prev => {
          const newSteps = [...prev];
          newSteps[2] = { ...newSteps[2], status: 'complete' };
          return newSteps;
        });
        
        // Set confirmation number in store
        setStoreConfirmationNumber(confirmationResult.confirmationNumber);
        
        // Determine the registration type for routing
        const confirmationType = confirmationResult.registrationType || registrationType || 'individuals';
        
        // Get complete function data for confirmation page
        let completeFunctionData = {
          id: functionId || storeFunctionId,
          name: '',
          startDate: '',
          endDate: '',
          location: {
            place_name: '',
            street_address: '',
            suburb: '',
            state: '',
            postal_code: ''
          }
        };

        // Fetch function details if we have functionData available
        if (functionData) {
          completeFunctionData = {
            id: functionData.id,
            name: functionData.name || 'Event Registration',
            startDate: functionData.startDate || '',
            endDate: functionData.endDate || '',
            location: functionData.location || completeFunctionData.location
          };
        }

        // Save registration data to localStorage for confirmation page
        const confirmationData = {
          registrationId,
          confirmationNumber: confirmationResult.confirmationNumber,
          registrationType: confirmationType,
          functionData: completeFunctionData,
          billingDetails: form.getValues(),
          attendees: allStoreAttendees,
          tickets: currentTicketsForSummary.map(ticket => ({
            ...ticket,
            // Add field name mappings for confirmation page compatibility
            ticketName: ticket.name,
            ticket_name: ticket.name,
            ticketPrice: ticket.price,
            ticket_price: ticket.price,
            attendeeId: ticket.attendeeId
          })),
          totalAmount,
          subtotal,
          squareFee: feeCalculation.squareFee
        };
        
        // Store with confirmation number as key
        localStorage.setItem(`registration_${confirmationResult.confirmationNumber}`, JSON.stringify(confirmationData));
        // Also store as recent registration
        localStorage.setItem('recent_registration', JSON.stringify(confirmationData));
        
        console.log("💾 Saved registration data to localStorage:", confirmationData);
        
        // Update registration status to completed after successful payment
        console.log("🔄 Updating registration status to completed...");
        const updateHeaders: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (session?.access_token) {
          updateHeaders['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        try {
          const updateResponse = await fetch(`/api/registrations/${registrationId}`, {
            method: 'PATCH',
            headers: updateHeaders,
            body: JSON.stringify({
              status: 'completed',
              payment_status: 'completed',
              square_payment_id: result.paymentIntentId,
              total_amount_paid: result.totalAmount,
              square_fee: result.processingFees
            })
          });
          
          if (updateResponse.ok) {
            console.log("✅ Registration status updated to completed");
          } else {
            console.warn("⚠️ Failed to update registration status, but proceeding with confirmation");
          }
        } catch (updateError) {
          console.warn("⚠️ Error updating registration status:", updateError);
        }
        
        // Get the function slug from the current URL or props
        const pathSegments = window.location.pathname.split('/');
        const functionSlugIndex = pathSegments.indexOf('functions') + 1;
        const functionSlug = pathSegments[functionSlugIndex] || '';
        
        // Navigate to type-specific confirmation page
        setTimeout(() => {
          router.push(`/functions/${functionSlug}/register/confirmation/${confirmationType}/${confirmationResult.confirmationNumber}`);
        }, 1500);
      } else {
        throw new Error("No confirmation number received");
      }
      
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
            {/* Left Column - Billing Details and Payment (60%) */}
            <div className="flex-1 space-y-6 md:flex-none md:w-[60%]">
              <BillingDetailsForm 
                form={form} 
                primaryAttendee={primaryAttendee ? {
                  firstName: primaryAttendee.firstName || undefined,
                  lastName: primaryAttendee.lastName || undefined,
                  primaryPhone: primaryAttendee.primaryPhone || undefined,
                  primaryEmail: primaryAttendee.primaryEmail || undefined,
                  grand_lodge_id: primaryAttendee.grand_lodge_id || undefined,
                  attendeeType: primaryAttendee.attendeeType || undefined
                } : null}
                footerContent={
                  <div className="space-y-6 w-full">
                    {/* Payment Form Header */}
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <CreditCard className="w-5 h-5" />
                      Credit Card Details
                    </div>

                    {/* Unified Payment Form */}
                    <UnifiedPaymentForm
                      totalAmount={totalAmount}
                      subtotal={subtotal}
                      billingDetails={form.getValues()}
                      registrationType="individuals"
                      registrationData={{ attendees: allStoreAttendees, selectedTickets: currentTicketsForSummary }}
                      onPaymentSuccess={handlePaymentMethodCreated}
                      onPaymentError={setPaymentError}
                      isProcessing={isProcessingPayment}
                      functionId={props.functionId || ''}
                      minimal={true}
                    />
                  </div>
                }
              />
            </div>
            
            {/* Right Column - Order Summary (40%) */}
            <div className="flex-1 space-y-6 md:flex-none md:w-[40%]">
              {/* Order Summary */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Receipt className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                
                {/* Use enhanced summary data if available, otherwise fall back to basic display */}
                {enhancedSummaryData.sections.length > 0 ? (
                  <div className="space-y-4">
                    {/* Render enhanced summary sections */}
                    <SummaryRenderer 
                      sections={enhancedSummaryData.sections.filter(section => 
                        // Filter out the order summary section as we'll show it separately
                        section.title !== 'Order Summary'
                      )}
                      className="text-sm"
                    />
                    
                    {/* Add processing fee to the total display */}
                    <div className="pt-2 space-y-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                      </div>
                      
                      {/* Processing Fee */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          {getProcessingFeeLabel(isDomesticCard(billingCountry?.isoCode))}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">{getFeeDisclaimer()}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <span className="font-medium text-gray-900">${feeCalculation.processingFeesDisplay.toFixed(2)}</span>
                      </div>
                      
                      {/* Total */}
                      <div className="border-t-2 border-gray-200 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">Total Amount:</span>
                          <span className="text-xl font-bold text-masonic-navy">${totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Fallback to basic display */
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
                    
                    {/* Subtotal and fees */}
                    <div className="pt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                      </div>
                      
                      {/* Processing Fee */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          {getProcessingFeeLabel(isDomesticCard(billingCountry?.isoCode))}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">{getFeeDisclaimer()}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <span className="font-medium text-gray-900">${feeCalculation.processingFeesDisplay.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Total */}
                    <div className="border-t-2 border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total Amount:</span>
                        <span className="text-xl font-bold text-masonic-navy">${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                </CardContent>
              </Card>
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