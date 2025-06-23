"use client"

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { CheckoutForm, CheckoutFormHandle } from './CheckoutForm';
import { useSquareWebPayments } from './useSquareWebPayments';
import { SquareErrorBoundary } from './SquareErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { SquareBillingDetails } from './types';
// Fee calculation is now done by parent component

interface UnifiedPaymentFormProps {
  // Core payment data
  totalAmount: number;
  subtotal: number;
  billingDetails: any;
  
  // Registration type and data
  registrationType: 'individuals' | 'lodge' | 'delegation';
  registrationData: any;
  
  // Functions for processing
  onPaymentSuccess: (token: string, billingDetails: SquareBillingDetails) => Promise<void>;
  onPaymentError: (error: string) => void;
  
  // UI control
  isProcessing?: boolean;
  onBackStep?: () => void;
  minimal?: boolean; // Don't render card wrapper - just the payment form content
  
  // API configuration
  functionId: string;
  functionSlug?: string;
  packageId?: string; // Required for lodge registrations
}

export const UnifiedPaymentForm: React.FC<UnifiedPaymentFormProps> = ({
  totalAmount,
  subtotal,
  billingDetails,
  registrationType,
  registrationData,
  onPaymentSuccess,
  onPaymentError,
  isProcessing = false,
  onBackStep,
  minimal = false,
  functionId,
  functionSlug,
  packageId
}) => {
  const checkoutFormRef = useRef<CheckoutFormHandle>(null);
  const [isFormProcessing, setIsFormProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Square Web Payments SDK initialization
  const { payments, isLoaded: isSquareLoaded, error: squareError } = useSquareWebPayments();
  
  const isSquareConfigured = useMemo(() => {
    const configured = isSquareLoaded && !!payments;
    console.log(`🔧 [UnifiedPaymentForm] Square configured for ${registrationType}:`, configured);
    return configured;
  }, [isSquareLoaded, payments, registrationType]);

  // Fee calculation is handled by parent component
  // The totalAmount prop already includes the calculated fees

  // Convert billing details to Square format
  const getSquareBillingDetails = useCallback((): SquareBillingDetails => {
    const addressLines = [billingDetails.addressLine1];
    if (billingDetails.businessName) {
      addressLines.push(billingDetails.businessName);
    }
    
    return {
      givenName: billingDetails.firstName,
      familyName: billingDetails.lastName,
      email: billingDetails.emailAddress,
      phone: billingDetails.mobileNumber,
      addressLines,
      city: billingDetails.suburb,
      state: billingDetails.stateTerritory?.name,
      postalCode: billingDetails.postcode,
      country: billingDetails.country?.isoCode,
    };
  }, [billingDetails]);

  // Handle payment processing
  const handlePaymentSubmit = async () => {
    if (!isSquareConfigured) {
      setError('Payment system is not ready');
      return;
    }

    setError(null);
    setIsFormProcessing(true);

    try {
      if (checkoutFormRef.current) {
        const result = await checkoutFormRef.current.createPaymentMethod();
        if (result.error) {
          setError(result.error);
          setIsFormProcessing(false);
        }
        // Success is handled by onPaymentSuccess callback
      } else {
        setError('Payment form not ready');
        setIsFormProcessing(false);
      }
    } catch (err: any) {
      console.error('Payment submit error:', err);
      setError(err.message || 'Payment failed');
      setIsFormProcessing(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (token: string, squareBillingDetails: SquareBillingDetails) => {
    console.log(`💳 [UnifiedPaymentForm] ${registrationType} payment token created:`, token);
    
    try {
      await onPaymentSuccess(token, squareBillingDetails);
    } catch (err: any) {
      console.error('Payment success handler error:', err);
      setError(err.message || 'Payment processing failed');
      setIsFormProcessing(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    console.error(`Payment error in ${registrationType}:`, error);
    setError(error);
    setIsFormProcessing(false);
    onPaymentError(error);
  };

  const currentlyProcessing = isProcessing || isFormProcessing;

  // Render content without card wrapper for minimal mode
  const renderContent = () => (
    <>


      {/* Payment Form */}
      {squareError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{squareError}</AlertDescription>
        </Alert>
      ) : !isSquareConfigured ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-6 w-6 mr-2" />
          <span>Payment system is initializing. Please wait a moment...</span>
        </div>
      ) : (
        <SquareErrorBoundary>
          <CheckoutForm
            ref={checkoutFormRef}
            totalAmount={totalAmount}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            setIsProcessingPayment={setIsFormProcessing}
            billingDetails={getSquareBillingDetails()}
            isProcessing={currentlyProcessing}
            payments={payments}
          />
        </SquareErrorBoundary>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Navigation - only show for non-minimal mode */}
      {!minimal && onBackStep && (
        <div className="flex justify-between pt-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={onBackStep} 
            disabled={currentlyProcessing}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous Step
          </Button>
          <div></div> {/* Spacer */}
        </div>
      )}
    </>
  );

  // Return with or without card wrapper based on minimal mode
  if (minimal) {
    return <div className="space-y-6">{renderContent()}</div>;
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
};