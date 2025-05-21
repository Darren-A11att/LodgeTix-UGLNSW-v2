# Task: Refactor Registration Wizard to Use WizardShellLayout

## Description
Modify the existing `registration-wizard.tsx` to use the new `WizardShellLayout` component, preserving all existing functionality while adding the improved layout structure.

## Steps
1. Import the `WizardShellLayout` component
2. Replace the current root container with `WizardShellLayout`
3. Move the current header content to `header` prop
4. Move the current footer content to `footer` prop
5. Place the current main content within `WizardShellLayout`
6. Test navigation and state management to ensure everything still works

## Implementation

```tsx
// Updated parts of components/register/RegistrationWizard/registration-wizard.tsx
"use client"

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useRegistrationStore, selectCurrentStep, selectRegistrationType, selectConfirmationNumber, selectAttendees } from '../../../lib/registrationStore'
import { RegistrationStepIndicator } from "./Shared/registration-step-indicator"
// Import the new layout component
import { WizardShellLayout } from "./Layouts/WizardShellLayout"
// ... other imports remain the same

export const RegistrationWizard: React.FC<RegistrationWizardProps> = (props) => {
  // All existing state and handlers remain the same
  
  // ... existing code

  return (
    <WizardShellLayout
      header={<RegistrationStepIndicator currentStep={currentStep} />}
      footer={
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">&copy; {new Date().getFullYear()} LodgeTix</div>
        </div>
      }
    >
      {/* Main content area */}
      <div className={`${showAttendeeSummary ? "grid grid-cols-1 lg:grid-cols-4 gap-6" : ""}`}>
        <div className={showAttendeeSummary ? "lg:col-span-4" : "w-full"}>
          {renderStep()}
        </div>
      </div>
    </WizardShellLayout>
  )
}
```

## Changes from Original
The modified version:
1. Replaces the root `div` container with `WizardShellLayout`
2. Moves the header with `RegistrationStepIndicator` to the `header` prop
3. Moves the footer content to the `footer` prop
4. Places the main content (grid and rendered step) as children of `WizardShellLayout`

## Testing Criteria
- Verify all steps still render correctly
- Confirm the wizard takes exactly 100dvh height
- Check that navigation between steps works normally
- Ensure proper scrolling behavior in the main content area
- Test on both mobile and desktop viewports 