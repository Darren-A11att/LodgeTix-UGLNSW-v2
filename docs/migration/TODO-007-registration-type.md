# TODO-007: Registration Type Selection Migration

## Overview
Update registration type selection to work with new simplified flow and contact model.

## Current Implementation
- **Location**: `/components/register/RegistrationWizard/Steps/registration-type-step.tsx`
- **Features**:
  - Individual/Lodge/Delegation selection
  - Complex state initialization
  - Multiple form variations

## New Schema Changes
- **Simplifications**:
  - Clearer type definitions
  - Unified contact model
  - Simpler state management

## Migration Tasks
- [ ] Update registration type definitions
- [ ] Simplify initial state creation
- [ ] Update type selection logic
- [ ] Remove redundant type variations
- [ ] Update help text and descriptions

## Type Definitions
```typescript
// Old: Complex types
type RegistrationType = 'individuals' | 'groups' | 'officials' | 'lodge' | 'delegation'

// New: Simplified types
type RegistrationType = 'individual' | 'lodge' | 'delegation'
```

## State Initialization
```typescript
// Old: Complex initialization
const initializeAttendees = (type: string) => {
  // Complex logic for different types
}

// New: Simplified
const initializeContacts = (type: RegistrationType, count: number = 1) => {
  return Array(count).fill(null).map(() => ({
    contact_type: 'mason',
    is_primary: false
  }))
}
```

## UI Updates
- [ ] Simplify type cards
- [ ] Update descriptions
- [ ] Remove obsolete options
- [ ] Improve visual hierarchy
- [ ] Add better helper text

## Component Changes
- [ ] Update type selection cards
- [ ] Simplify state management
- [ ] Remove complex branching
- [ ] Update navigation logic
- [ ] Improve accessibility

## Testing Requirements
- [ ] Test all registration types
- [ ] Test state persistence
- [ ] Test navigation flow
- [ ] Test back/forward behavior
- [ ] Test responsive design