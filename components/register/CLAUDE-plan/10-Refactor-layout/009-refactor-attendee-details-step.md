# Task: Refactor Attendee Details Step

## Description
Refactor the `AttendeeDetailsStep` component to work with the new layout system. This component will be simplified to focus on attendee form content only, with layout, navigation, and headers handled by parent components. It will use the `TwoColumnStepLayout` for main content and summary.

## Steps
1. Update imports to include the new layout component
2. Remove navigation buttons and section headers
3. Use TwoColumnStepLayout for proper structure
4. Extract summary content into a dedicated component section
5. Pass state to parent components for navigation control

## Implementation

```tsx
// Modified components/register/RegistrationWizard/Steps/AttendeeDetails.tsx
import React, { useState, useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { IndividualsForm, IndividualsFormSummary } from '../../Forms/attendee/IndividualsForm';
import { LodgesForm } from '../../Forms/attendee/LodgesForm';
import { DelegationsForm } from '../../Forms/attendee/DelegationsForm';
import { TwoColumnStepLayout } from '../Layouts/TwoColumnStepLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AttendeeDetailsProps {
  // Props related to terms are now handled by parent
  agreeToTerms: boolean;
  onAgreeToTermsChange: (checked: boolean) => void;
  // Navigation props remain for compatibility but aren't used directly
  nextStep: () => void;
  prevStep: () => void;
  validationErrors: string[];
}

const AttendeeDetails: React.FC<AttendeeDetailsProps> = ({
  validationErrors,
}) => {
  const { registrationType, validateAllAttendees, attendees } = useRegistrationStore();
  
  // Determine the appropriate form based on registration type
  const renderForm = () => {
    switch (registrationType) {
      case 'individual':
        return (
          <IndividualsForm
            maxAttendees={10}
            allowPartners={true}
          />
        );
      
      case 'lodge':
        return (
          <LodgesForm
            minMembers={3}
            maxMembers={20}
            allowPartners={true}
          />
        );
      
      case 'delegation':
        return (
          <DelegationsForm
            delegationType="GrandLodge"
            maxDelegates={10}
          />
        );
      
      default:
        return <div>Please select a registration type</div>;
    }
  };

  // Summary content based on registration type
  const renderSummary = () => {
    switch (registrationType) {
      case 'individual':
        return <IndividualsFormSummary />;
      case 'lodge':
        return <div>Lodge Summary</div>; // Placeholder
      case 'delegation':
        return <div>Delegation Summary</div>; // Placeholder
      default:
        return null;
    }
  };

  return (
    <TwoColumnStepLayout
      summaryTitle="Registration Summary"
      summaryContent={renderSummary()}
    >
      <Card>
        <CardContent className="pt-6">
          {/* Show validation errors if any */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Render the appropriate form based on registration type */}
          {renderForm()}
        </CardContent>
      </Card>
    </TwoColumnStepLayout>
  );
};

export default AttendeeDetails;
```

## Key Changes
1. Import `TwoColumnStepLayout` instead of direct UI components
2. Removed the "Continue" and "Back" buttons (navigation handled by parent)
3. Removed terms and conditions checkbox (now in parent component)
4. Created dedicated summary content render function
5. Wrapped main content in `TwoColumnStepLayout`
6. Removed `onComplete` handlers from the form components
7. Simplified props interface

## Testing
- Verify the form renders correctly for each registration type
- Confirm that validation errors display properly
- Check that the summary section appears correctly
- Ensure mobile/desktop responsiveness works as expected
- Validate that form interactions still function properly 