import { useCallback, useMemo } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { AttendeeData } from '../types';
import { useShallow } from 'zustand/react/shallow';
import { useDebouncedCallback } from 'use-debounce';

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

// Debounced version for form inputs
export const useAttendeeDataWithDebounce = (attendeeId: string, delay = 300) => {
  const { updateField, ...rest } = useAttendeeData(attendeeId);
  
  const debouncedUpdateField = useDebouncedCallback(updateField, delay);
  
  return {
    ...rest,
    updateField: debouncedUpdateField,
    updateFieldImmediate: updateField,
  };
};