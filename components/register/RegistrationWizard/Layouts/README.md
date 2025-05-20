# Registration Wizard Layout System

## Overview
The registration wizard layout system provides a consistent, responsive structure for multi-step forms with improved mobile support and fixed height behavior. The system is composed of nested layout components that handle different aspects of the UI structure.

## Architecture

### Component Hierarchy
```
WizardShellLayout (100dvh container)
└── WizardBodyStructureLayout (4-row structure)
    ├── Row 1: Step Indicator
    ├── Row 2: Section Header
    ├── Row 3: Step Container (OneColumnStepLayout or TwoColumnStepLayout)
    │   └── Step Content Components
    └── Row 4: Navigation Buttons
```

### Key Components

1. **WizardShellLayout**
   - Top-level container with fixed 100dvh height
   - Manages header, scrollable body, and footer
   - Prevents page scrolling (only content scrolls)

2. **WizardBodyStructureLayout**
   - Manages the internal structure of the wizard body
   - Handles step indicators, section headers, and navigation buttons
   - Provides consistent spacing and layout

3. **OneColumnStepLayout**
   - Used for focused, single-column steps
   - Applied to: Registration Type, Order Review, Confirmation
   - Centered content with appropriate width constraints

4. **TwoColumnStepLayout**
   - Used for steps needing a sidebar/summary
   - Applied to: Attendee Details, Ticket Selection, Payment
   - 70/30 split on desktop, collapsible summary on mobile

## Usage Guidelines

### Using WizardShellLayout

```tsx
<WizardShellLayout
  header={<YourHeaderComponent />}
  footer={<YourFooterComponent />}
>
  {/* Main wizard body content */}
  <WizardBodyStructureLayout>...</WizardBodyStructureLayout>
</WizardShellLayout>
```

Props:
- `header`: Optional header content (e.g., logo, global navigation)
- `footer`: Optional footer content (e.g., copyright, links)
- `children`: Main content for the body (typically WizardBodyStructureLayout)
- `className`: Optional additional classes

### Using WizardBodyStructureLayout

```tsx
<WizardBodyStructureLayout
  currentStep={2}
  sectionTitle="Attendee Details"
  sectionDescription="Please provide information for all attendees"
  onBack={handleBack}
  onNext={handleNext}
  disableNext={!formIsValid}
  additionalButtonContent={<TermsAndConditions />}
>
  {/* Step content using OneColumnStepLayout or TwoColumnStepLayout */}
  <OneColumnStepLayout>...</OneColumnStepLayout>
</WizardBodyStructureLayout>
```

Props:
- `currentStep`: Current step number (required)
- `totalSteps`: Total number of steps (defaults to 6)
- `sectionTitle`: Title for the current step (required)
- `sectionDescription`: Optional description text
- `onBack`: Handler for back button
- `onNext`: Handler for next/continue button
- `nextLabel`: Label for next button (defaults to "Continue")
- `backLabel`: Label for back button (defaults to "Back")
- `disableNext`: Whether to disable the next button
- `hideBack`: Whether to hide the back button
- `additionalButtonContent`: Optional content to show near buttons
- `children`: Step content

### Using OneColumnStepLayout

```tsx
<OneColumnStepLayout fullWidth={false}>
  <Card>
    <CardContent>
      {/* Step-specific content */}
    </CardContent>
  </Card>
</OneColumnStepLayout>
```

Props:
- `children`: Content for the one-column layout
- `className`: Optional additional classes
- `fullWidth`: Whether to use full width (defaults to false)

### Using TwoColumnStepLayout

```tsx
<TwoColumnStepLayout
  summaryTitle="Registration Summary"
  summaryContent={<YourSummaryComponent />}
>
  <Card>
    <CardContent>
      {/* Main step content */}
    </CardContent>
  </Card>
</TwoColumnStepLayout>
```

Props:
- `children`: Main content for the left/primary column
- `summaryContent`: Content for the right/summary column
- `summaryTitle`: Title for the summary section (defaults to "Summary")
- `className`: Optional additional classes
- `mainColumnClassName`: Optional classes for main column
- `summaryColumnClassName`: Optional classes for summary column

## Adding a New Step

1. **Create the step component** focusing only on the content:
   ```tsx
   // NewStep.tsx
   const NewStep: React.FC = () => {
     return (
       <OneColumnStepLayout> {/* or TwoColumnStepLayout */}
         <Card>
           <CardContent>
             {/* Step-specific content only */}
           </CardContent>
         </Card>
       </OneColumnStepLayout>
     );
   };
   
   export default NewStep;
   ```

2. **Update the main wizard component**:
   - Add the new component to the imports (preferably with lazy loading)
   - Add a new case to the step content mapping
   - Add title and description for the new step

3. **Handle navigation and validation** in the parent component

## Best Practices

1. **Keep step components focused on content**
   - Avoid adding section headers or navigation buttons in step components
   - Let parent components handle layout, navigation, and titles

2. **Use proper layout component for each step**
   - Use OneColumnStepLayout for focused, simpler steps
   - Use TwoColumnStepLayout when a summary or sidebar is needed

3. **Handle validation in the parent component**
   - Centralize validation logic in the wizard component
   - Pass validation state to step components as needed

4. **Maintain responsive behavior**
   - Test all steps on both mobile and desktop
   - Ensure content is accessible on all device sizes

## Troubleshooting

### Height Not Constrained to 100dvh
- Ensure html/body have height: 100% in global CSS
- Check for any parent elements that might be constraining height
- Verify no margin/padding is breaking the layout

### Scroll Issues
- If entire page scrolls instead of just the content:
  - Check for elements breaking out of the container
  - Verify overflow settings are correct
  - Ensure height calculations are proper

### Layout Shifts
- If layout shifts when navigating between steps:
  - Ensure consistent padding/margin between step components
  - Check for elements with dynamic height that might cause shifts
  - Use min-height where appropriate to prevent collapsing

## Browser Compatibility
This layout system has been tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari
- Chrome for Android

For older browsers, the dvh unit might not be supported. Consider adding a fallback using vh. 