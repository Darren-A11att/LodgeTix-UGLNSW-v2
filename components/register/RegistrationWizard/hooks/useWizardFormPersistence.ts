import { useState, useEffect, useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';

interface SavedState {
  attendees: any[];
  timestamp: number;
}

export const useWizardFormPersistence = () => {
  const { currentStep, attendees } = useRegistrationStore();
  const [savedState, setSavedState] = useState<SavedState | null>(null);

  // Save state when leaving attendee details step
  useEffect(() => {
    if (currentStep !== 'attendeeDetails' && currentStep !== 2 && attendees.length > 0) {
      setSavedState({
        attendees: [...attendees],
        timestamp: Date.now(),
      });
    }
  }, [currentStep, attendees]);

  // Restore state when returning to attendee details
  const restoreState = useCallback(() => {
    if (savedState && (currentStep === 'attendeeDetails' || currentStep === 2)) {
      // Implement state restoration logic
      console.log('Restoring attendee state:', savedState);
      // You could call a store method to restore attendees here
      // For example: useRegistrationStore.getState().restoreAttendees(savedState.attendees);
    }
  }, [savedState, currentStep]);

  return { savedState, restoreState };
};