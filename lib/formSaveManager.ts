import { useRegistrationStore } from './registrationStore';

/**
 * FormSaveManager - Utility to explicitly save form state to Zustand store
 * 
 * This handles saving form data at key interaction points:
 * - When adding/removing attendees
 * - When agreeing to terms & conditions
 * - When clicking Continue
 * - On a configurable auto-save interval
 */
export const formSaveManager = {
  /**
   * Save all form fields from the DOM to the Zustand store
   * Captures all current field values and ensures they are properly saved
   */
  saveAllFormFields: () => {
    if (typeof document === 'undefined') return; // Server-side check
    
    try {
      console.log('[FormSaveManager] Explicitly saving all form fields to store...');
      
      // Get active input/select/textarea elements that may have unsaved changes
      const formElements = document.querySelectorAll('input, select, textarea');
      
      // Track which attendees we've found and updated
      const updatedAttendeeIds = new Set<string>();
      
      formElements.forEach(element => {
        // Skip elements that don't have a name or attendeeId data attribute
        if (!(element instanceof HTMLElement)) return;
        
        // Try to find the attendee this field belongs to
        const attendeeElement = element.closest('[data-attendee-id]');
        if (!attendeeElement) return;
        
        const attendeeId = attendeeElement.getAttribute('data-attendee-id');
        if (!attendeeId) return;
        
        // Get field name and value
        let fieldName = '';
        let fieldValue = '';
        
        if (element instanceof HTMLInputElement) {
          // Handle different input types
          if (element.type === 'checkbox') {
            fieldName = element.name;
            fieldValue = element.checked ? 'true' : 'false';
          } else {
            fieldName = element.name;
            fieldValue = element.value;
          }
        } else if (element instanceof HTMLSelectElement) {
          fieldName = element.name;
          fieldValue = element.value;
        } else if (element instanceof HTMLTextAreaElement) {
          fieldName = element.name;
          fieldValue = element.value;
        }
        
        if (fieldName && attendeeId) {
          // Update the store with this field value
          const store = useRegistrationStore.getState();
          
          // Only process if it's a real field and we have an update function
          if (store && store.updateAttendee) {
            // Skip empty-to-empty updates to reduce noise
            const attendee = store.attendees.find(a => a.attendee_id === attendeeId);
            
            // Only update if value actually changed
            if (attendee && (attendee[fieldName as keyof typeof attendee] !== fieldValue)) {
              console.log(`[FormSaveManager] Saving field ${fieldName}=${fieldValue} for attendee ${attendeeId}`);
              store.updateAttendee(attendeeId, { [fieldName]: fieldValue });
              updatedAttendeeIds.add(attendeeId);
            }
          }
        }
      });
      
      console.log(`[FormSaveManager] Saved fields for ${updatedAttendeeIds.size} attendees`);
      
      // Special handling for contact preferences
      saveContactPreferences();
      
      return true;
    } catch (error) {
      console.error('[FormSaveManager] Error saving form fields:', error);
      return false;
    }
  },
  
  /**
   * Force blur events on all active form fields to trigger their onBlur handlers
   */
  triggerBlurEvents: () => {
    if (typeof document === 'undefined') return; // Server-side check
    
    try {
      console.log('[FormSaveManager] Triggering blur events on all active fields...');
      
      // Find active input/select/textarea elements
      const activeElement = document.activeElement;
      
      // If an input/select/textarea has focus, blur it to trigger save
      if (activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLSelectElement ||
          activeElement instanceof HTMLTextAreaElement) {
        // Trigger blur event which should save changes
        activeElement.blur();
      }
      
      return true;
    } catch (error) {
      console.error('[FormSaveManager] Error triggering blur events:', error);
      return false;
    }
  },
  
  /**
   * Save changes before navigating to the next step
   */
  saveBeforeNavigation: () => {
    formSaveManager.triggerBlurEvents();
    formSaveManager.saveAllFormFields();
    
    // Add a small delay to ensure saves complete
    return new Promise<void>(resolve => {
      setTimeout(() => {
        console.log('[FormSaveManager] Navigation save complete');
        resolve();
      }, 100);
    });
  },
  
  /**
   * Save changes when terms and conditions are agreed to
   */
  saveOnTermsAgreement: (agreed: boolean) => {
    console.log(`[FormSaveManager] Terms agreed: ${agreed}, saving form state...`);
    formSaveManager.saveAllFormFields();
    
    // Also update the agreeToTerms in the store directly
    const store = useRegistrationStore.getState();
    if (store && store.setAgreeToTerms) {
      store.setAgreeToTerms(agreed);
    }
  },
  
  /**
   * Save changes when an attendee is added or removed
   */
  saveOnAttendeeChange: () => {
    console.log('[FormSaveManager] Attendee added/removed, saving form state...');
    formSaveManager.saveAllFormFields();
  }
};

/**
 * Helper function to specifically save contact preferences which have special handling
 */
function saveContactPreferences() {
  if (typeof document === 'undefined') return; // Server-side check
  
  try {
    const store = useRegistrationStore.getState();
    if (!store || !store.updateAttendee) return;
    
    // Find all contact preference elements
    const contactPreferenceElements = document.querySelectorAll('select[name="contactPreference"]');
    
    contactPreferenceElements.forEach(element => {
      if (!(element instanceof HTMLSelectElement)) return;
      
      // Get attendee ID from closest attendee element
      const attendeeElement = element.closest('[data-attendee-id]');
      if (!attendeeElement) return;
      
      const attendeeId = attendeeElement.getAttribute('data-attendee-id');
      if (!attendeeId) return;
      
      // Get the current value
      const preferenceValue = element.value;
      
      // Check if this is different from the store
      const attendee = store.attendees.find(a => a.attendee_id === attendeeId);
      if (attendee && attendee.contactPreference !== preferenceValue) {
        console.log(`[FormSaveManager] Updating contact preference for ${attendeeId} to ${preferenceValue}`);
        
        // Clear email/phone if not "directly"
        if (preferenceValue !== "directly") {
          store.updateAttendee(attendeeId, { 
            contactPreference: preferenceValue,
            primaryEmail: '',
            primaryPhone: '' 
          });
        } else {
          store.updateAttendee(attendeeId, { contactPreference: preferenceValue });
        }
      }
    });
    
  } catch (error) {
    console.error('[FormSaveManager] Error saving contact preferences:', error);
  }
}

export default formSaveManager;