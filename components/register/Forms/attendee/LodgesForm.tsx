import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, ShoppingCart, Users, Package, Check, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import formSaveManager from '@/lib/formSaveManager';
import { useAttendeeDataWithDebounce } from './lib/useAttendeeData';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Import form components
import { BasicInfo } from '../basic-details/BasicInfo';
import { ContactInfo } from '../basic-details/ContactInfo';
import { GrandOfficerFields } from '../mason/utils/GrandOfficerFields';
import { GrandOfficerDropdown } from '../shared/GrandOfficerDropdown';
import { MASON_TITLES, MASON_RANKS, GRAND_OFFICER_ROLES } from '../attendee/utils/constants';
import { GrandLodgeSelection } from '../mason/lib/GrandLodgeSelection';
import { LodgeSelection } from '../mason/lib/LodgeSelection';

// Import our new extracted components
import {
  BookingContactSection,
  AttendeeCounter,
  LodgeSelectionCard,
} from './components';

// Constants for form behavior
const DEBOUNCE_DELAY = 300; // 300ms debounce for store updates - matching MasonForm

// Event and ticket IDs for Grand Proclamation 2025
const EVENT_IDS = {
  GRAND_PROCLAMATION: '307c2d85-72d5-48cf-ac94-082ca2a5d23d',
  GALA_DINNER: '03a51924-1606-47c9-838d-9dc32657cd59',
  CEREMONY: '6c12952b-7cf3-4d6a-81bd-1ac3b7ff7076'
};

