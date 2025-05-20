# Task 005: Create usePartnerManager Hook

## Objective
Create the `usePartnerManager` hook for managing partner relationships between attendees.

## Dependencies
- Task 004 (useAttendeeData hook)

## Reference Files
- `components/register/forms/mason/MasonWithPartner.tsx`
- `components/register/forms/guest/GuestWithPartner.tsx`
- `lib/registrationStore.ts`

## Steps

1. Create `components/register/forms/attendee/lib/usePartnerManager.ts`:
```typescript
import { useCallback, useMemo } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { AttendeeData } from '../types';
import { useShallow } from 'zustand/react/shallow';

export const usePartnerManager = (attendeeId: string) => {
  const { 
    attendees, 
    addPartnerAttendee, 
    removeAttendee,
    updateAttendee
  } = useRegistrationStore(
    useShallow((state) => ({
      attendees: state.attendees,
      addPartnerAttendee: state.addPartnerAttendee,
      removeAttendee: state.removeAttendee,
      updateAttendee: state.updateAttendee,
    }))
  );

  const attendee = useMemo(
    () => attendees.find((a) => a.attendeeId === attendeeId),
    [attendees, attendeeId]
  );

  const partner = useMemo(() => {
    if (!attendee?.partner) return null;
    return attendees.find((a) => a.attendeeId === attendee.partner);
  }, [attendees, attendee]);

  const hasPartner = !!attendee?.partner;

  const togglePartner = useCallback(() => {
    if (partner) {
      // Remove partner
      removeAttendee(partner.attendeeId);
      updateAttendee(attendeeId, { partner: null });
    } else {
      // Add partner
      const newPartnerId = addPartnerAttendee(attendeeId);
      updateAttendee(attendeeId, { partner: newPartnerId });
    }
  }, [partner, attendeeId, addPartnerAttendee, removeAttendee, updateAttendee]);

  const updatePartnerRelationship = useCallback(
    (relationship: AttendeeData['relationship']) => {
      if (partner) {
        updateAttendee(partner.attendeeId, { relationship });
      }
    },
    [partner, updateAttendee]
  );

  return {
    attendee,
    partner,
    hasPartner,
    togglePartner,
    updatePartnerRelationship,
  };
};
```

2. Add partner data copying functionality:
```typescript
export const usePartnerDataSync = (attendeeId: string) => {
  const { attendee, partner } = usePartnerManager(attendeeId);
  const { updateField } = useAttendeeData(partner?.attendeeId || '');

  const syncPartnerData = useCallback(
    (fields: string[]) => {
      if (!attendee || !partner) return;
      
      const updates: Partial<AttendeeData> = {};
      fields.forEach(field => {
        updates[field] = attendee[field];
      });
      
      updateField('', updates);
    },
    [attendee, partner, updateField]
  );

  return { syncPartnerData };
};
```

## Deliverables
- Partner management hook
- Partner data synchronization utilities
- Type-safe partner operations

## Success Criteria
- Partner relationships properly managed
- Bidirectional relationship updates work
- Data sync functions as expected
- No orphaned partner records