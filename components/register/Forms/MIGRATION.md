# Migration Guide: Old Forms to New Architecture

This guide helps migrate from the old forms system to the new architecture.

## Import Changes

### Form Components
```typescript
// Old
import { MasonForm } from '@/components/register/oldforms/mason/MasonForm';
// New
import { MasonForm } from '@/components/register/Forms/mason/Layouts/MasonForm';

// Old
import { GuestForm } from '@/components/register/oldforms/guest/GuestForm';
// New  
import { GuestForm } from '@/components/register/Forms/guest/Layouts/GuestForm';
```

### Shared Components
```typescript
// Old
import { AutocompleteInput } from '@/components/register/oldforms/Functions/AutocompleteInput';
// New
import { AutocompleteInput } from '@/components/register/Forms/shared/AutocompleteInput';
```

### Form Sections
```typescript
// Old (separate components)
import { MasonBasicInfo } from '@/components/register/oldforms/mason/MasonBasicInfo';
import { GuestBasicInfo } from '@/components/register/oldforms/guest/GuestBasicInfo';

// New (unified component)
import { BasicInfo } from '@/components/register/Forms/basic-details/BasicInfo';
// Use with type prop:
<BasicInfo type="Mason" ... />
<BasicInfo type="Guest" ... />
```

## API Changes

### Partner Management
```typescript
// Old
addLadyPartnerAttendee(masonId);
addGuestPartnerAttendee(guestId);

// New
addPartnerAttendee(attendeeId); // Works for any attendee type
```

### Form Props
```typescript
// Old
<MasonForm 
  mason={masonData}
  updateMason={updateFunction}
  errors={errors}
/>

// New
<MasonForm
  attendeeId={attendeeId}
  attendeeNumber={1}
  isPrimary={true}
/>
```

## New Features

1. **Unified Partner System**: Partners are always Guests regardless of parent type
2. **Better Validation**: Centralized validation with clear error messages
3. **Type Safety**: Full TypeScript support with proper interfaces
4. **Reusable Sections**: Form sections work across attendee types
5. **Performance**: Debounced updates and optimized re-renders

## Common Patterns

### Using Hooks
```typescript
// Access attendee data
const { attendee, updateField } = useAttendeeData(attendeeId);

// Manage partners
const { partner, togglePartner } = usePartnerManager(attendeeId);

// Form validation
const { errors, validateForm } = useFormValidation(attendeeId);
```

### Container Usage
```typescript
// Old: Separate components for attendee with partner
<MasonWithPartner ... />
<GuestWithPartner ... />

// New: Single container that handles all types
<AttendeeWithPartner
  attendeeId={attendeeId}
  allowPartner={true}
/>
```

## Migration Steps

1. **Update Imports**: Run the migration script
   ```bash
   npx ts-node scripts/migrate-form-imports.ts
   ```

2. **Update Component Usage**: Replace old form components with new ones

3. **Update State Management**: Use new hooks instead of prop drilling

4. **Test Thoroughly**: Ensure all functionality works as expected

## Troubleshooting

### Common Issues

1. **Missing Imports**
   - Run: `npm run migrate:imports`
   - Check for old import paths

2. **Type Errors**
   - Ensure using new `AttendeeData` interface
   - Update prop types to match new components

3. **State Updates**
   - Use `updateField` from hooks instead of direct updates
   - Ensure proper attendee ID is passed

### Breaking Changes

1. Partners are always Guest type (no more `LadyPartnerForm`)
2. Form components use attendeeId instead of data props
3. Validation is centralized (no more per-component validation)
4. Contact preference values are normalized

### Getting Help

- Check `components/register/Forms/README.md`
- Review component JSDoc comments
- See example implementations in wizard steps

## Example Migration

### Before
```typescript
import { MasonForm } from '@/components/register/oldforms/mason/MasonForm';
import { LadyPartnerForm } from '@/components/register/oldforms/mason/LadyPartnerForm';

<MasonForm
  mason={masonData}
  updateMason={(updates) => updateAttendee(masonId, updates)}
  errors={validationErrors}
/>
{hasPartner && (
  <LadyPartnerForm
    partner={partnerData}
    updatePartner={(updates) => updatePartner(partnerId, updates)}
  />
)}
```

### After
```typescript
import { AttendeeWithPartner } from '@/components/register/Forms/attendee/AttendeeWithPartner';

<AttendeeWithPartner
  attendeeId={masonId}
  attendeeNumber={1}
  isPrimary={true}
  allowPartner={true}
/>
```

The new architecture handles all the partner logic internally!