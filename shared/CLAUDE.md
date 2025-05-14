# Shared Directory

## Role and Purpose
The `shared` directory contains reusable code, type definitions, and components that are used across the LodgeTix application. This directory helps maintain consistency and reduces code duplication by housing common elements shared between different parts of the application.

## Key Files and Components

### Components
- `/components` - Reusable UI components
  - `AutocompleteInput.tsx` - Generic autocomplete input field
  - `EventCard.tsx` - Common event card component 
  - `PhoneInputWrapper.tsx` - Standardized phone input with country selection
  - `EventPaymentCard.tsx` - Payment card for event transactions

### Data
- `/data` - Static data and constants
  - `phoneCountries.ts` - Country codes and formats for phone numbers

### Types
- `/types` - TypeScript type definitions
  - `customer.ts` - Customer data interfaces
  - `event.ts` - Event-related type definitions
  - `guest.ts` - Guest attendee types
  - `mason.ts` - Masonic attendee types
  - `register.ts` - Registration flow type definitions
  - `register_updated.ts` - Updated registration types (transition)
  - `ticket.ts` - Ticket type definitions
  - `supabase.ts` - Database schema type definitions
  - `day.ts` - Date and day-related types

### Utils
- `/utils` - Shared utility functions
  - `eventEligibility.ts` - Functions for determining event eligibility

## Commands and Workflows
- Import shared components directly with their full path
- Types should be imported from their specific files
- Utility functions can be imported and used throughout the application

## Conventions and Patterns
1. **Type Definitions**:
   - Use interfaces for complex objects
   - Use type aliases for unions and simple types
   - Document type properties with JSDoc comments

2. **Component Structure**:
   - Reusable components include their own styling
   - Props interfaces defined in same file
   - Components are exported with named exports

3. **Utility Functions**:
   - Pure functions with explicit return types
   - Error handling included in implementation

## Dependencies and Relationships
- Shared components are used throughout `/app` and `/components`
- Type definitions are used for API responses, form data, and component props
- Utility functions provide common logic for business rules

## Special Notes and Gotchas
1. **Type Versioning**:
   - Some type files have both original and updated versions
   - The application is transitioning between schema versions

2. **Component CSS**:
   - Some shared components have dedicated CSS files
   - Most use Tailwind classes but may include specialized styling

3. **Dependency Minimization**:
   - Shared components should minimize dependencies on application-specific state
   - Focus on UI presentation rather than business logic

4. **Phone Input Implementation**:
   - The PhoneInputWrapper has specific CSS requirements
   - Uses third-party library with custom configuration