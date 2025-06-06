import React, { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { useLodgeRegistrationStore } from '@/lib/lodgeRegistrationStore';
import { IndividualsForm } from '../../Forms/attendee/IndividualsForm';
import { LodgesForm } from '../../Forms/attendee/LodgesForm';
import { LodgesForm as GrandLodgesForm } from '../../Forms/attendee/GrandLodgesForm';
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
  const { registrationType, goToNextStep, goToPrevStep, attendees, delegationType, functionId } = useRegistrationStore();
  const { isValid: isLodgeFormValid, getValidationErrors: getLodgeValidationErrors } = useLodgeRegistrationStore();
  const [showErrors, setShowErrors] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  
  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (registrationType === 'lodge') {
      // For lodge registration, use the lodge store validation
      return isLodgeFormValid() && agreeToTerms;
    }
    // For other registration types, use the standard validation
    return validationErrors.length === 0 && agreeToTerms;
  }, [registrationType, isLodgeFormValid, validationErrors, agreeToTerms]);
  
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
  
  const handleContinue = useCallback(() => {
    setAttemptedSubmit(true);
    
    if (!isFormValid) {
      // Show validation modal with errors
      setShowValidationModal(true);
      setShowErrors(true);
      return;
    }
    
    nextStep();
  }, [isFormValid, nextStep]);
  
  // Format validation errors for modal
  const formatValidationErrors = () => {
    let errors: string[] = [];
    
    if (registrationType === 'lodge') {
      // For lodge registration, get errors from lodge store
      errors = getLodgeValidationErrors();
    } else {
      // For other registration types, use standard validation errors
      errors = [...validationErrors];
    }
    
    if (!agreeToTerms) {
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
      case 'individual':
        return (
          <IndividualsForm
            maxAttendees={10}
            allowPartners={true}
            onComplete={handleContinue}
            fieldErrors={showErrors ? fieldErrorsByAttendee : {}}
          />
        );
      
      case 'lodge':
        return (
          <LodgesForm
            functionId={FEATURED_FUNCTION_ID}
            minTables={1}
            maxTables={10}
            onComplete={handleContinue}
            fieldErrors={showErrors ? fieldErrorsByAttendee : {}}
          />
        );
      
      case 'delegation':
        // Official Delegation uses GrandLodgesForm
        return (
          <GrandLodgesForm
            functionId={FEATURED_FUNCTION_ID}
            onComplete={handleContinue}
            fieldErrors={showErrors ? fieldErrorsByAttendee : {}}
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

  // Determine which layout to use based on registration type
  const useOneColumnLayout = registrationType === 'delegation';

  const formContent = (
    <div className="space-y-8">
      {/* Form content */}
      {renderForm()}

      {/* Terms and conditions */}
      <div className="mt-8 border border-slate-200 rounded-md bg-slate-50">
        <TermsAndConditions
          checked={agreeToTerms}
          onChange={onAgreeToTermsChange}
        />
      </div>

      {/* Validation errors - only show inline if attempted submit and modal is closed */}
      {showErrors && !showValidationModal && (validationErrors.length > 0 || !agreeToTerms) && (
        <Alert variant="destructive">
          <AlertDescription>
            {validationErrors.length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
            {!agreeToTerms && <p>You must agree to the terms and conditions.</p>}
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