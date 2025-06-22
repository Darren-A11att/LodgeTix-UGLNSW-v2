import { useCallback, useMemo, useEffect, useRef } from 'react';
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

  // Track if we've already restored data for this attendee to prevent infinite loops
  const restorationCompleted = useRef<Set<string>>(new Set());

  // Effect to ensure attendee data is synced
  // The Zustand store handles persistence with encryption, so we don't need to read localStorage directly
  useEffect(() => {
    if (attendeeId && !restorationCompleted.current.has(attendeeId)) {
      // The attendee data is already available through the Zustand store's attendees array
      // which handles encryption/decryption automatically
      const currentAttendee = attendees.find(a => a.attendeeId === attendeeId);
      
      if (currentAttendee) {
        // Mark this attendee as processed to avoid redundant checks
        restorationCompleted.current.add(attendeeId);
        
        // Log that we found the attendee (for debugging)
        console.log(`[useAttendeeData] Attendee ${attendeeId} found in store with ${Object.keys(currentAttendee).length} fields`);
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
  // Use leading: true only to update immediately without double updates
  // This prevents data loss while avoiding duplicate saves
  const debouncedUpdateField = useDebouncedCallback(
    updateField, 
    delay,
    { 
      leading: true,  // Update immediately on first call
      trailing: false, // Don't update again after delay to prevent double updates
      maxWait: delay * 2 // Ensure update happens within reasonable time
    }
  );
  
  const debouncedUpdateMultipleFields = useDebouncedCallback(
    updateMultipleFields, 
    delay,
    { 
      leading: true,
      trailing: false, // Prevent double updates
      maxWait: delay * 2
    }
  );
  
  return {
    ...rest,
    updateField: debouncedUpdateField,
    updateMultipleFields: debouncedUpdateMultipleFields,
    // Also provide immediate versions for cases where we need to avoid debounce
    updateFieldImmediate: updateField,
    updateMultipleFieldsImmediate: updateMultipleFields,
  };
};