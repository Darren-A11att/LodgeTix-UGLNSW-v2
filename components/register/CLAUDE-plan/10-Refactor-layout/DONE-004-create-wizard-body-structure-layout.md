# Task: Create WizardBodyStructureLayout Component

## Description
Create the `WizardBodyStructureLayout` component that structures the main body content into four distinct rows:
1. Step Indicator
2. Section Header
3. Step Container (main content)
4. Navigation Buttons

## Steps
1. Create `WizardBodyStructureLayout.tsx` in the Layouts directory
2. Implement a flexible layout with the four rows
3. Add proper props to customize each section
4. Ensure the step container area gets flex-1 to use available space
5. Position buttons at the bottom with proper spacing

## Implementation

```tsx
// components/register/RegistrationWizard/Layouts/WizardBodyStructureLayout.tsx
import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RegistrationStepIndicator } from "../Shared/registration-step-indicator";
import { SectionHeader } from "../Shared/SectionHeader";

interface WizardBodyStructureLayoutProps {
  // Step indicator props
  currentStep: number;
  totalSteps?: number;
  
  // Section header props
  sectionTitle: string;
  sectionDescription?: string;
  
  // Step container content
  children: React.ReactNode;
  
  // Navigation buttons
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  disableNext?: boolean;
  hideBack?: boolean;
  
  // Additional content near buttons
  additionalButtonContent?: React.ReactNode;
  
  className?: string;
}

export const WizardBodyStructureLayout: React.FC<WizardBodyStructureLayoutProps> = ({
  currentStep,
  totalSteps = 6,
  sectionTitle,
  sectionDescription,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  disableNext = false,
  hideBack = false,
  additionalButtonContent,
  className,
}) => {
  return (
    <div className={cn("flex flex-col min-h-full", className)}>
      {/* Row 1: Step Indicator */}
      <div className="mb-6">
        <RegistrationStepIndicator currentStep={currentStep} />
      </div>
      
      {/* Row 2: Section Header */}
      <div className="mb-6">
        <SectionHeader>
          <h1 className="text-2xl font-bold text-masonic-navy">{sectionTitle}</h1>
          <div className="masonic-divider"></div>
          {sectionDescription && (
            <p className="text-gray-600">{sectionDescription}</p>
          )}
        </SectionHeader>
      </div>
      
      {/* Row 3: Step Container - takes remaining space */}
      <div className="flex-1 mb-6 overflow-y-auto">
        {children}
      </div>
      
      {/* Row 4: Navigation Buttons */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            {!hideBack && onBack && (
              <Button 
                variant="outline" 
                onClick={onBack}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            )}
          </div>
          
          {/* Center slot for additional content */}
          {additionalButtonContent && (
            <div className="flex-1 flex justify-center">
              {additionalButtonContent}
            </div>
          )}
          
          <div>
            {onNext && (
              <Button 
                onClick={onNext}
                disabled={disableNext}
                className="gap-2"
              >
                {nextLabel}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Usage Example

```tsx
// Example usage
<WizardBodyStructureLayout
  currentStep={2}
  sectionTitle="Attendee Details"
  sectionDescription="Please provide information for all attendees"
  onBack={handleBack}
  onNext={handleNext}
  disableNext={!formIsValid || !agreeToTerms}
  additionalButtonContent={
    <div className="text-sm text-gray-500">
      * All fields are required
    </div>
  }
>
  {/* Step content goes here */}
  <AttendeeDetailsFormContent />
</WizardBodyStructureLayout>
```

## Expected Outcome
- A reusable layout component that structures the wizard body content
- Consistent positioning of step indicator, section headers, and navigation
- Flexible content area that takes available space between header and buttons
- Centralized navigation button handling 

## Status
✅ Completed: WizardBodyStructureLayout component created with a four-row structure for organizing wizard content 