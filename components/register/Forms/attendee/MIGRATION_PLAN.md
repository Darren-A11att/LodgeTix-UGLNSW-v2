# Component Migration Plan

## Overview
The LodgesForm component has rebuilt several existing components with improved implementations. This document outlines the migration strategy to replace existing components with our new refactored versions.

## New Components Created

### 1. BookingContactSection
- **Location**: `/components/register/Forms/attendee/components/BookingContactSection.tsx`
- **Purpose**: Wrapper component that displays primary contact information using existing BasicInfo and ContactInfo components
- **Improvements**: Provides a clean section header and layout while reusing existing form components
- **Note**: This now properly reuses BasicInfo and ContactInfo instead of recreating fields

### 2. LodgeMemberRow
- **Location**: `/components/register/Forms/attendee/components/LodgeMemberRow.tsx`
- **Purpose**: Table row component for displaying lodge member information
- **Improvements**: Cleaner action buttons, visual hierarchy for partners, better type safety

### 3. AttendeeCounter
- **Location**: `/components/register/Forms/attendee/components/AttendeeCounter.tsx`
- **Purpose**: Number input with increment/decrement buttons
- **Improvements**: Better UX with disabled states, input validation, clean styling

### 4. LodgeSelectionCard
- **Location**: `/components/register/Forms/attendee/components/LodgeSelectionCard.tsx`
- **Purpose**: Card component for Grand Lodge and Lodge selection
- **Improvements**: Better visual design, validation messages, responsive layout

### 5. EditAttendeeDialog
- **Location**: `/components/register/Forms/attendee/components/EditAttendeeDialog.tsx`
- **Purpose**: Dialog for editing attendee details
- **Note**: This is separate from the existing `AttendeeEditModal` to avoid breaking dependencies

## Migration Strategy

### Phase 1: Parallel Implementation (Current)
- ✅ Extract components from LodgesForm
- ✅ Create LodgesFormRefactored using new components
- ✅ Keep existing AttendeeEditModal for backward compatibility

### Phase 2: Testing & Validation
- [ ] Test LodgesFormRefactored in development
- [ ] Verify all functionality matches original
- [ ] Test edge cases and error states
- [ ] Verify responsive behavior

### Phase 3: Gradual Adoption
1. **Replace LodgesForm imports**:
   ```tsx
   // Old
   import { LodgesForm } from './LodgesForm';
   
   // New
   import { LodgesFormRefactored as LodgesForm } from './LodgesFormRefactored';
   ```

2. **Identify other components that could benefit**:
   - IndividualsForm could use BookingContactSection
   - DelegationsForm could use similar table structure
   - Any form needing counters could use AttendeeCounter

### Phase 4: Component Consolidation
1. **AttendeeEditModal → EditAttendeeDialog**:
   - Current dependency: `/components/register/RegistrationWizard/Steps/order-review-step.tsx`
   - Migration approach:
     ```tsx
     // Create adapter or update imports
     import { EditAttendeeDialog as AttendeeEditModal } from '@/components/register/Forms/attendee/components';
     ```

2. **Extract more shared patterns**:
   - Member tables across different registration types
   - Attendee count selection UI
   - Lodge/organization selection patterns

### Phase 5: Cleanup
- [ ] Remove old LodgesForm.tsx once all references updated
- [ ] Remove duplicate component implementations
- [ ] Update documentation

## Benefits of Migration

1. **Better Code Organization**: Components are properly separated by concern
2. **Improved Reusability**: Components can be used across different forms
3. **Better Type Safety**: Cleaner interfaces and prop types
4. **Improved Performance**: Debounced updates and optimized renders
5. **Better UX**: Consistent styling and interactions

## Risk Mitigation

1. **Keep Both Versions**: Maintain both old and new versions during transition
2. **Feature Flags**: Could use feature flags to toggle between implementations
3. **Incremental Migration**: Migrate one form at a time
4. **Comprehensive Testing**: Test each migration thoroughly

## Lessons Learned

1. **Always check for existing components first** - Before recreating functionality, verify if components like BasicInfo, ContactInfo, etc. already exist
2. **Reuse imports and constants** - Use existing constants like MASON_TITLES, MASON_RANKS from the constants file
3. **Compose rather than recreate** - The BookingContactSection should compose existing components rather than recreating fields
4. **Follow established patterns** - Use the same prop interfaces and patterns as existing components

## Next Steps

1. Get approval for migration strategy
2. Set up testing environment
3. Begin Phase 2 testing
4. Create tickets for each migration phase
5. Document any API changes needed
6. Review other forms for similar refactoring opportunities

## Component Usage Examples

### Using BookingContactSection
```tsx
<BookingContactSection
  attendee={primaryAttendee}
  onFieldChange={(attendeeId, field, value) => updateAttendee(attendeeId, { [field]: value })}
  disabled={!hasRequiredData}
/>
```

### Using AttendeeCounter
```tsx
<AttendeeCounter
  id="guest-count"
  label="Number of Guests"
  value={guestCount}
  min={0}
  max={10}
  onChange={setGuestCount}
/>
```

### Using LodgeSelectionCard
```tsx
<LodgeSelectionCard
  selectedGrandLodge={grandLodgeId}
  selectedLodge={lodgeId}
  onGrandLodgeChange={handleGrandLodgeChange}
  onLodgeChange={handleLodgeChange}
/>
```