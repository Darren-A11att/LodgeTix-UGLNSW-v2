# Task 004: Create useAttendeeData Hook

## Objective
Create the core `useAttendeeData` hook for managing attendee data interactions with the Zustand store.

## Dependencies
- Task 003 (type definitions)

## Reference Files
- `components/register/oldforms/mason/MasonForm.tsx` (for store interaction patterns)
- `lib/registrationStore.ts` (for store interface)

## Steps

1. Create `components/register/forms/attendee/lib/useAttendeeData.ts`:
```typescript
import { useCallback, useMemo } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { AttendeeData } from '../types';
import { useShallow } from 'zustand/react/shallow';

export const useAttendeeData = (attendeeId: string) => {
  const { attendees, updateAttendee, removeAttendee } = useRegistrationStore(
    useShallow((state) => ({
      attendees: state.attendees,
      updateAttendee: state.updateAttendee,
      removeAttendee: state.removeAttendee,
    }))
  );

  const attendee = useMemo(
    () => attendees.find((a) => a.attendeeId === attendeeId),
    [attendees, attendeeId]
  );

  const updateField = useCallback(
    (field: string, value: any) => {
      updateAttendee(attendeeId, { [field]: value });
    },
    [attendeeId, updateAttendee]
  );

  const updateMultipleFields = useCallback(
    (updates: Partial<AttendeeData>) => {
      updateAttendee(attendeeId, updates);
    },
    [attendeeId, updateAttendee]
  );

  const deleteAttendee = useCallback(() => {
    removeAttendee(attendeeId);
  }, [attendeeId, removeAttendee]);

  return {
    attendee,
    updateField,
    updateMultipleFields,
    deleteAttendee,
  };
};
```

2. Add debounced update functionality:
```typescript
import { useDebouncedCallback } from 'use-debounce';

export const useAttendeeDataWithDebounce = (attendeeId: string, delay = 300) => {
  const { updateField, ...rest } = useAttendeeData(attendeeId);
  
  const debouncedUpdateField = useDebouncedCallback(updateField, delay);
  
  return {
    ...rest,
    updateField: debouncedUpdateField,
    updateFieldImmediate: updateField,
  };
};
```

## Deliverables
- Core attendee data hook
- Debounced version for form inputs
- Type-safe store interactions

## Success Criteria
- Hook properly connects to Zustand store
- Updates are properly typed
- Debouncing works as expected
- No performance issues