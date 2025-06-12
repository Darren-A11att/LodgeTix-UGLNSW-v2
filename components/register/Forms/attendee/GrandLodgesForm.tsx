import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, ShoppingCart, Users, Package, Check, Building, Plus, X, UserPlus, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import formSaveManager from '@/lib/formSaveManager';
import { useAttendeeDataWithDebounce } from './lib/useAttendeeData';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronRight } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm, CheckoutFormHandle } from '../../RegistrationWizard/payment/CheckoutForm';
import { StripeBillingDetailsForClient } from '../../RegistrationWizard/payment/types';
import { useRouter } from 'next/navigation';
import { getFunctionTicketsService, FunctionTicketDefinition, FunctionPackage } from '@/lib/services/function-tickets-service';
import { calculateStripeFees, getFeeModeFromEnv, getProcessingFeeLabel } from '@/lib/utils/stripe-fee-calculator';

// Import form components
import { BasicInfo } from '../basic-details/BasicInfo';
import { ContactInfo } from '../basic-details/ContactInfo';
import { GrandOfficerFields } from '../mason/utils/GrandOfficerFields';
import { GrandOfficerDropdown } from '../shared/GrandOfficerDropdown';
import { MASON_TITLES, MASON_RANKS, GRAND_OFFICER_ROLES, GUEST_TITLES, PARTNER_RELATIONSHIPS } from '../attendee/utils/constants';
import { GrandLodgeSelection } from '../mason/lib/GrandLodgeSelection';
import AutocompleteInput from '../shared/AutocompleteInput';

// Import our new extracted components
import {
  BookingContactSection,
  AttendeeCounter,
  LodgeSelectionCard,
} from './components';
import { AttendeeData } from './types';
import { generateUUID } from '@/lib/uuid-slug-utils';

// Constants for form behavior
const DEBOUNCE_DELAY = 300; // Changed from 500ms to consistent 300ms

// Event and ticket IDs for Grand Proclamation 2025
const EVENT_IDS = {
  GRAND_PROCLAMATION: '307c2d85-72d5-48cf-ac94-082ca2a5d23d',
  GALA_DINNER: '03a51924-1606-47c9-838d-9dc32657cd59',
  CEREMONY: '6c12952b-7cf3-4d6a-81bd-1ac3b7ff7076'
};

// Table package configuration (10 tickets per table)
const TABLE_SIZE = 10;

// Get Stripe publishable key
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
const stripePromise = loadStripe(stripePublishableKey);
const TABLE_PRICE = 1950; // $195 per ticket x 10 = $1950 per table

interface GrandLodgesFormProps {
  functionId: string;
  minTables?: number;
  maxTables?: number;
  onComplete?: () => void;
  onValidationError?: (errors: string[]) => void;
  className?: string;
  fieldErrors?: Record<string, Record<string, string>>;
}

interface TableOrder {
  tableCount: number;
  totalTickets: number;
  totalPrice: number;
}

interface DelegationMember {
  id: string;
  type: 'Mason' | 'Guest' | 'Partner';
  title: string;
  firstName: string;
  lastName: string;
  grandRank?: string;
  isGrandOfficer?: boolean;
  grandOffice?: string;
  relationship?: string;
  partnerOf?: string;
  isEditing?: boolean;
}

export interface GrandLodgesFormHandle {
  submit: () => void;
}

