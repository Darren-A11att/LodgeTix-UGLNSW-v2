import React, { useCallback, useEffect, useState } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { useLodgeRegistrationStore } from '@/lib/lodgeRegistrationStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, ShoppingCart, Users, Package, Check, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import formSaveManager from '@/lib/formSaveManager';

// Import form components
import { GrandLodgeSelection } from '../mason/lib/GrandLodgeSelection';
import { LodgeSelection } from '../mason/lib/LodgeSelection';

// Import our new extracted components
import {
  BookingContactSection,
  AttendeeCounter,
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
  fieldErrors?: Record<string, Record<string, string>>;
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
  fieldErrors = {},
}) => {
  const { 
    setLodgeTicketOrder,
  } = useRegistrationStore();
  
  const {
    customer,
    lodgeDetails,
    tableOrder,
    updateCustomer,
    updateLodgeDetails,
    updateTableOrder,
    isValid,
    getValidationErrors,
  } = useLodgeRegistrationStore();
  
  // Get field errors for customer fields
  const customerFieldErrors = fieldErrors['customer'] || {};
  
  // Local state for UI only
  const [tableCount, setTableCount] = useState(1);
  const [calculatedTableOrder, setCalculatedTableOrder] = useState<TableOrder>({
    tableCount: 1,
    totalTickets: TABLE_SIZE,
    totalPrice: TABLE_PRICE
  });

  // Update table order when count changes
  useEffect(() => {
    setCalculatedTableOrder({
      tableCount,
      totalTickets: tableCount * TABLE_SIZE,
      totalPrice: tableCount * TABLE_PRICE
    });
  }, [tableCount]);

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

  // Update lodge details
  const handleLodgeChange = useCallback((lodgeId: string, lodgeName: string) => {
    updateLodgeDetails({
      lodge_id: lodgeId,
      lodgeName,
    });
  }, [updateLodgeDetails]);

  // Update Grand Lodge
  const handleGrandLodgeChange = useCallback((grandLodgeId: string) => {
    updateLodgeDetails({
      grand_lodge_id: grandLodgeId,
      // Clear lodge when grand lodge changes
      lodge_id: '',
      lodgeName: '',
    });
  }, [updateLodgeDetails]);

  // No field change handlers needed - BookingContactSection will use lodge store directly

  // Validate and complete
  const handleComplete = useCallback(() => {
    if (!isValid()) {
      const errors = getValidationErrors();
      alert('Please complete all required fields:\n' + errors.join('\n'));
      return;
    }
    
    if (tableCount < minTables) {
      alert(`At least ${minTables} table${minTables > 1 ? 's' : ''} must be ordered`);
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
  }, [isValid, getValidationErrors, tableCount, minTables, onComplete, setLodgeTicketOrder]);

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
                  value={lodgeDetails.grand_lodge_id}
                  onChange={handleGrandLodgeChange}
                />
                {!lodgeDetails.grand_lodge_id && (
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
                  grand_lodge_id={lodgeDetails.grand_lodge_id}
                  value={lodgeDetails.lodge_id}
                  onChange={(lodgeId, lodgeName) => handleLodgeChange(lodgeId, lodgeName ?? '')}
                  disabled={!lodgeDetails.grand_lodge_id}
                />
                {lodgeDetails.grand_lodge_id && !lodgeDetails.lodge_id && (
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
            <BookingContactSection mode="customer" fieldErrors={customerFieldErrors} />
          </CardContent>
        </Card>
      </div>

      {/* Table Order Section */}
      <Card className={cn(
        "border-2 border-primary/20 transition-opacity duration-300",
        !lodgeDetails.lodge_id && "opacity-70"
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
                  disabled={!lodgeDetails.lodge_id}
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
                    <span>{calculatedTableOrder.totalTickets} people</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Ceremony Tickets</span>
                      <span>{calculatedTableOrder.totalTickets} × $50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gala Dinner Tickets</span>
                      <span>{calculatedTableOrder.totalTickets} × $145</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">
                      ${calculatedTableOrder.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
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
  const { billingDetails, lodgeTicketOrder } = useRegistrationStore();
  
  const lodgeDetails = billingDetails?.businessName || 'Lodge';

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
                Contact: {billingDetails?.title} {billingDetails?.firstName} {billingDetails?.lastName}
              </p>
              {billingDetails?.email && (
                <p className="text-sm text-gray-600">Email: {billingDetails.email}</p>
              )}
              {billingDetails?.phone && (
                <p className="text-sm text-gray-600">Phone: {billingDetails.phone}</p>
              )}
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
    </div>
  );
};

