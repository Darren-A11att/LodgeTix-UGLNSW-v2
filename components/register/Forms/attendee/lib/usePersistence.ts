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

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [storageKey]);

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
  }, [storageKey, clearDraft]);

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

// Session storage variant for sensitive data
export const useSessionPersistence = (attendeeId: string, autoSave = true) => {
  const { attendee, updateMultipleFields } = useAttendeeData(attendeeId);
  const storageKey = `${STORAGE_PREFIX}session_${attendeeId}`;

  // Save draft to sessionStorage
  const saveDraft = useCallback(() => {
    if (!attendee) return;
    
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        data: attendee,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to save session draft:', error);
    }
  }, [attendee, storageKey]);

  // Load draft from sessionStorage
  const loadDraft = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return null;
      
      const { data } = JSON.parse(saved);
      return data as AttendeeData;
    } catch (error) {
      console.error('Failed to load session draft:', error);
      return null;
    }
  }, [storageKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear session draft:', error);
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