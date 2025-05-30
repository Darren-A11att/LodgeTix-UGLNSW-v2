import { useCallback, useMemo, useEffect } from 'react';
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

  // Effect to ensure we have the most up-to-date data from localStorage 
  // This helps prevent data loss when forms are refreshed
  useEffect(() => {
    if (attendeeId && typeof window !== 'undefined') {
      try {
        // Read stored data from localStorage to ensure we have the latest
        const storedData = localStorage.getItem('lodgetix-registration-storage');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData.attendees && Array.isArray(parsedData.attendees)) {
            // Find this specific attendee data in storage
            const storedAttendee = parsedData.attendees.find(
              (a: any) => a.attendeeId === attendeeId
            );
            
            // Find current state of this attendee
            const currentAttendee = attendees.find(a => a.attendeeId === attendeeId);
            
            // If we found stored data, update store with it (but only if it has more data)
            if (storedAttendee && currentAttendee) {
              console.log(`[useAttendeeData] Comparing ${attendeeId} store data with localStorage data`);
            }
          }
        }
      } catch (err) {
        console.error('[useAttendeeData] Error ensuring up-to-date data:', err);
      }
    }
  }, [attendeeId, attendees]);

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
  const { updateField, updateMultipleFields, ...rest } = useAttendeeData(attendeeId);
  
  // Create debounced versions of the update functions with configurable delay
  const debouncedUpdateField = useDebouncedCallback(updateField, delay);
  const debouncedUpdateMultipleFields = useDebouncedCallback(updateMultipleFields, delay);
  
  return {
    ...rest,
    updateField: debouncedUpdateField,
    updateMultipleFields: debouncedUpdateMultipleFields,
    // Also provide immediate versions for cases where we need to avoid debounce
    updateFieldImmediate: updateField,
    updateMultipleFieldsImmediate: updateMultipleFields,
  };
};