// Table package configuration (10 tickets per table)
const TABLE_SIZE = 10;
const TABLE_PRICE = 1950; // $195 per ticket x 10 = $1950 per table

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
    setLodgeTicketOrder,
  } = useRegistrationStore();
  
  // State for primary attendee tracking
  const [primaryAttendeeId, setPrimaryAttendeeId] = useState<string | null>(null);
  
  // Get the primary attendee from store or find the first one
  const primaryAttendee = attendees.find(a => a.isPrimary) || attendees[0];
  
  // Use the same pattern as MasonForm with useAttendeeDataWithDebounce
  const { 
    attendee: primaryAttendeeData, 
    updateField, 
    updateFieldImmediate,
    updateMultipleFields,
    updateMultipleFieldsImmediate 
  } = useAttendeeDataWithDebounce(primaryAttendee?.attendeeId || '', DEBOUNCE_DELAY);
  
  // Local state for UI
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<string>('');
  const [selectedLodge, setSelectedLodge] = useState<string>('');
  const [lodgeName, setLodgeName] = useState('');
  const [tableCount, setTableCount] = useState(1);
  const [tableOrder, setTableOrder] = useState<TableOrder>({
    tableCount: 1,
    totalTickets: TABLE_SIZE,
    totalPrice: TABLE_PRICE
  });

  // Update table order when count changes
  useEffect(() => {
    setTableOrder({
      tableCount,
      totalTickets: tableCount * TABLE_SIZE,
      totalPrice: tableCount * TABLE_PRICE
    });
  }, [tableCount]);
  
  // Initialize Grand Lodge and Lodge from primary attendee when loaded
  useEffect(() => {
    if (primaryAttendeeData && !selectedGrandLodge && primaryAttendeeData.grandLodgeId) {
      // Initialize Grand Lodge
      setSelectedGrandLodge(String(primaryAttendeeData.grandLodgeId));
      
      // Initialize Lodge if available
      if (primaryAttendeeData.lodgeId) {
        setSelectedLodge(String(primaryAttendeeData.lodgeId));
        if (primaryAttendeeData.lodgeNameNumber) {
          setLodgeName(primaryAttendeeData.lodgeNameNumber);
        }
      }
    }
  }, [primaryAttendeeData, selectedGrandLodge]);

  // One-time initialization - ensure we have a primary attendee
  const isInitializedRef = React.useRef(false);
  
  useEffect(() => {
    if (!isInitializedRef.current && attendees.length === 0) {
      isInitializedRef.current = true;
      
      const primaryId = addMasonAttendee();
      setPrimaryAttendeeId(primaryId);
      
      // Use immediate update to set initial values
      setTimeout(() => {
        const store = useRegistrationStore.getState();
        store.updateAttendee(primaryId, {
          isPrimary: true,
          attendeeType: 'Mason',
        });
      }, 0);
    } else if (primaryAttendee && !primaryAttendeeId) {
      setPrimaryAttendeeId(primaryAttendee.attendeeId);
    }
  }, [attendees.length, addMasonAttendee, primaryAttendee, primaryAttendeeId]);

  // Update table count
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

  // Update lodge details for primary attendee
  const handleLodgeChange = useCallback((lodgeId: string, lodgeName: string) => {
    if (selectedLodge !== lodgeId) {
      setSelectedLodge(lodgeId);
      setLodgeName(lodgeName);
      
      if (primaryAttendeeData) {
        updateField('grandLodgeId', selectedGrandLodge ? Number(selectedGrandLodge) : 0);
        updateField('lodgeId', lodgeId ? Number(lodgeId) : 0);
        updateField('lodgeNameNumber', lodgeName);
      }
    }
  }, [primaryAttendeeData, updateField, selectedGrandLodge, selectedLodge]);

  // Track if we're initializing from draft to prevent clearing Lodge
  const isInitializingFromDraftRef = React.useRef(true);
  
  // Update Grand Lodge for primary attendee
  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    if (selectedGrandLodge !== grandLodgeId) {
      const previousGrandLodge = selectedGrandLodge;
      setSelectedGrandLodge(grandLodgeId);
      
      // Check if we should preserve the Lodge selection
      const shouldPreserveLodge = isInitializingFromDraftRef.current && 
                                 primaryAttendeeData?.lodgeId && 
                                 Number(primaryAttendeeData?.grandLodgeId) === Number(grandLodgeId);
      
      // Only clear Lodge selection if:
      // 1. We're not initializing from draft, OR
      // 2. We're actually changing to a different Grand Lodge
      if (!shouldPreserveLodge && previousGrandLodge) {
        setSelectedLodge('');
        setLodgeName('');
      }
      
      if (primaryAttendeeData) {
        // Use immediate update for critical fields
        updateFieldImmediate('grandLodgeId', grandLodgeId ? Number(grandLodgeId) : 0);
        
        // Only clear lodge data if we're not preserving it
        if (!shouldPreserveLodge && previousGrandLodge) {
          updateFieldImmediate('lodgeId', 0);
          updateFieldImmediate('lodgeNameNumber', '');
        }
      }
      
      // After first initialization, set flag to false
      if (isInitializingFromDraftRef.current) {
        setTimeout(() => {
          isInitializingFromDraftRef.current = false;
        }, 1000);
      }
    }
  }, [primaryAttendeeData, updateFieldImmediate, selectedGrandLodge]);

  // Field change handler for BookingContactSection
  const handleFieldChange = useCallback((field: string, value: any) => {
    updateField(field, value);
  }, [updateField]);

  const handleFieldChangeImmediate = useCallback((field: string, value: any) => {
    updateFieldImmediate(field, value);
  }, [updateFieldImmediate]);

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
      
      if (!primaryAttendeeData || !primaryAttendeeData.firstName || !primaryAttendeeData.lastName) {
        alert('Please complete the booking contact details');
        return;
      }
      
      // Store final table order
      if (setLodgeTicketOrder) {
        setLodgeTicketOrder({
          tableCount,
          totalTickets: tableCount * TABLE_SIZE,
          galaDinnerTickets: tableCount * TABLE_SIZE,
          ceremonyTickets: tableCount * TABLE_SIZE,
          eventId: EVENT_IDS.GRAND_PROCLAMATION,
          galaDinnerEventId: EVENT_IDS.GALA_DINNER,
          ceremonyEventId: EVENT_IDS.CEREMONY,
        });
      }
      
      if (onComplete) {
        onComplete();
      }
    });
  }, [selectedGrandLodge, selectedLodge, tableCount, minTables, primaryAttendee, onComplete, setLodgeTicketOrder]);

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
                  grandLodgeId={selectedGrandLodge}
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
            {primaryAttendeeData && (
              <BookingContactSection
                attendee={primaryAttendeeData}
                onFieldChange={handleFieldChange}
                onFieldChangeImmediate={handleFieldChangeImmediate}
                updateOnBlur={true}
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
              
              {/* Grand Proclamation Package */}
              <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-primary" />
                      <h4 className="font-medium">Grand Proclamation Table</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Complete package for 10 attendees including:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Installation Ceremony (10 tickets)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Grand Banquet Gala Dinner (10 tickets)
                      </li>
                    </ul>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">$1,950</p>
                    <p className="text-sm text-gray-500">per table</p>
                  </div>
                </div>
              </div>

              {/* Info about the package */}
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  Each table seats 10 attendees. Purchase multiple tables for larger groups.
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
                  {tableCount} {tableCount === 1 ? 'table' : 'tables'} = {tableCount * TABLE_SIZE} attendees
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
                  ${(lodgeTicketOrder.tableCount * TABLE_PRICE).toLocaleString()}
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

