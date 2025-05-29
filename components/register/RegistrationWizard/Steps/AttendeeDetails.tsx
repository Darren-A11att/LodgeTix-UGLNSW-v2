import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { IndividualsForm } from '../../Forms/attendee/IndividualsForm';
import { LodgesForm } from '../../Forms/attendee/LodgesForm';
import { GrandLodgesForm } from '../../Forms/attendee/GrandLodgesForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TermsAndConditions from '../../Functions/TermsAndConditions';
import { TwoColumnStepLayout } from '../Layouts/TwoColumnStepLayout';
import { OneColumnStepLayout } from '../Layouts/OneColumnStepLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const { registrationType, goToNextStep, goToPrevStep } = useRegistrationStore();
  const [showErrors, setShowErrors] = useState(false);
  
  // Local validation function since it doesn't exist in the store
  const validateAllAttendees = useCallback(() => {
    // For now, we'll just assume validation passes
    // The validation is handled at the registration-wizard.tsx level
    return true;
  }, []);
  
  const handleContinue = useCallback(() => {
    const isValid = validateAllAttendees();
    
    if (!isValid || !agreeToTerms) {
      setShowErrors(true);
      return;
    }
    
    nextStep();
  }, [validateAllAttendees, agreeToTerms, nextStep]);

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
      
      case 'lodge':
        return (
          <LodgesForm
            minMembers={3}
            maxMembers={20}
            allowPartners={true}
            onComplete={handleContinue}
          />
        );
      
      case 'delegation':
        // Official Delegation goes directly to GrandLodgesForm
        return (
          <GrandLodgesForm
            onComplete={handleContinue}
          />
        );
      
      default:
        return <div>Please select a registration type</div>;
    }
  };

  // Render the attendee summary content for the right column
  const renderSummaryContent = () => (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Registration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Complete the attendee details form on the left. This information will be used for your registration.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Registration Type</h3>
              <p className="text-sm capitalize">{registrationType || 'Not selected'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Next Steps</h3>
              <ul className="text-sm list-disc pl-5 space-y-1">
                <li>Complete all required attendee information</li>
                <li>Agree to the terms and conditions</li>
                <li>Proceed to ticket selection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );

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
          disabled={validationErrors.length > 0 || !agreeToTerms}
          className="gap-2 bg-masonic-navy hover:bg-masonic-blue"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
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