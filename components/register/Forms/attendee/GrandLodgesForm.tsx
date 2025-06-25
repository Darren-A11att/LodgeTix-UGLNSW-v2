import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, Users, Check, Building, Plus, X, UserPlus } from 'lucide-react';
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
    setLodgeTicketOrder,
    updateLodgeCustomer,
    updateLodgeDetails,
    setLodgeOrder,
  } = useRegistrationStore();
  
  // Get location store functions to ensure Grand Lodges are loaded
  const { fetchInitialGrandLodges } = useLocationStore();
  
  
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<string>('');
  const [selectedGrandLodgeOrgId, setSelectedGrandLodgeOrgId] = useState<string | null>(null);
  const [primaryAttendeeId, setPrimaryAttendeeId] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState(1);
  const [ticketCount, setTicketCount] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
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
  
  // Get update functions for primary attendee - hooks must always be called
  const attendeeDataResult = useAttendeeDataWithDebounce(primaryAttendeeId || '', DEBOUNCE_DELAY);
  const updateField = primaryAttendeeId ? attendeeDataResult.updateField : () => {};
  const updateFieldImmediate = primaryAttendeeId ? attendeeDataResult.updateFieldImmediate : () => {};
  
  // Ensure Grand Lodges are loaded when component mounts
  useEffect(() => {
    console.log('[GrandLodgesForm] Ensuring Grand Lodges are loaded');
    fetchInitialGrandLodges();
  }, [fetchInitialGrandLodges]);
  
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
  
  // Removed production restriction - both tabs are now available in all environments
  
  // Notify parent of initial tab state on mount
  useEffect(() => {
    if (onTabChange) {
      onTabChange(activeTab);
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

  // Initialize Grand Lodge from primary attendee when loaded
  useEffect(() => {
    if (primaryAttendee && !selectedGrandLodge && primaryAttendee.grand_lodge_id) {
      // Initialize Grand Lodge
      setSelectedGrandLodge(String(primaryAttendee.grand_lodge_id));
    }
  }, [primaryAttendee, selectedGrandLodge]);
  
  // Auto-set rank to 'MO' when Masonic Order tab is selected
  useEffect(() => {
    if (delegationTypeTab === 'masonicOrder' && primaryAttendeeId) {
      updateFieldImmediate('rank', 'MO');
    }
  }, [delegationTypeTab, primaryAttendeeId, updateFieldImmediate]);
  
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

  // Update Grand Lodge for primary attendee - No Lodge selection needed for Grand Lodges
  const handleGrandLodgeChange = useCallback((grandLodgeId: string, organisationId?: string) => {
    if (selectedGrandLodge !== grandLodgeId) {
      setSelectedGrandLodge(grandLodgeId);
      
      // Store the organisation ID if provided
      if (organisationId) {
        setSelectedGrandLodgeOrgId(organisationId);
      }
      
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
      // For Register Delegation tab, validate delegation type specific fields first
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
      
      // Then validate all primary attendee fields
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
      
      // For Grand Officer fields (when rank is GL or MO)
      if ((primaryAttendee?.rank === 'GL' || primaryAttendee?.rank === 'MO') && primaryAttendee?.grandOfficerStatus === 'Present' && !primaryAttendee?.presentGrandOfficerRole) {
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
        
        // Store customer data in lodge format (following LodgesForm pattern)
        if (primaryAttendee) {
          updateLodgeCustomer({
            firstName: primaryAttendee.firstName || '',
            lastName: primaryAttendee.lastName || '',
            email: primaryAttendee.primaryEmail || '',
            mobile: primaryAttendee.primaryPhone || '',
          });
          
          // Get Grand Lodge name from the selected Grand Lodge
          const allGrandLodges = useLocationStore.getState().grandLodges;
          const selectedGL = allGrandLodges.find(gl => gl.grand_lodge_id === selectedGrandLodge);
          const selectedGrandLodgeName = selectedGL?.name || '';

          updateLodgeDetails({
            grand_lodge_id: delegationTypeTab === 'grandLodge' ? selectedGrandLodge : '0',
            grandLodgeName: delegationTypeTab === 'grandLodge' ? selectedGrandLodgeName : '',
            // For delegations, we use organization details, not lodge details
            organisationName: delegationTypeTab === 'grandLodge' ? selectedGrandLodgeName : (primaryAttendee.organisationName || ''),
            organisationAbbreviation: delegationTypeTab === 'grandLodge' ? (selectedGL?.abbreviation || '') : (primaryAttendee.organisationAbbreviation || ''),
            organisationKnownAs: delegationTypeTab === 'grandLodge' ? selectedGrandLodgeName : (primaryAttendee.organisationKnownAs || ''),
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
              rank: delegationTypeTab === 'masonicOrder' ? 'MO' : 'GL',
              grandOfficerStatus: 'Present',
              presentGrandOfficerRole: member.grandOffice,
              grand_lodge_id: delegationTypeTab === 'grandLodge' ? Number(selectedGrandLodge) : 0,
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
  }, [selectedGrandLodge, primaryAttendee, activeTab, ticketCount, delegationMembers, onComplete, onValidationError, setLodgeTicketOrder, addMasonAttendee, addGuestAttendee, addPartnerAttendee, updateAttendee, primaryAttendeeId, delegationTypeTab, getValidationErrors, updateLodgeCustomer, updateLodgeDetails, selectedPackage, packagePrice]);

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
        lodgeName: delegationTypeTab === 'grandLodge' ? 'Grand Lodge Delegation' : (primaryAttendee?.organisationName || 'Masonic Order'),
        totalAmount: calculatedPackageOrder.totalWithFees
      });

      // Get the Grand Lodge name from location store
      const { grandLodges } = useLocationStore.getState();
      const selectedGrandLodgeData = grandLodges.find(gl => gl.grand_lodge_id.toString() === selectedGrandLodge);
      const currentGrandLodgeName = selectedGrandLodgeData?.name || 'Grand Lodge';

      // Create comprehensive booking contact with ALL collected data
      const comprehensiveBookingContact = {
        // Basic details
        title: primaryAttendee?.title || '',
        firstName: primaryAttendee?.firstName || '',
        lastName: primaryAttendee?.lastName || '',
        email: primaryAttendee?.primaryEmail || '',
        mobile: primaryAttendee?.primaryPhone || '',
        
        // Masonic details - CRITICAL DATA WE'RE CURRENTLY LOSING
        rank: primaryAttendee?.rank || '',
        grandRank: primaryAttendee?.suffix || '', // Grand Rank is stored in suffix field
        grandOfficerStatus: primaryAttendee?.grandOfficerStatus || '',
        grandOffice: primaryAttendee?.presentGrandOfficerRole || '',
        otherGrandOffice: primaryAttendee?.otherPresentGrandOfficerRole || '',
        
        // Address details for billing
        addressLine1: primaryAttendee?.addressLine1 || '',
        suburb: primaryAttendee?.suburb || 'Sydney',
        stateTerritory: primaryAttendee?.stateTerritory || 'NSW',
        postcode: primaryAttendee?.postcode || '2000',
        country: 'AU',
        
        // Additional metadata
        attendeeType: 'Mason',
        contactPreference: primaryAttendee?.contactPreference || 'directly'
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
        organisationName: delegationTypeTab === 'grandLodge' ? grandLodgeName : (primaryAttendee?.organisationName || ''),
        organisationAbbreviation: delegationTypeTab === 'grandLodge' ? (selectedGL?.abbreviation || '') : (primaryAttendee?.organisationAbbreviation || ''),
        organisationKnownAs: delegationTypeTab === 'grandLodge' ? grandLodgeName : (primaryAttendee?.organisationKnownAs || ''),
        
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
            primaryAttendee: primaryAttendee, // Store ALL the collected data
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
              title: primaryAttendee?.title || '',
              firstName: primaryAttendee?.firstName || '',
              lastName: primaryAttendee?.lastName || '',
              attendeeType: 'lodge-contact'
            },
            attendees: [{
              attendeeId: 'lodge-bulk',
              title: 'Grand Lodge',
              firstName: delegationTypeTab === 'grandLodge' ? 'Grand Lodge Delegation' : (primaryAttendee?.organisationName || 'Masonic Order'),
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
      title: primaryAttendee?.title || '',
      firstName: primaryAttendee?.firstName || '',
      lastName: primaryAttendee?.lastName || '',
      emailAddress: primaryAttendee?.primaryEmail || '',
      mobileNumber: primaryAttendee?.primaryPhone || '',
      phone: primaryAttendee?.primaryPhone || '',
      addressLine1: primaryAttendee?.addressLine1 || '',
      suburb: primaryAttendee?.suburb || 'Sydney',
      stateTerritory: { name: primaryAttendee?.stateTerritory || 'NSW' },
      postcode: primaryAttendee?.postcode || '2000',
      country: { isoCode: 'AU' },
      businessName: delegationTypeTab === 'grandLodge' ? 'Grand Lodge Delegation' : primaryAttendee?.organisationName,
    };
  }, [primaryAttendee, delegationTypeTab]);

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
                {primaryAttendee && (
                  <BookingContactSection
                    mode="attendee"
                    attendee={primaryAttendee}
                    onFieldChange={handleFieldChange}
                    onFieldChangeImmediate={handleFieldChangeImmediate}
                    delegationTypeTab={delegationTypeTab}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="masonicOrder" className="p-3 space-y-2 mt-0">
                {/* Masonic Order Fields */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  {/* Formal Name - Long width (spans 6 columns) */}
                  <div className="md:col-span-6">
                    <TextField
                      label="Formal Name"
                      name="formal-name"
                      value={primaryAttendee?.organisationName || ''}
                      onChange={(value) => handleFieldChange('organisationName', value)}
                      placeholder="Enter formal name of Masonic Order"
                      required={true}
                      updateOnBlur={true}
                    />
                  </div>
                  
                  {/* Abbreviation - Short width (spans 2 columns) */}
                  <div className="md:col-span-2">
                    <TextField
                      label="Abbreviation"
                      name="abbreviation"
                      value={primaryAttendee?.organisationAbbreviation || ''}
                      onChange={(value) => handleFieldChange('organisationAbbreviation', value)}
                      placeholder="e.g. USGC NSW & ACT"
                      required={true}
                      updateOnBlur={true}
                    />
                  </div>
                  
                  {/* Known As - Medium width (spans 4 columns) */}
                  <div className="md:col-span-4">
                    <TextField
                      label="Known As"
                      name="known-as"
                      value={primaryAttendee?.organisationKnownAs || ''}
                      onChange={(value) => handleFieldChange('organisationKnownAs', value)}
                      placeholder="Common or shortened name"
                      required={true}
                      updateOnBlur={true}
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
                    delegationTypeTab={delegationTypeTab}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

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
            disabled={delegationTypeTab === 'grandLodge' ? !selectedGrandLodge : (!primaryAttendee?.organisationName || !primaryAttendee?.organisationAbbreviation || !primaryAttendee?.organisationKnownAs)}
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
                      firstName: primaryAttendee?.firstName || '',
                      lastName: primaryAttendee?.lastName || '',
                      email: primaryAttendee?.primaryEmail || '',
                      mobile: primaryAttendee?.primaryPhone || '',
                    },
                    lodgeDetails: {
                      lodgeName: delegationTypeTab === 'grandLodge' ? 'Grand Lodge Delegation' : (primaryAttendee?.organisationName || 'Masonic Order'),
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
        </TabsContent>

        {/* Register Delegation Tab */}
        <TabsContent value="registerDelegation" className="mt-3">
          <Card className={cn(
            "border-2 border-primary/20",
            (delegationTypeTab === 'grandLodge' ? !selectedGrandLodge : (!primaryAttendee?.organisationName || !primaryAttendee?.organisationAbbreviation || !primaryAttendee?.organisationKnownAs)) && "opacity-70"
          )}>
            <CardHeader className="py-3 px-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-primary font-medium text-lg">
                  <Users className="w-5 h-5" />
                  Delegation Members
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="delegation-order">Delegation Order:</Label>
                    <Input
                      id="delegation-order"
                      type="number"
                      value={delegationOrder}
                      onChange={(e) => setDelegationOrder(Number(e.target.value))}
                      className="w-24"
                      min={1}
                      max={999}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addDelegationMember('Mason')}
                      disabled={delegationTypeTab === 'grandLodge' ? !selectedGrandLodge : (!primaryAttendee?.organisationName || !primaryAttendee?.organisationAbbreviation || !primaryAttendee?.organisationKnownAs)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Mason
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddMemberDialog(true)}
                      disabled={(delegationTypeTab === 'grandLodge' ? !selectedGrandLodge : (!primaryAttendee?.organisationName || !primaryAttendee?.organisationAbbreviation || !primaryAttendee?.organisationKnownAs)) || delegationMembers.length === 0}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Partner
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addDelegationMember('Guest')}
                      disabled={delegationTypeTab === 'grandLodge' ? !selectedGrandLodge : (!primaryAttendee?.organisationName || !primaryAttendee?.organisationAbbreviation || !primaryAttendee?.organisationKnownAs)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Guest
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2">
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
                      <TableHead className="w-8 px-2 py-2">#</TableHead>
                      <TableHead className="px-2 py-2">Type</TableHead>
                      <TableHead className="px-2 py-2">Title</TableHead>
                      <TableHead className="px-2 py-2">First Name</TableHead>
                      <TableHead className="px-2 py-2">Last Name</TableHead>
                      <TableHead className="px-2 py-2">Rank</TableHead>
                      <TableHead className="px-2 py-2">Office</TableHead>
                      <TableHead className="px-2 py-2">Relationship</TableHead>
                      <TableHead className="w-20 px-2 py-2">Actions</TableHead>
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
  isMasonicOrder?: boolean;
}> = ({ member, index, onUpdate, onRemove, grandOfficeOptions, delegationMembers, isMasonicOrder = false }) => {
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
        <TableCell className="p-2">{index + 1}</TableCell>
        <TableCell className="p-2">{member.type}</TableCell>
        <TableCell className="p-2">
          {isMasonicOrder && member.type === 'Mason' ? (
            <Input
              value={member.title}
              onChange={(e) => onUpdate(member.id, { title: e.target.value })}
              placeholder="Title"
              className="w-24"
            />
          ) : (
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
          )}
        </TableCell>
        <TableCell className="p-2">
          <Input
            value={member.firstName}
            onChange={(e) => onUpdate(member.id, { firstName: e.target.value })}
            placeholder="First name"
            className="w-32"
          />
        </TableCell>
        <TableCell className="p-2">
          <Input
            value={member.lastName}
            onChange={(e) => onUpdate(member.id, { lastName: e.target.value })}
            placeholder="Last name"
            className="w-32"
          />
        </TableCell>
        <TableCell className="p-2">
          {member.type === 'Mason' ? (
            <Input
              value={member.grandRank || ''}
              onChange={(e) => onUpdate(member.id, { grandRank: e.target.value })}
              placeholder="Rank"
              className="w-24"
            />
          ) : '-'}
        </TableCell>
        <TableCell className="p-2">
          {member.type === 'Mason' ? (
            <Input
              value={member.grandOffice || ''}
              onChange={(e) => onUpdate(member.id, { grandOffice: e.target.value })}
              placeholder="Office"
              className="w-36"
            />
          ) : '-'}
        </TableCell>
        <TableCell className="p-2">
          {member.type === 'Partner' ? (
            <Select
              value={member.relationship || ''}
              onValueChange={(value) => onUpdate(member.id, { relationship: value })}
            >
              <SelectTrigger className="w-24">
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
              className="w-36"
            />
          ) : '-'}
        </TableCell>
        <TableCell className="p-2">
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 px-2">
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onRemove(member.id)} className="h-7 px-2">
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
      <TableCell className="p-2">{index + 1}</TableCell>
      <TableCell className="p-2">{member.type}</TableCell>
      <TableCell className="p-2">{member.title}</TableCell>
      <TableCell className="p-2">{member.firstName}</TableCell>
      <TableCell className="p-2">{member.lastName}</TableCell>
      <TableCell className="p-2">{member.type === 'Mason' ? member.grandRank : '-'}</TableCell>
      <TableCell className="p-2">{member.type === 'Mason' ? member.grandOffice : '-'}</TableCell>
      <TableCell className="p-2">
        {member.type === 'Partner' && partnerOfMember ? 
          `${member.relationship} of ${partnerOfMember.firstName} ${partnerOfMember.lastName}` :
          member.relationship || '-'
        }
      </TableCell>
      <TableCell className="p-2">
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-7 px-2">
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onRemove(member.id)} className="h-7 px-2">
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
    <div className="space-y-2 border-t pt-3">
      <h3 className="text-sm font-medium">Booking Contact</h3>
      
      {/* Name and Title Row - following MasonForm layout */}
      <div className="grid grid-cols-12 gap-2">
        {/* Masonic Title - 2 columns */}
        <div className="col-span-2">
          <Label className="text-sm mb-1">Title *</Label>
          <select
            className="w-full h-9 border rounded-md px-3 py-1.5 text-sm"
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
          <Label className="text-sm mb-1">First Name *</Label>
          <input
            type="text"
            className="w-full h-9 border rounded-md px-3 py-1.5 text-sm"
            value={primaryAttendee.firstName || ''}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            required
          />
        </div>
        
        {/* Last Name - 4 columns */}
        <div className="col-span-4">
          <Label className="text-sm mb-1">Last Name *</Label>
          <input
            type="text"
            className="w-full h-9 border rounded-md px-3 py-1.5 text-sm"
            value={primaryAttendee.lastName || ''}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            required
          />
        </div>
        
        {/* Rank - 2 columns */}
        <div className="col-span-2">
          <Label className="text-sm mb-1">Rank *</Label>
          <select
            className="w-full h-9 border rounded-md px-3 py-1.5 text-sm"
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