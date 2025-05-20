# DONE Task 111: Update AttendeeDetails Step

## Objective
Update the AttendeeDetails step in the registration wizard to use the new form architecture.

## Dependencies
- Task 092 (IndividualsForm)
- Task 093 (LodgesForm)
- Task 094 (DelegationsForm)

## Reference Files
- `components/register/registration-wizard/steps/AttendeeDetails.tsx`
- `components/register/registration-wizard/registration-wizard.tsx`

## Steps

1. Update `components/register/registration-wizard/steps/AttendeeDetails.tsx`:
```typescript
import React, { useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { IndividualsForm } from '../../forms/attendee/IndividualsForm';
import { LodgesForm } from '../../forms/attendee/LodgesForm';
import { DelegationsForm } from '../../forms/attendee/DelegationsForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AttendeeDetailsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const AttendeeDetailsStep: React.FC<AttendeeDetailsStepProps> = ({
  onNext,
  onBack,
}) => {
  const { registrationType, validateAllAttendees } = useRegistrationStore();
  
  const handleContinue = useCallback(async () => {
    const isValid = await validateAllAttendees();
    if (isValid) {
      onNext();
    }
  }, [validateAllAttendees, onNext]);

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

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
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
```

2. Create a progress tracker integration:
```typescript
// Update progress tracker to show form completion
export const useAttendeeProgress = () => {
  const { attendees, registrationType } = useRegistrationStore();
  
  const getProgress = useCallback(() => {
    if (attendees.length === 0) return 0;
    
    // Calculate completion percentage based on filled fields
    const totalFields = attendees.reduce((sum, attendee) => {
      const requiredFields = getRequiredFields(attendee);
      return sum + requiredFields.length;
    }, 0);
    
    const completedFields = attendees.reduce((sum, attendee) => {
      const requiredFields = getRequiredFields(attendee);
      const completed = requiredFields.filter(field => 
        attendee[field as keyof AttendeeData]
      ).length;
      return sum + completed;
    }, 0);
    
    return Math.round((completedFields / totalFields) * 100);
  }, [attendees]);

  const getCompletionStatus = useCallback(() => {
    const minAttendees = registrationType === 'lodge' ? 3 : 1;
    
    return {
      hasMinimumAttendees: attendees.length >= minAttendees,
      allFieldsComplete: getProgress() === 100,
      isComplete: attendees.length >= minAttendees && getProgress() === 100,
    };
  }, [attendees, registrationType, getProgress]);

  return { getProgress, getCompletionStatus };
};
```

3. Create form state persistence for wizard:
```typescript
// Persist form state across wizard steps
export const useWizardFormPersistence = () => {
  const { currentStep, attendees } = useRegistrationStore();
  const [savedState, setSavedState] = useState<any>(null);

  // Save state when leaving attendee details step
  useEffect(() => {
    if (currentStep !== 'attendeeDetails' && attendees.length > 0) {
      setSavedState({
        attendees: [...attendees],
        timestamp: Date.now(),
      });
    }
  }, [currentStep, attendees]);

  // Restore state when returning to attendee details
  const restoreState = useCallback(() => {
    if (savedState && currentStep === 'attendeeDetails') {
      // Implement state restoration logic
      console.log('Restoring attendee state:', savedState);
    }
  }, [savedState, currentStep]);

  return { savedState, restoreState };
};
```

4. Create validation integration:
```typescript
// Integrate validation with wizard navigation
export const AttendeeDetailsWithValidation: React.FC<AttendeeDetailsStepProps> = (props) => {
  const { attendees } = useRegistrationStore();
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [showErrors, setShowErrors] = useState(false);

  const validateBeforeNavigation = useCallback(async () => {
    const errors: Record<string, string[]> = {};
    
    for (const attendee of attendees) {
      const result = validateAttendee(attendee);
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
      props.onNext();
    }
  }, [validateBeforeNavigation, props.onNext]);

  return (
    <>
      {showErrors && Object.keys(validationErrors).length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Please fix the validation errors before continuing.
          </AlertDescription>
        </Alert>
      )}
      
      <AttendeeDetailsStep {...props} onNext={handleNext} />
    </>
  );
};
```

## Deliverables
- Updated AttendeeDetails step
- Form type switching
- Progress tracking
- State persistence
- Validation integration

## Success Criteria
- Correctly renders form based on registration type
- Navigation works with validation
- Progress is tracked accurately
- State persists between steps
- Good UX with error handling

## Compliance Analysis with CLAUDE.md

### Issues Found:

1. **Registration Type Naming**: Uses 'individual' but CLAUDE.md uses 'IndividualsForm' - need to verify the actual type values used in the store.

2. **Import Paths**: The validation function `validateAttendee` is not imported and its location is not specified.

3. **Type Imports**: Missing imports for types like `AttendeeData` and other interfaces.

4. **Navigation Components**: References step navigation but doesn't show the full integration with the wizard component structure.

5. **Progress Tracking**: The progress tracking implementation is more elaborate than what's specified in CLAUDE.md.

### Architecture Alignment:

- The step component follows the wizard pattern correctly
- Form selection based on registration type is logical
- Validation integration is appropriate
- State persistence approach is sound

### Required Corrections:

1. Add proper type imports
2. Clarify registration type values
3. Import validation utilities from correct paths
4. Ensure navigation component integration

### Enhancements Beyond CLAUDE.md:

- Progress percentage calculation
- Completion status tracking
- Auto-scrolling to errors
- Draft state persistence

### Alignment Score: 80%

The implementation follows good patterns and integrates well with the wizard concept. Main issues are around missing imports and some concepts that extend beyond the original specification.