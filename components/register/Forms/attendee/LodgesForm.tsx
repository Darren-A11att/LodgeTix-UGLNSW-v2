import React, { useCallback, useEffect, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, ShoppingCart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import formSaveManager from '@/lib/formSaveManager';
import { useDebouncedCallback } from 'use-debounce';

// Import our new extracted components
import {
  BookingContactSection,
  AttendeeCounter,
  LodgeSelectionCard,
} from './components';

// Constants for form behavior
const DEBOUNCE_DELAY = 300;

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
  const [lodgeName, setLodgeName] = useState('');
  const [primaryAttendeeId, setPrimaryAttendeeId] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState(1);
  const [tableOrder, setTableOrder] = useState<TableOrder>({
    tableCount: 1,
    totalTickets: TABLE_SIZE,
    totalPrice: TABLE_PRICE
  });
  
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

  // One-time initialization
  const isInitializedRef = React.useRef(false);
  
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      if (!primaryAttendeeId) {
        const primaryId = addMasonAttendee();
        updateAttendeeImmediate(primaryId, {
          isPrimary: true,
          attendeeType: 'Mason',
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
      
      if (primaryAttendee) {
        debouncedUpdateAttendee(primaryAttendee.attendeeId, { 
          grandLodgeId: selectedGrandLodge ? Number(selectedGrandLodge) : 0,
          lodgeId: lodgeId ? Number(lodgeId) : 0,
          lodgeNameNumber: lodgeName,
        });
      }
    }
  }, [primaryAttendee, debouncedUpdateAttendee, selectedGrandLodge, selectedLodge]);

  // Update Grand Lodge for primary attendee
  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    if (selectedGrandLodge !== grandLodgeId) {
      setSelectedGrandLodge(grandLodgeId);
      setSelectedLodge('');
      setLodgeName('');
      
      if (primaryAttendee) {
        debouncedUpdateAttendee(primaryAttendee.attendeeId, { 
          grandLodgeId: grandLodgeId ? Number(grandLodgeId) : 0,
          lodgeId: 0,
          lodgeNameNumber: '',
        });
      }
    }
  }, [primaryAttendee, debouncedUpdateAttendee, selectedGrandLodge]);

  // Field change handler for BookingContactSection
  const handleFieldChange = useCallback((field: string, value: any) => {
    if (primaryAttendee) {
      debouncedUpdateAttendee(primaryAttendee.attendeeId, { [field]: value });
    }
  }, [debouncedUpdateAttendee, primaryAttendee]);

  const handleFieldChangeImmediate = useCallback((field: string, value: any) => {
    if (primaryAttendee) {
      updateAttendeeImmediate(primaryAttendee.attendeeId, { [field]: value });
    }
  }, [updateAttendeeImmediate, primaryAttendee]);

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
      {/* Lodge Selection Card */}
      <LodgeSelectionCard
        selectedGrandLodge={selectedGrandLodge}
        selectedLodge={selectedLodge}
        onGrandLodgeChange={handleGrandLodgeChange}
        onLodgeChange={handleLodgeChange}
        disabled={false}
      />

      {/* Booking Contact Section */}
      {primaryAttendee && selectedLodge && (
        <Card>
          <CardContent className="pt-0">
            <BookingContactSection
              attendee={primaryAttendee}
              onFieldChange={handleFieldChange}
              onFieldChangeImmediate={handleFieldChangeImmediate}
              disabled={!selectedLodge}
            />
          </CardContent>
        </Card>
      )}

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
          {/* Info Alert */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Early Bird Special:</strong> Purchase tables now and allocate attendees later. 
              Each table includes 10 tickets to both the Gala Dinner and Ceremony.
            </AlertDescription>
          </Alert>

          {/* Table Selection */}
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
                Each table seats 10 people
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h4 className="font-medium text-lg">Order Summary</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tables ({tableCount} × $1,950)</span>
                  <span className="font-medium">${(tableCount * TABLE_PRICE).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Total Tickets</span>
                  <span>{tableOrder.totalTickets} tickets</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Gala Dinner Tickets</span>
                  <span>{tableOrder.totalTickets} × $145</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Ceremony Tickets</span>
                  <span>{tableOrder.totalTickets} × $50</span>
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
                You can allocate specific attendees to your purchased tickets at any time before the event. 
                All attendees will automatically inherit your lodge details.
              </p>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleComplete}
              disabled={!selectedLodge || tableCount < minTables}
              className="w-full py-6 text-lg bg-[#0a2059] hover:bg-[#0c2669]"
            >
              Continue to Payment
            </Button>
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