import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, ShoppingCart, Package, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getFeeDisclaimer, getProcessingFeeLabel } from '@/lib/utils/square-fee-calculator-client';
import { FunctionTicketDefinition, FunctionPackage } from '@/lib/services/function-tickets-service';
import { AttendeeCounter } from './AttendeeCounter';

interface PackageOrderCardProps {
  title?: string;
  disabled?: boolean;
  isLoadingData: boolean;
  dataError: string | null;
  packages: FunctionPackage[];
  selectedPackage: FunctionPackage | undefined;
  selectedPackageId: string | null;
  onPackageSelect?: (packageId: string) => void;
  packageCount: number;
  minPackages?: number;
  maxPackages?: number;
  onPackageCountChange: (count: number) => void;
  functionTickets: FunctionTicketDefinition[];
  calculatedPackageOrder: {
    packageCount: number;
    totalTickets: number;
    totalPrice: number;
    stripeFee: number;
    processingFeesDisplay: number;
    totalWithFees: number;
  };
  feeCalculation: any;
  feeLoading: boolean;
  baseQuantity: number;
  packagePrice: number;
  className?: string;
  showPackageSelection?: boolean;
}

export const PackageOrderCard: React.FC<PackageOrderCardProps> = ({
  title = "Package Order",
  disabled = false,
  isLoadingData,
  dataError,
  packages,
  selectedPackage,
  selectedPackageId,
  onPackageSelect,
  packageCount,
  minPackages = 1,
  maxPackages = 10,
  onPackageCountChange,
  functionTickets,
  calculatedPackageOrder,
  feeCalculation,
  feeLoading,
  baseQuantity,
  packagePrice,
  className,
  showPackageSelection = true,
}) => {
  return (
    <Card className={cn(
      "border-2 border-primary/20",
      disabled && "opacity-70",
      className
    )}>
      <CardHeader className="py-4 px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary font-medium text-lg">
            <ShoppingCart className="w-5 h-5" />
            {title}
          </CardTitle>
          <Badge className="bg-blue-100 text-blue-800 border-0">
            Grand Proclamation 2025
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 mr-2" />
            <span>Loading ticket information...</span>
          </div>
        ) : dataError ? (
          <Alert variant="destructive">
            <AlertDescription>{dataError}</AlertDescription>
          </Alert>
        ) : !selectedPackage && packages.length === 0 ? (
          <Alert variant="destructive">
            <AlertDescription>No packages available for this registration type.</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Column 1: Package Selection */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg mb-4">Available Packages</h3>
              
              {/* Dynamic Package Display */}
              {showPackageSelection && packages.length > 1 ? (
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <div 
                      key={pkg.id}
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer transition-all",
                        selectedPackage?.id === pkg.id 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => onPackageSelect?.(pkg.id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
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
                        <div className="text-left md:text-right">
                          <p className="text-2xl font-bold">${pkg.price.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">per package</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedPackage ? (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h4 className="font-medium">{selectedPackage.name}</h4>
                      </div>
                      {selectedPackage.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {selectedPackage.description}
                        </p>
                      )}
                      {selectedPackage.includes_description && selectedPackage.includes_description.length > 0 && (
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          {selectedPackage.includes_description.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-600" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <span className="text-blue-800 font-medium">
                          Base Quantity: {selectedPackage.qty || 10} tickets per package
                        </span>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-2xl font-bold">${selectedPackage.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">per package</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Info className="w-4 h-4" />
                    <p className="text-sm">
                      No packages available. Please check your configuration.
                    </p>
                  </div>
                </div>
              )}

              {/* Package Selection */}
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
                  onChange={onPackageCountChange}
                  disabled={disabled}
                />
                <p className="text-sm text-gray-600 mt-2">
                  {packageCount} {packageCount === 1 ? 'package' : 'packages'} = {packageCount * baseQuantity} tickets
                </p>
              </div>
            </div>

            {/* Column 2: Order Summary */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 md:p-6 space-y-4">
                <h4 className="font-medium text-lg">Order Summary</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Packages</span>
                    <span className="font-medium">{packageCount} × ${packagePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Base Quantity per Package</span>
                    <span>{baseQuantity} tickets</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="text-sm text-gray-600">
                    {/* Dynamic display of included event tickets */}
                    {(() => {
                      // First, check if includes array exists and has items
                      if (!selectedPackage?.includes || !Array.isArray(selectedPackage.includes) || selectedPackage.includes.length === 0) {
                        return (
                          <div className="text-center text-gray-500 py-2">
                            <p className="text-sm">Package includes {calculatedPackageOrder.totalTickets} tickets</p>
                          </div>
                        );
                      }

                      // Filter out valid ticket mappings
                      const ticketMappings = selectedPackage.includes
                        .map((includedItem, index) => {
                          // Handle both string IDs and object structures
                          let ticketId: string = '';
                          
                          if (typeof includedItem === 'string') {
                            ticketId = includedItem;
                          } else if (includedItem && typeof includedItem === 'object') {
                            // If it's an object, try to find the ID property
                            // Try different possible property names
                            ticketId = (includedItem as any).event_ticket_id || 
                                      (includedItem as any).ticket_id || 
                                      (includedItem as any).id || 
                                      '';
                          }
                          
                          // Skip if we couldn't extract a valid ID
                          if (!ticketId) return null;
                          
                          // Find the corresponding ticket details
                          const ticket = functionTickets.find(t => t.id === ticketId);
                          if (!ticket) return null;
                          
                          const totalQuantity = packageCount * (selectedPackage?.qty || 10);
                          
                          return {
                            key: `${ticketId}-${index}`,
                            name: ticket.name,
                            quantity: totalQuantity
                          };
                        })
                        .filter(Boolean); // Remove null entries

                      // If we have valid ticket mappings, display them
                      if (ticketMappings.length > 0) {
                        return ticketMappings.map(mapping => (
                          <div key={mapping!.key} className="flex justify-between">
                            <span>Total {mapping!.name}</span>
                            <span>{mapping!.quantity}</span>
                          </div>
                        ));
                      }

                      // Fallback if no valid mappings found
                      return (
                        <div className="text-center text-gray-500 py-2">
                          <p className="text-sm">Package includes {calculatedPackageOrder.totalTickets} tickets</p>
                        </div>
                      );
                    })()}
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
                  
                  {/* Processing Fee - show when fees are calculated */}
                  {feeCalculation && feeCalculation.processingFeesDisplay > 0 && (
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
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                      <span className="font-medium">
                        {feeLoading ? (
                          <span className="text-sm text-gray-500">Calculating...</span>
                        ) : (
                          `$${calculatedPackageOrder.processingFeesDisplay.toFixed(2)}`
                        )}
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
                {feeCalculation && feeCalculation.processingFeesDisplay > 0 && (
                  <div className="text-xs text-gray-500 pt-2">
                    {getFeeDisclaimer()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};