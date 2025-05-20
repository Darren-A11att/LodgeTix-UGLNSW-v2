# TODO-001: Mobile-First Registration Page

## Overview
Implement a mobile-optimized view for the Registration Type selection page based on the requirements provided.

## Requirements
1. For mobile devices only:
   - Use dynamic viewport height units (svh, lvh, dvh) for better mobile experiences
   - Show only current and next step in the step indicator
   - Add hamburger menu to header for step navigation
   - Keep "Select Registration Type" on one line
   - Maintain divider below the heading
   - Hide "Please select how you would like to register for this event" text
   - Display registration type cards in rows/list format
   - Use horizontal layout for registration type cards
   - Constrain footer to same viewport height as header

## Implementation Plan
1. Update the `registration-step-indicator.tsx` component to:
   - Filter steps for mobile view to show only current and next step
   - Add hamburger menu with dropdown for all steps

2. Update the `registration-type-step.tsx` component to:
   - Implement responsive design for the heading and description
   - Create horizontal card layout for mobile devices

3. Update the `registration-wizard.tsx` component to:
   - Use dynamic viewport height units for container elements
   - Constrain header and footer to consistent heights

## Technical Notes
- Use the `useIsMobile()` hook to detect mobile devices
- Use Tailwind's responsive classes for conditional rendering
- Implement the new viewport units (svh, lvh, dvh) for dynamic sizing
- Ensure accessibility is maintained with the navigation changes