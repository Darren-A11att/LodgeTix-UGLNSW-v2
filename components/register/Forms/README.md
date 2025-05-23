# Registration Forms Architecture

This directory contains the refactored registration forms system for LodgeTix. The architecture follows a component-based approach with clear separation of concerns.

## Architecture Overview

```
Forms/
├── attendee/           # Core attendee logic and containers
├── basic-details/      # Shared form sections
├── guest/             # Guest-specific components
├── mason/             # Mason-specific components
└── shared/            # Shared UI components
```

## Key Concepts

### 1. Attendee Types
- **Mason**: Lodge members with additional fields (rank, lodge info)
- **Guest**: Non-mason attendees with basic information

### 2. Component Hierarchy
1. **Container Layouts**: Orchestrate form composition (`AttendeeWithPartner`)
2. **Form Layouts**: Type-specific forms (`MasonForm`, `GuestForm`)
3. **Form Sections**: Reusable field groups (`BasicInfo`, `ContactInfo`)
4. **Field Components**: Individual form fields

### 3. State Management
- Global state: Zustand store (`registrationStore`)
- Local state: React hooks for UI behavior
- Form state: Managed through custom hooks

## Usage Examples

### Basic Mason Registration
```typescript
import { MasonForm } from '@/components/register/Forms/mason/Layouts/MasonForm';

<MasonForm
  attendeeId="mason-123"
  attendeeNumber={1}
  isPrimary={true}
/>
```

### Attendee with Partner
```typescript
import { AttendeeWithPartner } from '@/components/register/Forms/attendee/AttendeeWithPartner';

<AttendeeWithPartner
  attendeeId="attendee-123"
  attendeeNumber={1}
  isPrimary={true}
  allowPartner={true}
/>
```

## Development Guide

### Adding a New Attendee Type
1. Create type-specific directory under `Forms/`
2. Implement form layout component
3. Add type to `AttendeeData` interface
4. Update `attendeeTypeRenderer` utility

### Creating Form Sections
1. Add component to `basic-details/` or type-specific directory
2. Implement `SectionProps` interface
3. Handle validation and field updates
4. Export from appropriate index file

### Business Logic
All business logic should be placed in:
- `attendee/utils/businessLogic.ts` - Form behavior rules
- `attendee/utils/validation.ts` - Field validation
- `attendee/utils/constants.ts` - Domain constants

## Testing

Run tests:
```bash
npm run test:forms
```

Test coverage:
```bash
npm run test:coverage -- components/register/Forms
```

## Migration from Old Forms

The old forms have been removed and replaced with this new architecture. 

Key improvements:
- Better separation of concerns
- Improved type safety
- Reusable components
- Centralized business logic

Old forms backup: `oldforms-backup-20241119.tar.gz`

## Architecture Principles

1. **Composition over Inheritance**: Build complex forms from simple, reusable sections
2. **Type Safety**: Use TypeScript interfaces to ensure data consistency
3. **Single Responsibility**: Each component has one clear purpose
4. **Layout Separation**: Forms handle data, layouts handle composition and display
5. **Responsive Design**: Different layouts for different screen sizes
6. **Relationship Management**: Clear FK relationships between attendees and partners

## File Organization

### Core Types
`attendee/types.ts` - Contains the primary `AttendeeData` interface

### Hooks
- `useAttendeeData` - Attendee state management
- `usePartnerManager` - Partner relationship management
- `usePersistence` - Draft persistence

### Utils
- `validation.ts` - Field and form validation rules
- `businessLogic.ts` - Business rules and field interactions
- `constants.ts` - Domain constants (titles, ranks, etc.)
- `formatters.ts` - Data formatting functions

### Components
- Basic sections in `basic-details/`
- Type-specific forms in `mason/` and `guest/`
- Shared components in `shared/`