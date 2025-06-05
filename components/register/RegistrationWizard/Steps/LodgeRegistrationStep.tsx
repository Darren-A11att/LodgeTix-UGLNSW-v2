"use client"

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { OneColumnStepLayout } from '../Layouts/OneColumnStepLayout';
import { LodgesForm } from '../../Forms/attendee/LodgesForm';
import { CheckoutForm, CheckoutFormHandle } from '../payment/CheckoutForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { useLodgeRegistrationStore } from '@/lib/lodgeRegistrationStore';
import { useRegistrationStore } from '@/lib/registrationStore';
import { StripeBillingDetailsForClient } from '../payment/types';
import { getFunctionTicketsService, FunctionPackage } from '@/lib/services/function-tickets-service';
import { calculateStripeFees, getFeeModeFromEnv, getPlatformFeePercentage } from '@/lib/utils/stripe-fee-calculator';

// Get Stripe publishable key
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
const stripePromise = loadStripe(stripePublishableKey);

interface LodgeRegistrationStepProps {
  functionId: string;
  functionSlug: string; // Make functionSlug required as it's needed for navigation
  onPrevStep?: () => void;
  selectedEvents?: any;
}

export const LodgeRegistrationStep: React.FC<LodgeRegistrationStepProps> = ({
  functionId,
  functionSlug,
  onPrevStep
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
  
  const { lodgeTicketOrder, goToPrevStep: storeGoToPrevStep } = useRegistrationStore();
  
  // Use prop if provided, otherwise use store function
  const goToPrevStep = onPrevStep || storeGoToPrevStep;
  
  // Local state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormComplete, setIsFormComplete] = useState(false);
  
  // Dynamic pricing state
  const [functionPackages, setFunctionPackages] = useState<FunctionPackage[]>([]);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  
  // Fetch function packages for dynamic pricing
  useEffect(() => {
    const fetchFunctionPricing = async () => {
      try {
        setIsLoadingPricing(true);
        console.log('[LodgeRegistrationStep] Fetching packages for function:', functionId);
        const ticketsService = getFunctionTicketsService();
        const { packages } = await ticketsService.getFunctionTicketsAndPackages(functionId);
        console.log('[LodgeRegistrationStep] Fetched packages:', packages);
        console.log('[LodgeRegistrationStep] Lodge packages:', packages.filter(pkg => 
          pkg.eligibleRegistrationTypes.includes('lodges')
        ));
        setFunctionPackages(packages);
      } catch (error) {
        console.error('Failed to fetch function pricing:', error);
      } finally {
        setIsLoadingPricing(false);
      }
    };
    
    fetchFunctionPricing();
  }, [functionId]);
  
  // Calculate dynamic pricing - filter for packages with "lodges" registration type
  const lodgePackages = useMemo(() => {
    return functionPackages.filter(pkg => 
      pkg.eligibleRegistrationTypes.includes('lodges')
    );
  }, [functionPackages]);
  
  const selectedPackage = lodgePackages[0]; // Use the first available lodge package
  const packagePrice = selectedPackage?.price || 1950; // fallback to 1950
  
  // Calculate total amount including Stripe fees
  const subtotal = lodgeTicketOrder ? lodgeTicketOrder.tableCount * packagePrice : 0;
  const feeCalculation = calculateStripeFees(subtotal, {
    isDomestic: true, // Default to domestic for Australian lodges
    feeMode: getFeeModeFromEnv(),
    platformFeePercentage: getPlatformFeePercentage()
  });
  const totalAmount = feeCalculation.total;

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
    
    // Debug: Check validation state
    if (!isFormValid()) {
      const errors = getValidationErrors();
      console.error('Validation failed:', errors);
      setError(`Please complete all required fields: ${errors.join(', ')}`);
      setIsProcessing(false);
      return;
    }
    
    // Check if packages are loaded
    if (isLoadingPricing) {
      console.error('Packages are still loading');
      setError('Please wait while we load pricing information');
      setIsProcessing(false);
      return;
    }
    
    // Check if we have a selected package
    if (!selectedPackage) {
      console.error('No lodge package available', { functionPackages, lodgePackages });
      setError('No lodge package is available for this function');
      setIsProcessing(false);
      return;
    }
    
    try {
      // Get package ID from the selected package
      console.log('[LodgeRegistrationStep] Selected package:', selectedPackage);
      const packageId = selectedPackage.id; // Use 'id' not 'package_id' based on FunctionPackage interface
      
      if (!packageId) {
        console.error('[LodgeRegistrationStep] Package structure:', selectedPackage);
        console.error('[LodgeRegistrationStep] Available packages:', lodgePackages);
        throw new Error('Package has no ID');
      }

      console.log('[LodgeRegistrationStep] Sending registration request:', {
        functionId,
        packageId,
        tableCount: lodgeTicketOrder?.tableCount || 0,
        lodgeName: lodgeDetails.lodgeName,
        totalAmount: totalAmount * 100
      });

      // Create payment intent and process registration using new endpoint
      const response = await fetch(`/api/functions/${functionId}/packages/${packageId}/lodge-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableCount: lodgeTicketOrder?.tableCount || 0,
          bookingContact: customer,
          lodgeDetails: {
            lodgeName: lodgeDetails.lodgeName,
            lodgeId: lodgeDetails.lodge_id,
            organisation_id: lodgeDetails.organisation_id,
          },
          paymentMethodId,
          amount: totalAmount * 100, // Convert to cents (includes fees)
          subtotal: subtotal * 100, // Convert to cents (before fees)
          stripeFee: feeCalculation.stripeFee * 100, // Convert to cents
          billingDetails,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process registration');
      }

      if (result.success && result.registrationId) {
        console.log('[LodgeRegistrationStep] Registration successful:', {
          registrationId: result.registrationId,
          redirectUrl: `/functions/${functionSlug}/register/${result.registrationId}?showConfirmation=true`
        });
        
        // Store registration data in the registration store
        const store = useRegistrationStore.getState();
        // Don't store confirmation number yet - it will be generated after payment
        store.setCurrentStep(6); // Go to confirmation step
        store._updateStatus('completed'); // Mark as completed
        
        // Navigate after the current render cycle to avoid React hooks error
        setTimeout(() => {
          const redirectUrl = `/functions/${functionSlug}/register/${result.registrationId}?showConfirmation=true`;
          console.log('[LodgeRegistrationStep] Redirecting to:', redirectUrl);
          router.push(redirectUrl);
        }, 0);
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
        functionId={functionId}
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

          {/* Show loading state while fetching packages */}
          {isLoadingPricing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6 mr-2" />
              <span>Loading pricing information...</span>
            </div>
          ) : !selectedPackage ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No lodge package is available for this function. Please contact support.
              </AlertDescription>
            </Alert>
          ) : (
            /* Stripe Elements */
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
          )}


          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation - Only Back Button */}
          <div className="flex justify-between pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={goToPrevStep} 
              disabled={isProcessing}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous Step
            </Button>
            <div></div> {/* Empty div to maintain flex spacing */}
          </div>
        </CardContent>
      </Card>
    </OneColumnStepLayout>
  );
};