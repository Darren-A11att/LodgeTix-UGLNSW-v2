import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { useTicketsPreloader } from '@/hooks/use-tickets-preloader';
// Lodge registration store is now part of the unified store
import { IndividualsForm } from '../../Forms/attendee/IndividualsForm';
import { LodgesForm } from '../../Forms/attendee/LodgesForm';
import { GrandLodgesForm, GrandLodgesFormHandle } from '../../Forms/attendee/GrandLodgesForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TermsAndConditions from '../../Functions/TermsAndConditions';
import { TwoColumnStepLayout } from '../Layouts/TwoColumnStepLayout';
import { OneColumnStepLayout } from '../Layouts/OneColumnStepLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ValidationModal } from '@/components/ui/validation-modal';
import { getAttendeeSummaryData } from '../Summary/summary-data/attendee-summary-data';
import { SummaryRenderer } from '../Summary/SummaryRenderer';
import { FEATURED_FUNCTION_ID } from '@/lib/utils/function-slug-resolver-client';

interface AttendeeDetailsProps {
  agreeToTerms: boolean;
  onAgreeToTermsChange: (checked: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  validationErrors: string[];
}

const AttendeeDetails: React.FC<AttendeeDetailsProps> = ({
  agreeToTerms,
  onAgreeToTermsChange,
  nextStep,
  prevStep,
  validationErrors,
}) => {
  const { 
    registrationType, 
    goToNextStep, 
    goToPrevStep, 
    attendees, 
    delegationType, 
    functionId,
    functionSlug,
    isLodgeFormValid,
    getLodgeValidationErrors
  } = useRegistrationStore();
  const [showErrors, setShowErrors] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  
  // State to track if GrandLodgesForm is in purchase-only mode
  const [isPurchaseOnlyMode, setIsPurchaseOnlyMode] = useState(false);
  
  // Preload tickets data in the background for better UX on next step
  // Trigger after a delay to allow attendee details to fully load
  const preloaderStatus = useTicketsPreloader({
    enabled: true,
    delay: 1000 // Start preloading 1 second after component loads
  });
  
  // Debug preloader status in development
  if (process.env.NODE_ENV === 'development' && preloaderStatus.hasPreloaded) {
    console.log('[AttendeeDetails] Tickets preloaded in background - next step will be instant');
  }
  
  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (registrationType === 'lodge') {
      // For lodge registration, use the lodge store validation
      return isLodgeFormValid() && agreeToTerms;
    }
    if (registrationType === 'delegation') {
      // For delegation registration, we need custom validation
      // In purchase-only mode, we don't need terms agreement
      if (isPurchaseOnlyMode) {
        return true; // GrandLodgesForm handles its own validation
      }
      // For register delegation mode, we need terms agreement
      return agreeToTerms;
    }
    // For other registration types, use the standard validation
    return validationErrors.length === 0 && agreeToTerms;
  }, [registrationType, isLodgeFormValid, validationErrors, agreeToTerms, isPurchaseOnlyMode]);
  
  // Parse validation errors to create a map of field errors by attendee
  const fieldErrorsByAttendee = useMemo(() => {
    const errorMap: Record<string, Record<string, string>> = {};
    
    validationErrors.forEach(error => {
      // Parse error format: "Mason 1: Field Name is required."
      const match = error.match(/^(.+?):\s*(.+?)(?:\s+is required\.?|\s+is invalid\.?|\.?)$/);
      if (match) {
        const [, attendeeLabel, fieldPart] = match;
        
        // Extract field name from the error message
        let fieldName = '';
        if (fieldPart.includes('Title')) fieldName = 'title';
        else if (fieldPart.includes('First Name')) fieldName = 'firstName';
        else if (fieldPart.includes('Last Name')) fieldName = 'lastName';
        else if (fieldPart.includes('Rank')) fieldName = 'rank';
        else if (fieldPart.includes('Grand Lodge')) fieldName = 'grand_lodge_id';
        else if (fieldPart.includes('Lodge')) fieldName = 'lodge_id';
        else if (fieldPart.includes('Email')) fieldName = 'primaryEmail';
        else if (fieldPart.includes('Phone')) fieldName = 'primaryPhone';
        else if (fieldPart.includes('contact preference')) fieldName = 'contactPreference';
        
        if (fieldName) {
          if (!errorMap[attendeeLabel]) {
            errorMap[attendeeLabel] = {};
          }
          errorMap[attendeeLabel][fieldName] = error;
        }
      }
    });
    
    return errorMap;
  }, [validationErrors]);
  
  // Reference to store the form's submit handler
  const grandLodgesFormRef = useRef<GrandLodgesFormHandle | null>(null);
  
  const handleContinue = useCallback(() => {
    setAttemptedSubmit(true);
    
    // For delegation type, we need to trigger the form's validation
    if (registrationType === 'delegation' && grandLodgesFormRef.current) {
      // Trigger the form's submit method which will handle validation
      grandLodgesFormRef.current.submit();
      return;
    }
    
    if (!isFormValid) {
      // Show validation modal with errors
      setShowValidationModal(true);
      setShowErrors(true);
      return;
    }
    
    nextStep();
  }, [isFormValid, nextStep, registrationType]);
  
  // State to store delegation validation errors
  const [delegationValidationErrors, setDelegationValidationErrors] = useState<string[]>([]);
  
  // Special handler for delegation forms that checks terms and proceeds
  const handleDelegationComplete = useCallback(() => {
    // Check terms agreement first
    if (!agreeToTerms) {
      const errors = ['You must agree to the terms and conditions'];
      setValidationErrors(errors);
      setShowValidationModal(true);
      setShowErrors(true);
      return;
    }
    
    // All validation passed, proceed to next step
    nextStep();
  }, [agreeToTerms, nextStep]);
  
  // Handler for delegation validation errors
  const handleDelegationValidationError = useCallback((errors: string[]) => {
    // Add terms error if not agreed
    const allErrors = [...errors];
    if (!agreeToTerms) {
      allErrors.push('You must agree to the terms and conditions');
    }
    
    setValidationErrors(allErrors);
    setShowValidationModal(true);
    setShowErrors(true);
  }, [agreeToTerms]);
  
  // Format validation errors for modal
  const formatValidationErrors = () => {
    let errors: string[] = [];
    
    if (registrationType === 'lodge') {
      // For lodge registration, get errors from lodge store
      errors = getLodgeValidationErrors();
    } else if (registrationType === 'delegation') {
      // For delegation registration, only check terms agreement if not in purchase-only mode
      // The GrandLodgesForm handles its own internal validation
      if (!isPurchaseOnlyMode && !agreeToTerms) {
        errors.push('You must agree to the terms and conditions');
      }
      return errors.map(error => ({
        field: 'Terms & Conditions',
        message: error
      }));
    } else {
      // For other registration types, use standard validation errors
      errors = [...validationErrors];
    }
    
    if (!agreeToTerms && !(registrationType === 'delegation' && isPurchaseOnlyMode)) {
      errors.push('You must agree to the terms and conditions');
    }
    
    return errors.map(error => {
      // Parse error to extract field name if possible
      const fieldMatch = error.match(/^(.+?):/);
      const field = fieldMatch ? fieldMatch[1] : 'Required Field';
      const message = fieldMatch ? error.substring(fieldMatch[0].length).trim() : error;
      
      return { field, message };
    });
  };

  const renderForm = () => {
    switch (registrationType) {
      case 'individuals':
      case 'individual': // Backwards compatibility
        return (
          <IndividualsForm
            maxAttendees={10}
            allowPartners={true}
            onComplete={handleContinue}
            fieldErrors={showErrors ? fieldErrorsByAttendee : {}}
          />
        );
      
      case 'lodge':
        // Check if we have a valid functionId from the store
        if (!functionId) {
          return (
            <Alert variant="destructive">
              <AlertDescription>
                Function ID is not available. Please refresh the page and try again.
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <LodgesForm
            functionId={functionId}
            minTables={1}
            maxTables={10}
            onComplete={handleContinue}
            fieldErrors={showErrors ? fieldErrorsByAttendee : {}}
          />
        );
      
      case 'delegation':
        // Official Delegation uses GrandLodgesForm
        // Check if we have a valid functionId from the store
        if (!functionId) {
          return (
            <Alert variant="destructive">
              <AlertDescription>
                Function ID is not available. Please refresh the page and try again.
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <GrandLodgesForm
            ref={grandLodgesFormRef}
            functionId={functionId}
            functionSlug={functionSlug}
            onComplete={handleDelegationComplete} // Use special handler that checks terms
            onValidationError={handleDelegationValidationError} // Pass validation error handler
            fieldErrors={showErrors ? fieldErrorsByAttendee : {}}
            onTabChange={handleGrandLodgeTabChange} // Add tab change handler
          />
        );
      
      default:
        return <div>Please select a registration type</div>;
    }
  };

  // Render the attendee summary content for the right column
  const renderSummaryContent = () => {
    const summaryData = getAttendeeSummaryData({
      attendees,
      registrationType,
      delegationType
    });
    
    return <SummaryRenderer {...summaryData} />;
  };

  // Callback to handle tab changes from GrandLodgesForm
  const handleGrandLodgeTabChange = useCallback((tab: 'purchaseOnly' | 'registerDelegation') => {
    setIsPurchaseOnlyMode(tab === 'purchaseOnly');
  }, []);

  // Determine which layout to use based on registration type
  const useOneColumnLayout = registrationType === 'delegation';

  const formContent = (
    <div className="space-y-8">
      {/* Form content */}
      {renderForm()}

      {/* Terms and conditions - hide when in purchase-only mode for delegation */}
      {!(registrationType === 'delegation' && isPurchaseOnlyMode) && (
        <div className="mt-8 border border-slate-200 rounded-md bg-slate-50">
          <TermsAndConditions
            checked={agreeToTerms}
            onChange={onAgreeToTermsChange}
          />
        </div>
      )}

      {/* Validation errors - only show inline if attempted submit and modal is closed */}
      {showErrors && !showValidationModal && (validationErrors.length > 0 || (!agreeToTerms && !(registrationType === 'delegation' && isPurchaseOnlyMode))) && (
        <Alert variant="destructive">
          <AlertDescription>
            {validationErrors.length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
            {!agreeToTerms && !(registrationType === 'delegation' && isPurchaseOnlyMode) && <p>You must agree to the terms and conditions.</p>}
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          className="gap-2 border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        {/* Hide continue button when in purchase-only mode for delegation */}
        {!(registrationType === 'delegation' && isPurchaseOnlyMode) && (
          <Button
            onClick={handleContinue}
            variant={isFormValid ? "default" : "outline"}
            className={`gap-2 ${
              isFormValid 
                ? "bg-masonic-navy hover:bg-masonic-blue text-white" 
                : "border-masonic-navy text-masonic-navy hover:bg-masonic-lightblue"
            }`}
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Validation Modal */}
      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        errors={formatValidationErrors()}
        title="Please Complete Required Fields"
        description="The following fields need your attention before continuing:"
      />
    </div>
  );

  // Use OneColumnStepLayout for delegations, TwoColumnStepLayout for individual
  if (useOneColumnLayout) {
    return (
      <OneColumnStepLayout
        currentStep={2}
        totalSteps={6}
        stepName="Attendee Details"
      >
        {formContent}
      </OneColumnStepLayout>
    );
  }

  return (
    <TwoColumnStepLayout
      summaryContent={renderSummaryContent()}
      summaryTitle="Registration Information"
      currentStep={2}
      totalSteps={6}
      stepName="Attendee Details"
    >
      {formContent}
    </TwoColumnStepLayout>
  );
};

export default AttendeeDetails;