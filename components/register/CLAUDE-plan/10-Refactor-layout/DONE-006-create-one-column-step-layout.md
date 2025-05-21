# Task: Create One-Column Step Layout

## Description
Create the `OneColumnStepLayout` component to provide a consistent layout for single-column steps in the registration wizard (Registration Type, Order Review, Confirmation).

## Steps
1. Create `OneColumnStepLayout.tsx` in the Layouts directory
2. Implement responsive container with appropriate margins/padding
3. Ensure it works well on mobile and desktop
4. Add proper props and type definitions

## Implementation

```tsx
// components/register/RegistrationWizard/Layouts/OneColumnStepLayout.tsx
import React from 'react';
import { cn } from "@/lib/utils";

interface OneColumnStepLayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export const OneColumnStepLayout: React.FC<OneColumnStepLayoutProps> = ({
  children,
  className,
  fullWidth = false,
}) => {
  return (
    <div className={cn(
      "w-full mx-auto space-y-6",
      fullWidth ? "max-w-none" : "max-w-3xl",
      className
    )}>
      {children}
    </div>
  );
};
```

## Usage Example

```tsx
// Example usage in a step component
<OneColumnStepLayout>
  <Card>
    <CardHeader>
      <CardTitle>Registration Type</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Registration type options */}
    </CardContent>
  </Card>
  
  {/* Any additional cards or content */}
</OneColumnStepLayout>
```

## Expected Outcome
- A simple reusable layout component for single-column step layouts
- Proper width constraints for desktop (centered content with max width)
- Full width on mobile
- Option to override max width if a particular step needs full width on all devices 

## Status
✅ Completed: OneColumnStepLayout component created with responsive sizing and flexible configuration 