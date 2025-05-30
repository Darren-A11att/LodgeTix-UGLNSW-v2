"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateStripeFees, getFeeDisclaimer, getFeeModeFromEnv, getPlatformFeePercentage } from "@/lib/utils/stripe-fee-calculator";

interface OrderSummaryWithFeesProps {
  primaryAttendee: any;
  additionalAttendees: any[];
  currentTickets: any[];
  subtotalAmount: number;
  isProcessingPayment: boolean;
  isSubmittingOrder: boolean;
  isPaymentIntentLoading: boolean;
  localPaymentProcessingError: string | null;
  submissionError: string | null;
  showFees?: boolean;
}

export const OrderSummaryWithFees: React.FC<OrderSummaryWithFeesProps> = ({
  primaryAttendee,
  additionalAttendees,
  currentTickets,
  subtotalAmount,
  isProcessingPayment,
  isSubmittingOrder,
  isPaymentIntentLoading,
  localPaymentProcessingError,
  submissionError,
  showFees = true
}) => {
  const isLoadingOverall = (isPaymentIntentLoading && subtotalAmount > 0) || isProcessingPayment || isSubmittingOrder;
  
  // Calculate fees
  const feeMode = getFeeModeFromEnv();
  const platformFeePercentage = getPlatformFeePercentage();
  const feeCalculation = calculateStripeFees(subtotalAmount, {
    isDomestic: true, // Default to domestic, could be enhanced to detect card type
    platformFeePercentage,
    feeMode
  });

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Total Attendees:</span>
            <span>{(primaryAttendee ? 1 : 0) + additionalAttendees.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Tickets:</span>
            <span>{currentTickets.length}</span>
          </div>
          
          <Separator className="my-3" />
          
          {/* Fee breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${feeCalculation.subtotal.toFixed(2)}</span>
            </div>
            
            {showFees && feeMode === 'pass_to_customer' && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  Processing Fee
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          {getFeeDisclaimer()}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span>${feeCalculation.stripeFee.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <Separator className="my-3" />
          
          <div className="flex justify-between font-bold text-lg text-masonic-navy">
            <span>Amount Due:</span>
            <span>${feeCalculation.total.toFixed(2)}</span>
          </div>
          
          {showFees && feeMode === 'pass_to_customer' && (
            <p className="text-xs text-muted-foreground mt-2">
              {getFeeDisclaimer()}
            </p>
          )}
        </CardContent>
      </Card>
      
      <Alert className="border-masonic-gold bg-masonic-gold/10">
        <Info className="h-4 w-4 text-masonic-navy" />
        <AlertDescription className="text-masonic-navy">
          All transactions are secure and encrypted. Your data is protected.
        </AlertDescription>
      </Alert>

      {isLoadingOverall && ( 
        <div className="flex flex-col items-center justify-center space-y-3 py-8 mt-4 bg-white rounded-md shadow-lg p-6">
          <Loader2 className="h-10 w-10 animate-spin text-masonic-navy" />
          <p className="text-lg font-semibold text-masonic-navy">
            {isSubmittingOrder ? "Finalizing your registration..." 
                : isProcessingPayment ? "Processing your payment..." 
                    : "Initializing..."}
          </p>
          <p className="text-sm text-gray-500 text-center">Please do not close or refresh this page.</p>
        </div>
      )}
      
      {localPaymentProcessingError && !isLoadingOverall && (
        <Alert variant="destructive" className="mt-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{localPaymentProcessingError}</AlertDescription>
        </Alert>
      )}
      
      {submissionError && !isLoadingOverall && (
        <Alert variant="destructive" className="mt-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Order Submission Error</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};