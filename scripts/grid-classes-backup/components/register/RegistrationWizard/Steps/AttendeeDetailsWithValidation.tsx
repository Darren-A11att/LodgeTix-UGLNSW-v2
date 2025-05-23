import React, { useState, useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateAttendee } from '../../Forms/attendee/utils/validation';
import AttendeeDetails from './AttendeeDetails';
import type { AttendeeData } from '../../Forms/attendee/types';

interface AttendeeDetailsStepProps {
  agreeToTerms: boolean;
  onAgreeToTermsChange: (checked: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  validationErrors: string[];
}

export const AttendeeDetailsWithValidation: React.FC<AttendeeDetailsStepProps> = (props) => {
  const { attendees } = useRegistrationStore();
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [showErrors, setShowErrors] = useState(false);

  const validateBeforeNavigation = useCallback(async () => {
    const errors: Record<string, string[]> = {};
    
    for (const attendee of attendees) {
      const result = validateAttendee(attendee as AttendeeData);
      if (!result.isValid) {
        errors[attendee.attendeeId] = result.errors.map(e => e.message);
      }
    }
    
    setValidationErrors(errors);
    const hasErrors = Object.keys(errors).length > 0;
    
    if (hasErrors) {
      setShowErrors(true);
      // Scroll to first error
      const firstErrorId = Object.keys(errors)[0];
      const element = document.getElementById(`attendee-${firstErrorId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return !hasErrors;
  }, [attendees]);

  const handleNext = useCallback(async () => {
    const isValid = await validateBeforeNavigation();
    if (isValid) {
      props.nextStep();
    }
  }, [validateBeforeNavigation, props]);

  // Flatten validation errors for the base component
  const flattenedErrors = Object.entries(validationErrors).flatMap(([attendeeId, errors]) => 
    errors.map(error => `Attendee ${attendeeId}: ${error}`)
  );

  return (
    <>
      {showErrors && Object.keys(validationErrors).length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Please fix the validation errors before continuing.
          </AlertDescription>
        </Alert>
      )}
      
      <AttendeeDetails 
        {...props} 
        nextStep={handleNext}
        validationErrors={flattenedErrors}
      />
    </>
  );
};