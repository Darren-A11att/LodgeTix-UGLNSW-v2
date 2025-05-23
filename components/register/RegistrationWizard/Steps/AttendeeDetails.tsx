import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { IndividualsForm } from '../../Forms/attendee/IndividualsForm';
import { LodgesForm } from '../../Forms/attendee/LodgesForm';
import { DelegationsForm } from '../../Forms/attendee/DelegationsForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TermsAndConditions from '../../Functions/TermsAndConditions';
import { TwoColumnStepLayout } from '../Layouts/TwoColumnStepLayout';
import { OneColumnStepLayout } from '../Layouts/OneColumnStepLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleAttendeeSummaryV2 } from '../Summary/SimpleAttendeeSummaryV2';
import formSaveManager from '@/lib/formSaveManager';

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
  const { registrationType } = useRegistrationStore();
  const [showErrors, setShowErrors] = useState(false);
  
  // Local validation function since it doesn't exist in the store
  const validateAllAttendees = useCallback(() => {
    // For now, we'll just assume validation passes
    // The validation is handled at the registration-wizard.tsx level
    return true;
  }, []);
  
  // NO defaults - users must explicitly select all values
  // Log attendee data for debugging purposes only
  useEffect(() => {
    console.log('AttendeeDetails - Component mounted');
    const store = useRegistrationStore.getState();
    
    // Get current attendees directly from store for logging only
    const currentAttendees = store.attendees || [];
    
    if (currentAttendees.length > 0) {
      console.log(`Found ${currentAttendees.length} attendees in store`);
      console.log('Terms agreed:', store.agreeToTerms ? 'Yes' : 'No');
    } else {
      console.log('No attendees found in store');
    }
  }, []);
  
  const handleContinue = useCallback(() => {
    // First, ensure all form data is saved
    formSaveManager.saveBeforeNavigation().then(() => {
      // Simple validation - no defaults, no special handling
      const isValid = validateAllAttendees();
      
      // Log for debugging purposes only
      console.log("AttendeeDetails - Continue clicked with validationErrors:", validationErrors);
      console.log("AttendeeDetails - agreeToTerms:", agreeToTerms); 
      console.log("AttendeeDetails - Button should be disabled:", validationErrors.length > 0 || !agreeToTerms);
      
      // Ensure terms agreement is saved to the store
      try {
        const store = useRegistrationStore.getState();
        if (store && store.setAgreeToTerms) {
          store.setAgreeToTerms(agreeToTerms);
        }
      } catch (e) {
        console.error("Error updating terms agreement in store:", e);
      }
      
      // Show errors if validation fails or terms not agreed
      if (!isValid || !agreeToTerms) {
        setShowErrors(true);
        return;
      }
      
      // Proceed to next step
      nextStep();
    });
  }, [validateAllAttendees, agreeToTerms, nextStep, validationErrors]);

  const renderForm = () => {
    switch (registrationType) {
      case 'individual':
        return (
          <IndividualsForm
            maxAttendees={10}
            allowPartners={true}
            onComplete={handleContinue}
          />
        );
      
      case 'delegation':
        return (
          <DelegationsForm
            delegationType="GrandLodge"
            maxDelegates={10}
            onComplete={handleContinue}
          />
        );
      
      default:
        return <div>Please select a registration type</div>;
    }
  };

  const renderNavAndTerms = () => (
    <>
      {/* Terms and conditions */}
      <div className="mt-8 border border-slate-200 rounded-md bg-slate-50">
        <TermsAndConditions
          checked={agreeToTerms}
          onChange={(checked) => {
            // First save all form data before updating terms agreement
            formSaveManager.saveOnTermsAgreement(checked);
            // Then update local state
            onAgreeToTermsChange(checked);
          }}
        />
      </div>

      {/* Navigation buttons - visible on all screen sizes */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button 
          variant="outline" 
          onClick={prevStep}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={validationErrors.length > 0 || !agreeToTerms}
          className="gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Validation errors */}
      {showErrors && (validationErrors.length > 0 || !agreeToTerms) && (
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
    </>
  );

  // Use the simple attendee summary without header (StepSummary handles progress)
  const renderSummaryContent = () => {
    return <SimpleAttendeeSummaryV2 showHeader={false} />;
  };

  // Render Lodge registration with OneColumnStepLayout
  if (registrationType === 'lodge') {
    return (
      <OneColumnStepLayout className="max-w-5xl">
        <div className="space-y-8 pb-20 sm:pb-10">
          {/* Form content */}
          <LodgesForm
            minMembers={3}
            maxMembers={20}
            allowPartners={true}
            onComplete={handleContinue}
          />
          
          {renderNavAndTerms()}
        </div>
      </OneColumnStepLayout>
    );
  }

  // Other registration types use TwoColumnStepLayout
  return (
    <TwoColumnStepLayout
      summaryContent={renderSummaryContent()}
      summaryTitle="Step Summary"
      currentStep={2}
      totalSteps={6}
    >
      <div className="space-y-8 pb-20 sm:pb-10">
        {/* Form content */}
        {renderForm()}
        
        {renderNavAndTerms()}
      </div>
    </TwoColumnStepLayout>
  );
};

export default AttendeeDetails;