"use client"

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { OneColumnStepLayout } from '../Layouts/OneColumnStepLayout';
import { LodgesForm } from '../../Forms/attendee/LodgesForm';
import TermsAndConditions from '../../Functions/TermsAndConditions';
import { CheckoutForm, CheckoutFormHandle } from '../payment/CheckoutForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLodgeRegistrationStore } from '@/lib/lodgeRegistrationStore';
import { useRegistrationStore } from '@/lib/registrationStore';
import { StripeBillingDetailsForClient } from '../payment/types';

// Get Stripe publishable key
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
const stripePromise = loadStripe(stripePublishableKey);

interface LodgeRegistrationStepProps {
  functionId: string;
  functionSlug?: string;
}

export const LodgeRegistrationStep: React.FC<LodgeRegistrationStepProps> = ({
  functionId,
  functionSlug
}) => {
  const router = useRouter();
  const checkoutFormRef = useRef<CheckoutFormHandle>(null);
  
  // Store hooks
  const { 
    customer, 
    lodgeDetails, 
    isValid: isFormValid,
    getValidationErrors 
  } = useLodgeRegistrationStore();
  
  const { lodgeTicketOrder } = useRegistrationStore();
  
  // Local state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormComplete, setIsFormComplete] = useState(false);

  // Calculate total amount
  const TABLE_PRICE = 1950; // $1950 per table
  const totalAmount = lodgeTicketOrder ? lodgeTicketOrder.tableCount * TABLE_PRICE : 0;

  // Handle form completion
  const handleFormComplete = useCallback(() => {
    setIsFormComplete(true);
  }, []);

  // Convert customer data to billing details format
  const getBillingDetails = useCallback((): any => {
    return {
      title: customer.title,
      firstName: customer.firstName,
      lastName: customer.lastName,
      emailAddress: customer.email,
      mobileNumber: customer.mobile,
      phone: customer.phone,
      addressLine1: lodgeDetails.lodgeName || '',
      suburb: 'Sydney', // Default for lodge registrations
      stateTerritory: { name: 'NSW' },
      postcode: '2000', // Default for lodge registrations
      country: { isoCode: 'AU' },
      businessName: lodgeDetails.lodgeName,
    };
  }, [customer, lodgeDetails]);

  // Handle payment success
  const handlePaymentSuccess = async (paymentMethodId: string, billingDetails: StripeBillingDetailsForClient) => {
    console.log('💳 Payment method created:', paymentMethodId);
    
    try {
      // Create payment intent and process registration
      const response = await fetch('/api/registrations/lodge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionId,
          customerData: customer,
          lodgeDetails,
          tableOrder: lodgeTicketOrder,
          paymentMethodId,
          amount: totalAmount * 100, // Convert to cents
          billingDetails,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process registration');
      }

      if (result.success && result.registrationId) {
        // Navigate to confirmation page using function-based routing
        const confirmationPath = functionSlug
          ? `/events/${functionSlug}/register/${result.registrationId}/confirmation`
          : `/registrations/${result.registrationId}`;
        
        router.push(confirmationPath);
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to complete registration');
      setIsProcessing(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setError(error);
    setIsProcessing(false);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!isFormValid()) {
      const errors = getValidationErrors();
      setError(errors.join(', '));
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }

    if (!lodgeTicketOrder || lodgeTicketOrder.tableCount === 0) {
      setError('Please select at least one table');
      return;
    }

    // Clear any previous errors
    setError(null);
    setIsProcessing(true);

    // Trigger payment method creation in CheckoutForm
    if (checkoutFormRef.current) {
      const result = await checkoutFormRef.current.createPaymentMethod();
      if (result.error) {
        setError(result.error);
        setIsProcessing(false);
      }
      // Success is handled by onPaymentSuccess callback
    } else {
      setError('Payment form not ready');
      setIsProcessing(false);
    }
  };

  return (
    <OneColumnStepLayout className="max-w-5xl mx-auto">
      {/* Lodge Registration Form */}
      <LodgesForm
        onComplete={handleFormComplete}
        className="mb-6"
      />

      {/* Payment Section */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="flex items-center gap-2 text-primary">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Security Note */}
          <Alert className="border-blue-200 bg-blue-50">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              Your payment information is securely processed by Stripe. We never store your card details.
            </AlertDescription>
          </Alert>

          {/* Stripe Elements */}
          <Elements stripe={stripePromise}>
            <CheckoutForm
              ref={checkoutFormRef}
              totalAmount={totalAmount}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              setIsProcessingPayment={setIsProcessing}
              billingDetails={getBillingDetails()}
              isProcessing={isProcessing}
            />
          </Elements>

          {/* Terms and Conditions */}
          <div className="border-t pt-4">
            <TermsAndConditions
              checked={termsAccepted}
              onChange={setTermsAccepted}
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!termsAccepted || isProcessing || !isFormComplete}
              className="min-w-[200px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ${totalAmount.toLocaleString()}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </OneColumnStepLayout>
  );
};