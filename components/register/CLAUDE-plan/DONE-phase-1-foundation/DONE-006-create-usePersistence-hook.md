# Task 006: Create usePersistence Hook

## Objective
Create the `usePersistence` hook for draft form data persistence and recovery.

## Dependencies
- Task 004 (useAttendeeData hook)

## Reference Files
- Look for any existing draft/persistence logic in old forms

## Steps

1. Create `components/register/forms/attendee/lib/usePersistence.ts`:
```typescript
import { useCallback, useEffect } from 'react';
import { AttendeeData } from '../types';
import { useAttendeeData } from './useAttendeeData';

const STORAGE_PREFIX = 'lodgetix_form_draft_';

export const usePersistence = (attendeeId: string, autoSave = true) => {
  const { attendee, updateMultipleFields } = useAttendeeData(attendeeId);
  const storageKey = `${STORAGE_PREFIX}${attendeeId}`;

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    if (!attendee) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        data: attendee,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [attendee, storageKey]);

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;
      
      const { data, timestamp } = JSON.parse(saved);
      
      // Check if draft is less than 24 hours old
      const dayInMs = 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > dayInMs) {
        clearDraft();
        return null;
      }
      
      return data as AttendeeData;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [storageKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [storageKey]);

  // Restore draft data
  const restoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      updateMultipleFields(draft);
      return true;
    }
    return false;
  }, [loadDraft, updateMultipleFields]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !attendee) return;

    const timeoutId = setTimeout(() => {
      saveDraft();
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [attendee, autoSave, saveDraft]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    restoreDraft,
    hasDraft: !!loadDraft(),
  };
};
```

2. Create session storage variant for sensitive data:
```typescript
export const useSessionPersistence = (attendeeId: string) => {
  // Similar implementation but using sessionStorage
  // for data that shouldn't persist between browser sessions
};
```

## Deliverables
- Draft persistence hook with localStorage
- Session persistence variant
- Auto-save functionality
- Draft expiration logic

## Success Criteria
- Drafts are saved automatically
- Drafts can be restored on page reload
- Old drafts are cleaned up
- Sensitive data uses session storage