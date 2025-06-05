import React, { useCallback, useEffect, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, ShoppingCart, Users, Package, Check, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import formSaveManager from '@/lib/formSaveManager';
import { useDebouncedCallback } from 'use-debounce';
import { getFunctionTicketsService, FunctionTicketDefinition, FunctionPackage } from '@/lib/services/function-tickets-service';
import { getEnvironmentConfig } from '@/lib/config/environment';

// Import form components
import { ContactInfo } from '../basic-details/ContactInfo';
import { GrandOfficerFields } from '../mason/utils/GrandOfficerFields';
import { MASON_TITLES, MASON_RANKS } from './utils/constants';
import { GrandLodgeSelection } from '../mason/lib/GrandLodgeSelection';
import { LodgeSelection } from '../mason/lib/LodgeSelection';

// Import our new extracted components
import {
  AttendeeCounter,
} from './components';

// Constants for form behavior
const DEBOUNCE_DELAY = 500; // Increased from 300ms to reduce re-renders

// Constants for form behavior only
// Package and event data will be fetched dynamically from database

interface LodgesFormProps {
  minTables?: number;
  maxTables?: number;
  onComplete?: () => void;
  className?: string;
}

interface TableOrder {
  tableCount: number;
  totalTickets: number;
  totalPrice: number;
}

export const LodgesForm: React.FC<LodgesFormProps> = ({
  minTables = 1,
  maxTables = 10,
  onComplete,
  className,
}) => {
  const { 
    attendees, 
    addMasonAttendee,
    updateAttendee,
    setLodgeTicketOrder,
  } = useRegistrationStore();
  
  // Create debounced version of updateAttendee
  const debouncedUpdateAttendee = useDebouncedCallback(
    (attendeeId: string, updates: Partial<any>) => {
      updateAttendee(attendeeId, updates);
    },
    DEBOUNCE_DELAY
  );
  
  // Use the immediate update for critical operations
  const updateAttendeeImmediate = updateAttendee;
  
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<string>('');
  const [selectedLodge, setSelectedLodge] = useState<string>('');
  const [primaryAttendeeId, setPrimaryAttendeeId] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState(1);
  
  // Dynamic data state
  const [functionTickets, setFunctionTickets] = useState<FunctionTicketDefinition[]>([]);
  const [functionPackages, setFunctionPackages] = useState<FunctionPackage[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Derived values from fetched data
  const lodgePackage = functionPackages.find(pkg => 
    pkg.name.toLowerCase().includes('table') || 
    pkg.eligibleRegistrationTypes.includes('lodge')
  );
  const tableSize = lodgePackage?.includes?.length || 10; // fallback to 10
  const tablePrice = lodgePackage?.price || 1950; // fallback price
  
  const [tableOrder, setTableOrder] = useState<TableOrder>({
    tableCount: 1,
    totalTickets: tableSize,
    totalPrice: tablePrice
  });
  
  // Get the primary attendee
  const primaryAttendee = attendees.find(a => a.attendeeId === primaryAttendeeId);

  // Fetch function tickets and packages data
  useEffect(() => {
    const fetchFunctionData = async () => {
      try {
        setIsLoadingData(true);
        setDataError(null);
        
        const config = getEnvironmentConfig();
        const functionId = config.functionId || config.featuredFunctionId;
        
        if (!functionId) {
          throw new Error('No function ID found in environment configuration');
        }
        
        const ticketsService = getFunctionTicketsService();
        const { tickets, packages } = await ticketsService.getFunctionTicketsAndPackages(functionId);
        
        setFunctionTickets(tickets);
        setFunctionPackages(packages);
      } catch (error) {
        console.error('Failed to fetch function data:', error);
        setDataError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchFunctionData();
  }, []);
  
  // Update table order when count or package data changes
  useEffect(() => {
    setTableOrder({
      tableCount,
      totalTickets: tableCount * tableSize,
      totalPrice: tableCount * tablePrice
    });
  }, [tableCount, tableSize, tablePrice]);
  
  // Initialize Grand Lodge and Lodge from primary attendee when loaded
  useEffect(() => {
    if (primaryAttendee && !selectedGrandLodge && primaryAttendee.grand_lodge_id) {
      // Initialize Grand Lodge
      setSelectedGrandLodge(String(primaryAttendee.grand_lodge_id));
      
      // Initialize Lodge if available
      if (primaryAttendee.lodge_id) {
        setSelectedLodge(String(primaryAttendee.lodge_id));
      }
    }
  }, [primaryAttendee, selectedGrandLodge]);

  // One-time initialization
  const isInitializedRef = React.useRef(false);
  
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      if (!primaryAttendeeId) {
        const primaryId = addMasonAttendee();
        updateAttendeeImmediate(primaryId, {
          isPrimary: true,
          attendeeType: 'mason',
        });
        setPrimaryAttendeeId(primaryId);
      }
    }
  }, [primaryAttendeeId, addMasonAttendee, updateAttendeeImmediate]);

  // Update table count
  const handleTableCountChange = useCallback((newCount: number) => {
    if (newCount >= minTables && newCount <= maxTables) {
      setTableCount(newCount);
      // Store the table order in the registration store
      if (setLodgeTicketOrder) {
        setLodgeTicketOrder({
          tableCount: newCount,
          totalTickets: newCount * tableSize,
          galaDinnerTickets: newCount * tableSize,
          ceremonyTickets: newCount * tableSize,
          eventId: functionTickets[0]?.event_id || '',
          galaDinnerEventId: functionTickets.find(t => t.name.toLowerCase().includes('gala') || t.name.toLowerCase().includes('dinner'))?.event_id || '',
          ceremonyEventId: functionTickets.find(t => t.name.toLowerCase().includes('ceremony') || t.name.toLowerCase().includes('installation'))?.event_id || '',
        });
      }
    }
  }, [minTables, maxTables, setLodgeTicketOrder]);

  // Update lodge details for primary attendee
  const handleLodgeChange = useCallback((lodgeId: string, lodgeName: string) => {
    if (selectedLodge !== lodgeId) {
      setSelectedLodge(lodgeId);
      
      if (primaryAttendee) {
        debouncedUpdateAttendee(primaryAttendee.attendeeId, { 
          grand_lodge_id: selectedGrandLodge ? Number(selectedGrandLodge) : 0,
          lodge_id: lodgeId ? Number(lodgeId) : 0,
          lodgeNameNumber: lodgeName,
        });
      }
    }
  }, [primaryAttendee, debouncedUpdateAttendee, selectedGrandLodge, selectedLodge]);

  // Track if we're initializing from draft to prevent clearing Lodge
  const isInitializingFromDraftRef = React.useRef(true);
  
  // Update Grand Lodge for primary attendee
  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    if (selectedGrandLodge !== grandLodgeId) {
      const previousGrandLodge = selectedGrandLodge;
      setSelectedGrandLodge(grandLodgeId);
      
      // Check if we should preserve the Lodge selection
      const shouldPreserveLodge = isInitializingFromDraftRef.current && 
                                 primaryAttendee?.lodge_id && 
                                 Number(primaryAttendee?.grand_lodge_id) === Number(grandLodgeId);
      
      // Only clear Lodge selection if:
      // 1. We're not initializing from draft, OR
      // 2. We're actually changing to a different Grand Lodge
      if (!shouldPreserveLodge && previousGrandLodge) {
        setSelectedLodge('');
      }
      
      if (primaryAttendee) {
        const updates: any = { 
          grand_lodge_id: grandLodgeId ? Number(grandLodgeId) : 0,
        };
        
        // Only clear lodge data if we're not preserving it
        if (!shouldPreserveLodge && previousGrandLodge) {
          updates.lodge_id = 0;
          updates.lodgeNameNumber = '';
        }
        
        debouncedUpdateAttendee(primaryAttendee.attendeeId, updates);
      }
      
      // After first initialization, set flag to false
      if (isInitializingFromDraftRef.current) {
        setTimeout(() => {
          isInitializingFromDraftRef.current = false;
        }, 1000);
      }
    }
  }, [primaryAttendee, debouncedUpdateAttendee, selectedGrandLodge]);

  // Field change handler for BookingContactSection
  // Use primaryAttendeeId instead of primaryAttendee to reduce dependency changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    if (primaryAttendeeId) {
      debouncedUpdateAttendee(primaryAttendeeId, { [field]: value });
    }
  }, [debouncedUpdateAttendee, primaryAttendeeId]);

  const handleFieldChangeImmediate = useCallback((field: string, value: any) => {
    if (primaryAttendeeId) {
      updateAttendeeImmediate(primaryAttendeeId, { [field]: value });
    }
  }, [updateAttendeeImmediate, primaryAttendeeId]);

  // Validate and complete
  const handleComplete = useCallback(() => {
    formSaveManager.saveBeforeNavigation().then(() => {
      if (!selectedGrandLodge) {
        alert('Please select a Grand Lodge');
        return;
      }
      
      if (!selectedLodge) {
        alert('Please select a Lodge');
        return;
      }
      
      if (tableCount < minTables) {
        alert(`At least ${minTables} table${minTables > 1 ? 's' : ''} must be ordered`);
        return;
      }
      
      if (!primaryAttendee || !primaryAttendee.firstName || !primaryAttendee.lastName) {
        alert('Please complete the booking contact details');
        return;
      }
      
      // Store final table order
      if (setLodgeTicketOrder) {
        setLodgeTicketOrder({
          tableCount,
          totalTickets: tableCount * tableSize,
          galaDinnerTickets: tableCount * tableSize,
          ceremonyTickets: tableCount * tableSize,
          eventId: functionTickets[0]?.event_id || '',
          galaDinnerEventId: functionTickets.find(t => t.name.toLowerCase().includes('gala') || t.name.toLowerCase().includes('dinner'))?.event_id || '',
          ceremonyEventId: functionTickets.find(t => t.name.toLowerCase().includes('ceremony') || t.name.toLowerCase().includes('installation'))?.event_id || '',
        });
      }
      
      if (onComplete) {
        onComplete();
      }
    });
  }, [selectedGrandLodge, selectedLodge, tableCount, minTables, primaryAttendee, onComplete, setLodgeTicketOrder]);

  // Show loading state
  if (isLoadingData) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading function data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show error state
  if (dataError) {
    return (
      <div className={cn("space-y-6", className)}>
        <Alert className="border-red-200 bg-red-50">
          <Info className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Error loading function data: {dataError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Lodge Selection with integrated Booking Contact */}
      <div className="relative">
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Building className="w-5 h-5" />
              Your Lodge
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              These details will be applied to all members in this registration
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Lodge Selection Fields */}
            <div className="grid md:grid-cols-2 gap-6">
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
              
              <div className="space-y-2">
                <LodgeSelection 
                  grand_lodge_id={selectedGrandLodge}
                  value={selectedLodge}
                  onChange={(lodgeId, lodgeName) => handleLodgeChange(lodgeId, lodgeName ?? '')}
                  disabled={!selectedGrandLodge}
                />
                {selectedGrandLodge && !selectedLodge && (
                  <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    Required to proceed
                  </p>
                )}
              </div>
            </div>
            
            {/* Booking Contact Details */}
            {primaryAttendee && (
              <BookingContactDetails
                primaryAttendee={primaryAttendee}
                handleFieldChange={handleFieldChange}
                handleFieldChangeImmediate={handleFieldChangeImmediate}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table Order Section */}
      <Card className={cn(
        "border-2 border-primary/20 transition-opacity duration-300",
        !selectedLodge && "opacity-70"
      )}>
        <CardHeader className="py-4 px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-primary font-medium text-lg">
              <ShoppingCart className="w-5 h-5" />
              Table Order
            </CardTitle>
            <Badge className="bg-blue-100 text-blue-800 border-0">
              Grand Proclamation 2025
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* 2-Column Layout */}
          <div className="grid grid-cols-2 gap-8">
            {/* Column 1: Ticket Selection (from ticket-selection-step) */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg mb-4">Available Packages</h3>
              
              {/* Dynamic Package Display */}
              {lodgePackage ? (
                <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h4 className="font-medium">{lodgePackage.name}</h4>
                      </div>
                      {lodgePackage.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {lodgePackage.description}
                        </p>
                      )}
                      {lodgePackage.includes_description && lodgePackage.includes_description.length > 0 && (
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          {lodgePackage.includes_description.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-600" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${tablePrice.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">per table</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Info className="w-4 h-4" />
                    <p className="text-sm">
                      {isLoadingData ? 'Loading package information...' : 'No lodge packages available'}
                    </p>
                  </div>
                </div>
              )}

              {/* Info about the package */}
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  Each table seats {tableSize} attendees. Purchase multiple tables for larger groups.
                  Attendee details can be provided later.
                </AlertDescription>
              </Alert>
            </div>

            {/* Column 2: Table Selection and Order Summary */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="table-count" className="text-base font-medium mb-2 block">
                  Number of Tables
                </Label>
                <AttendeeCounter
                  id="table-count"
                  label=""
                  value={tableCount}
                  min={minTables}
                  max={maxTables}
                  onChange={handleTableCountChange}
                  disabled={!selectedLodge}
                />
                <p className="text-sm text-gray-600 mt-2">
                  {tableCount} {tableCount === 1 ? 'table' : 'tables'} = {tableCount * tableSize} attendees
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h4 className="font-medium text-lg">Order Summary</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tables</span>
                    <span className="font-medium">{tableCount} × $1,950</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Total Attendees</span>
                    <span>{tableOrder.totalTickets} people</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Ceremony Tickets</span>
                      <span>{tableOrder.totalTickets} × $50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gala Dinner Tickets</span>
                      <span>{tableOrder.totalTickets} × $145</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">
                      ${tableOrder.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendee Allocation Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Attendee Details
                </h4>
                <p className="text-sm text-amber-800">
                  Attendee names and details will be requested closer to the event date.
                  All attendees will automatically inherit your lodge information.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Complete Button */}
      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={handleComplete}
          disabled={!selectedGrandLodge || !selectedLodge || !primaryAttendee?.firstName || !primaryAttendee?.lastName}
        >
          Continue to Next Step
        </Button>
      </div>
    </div>
  );
};

// Summary view for lodge table orders
export const LodgeFormSummary: React.FC = () => {
  const { attendees, lodgeTicketOrder } = useRegistrationStore();
  
  const primaryAttendee = attendees.find(a => a.isPrimary);
  const lodgeDetails = primaryAttendee?.lodgeNameNumber || 'Lodge';

  if (!lodgeTicketOrder) {
    return null;
  }

  // Calculate price per table - since LodgeTicketOrder doesn't have totalPrice, calculate it
  const pricePerTable = 1950; // This would need to be fetched from package data in a real implementation

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Lodge Bulk Order Summary</h3>
      
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div>
              <p className="font-medium text-lg">{lodgeDetails}</p>
              <p className="text-sm text-gray-600">
                Contact: {primaryAttendee?.title} {primaryAttendee?.firstName} {primaryAttendee?.lastName}
              </p>
            </div>
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tables Ordered</span>
                <span className="font-medium">{lodgeTicketOrder.tableCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Tickets</span>
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
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-bold text-primary">
                  ${(lodgeTicketOrder.tableCount * pricePerTable).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 text-sm">
          Attendee details can be allocated to these tickets at any time before the event.
        </AlertDescription>
      </Alert>
    </div>
  );
};

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