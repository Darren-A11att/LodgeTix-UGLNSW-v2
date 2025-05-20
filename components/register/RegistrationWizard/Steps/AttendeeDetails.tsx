import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { IndividualsForm } from '../../Forms/attendee/IndividualsForm';
import { LodgesForm } from '../../Forms/attendee/LodgesForm';
import { DelegationsForm } from '../../Forms/attendee/DelegationsForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TermsAndConditions from '../../Forms/shared/TermsAndConditions';

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
  const { registrationType, validateAllAttendees } = useRegistrationStore();
  const [showErrors, setShowErrors] = useState(false);
  
  const handleContinue = useCallback(async () => {
    const isValid = await validateAllAttendees();
    
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

  return (
    <div className="space-y-8">
      {/* Step header */}
      <div>
        <h2 className="text-2xl font-bold">Attendee Details</h2>
        <p className="text-gray-600 mt-1">
          Enter details for all attendees in your registration
        </p>
      </div>

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

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
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
          className="gap-2"
        >
          Continue to Tickets
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AttendeeDetails;