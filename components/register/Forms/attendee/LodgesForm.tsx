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
import { getFunctionTicketsService, FunctionTicketDefinition, FunctionPackage } from '@/lib/services/function-tickets-service';
import { getEnvironmentConfig } from '@/lib/config/environment';
import { calculateStripeFees, getFeeDisclaimer, getFeeModeFromEnv, getPlatformFeePercentage, getProcessingFeeLabel, isDomesticCard } from '@/lib/utils/stripe-fee-calculator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

// Constants for form behavior only
// Package and event data will be fetched dynamically from database

interface LodgesFormProps {
  functionId: string;
  minPackages?: number;
  maxPackages?: number;
  onComplete?: () => void;
  className?: string;
  fieldErrors?: Record<string, Record<string, string>>;
}

interface PackageOrder {
  packageCount: number;
  totalTickets: number;
  totalPrice: number;
  stripeFee: number;
  totalWithFees: number;
}

export const LodgesForm: React.FC<LodgesFormProps> = ({
  functionId,
  minPackages = 1,
  maxPackages = 10,
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
  
  // Dynamic data state
  const [functionTickets, setFunctionTickets] = useState<FunctionTicketDefinition[]>([]);
  const [functionPackages, setFunctionPackages] = useState<FunctionPackage[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Derived values from fetched data - filter for packages with "lodges" registration type
  const lodgePackages = functionPackages.filter(pkg => 
    pkg.eligibleRegistrationTypes.includes('lodges')
  );
  
  // Local state for UI only
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [packageCount, setPackageCount] = useState(1);
  
  // Get selected package or use first available
  const selectedPackage = selectedPackageId 
    ? lodgePackages.find(pkg => pkg.id === selectedPackageId) || lodgePackages[0]
    : lodgePackages[0];
    
  const baseQuantity = selectedPackage?.qty || 10; // Use package qty as base quantity
  const packagePrice = selectedPackage?.price || 1950; // fallback price
  
  const [calculatedPackageOrder, setCalculatedPackageOrder] = useState<PackageOrder>({
    packageCount: 1,
    totalTickets: baseQuantity,
    totalPrice: packagePrice,
    stripeFee: 0,
    totalWithFees: packagePrice
  });

  // Fetch function tickets and packages data
  useEffect(() => {
    const fetchFunctionData = async () => {
      try {
        setIsLoadingData(true);
        setDataError(null);
        
        if (!functionId) {
          throw new Error('No function ID provided to LodgesForm');
        }
        
        const ticketsService = getFunctionTicketsService();
        const { tickets, packages } = await ticketsService.getFunctionTicketsAndPackages(functionId);
        
        setFunctionTickets(tickets);
        setFunctionPackages(packages);
        
        // Debug log to see what packages are available
        console.log('All packages fetched:', packages);
        console.log('Package eligibility types:', packages.map(p => ({
          name: p.name,
          eligibleRegistrationTypes: p.eligibleRegistrationTypes
        })));
        
        // Auto-select first lodge package if available
        const lodgePackagesFound = packages.filter(pkg => 
          pkg.eligibleRegistrationTypes.includes('lodges')
        );
        console.log('Lodge packages found:', lodgePackagesFound);
        
        if (lodgePackagesFound.length > 0 && !selectedPackageId) {
          setSelectedPackageId(lodgePackagesFound[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch function data:', error);
        setDataError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchFunctionData();
  }, [functionId]);
  
  // Update package order when count or package data changes
  useEffect(() => {
    const subtotal = packageCount * packagePrice;
    
    // Calculate Stripe fees
    const feeCalculation = calculateStripeFees(subtotal, {
      isDomestic: true, // Default to domestic for Australian lodges
      feeMode: getFeeModeFromEnv(),
      platformFeePercentage: getPlatformFeePercentage()
    });
    
    setCalculatedPackageOrder({
      packageCount,
      totalTickets: packageCount * baseQuantity,
      totalPrice: subtotal,
      stripeFee: feeCalculation.stripeFee,
      totalWithFees: feeCalculation.total
    });
  }, [packageCount, baseQuantity, packagePrice]);

  // Set initial package order in store when component mounts or package data changes
  useEffect(() => {
    if (setLodgeTicketOrder && baseQuantity > 0 && functionTickets.length > 0) {
      setLodgeTicketOrder({
        tableCount: packageCount,
        totalTickets: packageCount * baseQuantity,
        galaDinnerTickets: packageCount * baseQuantity,
        ceremonyTickets: packageCount * baseQuantity,
        eventId: functionTickets[0]?.event_id || '',
        galaDinnerEventId: functionTickets.find(t => t.name.toLowerCase().includes('gala') || t.name.toLowerCase().includes('dinner'))?.event_id || '',
        ceremonyEventId: functionTickets.find(t => t.name.toLowerCase().includes('ceremony') || t.name.toLowerCase().includes('installation'))?.event_id || '',
      });
    }
  }, [packageCount, baseQuantity, functionTickets, setLodgeTicketOrder]);

  // Update package count
  const handlePackageCountChange = useCallback((newCount: number) => {
    if (newCount >= minPackages && newCount <= maxPackages) {
      setPackageCount(newCount);
      // Store the package order in the registration store
      if (setLodgeTicketOrder) {
        setLodgeTicketOrder({
          tableCount: newCount, // Keep as tableCount for backward compatibility
          totalTickets: newCount * baseQuantity,
          galaDinnerTickets: newCount * baseQuantity,
          ceremonyTickets: newCount * baseQuantity,
          eventId: functionTickets[0]?.event_id || '',
          galaDinnerEventId: functionTickets.find(t => t.name.toLowerCase().includes('gala') || t.name.toLowerCase().includes('dinner'))?.event_id || '',
          ceremonyEventId: functionTickets.find(t => t.name.toLowerCase().includes('ceremony') || t.name.toLowerCase().includes('installation'))?.event_id || '',
        });
      }
    }
  }, [minPackages, maxPackages, setLodgeTicketOrder, baseQuantity, functionTickets]);

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
    
    if (packageCount < minPackages) {
      alert(`At least ${minPackages} package${minPackages > 1 ? 's' : ''} must be ordered`);
      return;
    }
    
    // Store final package order
    if (setLodgeTicketOrder) {
      setLodgeTicketOrder({
        tableCount: packageCount, // Keep as tableCount for backward compatibility
        totalTickets: packageCount * baseQuantity,
        galaDinnerTickets: packageCount * baseQuantity,
        ceremonyTickets: packageCount * baseQuantity,
        eventId: functionTickets[0]?.event_id || '',
        galaDinnerEventId: functionTickets.find(t => t.name.toLowerCase().includes('gala') || t.name.toLowerCase().includes('dinner'))?.event_id || '',
        ceremonyEventId: functionTickets.find(t => t.name.toLowerCase().includes('ceremony') || t.name.toLowerCase().includes('installation'))?.event_id || '',
      });
    }
    
    if (onComplete) {
      onComplete();
    }
  }, [isValid, getValidationErrors, packageCount, minPackages, onComplete, setLodgeTicketOrder, baseQuantity, functionTickets]);

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

      {/* Package Order Section */}
      <Card className={cn(
        "border-2 border-primary/20 transition-opacity duration-300",
        !lodgeDetails.lodge_id && "opacity-70"
      )}>
        <CardHeader className="py-4 px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-primary font-medium text-lg">
              <ShoppingCart className="w-5 h-5" />
              Lodge Package Order
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
              {lodgePackages.length > 0 ? (
                <div className="space-y-3">
                  {lodgePackages.map((pkg) => (
                    <div 
                      key={pkg.id}
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer transition-all",
                        selectedPackage?.id === pkg.id 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => setSelectedPackageId(pkg.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {selectedPackage?.id === pkg.id && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                            <Package className="w-5 h-5 text-primary" />
                            <h4 className="font-medium">{pkg.name}</h4>
                          </div>
                          {pkg.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {pkg.description}
                            </p>
                          )}
                          {pkg.includes_description && pkg.includes_description.length > 0 && (
                            <ul className="text-sm text-gray-600 space-y-1 ml-4">
                              {pkg.includes_description.map((item, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-green-600" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <span className="text-blue-800 font-medium">
                              Base Quantity: {pkg.qty || 10} tickets per package
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">${pkg.price.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">per package</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-4 border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Info className="w-4 h-4" />
                    <p className="text-sm">
                      {isLoadingData ? 'Loading package information...' : 
                       functionPackages.length > 0 ? 
                         'No packages available for lodge registrations. Please contact support.' :
                         'No packages found. Please check your configuration.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Package Selection - moved from column 2 */}
              <div className="mt-4">
                <Label htmlFor="package-count" className="text-base font-medium mb-2 block">
                  Number of Packages
                </Label>
                <AttendeeCounter
                  id="package-count"
                  label=""
                  value={packageCount}
                  min={minPackages}
                  max={maxPackages}
                  onChange={handlePackageCountChange}
                  disabled={!lodgeDetails.lodge_id}
                />
                <p className="text-sm text-gray-600 mt-2">
                  {packageCount} {packageCount === 1 ? 'package' : 'packages'} = {packageCount * baseQuantity} tickets
                </p>
              </div>
            </div>

            {/* Column 2: Order Summary */}
            <div className="space-y-6">

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h4 className="font-medium text-lg">Order Summary</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Packages</span>
                    <span className="font-medium">{packageCount} × ${packagePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Total Tickets</span>
                    <span>{calculatedPackageOrder.totalTickets} tickets</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Base Quantity per Package</span>
                    <span>{baseQuantity} tickets</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Ceremony Tickets</span>
                      <span>{calculatedPackageOrder.totalTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Gala Dinner Tickets</span>
                      <span>{calculatedPackageOrder.totalTickets}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      ${calculatedPackageOrder.totalPrice.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Processing Fee */}
                  {getFeeModeFromEnv() === 'pass_to_customer' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        {getProcessingFeeLabel(true)}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{getFeeDisclaimer()}</p>
                              <div className="mt-2 text-xs space-y-1">
                                <p>• Australian cards: 1.75% + $0.30</p>
                                <p>• International cards: 2.9% + $0.30</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                      <span className="font-medium">
                        ${calculatedPackageOrder.stripeFee.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Total Amount */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-primary">
                        ${calculatedPackageOrder.totalWithFees.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Fee disclaimer */}
                {getFeeModeFromEnv() === 'pass_to_customer' && (
                  <div className="text-xs text-gray-500 pt-2">
                    {getFeeDisclaimer()}
                  </div>
                )}
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

  // Calculate fees for the summary
  const subtotal = lodgeTicketOrder.tableCount * 1950;
  const feeCalculation = calculateStripeFees(subtotal, {
    isDomestic: true, // Default to domestic for Australian lodges
    feeMode: getFeeModeFromEnv(),
    platformFeePercentage: getPlatformFeePercentage()
  });

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
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toLocaleString()}</span>
              </div>
              
              {getFeeModeFromEnv() === 'pass_to_customer' && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Processing Fee</span>
                  <span className="font-medium">${feeCalculation.stripeFee.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-bold text-primary">
                  ${feeCalculation.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

