"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";

interface OrderSummaryProps {
  primaryAttendee: any;
  additionalAttendees: any[];
  currentTickets: any[];
  totalAmount: number;
  isProcessingPayment: boolean;
  isSubmittingOrder: boolean;
  isPaymentIntentLoading: boolean;
  localPaymentProcessingError: string | null;
  submissionError: string | null;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  primaryAttendee,
  additionalAttendees,
  currentTickets,
  totalAmount,
  isProcessingPayment,
  isSubmittingOrder,
  isPaymentIntentLoading,
  localPaymentProcessingError,
  submissionError
}) => {
  const isLoadingOverall = (isPaymentIntentLoading && totalAmount > 0) || isProcessingPayment || isSubmittingOrder;

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
          <Separator />
          <div className="flex justify-between font-bold text-lg text-masonic-navy">
            <span>Amount Due:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
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

// Add missing AlertTitle component definition
import { AlertTitle } from "@/components/ui/alert";