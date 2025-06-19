"use client"

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { OneColumnStepLayout } from '../Layouts/OneColumnStepLayout';
import { LodgesForm } from '../../Forms/attendee/LodgesForm';
import { UnifiedPaymentForm } from '../payment/UnifiedPaymentForm';
import { PaymentProcessing } from '../payment/PaymentProcessing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { SquareBillingDetails } from '../payment/types';
import { getFunctionTicketsService, FunctionPackage } from '@/lib/services/function-tickets-service';
import { calculateSquareFees, SQUARE_RATES, getFeeModeFromEnv, getPlatformFeePercentage, isDomesticCard } from '@/lib/utils/square-fee-calculator';

// Validate and get Square application key
const getSquareKey = () => {
  const key = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  console.log('🔧 [LodgeRegistrationStep] Checking Square Application ID:', key ? '✅ Found' : '❌ Missing');
  if (!key) {
    console.error('❌ [LodgeRegistrationStep] NEXT_PUBLIC_SQUARE_APPLICATION_ID is not defined');
    return null;
  }
  return key;
};

const squareApplicationId = getSquareKey();
console.log('🔧 [LodgeRegistrationStep] Square Application ID resolved:', squareApplicationId ? '✅ Valid' : '❌ Invalid');

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
  // Remove Square initialization - now handled by UnifiedPaymentForm
  
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
    { name: 'Saving registration', description: 'Creating your registration record', status: 'upcoming' as const },
    { name: 'Processing payment', description: 'Securely processing your payment', status: 'upcoming' as const },
    { name: 'Confirming order', description: 'Finalizing your registration', status: 'upcoming' as const },
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
  const feeCalculation = calculateSquareFees(subtotal, {
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
  const handlePaymentSuccess = async (paymentToken: string, billingDetails: SquareBillingDetails) => {
    console.log('💳 Square payment token created:', paymentToken);
    
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
        newSteps[0] = { ...newSteps[0], status: 'complete' };
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
          paymentMethodId: paymentToken,
          amount: totalAmount * 100, // Convert to cents (includes fees)
          subtotal: subtotal * 100, // Convert to cents (before fees)
          squareFee: feeCalculation.squareFee * 100, // Convert to cents
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
          newSteps[1] = { ...newSteps[1], status: 'complete' };
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
          newSteps[2] = { ...newSteps[2], status: 'complete' };
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
      setShowProcessingSteps(false);
      
      // Update processing steps to show error
      setProcessingSteps(prev => {
        const newSteps = [...prev];
        const currentStepIndex = newSteps.findIndex(step => step.status === 'current');
        if (currentStepIndex >= 0) {
          newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], status: 'error' };
        }
        return newSteps;
      });
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setError(error);
    setIsProcessing(false);
    setShowProcessingSteps(false);
  };

  // Handle back to payment (for processing page)
  const handleBackToPayment = () => {
    setShowProcessingSteps(false);
    setError(null);
    setIsProcessing(false);
  };

  // Form submission is now handled by UnifiedPaymentForm

  // Show processing page when payment is being processed
  if (showProcessingSteps) {
    return (
      <OneColumnStepLayout className="max-w-5xl mx-auto">
        <PaymentProcessing 
          steps={processingSteps}
          error={error}
          onBackToPayment={handleBackToPayment}
        />
      </OneColumnStepLayout>
    );
  }

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
            /* Unified Payment Form */
            <UnifiedPaymentForm
              totalAmount={totalAmount}
              subtotal={subtotal}
              billingDetails={getBillingDetails()}
              registrationType="lodge"
              registrationData={{ lodgeCustomer, lodgeDetails, lodgeTicketOrder }}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              isProcessing={isProcessing}
              functionId={functionId}
              functionSlug={functionSlug}
              packageId={selectedPackage?.package_id || selectedPackage?.id}
              minimal={true}
            />
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