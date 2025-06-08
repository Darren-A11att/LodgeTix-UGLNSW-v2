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
import { Loader2, CreditCard, ShieldCheck, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { StripeBillingDetailsForClient } from '../payment/types';
import { getFunctionTicketsService, FunctionPackage } from '@/lib/services/function-tickets-service';
import { calculateStripeFees, STRIPE_RATES, getFeeModeFromEnv, getPlatformFeePercentage } from '@/lib/utils/stripe-fee-calculator';

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
  
  // Store hooks from unified store
  const { 
    lodgeCustomer, 
    lodgeDetails, 
    lodgeTicketOrder,
    isLodgeFormValid,
    getLodgeValidationErrors,
    goToPrevStep: storeGoToPrevStep
  } = useRegistrationStore();
  
  // Use prop if provided, otherwise use store function
  const goToPrevStep = onPrevStep || storeGoToPrevStep;
  
  // Local state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormComplete, setIsFormComplete] = useState(false);
  
  // Processing steps state (same as payment step)
  const [showProcessingSteps, setShowProcessingSteps] = useState(false);
  const [processingSteps, setProcessingSteps] = useState([
    { id: 'save', label: 'Saving registration...', status: 'pending' as const },
    { id: 'payment', label: 'Processing payment...', status: 'pending' as const },
    { id: 'confirm', label: 'Generating confirmation...', status: 'pending' as const },
  ]);
  
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
    isDomestic: true // Default to domestic for Australian lodges
  });
  const totalAmount = feeCalculation.customerPayment;

  // Handle form completion
  const handleFormComplete = useCallback(() => {
    setIsFormComplete(true);
  }, []);

  // Convert customer data to billing details format
  const getBillingDetails = useCallback((): any => {
    return {
      title: '', // lodgeCustomer doesn't have title
      firstName: lodgeCustomer.firstName,
      lastName: lodgeCustomer.lastName,
      emailAddress: lodgeCustomer.email,
      mobileNumber: lodgeCustomer.mobile,
      phone: lodgeCustomer.mobile, // Use mobile as phone
      addressLine1: lodgeDetails.lodgeName || '',
      suburb: 'Sydney', // Default for lodge registrations
      stateTerritory: { name: 'NSW' },
      postcode: '2000', // Default for lodge registrations
      country: { isoCode: 'AU' },
      businessName: lodgeDetails.lodgeName,
    };
  }, [lodgeCustomer, lodgeDetails]);

  // Handle payment success
  const handlePaymentSuccess = async (paymentMethodId: string, billingDetails: StripeBillingDetailsForClient) => {
    console.log('💳 Payment method created:', paymentMethodId);
    
    // Debug: Check validation state
    if (!isLodgeFormValid()) {
      const errors = getLodgeValidationErrors();
      console.error('Validation failed:', errors);
      setError(`Please complete all required fields: ${errors.join(', ')}`);
      setIsProcessing(false);
      return;
    }
    
    // Show processing steps UI (same as payment step)
    setError(null);
    setShowProcessingSteps(true);
    setIsProcessing(true);
    
    // Update steps to show registration saving
    setProcessingSteps(prev => {
      const newSteps = [...prev];
      newSteps[0] = { ...newSteps[0], status: 'current' };
      return newSteps;
    });
    
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
      // Step 1: Complete - Registration validation
      setProcessingSteps(prev => {
        const newSteps = [...prev];
        newSteps[0] = { ...newSteps[0], status: 'completed' };
        newSteps[1] = { ...newSteps[1], status: 'current' };
        return newSteps;
      });

      // Get package ID from the selected package
      console.log('[LodgeRegistrationStep] Selected package:', selectedPackage);
      // Use package_id from the database, fallback to id if needed
      const packageId = selectedPackage.package_id || selectedPackage.id;
      
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
          bookingContact: lodgeCustomer,
          lodgeDetails: {
            lodgeName: lodgeDetails.lodgeName,
            lodgeId: lodgeDetails.lodge_id,
            organisation_id: lodgeDetails.organisation_id,
          },
          paymentMethodId,
          amount: totalAmount * 100, // Convert to cents (includes fees)
          subtotal: subtotal * 100, // Convert to cents (before fees)
          stripeFee: feeCalculation.stripeFee * 100, // Convert to cents
          billingDetails: getBillingDetails(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process registration');
      }

      if (result.success && result.registrationId) {
        // Step 2: Complete - Payment processed
        setProcessingSteps(prev => {
          const newSteps = [...prev];
          newSteps[1] = { ...newSteps[1], status: 'completed' };
          newSteps[2] = { ...newSteps[2], status: 'current' };
          return newSteps;
        });

        console.log('[LodgeRegistrationStep] Registration successful:', {
          registrationId: result.registrationId,
          confirmationNumber: result.confirmationNumber
        });
        
        // Step 3: Complete - Confirmation ready
        setProcessingSteps(prev => {
          const newSteps = [...prev];
          newSteps[2] = { ...newSteps[2], status: 'completed' };
          return newSteps;
        });

        // Check if we got a confirmation number
        if (result.confirmationNumber) {
          // Redirect to confirmation page with confirmation number
          setTimeout(() => {
            console.log('[LodgeRegistrationStep] Redirecting to confirmation page:', result.confirmationNumber);
            router.push(`/functions/${functionSlug}/register/confirmation/lodge/${result.confirmationNumber}`);
          }, 1500); // Small delay to show completion
        } else {
          // Fallback: Store registration data and go to confirmation step
          const store = useRegistrationStore.getState();
          useRegistrationStore.setState({ draftId: result.registrationId });
          
          setTimeout(() => {
            console.log('[LodgeRegistrationStep] No confirmation number, moving to confirmation step with registrationId:', result.registrationId);
            store.setCurrentStep(6); // Go to confirmation step
            store._updateStatus('completed'); // Mark as completed
          }, 1500);
        }
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
    if (!isLodgeFormValid()) {
      const errors = getLodgeValidationErrors();
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

          {/* Processing Steps UI (same as payment step) */}
          {showProcessingSteps && (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {processingSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                      ${step.status === 'completed' ? 'bg-green-500 text-white' : 
                        step.status === 'current' ? 'bg-primary text-white animate-pulse' : 
                        'bg-gray-200 text-gray-500'}
                    `}>
                      {step.status === 'completed' ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`
                      ${step.status === 'completed' ? 'text-green-600 line-through' : 
                        step.status === 'current' ? 'text-primary font-medium' : 
                        'text-gray-500'}
                    `}>
                      {step.label}
                    </span>
                    {step.status === 'current' && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
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