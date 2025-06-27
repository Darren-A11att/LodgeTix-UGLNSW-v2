import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, Users, Check, Building, Plus, X, UserPlus, ChevronUp, ChevronDown } from 'lucide-react';
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
import { ChevronRight, CreditCard, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { getFunctionTicketsService, FunctionTicketDefinition, FunctionPackage } from '@/lib/services/function-tickets-service';
import { useFeeCalculation } from '@/hooks/use-fee-calculation';
import { UnifiedPaymentForm } from '../../RegistrationWizard/payment/UnifiedPaymentForm';
import { PaymentProcessing } from '../../RegistrationWizard/payment/PaymentProcessing';
import { useRouter } from 'next/navigation';
import { useCompletedRegistrationsStore } from '@/lib/completedRegistrationsStore';
import { getProcessingFeeLabel } from '@/lib/utils/square-fee-calculator-client';

// Import form components
import { BasicInfo } from '../basic-details/BasicInfo';
import { ContactInfo } from '../basic-details/ContactInfo';
import { GrandOfficerFields } from '../mason/utils/GrandOfficerFields';
import { GrandOfficerDropdown } from '../shared/GrandOfficerDropdown';
import { MASON_TITLES, MASON_RANKS, GRAND_OFFICER_ROLES, GUEST_TITLES, PARTNER_RELATIONSHIPS } from '../attendee/utils/constants';
import { GrandLodgeSelection } from '../mason/lib/GrandLodgeSelection';
import AutocompleteInput from '../shared/AutocompleteInput';
import { TextField } from '../shared/FieldComponents';
import { useLocationStore } from '@/lib/locationStore';

// Import our new extracted components
import {
  BookingContactSection,
  AttendeeCounter,
  LodgeSelectionCard,
  PackageOrderCard,
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

// Square payment processing is handled by the useSquareWebPayments hook
const TABLE_PRICE = 1950; // $195 per ticket x 10 = $1950 per table

interface GrandLodgesFormProps {
  functionId: string;
  functionSlug?: string;
  minTables?: number;
  maxTables?: number;
  onComplete?: () => void;
  onValidationError?: (errors: string[]) => void;
  className?: string;
  fieldErrors?: Record<string, Record<string, string>>;
  onTabChange?: (tab: 'purchaseOnly' | 'registerDelegation') => void;
}

interface TableOrder {
  tableCount: number;
  totalTickets: number;
  totalPrice: number;
}

interface PackageOrder {
  packageCount: number;
  totalTickets: number;
  totalPrice: number;
  stripeFee: number;
  processingFeesDisplay: number;
  totalWithFees: number;
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
  functionSlug,
  minTables = 1,
  maxTables = 10,
  onComplete,
  onValidationError,
  className,
  fieldErrors,
  onTabChange,
}, ref) => {
  const router = useRouter();
  
  const { 
    attendees, 
    addMasonAttendee,
    addGuestAttendee,
    addPartnerAttendee,
    updateAttendee,
    removeAttendee,
    setLodgeTicketOrder,
    updateLodgeCustomer,
    updateLodgeDetails,
    setLodgeOrder,
    delegationBookingContact,
    updateDelegationBookingContact,
    addPrimaryAttendee,
    grandLodgeFormActiveTab,
    setGrandLodgeFormActiveTab,
    selectedGrandLodge,
    setSelectedGrandLodge,
    delegationTicketCount,
    setDelegationTicketCount,
    selectedDelegationPackageId,
    setSelectedDelegationPackageId,
    delegationType,
    setDelegationType,
  } = useRegistrationStore();
  
  // Get location store functions to ensure Grand Lodges are loaded
  const { fetchInitialGrandLodges } = useLocationStore();
  
  // Remove local state that should be in store
  // Only keep UI-specific state locally
  const [selectedGrandLodgeOrgId, setSelectedGrandLodgeOrgId] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState(1);
  const [tableOrder, setTableOrder] = useState<TableOrder>({
    tableCount: 1,
    totalTickets: TABLE_SIZE,
    totalPrice: TABLE_PRICE
  });
  
  // Initialize activeTab from persisted state or default
  const [activeTab, setActiveTab] = useState<'purchaseOnly' | 'registerDelegation'>(
    grandLodgeFormActiveTab || 'purchaseOnly'
  );
  
  // UI-only state
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  
  // Use store values
  const ticketCount = delegationTicketCount;
  const setTicketCount = setDelegationTicketCount;
  const selectedPackageId = selectedDelegationPackageId;
  const setSelectedPackageId = setSelectedDelegationPackageId;
  
  // Derive delegationTypeTab from store's delegationType
  const delegationTypeTab = delegationType === 'masonicOrder' ? 'masonicOrder' : 'grandLodge';
  const setDelegationTypeTab = (type: 'grandLodge' | 'masonicOrder') => {
    setDelegationType(type);
  };
  
  // Dynamic data state
  const [functionPackages, setFunctionPackages] = useState<FunctionPackage[]>([]);
  const [functionTickets, setFunctionTickets] = useState<FunctionTicketDefinition[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Payment state (for purchase only mode)
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProcessingSteps, setShowProcessingSteps] = useState(false);
  const [processingSteps, setProcessingSteps] = useState([
    { name: 'Saving registration', description: 'Creating your registration record', status: 'upcoming' as const },
    { name: 'Processing payment', description: 'Securely processing your payment', status: 'upcoming' as const },
    { name: 'Confirming order', description: 'Finalizing your registration', status: 'upcoming' as const },
  ]);
  
  // One-time initialization - move useRef before other hooks to maintain order
  const isInitializedRef = React.useRef(false);
  
  // Ensure Grand Lodges are loaded when component mounts
  useEffect(() => {
    console.log('[GrandLodgesForm] Ensuring Grand Lodges are loaded');
    fetchInitialGrandLodges();
  }, [fetchInitialGrandLodges]);

  // Update table order when count changes
  useEffect(() => {
    setTableOrder({
      tableCount,
      totalTickets: tableCount * TABLE_SIZE,
      totalPrice: tableCount * TABLE_PRICE
    });
  }, [tableCount]);
  
  // Removed production restriction - both tabs are now available in all environments
  
  // Persist tab changes and notify parent
  useEffect(() => {
    setGrandLodgeFormActiveTab(activeTab);
    if (onTabChange) {
      onTabChange(activeTab);
    }
    
    // Clear attendees when switching to purchase-only mode
    if (activeTab === 'purchaseOnly') {
      const { clearAllAttendees } = useRegistrationStore.getState();
      clearAllAttendees();
    }
  }, [activeTab, setGrandLodgeFormActiveTab, onTabChange]);
  
  // Notify parent of initial tab state on mount
  useEffect(() => {
    // If we have a persisted tab, use it
    if (grandLodgeFormActiveTab && grandLodgeFormActiveTab !== activeTab) {
      setActiveTab(grandLodgeFormActiveTab);
    }
  }, []); // Only run on mount
  
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
        const { tickets, packages } = await ticketsService.getFunctionTicketsAndPackages(functionId);
        
        setFunctionTickets(tickets);
        
        // Filter packages based on context
        const filteredPackages = packages.filter(pkg => {
          // For Purchase Tickets Only - check if eligibility criteria contains registration_type = 'delegations'
          if (activeTab === 'purchaseOnly') {
            const rules = pkg.eligibility_criteria?.rules || [];
            return rules.some(rule => 
              rule.type === 'registration_type' && 
              rule.value === 'delegations'
            );
          }
          // For Register Delegation - use existing logic
          return pkg.eligibleRegistrationTypes.includes('delegations');
        });
        
        console.log('[GrandLodgesForm] Fetched filtered packages:', filteredPackages);
        setFunctionPackages(filteredPackages);
        
        // Auto-select first delegation package if available
        if (filteredPackages.length > 0 && !selectedPackageId) {
          setSelectedPackageId(filteredPackages[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch function data:', error);
        setDataError('Failed to load ticket information');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchFunctionData();
  }, [functionId, activeTab]);

  // Get selected package or use first available
  const selectedPackage = selectedPackageId 
    ? functionPackages.find(pkg => pkg.id === selectedPackageId) || functionPackages[0]
    : functionPackages[0];
    
  const baseQuantity = selectedPackage?.qty || 10; // Use package qty as base quantity
  const packagePrice = selectedPackage?.price || 1950; // fallback price
  const isPackagePurchase = selectedPackage?.qty && selectedPackage.qty > 1; // Check if this is a multi-ticket package
  
  const [calculatedPackageOrder, setCalculatedPackageOrder] = useState<PackageOrder>({
    packageCount: 1,
    totalTickets: baseQuantity,
    totalPrice: packagePrice,
    stripeFee: 0,
    processingFeesDisplay: 0,
    totalWithFees: packagePrice
  });
  
  // Calculate subtotal for fee calculation
  const subtotal = ticketCount * packagePrice;
  
  // Use API-based fee calculation (same as LodgesForm)
  const { fees: feeCalculation, isLoading: feeLoading } = useFeeCalculation({
    subtotal,
    isDomestic: true, // Default to domestic for Australian Grand Lodges
    userCountry: 'AU'  // Default country
  });
  
  // Update package order when fee calculation completes
  useEffect(() => {
    setCalculatedPackageOrder({
      packageCount: ticketCount,
      totalTickets: ticketCount * baseQuantity,
      totalPrice: subtotal,
      stripeFee: feeCalculation?.squareFee || 0,
      processingFeesDisplay: feeCalculation?.processingFeesDisplay || 0,
      totalWithFees: feeCalculation?.customerPayment || subtotal
    });
  }, [ticketCount, baseQuantity, packagePrice, feeCalculation, subtotal]);
  
  // Set initial package order in store when component mounts or package data changes (following LodgesForm pattern)
  useEffect(() => {
    if (selectedPackage && functionTickets.length > 0 && activeTab === 'purchaseOnly') {
      setLodgeOrder({
        packageId: selectedPackage.id,
        catalogObjectId: selectedPackage.catalogObjectId,
        packageQuantity: ticketCount,
        itemQuantity: selectedPackage.qty || 10,
        packagePrice: packagePrice,
        packageName: selectedPackage.name,
        totalAttendees: ticketCount * (selectedPackage.qty || 10),
        subtotal: ticketCount * packagePrice
      });
    }
  }, [ticketCount, functionTickets, setLodgeOrder, selectedPackage, packagePrice, activeTab]);

  // Initialize Grand Lodge from booking contact when loaded
  useEffect(() => {
    if (delegationBookingContact && delegationBookingContact.organisationId) {
      // Initialize Grand Lodge if not already set
      const grandLodgeId = String(delegationBookingContact.organisationId);
      if (selectedGrandLodge !== grandLodgeId) {
        setSelectedGrandLodge(grandLodgeId);
        console.log('[GrandLodgesForm] Restored Grand Lodge from booking contact:', grandLodgeId);
      }
    }
  }, [delegationBookingContact?.organisationId, selectedGrandLodge]); // Include selectedGrandLodge to prevent infinite loops
  
  // Restore delegation type from booking contact data
  useEffect(() => {
    if (delegationBookingContact) {
      // If booking contact has Masonic Order fields filled, switch to that tab
      if (delegationBookingContact.organisationName || delegationBookingContact.rank === 'MO') {
        setDelegationTypeTab('masonicOrder');
      } else if (delegationBookingContact.organisationId) {
        setDelegationTypeTab('grandLodge');
      }
    }
  }, []); // Only run on mount

  // Auto-set rank to 'MO' when Masonic Order tab is selected (only if rank is not already set)
  useEffect(() => {
    if (delegationTypeTab === 'masonicOrder' && !delegationBookingContact?.rank) {
      updateDelegationBookingContact({ rank: 'MO' });
    }
  }, [delegationTypeTab, delegationBookingContact?.rank, updateDelegationBookingContact]);
  
  // Initialize booking contact if it doesn't exist
  useEffect(() => {
    if (!isInitializedRef.current && !delegationBookingContact) {
      isInitializedRef.current = true;
      
      // Initialize with default values for Grand Lodge delegation
      updateDelegationBookingContact({
        title: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        rank: 'GL', // Default to Grand Lodge rank
        grandOfficerStatus: 'Present', // Default to Present Grand Officer
      });
    }
  }, [delegationBookingContact, updateDelegationBookingContact]);

  // Auto-add booking contact as first delegation member when switching to register delegation
  useEffect(() => {
    // When switching to register delegation tab and no attendees exist
    if (activeTab === 'registerDelegation' && attendees.length === 0 && delegationBookingContact) {
      // Auto-add the booking contact as the first attendee (Mason)
      const newAttendeeId = addMasonAttendee();
      
      // Update the new attendee with booking contact details
      updateAttendee(newAttendeeId, {
        title: delegationBookingContact.title || 'Bro',
        firstName: delegationBookingContact.firstName || '',
        lastName: delegationBookingContact.lastName || '',
        suffix: delegationBookingContact.grandRank || 'PSGW',
        grandOfficerStatus: (delegationBookingContact.rank === 'GL' || delegationBookingContact.rank === 'MO') ? 'Present' : undefined,
        presentGrandOfficerRole: delegationBookingContact.grandOffice || 'Board of Management',
        primaryEmail: delegationBookingContact.email || '',
        primaryPhone: delegationBookingContact.phone || '',
        rank: delegationBookingContact.rank || 'GL'
      });
    }
  }, [activeTab, attendees.length, delegationBookingContact, addMasonAttendee, updateAttendee]);

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
    if (newCount >= 1 && newCount <= 10) {
      setTicketCount(newCount);
      // Store the package order in the registration store (following LodgesForm pattern)
      if (selectedPackage) {
        setLodgeOrder({
          packageId: selectedPackage.id,
          catalogObjectId: selectedPackage.catalogObjectId,
          packageQuantity: newCount,
          itemQuantity: baseQuantity,
          packagePrice: packagePrice,
          packageName: selectedPackage.name,
          totalAttendees: newCount * baseQuantity,
          subtotal: newCount * packagePrice
        });
      }
    }
  }, [setLodgeOrder, selectedPackage, packagePrice, baseQuantity]);

  // Update Grand Lodge for booking contact - No Lodge selection needed for Grand Lodges
  const handleGrandLodgeChange = useCallback((grandLodgeId: string, organisationId?: string) => {
    console.log('[GrandLodgesForm] Grand Lodge change:', grandLodgeId, organisationId);
    setSelectedGrandLodge(grandLodgeId);
    
    // Store the organisation ID if provided
    if (organisationId) {
      setSelectedGrandLodgeOrgId(organisationId);
    }
    
    // Update the booking contact with the organisation ID
    updateDelegationBookingContact({
      organisationId: organisationId || grandLodgeId
    });
  }, [updateDelegationBookingContact]);

  // Filter attendees to show only those relevant for delegation
  // This replaces the local delegationMembers state
  const delegationMembers = useMemo(() => {
    // Only show attendees when in register delegation mode
    if (activeTab !== 'registerDelegation') {
      return [];
    }
    
    // Convert attendees to DelegationMember format for display
    return attendees.map(attendee => ({
      id: attendee.attendeeId,
      type: attendee.attendeeType === 'mason' ? 'Mason' : 
            attendee.isPartner ? 'Partner' : 'Guest',
      title: attendee.title || '',
      firstName: attendee.firstName || '',
      lastName: attendee.lastName || '',
      grandRank: attendee.suffix || '',
      isGrandOfficer: attendee.grandOfficerStatus === 'Present',
      grandOffice: attendee.presentGrandOfficerRole || '',
      relationship: attendee.relationship,
      partnerOf: attendee.partnerOf || attendee.isPartner || undefined,
      isEditing: false
    } as DelegationMember));
  }, [attendees, activeTab]);

  // Add delegation member functions - now work directly with store
  const addDelegationMember = useCallback((type: 'Mason' | 'Guest' | 'Partner', partnerOfId?: string) => {
    // Check if booking contact fields are filled before allowing new members
    if (!delegationBookingContact?.firstName || !delegationBookingContact?.lastName || !delegationBookingContact?.email || !delegationBookingContact?.phone) {
      if (onValidationError) {
        onValidationError(['Please complete the booking contact details before adding delegation members']);
      }
      return;
    }
    
    // Determine if this is the first member
    const isFirstMember = attendees.length === 0;
    const isFirstMason = type === 'Mason' && attendees.filter(a => a.attendeeType === 'mason').length === 0;
    
    // Add directly to store
    let attendeeId: string;
    if (type === 'Mason') {
      attendeeId = addMasonAttendee();
      updateAttendee(attendeeId, {
        title: isFirstMember && delegationBookingContact?.title ? delegationBookingContact.title : 'Bro',
        firstName: isFirstMember && delegationBookingContact?.firstName ? delegationBookingContact.firstName : '',
        lastName: isFirstMember && delegationBookingContact?.lastName ? delegationBookingContact.lastName : '',
        suffix: isFirstMember && delegationBookingContact?.grandRank ? delegationBookingContact.grandRank : '',
        rank: delegationTypeTab === 'masonicOrder' ? 'MO' : 'GL',
        grandOfficerStatus: isFirstMember && delegationBookingContact?.grandOfficerStatus ? delegationBookingContact.grandOfficerStatus : 'Present',
        presentGrandOfficerRole: isFirstMember && delegationBookingContact?.grandOffice ? delegationBookingContact.grandOffice : '',
        grand_lodge_id: delegationTypeTab === 'grandLodge' ? selectedGrandLodge : null,
        lodge_id: null,
        contactPreference: 'bookingcontact',
        isPrimary: isFirstMason,
        primaryEmail: isFirstMason ? delegationBookingContact?.email : '',
        primaryPhone: isFirstMason ? delegationBookingContact?.phone : ''
      });
    } else if (type === 'Guest') {
      attendeeId = addGuestAttendee();
      updateAttendee(attendeeId, {
        title: 'Mr',
        contactPreference: 'bookingcontact',
        lodge_id: null
      });
    } else if (type === 'Partner' && partnerOfId) {
      const partnerId = addPartnerAttendee(partnerOfId);
      if (partnerId) {
        updateAttendee(partnerId, {
          title: 'Mrs',
          relationship: 'Wife',
          contactPreference: 'bookingcontact',
          lodge_id: null
        });
      }
    }
  }, [attendees, delegationBookingContact, onValidationError, addMasonAttendee, addGuestAttendee, addPartnerAttendee, updateAttendee, delegationTypeTab, selectedGrandLodge]);

  const updateDelegationMember = useCallback((memberId: string, updates: Partial<DelegationMember>) => {
    // Update directly in store
    const attendeeUpdates: any = {};
    
    if ('title' in updates) attendeeUpdates.title = updates.title;
    if ('firstName' in updates) attendeeUpdates.firstName = updates.firstName;
    if ('lastName' in updates) attendeeUpdates.lastName = updates.lastName;
    if ('grandRank' in updates) attendeeUpdates.suffix = updates.grandRank;
    if ('grandOffice' in updates) attendeeUpdates.presentGrandOfficerRole = updates.grandOffice;
    if ('relationship' in updates) attendeeUpdates.relationship = updates.relationship;
    
    updateAttendee(memberId, attendeeUpdates);
  }, [updateAttendee]);

  const removeDelegationMember = useCallback((memberId: string) => {
    // Remove directly from store
    removeAttendee(memberId);
  }, [removeAttendee]);

  // Move delegation member up in the list
  const moveDelegationMemberUp = useCallback((index: number) => {
    if (index > 0 && attendees.length > 1) {
      // We need to swap the order of attendees in the store
      // Since we can't directly reorder, we need to remove and re-add
      // For now, we'll keep this as a limitation - reordering needs store enhancement
      console.warn('Reordering attendees requires store enhancement');
    }
  }, [attendees]);

  // Move delegation member down in the list
  const moveDelegationMemberDown = useCallback((index: number) => {
    if (index < attendees.length - 1 && attendees.length > 1) {
      // We need to swap the order of attendees in the store
      // Since we can't directly reorder, we need to remove and re-add
      // For now, we'll keep this as a limitation - reordering needs store enhancement
      console.warn('Reordering attendees requires store enhancement');
    }
  }, [attendees]);

  // Get available grand offices for autocomplete
  const grandOfficeOptions = GRAND_OFFICER_ROLES.map(role => ({
    value: role,
    label: role
  }));

  // Field change handler for BookingContactSection
  // Update delegation booking contact instead of primary attendee
  const handleFieldChange = useCallback((field: string, value: any) => {
    updateDelegationBookingContact({ [field]: value });
  }, [updateDelegationBookingContact]);

  const handleFieldChangeImmediate = useCallback((field: string, value: any) => {
    updateDelegationBookingContact({ [field]: value });
  }, [updateDelegationBookingContact]);

  // Get validation errors based on current tab
  const getValidationErrors = useCallback(() => {
    const errors: string[] = [];
    
    // For Purchase Tickets Only tab, only validate booking contact fields
    if (activeTab === 'purchaseOnly') {
      // Validate only the booking contact required fields
      if (!delegationBookingContact?.firstName) {
        errors.push('Booking Contact: First name is required');
      }
      if (!delegationBookingContact?.lastName) {
        errors.push('Booking Contact: Last name is required');
      }
      if (!delegationBookingContact?.email) {
        errors.push('Booking Contact: Email is required');
      }
      if (!delegationBookingContact?.phone) {
        errors.push('Booking Contact: Phone number is required');
      }
    } else {
      // For Register Delegation tab, validate delegation type specific fields first
      if (delegationTypeTab === 'grandLodge') {
        if (!selectedGrandLodge) {
          errors.push('Grand Lodge selection is required');
        }
      } else if (delegationTypeTab === 'masonicOrder') {
        if (!delegationBookingContact?.organisationName) {
          errors.push('Masonic Order formal name is required');
        }
        if (!delegationBookingContact?.organisationAbbreviation) {
          errors.push('Masonic Order abbreviation is required');
        }
        if (!delegationBookingContact?.organisationKnownAs) {
          errors.push('Masonic Order known as name is required');
        }
      }
      
      // Then validate all booking contact fields
      if (!delegationBookingContact?.title) {
        errors.push('Booking Contact: Title is required');
      }
      if (!delegationBookingContact?.firstName) {
        errors.push('Booking Contact: First name is required');
      }
      if (!delegationBookingContact?.lastName) {
        errors.push('Booking Contact: Last name is required');
      }
      if (!delegationBookingContact?.rank) {
        errors.push('Booking Contact: Rank is required');
      }
      if (!delegationBookingContact?.email) {
        errors.push('Booking Contact: Email is required');
      }
      if (!delegationBookingContact?.phone) {
        errors.push('Booking Contact: Phone number is required');
      }
      
      // For Grand Officer fields (when rank is GL or MO)
      if ((delegationBookingContact?.rank === 'GL' || delegationBookingContact?.rank === 'MO') && delegationBookingContact?.grandOfficerStatus === 'Present' && !delegationBookingContact?.grandOffice) {
        errors.push('Booking Contact: Grand Officer role is required');
      }
    }
    
    return errors;
  }, [activeTab, delegationTypeTab, delegationBookingContact, selectedGrandLodge]);

  // Validate Grand Lodge Details - all 11 fields must be valid
  const validateGrandLodgeDetails = useCallback((): boolean => {
    if (!delegationBookingContact) return false;
    
    // 1. Grand Lodge
    if (!selectedGrandLodge) return false;
    
    // 2. Masonic Title
    if (!delegationBookingContact.title) return false;
    
    // 3. First Name
    if (!delegationBookingContact.firstName) return false;
    
    // 4. Last Name
    if (!delegationBookingContact.lastName) return false;
    
    // 5. Rank and if GL then Grand Rank
    if (!delegationBookingContact.rank) return false;
    if (delegationBookingContact.rank === 'GL' && !delegationBookingContact.grandRank) return false;
    
    // 6. Grand Officer
    if (!delegationBookingContact.grandOfficerStatus) return false;
    
    // 7. If Grand Officer = Present, then Grand Office
    if (delegationBookingContact.grandOfficerStatus === 'Present' && !delegationBookingContact.grandOffice) return false;
    
    // 8. Grand Office (covered above)
    
    // 9. If Grand Office = Other then Other Grand Office
    if (delegationBookingContact.grandOffice === 'Other' && !delegationBookingContact.otherGrandOffice) return false;
    
    // 10. Email Address
    if (!delegationBookingContact.email) return false;
    
    // 11. Phone Number
    if (!delegationBookingContact.phone) return false;
    
    return true;
  }, [delegationBookingContact, selectedGrandLodge]);

  // Validate Masonic Order Details - all 10 fields must be valid
  const validateMasonicOrderDetails = useCallback((): boolean => {
    if (!delegationBookingContact) return false;
    
    // 1. Formal Name
    if (!delegationBookingContact.organisationName) return false;
    
    // 2. Abbreviation
    if (!delegationBookingContact.organisationAbbreviation) return false;
    
    // 3. Known As
    if (!delegationBookingContact.organisationKnownAs) return false;
    
    // 4. Masonic Title
    if (!delegationBookingContact.title) return false;
    
    // 5. First Name
    if (!delegationBookingContact.firstName) return false;
    
    // 6. Last Name
    if (!delegationBookingContact.lastName) return false;
    
    // 7. Grand Rank (rank is auto-set to 'MO', so check Grand Rank)
    if (!delegationBookingContact.grandRank) return false;
    
    // 8. Grand Officer
    if (!delegationBookingContact.grandOfficerStatus) return false;
    
    // 9. If Grand Officer = Present, then Grand Office
    if (delegationBookingContact.grandOfficerStatus === 'Present' && !delegationBookingContact.grandOffice) return false;
    
    // 10. Email Address
    if (!delegationBookingContact.email) return false;
    
    // 11. Phone Number
    if (!delegationBookingContact.phone) return false;
    
    return true;
  }, [delegationBookingContact]);

  // Registration Details Card validation - delegates based on mode
  const isRegistrationDetailsValid = useCallback((): boolean => {
    if (delegationTypeTab === 'grandLodge') {
      return validateGrandLodgeDetails();
    } else {
      return validateMasonicOrderDetails();
    }
  }, [delegationTypeTab, validateGrandLodgeDetails, validateMasonicOrderDetails]);

  // Validate and complete
  const handleComplete = useCallback(() => {
    console.log('[GrandLodgesForm] handleComplete called');
    console.log('[GrandLodgesForm] activeTab:', activeTab);
    console.log('[GrandLodgesForm] delegationBookingContact:', delegationBookingContact);
    
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
        
        // Store customer data in lodge format (following LodgesForm pattern)
        if (delegationBookingContact) {
          updateLodgeCustomer({
            firstName: delegationBookingContact.firstName || '',
            lastName: delegationBookingContact.lastName || '',
            email: delegationBookingContact.email || '',
            mobile: delegationBookingContact.phone || '',
          });
          
          // Get Grand Lodge name from the selected Grand Lodge
          const allGrandLodges = useLocationStore.getState().grandLodges;
          const selectedGL = allGrandLodges.find(gl => gl.grand_lodge_id === selectedGrandLodge);
          const selectedGrandLodgeName = selectedGL?.name || '';

          updateLodgeDetails({
            grand_lodge_id: delegationTypeTab === 'grandLodge' ? selectedGrandLodge : '0',
            grandLodgeName: delegationTypeTab === 'grandLodge' ? selectedGrandLodgeName : '',
            // For delegations, we use organization details, not lodge details
            organisationName: delegationTypeTab === 'grandLodge' ? selectedGrandLodgeName : (delegationBookingContact.organisationName || ''),
            organisationAbbreviation: delegationTypeTab === 'grandLodge' ? (selectedGL?.abbreviation || '') : (delegationBookingContact.organisationAbbreviation || ''),
            organisationKnownAs: delegationTypeTab === 'grandLodge' ? selectedGrandLodgeName : (delegationBookingContact.organisationKnownAs || ''),
            organisationId: delegationTypeTab === 'grandLodge' ? selectedGrandLodgeOrgId : null,
            delegationType: delegationTypeTab
          });
        }
        
        // Store the package order (following LodgesForm pattern)
        if (selectedPackage) {
          // Get setLodgeOrder from the store
          const { setLodgeOrder } = useRegistrationStore.getState();
          
          // Store detailed package information for payment processing
          setLodgeOrder({
            packageId: selectedPackage.id,
            catalogObjectId: selectedPackage.catalogObjectId,
            packageQuantity: ticketCount,
            itemQuantity: selectedPackage.qty || 10,
            packagePrice: packagePrice,
            packageName: selectedPackage.name,
            totalAttendees: ticketCount * (selectedPackage.qty || 10),
            subtotal: ticketCount * packagePrice
          });
        }
        
        // Call onComplete to proceed to next step (following LodgesForm pattern)
        console.log('[GrandLodgesForm] Purchase only validation passed, proceeding to next step');
        if (onComplete) {
          onComplete();
        }
        return;
      } else {
        // For register delegation, validate delegation members
        if (delegationMembers.length === 0) {
          if (onValidationError) {
            onValidationError(['Please add at least one delegation member']);
          }
          return;
        }
        
        // Check if there's at least one Mason
        const hasMason = delegationMembers.some(member => member.type === 'Mason');
        if (!hasMason) {
          if (onValidationError) {
            onValidationError(['At least one Mason must be included in the delegation']);
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
        
        // No need to convert - attendees are already in the store!
        // Just ensure the first Mason is marked as primary
        const masons = attendees.filter(a => a.attendeeType === 'mason');
        if (masons.length > 0) {
          // Update the first Mason to be primary
          masons.forEach((mason, index) => {
            updateAttendee(mason.attendeeId, {
              isPrimary: index === 0
            });
          });
        }
        
        if (onComplete) {
          onComplete();
        }
      }
    });
  }, [selectedGrandLodge, delegationBookingContact, activeTab, ticketCount, delegationMembers, attendees, onComplete, onValidationError, setLodgeTicketOrder, updateAttendee, delegationTypeTab, getValidationErrors, updateLodgeCustomer, updateLodgeDetails, selectedPackage, packagePrice]);

  // Payment handlers for ticket purchase mode - EXACT SAME AS LODGE FORM
  const handlePaymentSuccess = async (paymentToken: string, billingDetails: any) => {
    console.log('💳 Square payment token created:', paymentToken);
    
    // Show processing steps UI (same as payment step)
    setError(null);
    setShowProcessingSteps(true);
    setIsProcessing(true);
    
    // Update steps to show registration saving
    setProcessingSteps(prev => {
      const newSteps = [...prev];
      newSteps[0] = { ...newSteps[0], status: 'current' };
      return newSteps;
    });
    
    // Check if packages are loaded
    if (isLoadingData) {
      console.error('Packages are still loading');
      setError('Please wait while we load pricing information');
      setIsProcessing(false);
      return;
    }
    
    // Check if we have a selected package
    if (!selectedPackage) {
      console.error('No delegation package available');
      setError('No delegation package is available for this function');
      setIsProcessing(false);
      return;
    }
    
    try {
      // Step 1: Complete - Registration validation
      setProcessingSteps(prev => {
        const newSteps = [...prev];
        newSteps[0] = { ...newSteps[0], status: 'complete' };
        newSteps[1] = { ...newSteps[1], status: 'current' };
        return newSteps;
      });

      // Get package ID from the selected package
      const packageId = selectedPackage.package_id || selectedPackage.id;
      
      if (!packageId) {
        console.error('[GrandLodgesForm] Package structure:', selectedPackage);
        throw new Error('Package has no ID');
      }

      console.log('[GrandLodgesForm] Sending registration request:', {
        functionId,
        packageId,
        packageQuantity: ticketCount,
        lodgeName: delegationTypeTab === 'grandLodge' ? 'Grand Lodge Delegation' : (delegationBookingContact?.organisationName || 'Masonic Order'),
        totalAmount: calculatedPackageOrder.totalWithFees
      });

      // Get the Grand Lodge name from location store
      const { grandLodges } = useLocationStore.getState();
      const selectedGrandLodgeData = grandLodges.find(gl => gl.grand_lodge_id.toString() === selectedGrandLodge);
      const currentGrandLodgeName = selectedGrandLodgeData?.name || 'Grand Lodge';

      // Create comprehensive booking contact with ALL collected data
      const comprehensiveBookingContact = {
        // Basic details
        title: delegationBookingContact?.title || '',
        firstName: delegationBookingContact?.firstName || '',
        lastName: delegationBookingContact?.lastName || '',
        email: delegationBookingContact?.email || '',
        mobile: delegationBookingContact?.phone || '',
        
        // Masonic details - CRITICAL DATA WE'RE CURRENTLY LOSING
        rank: delegationBookingContact?.rank || '',
        grandRank: delegationBookingContact?.grandRank || '', // Grand Rank is stored in suffix field
        grandOfficerStatus: delegationBookingContact?.grandOfficerStatus || '',
        grandOffice: delegationBookingContact?.grandOffice || '',
        otherGrandOffice: delegationBookingContact?.otherGrandOffice || '',
        
        // Address details for billing
        addressLine1: delegationBookingContact?.addressLine1 || '',
        suburb: delegationBookingContact?.city || 'Sydney',
        stateTerritory: delegationBookingContact?.stateProvince || 'NSW',
        postcode: delegationBookingContact?.postalCode || '2000',
        country: delegationBookingContact?.country || 'AU',
        
        // Additional metadata
        attendeeType: 'Mason',
        contactPreference: 'directly'
      };

      // Get Grand Lodge name from the selected Grand Lodge (we'll need to store this)
      const allGrandLodges = useLocationStore.getState().grandLodges;
      const selectedGL = allGrandLodges.find(gl => gl.grand_lodge_id === selectedGrandLodge);
      const grandLodgeName = selectedGL?.name || '';

      // Create comprehensive organization details (NOT lodge details)
      const comprehensiveLodgeDetails = {
        // Grand Lodge ID for reference
        grand_lodge_id: delegationTypeTab === 'grandLodge' ? selectedGrandLodge : '0',
        grandLodgeName: delegationTypeTab === 'grandLodge' ? grandLodgeName : '',
        
        // Organization details - for Grand Lodges, use the Grand Lodge info
        organisationName: delegationTypeTab === 'grandLodge' ? grandLodgeName : (delegationBookingContact?.organisationName || ''),
        organisationAbbreviation: delegationTypeTab === 'grandLodge' ? (selectedGL?.abbreviation || '') : (delegationBookingContact?.organisationAbbreviation || ''),
        organisationKnownAs: delegationTypeTab === 'grandLodge' ? grandLodgeName : (delegationBookingContact?.organisationKnownAs || ''),
        
        // Include the organisation ID if available
        organisationId: delegationTypeTab === 'grandLodge' ? selectedGrandLodgeOrgId : null,
        
        // Delegation type
        delegationType: delegationTypeTab
      };

      // Create payment intent and process registration using lodge endpoint
      const response = await fetch(`/api/functions/${functionId}/packages/${packageId}/lodge-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageQuantity: ticketCount,
          bookingContact: comprehensiveBookingContact,
          lodgeDetails: comprehensiveLodgeDetails,
          paymentMethodId: paymentToken,
          amount: Math.round(calculatedPackageOrder.totalWithFees * 100), // Convert to cents
          subtotal: Math.round(subtotal * 100),
          squareFee: Math.round((feeCalculation?.squareFee || 0) * 100),
          billingDetails: getBillingDetails(),
          registrationMode: activeTab, // Send the current tab mode
          // Only send attendee data for registerDelegation mode
          attendeeDetails: activeTab === 'registerDelegation' ? {
            bookingContact: delegationBookingContact, // Store ALL the collected data
            registrationType: delegationTypeTab === 'masonicOrder' ? 'masonicorder' : 'grandlodge',
            delegationType: delegationTypeTab
          } : undefined,
          // Include all additional metadata including package details
          additionalMetadata: {
            selectedPackageDetails: {
              packageId: selectedPackage?.package_id || selectedPackage?.id,
              packageName: selectedPackage?.name,
              packageDescription: selectedPackage?.description,
              pricePerPackage: selectedPackage?.price,
              originalPrice: selectedPackage?.original_price,
              discount: selectedPackage?.discount,
              includesDescription: selectedPackage?.includes_description,
              eligibilityCriteria: selectedPackage?.eligibility_criteria,
              registrationTypes: selectedPackage?.eligibleRegistrationTypes,
              isActive: selectedPackage?.is_active,
              catalogObjectId: selectedPackage?.catalog_object_id,
              qty: selectedPackage?.qty || selectedPackage?.quantity
            },
            orderDetails: {
              ticketCount: ticketCount,
              subtotal: subtotal,
              totalWithFees: calculatedPackageOrder.totalWithFees,
              processingFees: calculatedPackageOrder.processingFeesDisplay
            }
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process registration');
      }

      if (result.success && result.registrationId) {
        // Step 2: Complete - Payment processed
        setProcessingSteps(prev => {
          const newSteps = [...prev];
          newSteps[1] = { ...newSteps[1], status: 'complete' };
          newSteps[2] = { ...newSteps[2], status: 'current' };
          return newSteps;
        });

        console.log('[GrandLodgesForm] Registration successful:', {
          registrationId: result.registrationId,
          confirmationNumber: result.confirmationNumber
        });
        
        // Step 3: Complete - Confirmation ready
        setProcessingSteps(prev => {
          const newSteps = [...prev];
          newSteps[2] = { ...newSteps[2], status: 'complete' };
          return newSteps;
        });

        // Check if we got a confirmation number
        if (result.confirmationNumber) {
          // Update main registration store to mark as completed
          const store = useRegistrationStore.getState();
          store.setConfirmationNumber(result.confirmationNumber);
          store._updateStatus('completed');
          
          // Track in completed registrations store
          const { addCompletedRegistration } = useCompletedRegistrationsStore.getState();
          
          // Build metadata
          const metadata = {
            registrationType: 'grandlodge' as const,
            primaryAttendee: {
              title: delegationBookingContact?.title || '',
              firstName: delegationBookingContact?.firstName || '',
              lastName: delegationBookingContact?.lastName || '',
              attendeeType: 'lodge-contact'
            },
            attendees: [{
              attendeeId: 'lodge-bulk',
              title: 'Grand Lodge',
              firstName: delegationTypeTab === 'grandLodge' ? 'Grand Lodge Delegation' : (delegationBookingContact?.organisationName || 'Masonic Order'),
              lastName: `${ticketCount} packages`,
              attendeeType: 'lodge-bulk',
              selectedTickets: [{
                ticketId: selectedPackage?.id || selectedPackage?.package_id || '',
                ticketName: selectedPackage?.name || 'Delegation Package',
                price: selectedPackage?.price || 0,
                isPackage: true
              }]
            }],
            totalAttendees: ticketCount * baseQuantity,
            totalAmount: result.squareAmounts?.totalAmount || calculatedPackageOrder.totalWithFees,
            subtotal: result.squareAmounts?.subtotal || subtotal,
            squareFee: result.squareAmounts?.processingFee,
            gstAmount: result.squareAmounts?.totalTax
          };
          
          addCompletedRegistration({
            completedAt: Date.now(),
            registrationId: result.registrationId,
            functionId: functionId,
            functionStartDate: new Date().toISOString(),
            confirmationNumber: result.confirmationNumber,
            paymentReference: {
              provider: 'square',
              paymentId: result.paymentId,
              transactionId: result.paymentId
            },
            paymentStatus: 'completed',
            userId: result.customerId || '',
            confirmationEmails: [],
            metadata
          });
          
          // Redirect to confirmation page
          setTimeout(() => {
            console.log('[GrandLodgesForm] Redirecting to confirmation page:', result.confirmationNumber);
            // Use functionSlug if available, otherwise get it from the store
            const slugToUse = functionSlug || useRegistrationStore.getState().functionSlug;
            if (!slugToUse) {
              console.error('[GrandLodgesForm] No function slug available for redirect');
              // Fallback: go to confirmation step instead of redirect
              const store = useRegistrationStore.getState();
              store.setCurrentStep(6);
              store._updateStatus('completed');
              return;
            }
            // Redirect based on delegation type
            if (delegationTypeTab === 'grandLodge' || delegationTypeTab === 'masonicOrder') {
              router.push(`/functions/${slugToUse}/register/confirmation/delegation/${result.confirmationNumber}`);
            } else {
              router.push(`/functions/${slugToUse}/register/confirmation/lodge/${result.confirmationNumber}`);
            }
          }, 1500); // Small delay to show completion
        } else {
          // Fallback: Store registration data and go to confirmation step
          const store = useRegistrationStore.getState();
          useRegistrationStore.setState({ draftId: result.registrationId });
          
          setTimeout(() => {
            console.log('[GrandLodgesForm] No confirmation number, moving to confirmation step');
            store.setCurrentStep(6); // Go to confirmation step
            store._updateStatus('completed');
          }, 1500);
        }
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to complete registration');
      setIsProcessing(false);
      setShowProcessingSteps(false);
      
      // Update processing steps to show error
      setProcessingSteps(prev => {
        const newSteps = [...prev];
        const currentStepIndex = newSteps.findIndex(step => step.status === 'current');
        if (currentStepIndex >= 0) {
          newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], status: 'error' };
        }
        return newSteps;
      });
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setError(error);
    setIsProcessing(false);
    setShowProcessingSteps(false);
  };

  const handleBackToPayment = () => {
    setShowProcessingSteps(false);
    setError(null);
    setIsProcessing(false);
  };


  // Get billing details for payment
  const getBillingDetails = useCallback((): any => {
    return {
      title: delegationBookingContact?.title || '',
      firstName: delegationBookingContact?.firstName || '',
      lastName: delegationBookingContact?.lastName || '',
      emailAddress: delegationBookingContact?.email || '',
      mobileNumber: delegationBookingContact?.phone || '',
      phone: delegationBookingContact?.phone || '',
      addressLine1: delegationBookingContact?.addressLine1 || '',
      suburb: delegationBookingContact?.city || 'Sydney',
      stateTerritory: { name: delegationBookingContact?.stateProvince || 'NSW' },
      postcode: delegationBookingContact?.postalCode || '2000',
      country: { isoCode: delegationBookingContact?.country || 'AU' },
      businessName: delegationTypeTab === 'grandLodge' ? 'Grand Lodge Delegation' : delegationBookingContact?.organisationName,
    };
  }, [delegationBookingContact, delegationTypeTab]);

  // Expose submit method to parent
  React.useImperativeHandle(ref, () => ({
    submit: handleComplete
  }), [handleComplete]);

  // Show processing page when payment is being processed (for purchase tickets only mode)
  if (showProcessingSteps && activeTab === 'purchaseOnly') {
    return (
      <div className={cn("space-y-3", className)}>
        <PaymentProcessing 
          steps={processingSteps}
          error={error}
          onBackToPayment={error ? handleBackToPayment : undefined}
        />
      </div>
    );
  }


  return (
    <div className={cn("space-y-3", className)}>
      {/* Grand Lodge/Masonic Order Selection with integrated Booking Contact */}
      <div className="relative">
        <Card className="border-2 border-primary/20">
          <CardHeader className={cn(
            "border-b transition-colors duration-200 rounded-t-lg",
            delegationTypeTab === 'grandLodge' 
              ? "bg-masonic-navy border-masonic-navy/20" 
              : "bg-red-900 border-red-900/20"
          )}>
            <CardTitle className={cn(
              "flex items-center gap-2",
              delegationTypeTab === 'grandLodge'
                ? "text-masonic-gold"
                : "text-white"
            )}>
              <Building className="w-5 h-5" />
              {delegationTypeTab === 'grandLodge' ? 'Grand Lodge Details' : 'Masonic Order Details'}
            </CardTitle>
            <p className={cn(
              "text-sm mt-1",
              delegationTypeTab === 'grandLodge'
                ? "text-masonic-gold/80"
                : "text-white/80"
            )}>
              These details will be applied to all members in this registration
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={delegationTypeTab} onValueChange={(value) => {
              setDelegationTypeTab(value as 'grandLodge' | 'masonicOrder');
              // Clear attendees when switching delegation type to prevent mix-ups
              const { clearAllAttendees } = useRegistrationStore.getState();
              clearAllAttendees();
            }}>
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-transparent p-0 h-auto gap-0">
                <TabsTrigger 
                  value="grandLodge"
                  className={cn(
                    "transition-all duration-200 rounded-none h-full py-3",
                    delegationTypeTab === 'grandLodge' 
                      ? "bg-masonic-navy/50 text-black font-bold data-[state=active]:bg-masonic-navy/50 data-[state=active]:text-black" 
                      : "hover:bg-gray-200"
                  )}
                >
                  Grand Lodge
                </TabsTrigger>
                <TabsTrigger 
                  value="masonicOrder"
                  className={cn(
                    "transition-all duration-200 rounded-none h-full py-3",
                    delegationTypeTab === 'masonicOrder' 
                      ? "bg-red-900/50 text-white data-[state=active]:bg-red-900/50 data-[state=active]:text-white" 
                      : "hover:bg-gray-200"
                  )}
                >
                  Masonic Order
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="grandLodge" className="p-3 space-y-2 mt-0">
                {/* Grand Lodge Selection Field - No Lodge selection needed for Grand Lodges */}
                <div className="space-y-1">
                  <GrandLodgeSelection 
                    value={selectedGrandLodge}
                    onChange={handleGrandLodgeChange}
                    required={true}
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
                <BookingContactSection
                  mode="booking"
                  bookingContact={delegationBookingContact || {
                    title: '',
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    rank: delegationTypeTab === 'masonicOrder' ? 'MO' : 'GL',
                    grandOfficerStatus: 'Present'
                  }}
                  onFieldChange={handleFieldChange}
                  onFieldChangeImmediate={handleFieldChangeImmediate}
                  delegationTypeTab={delegationTypeTab}
                />
              </TabsContent>
              
              <TabsContent value="masonicOrder" className="p-3 space-y-2 mt-0">
                {/* Masonic Order Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                  {/* Formal Name - Long width (spans 6 columns) */}
                  <div className="lg:col-span-6">
                    <TextField
                      label="Formal Name"
                      name="formal-name"
                      value={delegationBookingContact?.organisationName || ''}
                      onChange={(value) => handleFieldChange('organisationName', value)}
                      placeholder="Enter formal name of Masonic Order"
                      required={true}
                      updateOnBlur={true}
                    />
                  </div>
                  
                  {/* Abbreviation - Short width (spans 2 columns) */}
                  <div className="lg:col-span-2">
                    <TextField
                      label="Abbreviation"
                      name="abbreviation"
                      value={delegationBookingContact?.organisationAbbreviation || ''}
                      onChange={(value) => handleFieldChange('organisationAbbreviation', value)}
                      placeholder="e.g. USGC NSW & ACT"
                      required={true}
                      updateOnBlur={true}
                    />
                  </div>
                  
                  {/* Known As - Medium width (spans 4 columns) */}
                  <div className="lg:col-span-4">
                    <TextField
                      label="Known As"
                      name="known-as"
                      value={delegationBookingContact?.organisationKnownAs || ''}
                      onChange={(value) => handleFieldChange('organisationKnownAs', value)}
                      placeholder="Common or shortened name"
                      required={true}
                      updateOnBlur={true}
                    />
                  </div>
                </div>
                
                {/* Validation message if any field is empty */}
                {(!delegationBookingContact?.organisationName || !delegationBookingContact?.organisationAbbreviation || !delegationBookingContact?.organisationKnownAs) && (
                  <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    All Masonic Order fields are required to proceed
                  </p>
                )}
                
                {/* Booking Contact Details */}
                <BookingContactSection
                  mode="booking"
                  bookingContact={delegationBookingContact || {
                    title: '',
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    rank: delegationTypeTab === 'masonicOrder' ? 'MO' : 'GL',
                    grandOfficerStatus: 'Present'
                  }}
                  onFieldChange={handleFieldChange}
                  onFieldChangeImmediate={handleFieldChangeImmediate}
                  delegationTypeTab={delegationTypeTab}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Show validation message above tabs if Registration Details are invalid */}
      {!isRegistrationDetailsValid() && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex justify-center">
            <div className="flex">
              <div className="shrink-0">
                <AlertCircle aria-hidden="true" className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Registration details incomplete</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Please complete all required fields in the {delegationTypeTab === 'grandLodge' ? 'Grand Lodge' : 'Masonic Order'} Details section above before {activeTab === 'purchaseOnly' ? 'proceeding with your order' : 'adding delegation members'}.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Type Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        const newTab = value as 'purchaseOnly' | 'registerDelegation';
        setActiveTab(newTab);
        onTabChange?.(newTab);
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchaseOnly">Purchase Tickets Only</TabsTrigger>
          <TabsTrigger value="registerDelegation">
            Register Delegation
          </TabsTrigger>
        </TabsList>

        {/* Purchase Tickets Only Tab */}
        <TabsContent value="purchaseOnly" className="mt-3 space-y-3">
          
          <PackageOrderCard
            title="Grand Lodge Package Order"
            disabled={!isRegistrationDetailsValid()}
            isLoadingData={isLoadingData}
            dataError={dataError}
            packages={functionPackages}
            selectedPackage={selectedPackage}
            selectedPackageId={selectedPackageId}
            onPackageSelect={setSelectedPackageId}
            packageCount={ticketCount}
            minPackages={1}
            maxPackages={10}
            onPackageCountChange={handleTicketCountChange}
            functionTickets={functionTickets}
            calculatedPackageOrder={calculatedPackageOrder}
            feeCalculation={feeCalculation}
            feeLoading={feeLoading}
            baseQuantity={baseQuantity}
            packagePrice={packagePrice}
            showPackageSelection={functionPackages.length > 1}
          />
          
          {/* Payment Section - same as LodgeRegistrationStep */}
          <div className={cn(
            "relative",
            !isRegistrationDetailsValid() && "opacity-50 pointer-events-none"
          )}>
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              {/* Show loading state while fetching data */}
              {isLoadingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 mr-2" />
                  <span>Loading pricing information...</span>
                </div>
              ) : !selectedPackage ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No delegation package is available for this function. Please contact support.
                  </AlertDescription>
                </Alert>
              ) : feeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 mr-2" />
                  <span>Calculating fees...</span>
                </div>
              ) : (
                /* Unified Payment Form - EXACT SAME AS LODGE FORM */
                <UnifiedPaymentForm
                  totalAmount={calculatedPackageOrder.totalWithFees}
                  subtotal={subtotal}
                  billingDetails={getBillingDetails()}
                  registrationType="lodge"
                  registrationData={{ 
                    lodgeCustomer: {
                      firstName: delegationBookingContact?.firstName || '',
                      lastName: delegationBookingContact?.lastName || '',
                      email: delegationBookingContact?.email || '',
                      mobile: delegationBookingContact?.phone || '',
                    },
                    lodgeDetails: {
                      lodgeName: delegationTypeTab === 'grandLodge' ? 'Grand Lodge Delegation' : (delegationBookingContact?.organisationName || 'Masonic Order'),
                      lodge_id: delegationTypeTab === 'grandLodge' ? selectedGrandLodge : '0',
                      grand_lodge_id: delegationTypeTab === 'grandLodge' ? selectedGrandLodge : '0',
                    },
                    lodgeOrder: {
                      packageId: selectedPackage?.id,
                      catalogObjectId: selectedPackage?.catalogObjectId,
                      packageQuantity: ticketCount,
                      itemQuantity: baseQuantity,
                      packagePrice: packagePrice,
                      packageName: selectedPackage?.name,
                      totalAttendees: ticketCount * baseQuantity,
                      subtotal: ticketCount * packagePrice
                    }
                  }}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  isProcessing={isProcessing}
                  functionId={functionId}
                  functionSlug={functionSlug || ''}
                  packageId={selectedPackage?.package_id || selectedPackage?.id}
                  minimal={true}
                />
              )}
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* Register Delegation Tab */}
        <TabsContent value="registerDelegation" className="mt-3">
          <Card className={cn(
            "border-2 border-primary/20",
            !isRegistrationDetailsValid() && "opacity-50 pointer-events-none"
          )}>
            <CardHeader className="py-3 px-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-primary font-medium text-lg">
                  <Users className="w-5 h-5" />
                  Delegation Members
                </CardTitle>
                <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addDelegationMember('Mason')}
                      disabled={delegationTypeTab === 'grandLodge' ? !selectedGrandLodge : (!delegationBookingContact?.organisationName || !delegationBookingContact?.organisationAbbreviation || !delegationBookingContact?.organisationKnownAs)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Mason
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddMemberDialog(true)}
                      disabled={(delegationTypeTab === 'grandLodge' ? !selectedGrandLodge : (!delegationBookingContact?.organisationName || !delegationBookingContact?.organisationAbbreviation || !delegationBookingContact?.organisationKnownAs)) || delegationMembers.length === 0}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Partner
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addDelegationMember('Guest')}
                      disabled={delegationTypeTab === 'grandLodge' ? !selectedGrandLodge : (!delegationBookingContact?.organisationName || !delegationBookingContact?.organisationAbbreviation || !delegationBookingContact?.organisationKnownAs)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Guest
                    </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-2 px-1">
              {delegationMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No delegation members added yet.</p>
                  <p className="text-sm mt-2">Click the buttons above to add members.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="!w-16 !px-1 !py-2 !h-auto text-center">Order</TableHead>
                      <TableHead className="!px-1 !py-2 !h-auto">Type</TableHead>
                      <TableHead className="!px-1 !py-2 !h-auto">Title</TableHead>
                      <TableHead className="!px-1 !py-2 !h-auto">First Name</TableHead>
                      <TableHead className="!px-1 !py-2 !h-auto">Last Name</TableHead>
                      <TableHead className="!px-1 !py-2 !h-auto">Rank</TableHead>
                      <TableHead className="!px-1 !py-2 !h-auto">Office</TableHead>
                      <TableHead className="!px-1 !py-2 !h-auto">Relationship</TableHead>
                      <TableHead className="!w-20 !px-1 !py-2 !h-auto">Actions</TableHead>
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
                        onMoveUp={() => moveDelegationMemberUp(index)}
                        onMoveDown={() => moveDelegationMemberDown(index)}
                        canMoveUp={index > 0}
                        canMoveDown={index < delegationMembers.length - 1}
                        grandOfficeOptions={grandOfficeOptions}
                        delegationMembers={delegationMembers}
                        isMasonicOrder={delegationTypeTab === 'masonicOrder'}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}

              {delegationMembers.length > 0 && (
                <Alert className="mt-3 border-amber-200 bg-amber-50">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-sm">
                    All delegation members will be registered under {selectedGrandLodge ? 'the selected Grand Lodge' : 'your Grand Lodge'}.
                    The first Mason in the list will be designated as the primary attendee.
                    Use the up/down arrows to reorder members.
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
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  grandOfficeOptions: { value: string; label: string }[];
  delegationMembers: DelegationMember[];
  isMasonicOrder?: boolean;
}> = ({ member, index, onUpdate, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown, grandOfficeOptions, delegationMembers, isMasonicOrder = false }) => {
  // Find if this is the first Mason in the list
  const firstMasonIndex = delegationMembers.findIndex(m => m.type === 'Mason');
  const isFirstMason = member.type === 'Mason' && index === firstMasonIndex;
  
  // All fields are directly editable
  return (
    <TableRow>
      <TableCell className="!py-2 !px-1 !pl-2">
        <div className="flex flex-col items-center">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-6 p-0"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-6 p-0 -mt-1"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="!py-2 !px-1">{member.type}</TableCell>
      <TableCell className="!py-2 !px-1">
        {isMasonicOrder && member.type === 'Mason' ? (
          <Input
            value={member.title}
            onChange={(e) => onUpdate(member.id, { title: e.target.value })}
            placeholder="Title"
            className="min-w-[6rem] w-full"
          />
        ) : (
          <Select
            value={member.title}
            onValueChange={(value) => onUpdate(member.id, { title: value })}
          >
            <SelectTrigger className="min-w-[6rem] w-full">
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
        )}
      </TableCell>
      <TableCell className="!py-2 !px-1">
        <Input
          value={member.firstName}
          onChange={(e) => onUpdate(member.id, { firstName: e.target.value })}
          placeholder="First name"
          className="min-w-[8rem] w-full"
        />
      </TableCell>
      <TableCell className="!py-2 !px-1">
        <Input
          value={member.lastName}
          onChange={(e) => onUpdate(member.id, { lastName: e.target.value })}
          placeholder="Last name"
          className="min-w-[8rem] w-full"
        />
      </TableCell>
      <TableCell className="!py-2 !px-1">
        {member.type === 'Mason' ? (
          <Input
            value={member.grandRank || ''}
            onChange={(e) => onUpdate(member.id, { grandRank: e.target.value })}
            placeholder="Rank"
            className="min-w-[6rem] w-full"
          />
        ) : '-'}
      </TableCell>
      <TableCell className="!py-2 !px-1">
        {member.type === 'Mason' ? (
          <Input
            value={member.grandOffice || ''}
            onChange={(e) => onUpdate(member.id, { grandOffice: e.target.value })}
            placeholder="Office"
            className="min-w-[9rem] w-full"
          />
        ) : '-'}
      </TableCell>
      <TableCell className="!py-2 !px-1">
        {isFirstMason ? (
          <div className="text-sm font-medium">Primary</div>
        ) : member.type === 'Partner' ? (
          <Select
            value={member.relationship || ''}
            onValueChange={(value) => onUpdate(member.id, { relationship: value })}
          >
            <SelectTrigger className="min-w-[6rem] w-full">
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
            className="min-w-[9rem] w-full"
          />
        ) : '-'}
      </TableCell>
      <TableCell className="!py-2 !px-1">
        <Button size="sm" variant="ghost" onClick={() => onRemove(member.id)} className="h-7 px-2">
          <X className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

// Summary view for Grand Lodge orders
export const GrandLodgeFormSummary: React.FC = () => {
  const { attendees, lodgeTicketOrder } = useRegistrationStore();
  
  const primaryAttendee = attendees.find(a => a.isPrimary);
  const displayGrandLodgeName = primaryAttendee?.grand_lodge_id ? 'Grand Lodge' : 'Grand Lodge';
  
  // Calculate fees for summary
  const subtotal = lodgeTicketOrder ? lodgeTicketOrder.totalTickets * 195 : 0;
  
  // Use the hook for database-driven fee calculation (same as LodgesForm)
  const { fees: feeCalculation } = useFeeCalculation({
    subtotal,
    isDomestic: true, // Default to domestic for Australian Grand Lodges
    enabled: true
  });
  
  // Default to zero fees if still loading
  const fees = feeCalculation || {
    processingFeesDisplay: 0,
    customerPayment: subtotal
  };

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
              <p className="font-medium text-lg">{displayGrandLodgeName}</p>
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
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {fees.processingFeesDisplay > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{getProcessingFeeLabel(true)}</span>
                  <span className="font-medium">${fees.processingFeesDisplay.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-bold text-primary">
                  ${fees.customerPayment.toFixed(2)}
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