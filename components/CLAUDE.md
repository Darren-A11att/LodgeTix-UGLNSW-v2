# Components Directory

## Role and Purpose
This directory contains React components used throughout the LodgeTix application. It includes UI elements, form components, and complex interactive features, organized by domain and functionality.

## Key Files and Components

### UI Components
- `/ui` - shadcn/ui components with consistent styling
  - Contains primitive components like buttons, inputs, cards
  - Uses TailwindCSS with custom Masonic-themed colors
  - All components follow Radix UI accessibility patterns

### Authentication Components
- `/auth/login-form.tsx` - Login form for organizer authentication

### Event Components
- `event-card.tsx` - Card component for displaying event details
- `featured-event.tsx` - Special component for highlighted events
- `grand-installation-hero.tsx` - Hero section for Grand Installation event

### Registration Components
Several subdirectories handle the complex registration flow:

- `/register/attendee` - Attendee management components
  - `AttendeeCounter.tsx` - Controls for adding/removing attendees
  - `AttendeeDetails.tsx` - Form for attendee personal information
  - `AttendeeEditModal.tsx` - Modal for editing attendee information
  - `AttendeeSummary.tsx` - Summary of all attendees in registration

- `/register/forms` - Specialized forms for different attendee types
  - `/mason` - Forms specifically for Masonic attendees
    - `MasonForm.tsx` - Main form for Masonic attendees
    - `MasonLodgeInfo.tsx` - Lodge-specific information fields
    - `MasonGrandLodgeFields.tsx` - Grand Lodge fields
  - `/guest` - Forms for non-Masonic attendees
    - `GuestForm.tsx` - Main form for guest attendees

- `/register/payment` - Payment processing components
  - `CheckoutForm.tsx` - Stripe Elements integration
  - `BillingDetailsForm.tsx` - Form for billing information
  - `OrderSummary.tsx` - Summary of items in order

- `/register/steps` - Registration wizard step components
  - `registration-type-step.tsx` - Initial step for selecting attendee type
  - `ticket-selection-step.tsx` - Step for selecting event tickets
  - `payment-step.tsx` - Payment processing step

## Commands and Workflows
- Components use functional React pattern with hooks
- Many complex components use lazy loading via dynamic imports
- Form components use React Hook Form with Zod validation
- Shared UI components from `/ui` directory should be used consistently
- For adding new form fields, follow the pattern in existing forms

## Conventions and Patterns
1. **File Naming**:
   - PascalCase for component files (e.g., `AttendeeDetails.tsx`)
   - kebab-case for sub-directories and multi-word filenames

2. **Component Structure**:
   - Use named exports for components
   - Define interfaces for props
   - Export component as default in its own file when appropriate

3. **Props and TypeScript**:
   - Each component has defined prop interface/type
   - Use TypeScript for all component definitions
   - Optional props have default values

4. **Styling**:
   - Use TailwindCSS classes
   - Follow design system color variables
   - Masonic theme colors defined in tailwind.config.ts

## Dependencies and Relationships
- UI components depend on shadcn/ui and Radix UI
- Form components use React Hook Form and Zod
- Payment components integrate with Stripe Elements
- Registration wizard uses Zustand store from `/lib/registrationStore.ts`
- Many components rely on Supabase for data fetching

## Special Notes and Gotchas
1. **Form Validation**:
   - Complex validation logic in registration forms
   - Different rules for Mason vs Guest attendees
   - Partner forms have relationship dependencies

2. **State Management**:
   - Registration flow uses Zustand for persistent state
   - Draft recovery for forms if browser refreshed

3. **Mason-specific Components**:
   - Lodge selection uses autocomplete with search
   - Grand Lodge fields have specific validation requirements

4. **Performance Considerations**:
   - Heavy components use lazy loading
   - Component architecture focuses on reusability
   - Avoid unnecessary re-renders by using memo or careful state design