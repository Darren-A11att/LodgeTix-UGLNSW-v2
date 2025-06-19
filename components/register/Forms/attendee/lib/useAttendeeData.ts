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

  // Effect to ensure we have the most up-to-date data from localStorage 
  // This helps prevent data loss when forms are refreshed or components remount
  useEffect(() => {
    if (attendeeId && typeof window !== 'undefined' && !restorationCompleted.current.has(attendeeId)) {
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
            
            // If we found stored data and current attendee exists
            if (storedAttendee && currentAttendee) {
              console.log(`[useAttendeeData] Comparing ${attendeeId} store data with localStorage data`);
              
              // Check for key fields that might be missing in current state but present in storage
              const fieldsToRestore = [
                'grand_lodge_id', 'lodge_id', 'lodgeNameNumber', 
                'grandLodgeOrganisationId', 'lodgeOrganisationId',
                'useSameLodge', 'title', 'firstName', 'lastName', 'rank',
                'suffix', 'grandOfficerStatus', 'presentGrandOfficerRole', 'otherGrandOfficerRole',
                'primaryEmail', 'primaryPhone', 'contactPreference',
                'dietaryRequirements', 'specialNeeds'
              ];
              
              const updates: Partial<AttendeeData> = {};
              let hasUpdates = false;
              
              // Compare each field and restore if stored data has a value but current doesn't
              fieldsToRestore.forEach(field => {
                const storedValue = storedAttendee[field];
                const currentValue = currentAttendee[field as keyof typeof currentAttendee];
                
                // Restore if stored has a meaningful value and current is empty/null/undefined
                if (storedValue && 
                    storedValue !== '' && 
                    (!currentValue || currentValue === '')) {
                  updates[field as keyof AttendeeData] = storedValue;
                  hasUpdates = true;
                  console.log(`[useAttendeeData] Restoring ${field}: ${storedValue} for attendee ${attendeeId}`);
                }
              });
              
              // Apply updates if we found any missing data
              if (hasUpdates && updateAttendee) {
                console.log(`[useAttendeeData] Restoring ${Object.keys(updates).length} fields from localStorage for attendee ${attendeeId}`);
                updateAttendee(attendeeId, updates);
                
                // Mark this attendee as having completed restoration
                restorationCompleted.current.add(attendeeId);
              } else {
                // Even if no updates needed, mark as completed to avoid future checks
                restorationCompleted.current.add(attendeeId);
              }
            }
          }
        }
      } catch (err) {
        console.error('[useAttendeeData] Error ensuring up-to-date data:', err);
      }
    }
  }, [attendeeId, attendees, updateAttendee]);

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