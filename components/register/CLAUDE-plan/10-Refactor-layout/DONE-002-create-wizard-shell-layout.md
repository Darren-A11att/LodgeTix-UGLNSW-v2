# Task: Create WizardShellLayout Component

## Description
Create the `WizardShellLayout` component to handle the overall page structure with fixed height and three main sections (header, body, footer).

## Steps
1. Create `WizardShellLayout.tsx` in the new Layouts directory
2. Implement a 100dvh container with flexbox layout
3. Provide slots for header, body, and footer content
4. Add proper types and documentation

## Implementation

```tsx
// components/register/RegistrationWizard/Layouts/WizardShellLayout.tsx
import React from 'react';
import { cn } from "@/lib/utils";

interface WizardShellLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode; // Main content for the body
  footer?: React.ReactNode;
  className?: string;
}

export const WizardShellLayout: React.FC<WizardShellLayoutProps> = ({
  header,
  children,
  footer,
  className,
}) => {
  return (
    <div className={cn(
      "container mx-auto max-w-6xl px-4 flex flex-col h-[100dvh]",
      className
    )}>
      {/* Header section */}
      {header && (
        <header className="py-4">
          {header}
        </header>
      )}

      {/* Main scrollable body section */}
      <main className="flex-1 overflow-y-auto py-4">
        {children}
      </main>
      
      {/* Footer section */}
      {footer && (
        <footer className="py-4 border-t border-gray-100 mt-auto">
          {footer}
        </footer>
      )}
    </div>
  );
};
```

## Usage Example

```tsx
// Example usage in registration-wizard.tsx
<WizardShellLayout
  header={<RegistrationStepIndicator currentStep={currentStep} />}
  footer={
    <div className="flex justify-between items-center">
      <div className="text-xs text-gray-500">&copy; {new Date().getFullYear()} LodgeTix</div>
    </div>
  }
>
  {/* Main content (wizard body) goes here */}
  <div>Wizard content</div>
</WizardShellLayout>
```

## Expected Outcome
- A reusable layout component that maintains 100dvh height
- Proper overflow handling for the main content area
- Consistent header and footer positioning 

## Status
✅ Completed: WizardShellLayout component created with fixed height container and proper layout sections 