export const GrandLodgesForm = React.forwardRef<GrandLodgesFormHandle, GrandLodgesFormProps>(({
  functionId,
  minTables = 1,
  maxTables = 10,
  onComplete,
  onValidationError,
  className,
  fieldErrors,
}, ref) => {
  const router = useRouter();
  const checkoutFormRef = useRef<CheckoutFormHandle>(null);
  
  const { 
    attendees, 
    addMasonAttendee,
    addGuestAttendee,
    addPartnerAttendee,
    updateAttendee,
    setLodgeTicketOrder,
  } = useRegistrationStore();
  
  
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<string>('');
  const [primaryAttendeeId, setPrimaryAttendeeId] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState(1);
  const [ticketCount, setTicketCount] = useState(1);
  const [tableOrder, setTableOrder] = useState<TableOrder>({
    tableCount: 1,
    totalTickets: TABLE_SIZE,
    totalPrice: TABLE_PRICE
  });
  const [activeTab, setActiveTab] = useState<'purchaseOnly' | 'registerDelegation'>('purchaseOnly');
  const [delegationMembers, setDelegationMembers] = useState<DelegationMember[]>([]);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<DelegationMember | null>(null);
  const [delegationOrder, setDelegationOrder] = useState(1);
  const [delegationTypeTab, setDelegationTypeTab] = useState<'grandLodge' | 'masonicOrder'>('grandLodge');
  
  // Payment state for ticket purchase
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Dynamic data state
  const [functionPackages, setFunctionPackages] = useState<FunctionPackage[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // One-time initialization - move useRef before other hooks to maintain order
  const isInitializedRef = React.useRef(false);
  
  // Get update functions for primary attendee - hooks must always be called
  const attendeeDataResult = useAttendeeDataWithDebounce(primaryAttendeeId || '', DEBOUNCE_DELAY);
  const updateField = primaryAttendeeId ? attendeeDataResult.updateField : () => {};
  const updateFieldImmediate = primaryAttendeeId ? attendeeDataResult.updateFieldImmediate : () => {};
  
  // Get the primary attendee
  const primaryAttendee = attendees.find(a => a.attendeeId === primaryAttendeeId);

  // Update table order when count changes
  useEffect(() => {
    setTableOrder({
      tableCount,
      totalTickets: tableCount * TABLE_SIZE,
      totalPrice: tableCount * TABLE_PRICE
    });
  }, [tableCount]);
  
  // Fetch function packages on mount
  useEffect(() => {
    const fetchFunctionData = async () => {
      if (!functionId) {
        console.error('[GrandLodgesForm] No function ID provided');
        setDataError('Function ID is required');
        return;
      }
      
      try {
        setIsLoadingData(true);
        console.log('[GrandLodgesForm] Fetching packages for function:', functionId);
        const ticketsService = getFunctionTicketsService();
        const { packages } = await ticketsService.getFunctionTicketsAndPackages(functionId);
        
        // Filter for packages with "delegations" registration type
        const delegationPackages = packages.filter(pkg => 
          pkg.eligibleRegistrationTypes.includes('delegations')
        );
        
        console.log('[GrandLodgesForm] Fetched delegation packages:', delegationPackages);
        setFunctionPackages(delegationPackages);
      } catch (error) {
        console.error('Failed to fetch function data:', error);
        setDataError('Failed to load ticket information');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchFunctionData();
  }, [functionId]);

  // Get the first available delegation package
  const selectedPackage = functionPackages[0];
  const ticketPrice = selectedPackage?.price || 195; // Fallback price

  // Initialize Grand Lodge from primary attendee when loaded
  useEffect(() => {
    if (primaryAttendee && !selectedGrandLodge && primaryAttendee.grand_lodge_id) {
      // Initialize Grand Lodge
      setSelectedGrandLodge(String(primaryAttendee.grand_lodge_id));
    }
  }, [primaryAttendee, selectedGrandLodge]);
  
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      if (!primaryAttendeeId) {
        const primaryId = addMasonAttendee();
        updateAttendee(primaryId, {
          isPrimary: true,
          attendeeType: 'Mason',
          rank: 'GL', // Default to Grand Lodge rank
          grandOfficerStatus: 'Present', // Default to Present Grand Officer
        });
        setPrimaryAttendeeId(primaryId);
      }
    }
  }, [primaryAttendeeId, addMasonAttendee, updateAttendee]);

  // Update table count (for register delegation)
  const handleTableCountChange = useCallback((newCount: number) => {
    if (newCount >= minTables && newCount <= maxTables) {
      setTableCount(newCount);
      // Store the table order in the registration store
      if (setLodgeTicketOrder) {
        setLodgeTicketOrder({
          tableCount: newCount,
          totalTickets: newCount * TABLE_SIZE,
          galaDinnerTickets: newCount * TABLE_SIZE,
          ceremonyTickets: newCount * TABLE_SIZE,
          eventId: EVENT_IDS.GRAND_PROCLAMATION,
          galaDinnerEventId: EVENT_IDS.GALA_DINNER,
          ceremonyEventId: EVENT_IDS.CEREMONY,
        });
      }
    }
  }, [minTables, maxTables, setLodgeTicketOrder]);

  // Update ticket count (for purchase only)
  const handleTicketCountChange = useCallback((newCount: number) => {
    if (newCount >= 1 && newCount <= 100) {
      setTicketCount(newCount);
      // Store the ticket order
      if (setLodgeTicketOrder) {
        setLodgeTicketOrder({
          tableCount: 0, // No tables, just tickets
          totalTickets: newCount,
          galaDinnerTickets: newCount,
          ceremonyTickets: newCount,
          eventId: EVENT_IDS.GRAND_PROCLAMATION,
          galaDinnerEventId: EVENT_IDS.GALA_DINNER,
          ceremonyEventId: EVENT_IDS.CEREMONY,
        });
      }
    }
  }, [setLodgeTicketOrder]);

  // Update Grand Lodge for primary attendee - No Lodge selection needed for Grand Lodges
  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    if (selectedGrandLodge !== grandLodgeId) {
      setSelectedGrandLodge(grandLodgeId);
      
      if (primaryAttendeeId) {
        updateFieldImmediate('grand_lodge_id', grandLodgeId ? Number(grandLodgeId) : 0);
      }
    }
  }, [primaryAttendeeId, updateFieldImmediate, selectedGrandLodge]);

  // Add delegation member functions
  const addDelegationMember = useCallback((type: 'Mason' | 'Guest' | 'Partner', partnerOfId?: string) => {
    const newMember: DelegationMember = {
      id: generateUUID(),
      type,
      title: type === 'Mason' ? 'Bro' : type === 'Guest' ? 'Mr' : 'Mrs',
      firstName: '',
      lastName: '',
      grandRank: type === 'Mason' ? '' : undefined,
      isGrandOfficer: false,
      grandOffice: '',
      relationship: type === 'Partner' ? 'Wife' : undefined,
      partnerOf: partnerOfId,
      isEditing: true
    };
    setDelegationMembers([...delegationMembers, newMember]);
    setEditingMember(newMember);
  }, [delegationMembers]);

  const updateDelegationMember = useCallback((memberId: string, updates: Partial<DelegationMember>) => {
    setDelegationMembers(delegationMembers.map(member => 
      member.id === memberId ? { ...member, ...updates } : member
    ));
  }, [delegationMembers]);

  const removeDelegationMember = useCallback((memberId: string) => {
    setDelegationMembers(delegationMembers.filter(member => member.id !== memberId));
  }, [delegationMembers]);

  // Get available grand offices for autocomplete
  const grandOfficeOptions = GRAND_OFFICER_ROLES.map(role => ({
    value: role,
    label: role
  }));

  // Field change handler for BookingContactSection
  // Use primaryAttendeeId instead of primaryAttendee to reduce dependency changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    if (primaryAttendeeId) {
      updateField(field, value);
    }
  }, [updateField, primaryAttendeeId]);

  const handleFieldChangeImmediate = useCallback((field: string, value: any) => {
    if (primaryAttendeeId) {
      updateFieldImmediate(field, value);
    }
  }, [updateFieldImmediate, primaryAttendeeId]);

  // Get validation errors based on current tab
  const getValidationErrors = useCallback(() => {
    const errors: string[] = [];
    
    // Validate based on delegation type tab
    if (delegationTypeTab === 'grandLodge') {
      if (!selectedGrandLodge) {
        errors.push('Grand Lodge selection is required');
      }
    } else if (delegationTypeTab === 'masonicOrder') {
      if (!primaryAttendee?.organisationName) {
        errors.push('Masonic Order formal name is required');
      }
      if (!primaryAttendee?.organisationAbbreviation) {
        errors.push('Masonic Order abbreviation is required');
      }
      if (!primaryAttendee?.organisationKnownAs) {
        errors.push('Masonic Order known as name is required');
      }
    }
    
    // For Purchase Tickets Only tab, only validate booking contact fields
    if (activeTab === 'purchaseOnly') {
      // Validate only the booking contact required fields
      if (!primaryAttendee?.firstName) {
        errors.push('Booking Contact: First name is required');
      }
      if (!primaryAttendee?.lastName) {
        errors.push('Booking Contact: Last name is required');
      }
      if (!primaryAttendee?.primaryEmail) {
        errors.push('Booking Contact: Email is required');
      }
      if (!primaryAttendee?.primaryPhone) {
        errors.push('Booking Contact: Phone number is required');
      }
    } else {
      // For Register Delegation tab, validate all primary attendee fields
      if (!primaryAttendee?.title) {
        errors.push('Booking Contact: Title is required');
      }
      if (!primaryAttendee?.firstName) {
        errors.push('Booking Contact: First name is required');
      }
      if (!primaryAttendee?.lastName) {
        errors.push('Booking Contact: Last name is required');
      }
      if (!primaryAttendee?.rank) {
        errors.push('Booking Contact: Rank is required');
      }
      if (!primaryAttendee?.primaryEmail) {
        errors.push('Booking Contact: Email is required');
      }
      if (!primaryAttendee?.primaryPhone) {
        errors.push('Booking Contact: Phone number is required');
      }
      
      // For Grand Officer fields (when rank is GL)
      if (primaryAttendee?.rank === 'GL' && primaryAttendee?.grandOfficerStatus === 'Present' && !primaryAttendee?.presentGrandOfficerRole) {
        errors.push('Booking Contact: Grand Officer role is required');
      }
    }
    
    return errors;
  }, [activeTab, delegationTypeTab, primaryAttendee, selectedGrandLodge]);

  // Validate and complete
  const handleComplete = useCallback(() => {
    console.log('[GrandLodgesForm] handleComplete called');
    console.log('[GrandLodgesForm] activeTab:', activeTab);
    console.log('[GrandLodgesForm] primaryAttendee:', primaryAttendee);
    
    formSaveManager.saveBeforeNavigation().then(() => {
      const errors = getValidationErrors();
      console.log('[GrandLodgesForm] Validation errors:', errors);
      
      // Check if there are validation errors
      if (errors.length > 0) {
        // Pass errors to parent through callback
        if (onValidationError) {
          console.log('[GrandLodgesForm] Calling onValidationError with errors');
          onValidationError(errors);
        }
        return;
      }
      
      if (activeTab === 'purchaseOnly') {
        // For purchase only, validate ticket count
        if (ticketCount < 1) {
          if (onValidationError) {
            onValidationError(['Please select at least 1 ticket']);
          }
          return;
        }
        
        // Store ticket order
        if (setLodgeTicketOrder) {
          setLodgeTicketOrder({
            tableCount: 0,
            totalTickets: ticketCount,
            galaDinnerTickets: ticketCount,
            ceremonyTickets: ticketCount,
            eventId: EVENT_IDS.GRAND_PROCLAMATION,
            galaDinnerEventId: EVENT_IDS.GALA_DINNER,
            ceremonyEventId: EVENT_IDS.CEREMONY,
          });
        }
        
        // Skip directly to payment step (step 5)
        // Skip ticket selection (step 3) and order review (step 4)
        console.log('[GrandLodgesForm] Purchase only validation passed, jumping to payment step');
        useRegistrationStore.getState().setCurrentStep(5); // Step 5 is payment
        
        // Since we manually set the step, we should not call onComplete
        // as it would increment the step again
        return;
      } else {
        // For register delegation, validate delegation members
        if (delegationMembers.length === 0) {
          if (onValidationError) {
            onValidationError(['Please add at least one delegation member']);
          }
          return;
        }
        
        // Validate all members have required fields
        const invalidMembers = delegationMembers.filter(member => 
          !member.firstName || !member.lastName || !member.title
        );
        
        if (invalidMembers.length > 0) {
          if (onValidationError) {
            const memberErrors: string[] = [];
            delegationMembers.forEach((member, index) => {
              if (!member.firstName) {
                memberErrors.push(`Delegation Member ${index + 1}: First name is required`);
              }
              if (!member.lastName) {
                memberErrors.push(`Delegation Member ${index + 1}: Last name is required`);
              }
              if (!member.title) {
                memberErrors.push(`Delegation Member ${index + 1}: Title is required`);
              }
            });
            onValidationError(memberErrors);
          }
          return;
        }
        
        // Convert delegation members to attendees
        delegationMembers.forEach((member, index) => {
          if (member.type === 'Mason') {
            const attendeeId = addMasonAttendee();
            updateAttendee(attendeeId, {
              title: member.title,
              firstName: member.firstName,
              lastName: member.lastName,
              suffix: member.grandRank,
              rank: 'GL',
              grandOfficerStatus: 'Present',
              presentGrandOfficerRole: member.grandOffice,
              grand_lodge_id: Number(selectedGrandLodge),
              contactPreference: 'primaryattendee',
              isPrimary: index === 0 && !primaryAttendeeId
            });
          } else if (member.type === 'Guest') {
            const attendeeId = addGuestAttendee();
            updateAttendee(attendeeId, {
              title: member.title,
              firstName: member.firstName,
              lastName: member.lastName,
              contactPreference: 'PrimaryAttendee'
            });
          } else if (member.type === 'Partner' && member.partnerOf) {
            const attendeeId = addPartnerAttendee(member.partnerOf);
            if (attendeeId) {
              updateAttendee(attendeeId, {
                title: member.title,
                firstName: member.firstName,
                lastName: member.lastName,
                relationship: member.relationship || 'Wife',
                contactPreference: 'primaryattendee'
              });
            }
          }
        });
        
        if (onComplete) {
          onComplete();
        }
      }
    });
  }, [selectedGrandLodge, primaryAttendee, activeTab, ticketCount, delegationMembers, onComplete, onValidationError, setLodgeTicketOrder, addMasonAttendee, addGuestAttendee, addPartnerAttendee, updateAttendee, primaryAttendeeId, delegationTypeTab, getValidationErrors]);

  // Payment handlers for ticket-only purchase
  const handlePaymentSuccess = useCallback(async (paymentMethodId: string, billingDetails: StripeBillingDetailsForClient) => {
    console.log('[GrandLodgesForm] Payment success, processing ticket purchase');
    
    try {
      // Calculate fees
      const subtotal = ticketCount * ticketPrice;
      const feeCalculation = calculateStripeFees(subtotal, { isDomesticCard: true });
      const totalAmount = feeCalculation.customerPayment;
      
      // Create payment intent and process registration
      const response = await fetch(`/api/functions/${functionId}/tickets/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketCount,
          bookingContact: {
            firstName: primaryAttendee?.firstName,
            lastName: primaryAttendee?.lastName,
            email: primaryAttendee?.primaryEmail,
            phone: primaryAttendee?.primaryPhone,
          },
          grandLodgeId: selectedGrandLodge,
          delegationType: delegationTypeTab,
          paymentMethodId,
          amount: totalAmount * 100, // Convert to cents
          subtotal: subtotal * 100,
          stripeFee: feeCalculation.stripeFee * 100,
          billingDetails,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process payment');
      }

      if (result.success && result.confirmationNumber) {
        // Redirect to confirmation page
        console.log('[GrandLodgesForm] Payment successful, redirecting to confirmation');
        router.push(`/functions/${functionId}/register/confirmation/tickets/${result.confirmationNumber}`);
      } else {
        throw new Error('Payment failed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Failed to complete payment');
      setIsProcessingPayment(false);
    }
  }, [ticketCount, ticketPrice, primaryAttendee, selectedGrandLodge, delegationTypeTab, functionId, router]);

  const handlePaymentError = useCallback((error: string) => {
    console.error('Payment error:', error);
    setPaymentError(error);
    setIsProcessingPayment(false);
  }, []);

  const handlePurchaseTickets = useCallback(async () => {
    // Validate form
    const errors = getValidationErrors();
    if (errors.length > 0) {
      if (onValidationError) {
        onValidationError(errors);
      }
      return;
    }

    if (ticketCount < 1) {
      setPaymentError('Please select at least 1 ticket');
      return;
    }

    // Clear any previous errors
    setPaymentError(null);
    setIsProcessingPayment(true);

    // Trigger payment method creation in CheckoutForm
    if (checkoutFormRef.current) {
      const result = await checkoutFormRef.current.createPaymentMethod();
      if (result.error) {
        setPaymentError(result.error);
        setIsProcessingPayment(false);
      }
      // Success is handled by onPaymentSuccess callback
    } else {
      setPaymentError('Payment form not ready');
      setIsProcessingPayment(false);
    }
  }, [getValidationErrors, ticketCount, onValidationError]);

  // Get billing details for Stripe
  const getBillingDetails = useCallback((): StripeBillingDetailsForClient => {
    return {
      name: `${primaryAttendee?.firstName || ''} ${primaryAttendee?.lastName || ''}`,
      email: primaryAttendee?.primaryEmail || '',
      phone: primaryAttendee?.primaryPhone || '',
      address: {
        line1: primaryAttendee?.addressLine1 || '',
        city: primaryAttendee?.suburb || '',
        state: primaryAttendee?.stateTerritory?.name || '',
        postal_code: primaryAttendee?.postcode || '',
        country: primaryAttendee?.country?.isoCode || 'AU',
      }
    };
  }, [primaryAttendee]);

  // Expose submit method to parent
  React.useImperativeHandle(ref, () => ({
    submit: handleComplete
  }), [handleComplete]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Grand Lodge/Masonic Order Selection with integrated Booking Contact */}
      <div className="relative">
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Building className="w-5 h-5" />
              {delegationTypeTab === 'grandLodge' ? 'Grand Lodge Details' : 'Masonic Order Details'}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              These details will be applied to all members in this registration
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={delegationTypeTab} onValueChange={(value) => setDelegationTypeTab(value as 'grandLodge' | 'masonicOrder')}>
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                <TabsTrigger value="grandLodge">Grand Lodge</TabsTrigger>
                <TabsTrigger value="masonicOrder">Masonic Order</TabsTrigger>
              </TabsList>
              
              <TabsContent value="grandLodge" className="p-6 space-y-6 mt-0">
                {/* Grand Lodge Selection Field - No Lodge selection needed for Grand Lodges */}
                <div className="space-y-2">
                  <GrandLodgeSelection 
                    value={selectedGrandLodge}
                    onChange={handleGrandLodgeChange}
                  />
                  {!selectedGrandLodge && (
                    <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                      </svg>
                      Required to proceed
                    </p>
                  )}
                </div>
                
                {/* Booking Contact Details */}
                {primaryAttendee && (
                  <BookingContactSection
                    mode="attendee"
                    attendee={primaryAttendee}
                    onFieldChange={handleFieldChange}
                    onFieldChangeImmediate={handleFieldChangeImmediate}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="masonicOrder" className="p-6 space-y-6 mt-0">
                {/* Masonic Order Fields */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Formal Name - Long width (spans 6 columns) */}
                  <div className="md:col-span-6 space-y-2">
                    <Label htmlFor="formal-name">Formal Name</Label>
                    <Input
                      id="formal-name"
                      type="text"
                      value={primaryAttendee?.organisationName || ''}
                      onChange={(e) => handleFieldChange('organisationName', e.target.value)}
                      placeholder="Enter formal name of Masonic Order"
                      className="w-full"
                    />
                  </div>
                  
                  {/* Abbreviation - Short width (spans 2 columns) */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="abbreviation">Abbreviation</Label>
                    <Input
                      id="abbreviation"
                      type="text"
                      value={primaryAttendee?.organisationAbbreviation || ''}
                      onChange={(e) => handleFieldChange('organisationAbbreviation', e.target.value)}
                      placeholder="e.g. SRIA"
                      className="w-full"
                    />
                  </div>
                  
                  {/* Known As - Medium width (spans 4 columns) */}
                  <div className="md:col-span-4 space-y-2">
                    <Label htmlFor="known-as">Known As</Label>
                    <Input
                      id="known-as"
                      type="text"
                      value={primaryAttendee?.organisationKnownAs || ''}
                      onChange={(e) => handleFieldChange('organisationKnownAs', e.target.value)}
                      placeholder="Common or shortened name"
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Validation message if any field is empty */}
                {(!primaryAttendee?.organisationName || !primaryAttendee?.organisationAbbreviation || !primaryAttendee?.organisationKnownAs) && (
                  <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    All Masonic Order fields are required to proceed
                  </p>
                )}
                
                {/* Booking Contact Details */}
                {primaryAttendee && (
                  <BookingContactSection
                    mode="attendee"
                    attendee={primaryAttendee}
                    onFieldChange={handleFieldChange}
                    onFieldChangeImmediate={handleFieldChangeImmediate}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Registration Type Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'purchaseOnly' | 'registerDelegation')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchaseOnly">Purchase Tickets Only</TabsTrigger>
          <TabsTrigger value="registerDelegation">Register Delegation</TabsTrigger>
        </TabsList>

        {/* Purchase Tickets Only Tab */}
        <TabsContent value="purchaseOnly" className="mt-6">
          <Card className={cn(
            "border-2 border-primary/20 transition-opacity duration-300",
            !selectedGrandLodge && "opacity-70"
          )}>
            <CardHeader className="py-4 px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-primary font-medium text-lg">
                  <ShoppingCart className="w-5 h-5" />
                  Ticket Purchase
                </CardTitle>
                <Badge className="bg-blue-100 text-blue-800 border-0">
                  Grand Proclamation 2025
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 mr-2" />
                  <span>Loading ticket information...</span>
                </div>
              ) : dataError ? (
                <Alert variant="destructive">
                  <AlertDescription>{dataError}</AlertDescription>
                </Alert>
              ) : !selectedPackage ? (
                <Alert variant="destructive">
                  <AlertDescription>No delegation packages available for this function.</AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-2 gap-8">
                  {/* Column 1: Package Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg mb-4">{selectedPackage.name || 'Delegation Package'}</h3>
                    
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-5 h-5 text-primary" />
                            <h4 className="font-medium">{selectedPackage.display_name || 'Individual Ticket'}</h4>
                          </div>
                          {selectedPackage.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {selectedPackage.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            Quantity: {selectedPackage.qty} tickets per package
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">${ticketPrice}</p>
                          <p className="text-sm text-gray-500">per ticket</p>
                        </div>
                      </div>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm">
                        Purchase tickets now and provide attendee details later.
                        This option will skip directly to payment.
                      </AlertDescription>
                    </Alert>
                  </div>

                {/* Column 2: Ticket Count and Summary */}
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="ticket-count" className="text-base font-medium mb-2 block">
                      Number of Tickets
                    </Label>
                    <AttendeeCounter
                      id="ticket-count"
                      label=""
                      value={ticketCount}
                      min={1}
                      max={100}
                      onChange={handleTicketCountChange}
                      disabled={!selectedGrandLodge}
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}
                    </p>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <h4 className="font-medium text-lg">Order Summary</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tickets</span>
                        <span className="font-medium">{ticketCount} × ${ticketPrice}</span>
                      </div>
                      
                      {getFeeModeFromEnv() === 'pass_to_customer' && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">${(ticketCount * ticketPrice).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Processing Fee</span>
                            <span className="font-medium">
                              ${calculateStripeFees(ticketCount * ticketPrice, { isDomesticCard: true }).processingFeesDisplay.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Amount</span>
                        <span className="text-2xl font-bold text-primary">
                          ${calculateStripeFees(ticketCount * ticketPrice, { isDomesticCard: true }).customerPayment.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Payment Section - Only show in Purchase Tickets mode */}
              {activeTab === 'purchaseOnly' && selectedPackage && (
                <div className="mt-6 border-t pt-6">
                  <div className="mb-4">
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Information
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Complete your purchase by entering your payment details below
                    </p>
                  </div>

                  {/* Security Note */}
                  <Alert className="border-blue-200 bg-blue-50 mb-4">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      Your payment information is securely processed by Stripe. We never store your card details.
                    </AlertDescription>
                  </Alert>

                  {/* Error display */}
                  {paymentError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{paymentError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Stripe Elements */}
                  <Elements stripe={stripePromise}>
                    <CheckoutForm
                      ref={checkoutFormRef}
                      totalAmount={calculateStripeFees(ticketCount * ticketPrice, { isDomesticCard: true }).customerPayment}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      setIsProcessingPayment={setIsProcessingPayment}
                      billingDetails={getBillingDetails()}
                      isProcessing={isProcessingPayment}
                    />
                  </Elements>

                  {/* Purchase Button */}
                  <div className="mt-6">
                    <Button
                      onClick={handlePurchaseTickets}
                      disabled={!selectedGrandLodge || ticketCount < 1 || isProcessingPayment}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Complete Purchase
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Register Delegation Tab */}
        <TabsContent value="registerDelegation" className="mt-6">
          <Card className={cn(
            "border-2 border-primary/20",
            !selectedGrandLodge && "opacity-70"
          )}>
            <CardHeader className="py-4 px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-primary font-medium text-lg">
                  <Users className="w-5 h-5" />
                  Delegation Members
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="delegation-order">Delegation Order:</Label>
                    <Input
                      id="delegation-order"
                      type="number"
                      value={delegationOrder}
                      onChange={(e) => setDelegationOrder(Number(e.target.value))}
                      className="w-20"
                      min={1}
                      max={999}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addDelegationMember('Mason')}
                      disabled={!selectedGrandLodge}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Mason
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddMemberDialog(true)}
                      disabled={!selectedGrandLodge || delegationMembers.length === 0}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Partner
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addDelegationMember('Guest')}
                      disabled={!selectedGrandLodge}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Guest
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {delegationMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No delegation members added yet.</p>
                  <p className="text-sm mt-2">Click the buttons above to add members.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Office</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delegationMembers.map((member, index) => (
                      <DelegationMemberRow
                        key={member.id}
                        member={member}
                        index={index}
                        onUpdate={updateDelegationMember}
                        onRemove={removeDelegationMember}
                        grandOfficeOptions={grandOfficeOptions}
                        delegationMembers={delegationMembers}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}

              {delegationMembers.length > 0 && (
                <Alert className="mt-6 border-amber-200 bg-amber-50">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-sm">
                    All delegation members will be registered under {selectedGrandLodge ? 'the selected Grand Lodge' : 'your Grand Lodge'}.
                    Contact details will default to the primary attendee.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      

      {/* Add Partner Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Select which delegation member this partner belongs to:</p>
            <Select onValueChange={(memberId) => {
              addDelegationMember('Partner', memberId);
              setShowAddMemberDialog(false);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select delegation member" />
              </SelectTrigger>
              <SelectContent>
                {delegationMembers
                  .filter(m => m.type === 'Mason' || m.type === 'Guest')
                  .map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

// Delegation Member Row Component
const DelegationMemberRow: React.FC<{
  member: DelegationMember;
  index: number;
  onUpdate: (id: string, updates: Partial<DelegationMember>) => void;
  onRemove: (id: string) => void;
  grandOfficeOptions: { value: string; label: string }[];
  delegationMembers: DelegationMember[];
}> = ({ member, index, onUpdate, onRemove, grandOfficeOptions, delegationMembers }) => {
  const [isEditing, setIsEditing] = useState(member.isEditing || false);

  const handleSave = () => {
    if (member.firstName && member.lastName && member.title) {
      onUpdate(member.id, { isEditing: false });
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>{index + 1}</TableCell>
        <TableCell>{member.type}</TableCell>
        <TableCell>
          <Select
            value={member.title}
            onValueChange={(value) => onUpdate(member.id, { title: value })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {member.type === 'Mason' ? 
                MASON_TITLES.map(title => (
                  <SelectItem key={title} value={title}>{title}</SelectItem>
                )) :
                GUEST_TITLES.map(title => (
                  <SelectItem key={title} value={title}>{title}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Input
            value={member.firstName}
            onChange={(e) => onUpdate(member.id, { firstName: e.target.value })}
            placeholder="First name"
            className="w-32"
          />
        </TableCell>
        <TableCell>
          <Input
            value={member.lastName}
            onChange={(e) => onUpdate(member.id, { lastName: e.target.value })}
            placeholder="Last name"
            className="w-32"
          />
        </TableCell>
        <TableCell>
          {member.type === 'Mason' ? (
            <Input
              value={member.grandRank || ''}
              onChange={(e) => onUpdate(member.id, { grandRank: e.target.value })}
              placeholder="Rank"
              className="w-24"
            />
          ) : '-'}
        </TableCell>
        <TableCell>
          {member.type === 'Mason' ? (
            <Input
              value={member.grandOffice || ''}
              onChange={(e) => onUpdate(member.id, { grandOffice: e.target.value })}
              placeholder="Office"
              className="w-40"
            />
          ) : '-'}
        </TableCell>
        <TableCell>
          {member.type === 'Partner' ? (
            <Select
              value={member.relationship || ''}
              onValueChange={(value) => onUpdate(member.id, { relationship: value })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_RELATIONSHIPS.map(rel => (
                  <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : member.type === 'Guest' ? (
            <Input
              value={member.relationship || ''}
              onChange={(e) => onUpdate(member.id, { relationship: e.target.value })}
              placeholder="e.g., Friend"
              className="w-28"
            />
          ) : '-'}
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onRemove(member.id)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  // View mode
  const partnerOfMember = member.partnerOf ? 
    delegationMembers.find(m => m.id === member.partnerOf) : null;

  return (
    <TableRow>
      <TableCell>{index + 1}</TableCell>
      <TableCell>{member.type}</TableCell>
      <TableCell>{member.title}</TableCell>
      <TableCell>{member.firstName}</TableCell>
      <TableCell>{member.lastName}</TableCell>
      <TableCell>{member.type === 'Mason' ? member.grandRank : '-'}</TableCell>
      <TableCell>{member.type === 'Mason' ? member.grandOffice : '-'}</TableCell>
      <TableCell>
        {member.type === 'Partner' && partnerOfMember ? 
          `${member.relationship} of ${partnerOfMember.firstName} ${partnerOfMember.lastName}` :
          member.relationship || '-'
        }
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onRemove(member.id)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Summary view for Grand Lodge orders
export const GrandLodgeFormSummary: React.FC = () => {
  const { attendees, lodgeTicketOrder } = useRegistrationStore();
  
  const primaryAttendee = attendees.find(a => a.isPrimary);
  const grandLodgeName = primaryAttendee?.grand_lodge_id ? 'Grand Lodge' : 'Grand Lodge';

  if (!lodgeTicketOrder) {
    return null;
  }

  const isPurchaseOnly = lodgeTicketOrder.tableCount === 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {isPurchaseOnly ? 'Grand Lodge Ticket Purchase' : 'Grand Lodge Delegation'} Summary
      </h3>
      
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div>
              <p className="font-medium text-lg">{grandLodgeName}</p>
              <p className="text-sm text-gray-600">
                Contact: {primaryAttendee?.title} {primaryAttendee?.firstName} {primaryAttendee?.lastName}
              </p>
            </div>
            
            <div className="border-t pt-3 space-y-2">
              {isPurchaseOnly ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tickets Purchased</span>
                    <span className="font-medium">{lodgeTicketOrder.totalTickets}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">• Gala Dinner</span>
                    <span>{lodgeTicketOrder.galaDinnerTickets} tickets</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">• Ceremony</span>
                    <span>{lodgeTicketOrder.ceremonyTickets} tickets</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Delegation Members</span>
                    <span className="font-medium">{attendees.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">• Masons</span>
                    <span>{attendees.filter(a => a.attendeeType === 'Mason').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">• Guests</span>
                    <span>{attendees.filter(a => a.attendeeType === 'Guest').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">• Partners</span>
                    <span>{attendees.filter(a => a.isPartner).length}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-bold text-primary">
                  ${(lodgeTicketOrder.totalTickets * 195).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 text-sm">
          {isPurchaseOnly ? 
            'Attendee details can be allocated to these tickets at any time before the event.' :
            'All delegation members have been registered with their details.'
          }
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Export an alias for backward compatibility
// Removed duplicate export - LodgeFormSummary is exported from LodgesForm.tsx

// Memoized booking contact details to prevent re-renders
const BookingContactDetails = React.memo(({ 
  primaryAttendee, 
  handleFieldChange, 
  handleFieldChangeImmediate 
}: {
  primaryAttendee: any;
  handleFieldChange: (field: string, value: any) => void;
  handleFieldChangeImmediate: (field: string, value: any) => void;
}) => {
  return (
    <div className="space-y-4 border-t pt-6">
      <h3 className="text-base font-medium">Booking Contact</h3>
      
      {/* Name and Title Row - following MasonForm layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Masonic Title - 2 columns */}
        <div className="col-span-2">
          <Label>Title *</Label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={primaryAttendee.title || ''}
            onChange={(e) => handleFieldChangeImmediate('title', e.target.value)}
          >
            <option value="">Select</option>
            {MASON_TITLES.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>
        
        {/* First Name - 4 columns */}
        <div className="col-span-4">
          <Label>First Name *</Label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2"
            value={primaryAttendee.firstName || ''}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            required
          />
        </div>
        
        {/* Last Name - 4 columns */}
        <div className="col-span-4">
          <Label>Last Name *</Label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2"
            value={primaryAttendee.lastName || ''}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            required
          />
        </div>
        
        {/* Rank - 2 columns */}
        <div className="col-span-2">
          <Label>Rank *</Label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={primaryAttendee.rank || ''}
            onChange={(e) => handleFieldChangeImmediate('rank', e.target.value)}
          >
            <option value="">Select</option>
            {MASON_RANKS.map(rank => (
              <option key={rank.value} value={rank.value}>{rank.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Grand Officer Fields - show if rank is GL */}
      {primaryAttendee.rank === 'GL' && (
        <GrandOfficerFields
          data={primaryAttendee}
          onChange={handleFieldChangeImmediate}
          required={true}
        />
      )}
      
      {/* Contact Information */}
      <ContactInfo
        data={primaryAttendee}
        isPrimary={true}
        onChange={handleFieldChange}
      />
    </div>
  );
});

BookingContactDetails.displayName = 'BookingContactDetails';